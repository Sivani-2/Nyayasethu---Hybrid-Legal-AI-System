import React, { useState, useRef, useEffect } from 'react';
 
// ─── EXACT values your Flask backend expects ───────────────────────────────
const COURT_OPTIONS = [
  { label: 'District Court',  value: 'District Court' },
  { label: 'Sessions Court',  value: 'Sessions Court' },
  { label: 'High Court',      value: 'High Court' },
  { label: 'Supreme Court',   value: 'Supreme Court' },
  { label: 'Tribunal',        value: 'Tribunal' },
];
 
const CATEGORY_OPTIONS = [
  { label: 'Civil',           value: 'Civil' },
  { label: 'Criminal',        value: 'Criminal' },
  { label: 'Constitutional',  value: 'Constitutional' },
  { label: 'Administrative',  value: 'Administrative' },
  { label: 'Family',          value: 'Family' },
  { label: 'Property',        value: 'Property' },
];
 
// ─── Verdict config ────────────────────────────────────────────────────────
const VERDICT = {
  Won:                { icon: '✓', color: '#3ecf84', bg: 'rgba(62,207,132,0.10)', label: 'Case Won' },
  'Partially Allowed':{ icon: '~', color: '#f0a854', bg: 'rgba(240,168,84,0.10)',  label: 'Partially Allowed' },
  Lost:               { icon: '✗', color: '#e05555', bg: 'rgba(224,85,85,0.10)',   label: 'Case Lost' },
};
const TIER_COLOR = { High: '#3ecf84', Medium: '#f0a854', Low: '#e05555' };
 
// ─── Animated counter ──────────────────────────────────────────────────────
function Counter({ target, duration = 900, suffix = '%' }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setVal(Math.round(p * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return <>{val}{suffix}</>;
}
 
// ─── Arc gauge ─────────────────────────────────────────────────────────────
function ArcGauge({ value, color, size = 110 }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - value);
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
      <circle
        cx="50" cy="50" r={r} fill="none"
        stroke={color} strokeWidth="10" strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)' }}
      />
      <text x="50" y="55" textAnchor="middle"
        style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, fill: '#e8e6f0' }}>
        {Math.round(value * 100)}%
      </text>
    </svg>
  );
}
 
// ─── Probability bar ───────────────────────────────────────────────────────
function ProbBar({ label, value, color }) {
  const [width, setWidth] = useState(0);
  useEffect(() => { setTimeout(() => setWidth(value * 100), 80); }, [value]);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <div style={{ width: 130, textAlign: 'right', fontSize: 11,
        fontFamily: 'monospace', color: '#7a7d96', flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, height: 7, background: 'rgba(255,255,255,0.06)',
        borderRadius: 4, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${width}%`, background: color,
          borderRadius: 4, transition: 'width 0.9s cubic-bezier(.4,0,.2,1)'
        }} />
      </div>
      <div style={{ width: 38, fontSize: 11, fontFamily: 'monospace',
        color: '#7a7d96' }}>{Math.round(value * 100)}%</div>
    </div>
  );
}
 
// ─── Main component ────────────────────────────────────────────────────────
const Predictor = () => {
  const [form, setForm] = useState({
    case_description: '',
    court_level:      'District Court',   // ← exact backend value
    case_category:    'Civil',
  });
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [visible, setVisible] = useState(false);
  const resultRef = useRef(null);
 
  const handleChange = (field) => (e) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.case_description.trim()) return;
 
    setLoading(true);
    setResult(null);
    setError('');
    setVisible(false);
 
    try {
      // ── Send EXACT field names the backend expects ──────────────────────
      const payload = {
        case_description: form.case_description.trim(),
        court_level:      form.court_level,      // e.g. "District Court"
        case_category:    form.case_category,    // e.g. "Civil"
      };
 
      const resp = await fetch('http://localhost:5000/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
 
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.error || `Server error ${resp.status}`);
      }
 
      const data = await resp.json();
 
      // ── Validate required fields exist ─────────────────────────────────
      if (!data.predicted_decision) throw new Error('Invalid response from server.');
 
      setResult(data);
      setTimeout(() => {
        setVisible(true);
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
 
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
 
  // ── styles ──────────────────────────────────────────────────────────────
  const S = {
    page: {
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0c0e14 0%, #111420 100%)',
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      color: '#e8e6f0',
      padding: '40px 20px 80px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    },
    eyebrow: {
      fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.22em',
      color: '#c8a96e', textTransform: 'uppercase', marginBottom: 10,
      textAlign: 'center',
    },
    h1: {
      fontFamily: 'Georgia, "Playfair Display", serif',
      fontSize: 'clamp(26px, 4vw, 46px)', fontWeight: 700,
      background: 'linear-gradient(135deg, #e8e6f0 30%, #c8a96e 100%)',
      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      textAlign: 'center', lineHeight: 1.15, marginBottom: 6,
    },
    sub: {
      textAlign: 'center', color: '#7a7d96', fontSize: 13,
      fontFamily: 'monospace', letterSpacing: '0.04em', marginBottom: 40,
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
      gap: 24, width: '100%', maxWidth: 1080, alignItems: 'start',
    },
    card: {
      background: '#13151e',
      border: '1px solid #252838',
      borderRadius: 16, padding: 30, position: 'relative', overflow: 'hidden',
    },
    cardAccent: {
      position: 'absolute', top: 0, left: 0, right: 0, height: 2,
      background: 'linear-gradient(90deg, transparent, #c8a96e, transparent)',
      opacity: 0.55,
    },
    cardTitle: {
      fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.18em',
      color: '#c8a96e', textTransform: 'uppercase', marginBottom: 22,
    },
    label: {
      display: 'block', fontFamily: 'monospace', fontSize: 10,
      letterSpacing: '0.12em', color: '#7a7d96',
      textTransform: 'uppercase', marginBottom: 7,
    },
    textarea: {
      width: '100%', background: '#1a1d28', border: '1px solid #252838',
      borderRadius: 10, color: '#e8e6f0', fontFamily: 'inherit', fontSize: 13,
      lineHeight: 1.65, padding: '12px 14px', resize: 'vertical',
      minHeight: 148, outline: 'none', marginBottom: 18,
      transition: 'border-color 0.2s',
    },
    selectRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 },
    select: {
      width: '100%', background: '#1a1d28', border: '1px solid #252838',
      borderRadius: 10, color: '#e8e6f0', fontSize: 13, padding: '11px 13px',
      outline: 'none', cursor: 'pointer', appearance: 'none',
      fontFamily: 'inherit', transition: 'border-color 0.2s',
    },
    btn: {
      width: '100%', padding: '14px 0',
      background: 'linear-gradient(135deg, #c8a96e, #9a6f30)',
      border: 'none', borderRadius: 12,
      color: '#0c0e14', fontFamily: 'Georgia, serif', fontSize: 15,
      fontWeight: 700, letterSpacing: '0.04em', cursor: 'pointer',
      transition: 'opacity 0.2s, transform 0.15s',
    },
    // result elements
    verdictBadge: (cfg) => ({
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '18px 20px', borderRadius: 12,
      background: cfg.bg, border: `1px solid ${cfg.color}33`,
      marginBottom: 18,
      opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(10px)',
      transition: 'opacity 0.45s ease, transform 0.45s ease',
    }),
    verdictIconBox: (cfg) => ({
      width: 44, height: 44, borderRadius: '50%',
      background: cfg.bg, border: `2px solid ${cfg.color}55`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 20, color: cfg.color, fontWeight: 700, flexShrink: 0,
    }),
    metricsGrid: {
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14,
      marginBottom: 18,
      opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(10px)',
      transition: 'opacity 0.45s ease 0.1s, transform 0.45s ease 0.1s',
    },
    metricBox: {
      background: '#1a1d28', border: '1px solid #252838',
      borderRadius: 12, padding: '16px 14px', textAlign: 'center',
    },
    metricLabel: {
      fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.12em',
      color: '#7a7d96', textTransform: 'uppercase', marginBottom: 8,
    },
    barsWrap: {
      background: '#1a1d28', border: '1px solid #252838',
      borderRadius: 12, padding: 16, marginBottom: 14,
      opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(10px)',
      transition: 'opacity 0.45s ease 0.2s, transform 0.45s ease 0.2s',
    },
    tagsRow: {
      display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.45s ease 0.3s',
    },
    tag: (color, bg) => ({
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '5px 11px', borderRadius: 20,
      background: bg, border: `1px solid ${color}44`,
      fontFamily: 'monospace', fontSize: 11, color, letterSpacing: '0.04em',
    }),
  };
 
  const verdict = result ? (VERDICT[result.predicted_decision] || VERDICT['Lost']) : null;
 
  // ─── confidence_score = blended XGBoost confidence (display as "Confidence")
  // ─── win_probability  = perspective-adjusted probability of winning
  // ─── predicted_probability = raw RF signal (not shown to user directly)
 
  return (
    <div style={S.page}>
      <div style={S.eyebrow}>⚖ AI-Powered Analysis</div>
      <h1 style={S.h1}>Legal Case Predictor</h1>
      <p style={S.sub}>XGBoost · Semantic Embeddings · Rule-Enhanced Logic</p>
 
      <div style={{ ...S.grid, ...(window.innerWidth < 780 ? { gridTemplateColumns: '1fr' } : {}) }}>
 
        {/* ── INPUT ─────────────────────────────────────────────────────── */}
        <div style={S.card}>
          <div style={S.cardAccent} />
          <div style={S.cardTitle}>// Case Input</div>
 
          <form onSubmit={handleSubmit}>
            <label style={S.label}>Case Description</label>
            <textarea
              style={S.textarea}
              value={form.case_description}
              onChange={handleChange('case_description')}
              placeholder="Describe the case facts, evidence, parties, and key arguments..."
              onFocus={e  => (e.target.style.borderColor = '#c8a96e')}
              onBlur={e   => (e.target.style.borderColor = '#252838')}
            />
 
            <div style={S.selectRow}>
              <div>
                <label style={S.label}>Court Level</label>
                <select
                  style={S.select}
                  value={form.court_level}
                  onChange={handleChange('court_level')}
                  onFocus={e => (e.target.style.borderColor = '#c8a96e')}
                  onBlur={e  => (e.target.style.borderColor = '#252838')}
                >
                  {COURT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={S.label}>Case Category</label>
                <select
                  style={S.select}
                  value={form.case_category}
                  onChange={handleChange('case_category')}
                  onFocus={e => (e.target.style.borderColor = '#c8a96e')}
                  onBlur={e  => (e.target.style.borderColor = '#252838')}
                >
                  {CATEGORY_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
 
            <button
              type="submit"
              style={{ ...S.btn, opacity: loading || !form.case_description.trim() ? 0.5 : 1 }}
              disabled={loading || !form.case_description.trim()}
              onMouseEnter={e => { if (!loading) e.target.style.opacity = '0.82'; }}
              onMouseLeave={e => { e.target.style.opacity = '1'; }}
            >
              {loading ? 'Analysing Case...' : 'Predict Outcome →'}
            </button>
          </form>
        </div>
 
        {/* ── RESULT ────────────────────────────────────────────────────── */}
        <div style={S.card} ref={resultRef}>
          <div style={S.cardAccent} />
          <div style={S.cardTitle}>// Prediction Result</div>
 
          {/* Placeholder */}
          {!result && !loading && !error && (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: '#7a7d96' }}>
              <div style={{ fontSize: 42, marginBottom: 12, opacity: 0.35 }}>⚖️</div>
              <p style={{ fontSize: 13, lineHeight: 1.7, maxWidth: 220, margin: '0 auto', opacity: 0.6 }}>
                Enter case details and click Predict to see the AI analysis.
              </p>
            </div>
          )}
 
          {/* Loading */}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 14, padding: '50px 20px', color: '#7a7d96' }}>
              <div style={{
                width: 36, height: 36, border: '3px solid #252838',
                borderTopColor: '#c8a96e', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
              <p style={{ fontFamily: 'monospace', fontSize: 12, letterSpacing: '0.08em' }}>
                Analysing case...
              </p>
            </div>
          )}
 
          {/* Error */}
          {error && (
            <div style={{
              padding: 14, background: 'rgba(224,85,85,0.08)',
              border: '1px solid rgba(224,85,85,0.25)',
              borderRadius: 10, fontFamily: 'monospace',
              fontSize: 12, color: '#e05555', lineHeight: 1.6,
            }}>
              ⚠ {error}
            </div>
          )}
 
          {/* Results */}
          {result && verdict && (
            <>
              {/* Verdict badge */}
              <div style={S.verdictBadge(verdict)}>
                <div style={S.verdictIconBox(verdict)}>{verdict.icon}</div>
                <div>
                  <div style={{ fontFamily: 'monospace', fontSize: 10,
                    letterSpacing: '0.12em', color: '#7a7d96',
                    textTransform: 'uppercase', marginBottom: 4 }}>
                    Predicted Decision
                    {result.perspective === 'accused' && (
                      <span style={{ marginLeft: 8, color: '#7c6fe0' }}>
                        · accused view
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontFamily: 'Georgia, serif', fontSize: 22,
                    fontWeight: 700, color: verdict.color,
                  }}>
                    {result.predicted_decision}
                  </div>
                </div>
              </div>
 
              {/* Confidence + Win Probability gauges */}
              <div style={S.metricsGrid}>
                <div style={S.metricBox}>
                  <div style={S.metricLabel}>Confidence</div>
                  {/* ← confidence_score = XGBoost blended score */}
                  <ArcGauge value={result.confidence_score} color={TIER_COLOR[result.confidence_tier] || '#c8a96e'} />
                  <div style={{
                    fontFamily: 'monospace', fontSize: 10, marginTop: 6,
                    color: TIER_COLOR[result.confidence_tier] || '#c8a96e',
                  }}>
                    ● {result.confidence_tier}
                  </div>
                </div>
 
                <div style={S.metricBox}>
                  <div style={S.metricLabel}>Win Probability</div>
                  {/* ← win_probability = perspective-adjusted correct field */}
                  <ArcGauge value={result.win_probability} color={verdict.color} />
                  <div style={{
                    fontFamily: 'monospace', fontSize: 10, marginTop: 6, color: '#7a7d96',
                  }}>
                    your side wins
                  </div>
                </div>
              </div>
 
              {/* Class probability bars */}
              {result.class_probabilities && (
                <div style={S.barsWrap}>
                  <div style={{ ...S.metricLabel, marginBottom: 12 }}>
                    XGBoost Class Probabilities
                  </div>
                  <ProbBar label="Won"              value={result.class_probabilities['Won'] ?? 0}               color="#3ecf84" />
                  <ProbBar label="Partially Allowed" value={result.class_probabilities['Partially Allowed'] ?? 0} color="#f0a854" />
                  <ProbBar label="Lost"             value={result.class_probabilities['Lost'] ?? 0}              color="#e05555" />
                </div>
              )}
 
              {/* Tags */}
              <div style={S.tagsRow}>
                <span style={S.tag('#7c6fe0', 'rgba(124,111,224,0.10)')}>
                  👤 {result.perspective === 'accused' ? 'Accused perspective' : 'Plaintiff perspective'}
                </span>
                {result.rule_applied && (
                  <span style={S.tag('#c8a96e', 'rgba(200,169,110,0.10)')}>
                    ⚡ {result.rule_applied.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
 
      </div>
 
      {/* Spinner keyframe */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 780px) {
          .pred-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};
 
export default Predictor;