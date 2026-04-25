 
from flask import Blueprint, request, jsonify
import traceback
 
from services.predictor_service import predict_case
 
predictor_bp = Blueprint("predictor", __name__)
 
 
@predictor_bp.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(silent=True)
 
    # ── Input validation ──────────────────────────────────────
    if not data:
        return jsonify({"error": "Request body must be valid JSON"}), 400
 
    case_description = data.get("case_description", "").strip()
    court_level      = data.get("court_level",      "").strip()
    case_category    = data.get("case_category",    "").strip()
    perspective      = data.get("perspective", "auto").strip().lower()
 
    if not case_description:
        return jsonify({"error": "case_description is required"}), 400
    if not court_level:
        return jsonify({"error": "court_level is required"}), 400
    if not case_category:
        return jsonify({"error": "case_category is required"}), 400
 
    if len(case_description) < 10:
        return jsonify({"error": "case_description is too short (min 10 chars)"}), 400
 
    if perspective not in ("plaintiff", "accused", "auto"):
        perspective = "auto"
 
    # ── Prediction ────────────────────────────────────────────
    try:
        result = predict_case(
            case_description=case_description,
            court_level=court_level,
            case_category=case_category,
            perspective=perspective,
        )
        return jsonify(result), 200
 
    except Exception as exc:
        traceback.print_exc()
        return jsonify({"error": str(exc)}), 500
 
 
# ── Health-check (optional, useful for Docker/K8s) ───────────
@predictor_bp.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200