import SvgRenderer from '../shared/SvgRenderer';
import { useStore } from '../../store';
import { SAMPLE_SHAPES } from '../../assets';

export default function ShapesTab() {
  const addDrawingGraphic = useStore(s => s.addDrawingGraphic);

  return (
    <div style={{
      flex: 1, minHeight: 0, overflowY: 'auto', padding: '8px 8px 80px',
      display: 'flex', flexWrap: 'wrap', gap: 8, alignContent: 'flex-start',
    }}>
      {SAMPLE_SHAPES.map(item => (
        <div
          key={item.id}
          style={{
            width: 106, background: '#1e293b', borderRadius: 8, padding: 8,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            border: '1px solid #334155', transition: 'border-color 0.15s, transform 0.1s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.transform = 'none'; }}
        >
          <SvgRenderer svg={item.svg} style={{ width: 80, height: 80 }} />
          <span style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center' }}>{item.name}</span>
          <button
            onClick={() => addDrawingGraphic(item)}
            style={{
              width: '100%', padding: '4px 0',
              background: '#3b82f6', border: 'none', borderRadius: 4,
              color: '#fff', fontSize: 11, cursor: 'pointer', fontWeight: 600,
            }}
          >
            Add
          </button>
        </div>
      ))}
    </div>
  );
}