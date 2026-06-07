import { useState, useRef, useCallback, useEffect } from 'react';
import { useStore } from '../../store';

// CRA reads REACT_APP_* env vars at build/start time.
// run.sh writes the correct Codespaces URL into .env before docker compose up.
const API_BASE = process.env.REACT_APP_IMG_API || 'http://localhost:8000';

const STYLE_PRESETS = [
  { label: 'None',       suffix: '' },
  { label: 'Whiteboard', suffix: ', hand-drawn whiteboard sketch, black marker on white, simple lines, no color' },
  { label: 'Cartoon',    suffix: ', colorful cartoon style, flat design, clean outlines' },
  { label: 'Watercolor', suffix: ', soft watercolor painting, artistic, loose brush strokes' },
  { label: 'Minimalist', suffix: ', minimalist illustration, simple shapes, flat colors' },
  { label: 'Realistic',  suffix: ', photorealistic, high detail, professional photography' },
  { label: 'Isometric',  suffix: ', isometric 3D illustration, clean geometric shapes' },
  { label: 'Chalkboard', suffix: ', chalk drawing on blackboard, white lines on dark green background' },
];

const SIZE_OPTIONS = [
  { label: '512×512', w: 512, h: 512 },
  { label: '768×512', w: 768, h: 512 },
  { label: '512×768', w: 512, h: 768 },
  { label: '768×768', w: 768, h: 768 },
];

const STEP_OPTIONS = [
  { label: '1 step  (fastest)', value: 1 },
  { label: '2 steps',           value: 2 },
  { label: '4 steps (default)', value: 4 },
  { label: '8 steps (best)',    value: 8 },
];

export default function AIImageTab() {
  const addImageGraphic = useStore(s => s.addImageGraphic);

  const [prompt,     setPrompt]     = useState('');
  const [styleIdx,   setStyleIdx]   = useState(0);
  const [negPrompt,  setNegPrompt]  = useState('');
  const [showNeg,    setShowNeg]    = useState(false);
  const [sizeIdx,    setSizeIdx]    = useState(0);
  const [steps,      setSteps]      = useState(4);
  const [generating, setGenerating] = useState(false);
  const [error,      setError]      = useState(null);
  const [history,    setHistory]    = useState([]);
  const [apiStatus,  setApiStatus]  = useState('unknown'); // 'ok'|'loading'|'error'|'unknown'

  const abortRef = useRef(null);
  const style    = STYLE_PRESETS[styleIdx];
  const size     = SIZE_OPTIONS[sizeIdx];

  const checkApi = useCallback(async () => {
    setApiStatus('unknown');
    try {
      const res  = await fetch(`${API_BASE}/status`, { signal: AbortSignal.timeout(4000) });
      const data = await res.json();
      setApiStatus(data.ready ? 'ok' : 'loading');
    } catch {
      setApiStatus('error');
    }
  }, []);

  useEffect(() => { checkApi(); }, [checkApi]);

  const generate = useCallback(async () => {
    const text = prompt.trim();
    if (!text) { setError('Enter a prompt first'); return; }

    const controller = new AbortController();
    abortRef.current = controller;
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/generate`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        signal:  controller.signal,
        body: JSON.stringify({
          prompt:          text + style.suffix,
          negative_prompt: negPrompt.trim() || '',
          steps,
          width:  size.w,
          height: size.h,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setHistory(prev => [{
        id:         crypto.randomUUID(),
        dataUrl:    data.image,
        prompt:     text,
        seed:       data.seed,
        elapsed_ms: data.elapsed_ms,
        w:          data.width,
        h:          data.height,
      }, ...prev.slice(0, 19)]);
      setApiStatus('ok');

    } catch (err) {
      if (err.name === 'AbortError') return;
      const msg = err.message || 'Generation failed. Is the local server running?';
      setError(msg);
      if (msg.includes('fetch') || msg.includes('Failed') || msg.includes('NetworkError')) {
        setApiStatus('error');
      }
    } finally {
      setGenerating(false);
      abortRef.current = null;
    }
  }, [prompt, style, negPrompt, steps, size]);

  const cancel = () => { abortRef.current?.abort(); setGenerating(false); };

  const addToCanvas = (entry) => {
    const maxW   = 280;
    const aspect = entry.h / entry.w;
    const w      = Math.min(entry.w, maxW);
    addImageGraphic({ src: entry.dataUrl, name: entry.prompt.slice(0, 30), width: w, height: Math.round(w * aspect) });
  };

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>

      {apiStatus !== 'ok' && <StatusBanner status={apiStatus} onRetry={checkApi} />}

      {/* Prompt */}
      <div style={{ padding: '10px 12px 0', flexShrink: 0 }}>
        <Label>Prompt</Label>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.ctrlKey || e.metaKey) && generate()}
          placeholder="Describe the image… (Ctrl+Enter to generate)"
          rows={3}
          style={textareaStyle}
          onFocus={e => e.currentTarget.style.borderColor = '#3b82f6'}
          onBlur={e  => e.currentTarget.style.borderColor = '#334155'}
        />
      </div>

      {/* Style */}
      <div style={{ padding: '8px 12px 0', flexShrink: 0 }}>
        <Label>Style</Label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {STYLE_PRESETS.map((s, i) => (
            <Chip key={s.label} active={styleIdx === i} onClick={() => setStyleIdx(i)}>{s.label}</Chip>
          ))}
        </div>
      </div>

      {/* Size */}
      <div style={{ padding: '8px 12px 0', flexShrink: 0 }}>
        <Label>Size</Label>
        <div style={{ display: 'flex', gap: 4 }}>
          {SIZE_OPTIONS.map((s, i) => (
            <Chip key={s.label} active={sizeIdx === i} onClick={() => setSizeIdx(i)} small>{s.label}</Chip>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div style={{ padding: '8px 12px 0', flexShrink: 0 }}>
        <Label>Quality / Speed</Label>
        <select value={steps} onChange={e => setSteps(Number(e.target.value))} style={selectStyle}>
          {STEP_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Negative prompt */}
      <div style={{ padding: '6px 12px 0', flexShrink: 0 }}>
        <button onClick={() => setShowNeg(v => !v)}
          style={{ background: 'none', border: 'none', padding: 0, color: '#64748b', fontSize: 10, cursor: 'pointer', fontWeight: 600, letterSpacing: 0.5 }}>
          {showNeg ? '▾' : '▸'} Negative prompt
        </button>
        {showNeg && (
          <input value={negPrompt} onChange={e => setNegPrompt(e.target.value)} placeholder="Things to exclude…"
            style={{ marginTop: 4, width: '100%', boxSizing: 'border-box', background: '#1e293b', border: '1px solid #334155', borderRadius: 5, padding: '5px 8px', color: '#e2e8f0', fontSize: 11, outline: 'none' }}
            onFocus={e => e.currentTarget.style.borderColor = '#3b82f6'}
            onBlur={e  => e.currentTarget.style.borderColor = '#334155'}
          />
        )}
      </div>

      {/* Generate button */}
      <div style={{ padding: '10px 12px 6px', flexShrink: 0 }}>
        <button onClick={generating ? cancel : generate} disabled={apiStatus === 'error'}
          style={{
            width: '100%', padding: '9px 0',
            background: generating ? '#7c3aed20' : apiStatus === 'error' ? '#1e293b' : '#7c3aed',
            border: `1px solid ${generating ? '#7c3aed60' : apiStatus === 'error' ? '#334155' : '#7c3aed'}`,
            borderRadius: 7, fontWeight: 700, fontSize: 13,
            color: generating ? '#a78bfa' : apiStatus === 'error' ? '#475569' : '#fff',
            cursor: apiStatus === 'error' ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
          {generating ? <><Spinner /> Generating… (click to cancel)</> : <>✨ Generate Image</>}
        </button>

        {error && <p style={{ fontSize: 11, color: '#f87171', marginTop: 6, textAlign: 'center' }}>{error}</p>}

        <p style={{ fontSize: 10, color: '#374151', textAlign: 'center', marginTop: 6 }}>
          Local SD-Turbo ·{' '}
          <a href={`${API_BASE}/docs`} target="_blank" rel="noreferrer" style={{ color: '#4b5563' }}>API docs</a>
        </p>
      </div>

      <div style={{ borderTop: '1px solid #1e293b', margin: '0 12px' }} />

      {/* History */}
      <div style={{ padding: '10px 10px 80px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {history.length === 0 && !generating && (
          <div style={{ textAlign: 'center', color: '#374151', fontSize: 12, marginTop: 8 }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>✨</div>
            Generated images appear here
          </div>
        )}
        {generating && (
          <div style={{ background: '#1e293b', borderRadius: 8, border: '1px solid #334155', height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
            <Spinner size={24} />
            <span style={{ color: '#64748b', fontSize: 11 }}>Running SD-Turbo locally…</span>
            <span style={{ color: '#374151', fontSize: 10 }}>GPU: ~2s · CPU: ~20s</span>
          </div>
        )}
        {history.map(entry => (
          <HistoryCard key={entry.id} entry={entry}
            onAdd={() => addToCanvas(entry)}
            onRemove={() => setHistory(prev => prev.filter(e => e.id !== entry.id))}
            onReuse={() => setPrompt(entry.prompt)}
          />
        ))}
      </div>
    </div>
  );
}

function StatusBanner({ status, onRetry }) {
  const isError = status === 'error';
  return (
    <div style={{ margin: '8px 12px 0', padding: '7px 10px', borderRadius: 6, background: isError ? '#7f1d1d20' : '#78350f20', border: `1px solid ${isError ? '#ef444440' : '#f59e0b40'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ fontSize: 10, color: isError ? '#fca5a5' : '#fcd34d' }}>
        {isError ? '⚠ Image server not reachable — run ./run.sh' : '⏳ Server starting, model loading…'}
      </span>
      <button onClick={onRetry} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 10, cursor: 'pointer', padding: '2px 4px' }}>Retry</button>
    </div>
  );
}

function HistoryCard({ entry, onAdd, onRemove, onReuse }) {
  return (
    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, overflow: 'hidden' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#475569'}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#334155'}>
      <img src={entry.dataUrl} alt={entry.prompt} style={{ width: '100%', display: 'block', maxHeight: 200, objectFit: 'cover' }} />
      <div style={{ padding: '6px 8px' }}>
        <p style={{ fontSize: 10, color: '#94a3b8', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.prompt}</p>
        {entry.elapsed_ms && <p style={{ fontSize: 9, color: '#374151', margin: '0 0 6px' }}>{(entry.elapsed_ms / 1000).toFixed(1)}s · seed {entry.seed}</p>}
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={onAdd}    style={btnStyle('#10b981')}>+ Canvas</button>
          <button onClick={onReuse}  style={btnStyle('#f59e0b')}>↺ Reuse</button>
          <button onClick={onRemove} style={btnStyle('#ef4444')}>✕</button>
        </div>
      </div>
    </div>
  );
}

function Label({ children }) {
  return <p style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 4px' }}>{children}</p>;
}
function Chip({ children, active, onClick, small }) {
  return (
    <button onClick={onClick} style={{ padding: small ? '2px 5px' : '3px 7px', fontSize: 10, fontWeight: 600, background: active ? '#7c3aed20' : '#1e293b', border: `1px solid ${active ? '#7c3aed' : '#334155'}`, borderRadius: 4, color: active ? '#a78bfa' : '#94a3b8', cursor: 'pointer' }}>
      {children}
    </button>
  );
}
function Spinner({ size = 14 }) {
  return <div style={{ width: size, height: size, border: '2px solid #4b5563', borderTopColor: '#a78bfa', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />;
}

const textareaStyle = { width: '100%', boxSizing: 'border-box', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, padding: '7px 9px', color: '#e2e8f0', fontSize: 12, resize: 'vertical', outline: 'none', fontFamily: 'system-ui', lineHeight: 1.5 };
const selectStyle  = { width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: 5, padding: '5px 6px', color: '#e2e8f0', fontSize: 11, outline: 'none', cursor: 'pointer', boxSizing: 'border-box' };
const btnStyle = (color) => ({ flex: 1, padding: '4px 0', fontSize: 10, fontWeight: 700, background: color + '20', border: `1px solid ${color}50`, borderRadius: 4, color, cursor: 'pointer' });
