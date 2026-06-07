import { useState } from 'react';
import SvgRenderer from '../shared/SvgRenderer';
import { useStore } from '../../store';
import { THUMBNAIL_SCALE } from '../../utils/animation';
import { useMobile } from '../../hooks/useMobile';

const TW = 128;
const TH = 72;

const TRANSITIONS = [
  { id: 'none', label: 'None', icon: '—' },
  { id: 'fade', label: 'Fade', icon: '◐' },
  { id: 'slideLeft', label: 'Slide ←', icon: '←' },
  { id: 'slideRight', label: 'Slide →', icon: '→' },
  { id: 'slideUp', label: 'Slide ↑', icon: '↑' },
  { id: 'slideDown', label: 'Slide ↓', icon: '↓' },
  { id: 'zoomIn', label: 'Zoom In', icon: '⊙' },
  { id: 'zoomOut', label: 'Zoom Out', icon: '⊘' },
];

export default function SceneThumbnail({
  scene, index, isSelected, totalScenes,
  isDragOver, onDragStart, onDragOver, onDrop, onDragEnd, onDragLeave,
}) {
  const isMobile = useMobile();
  const TW_r = isMobile ? 72 : 128;
  const TH_r = isMobile ? 40 : 72;
  const selectScene    = useStore(s => s.selectScene);
  const deleteScene    = useStore(s => s.deleteScene);
  const duplicateScene = useStore(s => s.duplicateScene);
  const moveScene      = useStore(s => s.moveScene);
  const updateSceneSettings = useStore(s => s.updateSceneSettings);
  const [ctxMenu, setCtxMenu] = useState(false);
  const [showTransitionModal, setShowTransitionModal] = useState(false);

  const handleContextMenu = (e) => { e.preventDefault(); setCtxMenu(true); };
  const close = () => setCtxMenu(false);

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>

      {/* Drop indicator bar — shown to the left when dragging over */}
      {isDragOver && (
        <div style={{
          position: 'absolute', left: -7, top: 6, bottom: 6, width: 3,
          background: '#f59e0b', borderRadius: 2,
          zIndex: 10, pointerEvents: 'none',
        }} />
      )}

      {/* ── The draggable thumbnail ── */}
      <div
        draggable
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
        onDragLeave={onDragLeave}
        onClick={() => selectScene(scene.id)}
        onContextMenu={handleContextMenu}
        style={{
          width: TW_r, height: TH_r,
          border: `2px solid ${isSelected ? '#f59e0b' : isDragOver ? '#f59e0b80' : '#374151'}`,
          borderRadius: 8,
          overflow: 'hidden',
          cursor: 'grab',
          position: 'relative',
          background: '#fff',
          transition: 'border-color 0.15s, box-shadow 0.15s, opacity 0.15s',
          boxShadow: isSelected ? '0 0 0 3px rgba(245,158,11,0.25)' : 'none',
          userSelect: 'none',
        }}
      >
        {/* Mini canvas */}
        {scene.graphics.slice(0, 8).map(g => (
          <div key={g.id} style={{
            position: 'absolute',
            left:   g.x * THUMBNAIL_SCALE,
            top:    g.y * THUMBNAIL_SCALE,
            width:  Math.max(10, g.width  * THUMBNAIL_SCALE),
            height: Math.max(10, g.height * THUMBNAIL_SCALE),
            pointerEvents: 'none',
          }}>
            {g.type === 'drawing' ? (
              <SvgRenderer svg={g.svgText} style={{ width: '100%', height: '100%' }} />
            ) : g.type === 'image' ? (
              <img
                src={g.src}
                alt={g.name}
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
              />
            ) : (
              <div style={{
                fontFamily: g.fontFamily,
                fontSize:   Math.max(4, g.fontSize * THUMBNAIL_SCALE),
                fontWeight: g.fontWeight,
                fontStyle:  g.fontStyle,
                color: '#1a1a1a',
                overflow: 'hidden', whiteSpace: 'nowrap',
              }}>{g.rawText}</div>
            )}
          </div>
        ))}

        {/* Drag handle */}
        <div style={{
          position: 'absolute', top: 3, left: 4,
          color: 'rgba(0,0,0,0.25)', fontSize: 11, lineHeight: 1,
          pointerEvents: 'none', userSelect: 'none',
        }}>⠿</div>

        {/* Scene label */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'rgba(0,0,0,0.45)',
          color: '#fff', fontSize: 10, textAlign: 'center',
          padding: '2px 0', fontWeight: 600,
          pointerEvents: 'none',
        }}>
          Scene {scene.name}
        </div>

        {/* Item count badge */}
        {scene.graphics.length > 0 && (
          <div style={{
            position: 'absolute', top: 4, right: 4,
            background: '#3b82f6', color: '#fff',
            fontSize: 9, padding: '1px 5px', borderRadius: 10, fontWeight: 700,
            pointerEvents: 'none',
          }}>
            {scene.graphics.length}
          </div>
        )}
      </div>

      {/* Context menu */}
      {ctxMenu && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 100 }} onClick={close} />
          <div style={{
            position: 'absolute', top: '100%', left: 0, zIndex: 200,
            background: '#1f2937', border: '1px solid #374151', borderRadius: 8,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)', minWidth: 160, overflow: 'hidden',
          }}>
            {[
              { label: '← Move Left',  icon: '←', disabled: index === 0,               action: () => { moveScene(index, index - 1); close(); } },
              { label: '→ Move Right', icon: '→', disabled: index === totalScenes - 1, action: () => { moveScene(index, index + 1); close(); } },
              { sep: true },
              { label: 'Transition', icon: '✨', action: () => { setShowTransitionModal(true); close(); } },
              { sep: true },
              { label: 'Duplicate', icon: '⧉', action: () => { duplicateScene(scene.id); close(); } },
              { sep: true },
              { label: 'Delete', icon: '🗑', danger: true, disabled: totalScenes <= 1, action: () => { deleteScene(scene.id); close(); } },
            ].map((item, i) =>
              item.sep ? (
                <div key={i} style={{ height: 1, background: '#374151', margin: '2px 0' }} />
              ) : (
                <button key={i} disabled={item.disabled} onClick={item.action}
                  style={{
                    display: 'block', width: '100%', padding: '8px 14px', textAlign: 'left',
                    background: 'none', border: 'none',
                    color: item.disabled ? '#4b5563' : item.danger ? '#ef4444' : '#e5e7eb',
                    fontSize: 13, cursor: item.disabled ? 'not-allowed' : 'pointer',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => !item.disabled && (e.currentTarget.style.background = '#374151')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <span style={{ marginRight: 8 }}>{item.icon}</span>{item.label}
                </button>
              )
            )}
          </div>
        </>
      )}

      {/* Transition button */}
      <button
        onClick={() => setShowTransitionModal(true)}
        title="Set Transition"
        style={{
          position: 'absolute', bottom: 26, left: 4,
          width: 24, height: 24, padding: 0,
          background: '#1e293b', border: '1px solid #374151', borderRadius: 4,
          color: '#94a3b8', fontSize: 11, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s',
          zIndex: 5,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = '#334155';
          e.currentTarget.style.borderColor = '#475569';
          e.currentTarget.style.color = '#cbd5e1';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = '#1e293b';
          e.currentTarget.style.borderColor = '#374151';
          e.currentTarget.style.color = '#94a3b8';
        }}
      >
        ✨
      </button>

      {/* Transition Modal */}
      {showTransitionModal && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowTransitionModal(false)} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            zIndex: 400, background: '#1f2937', border: '1px solid #374151', borderRadius: 12,
            boxShadow: '0 20px 64px rgba(0,0,0,0.8)', padding: 20, minWidth: 300,
          }}>
            <h3 style={{ margin: '0 0 16px', color: '#e5e7eb', fontSize: 16, fontWeight: 600 }}>
              Scene Transition
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 16 }}>
              {TRANSITIONS.map(trans => (
                <button
                  key={trans.id}
                  onClick={() => {
                    updateSceneSettings(scene.id, { transition: trans.id });
                    setShowTransitionModal(false);
                  }}
                  style={{
                    padding: '8px 12px', borderRadius: 6, border: '1px solid #374151',
                    background: scene.transition === trans.id ? '#3b82f6' : '#1e293b',
                    color: scene.transition === trans.id ? '#fff' : '#cbd5e1',
                    cursor: 'pointer', fontSize: 12, fontWeight: 500,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    if (scene.transition !== trans.id) {
                      e.currentTarget.style.background = '#334155';
                      e.currentTarget.style.borderColor = '#475569';
                    }
                  }}
                  onMouseLeave={e => {
                    if (scene.transition !== trans.id) {
                      e.currentTarget.style.background = '#1e293b';
                      e.currentTarget.style.borderColor = '#374151';
                    }
                  }}
                >
                  <div style={{ fontSize: 14, marginBottom: 4 }}>{trans.icon}</div>
                  {trans.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12, paddingTop: 12, borderTop: '1px solid #374151' }}>
              <label style={{ color: '#cbd5e1', fontSize: 12, flex: 1 }}>
                Duration (s):
              </label>
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={scene.transitionDuration || 0.5}
                onChange={e => updateSceneSettings(scene.id, { transitionDuration: parseFloat(e.target.value) || 0 })}
                style={{
                  width: 60, padding: '4px 8px', borderRadius: 4,
                  background: '#1e293b', border: '1px solid #374151', color: '#e5e7eb',
                  fontSize: 12,
                }}
              />
            </div>

            <button
              onClick={() => setShowTransitionModal(false)}
              style={{
                marginTop: 16, width: '100%', padding: '8px 12px', borderRadius: 6,
                background: '#1e293b', border: '1px solid #374151', color: '#cbd5e1',
                cursor: 'pointer', fontSize: 12, fontWeight: 500, transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#334155';
                e.currentTarget.style.borderColor = '#475569';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#1e293b';
                e.currentTarget.style.borderColor = '#374151';
              }}
            >
              Close
            </button>
          </div>
        </>
      )}
    </div>
  );
}