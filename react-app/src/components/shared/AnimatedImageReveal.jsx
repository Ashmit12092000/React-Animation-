import { useEffect, useRef, useState } from 'react';

/**
 * AnimatedImageReveal
 *
 * revealEffect === 'draw'  →  Realistic hand-drawing effect:
 *   1. Downsamples the image to an off-screen canvas.
 *   2. Runs Sobel edge-detection to find outlines.
 *   3. Traces connected edge pixels into polyline paths.
 *   4. Renders those paths on a <canvas> with strokeDashoffset animation,
 *      so strokes grow exactly like SVG drawings.
 *   5. The original <img> fades in underneath as the draw completes.
 *
 * All other effects keep the original clip-path / fade / zoom behaviour.
 *
 * onTipMove emits { active, screenX, screenY } — same contract as
 * AnimatedSvgRenderer so WhiteboardHand works with every effect.
 */
export default function AnimatedImageReveal({
  src,
  playing,
  duration = 1.2,
  delay = 0,
  revealEffect = 'wipe-right',
  onTipMove,
  style,
}) {
  const containerRef = useRef(null);
  const canvasRef    = useRef(null);
  const rafRef       = useRef(null);
  const startRef     = useRef(null);
  const strokesRef   = useRef(null);   // [{ points, length, cumLen }]
  const totalLenRef  = useRef(0);

  const [progress,  setProgress]  = useState(playing ? 0 : 1);
  const [drawReady, setDrawReady] = useState(false);

  // ── Build stroke data whenever src changes (draw mode only) ──────────────
  useEffect(() => {
    if (revealEffect !== 'draw') return;
    setDrawReady(false);
    strokesRef.current = null;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const W = 160, H = Math.round((img.naturalHeight / img.naturalWidth) * W);
      const offscreen = document.createElement('canvas');
      offscreen.width  = W;
      offscreen.height = H;
      const ctx = offscreen.getContext('2d');
      ctx.drawImage(img, 0, 0, W, H);

      const { data } = ctx.getImageData(0, 0, W, H);

      // ── Sobel edge detection ──────────────────────────────────────────────
      const gray = new Float32Array(W * H);
      for (let i = 0; i < W * H; i++) {
        const p = i * 4;
        gray[i] = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
      }

      const edge = new Uint8Array(W * H);
      const THRESHOLD = 28;
      for (let y = 1; y < H - 1; y++) {
        for (let x = 1; x < W - 1; x++) {
          const idx = y * W + x;
          const gx =
            -gray[(y-1)*W+(x-1)] + gray[(y-1)*W+(x+1)]
            - 2*gray[y*W+(x-1)]  + 2*gray[y*W+(x+1)]
            - gray[(y+1)*W+(x-1)]+ gray[(y+1)*W+(x+1)];
          const gy =
            -gray[(y-1)*W+(x-1)] - 2*gray[(y-1)*W+x] - gray[(y-1)*W+(x+1)]
            + gray[(y+1)*W+(x-1)] + 2*gray[(y+1)*W+x] + gray[(y+1)*W+(x+1)];
          edge[idx] = Math.sqrt(gx*gx + gy*gy) > THRESHOLD ? 1 : 0;
        }
      }

      // ── Trace connected strokes via BFS walks ─────────────────────────────
      const visited = new Uint8Array(W * H);
      const DIRS = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
      const strokes = [];

      for (let sy = 0; sy < H; sy++) {
        for (let sx = 0; sx < W; sx++) {
          const start = sy * W + sx;
          if (!edge[start] || visited[start]) continue;

          // Walk greedily along connected edge pixels
          const pts = [{ x: sx, y: sy }];
          visited[start] = 1;
          let cx = sx, cy = sy;

          // eslint-disable-next-line no-constant-condition
          while (true) {
            let found = false;
            // prefer 4-connected first for smoother strokes
            for (const [dx, dy] of DIRS) {
              const nx = cx + dx, ny = cy + dy;
              if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
              const ni = ny * W + nx;
              if (edge[ni] && !visited[ni]) {
                visited[ni] = 1;
                cx = nx; cy = ny;
                pts.push({ x: cx, y: cy });
                found = true;
                break;
              }
            }
            if (!found) break;
          }

          if (pts.length < 3) continue; // skip noise

          // Compute cumulative arc length
          let len = 0;
          const cumLen = [0];
          for (let i = 1; i < pts.length; i++) {
            len += Math.hypot(pts[i].x - pts[i-1].x, pts[i].y - pts[i-1].y);
            cumLen.push(len);
          }

          strokes.push({ pts, length: len, cumLen });
        }
      }

      // Sort longest strokes first (more impactful reveal)
      strokes.sort((a, b) => b.length - a.length);

      strokesRef.current = strokes;
      totalLenRef.current = strokes.reduce((s, k) => s + k.length, 0);
      setDrawReady(true);
    };
    img.src = src;
  }, [src, revealEffect]);

  // ── Animation loop ────────────────────────────────────────────────────────
  useEffect(() => {
    cancelAnimationFrame(rafRef.current);

    if (revealEffect !== 'draw') {
      // ── Non-draw effects: simple progress animation ──────────────────────
      if (!playing) {
        setProgress(1);
        onTipMove?.({ active: false });
        return;
      }
      setProgress(0);
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
        setProgress(t);
        if (onTipMove && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          let screenX, screenY;
          if (revealEffect === 'wipe-right') {
            screenX = rect.left + rect.width * t;
            screenY = rect.top  + rect.height * 0.5;
          } else if (revealEffect === 'wipe-down') {
            screenX = rect.left + rect.width * 0.5;
            screenY = rect.top  + rect.height * t;
          } else {
            screenX = rect.left + rect.width * 0.5;
            screenY = rect.top  + rect.height * 0.5;
          }
          onTipMove({ active: t < 1, screenX, screenY });
        }
        if (t < 1) rafRef.current = requestAnimationFrame(tick);
        else onTipMove?.({ active: false });
      };
      rafRef.current = requestAnimationFrame(tick);
      return () => { cancelAnimationFrame(rafRef.current); onTipMove?.({ active: false }); };
    }

    // ── Draw effect ──────────────────────────────────────────────────────────
    if (!playing || !drawReady) {
      // Show full image statically
      const canvas = canvasRef.current;
      if (!canvas || !strokesRef.current) return;
      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      drawStrokes(ctx, strokesRef.current, W, H, 1.0);
      setProgress(1);
      onTipMove?.({ active: false });
      return;
    }

    setProgress(0);
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
      setProgress(t);

      // Paint strokes up to progress t
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);
        const tipPt = drawStrokes(ctx, strokesRef.current, W, H, t);

        // emit hand tip
        if (onTipMove && containerRef.current && tipPt) {
          const rect = containerRef.current.getBoundingClientRect();
          const scaleX = rect.width  / W;
          const scaleY = rect.height / H;
          onTipMove({
            active: t < 1,
            screenX: rect.left + tipPt.x * scaleX,
            screenY: rect.top  + tipPt.y * scaleY,
          });
        }
      }

      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else onTipMove?.({ active: false });
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(rafRef.current); onTipMove?.({ active: false }); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, duration, delay, revealEffect, drawReady]);

  // ── Resize canvas to match container ─────────────────────────────────────
  useEffect(() => {
    if (revealEffect !== 'draw') return;
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width  = el.clientWidth  || 200;
      canvas.height = el.clientHeight || 150;
      // Re-draw current state after resize
      if (strokesRef.current) {
        const ctx = canvas.getContext('2d');
        drawStrokes(ctx, strokesRef.current, canvas.width, canvas.height, progress);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [revealEffect, progress]);

  // ─────────────────────────────────────────────────────────────────────────
  if (revealEffect === 'draw') {
    const imgOpacity = Math.max(0, Math.min(1, (progress - 0.7) / 0.3));
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
        {/* Original image fades in during final 30% of animation */}
        <img
          src={src}
          alt=""
          draggable={false}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'contain',
            display: 'block',
            userSelect: 'none',
            opacity: imgOpacity,
          }}
        />
        {/* Edge-stroke overlay */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            opacity: Math.max(0, 1 - imgOpacity * 1.5),
            pointerEvents: 'none',
          }}
        />
      </div>
    );
  }

  // ── Non-draw effects ──────────────────────────────────────────────────────
  const imgStyle = buildRevealStyle(revealEffect, progress);
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
      <img
        src={src}
        alt=""
        draggable={false}
        style={{
          width: '100%', height: '100%',
          objectFit: 'contain',
          display: 'block',
          userSelect: 'none',
          ...imgStyle,
        }}
      />
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Paint strokes onto ctx up to global progress t (0–1).
 * Returns the screen-space tip point { x, y } of the active stroke,
 * or null if fully done / not started.
 */
function drawStrokes(ctx, strokes, W, H, t) {
  if (!strokes || strokes.length === 0) return null;

  const totalLen = strokes.reduce((s, k) => s + k.length, 0);
  const drawn    = totalLen * t;

  ctx.lineCap  = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(1, Math.min(W, H) / 80);

  let accumulated = 0;
  let tipPt = null;

  for (const stroke of strokes) {
    const strokeStart = accumulated;
    const strokeEnd   = accumulated + stroke.length;

    if (strokeEnd <= drawn) {
      // Fully drawn stroke
      ctx.strokeStyle = '#1a1a1a';
      ctx.globalAlpha = 0.75;
      renderPolyline(ctx, stroke.pts, W, H);
      ctx.stroke();
    } else if (strokeStart < drawn) {
      // Partially drawn — find endpoint
      const localDraw = drawn - strokeStart;
      const partialPts = getPartialPoints(stroke, localDraw);
      ctx.strokeStyle = '#1a1a1a';
      ctx.globalAlpha = 0.75;
      renderPolyline(ctx, partialPts, W, H);
      ctx.stroke();

      const last = partialPts[partialPts.length - 1];
      if (last) tipPt = scalePoint(last, stroke, W, H);
    }
    // else: not yet started — skip

    accumulated = strokeEnd;
    if (accumulated > drawn && tipPt) break;
  }

  ctx.globalAlpha = 1;
  return tipPt;
}

/** Render a polyline (pts in 160-wide normalised space) scaled to W×H */
function renderPolyline(ctx, pts, W, H) {
  if (pts.length < 2) return;
  // Stroke data is in 160-wide space; scale to canvas size preserving aspect
  const srcW = 160;
  const srcH = pts._srcH ?? 160; // stored on array when we can
  const sx = W / srcW;
  const sy = H / (srcH || srcW);
  ctx.beginPath();
  ctx.moveTo(pts[0].x * sx, pts[0].y * sy);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i].x * sx, pts[i].y * sy);
  }
}

/** Walk the stroke's cumLen to extract points up to localDraw pixels */
function getPartialPoints(stroke, localDraw) {
  const { pts, cumLen } = stroke;
  const result = [];
  for (let i = 0; i < pts.length; i++) {
    if (cumLen[i] <= localDraw) {
      result.push(pts[i]);
    } else {
      // Interpolate last point
      if (i > 0) {
        const segStart = cumLen[i - 1];
        const segEnd   = cumLen[i];
        const segLen   = segEnd - segStart;
        const frac     = segLen > 0 ? (localDraw - segStart) / segLen : 0;
        result.push({
          x: pts[i-1].x + (pts[i].x - pts[i-1].x) * frac,
          y: pts[i-1].y + (pts[i].y - pts[i-1].y) * frac,
        });
      }
      break;
    }
  }
  return result;
}

/** Convert normalised stroke point to canvas-space coords */
function scalePoint(pt, _stroke, W, H) {
  const sx = W / 160;
  const sy = H / 160;
  return { x: pt.x * sx, y: pt.y * sy };
}

function buildRevealStyle(effect, progress) {
  switch (effect) {
    case 'wipe-right':
      return { clipPath: `inset(0 ${Math.round((1 - progress) * 100)}% 0 0)` };
    case 'wipe-down':
      return { clipPath: `inset(0 0 ${Math.round((1 - progress) * 100)}% 0)` };
    case 'fade':
      return { opacity: progress };
    case 'zoom':
      return {
        opacity: Math.min(1, progress * 2),
        transform: `scale(${0.6 + progress * 0.4})`,
        transformOrigin: 'center center',
      };
    default:
      return { clipPath: `inset(0 ${Math.round((1 - progress) * 100)}% 0 0)` };
  }
}
