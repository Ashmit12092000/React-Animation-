import { useCallback, useRef, useState } from 'react';
import { useStore } from '../../store';
import SceneThumbnail from './SceneThumbnail';
import { useMobile } from '../../hooks/useMobile';

export default function EditorTimeline() {
  const isMobile = useMobile();
  const project         = useStore(s => s.project);
  const selectedSceneId = useStore(s => s.selectedSceneId);
  const addScene        = useStore(s => s.addScene);
  const moveScene       = useStore(s => s.moveScene);

  const dragFromIdx   = useRef(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  const handleDragStart = useCallback((idx) => (e) => {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/scene-index', String(idx));
    dragFromIdx.current = idx;
    setTimeout(() => { if (e.currentTarget) e.currentTarget.style.opacity = '0.4'; }, 0);
  }, []);

  const handleDragOver = useCallback((idx) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIdx !== idx) setDragOverIdx(idx);
  }, [dragOverIdx]);

  const handleDrop = useCallback((toIdx) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIdx(null);
    const fromIdx = Number(e.dataTransfer.getData('application/scene-index'));
    if (isNaN(fromIdx) || fromIdx === toIdx) return;
    moveScene(fromIdx, toIdx);
  }, [moveScene]);

  const handleDragEnd = useCallback((e) => {
    if (e.currentTarget) e.currentTarget.style.opacity = '1';
    dragFromIdx.current = null;
    setDragOverIdx(null);
  }, []);

  const handleDragLeave = useCallback((idx) => (e) => {
    // Only clear if we're leaving this thumbnail entirely (not just entering a child)
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverIdx(prev => prev === idx ? null : prev);
    }
  }, []);

  if (!project) return null;
  const scenes = project.scenes;

  return (
    <div style={{
      height: isMobile ? 80 : 120,
      background: '#0f172a',
      borderTop: '1px solid #1e293b',
      display: 'flex',
      alignItems: 'center',
      padding: isMobile ? '0 8px' : '0 20px',
      gap: isMobile ? 6 : 12,
      overflowX: 'auto',
      flexShrink: 0,
    }}>
      {!isMobile && (
        <div style={{
          color: '#475569', fontSize: 10,
          fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: 1.5, flexShrink: 0,
          writingMode: 'vertical-rl',
          transform: 'rotate(180deg)',
          userSelect: 'none',
        }}>
          Timeline
        </div>
      )}

      {scenes.map((scene, idx) => (
        <SceneThumbnail
          key={scene.id}
          scene={scene}
          index={idx}
          totalScenes={scenes.length}
          isSelected={scene.id === selectedSceneId}
          isDragOver={dragOverIdx === idx}
          onDragStart={handleDragStart(idx)}
          onDragOver={handleDragOver(idx)}
          onDrop={handleDrop(idx)}
          onDragEnd={handleDragEnd}
          onDragLeave={handleDragLeave(idx)}
        />
      ))}

      <button
        onClick={addScene}
        title="Add Scene"
        style={{
          width: isMobile ? 44 : 72, height: isMobile ? 44 : 72,
          background: '#1e293b',
          border: '2px dashed #334155',
          borderRadius: 8, color: '#64748b',
          fontSize: 28, cursor: 'pointer', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.color = '#f59e0b'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.color = '#64748b'; }}
      >
        +
      </button>
    </div>
  );
}