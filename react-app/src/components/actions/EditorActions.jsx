import { useRef, useState } from 'react';
import { useStore } from '../../store';
import GraphicListItem from './GraphicListItem';
import { useMobile } from '../../hooks/useMobile';

export default function EditorActions() {
  const isMobile = useMobile();
  const getSelectedScene  = useStore(s => s.getSelectedScene);
  const selectedGraphicId = useStore(s => s.selectedGraphicId);
  const deleteGraphic     = useStore(s => s.deleteGraphic);
  const moveGraphicInList = useStore(s => s.moveGraphicInList);
  const reorderGraphic    = useStore(s => s.reorderGraphic);
  const saveProject       = useStore(s => s.saveProject);
  const openPreviewModal  = useStore(s => s.openPreviewModal);
  const closeProject      = useStore(s => s.closeProject);
  const openProjectSettings = useStore(s => s.openProjectSettings);
  const openSceneSettings   = useStore(s => s.openSceneSettings);

  const scene    = getSelectedScene();
  const graphics = scene?.graphics ?? [];
  const hasSelected = !!selectedGraphicId;

  // ── Drag state ─────────────────────────────────────────────────────────────
  const dragFromIdx = useRef(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  const handleDragStart = (idx) => (e) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
    dragFromIdx.current = idx;
    setTimeout(() => { if (e.currentTarget) e.currentTarget.style.opacity = '0.4'; }, 0);
  };

  const handleDragOver = (idx) => (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIdx(idx);
  };

  const handleDrop = (toIdx) => (e) => {
    e.preventDefault();
    setDragOverIdx(null);
    const fromIdx = Number(e.dataTransfer.getData('text/plain'));
    if (isNaN(fromIdx) || fromIdx === toIdx) return;
    reorderGraphic(fromIdx, toIdx);
  };

  const handleDragEnd = (e) => {
    dragFromIdx.current = null;
    setDragOverIdx(null);
    e.currentTarget.style.opacity = '1';
  };

  return (
    <div style={{
      width: isMobile ? '100%' : 248,
      height: isMobile ? '100%' : undefined,
      background: '#111827',
      borderLeft: isMobile ? 'none' : '1px solid #1e293b',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #1e293b', flexShrink: 0 }}>
        <p style={{
          fontSize: 10, fontWeight: 700, color: '#64748b',
          letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10,
        }}>Actions</p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <ActionBtn color="#10b981" onClick={saveProject} icon="💾">Save</ActionBtn>
          <ActionBtn color="#3b82f6" onClick={openPreviewModal} icon="▶">Preview</ActionBtn>
          <ActionBtn color="#ef4444" onClick={closeProject} icon="✕">Close</ActionBtn>
        </div>

        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <ActionBtn color="#8b5cf6" onClick={openSceneSettings} icon="🎬" small>Scene</ActionBtn>
          <ActionBtn color="#f59e0b" onClick={openProjectSettings} icon="⚙" small>Project</ActionBtn>
        </div>
      </div>

      {/* Items list header */}
      <div style={{
        padding: '8px 14px 6px', borderBottom: '1px solid #1e293b',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
      }}>
        <span style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5 }}>
          Items ({graphics.length})
        </span>
        {hasSelected && (
          <div style={{ display: 'flex', gap: 4 }}>
            <SmallBtn title="Move Up"   onClick={() => moveGraphicInList(selectedGraphicId, -1)}>↑</SmallBtn>
            <SmallBtn title="Move Down" onClick={() => moveGraphicInList(selectedGraphicId,  1)}>↓</SmallBtn>
            <SmallBtn title="Delete" danger onClick={() => deleteGraphic(selectedGraphicId)}>🗑</SmallBtn>
          </div>
        )}
      </div>

      {/* Scrollable items list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
        {graphics.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: 120, color: '#374151', gap: 8,
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            <p style={{ fontSize: 12, textAlign: 'center' }}>No items yet.<br/>Add from Library.</p>
          </div>
        ) : (
          graphics.map((g, idx) => (
            <GraphicListItem
              key={g.id}
              graphic={g}
              isSelected={selectedGraphicId === g.id}
              isDragOver={dragOverIdx === idx}
              onDragStart={handleDragStart(idx)}
              onDragOver={handleDragOver(idx)}
              onDrop={handleDrop(idx)}
              onDragEnd={handleDragEnd}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ActionBtn({ color, onClick, icon, children, small }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: small ? '1 1 60px' : '1 1 70px',
        padding: small ? '5px 4px' : '6px 4px',
        background: color + '20',
        border: `1px solid ${color}50`,
        borderRadius: 6, color,
        fontSize: small ? 10 : 11, cursor: 'pointer', fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = color + '40'}
      onMouseLeave={e => e.currentTarget.style.background = color + '20'}
    >
      <span>{icon}</span> {children}
    </button>
  );
}

function SmallBtn({ children, onClick, title, danger }) {
  const color = danger ? '#ef4444' : '#64748b';
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        padding: '3px 7px', background: color + '20',
        border: `1px solid ${color}40`, borderRadius: 4,
        color, fontSize: 12, cursor: 'pointer', fontWeight: 700,
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = color + '40'}
      onMouseLeave={e => e.currentTarget.style.background = color + '20'}
    >
      {children}
    </button>
  );
}