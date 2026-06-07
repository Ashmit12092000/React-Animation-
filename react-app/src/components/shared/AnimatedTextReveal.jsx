import { useEffect, useRef, useState } from 'react';
import { textToStrokeData, warmFont } from '../../services/fontService';

/**
 * AnimatedTextReveal — realistic handwriting animation.
 *
 * How it works:
 *  1. Each character glyph is split into its individual pen sub-paths
 *     (one sub-path per M command = one unbroken pen stroke).
 *  2. We animate each sub-path using strokeDashoffset — the stroke color
 *     matches the final fill color, so it looks like a pen drawing the letter.
 *  3. Behind the active stroke, completed glyphs are shown as solid fills —
 *     no hollow outlines, no skeletons, no ghosts.
 *  4. The hand/pencil tip follows getPointAtLength() on the active sub-path,
 *     so it moves along the actual pen stroke path.
 */
export default function AnimatedTextReveal({
  graphic, playing, duration, delay, onTipMove, playStartTime,
}) {
  const [strokeData, setStrokeData] = useState(null);

  const svgRef      = useRef(null);
  const rafRef      = useRef(null);
  const startRef    = useRef(null);
  const durRef      = useRef(duration);
  const delayRef    = useRef(delay);

  durRef.current   = duration;
  delayRef.current = delay;

  // ── Load font data ─────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    warmFont(graphic.fontFamily || 'Open Sans').then(() => {
      if (cancelled) return;
      return textToStrokeData(
        graphic.rawText    || ' ',
        graphic.fontFamily || 'Open Sans',
        graphic.fontSize   || 72,
      );
    }).then(data => {
      if (!cancelled && data) setStrokeData(data);
    }).catch(err => console.warn('Font load error:', err));
    return () => { cancelled = true; };
  }, [graphic.rawText, graphic.fontFamily, graphic.fontSize]);

  // ── Animation loop ─────────────────────────────────────────────────────────
  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    const svgEl = svgRef.current;
    if (!svgEl || !strokeData) return;

    const { strokes, glyphs } = strokeData;
    const nStrokes = strokes.length;
    const nGlyphs  = glyphs.length;
    if (nStrokes === 0) { onTipMove?.({ active: false }); return; }

    // Query DOM elements
    // stroke paths: id="sp{i}"  — animated with dashoffset
    // glyph fills:  id="gf{i}"  — shown solid when glyph is done
    const strokeEls = strokes.map((_, i) => svgEl.querySelector(`#sp${i}`));
    const glyphEls  = glyphs.map((_, i)  => svgEl.querySelector(`#gf${i}`));

    // Measure each stroke path length once
    const lengths = strokeEls.map(el => {
      if (!el) return 0;
      try { return el.getTotalLength() * 1.005; } catch { return 200; }
    });

    // ── Static (not playing) — show everything filled ──────────────────────
    if (!playing) {
      strokeEls.forEach(el => { if (el) el.style.display = 'none'; });
      glyphEls.forEach(el  => { if (el) el.style.display = 'block'; });
      onTipMove?.({ active: false });
      return;
    }

    // ── Init for animation ─────────────────────────────────────────────────
    // All glyph fills hidden; strokes ready but invisible
    glyphEls.forEach(el => { if (el) el.style.display = 'none'; });
    strokeEls.forEach((el, i) => {
      if (!el) return;
      el.style.display         = 'block';
      el.style.strokeDasharray  = `${lengths[i]}`;
      el.style.strokeDashoffset = `${lengths[i]}`;
      el.style.opacity          = '0';
    });

    startRef.current = null;

    // Which glyph index was last fully completed (all its strokes done)
    let lastRevealedGlyph = -1;

    const tick = (ts) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed  = (ts - startRef.current) / 1000;
      const dur      = durRef.current;
      const dly      = delayRef.current;
      const perStroke = dur / nStrokes;

      // ── Snap finished strokes ────────────────────────────────────────────
      strokes.forEach((stroke, i) => {
        if (elapsed >= dly + (i + 1) * perStroke) {
          const el = strokeEls[i];
          if (el) {
            el.style.strokeDashoffset = '0';
            el.style.opacity          = '1';
          }
        }
      });

      // ── Reveal completed glyph fills ─────────────────────────────────────
      // When ALL strokes of a glyph are done, switch from stroke→fill
      glyphs.forEach((glyph, gi) => {
        const myStrokes = strokes
          .map((s, i) => ({ ...s, i }))
          .filter(s => s.glyphIndex === gi);

        if (myStrokes.length === 0) return;

        const lastStrokeIdx = myStrokes[myStrokes.length - 1].i;
        const allDone = elapsed >= dly + (lastStrokeIdx + 1) * perStroke;

        if (allDone && gi > lastRevealedGlyph) {
          lastRevealedGlyph = gi;
          // Show filled glyph, hide its stroke paths
          const gfEl = glyphEls[gi];
          if (gfEl) gfEl.style.display = 'block';
          myStrokes.forEach(({ i }) => {
            const sel = strokeEls[i];
            if (sel) sel.style.display = 'none';
          });
        }
      });

      // ── Find active stroke ────────────────────────────────────────────────
      const activeIdx = strokes.findIndex((_, i) => {
        const s = dly + i * perStroke;
        const e = dly + (i + 1) * perStroke;
        return elapsed >= s && elapsed < e;
      });

      if (activeIdx === -1) {
        onTipMove?.({ active: false });
        if (elapsed < dly + dur) rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const el  = strokeEls[activeIdx];
      const len = lengths[activeIdx];
      const startSec = dly + activeIdx * perStroke;
      const endSec   = dly + (activeIdx + 1) * perStroke;
      const t = Math.min(1, Math.max(0, (elapsed - startSec) / (endSec - startSec)));

      if (el) {
        el.style.opacity          = '1';
        el.style.strokeDashoffset = `${len * (1 - t)}`;
      }

      // Hide future strokes
      strokes.forEach((_, i) => {
        if (i > activeIdx) {
          const fe = strokeEls[i];
          if (fe) fe.style.opacity = '0';
        }
      });

      // ── Pencil tip follows the actual stroke path ─────────────────────────
      if (onTipMove && el && len > 0) {
        try {
          const pt     = el.getPointAtLength(t * len);
          const rect   = svgEl.getBoundingClientRect();
          const vb     = svgEl.viewBox.baseVal;
          const scaleX = rect.width  / vb.width;
          const scaleY = rect.height / vb.height;
          onTipMove({
            active:  true,
            screenX: rect.left + pt.x * scaleX,
            screenY: rect.top  + pt.y * scaleY,
          });
        } catch (_) { onTipMove?.({ active: false }); }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      startRef.current = null;
      onTipMove?.({ active: false });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokeData, playing]);

  const color =
    graphic.boardType === 'blackboard' || graphic.boardType === 'greenboard'
      ? '#f1f5f9' : (graphic.color || '#1a1a1a');

  // Stroke width: sized so it looks like the pen that would draw this letter.
  // The font paths are rendered at RENDER_SIZE=120 units; the stroke width
  // needs to be thick enough to cover the letter body visually.
  const strokeW = Math.max(1.5, (strokeData?.renderSize || 120) * 0.055);

  if (!strokeData) {
    return <div style={{ width: '100%', height: '100%', opacity: 0 }} />;
  }

  return (
    <svg
      ref={svgRef}
      viewBox={strokeData.viewBox}
      style={{ width: '100%', height: '100%', overflow: 'visible', display: 'block' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ── Filled glyphs (shown once their strokes are done) ── */}
      {strokeData.glyphs.map((g, i) => (
        <path
          key={`gf${i}`}
          id={`gf${i}`}
          d={g.d}
          fill={color}
          stroke="none"
          style={{ display: playing ? 'none' : 'block' }}
        />
      ))}

      {/* ── Animated stroke sub-paths ── */}
      {playing && strokeData.strokes.map((s, i) => (
        <path
          key={`sp${i}`}
          id={`sp${i}`}
          d={s.d}
          fill="none"
          stroke={color}
          strokeWidth={strokeW}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            opacity:          0,
            strokeDasharray:  '0',
            strokeDashoffset: '0',
          }}
        />
      ))}
    </svg>
  );
}