import { useEffect, useRef, useState } from 'react';

const HAND_SVG_URL = process.env.PUBLIC_URL + '/hand-pencil.svg';

// ── Tip calibration for hand_pencil.svg (viewBox 0 0 408 510) ─────────────────
const HAND_VIEWBOX_W = 408;
const HAND_VIEWBOX_H = 510;                                          
const TIP_X          = 81;                                           
const TIP_Y          = 131;                                          
const HAND_PX        = 240;                                          

const HAND_PX_H  = HAND_PX * (HAND_VIEWBOX_H / HAND_VIEWBOX_W);    
const TIP_FRAC_X = TIP_X / HAND_VIEWBOX_W;                          
const TIP_FRAC_Y = TIP_Y / HAND_VIEWBOX_H;                          

// ── Module-level SVG preload ──────────────────────────────────────────────────
let _blobUrl     = null;
let _loading     = false;
const _callbacks = [];

function getHandUrl() {
  return _blobUrl ?? HAND_SVG_URL;
}

function preloadHand() {
  if (_blobUrl || _loading) return;
  _loading = true;
  fetch(HAND_SVG_URL)
    .then(r => r.blob())
    .then(blob => {
      _blobUrl = URL.createObjectURL(blob);
      _callbacks.forEach(cb => cb(_blobUrl));
      _callbacks.length = 0;
    })
    .catch(() => { _loading = false; });
}

preloadHand();

// ─────────────────────────────────────────────────────────────────────────────

export default function WhiteboardHand({ tipRef, canvasRef }) {
  const handRef   = useRef(null);
  const rafRef    = useRef(null);
  const [handSrc, setHandSrc] = useState(getHandUrl);

  useEffect(() => {
    if (_blobUrl) { setHandSrc(_blobUrl); return; }
    const cb = (url) => setHandSrc(url);
    _callbacks.push(cb);
    return () => {
      const idx = _callbacks.indexOf(cb);
      if (idx >= 0) _callbacks.splice(idx, 1);
    };
  }, []);

  useEffect(() => {
    const hand = handRef.current;
    if (!hand) return;

    const loop = () => {
      const tip    = tipRef.current;
      const canvas = canvasRef.current;

      if (!tip?.active || !canvas) {
        hand.style.opacity = '0';
      } else {
        const cr = canvas.getBoundingClientRect();
        
        // Account for any difference between canvas internal coordinate resolution 
        // and its visual CSS bounding box size
        const scaleX = cr.width / (canvas.width || cr.width);
        const scaleY = cr.height / (canvas.height || cr.height);

        // Normalize mouse coordinates cleanly against the bounding rectangle
        const cx = (tip.screenX - cr.left);
        const cy = (tip.screenY - cr.top);

        hand.style.opacity = '1';
        hand.style.left    = `${cx - (TIP_FRAC_X * HAND_PX)}px`;
        hand.style.top     = `${cy - (TIP_FRAC_Y * HAND_PX_H)}px`;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tipRef, canvasRef]);

  return (
    <img
      ref={handRef}
      src={handSrc}
      alt=""
      style={{
        position:      'absolute',
        width:         HAND_PX,
        height:        HAND_PX_H,
        pointerEvents: 'none',
        zIndex:        20,
        opacity:       0,
        left:          -HAND_PX,
        top:           -HAND_PX_H,
        transformOrigin: 'top left',
      }}
    />
  );
}