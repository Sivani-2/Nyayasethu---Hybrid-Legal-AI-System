"""
predictor_service.py  ─  services/  ─  backend
=================================================
Perspective-aware, rule-prioritised legal case predictor.
XGBoost (classifier) is the primary decision engine.
RF Regressor adds a calibration signal.
Rule overrides handle legally-deterministic patterns.
"""
 
import warnings
warnings.filterwarnings("ignore")
 
import numpy as np
import pandas as pd
import joblib
from huggingface_hub import hf_hub_download
from sentence_transformers import SentenceTransformer
 
# ═══════════════════════════════════════════════════════════
# 1.  MODEL LOADING
# ═══════════════════════════════════════════════════════════
REPO_ID = "Shyam-duba/legal-case-predictor"
 
print("Loading predictor models from HuggingFace …")
 
clf           = joblib.load(hf_hub_download(repo_id=REPO_ID, filename="xgb_classifier.pkl"))
reg           = joblib.load(hf_hub_download(repo_id=REPO_ID, filename="rf_regressor.pkl"))
label_encoder = joblib.load(hf_hub_download(repo_id=REPO_ID, filename="label_encoder.pkl"))
cat_columns   = joblib.load(hf_hub_download(repo_id=REPO_ID, filename="cat_columns.pkl"))
 
embed_model = SentenceTransformer("all-MiniLM-L6-v2")
 
print("✅ All models loaded successfully!")
 
# ═══════════════════════════════════════════════════════════
# 2.  CANONICAL CLASS ORDER
#     label_encoder.classes_ must match clf output indices.
#     Fallback order assumed: [Lost, Partially Allowed, Won]
# ═══════════════════════════════════════════════════════════
try:
    CLASSES: list = list(label_encoder.classes_)
except Exception:
    CLASSES = ["Lost", "Partially Allowed", "Won"]
 
 
# ═══════════════════════════════════════════════════════════
# 3.  RULE DEFINITIONS
#     priority 1 = hardest override (applied first)
#     Each rule may set a prob_cap  (ceiling)
#                         or prob_floor (floor)
# ═══════════════════════════════════════════════════════════
RULES = [
 
    # ── PRIORITY 1 : Absolute procedural bars ───────────────
    {
        "label":    "jurisdiction_rejected",
        "keywords": [
            "wrong jurisdiction", "filed in wrong court",
            "no jurisdiction", "not maintainable",
            "locus standi", "court has no power", "ultra vires",
        ],
        "decision": "Lost",
        "prob_cap": 0.22,
        "priority": 1,
    },
    {
        "label":    "time_barred",
        "keywords": [
            "long delay", "filed after delay", "time barred",
            "limitation period", "statute of limitations",
            "barred by limitation",
        ],
        "decision": "Lost",
        "prob_cap": 0.28,
        "priority": 1,
    },
 
    # ── PRIORITY 2 : Constitutionally/legally weak ──────────
    {
        "label":    "constitutional_grounds_insufficient",
        "keywords": [
            "without sufficient constitutional",
            "no constitutional grounds",
            "insufficient constitutional grounds",
            "no supporting precedent",
            "without precedent",
            "no legal basis",
            "no prima facie case",
            "without merit",
            "frivolous petition",
            "challenges existing law without",
            "insufficient grounds",
        ],
        "decision": "Lost",
        "prob_cap": 0.30,
        "priority": 2,
    },
    {
        "label":    "govt_policy_upheld",
        "keywords": [
            "supported by law", "supported by precedent",
            "government policy valid", "state action upheld",
            "statutory backing", "policy valid", "court finds policy valid",
        ],
        "decision": "Lost",
        "prob_cap": 0.38,
        "priority": 2,
    },
 
    # ── PRIORITY 3 : Evidence weakness ──────────────────────
    {
        "label":    "no_evidence",
        "keywords": [
            "no proof", "no evidence", "without proof",
            "without documents", "weak defense", "no witness",
            "lack of evidence", "insufficient evidence",
            "unsubstantiated", "bare allegation",
            "defendant failed to provide",
            "failed to present evidence",
            "failed to provide any legal documents",
        ],
        "decision": "Lost",
        "prob_cap": 0.35,
        "priority": 3,
    },
 
    # ── PRIORITY 4 : Contradictory / mixed evidence ─────────
    {
        "label":    "contradictory_evidence",
        "keywords": [
            "forged signatures", "fake documents", "doubtful evidence",
            "contradictory statements", "improper investigation",
            "conflicting testimony", "disputed documents",
            "partial evidence", "minor procedural issues",
            "but court finds", "unfair implementation",
        ],
        "decision": "Partially Allowed",
        "prob_cap": 0.62,
        "priority": 4,
    },
    {
        "label":    "partial_language",
        "keywords": [
            "partial relief", "in part", "partially granted",
            "reduce", "lesser relief",
        ],
        "decision": "Partially Allowed",
        "prob_cap": 0.62,
        "priority": 4,
    },
 
    # ── PRIORITY 5 : Strong prosecution (criminal) ──────────
    {
        "label":    "caught_red_handed",
        "keywords": [
            "caught red-handed", "caught redhanded",
            "caught red handed", "confesses",
            "confessed during interrogation",
            "forensic evidence supports prosecution",
            "guilty plea",
        ],
        "decision": "Lost",       # plaintiff/prosecution wins → accused loses
        "prob_cap": 0.20,
        "priority": 5,
    },
 
    # ── PRIORITY 6 : Strong defence (criminal / civil) ──────
    {
        "label":    "strong_defence_alibi",
        "keywords": [
            "proves innocence", "proving innocence",
            "confirmed alibi", "alibi confirmed",
            "alibi evidence",
            "cctv footage", "cctv confirms",
            "call records", "multiple eyewitnesses",
            "eyewitnesses confirm",
        ],
        "decision": "Won",
        "prob_floor": 0.78,
        "priority": 6,
    },
    {
        "label":    "strong_documentary_evidence",
        "keywords": [
            "registered sale deed",
            "registered documents",
            "tax receipts",
            "survey records",
            "strong evidence",
            "legal proof",
            "bank statement",
            "complaint records",
            "witness statements",
            "constitutional backing",
            "clear proof",
            "documentary evidence",
            "forensic evidence",
            "medical records",
            "digital evidence",
            "court precedent",
        ],
        "decision": "Won",
        "prob_floor": 0.72,
        "priority": 6,
    },
]
 
 
# ═══════════════════════════════════════════════════════════
# 4.  PERSPECTIVE HELPERS
#     All internal logic uses Plaintiff frame:
#       "Won"  = plaintiff wins
#       "Lost" = plaintiff loses
#     When perspective == "accused" we flip Won <-> Lost.
# ═══════════════════════════════════════════════════════════
def _flip_for_accused(decision):
    return {"Won": "Lost", "Lost": "Won"}.get(decision, decision)
 
 
def _detect_perspective(case_description):
    """Heuristic: infer whose perspective the description is written from."""
    text = case_description.lower()
    accused_signals = [
        "accused", "defendant", "respondent",
        "caught red", "confess", "bail", "acquit",
        "proves innocence", "alibi", "arrested",
    ]
    plaintiff_signals = [
        "petitioner", "plaintiff", "complainant",
        "filed a case", "filed complaint", "challenges",
    ]
    a_score = sum(1 for s in accused_signals   if s in text)
    p_score = sum(1 for s in plaintiff_signals if s in text)
    return "accused" if a_score > p_score else "plaintiff"
 
 
# ═══════════════════════════════════════════════════════════
# 5.  RULE ENGINE
# ═══════════════════════════════════════════════════════════
def _apply_rules(text, ml_decision, ml_prob):
    """
    Returns (decision, probability, matched_rule_label | None).
    Lowest priority number wins when multiple rules fire.
    """
    text_lower = text.lower()
    triggered  = [r for r in RULES if any(k in text_lower for k in r["keywords"])]
 
    if not triggered:
        return ml_decision, ml_prob, None
 
    triggered.sort(key=lambda r: r["priority"])
    winner   = triggered[0]
    decision = winner["decision"]
    prob     = ml_prob
 
    if "prob_cap"   in winner:
        prob = min(prob, winner["prob_cap"])
    if "prob_floor" in winner:
        prob = max(prob, winner["prob_floor"])
 
    return decision, round(float(prob), 4), winner["label"]
 
 
# ═══════════════════════════════════════════════════════════
# 6.  CONFIDENCE TIER
# ═══════════════════════════════════════════════════════════
def _tier(score, rule_matched):
    hi, med = (0.75, 0.55) if rule_matched else (0.80, 0.60)
    if score >= hi:
        return "High"
    if score >= med:
        return "Medium"
    return "Low"
 
 
# ═══════════════════════════════════════════════════════════
# 7.  MAIN PREDICTION FUNCTION
# ═══════════════════════════════════════════════════════════
def predict_case(
    case_description,
    court_level,
    case_category,
    perspective="auto",   # "plaintiff" | "accused" | "auto"
):
    """
    Parameters
    ----------
    case_description : full case text
    court_level      : e.g. "District Court", "Supreme Court"
    case_category    : e.g. "Civil", "Criminal", "Constitutional"
    perspective      : whose side is being reported
                       "auto" = inferred from the description
 
    Returns
    -------
    dict with keys:
        predicted_decision    : "Won" | "Partially Allowed" | "Lost"
        confidence_score      : float  (0-1)
        confidence_tier       : "High" | "Medium" | "Low"
        predicted_probability : float  (win probability for chosen perspective)
        perspective           : "plaintiff" | "accused"
        rule_applied          : str | None
        class_probabilities   : { class: float, ... }
    """
 
    # ── 7a. Feature vector ────────────────────────────────────
    desc_vec = embed_model.encode([case_description])          # (1, 384)
 
    cat_df  = pd.DataFrame(
        [[court_level, case_category]],
        columns=["Court_Level", "Case_Category"],
    )
    cat_vec = (
        pd.get_dummies(cat_df)
        .reindex(columns=cat_columns, fill_value=0)
        .values
    )
 
    X = np.hstack([desc_vec, cat_vec])                        # (1, total_features)
 
    # ── 7b. XGBoost primary classification ───────────────────
    proba    = clf.predict_proba(X)[0]
    best_idx = int(np.argmax(proba))
    xgb_conf = float(proba[best_idx])
 
    try:
        ml_decision = label_encoder.inverse_transform([best_idx])[0]
    except Exception:
        ml_decision = CLASSES[best_idx] if best_idx < len(CLASSES) else "Lost"
 
    # ── 7c. RF regression calibration ────────────────────────
    rf_prob = float(np.clip(reg.predict(X)[0], 0.0, 1.0))
 
    # 70% XGBoost class confidence + 30% RF calibration
    blended = float(np.clip(0.70 * xgb_conf + 0.30 * rf_prob, 0.0, 1.0))
 
    # ── 7d. Rule override ─────────────────────────────────────
    rule_decision, rule_prob, rule_label = _apply_rules(
        case_description, ml_decision, blended
    )
 
    # ── 7e. Perspective resolution ────────────────────────────
    if perspective == "auto":
        perspective = _detect_perspective(case_description)
 
    final_decision = rule_decision
 
    # Flip decision label if viewing from accused's side
    if perspective == "accused":
        final_decision = _flip_for_accused(final_decision)
 
    # Win probability always means "this side wins"
    if perspective == "accused":
        # accused wins when rule says "Lost" (plaintiff loses)
        win_probability = round(1.0 - rule_prob, 4) if rule_decision == "Lost" else round(rule_prob, 4)
    else:
        win_probability = round(rule_prob, 4)
 
    # ── 7f. Class probability map ─────────────────────────────
    class_prob_map = {
        cls: round(float(p), 4)
        for cls, p in zip(CLASSES, proba)
    }
 
    # ── 7g. Confidence / tier ─────────────────────────────────
    confidence_score = round(rule_prob, 4)
    tier             = _tier(confidence_score, rule_label is not None)
 
    return {
        "predicted_decision":    final_decision,
        "confidence_score":      confidence_score,
        "confidence_tier":       tier,
        "predicted_probability": win_probability,
        "perspective":           perspective,
        "rule_applied":          rule_label,
        "class_probabilities":   class_prob_map,
    }