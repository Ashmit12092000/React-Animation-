import { useState } from 'react';
import { useStore } from '../../store';
import { PAINT_COLORS } from '../../assets';

// Build a filled-rectangle SVG for the given color
function makeFillSvg(color, shape = 'rect', opacity = 1) {
  if (shape === 'circle') {
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill="${color}" fill-opacity="${opacity}"/>
    </svg>`;
  }
  if (shape === 'triangle') {
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <polygon points="50,4 98,96 2,96" fill="${color}" fill-opacity="${opacity}"/>
    </svg>`;
  }
  if (shape === 'star') {
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <polygon points="50,6 61,35 92,35 68,57 77,88 50,70 23,88 32,57 8,35 39,35"
        fill="${color}" fill-opacity="${opacity}"/>
    </svg>`;
  }
  if (shape === 'blob1') {
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M30,10 C60,-5 95,25 92,55 C90,80 70,100 45,95 C20,90 0,72 5,48 C10,24 0,25 30,10 Z"
        fill="${color}" fill-opacity="${opacity}"/>
    </svg>`;
  }
  if (shape === 'blob2') {
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M50,5 C75,5 98,28 95,55 C92,80 72,98 48,96 C24,94 2,76 5,50 C8,24 25,5 50,5 Z"
        fill="${color}" fill-opacity="${opacity}"/>
    </svg>`;
  }
  // default: rect
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="96" height="96" rx="6" fill="${color}" fill-opacity="${opacity}"/>
  </svg>`;
}

const SHAPES = [
  { id: 'rect',     label: '▬ Rectangle' },
  { id: 'circle',   label: '● Circle' },
  { id: 'triangle', label: '▲ Triangle' },
  { id: 'star',     label: '★ Star' },
  { id: 'blob1',    label: '⬡ Blob 1' },
  { id: 'blob2',    label: '⬡ Blob 2' },
];

export default function PaintTab() {
  const addDrawingGraphic = useStore(s => s.addDrawingGraphic);
  const [selectedColor, setSelectedColor] = useState('#3b82f6');
  const [customColor, setCustomColor] = useState('#3b82f6');
  const [selectedShape, setSelectedShape] = useState('rect');
  const [opacity, setOpacity] = useState(1);

  const handleAdd = () => {
    const color = customColor || selectedColor;
    const svg = makeFillSvg(color, selectedShape, opacity);
    addDrawingGraphic({
      svg,
      name: `Paint ${selectedShape}`,
      paintFill: true,
    });
  };

  const currentColor = customColor || selectedColor;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px 80px' }}>

        {/* Paint brush icon header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z"/>
            <path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7"/>
          </svg>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', letterSpacing: 1, textTransform: 'uppercase' }}>
            Paint Fill
          </span>
        </div>

        {/* Preview */}
        <div style={{
          width: '100%', height: 80, borderRadius: 10, marginBottom: 14,
          background: currentColor,
          opacity: opacity,
          border: '2px solid #334155',
          transition: 'background 0.15s',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 10px, transparent 10px, transparent 20px)',
          }}/>
          <div style={{
            position: 'absolute', bottom: 6, right: 10,
            fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 700,
            textShadow: '0 1px 3px rgba(0,0,0,0.5)',
          }}>{currentColor}</div>
        </div>

        {/* Palette grid */}
        <p style={{ fontSize: 10, color: '#64748b', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
          Color Palette
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
          {PAINT_COLORS.map(c => (
            <button
              key={c}
              onClick={() => { setSelectedColor(c); setCustomColor(c); }}
              style={{
                width: 30, height: 30, borderRadius: 6,
                background: c,
                border: currentColor === c ? '3px solid #f59e0b' : '2px solid #334155',
                cursor: 'pointer',
                transition: 'border 0.1s, transform 0.1s',
                transform: currentColor === c ? 'scale(1.2)' : 'scale(1)',
                flexShrink: 0,
              }}
              title={c}
            />
          ))}
        </div>

        {/* Custom color picker */}
        <p style={{ fontSize: 10, color: '#64748b', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
          Custom Color
        </p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14 }}>
          <input
            type="color"
            value={customColor}
            onChange={e => setCustomColor(e.target.value)}
            style={{
              width: 40, height: 36, borderRadius: 6, border: '2px solid #334155',
              background: 'none', cursor: 'pointer', padding: 2,
            }}
          />
          <input
            type="text"
            value={customColor}
            onChange={e => {
              const v = e.target.value;
              if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setCustomColor(v);
            }}
            style={{
              flex: 1, padding: '6px 8px',
              background: '#1e293b', border: '1px solid #334155',
              borderRadius: 6, color: '#e2e8f0', fontSize: 12,
              outline: 'none', fontFamily: 'monospace',
            }}
          />
        </div>

        {/* Shape picker */}
        <p style={{ fontSize: 10, color: '#64748b', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
          Shape
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
          {SHAPES.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedShape(s.id)}
              style={{
                padding: '5px 10px', borderRadius: 6, fontSize: 11,
                background: selectedShape === s.id ? '#3b82f6' : '#1e293b',
                border: `1px solid ${selectedShape === s.id ? '#3b82f6' : '#334155'}`,
                color: selectedShape === s.id ? '#fff' : '#94a3b8',
                cursor: 'pointer', transition: 'all 0.15s', fontWeight: 600,
              }}
            >{s.label}</button>
          ))}
        </div>

        {/* Opacity slider */}
        <p style={{ fontSize: 10, color: '#64748b', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
          Opacity — {Math.round(opacity * 100)}%
        </p>
        <div style={{ marginBottom: 20 }}>
          <input
            type="range"
            min={0.1} max={1} step={0.05}
            value={opacity}
            onChange={e => setOpacity(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#f59e0b', cursor: 'pointer' }}
          />
          <div style={{
            height: 14, borderRadius: 4, marginTop: 6,
            background: `linear-gradient(to right, transparent, ${currentColor})`,
            border: '1px solid #334155',
          }}/>
        </div>

        {/* Add button */}
        <button
          onClick={handleAdd}
          style={{
            width: '100%', padding: '10px 0', borderRadius: 8,
            background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
            border: 'none', color: '#fff', fontSize: 13,
            fontWeight: 700, cursor: 'pointer', letterSpacing: 0.5,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 4px 14px rgba(245,158,11,0.35)',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          🎨 Add Paint Fill to Canvas
        </button>

        {/* Hint */}
        <p style={{ fontSize: 10, color: '#4b5563', textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>
          In preview, the hand will paint this area with a brush stroke animation
        </p>
      </div>
    </div>
  );
}