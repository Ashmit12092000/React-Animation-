import { useRef, useState } from 'react';
import SvgRenderer from '../shared/SvgRenderer';
import { getEffectiveFontFamily } from '../../services/fontService';
import AnimatedSvgRenderer from '../shared/AnimatedSvgRenderer';
import AnimatedTextReveal from '../shared/AnimatedTextReveal';
import AnimatedImageReveal from '../shared/AnimatedImageReveal';
import ContextMenu, { getEntryEffectStyle, ENTRY_EFFECTS } from './ContextMenu';
import { useStore } from '../../store';

// Eight resize handle positions
const HANDLES = [
  { id: 'nw', cursor: 'nw-resize', top: -5,   left: -5 },
  { id: 'n',  cursor: 'n-resize',  top: -5,   left: '50%', transform: 'translateX(-50%)' },
  { id: 'ne', cursor: 'ne-resize', top: -5,   right: -5 },
  { id: 'e',  cursor: 'e-resize',  top: '50%',right: -5,  transform: 'translateY(-50%)' },
  { id: 'se', cursor: 'se-resize', bottom: -5,right: -5 },
  { id: 's',  cursor: 's-resize',  bottom: -5,left: '50%',transform: 'translateX(-50%)' },
  { id: 'sw', cursor: 'sw-resize', bottom: -5,left: -5 },
  { id: 'w',  cursor: 'w-resize',  top: '50%',left: -5,   transform: 'translateY(-50%)' },
];

export default function GraphicItem({ graphic, isSelected, playing, onTipMove, seqDelay, playStartTime }) {
  const moveGraphic   = useStore(s => s.moveGraphic);
  const resizeGraphic = useStore(s => s.resizeGraphic);
  const rotateGraphic = useStore(s => s.rotateGraphic);
  const selectGraphic = useStore(s => s.selectGraphic);

  const dragState      = useRef(null);
  const pinchState     = useRef(null);
  const containerRef   = useRef(null);
  const longPressTimer = useRef(null);
  const longPressFired = useRef(false);

  const [contextMenu, setContextMenu] = useState(null); // { x, y }
  // previewKey: bump to re-trigger CSS animation on effect change
  const [previewKey, setPreviewKey] = useState(0);

  // ─── Right-click context menu ─────────────────────────────────────────────
  const handleContextMenu = (e) => {
    if (playing) return;
    e.preventDefault();
    e.stopPropagation();
    selectGraphic(graphic.id);
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  // Called from ContextMenu when an effect is picked — re-trigger preview
  const handleEffectPreview = () => {
    setPreviewKey(k => k + 1);
  };

  // ─── Mouse drag to move ───────────────────────────────────────────────────
  const handleMouseDown = (e) => {
    if (playing) return;
    if (e.button === 2) return; // let right-click through
    e.stopPropagation();
    selectGraphic(graphic.id);
    dragState.current = { startX: e.clientX - graphic.x, startY: e.clientY - graphic.y };
    const onMove = (ev) => {
      if (!dragState.current) return;
      moveGraphic(graphic.id, ev.clientX - dragState.current.startX, ev.clientY - dragState.current.startY);
    };
    const onUp = () => {
      dragState.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // ─── Touch drag to move (with long-press → context menu) ─────────────────
  const handleTouchStart = (e) => {
    if (playing) return;
    if (e.touches.length === 2) return;
    e.stopPropagation();
    selectGraphic(graphic.id);
    longPressFired.current = false;
    const t = e.touches[0];

    // Long-press: 500ms hold opens context menu
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      dragState.current = null;
      setContextMenu({ x: t.clientX, y: t.clientY });
      if (navigator.vibrate) navigator.vibrate(40);
    }, 500);

    dragState.current = { startX: t.clientX - graphic.x, startY: t.clientY - graphic.y };

    const onMove = (ev) => {
      if (ev.touches.length !== 1) return;
      const touch = ev.touches[0];
      // Cancel long press if finger moves more than 6px
      if (Math.hypot(touch.clientX - t.clientX, touch.clientY - t.clientY) > 6) {
        clearTimeout(longPressTimer.current);
      }
      if (!dragState.current || longPressFired.current) return;
      moveGraphic(graphic.id, touch.clientX - dragState.current.startX, touch.clientY - dragState.current.startY);
    };
    const onEnd = () => {
      clearTimeout(longPressTimer.current);
      dragState.current = null;
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
  };

  // ─── Mobile pinch-to-resize ───────────────────────────────────────────────
  const handlePinchStart = (e) => {
    if (playing || e.touches.length < 2) return;
    e.stopPropagation();
    selectGraphic(graphic.id);
    const t1 = e.touches[0], t2 = e.touches[1];
    const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
    pinchState.current = { startDist: dist, startW: graphic.width, startH: graphic.height, aspect: graphic.height / graphic.width };
    const onMove = (ev) => {
      if (!pinchState.current || ev.touches.length < 2) return;
      ev.preventDefault();
      const a = ev.touches[0], b = ev.touches[1];
      const newDist = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
      const scale = newDist / pinchState.current.startDist;
      const newW = Math.max(30, pinchState.current.startW * scale);
      resizeGraphic(graphic.id, newW, newW * pinchState.current.aspect);
    };
    const onEnd = () => {
      pinchState.current = null;
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
  };

  // ─── Mouse resize handle ──────────────────────────────────────────────────
  const handleResizeDown = (handleId) => (e) => {
    if (playing) return;
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX, startY = e.clientY;
    const startW = graphic.width, startH = graphic.height;
    const startGX = graphic.x, startGY = graphic.y;
    const onMove = (ev) => {
      const dx = ev.clientX - startX, dy = ev.clientY - startY;
      let newW = startW, newH = startH, newX = startGX, newY = startGY;
      if (handleId.includes('e')) newW = Math.max(30, startW + dx);
      if (handleId.includes('w')) { newW = Math.max(30, startW - dx); newX = startGX + (startW - newW); }
      if (handleId.includes('s')) newH = Math.max(20, startH + dy);
      if (handleId.includes('n')) { newH = Math.max(20, startH - dy); newY = startGY + (startH - newH); }
      resizeGraphic(graphic.id, newW, newH, newX, newY);
    };
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // ─── Rotate handle ────────────────────────────────────────────────────────
  const handleRotateDown = (e) => {
    if (playing) return;
    e.stopPropagation();
    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    const startAngle = (graphic.rotation ?? 0);
    const startPointerAngle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);
    const onMove = (ev) => {
      const pointerAngle = Math.atan2(ev.clientY - cy, ev.clientX - cx) * (180 / Math.PI);
      rotateGraphic(graphic.id, startAngle + (pointerAngle - startPointerAngle));
    };
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const activeDelay = seqDelay ?? graphic.delay;
  const rotation    = graphic.rotation ?? 0;
  const entryEffect = graphic.entryEffect ?? 'none';

  // Entry effect style — applied during playback AND as a real-time preview
  // when not playing (triggered by previewKey change)
  const effectStyle = playing
    ? getEntryEffectStyle(entryEffect, Math.min(graphic.duration * 0.6, 1.0))
    : {};

  // After context-menu effect pick: show preview animation briefly
  const previewStyle = !playing && previewKey > 0
    ? getEntryEffectStyle(entryEffect, 0.7)
    : {};

  return (
    <>
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onContextMenu={handleContextMenu}
        onTouchStart={(e) => { if (e.touches.length >= 2) handlePinchStart(e); else handleTouchStart(e); }}
        key={previewKey} // re-mount triggers CSS animation restart
        style={{
          position: 'absolute',
          left: graphic.x, top: graphic.y,
          width: graphic.width, height: graphic.height,
          transform: `rotate(${rotation}deg)`,
          transformOrigin: 'center center',
          cursor: playing ? 'default' : 'move',
          outline: !playing && isSelected ? '2px solid #3b82f6' : 'none',
          outlineOffset: 1,
          boxSizing: 'border-box',
          userSelect: 'none',
          touchAction: 'none',
          ...effectStyle,
          ...previewStyle,
        }}
      >
        {/* ── Content ── */}
        {graphic.type === 'drawing' ? (
          playing ? (
            <AnimatedSvgRenderer
              key={`${graphic.id}-playing`}
              svg={graphic.svgText}
              style={{ width: '100%', height: '100%', display: 'block' }}
              playing={playing}
              duration={graphic.duration}
              delay={activeDelay}
              onTipMove={onTipMove}
            />
          ) : <SvgRenderer svg={graphic.svgText} style={{ width: '100%', height: '100%', display: 'block' }} />
        ) : graphic.type === 'image' ? (
          playing ? (
            <AnimatedImageReveal
              key={`${graphic.id}-playing`}
              src={graphic.src}
              playing={playing}
              duration={graphic.duration}
              delay={activeDelay}
              revealEffect={graphic.revealEffect}
              onTipMove={onTipMove}
            />
          ) : (
            <img src={graphic.src} alt={graphic.name} draggable={false}
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', userSelect: 'none' }} />
          )
        ) : playing ? (
          <AnimatedTextReveal
            key={`${graphic.id}-playing`}
            graphic={graphic}
            playing={playing}
            duration={graphic.duration}
            delay={activeDelay}
            onTipMove={onTipMove}
            playStartTime={playStartTime}
          />
        ) : <StaticText graphic={graphic} />}

        {/* ── Selection handles ── */}
        {isSelected && !playing && (
          <>
            {/* Rotate handle */}
            <div onMouseDown={handleRotateDown} title="Rotate"
              style={{
                position: 'absolute', top: -32, left: '50%', transform: 'translateX(-50%)',
                width: 20, height: 20, background: '#8b5cf6', border: '2px solid #fff',
                borderRadius: '50%', cursor: 'grab', zIndex: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6"/>
                <path d="M21.34 15.57a10 10 0 1 1-.57-8.38"/>
              </svg>
            </div>
            <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', width: 1, height: 12, background: '#3b82f6', pointerEvents: 'none' }} />

            {/* 8 resize handles */}
            {HANDLES.map(h => (
              <div key={h.id} onMouseDown={handleResizeDown(h.id)}
                style={{
                  position: 'absolute',
                  top: h.top, left: h.left, bottom: h.bottom, right: h.right,
                  transform: h.transform,
                  width: 10, height: 10,
                  background: '#3b82f6', border: '2px solid #fff',
                  borderRadius: 2, cursor: h.cursor, zIndex: 5,
                }} />
            ))}

            {/* Label + effect badge */}
            <div style={{
              position: 'absolute', top: -22, left: 0,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <div style={{
                background: '#3b82f6', color: '#fff',
                fontSize: 10, padding: '2px 6px', borderRadius: 4,
                whiteSpace: 'nowrap', pointerEvents: 'none',
                fontFamily: 'system-ui', fontWeight: 600,
              }}>{graphic.name}</div>
              {entryEffect !== 'none' && (
                <div style={{
                  background: '#7c3aed', color: '#fff',
                  fontSize: 10, padding: '2px 5px', borderRadius: 4,
                  whiteSpace: 'nowrap', pointerEvents: 'none',
                  fontFamily: 'system-ui', fontWeight: 600,
                }}>
                  {ENTRY_EFFECTS.find(e => e.id === entryEffect)?.icon} {ENTRY_EFFECTS.find(e => e.id === entryEffect)?.label}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Context menu — rendered outside the graphic div to avoid clipping */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          graphicId={graphic.id}
          onClose={() => {
            setContextMenu(null);
            handleEffectPreview();
          }}
        />
      )}
    </>
  );
}

function StaticText({ graphic }) {
  // Use the same font the animation engine renders so static ↔ animated match exactly
  const effectiveFont = getEffectiveFontFamily(graphic.fontFamily);
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center',
      overflow: 'hidden', whiteSpace: 'pre-wrap',
      fontFamily: effectiveFont, fontWeight: graphic.fontWeight,
      fontStyle: graphic.fontStyle, fontSize: graphic.fontSize,
      lineHeight: 1.2,
      color: graphic.color || '#1a1a1a',
    }}>{graphic.rawText}</div>
  );
}