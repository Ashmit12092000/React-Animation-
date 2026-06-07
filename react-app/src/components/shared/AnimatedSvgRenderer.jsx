import { useEffect, useRef } from 'react';

/**
 * AnimatedSvgRenderer  – universal "hand-draws any SVG" engine
 *
 * Handles every category of real-world downloaded SVG:
 *   • stroke-only paths (whiteboard style)
 *   • fill-only paths  → animated with clip-path reveal instead of dashoffset
 *   • mixed stroke+fill paths
 *   • CSS-class-based stroke/fill (reads getComputedStyle)
 *   • <use> references that point at <symbol> / <defs> shapes
 *   • nested <svg> elements
 *   • viewBox with non-zero minX / minY offsets
 *   • elements hidden by display/visibility/opacity
 *   • paths where getTotalLength() returns 0 (uses estimateLength fallback)
 *
 * Props:
 *   svg        – raw SVG markup string
 *   playing    – boolean
 *   duration   – total seconds for this graphic
 *   delay      – seconds before this graphic starts
 *   onTipMove  – callback({ active, localX, localY, screenX, screenY })
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

    // ── 1. Inject & normalise the SVG ─────────────────────────────────────────
    svgDiv.innerHTML = svg || '';
    const svgEl = svgDiv.querySelector('svg');
    if (!svgEl) return;

    svgEl.setAttribute('width',  '100%');
    svgEl.setAttribute('height', '100%');
    svgEl.setAttribute('preserveAspectRatio', 'none');
    svgEl.style.display  = 'block';
    svgEl.style.overflow = 'visible';

    // ── 2. Flatten <use> references into real DOM elements ────────────────────
    flattenUseElements(svgEl);

    // ── 3. Parse viewBox (including minX/minY offsets) ────────────────────────
    const vb   = svgEl.viewBox?.baseVal;
    const vbX  = vb?.width  > 0 ? (vb.x  ?? 0) : 0;
    const vbY  = vb?.width  > 0 ? (vb.y  ?? 0) : 0;
    const vbW  = vb?.width  > 0 ? vb.width  : (svgEl.getBoundingClientRect().width  || 100);
    const vbH  = vb?.height > 0 ? vb.height : (svgEl.getBoundingClientRect().height || 100);

    // ── 4. Static mode ────────────────────────────────────────────────────────
    if (!playing) {
      onTipMove?.({ active: false });
      restoreAllElements(svgEl);
      return;
    }

    // ── 5. Collect & classify drawable elements ───────────────────────────────
    // We want every visible shape element, regardless of whether it uses
    // stroke, fill, or both.  Hidden elements (display:none etc.) are skipped.
    const candidates = Array.from(
      svgEl.querySelectorAll('path,line,polyline,polygon,circle,ellipse,rect')
    ).filter(el => isVisible(el));

    if (candidates.length === 0) {
      // Nothing to animate – fade the whole SVG in
      onTipMove?.({ active: false });
      svgEl.style.opacity   = '0';
      svgEl.style.transition = `opacity ${duration}s ease ${delay}s`;
      requestAnimationFrame(() => { svgEl.style.opacity = '1'; });
      return;
    }

    // Classify each element: does it have a drawable stroke, fill, or both?
    const meta = candidates.map((el, i) => {
      const cs        = window.getComputedStyle(el);
      const hasStroke = hasDrawableStroke(el, cs);
      const hasFill   = hasDrawableFill(el, cs);

      // Path length for stroke-dashoffset animation
      let length = 0;
      try { length = el.getTotalLength?.() ?? 0; } catch (_) {}
      if (length === 0) length = estimateLength(el);
      const dashLen = length * 1.005; // tiny buffer to avoid hairline gap at join

      // Store originals before we mutate
      const origFill         = el.getAttribute('fill');
      const origStroke       = el.getAttribute('stroke');
      const origOpacity      = el.style.opacity;
      const origStrokeDash   = el.style.strokeDasharray;
      const origStrokeDashOff= el.style.strokeDashoffset;

      // Hide element initially
      el.style.opacity = '0';

      let animMode; // 'stroke' | 'fill-clip' | 'fade'

      if (hasStroke && length > 0) {
        // Primary: animate the stroke drawing in
        animMode = 'stroke';
        el.style.strokeDasharray  = `${dashLen}`;
        el.style.strokeDashoffset = `${dashLen}`;
        // Temporarily suppress fill so stroke draws first, fill appears at end
        if (hasFill && origFill !== 'none' && origFill !== null) {
          el.dataset.origFill = origFill ?? '';
          el.setAttribute('fill', 'none');
        }
      } else if (hasFill) {
        // No usable stroke — reveal fill via clipPath wipe
        animMode = 'fill-clip';
        setupFillClip(el, svgEl);
      } else {
        // Last resort: simple fade
        animMode = 'fade';
      }

      return {
        el, length, dashLen, animMode,
        origFill, origStroke, origOpacity,
        origStrokeDash, origStrokeDashOff,
        startSec: delay + i * (duration / candidates.length),
        endSec:   delay + (i + 1) * (duration / candidates.length),
      };
    });

    startRef.current = null;

    const tick = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = (ts - startRef.current) / 1000;

      // Snap finished elements to their final state
      meta.forEach(m => {
        if (elapsed >= m.endSec) snapToFinal(m);
      });

      // Find the element currently being drawn
      const activeIdx = meta.findIndex(m => elapsed >= m.startSec && elapsed < m.endSec);

      if (activeIdx === -1) {
        onTipMove?.({ active: false });
        const allDone = elapsed >= (meta.length > 0 ? meta[meta.length - 1].endSec : delay);
        if (!allDone) rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const m = meta[activeIdx];
      const t = Math.min(1, Math.max(0, (elapsed - m.startSec) / (m.endSec - m.startSec)));

      // Drive the active element
      m.el.style.opacity = '1';

      if (m.animMode === 'stroke' && m.length > 0) {
        m.el.style.strokeDashoffset = `${m.dashLen * (1 - t)}`;
      } else if (m.animMode === 'fill-clip') {
        driveFillClip(m.el, t);
      }
      // 'fade' — opacity alone, already set above

      // Hide not-yet-started elements
      meta.forEach((mm, i) => {
        if (i > activeIdx) {
          mm.el.style.opacity = '0';
          if (mm.animMode === 'stroke' && mm.length > 0) {
            mm.el.style.strokeDashoffset = `${mm.dashLen}`;
          }
        }
      });

      // ── Tip position ────────────────────────────────────────────────────────
      if (onTipMove) {
        let tipReported = false;
        if (m.animMode === 'stroke' && m.length > 0) {
          try {
            const pt       = m.el.getPointAtLength(t * m.length);
            const divRect  = svgDiv.getBoundingClientRect();
            const scaleX   = divRect.width  / vbW;
            const scaleY   = divRect.height / vbH;
            // Subtract viewBox offset so tip lands correctly even when minX/minY ≠ 0
            const localX   = (pt.x - vbX) * scaleX;
            const localY   = (pt.y - vbY) * scaleY;
            onTipMove({
              active:  true,
              localX,  localY,
              screenX: divRect.left + localX,
              screenY: divRect.top  + localY,
            });
            tipReported = true;
          } catch (_) {}
        }
        if (!tipReported) {
          // For fill-clip / fade elements, park the tip at the element's center
          try {
            const bbox    = m.el.getBBox();
            const divRect = svgDiv.getBoundingClientRect();
            const scaleX  = divRect.width  / vbW;
            const scaleY  = divRect.height / vbH;
            const localX  = (bbox.x + bbox.width  / 2 - vbX) * scaleX;
            const localY  = (bbox.y + bbox.height / 2 - vbY) * scaleY;
            onTipMove({
              active:  true,
              localX,  localY,
              screenX: divRect.left + localX,
              screenY: divRect.top  + localY,
            });
          } catch (_) {
            onTipMove({ active: false });
          }
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      // Restore any mutations we made
      meta.forEach(m => {
        if (m.el.dataset.origFill !== undefined) {
          if (m.el.dataset.origFill === '') m.removeAttribute('fill');
          else m.el.setAttribute('fill', m.el.dataset.origFill);
          delete m.el.dataset.origFill;
        }
        removeFillClip(m.el);
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Restore all elements in the SVG to their natural un-animated state. */
function restoreAllElements(svgEl) {
  svgEl.querySelectorAll('path,line,polyline,polygon,circle,ellipse,rect')
    .forEach(el => {
      el.style.strokeDasharray  = '';
      el.style.strokeDashoffset = '';
      el.style.opacity = '';
      if (el.dataset.origFill !== undefined) {
        if (el.dataset.origFill === '') el.removeAttribute('fill');
        else el.setAttribute('fill', el.dataset.origFill);
        delete el.dataset.origFill;
      }
      removeFillClip(el);
    });
}

/** Snap a meta entry to its fully-drawn final state. */
function snapToFinal(m) {
  m.el.style.opacity = '1';
  if (m.animMode === 'stroke') {
    m.el.style.strokeDashoffset = '0';
    if (m.el.dataset.origFill !== undefined) {
      if (m.el.dataset.origFill === '') m.el.removeAttribute('fill');
      else m.el.setAttribute('fill', m.el.dataset.origFill);
      delete m.el.dataset.origFill;
    }
  } else if (m.animMode === 'fill-clip') {
    driveFillClip(m.el, 1);
  }
}

/** True if the element has a visible stroke (attribute or computed style). */
function hasDrawableStroke(el, cs) {
  const attr = el.getAttribute('stroke');
  if (attr === 'none') return false;
  if (attr && attr !== '') return true;
  const computed = cs.stroke;
  return computed && computed !== 'none' && computed !== 'rgba(0, 0, 0, 0)';
}

/** True if the element has a visible fill (attribute or computed style). */
function hasDrawableFill(el, cs) {
  const attr = el.getAttribute('fill');
  if (attr === 'none') return false;
  // SVG default fill is black — if attribute is absent, check computed style
  const computed = cs.fill;
  if (attr === null || attr === undefined) {
    return computed && computed !== 'none' && computed !== 'rgba(0, 0, 0, 0)';
  }
  return attr !== '' && attr !== 'none';
}

/** True if the element is actually visible in the document. */
function isVisible(el) {
  // Skip elements explicitly hidden
  const cs = window.getComputedStyle(el);
  if (cs.display === 'none' || cs.visibility === 'hidden') return false;
  // Skip truly transparent elements
  const op = parseFloat(cs.opacity ?? '1');
  if (op === 0) return false;
  // Skip zero-size elements (e.g. collapsed rects)
  try {
    const bb = el.getBBox();
    if (bb.width === 0 && bb.height === 0) return false;
  } catch (_) {}
  return true;
}

/**
 * Flatten <use> elements by replacing each one with a deep clone of the
 * referenced shape, so our querySelectorAll picks them up.
 * Handles both same-document #id refs and xlink:href.
 */
function flattenUseElements(svgEl) {
  let useEls = Array.from(svgEl.querySelectorAll('use'));
  // Iterate up to 5 times in case there are nested <use>s
  for (let pass = 0; pass < 5 && useEls.length > 0; pass++) {
    useEls.forEach(useEl => {
      const href = useEl.getAttribute('href') || useEl.getAttribute('xlink:href');
      if (!href || !href.startsWith('#')) return;
      const target = svgEl.querySelector(href);
      if (!target) return;

      const clone = target.cloneNode(true);
      // Apply any transform from the <use>
      const tx = useEl.getAttribute('x') || '0';
      const ty = useEl.getAttribute('y') || '0';
      const existingTransform = useEl.getAttribute('transform') || '';
      const translatePart = (tx !== '0' || ty !== '0')
        ? `translate(${tx},${ty})`
        : '';
      const combined = [translatePart, existingTransform].filter(Boolean).join(' ');
      if (combined) clone.setAttribute('transform', combined);

      // Copy presentation attributes from the <use> onto the clone
      // (stroke, fill, opacity, etc.) only if the clone doesn't already have them
      ['stroke','fill','stroke-width','opacity'].forEach(attr => {
        const val = useEl.getAttribute(attr);
        if (val && !clone.getAttribute(attr)) clone.setAttribute(attr, val);
      });

      useEl.parentNode?.replaceChild(clone, useEl);
    });
    useEls = Array.from(svgEl.querySelectorAll('use'));
  }
}

// ─── Fill-clip wipe animation ─────────────────────────────────────────────────
// For fill-only elements we reveal them with a left-to-right clipPath wipe.
// Each element gets its own <clipPath> + <rect> injected into the SVG's <defs>.

let _clipCounter = 0;

function setupFillClip(el, svgEl) {
  const id = `wb-clip-${++_clipCounter}`;
  el.dataset.clipId = id;

  let defs = svgEl.querySelector('defs');
  if (!defs) {
    defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    svgEl.prepend(defs);
  }

  // Get element bounds in SVG coordinate space
  let bbox = { x: 0, y: 0, width: 100, height: 100 };
  try { bbox = el.getBBox(); } catch (_) {}

  const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
  clipPath.setAttribute('id', id);

  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('x',      String(bbox.x));
  rect.setAttribute('y',      String(bbox.y - 1));
  rect.setAttribute('width',  '0');   // starts at 0 — grown by driveFillClip
  rect.setAttribute('height', String(bbox.height + 2));
  clipPath.appendChild(rect);
  defs.appendChild(clipPath);

  el.setAttribute('clip-path', `url(#${id})`);
  el.dataset.clipBboxW = String(bbox.width);
  el.dataset.clipBboxX = String(bbox.x);
}

function driveFillClip(el, t) {
  const id = el.dataset.clipId;
  if (!id) return;
  // Find the rect inside the clipPath and grow its width
  const rect = document.getElementById(id)?.querySelector('rect');
  if (!rect) return;
  const totalW = parseFloat(el.dataset.clipBboxW ?? '100');
  rect.setAttribute('width', String(totalW * t));
}

function removeFillClip(el) {
  const id = el.dataset.clipId;
  if (!id) return;
  el.removeAttribute('clip-path');
  document.getElementById(id)?.remove();
  delete el.dataset.clipId;
  delete el.dataset.clipBboxW;
  delete el.dataset.clipBboxX;
}

// ─── Length estimation fallback ───────────────────────────────────────────────

function estimateLength(el) {
  try {
    const tag = el.tagName.toLowerCase();
    if (tag === 'rect') {
      const w = parseFloat(el.getAttribute('width')  || 0) || 50;
      const h = parseFloat(el.getAttribute('height') || 0) || 50;
      return 2 * (w + h);
    }
    if (tag === 'circle')
      return 2 * Math.PI * parseFloat(el.getAttribute('r') || 25);
    if (tag === 'ellipse') {
      const rx = parseFloat(el.getAttribute('rx') || 25);
      const ry = parseFloat(el.getAttribute('ry') || 25);
      return Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));
    }
    if (tag === 'line') {
      const dx = (parseFloat(el.getAttribute('x2') || 0)) - (parseFloat(el.getAttribute('x1') || 0));
      const dy = (parseFloat(el.getAttribute('y2') || 0)) - (parseFloat(el.getAttribute('y1') || 0));
      return Math.hypot(dx, dy) || 50;
    }
    if (tag === 'polyline' || tag === 'polygon') {
      const pts = (el.getAttribute('points') || '').trim().split(/[\s,]+/).map(Number);
      let len = 0;
      for (let i = 2; i < pts.length; i += 2)
        len += Math.hypot(pts[i] - pts[i - 2], pts[i + 1] - pts[i - 1]);
      return len || 100;
    }
  } catch (_) {}
  return 200;
}