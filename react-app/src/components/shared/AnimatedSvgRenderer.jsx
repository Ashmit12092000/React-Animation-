import { useEffect, useRef } from 'react';

/**
 * AnimatedSvgRenderer
 *
 * Drives stroke-dashoffset animation via a single rAF loop.
 * NO hand/pencil here — the hand lives at the canvas level.
 *
 * Props:
 *   svg        – raw SVG markup string
 *   playing    – boolean
 *   duration   – total seconds for this graphic
 *   delay      – seconds before this graphic starts
 *   onTipMove  – callback({ x, y, canvasX, canvasY, active }) called each frame
 *                x/y are SVG-viewBox coords; canvasX/canvasY are px relative to
 *                the nearest positioned ancestor (the preview canvas div).
 *                active=false means this graphic is done / not yet started.
 */
export default function AnimatedSvgRenderer({
  svg, style, className, playing, duration = 1.5, delay = 0, onTipMove,
}) {
  const svgRef   = useRef(null);
  const rafRef   = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    const svgDiv = svgRef.current;
    if (!svgDiv) return;

    cancelAnimationFrame(rafRef.current);

    svgDiv.innerHTML = svg || '';
    const svgEl = svgDiv.querySelector('svg');
    if (!svgEl) return;

    svgEl.setAttribute('width', '100%');
    svgEl.setAttribute('height', '100%');
    // Stretch to fill the container exactly — no letterboxing.
    // The user sizes the graphic item div on the canvas to match the SVG's
    // visual proportions, so we must honour those exact pixel dimensions
    // rather than letting the browser apply "xMidYMid meet" (default) which
    // would shrink the SVG to preserve its viewBox aspect ratio inside the div.
    svgEl.setAttribute('preserveAspectRatio', 'none');
    svgEl.style.display  = 'block';
    svgEl.style.overflow = 'visible';

    // ── Static mode ──────────────────────────────────────────────────────────
    if (!playing) {
      onTipMove?.({ active: false });
      svgEl.querySelectorAll('path,line,polyline,polygon,circle,ellipse,rect')
        .forEach(el => {
          el.style.strokeDasharray  = '';
          el.style.strokeDashoffset = '';
          el.style.opacity = '1';
          if (el.dataset.origFill) {
            el.setAttribute('fill', el.dataset.origFill);
            delete el.dataset.origFill;
          }
        });
      return;
    }

    // ── Collect stroke elements ──────────────────────────────────────────────
    const elements = Array.from(
      svgEl.querySelectorAll('path,line,polyline,polygon,circle,ellipse,rect')
    ).filter(el => {
      const s = el.getAttribute('stroke') || window.getComputedStyle(el).stroke;
      return s && s !== 'none' && s !== '';
    });

    if (elements.length === 0) {
      onTipMove?.({ active: false });
      svgEl.style.opacity = '0';
      svgEl.style.transition = `opacity ${duration}s ease ${delay}s`;
      requestAnimationFrame(() => { svgEl.style.opacity = '1'; });
      return;
    }

    const perEl = duration / elements.length;

    const vb  = svgEl.viewBox?.baseVal;
    const vbW = (vb?.width  > 0 ? vb.width  : null) ?? (svgEl.getBoundingClientRect().width  || 100);
    const vbH = (vb?.height > 0 ? vb.height : null) ?? (svgEl.getBoundingClientRect().height || 100);

    // Measure + init each element
    const meta = elements.map((el, i) => {
      let length = 0;
      try { length = el.getTotalLength?.() ?? 0; } catch (_) {}
      if (length === 0) length = estimateLength(el);

      // Add a small buffer (0.5%) so the dash pattern always fully covers the
      // path. Without it, floating-point differences between getTotalLength()
      // and the browser's actual rendered length leave a hairline gap exactly
      // at the path's start/end join point (visible as a blank spot on circles).
      const dashLen = length * 1.005;

      el.style.opacity = '0';
      if (length > 0) {
        el.style.strokeDasharray  = `${dashLen}`;
        el.style.strokeDashoffset = `${dashLen}`;
      }

      const origFill = el.getAttribute('fill');
      if (origFill && origFill !== 'none') {
        el.dataset.origFill = origFill;
        el.setAttribute('fill', 'none');
      }

      return {
        el, length, dashLen,
        startSec: delay + i * perEl,
        endSec:   delay + (i + 1) * perEl,
      };
    });

    startRef.current = null;

    const tick = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = (ts - startRef.current) / 1000;

      // Snap finished elements
      meta.forEach(m => {
        if (elapsed >= m.endSec) {
          m.el.style.opacity = '1';
          m.el.style.strokeDashoffset = '0';
          if (m.el.dataset.origFill) {
            m.el.setAttribute('fill', m.el.dataset.origFill);
            delete m.el.dataset.origFill;
          }
        }
      });

      // Find active element
      const activeIdx = meta.findIndex(m => elapsed >= m.startSec && elapsed < m.endSec);

      if (activeIdx === -1) {
        onTipMove?.({ active: false });
        // Keep looping if we haven't reached the first element yet (pre-delay wait)
        // or if the last element hasn't had a chance to render its final snap frame.
        const allDone = elapsed >= (meta.length > 0 ? meta[meta.length - 1].endSec : delay);
        if (!allDone) {
          rafRef.current = requestAnimationFrame(tick);
        }
        // else: all elements are snapped, stop looping
        return;
      }

      const m = meta[activeIdx];
      const t = Math.min(1, Math.max(0, (elapsed - m.startSec) / (m.endSec - m.startSec)));

      m.el.style.opacity = '1';
      if (m.length > 0) m.el.style.strokeDashoffset = `${m.dashLen * (1 - t)}`;

      // Hide not-yet-started elements
      meta.forEach((mm, i) => {
        if (i > activeIdx) {
          mm.el.style.opacity = '0';
          if (mm.length > 0) mm.el.style.strokeDashoffset = `${mm.dashLen}`;
        }
      });

      // Compute tip position in screen coords (relative to svgDiv)
      if (onTipMove && m.length > 0) {
        try {
          const pt      = m.el.getPointAtLength(t * m.length);
          const divRect = svgDiv.getBoundingClientRect();
          const scaleX  = divRect.width  / vbW;
          const scaleY  = divRect.height / vbH;
          onTipMove({
            active: true,
            // px offset relative to the svgDiv's top-left
            localX: pt.x * scaleX,
            localY: pt.y * scaleY,
            // absolute screen coords (for canvas-level positioning)
            screenX: divRect.left + pt.x * scaleX,
            screenY: divRect.top  + pt.y * scaleY,
          });
        } catch (_) {
          onTipMove?.({ active: false });
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      elements.forEach(el => {
        if (el.dataset.origFill) {
          el.setAttribute('fill', el.dataset.origFill);
          delete el.dataset.origFill;
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [svg, playing, duration, delay]);

  return (
    <div
      ref={svgRef}
      className={className}
      style={{ lineHeight: 0, ...style }}
    />
  );
}

function estimateLength(el) {
  try {
    const tag = el.tagName.toLowerCase();
    if (tag === 'rect') {
      const w = parseFloat(el.getAttribute('width')  || 0) || 50;
      const h = parseFloat(el.getAttribute('height') || 0) || 50;
      return 2 * (w + h);
    }
    if (tag === 'circle') return 2 * Math.PI * (parseFloat(el.getAttribute('r') || 25));
    if (tag === 'ellipse') {
      const rx = parseFloat(el.getAttribute('rx') || 25);
      const ry = parseFloat(el.getAttribute('ry') || 25);
      return Math.PI * (3*(rx+ry) - Math.sqrt((3*rx+ry)*(rx+3*ry)));
    }
  } catch (_) {}
  return 200;
}