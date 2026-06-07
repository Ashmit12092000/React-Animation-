import { useEffect, useRef, useState } from 'react';

/**
 * AnimatedPaintReveal
 *
 * Simulates a paint-brush sweeping across an image, revealing it stroke
 * by stroke — the way VideoScribe / Doodly do "paint" mode.
 *
 * HOW IT WORKS (VideoScribe-style):
 *   1. Analyse the image to find a set of horizontal brush strokes that
 *      together cover every pixel.  Strokes zig-zag top-to-bottom like a
 *      real painter would lay paint.
 *   2. At each animation frame, expand the revealed mask by extending the
 *      current stroke a little further.
 *   3. A composite canvas draws the original image clipped to the revealed
 *      mask, giving the appearance of wet paint spreading from a brush.
 *   4. The brush tip position is emitted via onTipMove so WhiteboardHand
 *      can follow the tip in real time — same contract as every other
 *      Animated* renderer.
 *
 * Brush style options (brushStyle prop):
 *   'flat'   – straight horizontal strokes (default)
 *   'round'  – slightly wavy strokes that overlap, more organic
 *   'marker' – thick overlapping strokes, marker-pen feel
 */
export default function AnimatedPaintReveal({
  src,
  playing,
  duration = 1.5,
  delay = 0,
  brushStyle = 'round',
  onTipMove,
  style,
}) {
  const containerRef = useRef(null);
  const canvasRef    = useRef(null);
  const rafRef       = useRef(null);
  const startRef     = useRef(null);
  const strokesRef   = useRef(null);   // [{ path, length, cumLen }]
  const totalLenRef  = useRef(0);

  const [ready, setReady] = useState(false);

  // ── Build stroke data when src or brushStyle changes ──────────────────────
  useEffect(() => {
    setReady(false);
    strokesRef.current = null;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const W = 200;
      const H = Math.round((img.naturalHeight / img.naturalWidth) * W);

      const strokes = buildBrushStrokes(W, H, brushStyle);
      strokesRef.current = strokes;
      totalLenRef.current = strokes.reduce((s, k) => s + k.length, 0);
      setReady(true);
    };
    img.src = src;
  }, [src, brushStyle]);

  // ── Animation loop ─────────────────────────────────────────────────────────
  useEffect(() => {
    cancelAnimationFrame(rafRef.current);

    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!playing || !ready) {
      // Static: show the image fully
      drawFull(canvas, src);
      onTipMove?.({ active: false });
      return;
    }

    startRef.current = null;

    const tick = (now) => {
      if (!startRef.current) startRef.current = now;
      const elapsed = (now - startRef.current) / 1000;

      if (elapsed < delay) {
        onTipMove?.({ active: false });
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const t = Math.min(1, (elapsed - delay) / Math.max(0.01, duration));

      const tipPt = paintFrame(canvas, src, strokesRef.current, totalLenRef.current, t);

      if (onTipMove && containerRef.current && tipPt) {
        const rect = containerRef.current.getBoundingClientRect();
        const scaleX = rect.width  / canvas.width;
        const scaleY = rect.height / canvas.height;
        onTipMove({
          active: t < 1,
          screenX: rect.left + tipPt.x * scaleX,
          screenY: rect.top  + tipPt.y * scaleY,
        });
      }

      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else       onTipMove?.({ active: false });
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(rafRef.current); onTipMove?.({ active: false }); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, duration, delay, ready, src]);

  // ── Resize: keep canvas pixels matching DOM size ───────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const c = canvasRef.current;
      if (!c) return;
      c.width  = el.clientWidth  || 300;
      c.height = el.clientHeight || 200;
      if (strokesRef.current) {
        const t = playing ? 0 : 1;
        if (t === 1) drawFull(c, src);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [playing, src]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%', height: '100%',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          display: 'block',
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stroke generation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build an array of brush strokes that together cover the entire canvas.
 * Each stroke is { points: [{x,y}], length, cumLen }.
 *
 * Strategy (VideoScribe-style):
 *   – Divide the canvas into horizontal bands.
 *   – Alternate the sweep direction per row (left→right, right→left).
 *   – Add slight vertical wobble for organic feel (especially 'round' style).
 */
function buildBrushStrokes(W, H, style) {
  const strokes = [];

  // Overlap factor: how much adjacent strokes overlap (0 = no gap, no overlap)
  const overlapFactor = style === 'marker' ? 0.35 : style === 'round' ? 0.4 : 0.25;
  const brushH = Math.max(4, Math.round(H * (style === 'marker' ? 0.12 : 0.08)));
  const step   = Math.round(brushH * (1 - overlapFactor));

  let rowIdx = 0;
  for (let y = 0; y < H; y += step, rowIdx++) {
    const leftToRight = rowIdx % 2 === 0;
    const cx = leftToRight ? 0 : W;
    const ex = leftToRight ? W : 0;
    const midY = y + brushH / 2;

    // Build points along stroke with optional wave
    const pts = [];
    const numPts = Math.max(3, Math.round(W / 8));

    for (let i = 0; i <= numPts; i++) {
      const frac = i / numPts;
      const px   = cx + (ex - cx) * frac;

      let py = midY;
      if (style === 'round') {
        // Sine wobble — peak at mid-stroke
        py += Math.sin(frac * Math.PI * 2) * (brushH * 0.25);
      } else if (style === 'marker') {
        // Slight random jitter
        py += (Math.random() - 0.5) * (brushH * 0.1);
      }

      pts.push({ x: px, y: py });
    }

    // Cumulative length
    let len = 0;
    const cumLen = [0];
    for (let i = 1; i < pts.length; i++) {
      len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      cumLen.push(len);
    }

    strokes.push({ pts, length: len, cumLen, brushH, leftToRight });
  }

  return strokes;
}

// ─────────────────────────────────────────────────────────────────────────────
// Drawing
// ─────────────────────────────────────────────────────────────────────────────

// Reusable offscreen image cache
const _imgCache = new Map();

function getImage(src) {
  if (_imgCache.has(src)) return _imgCache.get(src);
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = src;
  _imgCache.set(src, img);
  return img;
}

/**
 * Draw the full image onto canvas (no mask).
 */
function drawFull(canvas, src) {
  const ctx = canvas.getContext('2d');
  const img = getImage(src);

  const drawIt = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };

  if (img.complete && img.naturalWidth > 0) {
    drawIt();
  } else {
    img.onload = drawIt;
  }
}

/**
 * Paint frame at global progress t (0–1).
 * Uses destination-in compositing so the image is only revealed inside
 * the painted mask — the key to the "paint brush reveals image" trick.
 *
 * Returns the screen-space tip { x, y } of the active brush tip, or null.
 */
function paintFrame(canvas, src, strokes, totalLen, t) {
  if (!strokes || strokes.length === 0) return null;

  const W = canvas.width;
  const H = canvas.height;
  const ctx = canvas.getContext('2d');

  // --- Step 1: Build the revealed mask on an offscreen canvas ----------------
  const mask = getOrCreateMask(W, H);
  const mCtx = mask.getContext('2d');
  mCtx.clearRect(0, 0, W, H);

  const drawn = totalLen * t;
  let accumulated = 0;
  let tipPt = null;

  // Scale strokes from their build space (200-wide) to current canvas size
  const srcW  = 200;
  const srcH  = strokes.length > 0 ? estimateSrcH(strokes) : 200;
  const scaleX = W / srcW;
  const scaleY = H / srcH;

  mCtx.lineCap  = 'round';
  mCtx.lineJoin = 'round';
  mCtx.fillStyle   = '#000';
  mCtx.strokeStyle = '#000';

  for (const stroke of strokes) {
    const strokeEnd = accumulated + stroke.length;
    const brushW    = Math.max(2, stroke.brushH * scaleY * 1.6); // brush radius
    mCtx.lineWidth  = brushW;

    if (strokeEnd <= drawn) {
      // Fully drawn stroke — render entire path
      renderScaledPolyline(mCtx, stroke.pts, scaleX, scaleY);
      mCtx.stroke();
    } else if (accumulated < drawn) {
      // Partially drawn
      const localDraw = drawn - accumulated;
      const partialPts = getPartialPoints(stroke, localDraw);
      renderScaledPolyline(mCtx, partialPts, scaleX, scaleY);
      mCtx.stroke();

      const last = partialPts[partialPts.length - 1];
      if (last) tipPt = { x: last.x * scaleX, y: last.y * scaleY };
    }
    // else: not yet reached — skip

    accumulated = strokeEnd;
    if (accumulated > drawn && tipPt) break;
  }

  // --- Step 2: Composite image through mask ----------------------------------
  ctx.clearRect(0, 0, W, H);

  const img = getImage(src);
  if (!img.complete || img.naturalWidth === 0) {
    // Image not loaded yet — just paint the mask as a placeholder
    ctx.drawImage(mask, 0, 0);
    return tipPt;
  }

  // Draw image
  ctx.save();
  ctx.drawImage(img, 0, 0, W, H);

  // Clip to mask using destination-in: keeps only pixels covered by mask
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(mask, 0, 0);
  ctx.restore();

  return tipPt;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// One shared mask canvas (resized as needed)
let _maskCanvas = null;
function getOrCreateMask(W, H) {
  if (!_maskCanvas) _maskCanvas = document.createElement('canvas');
  if (_maskCanvas.width !== W || _maskCanvas.height !== H) {
    _maskCanvas.width  = W;
    _maskCanvas.height = H;
  }
  return _maskCanvas;
}

function renderScaledPolyline(ctx, pts, scaleX, scaleY) {
  if (pts.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(pts[0].x * scaleX, pts[0].y * scaleY);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i].x * scaleX, pts[i].y * scaleY);
  }
}

function getPartialPoints(stroke, localDraw) {
  const { pts, cumLen } = stroke;
  const result = [];
  for (let i = 0; i < pts.length; i++) {
    if (cumLen[i] <= localDraw) {
      result.push(pts[i]);
    } else {
      if (i > 0) {
        const segLen = cumLen[i] - cumLen[i - 1];
        const frac   = segLen > 0 ? (localDraw - cumLen[i - 1]) / segLen : 0;
        result.push({
          x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * frac,
          y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * frac,
        });
      }
      break;
    }
  }
  return result;
}

/** Infer the original coordinate space height from the last stroke's midY */
function estimateSrcH(strokes) {
  const lastStroke = strokes[strokes.length - 1];
  if (!lastStroke || lastStroke.pts.length === 0) return 200;
  const maxY = Math.max(...lastStroke.pts.map(p => p.y)) + lastStroke.brushH;
  return maxY;
}
