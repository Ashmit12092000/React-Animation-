import { useEffect, useRef, useState } from 'react';

// Paint brush SVG (inline, no external file needed)
const BRUSH_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 320" fill="none">
  <!-- Handle -->
  <rect x="88" y="10" width="24" height="140" rx="5" fill="#8B4513" stroke="#5a2d0c" stroke-width="3"/>
  <!-- Ferrule (metal band) -->
  <rect x="84" y="130" width="32" height="22" rx="3" fill="#aaa" stroke="#888" stroke-width="2"/>
  <!-- Bristle body -->
  <path d="M84,152 C84,152 76,170 74,195 C72,218 80,245 100,258 C120,245 128,218 126,195 C124,170 116,152 116,152 Z"
    fill="#d97706" stroke="#b45309" stroke-width="2"/>
  <!-- Bristle tip highlight -->
  <path d="M92,200 C90,215 94,238 100,252 C106,238 110,215 108,200 Z"
    fill="#fbbf24" opacity="0.6"/>
  <!-- Paint drip 1 -->
  <ellipse cx="96" cy="268" rx="5" ry="9" fill="#3b82f6" opacity="0.9"/>
  <!-- Paint drip 2 -->
  <ellipse cx="104" cy="278" rx="4" ry="7" fill="#3b82f6" opacity="0.7"/>
</svg>`;

// Tip of brush relative to the SVG viewBox (200x320)
const BRUSH_VB_W  = 200;
const BRUSH_VB_H  = 320;
const TIP_X       = 100;   // center-bottom of bristle tip
const TIP_Y       = 258;
const BRUSH_PX    = 120;
const BRUSH_PX_H  = BRUSH_PX * (BRUSH_VB_H / BRUSH_VB_W);
const TIP_FRAC_X  = TIP_X / BRUSH_VB_W;
const TIP_FRAC_Y  = TIP_Y / BRUSH_VB_H;

// Paint splatter SVG overlay that follows brush tip
function PaintSplatter({ color = '#3b82f6', x, y, visible }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: x - 18,
        top: y - 18,
        width: 36,
        height: 36,
        pointerEvents: 'none',
        zIndex: 19,
        opacity: visible ? 0.7 : 0,
        transition: 'opacity 0.1s',
      }}
    >
      <svg viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
        <circle cx="18" cy="18" r="5" fill={color} opacity="0.9"/>
        <circle cx="10" cy="12" r="3" fill={color} opacity="0.7"/>
        <circle cx="26" cy="13" r="2.5" fill={color} opacity="0.6"/>
        <circle cx="11" cy="25" r="2" fill={color} opacity="0.5"/>
        <circle cx="24" cy="24" r="3" fill={color} opacity="0.65"/>
        <circle cx="18" cy="8" r="2" fill={color} opacity="0.5"/>
      </svg>
    </div>
  );
}

export default function PaintBrushHand({ tipRef, canvasRef, activePaintColor = '#3b82f6' }) {
  const brushRef = useRef(null);
  const rafRef   = useRef(null);
  const [splatPos, setSplatPos] = useState({ x: 0, y: 0, visible: false });

  const blobUrl = useRef(null);
  const [brushSrc, setBrushSrc] = useState(null);

  useEffect(() => {
    // Convert inline SVG to object URL
    const blob = new Blob([BRUSH_SVG], { type: 'image/svg+xml' });
    const url  = URL.createObjectURL(blob);
    blobUrl.current = url;
    setBrushSrc(url);
    return () => URL.revokeObjectURL(url);
  }, []);

  useEffect(() => {
    const brush = brushRef.current;
    if (!brush) return;

    const loop = () => {
      const tip    = tipRef.current;
      const canvas = canvasRef.current;

      if (!tip?.active || !canvas) {
        brush.style.opacity = '0';
        setSplatPos(p => p.visible ? { ...p, visible: false } : p);
      } else {
        const cr = canvas.getBoundingClientRect();
        const cx = tip.screenX - cr.left;
        const cy = tip.screenY - cr.top;

        brush.style.opacity = '1';
        brush.style.left    = `${cx - (TIP_FRAC_X * BRUSH_PX)}px`;
        brush.style.top     = `${cy - (TIP_FRAC_Y * BRUSH_PX_H)}px`;

        // Small oscillation for a "painting" feel
        const t = Date.now() / 120;
        const wobbleX = Math.sin(t) * 3;
        const wobbleY = Math.cos(t * 1.3) * 2;
        brush.style.transform = `rotate(${wobbleX}deg) translate(${wobbleX * 0.5}px, ${wobbleY * 0.3}px)`;

        setSplatPos({ x: cx, y: cy, visible: true });
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tipRef, canvasRef]);

  if (!brushSrc) return null;

  return (
    <>
      <PaintSplatter
        color={activePaintColor}
        x={splatPos.x}
        y={splatPos.y}
        visible={splatPos.visible}
      />
      <img
        ref={brushRef}
        src={brushSrc}
        alt=""
        style={{
          position:      'absolute',
          width:         BRUSH_PX,
          height:        BRUSH_PX_H,
          pointerEvents: 'none',
          zIndex:        20,
          opacity:       0,
          left:          -BRUSH_PX,
          top:           -BRUSH_PX_H,
          transformOrigin: 'bottom center',
          transition: 'opacity 0.15s',
          filter: `drop-shadow(0 4px 8px rgba(0,0,0,0.3)) hue-rotate(${
            activePaintColor ? '0deg' : '0deg'
          })`,
        }}
      />
    </>
  );
}
