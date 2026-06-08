import { useEffect, useRef, useState } from 'react';
import { textToStrokeData, warmFont } from '../../services/fontService';

/**
 * AnimatedTextReveal — realistic handwriting animation.
 *
 * Sizing contract:
 *   - The SVG uses preserveAspectRatio="xMinYMid meet" so glyphs are never
 *     stretched or squished — they always render at the natural fontSize scale.
 *   - The outer wrapper is width:100% height:100% overflow:hidden so the
 *     parent container clips any overflow without distorting.
 *   - This matches the static CSS text rendering exactly.
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
        graphic.fontSize   || 36,
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
    if (nStrokes === 0) { onTipMove?.({ active: false }); return; }

    const strokeEls = strokes.map((_, i) => svgEl.querySelector(`#sp${i}`));
    const glyphEls  = glyphs.map((_, i)  => svgEl.querySelector(`#gf${i}`));

    const lengths = strokeEls.map(el => {
      if (!el) return 0;
      try { return el.getTotalLength() * 1.005; } catch { return 200; }
    });

    if (!playing) {
      strokeEls.forEach(el => { if (el) el.style.display = 'none'; });
      glyphEls.forEach(el  => { if (el) el.style.display = 'block'; });
      onTipMove?.({ active: false });
      return;
    }

    glyphEls.forEach(el => { if (el) el.style.display = 'none'; });
    strokeEls.forEach((el, i) => {
      if (!el) return;
      el.style.display         = 'block';
      el.style.strokeDasharray  = `${lengths[i]}`;
      el.style.strokeDashoffset = `${lengths[i]}`;
      el.style.opacity          = '0';
    });

    startRef.current = null;
    let lastRevealedGlyph = -1;

    const tick = (ts) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed  = (ts - startRef.current) / 1000;
      const dur      = durRef.current;
      const dly      = delayRef.current;
      const perStroke = dur / nStrokes;

      strokes.forEach((stroke, i) => {
        if (elapsed >= dly + (i + 1) * perStroke) {
          const el = strokeEls[i];
          if (el) {
            el.style.strokeDashoffset = '0';
            el.style.opacity          = '1';
          }
        }
      });

      glyphs.forEach((glyph, gi) => {
        const myStrokes = strokes
          .map((s, i) => ({ ...s, i }))
          .filter(s => s.glyphIndex === gi);
        if (myStrokes.length === 0) return;
        const lastStrokeIdx = myStrokes[myStrokes.length - 1].i;
        const allDone = elapsed >= dly + (lastStrokeIdx + 1) * perStroke;
        if (allDone && gi > lastRevealedGlyph) {
          lastRevealedGlyph = gi;
          const gfEl = glyphEls[gi];
          if (gfEl) gfEl.style.display = 'block';
          myStrokes.forEach(({ i }) => {
            const sel = strokeEls[i];
            if (sel) sel.style.display = 'none';
          });
        }
      });

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

      strokes.forEach((_, i) => {
        if (i > activeIdx) {
          const fe = strokeEls[i];
          if (fe) fe.style.opacity = '0';
        }
      });

      // ── Pencil tip: SVG is at natural scale (1 vb unit = 1 css px) ─────────
      if (onTipMove && el && len > 0) {
        try {
          const pt   = el.getPointAtLength(t * len);
          const rect = svgEl.getBoundingClientRect();
          // SVG is rendered at natural size; pt.x/pt.y are already in CSS px
          onTipMove({
            active:  true,
            screenX: rect.left + pt.x,
            screenY: rect.top  + pt.y,
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

  // Priority: explicit color > board-type default
  const isBoardDark = graphic.boardType === 'blackboard' || graphic.boardType === 'greenboard';
  const color = (graphic.color && graphic.color !== '')
    ? graphic.color
    : (isBoardDark ? '#f1f5f9' : '#1a1a1a');

  // strokeW: relative to RENDER (= fontSize). 0.055 gives natural pen thickness.
  const strokeW = Math.max(1.2, (strokeData?.renderSize || graphic.fontSize || 36) * 0.055);

  if (!strokeData) {
    return <div style={{ width: '100%', height: '100%', opacity: 0 }} />;
  }

  // Render the SVG at its natural size (1 viewBox unit = 1px).
  // Since RENDER = fontSize, the glyphs appear at the same visual size
  // as CSS `fontSize` text, ensuring a perfect static ↔ animated match.
  const svgW = strokeData.totalWidth;
  const svgH = strokeData.totalHeight;

  return (
    // Outer div clips any overflow; SVG is at natural scale (no stretching)
    <div style={{ width: '100%', height: '100%', overflow: 'hidden', display: 'block' }}>
      <svg
        ref={svgRef}
        viewBox={strokeData.viewBox}
        width={svgW}
        height={svgH}
        style={{ display: 'block', flexShrink: 0 }}
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
    </div>
  );
}