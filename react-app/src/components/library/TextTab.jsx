import { useState } from 'react';
import { useStore } from '../../store';
import { SYSTEM_FONTS } from '../../assets';

const INPUT = {
  width: '100%', background: '#1e293b', border: '1px solid #334155',
  borderRadius: 6, padding: '6px 8px', color: '#e2e8f0',
  fontSize: 12, outline: 'none', boxSizing: 'border-box',
};

export default function TextTab() {
  const addTextGraphic = useStore(s => s.addTextGraphic);

  const [rawText, setRawText] = useState('');
  const [fontFamily, setFontFamily] = useState('Georgia');
  const [fontWeight, setFontWeight] = useState('normal');
  const [fontStyle, setFontStyle] = useState('normal');
  const [fontSize, setFontSize] = useState(36);
  const [color, setColor] = useState('#1a1a1a');

  const canAdd = rawText.trim().length > 0;

  const handleAdd = () => {
    if (!canAdd) return;
    addTextGraphic({ rawText: rawText.trim(), fontFamily, fontWeight, fontStyle, fontSize, color });
    setRawText('');
  };

  return (
    <div style={{ padding: '12px 12px 80px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minHeight: 0, overflowY: 'auto' }}>
      {/* Text input */}
      <Field label="Text">
        <textarea
          value={rawText}
          onChange={e => setRawText(e.target.value)}
          placeholder="Enter text to display…"
          rows={3}
          style={{ ...INPUT, resize: 'vertical', lineHeight: 1.5 }}
        />
      </Field>

      {/* Font family */}
      <Field label="Font Family">
        <select value={fontFamily} onChange={e => setFontFamily(e.target.value)} style={INPUT}>
          {SYSTEM_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </Field>

      {/* Weight + Style in a row */}
      <div style={{ display: 'flex', gap: 8 }}>
        <Field label="Weight" style={{ flex: 1 }}>
          <select value={fontWeight} onChange={e => setFontWeight(e.target.value)} style={INPUT}>
            <option value="normal">Normal</option>
            <option value="bold">Bold</option>
            <option value="300">Light</option>
            <option value="900">Black</option>
          </select>
        </Field>
        <Field label="Style" style={{ flex: 1 }}>
          <select value={fontStyle} onChange={e => setFontStyle(e.target.value)} style={INPUT}>
            <option value="normal">Normal</option>
            <option value="italic">Italic</option>
          </select>
        </Field>
      </div>

      {/* Font size */}
      <Field label={`Size: ${fontSize}px`}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="range" min={8} max={120} step={2} value={fontSize}
            onChange={e => setFontSize(Number(e.target.value))}
            style={{ flex: 1, accentColor: '#3b82f6' }}
          />
          <input
            type="number" min={8} max={200} value={fontSize}
            onChange={e => setFontSize(Math.max(8, Number(e.target.value)))}
            style={{ ...INPUT, width: 56 }}
          />
        </div>
      </Field>


      {/* Text color */}
      <Field label="Text Color">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="color"
            value={color}
            onChange={e => setColor(e.target.value)}
            style={{
              width: 40, height: 32, padding: 2, cursor: 'pointer',
              background: '#1e293b', border: '1px solid #334155',
              borderRadius: 6, boxSizing: 'border-box',
            }}
          />
          <input
            type="text"
            value={color}
            onChange={e => {
              const v = e.target.value;
              if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) setColor(v);
            }}
            style={{ ...INPUT, width: 90, fontFamily: 'monospace' }}
            maxLength={7}
          />
          {/* Quick preset swatches */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {['#1a1a1a','#ffffff','#ef4444','#3b82f6','#10b981','#f59e0b','#8b5cf6'].map(c => (
              <div
                key={c}
                onClick={() => setColor(c)}
                title={c}
                style={{
                  width: 18, height: 18, borderRadius: 3,
                  background: c, cursor: 'pointer',
                  border: color === c ? '2px solid #3b82f6' : '1px solid #475569',
                  flexShrink: 0,
                }}
              />
            ))}
          </div>
        </div>
      </Field>

      {/* Preview */}
      <div style={{
        background: '#0f172a', border: '1px solid #1e293b', borderRadius: 6,
        padding: '12px 10px', minHeight: 60,
        fontFamily, fontWeight, fontStyle, fontSize: Math.min(fontSize, 48),
        color: color, overflow: 'hidden', wordBreak: 'break-word',
        lineHeight: 1.3,
      }}>
        {rawText || <span style={{ color: '#334155' }}>Preview will appear here</span>}
      </div>

      {/* Add button */}
      <button
        disabled={!canAdd}
        onClick={handleAdd}
        style={{
          padding: '9px 0',
          background: canAdd ? '#3b82f6' : '#1e293b',
          border: `1px solid ${canAdd ? '#3b82f6' : '#334155'}`,
          borderRadius: 6, color: canAdd ? '#fff' : '#4b5563',
          cursor: canAdd ? 'pointer' : 'not-allowed',
          fontWeight: 700, fontSize: 13, transition: 'all 0.15s',
        }}
        onMouseEnter={e => canAdd && (e.currentTarget.style.background = '#2563eb')}
        onMouseLeave={e => canAdd && (e.currentTarget.style.background = '#3b82f6')}
      >
        Add Text to Canvas
      </button>
    </div>
  );
}

function Field({ label, children, style }) {
  return (
    <div style={style}>
      <label style={{ display: 'block', fontSize: 11, color: '#94a3b8', marginBottom: 4, fontWeight: 600 }}>
        {label}
      </label>
      {children}
    </div>
  );
}