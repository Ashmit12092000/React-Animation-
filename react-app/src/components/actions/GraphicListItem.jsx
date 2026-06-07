import SvgRenderer from '../shared/SvgRenderer';
import { useStore } from '../../store';

export default function GraphicListItem({ graphic, isSelected, onDragStart, onDragOver, onDrop, onDragEnd, isDragOver }) {
  const selectGraphic      = useStore(s => s.selectGraphic);
  const updateGraphicProps = useStore(s => s.updateGraphicProps);
  const duplicateGraphic   = useStore(s => s.duplicateGraphic);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onClick={() => selectGraphic(isSelected ? null : graphic.id)}
      style={{
        background: isSelected ? '#172554' : '#1e293b',
        border: `1px solid ${isSelected ? '#3b82f6' : isDragOver ? '#f59e0b' : '#334155'}`,
        borderRadius: 8, marginBottom: 6, padding: '8px 10px',
        cursor: 'grab', transition: 'all 0.15s',
        userSelect: 'none',
        opacity: isDragOver ? 0.6 : 1,
        boxShadow: isDragOver ? '0 0 0 2px #f59e0b60' : 'none',
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = '#475569'; }}
      onMouseLeave={e => { if (!isSelected && !isDragOver) e.currentTarget.style.borderColor = '#334155'; }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Drag handle */}
        <div style={{ color: '#475569', fontSize: 14, cursor: 'grab', flexShrink: 0, lineHeight: 1 }}>
          ⠿
        </div>

        {/* Thumbnail */}
        <div style={{
          width: 36, height: 36, flexShrink: 0, background: '#0f172a',
          borderRadius: 4, overflow: 'hidden', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          {graphic.type === 'drawing' ? (
            <SvgRenderer svg={graphic.svgText} style={{ width: 30, height: 30 }} />
          ) : graphic.type === 'image' ? (
            <img
              src={graphic.src}
              alt={graphic.name}
              style={{ maxWidth: 30, maxHeight: 30, objectFit: 'contain', display: 'block' }}
            />
          ) : (
            <span style={{
              fontSize: Math.min(graphic.fontSize, 16),
              fontFamily: graphic.fontFamily,
              fontWeight: graphic.fontWeight,
              fontStyle: graphic.fontStyle,
              color: '#e2e8f0',
              overflow: 'hidden',
            }}>T</span>
          )}
        </div>

        {/* Name */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{
            fontSize: 12, color: '#e2e8f0', fontWeight: 600,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {graphic.name}
          </div>
          <div style={{ fontSize: 10, color: '#64748b' }}>
            {graphic.type === 'drawing' ? 'SVG Graphic' : graphic.type === 'image' ? 'Image' : 'Text'}
          </div>
        </div>

        {/* Duplicate */}
        {isSelected && (
          <button
            onClick={e => { e.stopPropagation(); duplicateGraphic(graphic.id); }}
            title="Duplicate"
            style={{
              background: 'none', border: 'none', color: '#64748b',
              cursor: 'pointer', fontSize: 13, padding: 2,
            }}
          >⧉</button>
        )}
      </div>

      {/* Expanded controls when selected */}
      {isSelected && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Row label="Delay (s)">
            <NumInput value={graphic.delay} min={0} step={0.5} onChange={v => updateGraphicProps(graphic.id, { delay: v })} />
          </Row>
          <Row label="Duration (s)">
            <NumInput value={graphic.duration} min={0.1} step={0.5} onChange={v => updateGraphicProps(graphic.id, { duration: v })} />
          </Row>
          {graphic.type === 'image' && (
            <Row label="Reveal">
              <select
                value={graphic.revealEffect ?? 'draw'}
                onChange={e => updateGraphicProps(graphic.id, { revealEffect: e.target.value })}
                onClick={e => e.stopPropagation()}
                style={{
                  width: '100%', background: '#0f172a', border: '1px solid #334155',
                  borderRadius: 4, padding: '4px 6px', color: '#e2e8f0',
                  fontSize: 11, outline: 'none', boxSizing: 'border-box', cursor: 'pointer',
                }}
              >
                <option value="draw">✏️ Draw (Realistic)</option>
                <option value="wipe-right">→ Wipe Right</option>
                <option value="wipe-down">↓ Wipe Down</option>
                <option value="fade">✦ Fade In</option>
                <option value="zoom">⊕ Zoom In</option>
              </select>
            </Row>
          )}
          <Row label="Position">
            <div style={{ display: 'flex', gap: 4 }}>
              <NumInput value={Math.round(graphic.x)} min={0} onChange={v => updateGraphicProps(graphic.id, { x: v })} placeholder="X" />
              <NumInput value={Math.round(graphic.y)} min={0} onChange={v => updateGraphicProps(graphic.id, { y: v })} placeholder="Y" />
            </div>
          </Row>
          <Row label="Size">
            <div style={{ display: 'flex', gap: 4 }}>
              <NumInput value={Math.round(graphic.width)} min={10} onChange={v => updateGraphicProps(graphic.id, { width: v })} placeholder="W" />
              <NumInput value={Math.round(graphic.height)} min={10} onChange={v => updateGraphicProps(graphic.id, { height: v })} placeholder="H" />
            </div>
          </Row>
        </div>
      )}
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <label style={{ fontSize: 10, color: '#94a3b8', width: 76, flexShrink: 0, fontWeight: 600 }}>
        {label}
      </label>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

function NumInput({ value, min, max, step = 1, onChange, placeholder }) {
  return (
    <input
      type="number"
      value={value}
      min={min} max={max} step={step}
      placeholder={placeholder}
      onChange={e => onChange(Number(e.target.value))}
      onClick={e => e.stopPropagation()}
      style={{
        width: '100%', background: '#0f172a', border: '1px solid #334155',
        borderRadius: 4, padding: '4px 6px', color: '#e2e8f0',
        fontSize: 11, outline: 'none', boxSizing: 'border-box',
      }}
    />
  );
}