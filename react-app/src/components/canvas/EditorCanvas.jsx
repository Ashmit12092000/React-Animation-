import { useRef, useCallback, useEffect } from 'react';
import { useStore } from '../../store';
import GraphicItem from './GraphicItem';
import WhiteboardHand from '../shared/WhiteboardHand';
import { getBoardStyle } from '../../utils/animation';

const CANVAS_W = 800;
const CANVAS_H = 450;

function buildSequentialTimeline(graphics) {
  let cursor = 0;
  return graphics.map(g => {
    const seqDelay = cursor;
    cursor += g.duration;
    return { ...g, seqDelay };
  });
}

export default function EditorCanvas({ playing = false }) {
  const getSelectedScene  = useStore(s => s.getSelectedScene);
  const selectedGraphicId = useStore(s => s.selectedGraphicId);
  const selectGraphic     = useStore(s => s.selectGraphic);
  const project           = useStore(s => s.project);

  const scene      = getSelectedScene();
  const boardStyle = getBoardStyle(project?.boardType ?? 'whiteboard');
  const timeline   = scene ? buildSequentialTimeline(scene.graphics) : [];

  const tipRef       = useRef({ active: false });
  const canvasRef    = useRef(null);
  const activeIdRef  = useRef(null);
  const playStartRef = useRef(null);

  useEffect(() => {
    if (playing) playStartRef.current = performance.now();
    else         playStartRef.current = null;
  }, [playing]);

  const makeTipHandler = useCallback((graphicId) => (info) => {
    if (info.active) {
      activeIdRef.current = graphicId;
      tipRef.current = info;
    } else if (activeIdRef.current === graphicId) {
      activeIdRef.current = null;
      tipRef.current = { active: false };
    }
  }, []);

  const handleCanvasClick = (e) => {
    // Only deselect if the click landed directly on the canvas background,
    // not on a child graphic item. e.target === e.currentTarget means the
    // click was on the canvas div itself, not bubbled up from a child.
    if (e.target === e.currentTarget) {
      selectGraphic(null);
    }
  };

  return (
    <div
      ref={canvasRef}
      style={{
        position: 'relative', width: CANVAS_W, height: CANVAS_H,
        ...boardStyle,
        borderRadius: 6, overflow: playing ? 'visible' : 'hidden',
        boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
        flexShrink: 0,
      }}
      onClick={handleCanvasClick}
    >
      {timeline.map(g => (
        <GraphicItem
          key={g.id}
          graphic={g}
          isSelected={selectedGraphicId === g.id}
          playing={playing}
          seqDelay={g.seqDelay}
          onTipMove={makeTipHandler(g.id)}
          playStartTime={playStartRef.current}
        />
      ))}

      {playing && <WhiteboardHand tipRef={tipRef} canvasRef={canvasRef} />}

      {(!scene || scene.graphics.length === 0) && !playing && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
          color: project?.boardType === 'whiteboard' ? '#d1d5db' : '#3a5a3a',
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
          <p style={{ marginTop: 12, fontSize: 14, fontFamily: 'Georgia, serif' }}>
            Add items from the Library panel
          </p>
        </div>
      )}
    </div>
  );
}