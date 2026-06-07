import { useEffect, useRef } from 'react';

export default function AnimatedFillReveal({
  svg, style, playing, duration = 2.5, delay = 0, onTipMove,
  boardBackground = '#ffffff',
}) {
  const containerRef = useRef(null);
  const canvasRef    = useRef(null);
  const svgDivRef    = useRef(null);
  const rafRef       = useRef(null);
  const startRef     = useRef(null);
  const onTipMoveRef = useRef(onTipMove);
  onTipMoveRef.current = onTipMove;

  useEffect(() => {
    const container = containerRef.current;
    const canvas    = canvasRef.current;
    const svgDiv    = svgDivRef.current;
    if (!container || !canvas || !svgDiv) return;

    cancelAnimationFrame(rafRef.current);
    startRef.current = null;

    // ── Inject SVG ──────────────────────────────────────────────────────────
    svgDiv.innerHTML = svg || '';
    const svgEl = svgDiv.querySelector('svg');
    if (!svgEl) return;
    svgEl.setAttribute('width', '100%');
    svgEl.setAttribute('preserveAspectRatio', 'none');
    svgEl.setAttribute('height', '100%');
    svgEl.style.display  = 'block';
    svgEl.style.overflow = 'visible';

    // ── Static mode ─────────────────────────────────────────────────────────
    if (!playing) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      onTipMoveRef.current?.({ active: false });
      return;
    }

    // ── Immediately hide everything — prevents 1-frame flash of filled SVG ──
    const allShapes = Array.from(
      svgEl.querySelectorAll('path,rect,circle,ellipse,polygon,polyline')
    );
    allShapes.forEach(el => { el.style.opacity = '0'; });

    // Also cover with board color immediately on the canvas
    // so there's zero chance of seeing the fill during delay
    const ctxEarly = canvas.getContext('2d');
    // We don't know size yet, but set a rough cover — will be corrected in rAF
    canvas.width  = container.offsetWidth  || 150;
    canvas.height = container.offsetHeight || 150;
    ctxEarly.fillStyle = boardBackground;
    ctxEarly.fillRect(0, 0, canvas.width, canvas.height);

    // ── Defer 1 rAF so container has real layout dimensions ─────────────────
    const frameId = requestAnimationFrame(() => {
      const rect = container.getBoundingClientRect();
      const W = Math.round(rect.width)  || 150;
      const H = Math.round(rect.height) || 150;
      canvas.width  = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');

      // Keep canvas covered during delay period
      ctx.fillStyle = boardBackground;
      ctx.fillRect(0, 0, W, H);

      // viewBox → CSS pixel scale
      const vb   = svgEl.viewBox?.baseVal;
      const vbW  = (vb?.width  > 0 ? vb.width  : null) ?? W;
      const vbH  = (vb?.height > 0 ? vb.height : null) ?? H;
      const scaleX = W / vbW;
      const scaleY = H / vbH;

      // ── Prep each element ─────────────────────────────────────────────────
      const outlineEls = allShapes.map(el => {
        const origFill = el.getAttribute('fill') ?? '';

        // Hide fill — only stroke visible during border phase
        if (origFill && origFill !== 'none') {
          el.dataset.origFill = origFill;
          el.setAttribute('fill', 'none');
        }

        // Stroke = SAME color as the fill (user's chosen paint color)
        const strokeColor = (origFill && origFill !== 'none') ? origFill : '#1e293b';
        el.setAttribute('stroke', strokeColor);
        el.setAttribute('stroke-width', String(Math.max(2, vbW / 30)));
        el.setAttribute('stroke-linejoin', 'round');
        el.setAttribute('stroke-linecap', 'round');

        // Measure path length
        let length = 0;
        try { length = el.getTotalLength?.() ?? 0; } catch (_) {}
        if (length === 0) length = estimateLength(el);

        // Fully hidden stroke — will be revealed by dashoffset animation
        el.style.opacity          = '0';
        el.style.strokeDasharray  = `${length}`;
        el.style.strokeDashoffset = `${length}`;

        return { el, length, origFill, strokeColor };
      });

      // Clear canvas — phase 1 shows stroke directly against board background
      ctx.clearRect(0, 0, W, H);
      let phase2Started = false;

      const STROKES = 8;
      const strokeH = H / STROKES;
      const outlineDur = duration * 0.35;
      const fillDur    = duration * 0.65;

      const loop = (now) => {
        if (startRef.current === null) startRef.current = now;
        const elapsed = (now - startRef.current) / 1000;
        const t = elapsed - delay;

        // ── Still in delay period — keep canvas covered, shapes hidden ──────
        if (t < 0) {
          ctx.fillStyle = boardBackground;
          ctx.fillRect(0, 0, W, H);
          allShapes.forEach(el => { el.style.opacity = '0'; });
          onTipMoveRef.current?.({ active: false });
          rafRef.current = requestAnimationFrame(loop);
          return;
        }

        // ── PHASE 1: Draw border ─────────────────────────────────────────────
        if (t < outlineDur) {
          // Clear canvas so board background shows through (stroke visible)
          ctx.clearRect(0, 0, W, H);

          const progress = t / outlineDur;
          const perEl    = 1 / Math.max(outlineEls.length, 1);

          outlineEls.forEach((m, i) => {
            const elStart = i * perEl;
            const elEnd   = (i + 1) * perEl;

            if (progress >= elEnd) {
              // Fully drawn stroke
              m.el.style.opacity          = '1';
              m.el.style.strokeDashoffset = '0';
            } else if (progress >= elStart) {
              // Actively drawing
              const localT = (progress - elStart) / perEl;
              m.el.style.opacity          = '1';
              m.el.style.strokeDashoffset = `${m.length * (1 - localT)}`;

              if (m.length > 0) {
                try {
                  const pt   = m.el.getPointAtLength(localT * m.length);
                  const divR = container.getBoundingClientRect();
                  onTipMoveRef.current?.({
                    active:  true,
                    screenX: divR.left + pt.x * scaleX,
                    screenY: divR.top  + pt.y * scaleY,
                  });
                } catch (_) {}
              }
            } else {
              // Not started yet — keep hidden
              m.el.style.opacity = '0';
            }
          });

          rafRef.current = requestAnimationFrame(loop);
          return;
        }

        // ── TRANSITION → Phase 2 (runs once) ────────────────────────────────
        if (!phase2Started) {
          phase2Started = true;

          // Complete all borders and restore fill
          outlineEls.forEach(m => {
            m.el.style.opacity          = '1';
            m.el.style.strokeDasharray  = '';
            m.el.style.strokeDashoffset = '';
            if (m.el.dataset.origFill) {
              m.el.setAttribute('fill', m.el.dataset.origFill);
              delete m.el.dataset.origFill;
            }
          });

          // Cover with board color — fill sweep will erase row by row
          ctx.fillStyle = boardBackground;
          ctx.fillRect(0, 0, W, H);
        }

        // ── PHASE 2: Fill sweep ──────────────────────────────────────────────
        const progress = Math.min((t - outlineDur) / fillDur, 1);

        const currentUnit   = progress * STROKES;
        const completedRows = Math.floor(currentUnit);
        const partialFrac   = currentUnit - completedRows;

        // Redraw cover for uncompleted area (prevents row bleed)
        ctx.fillStyle = boardBackground;
        ctx.fillRect(0, completedRows * strokeH, W, H);

        // Keep completed rows clear (revealed)
        ctx.clearRect(0, 0, W, completedRows * strokeH);

        // Partial current row
        if (completedRows < STROKES) {
          const y        = completedRows * strokeH;
          const partialW = partialFrac * W;
          const divR     = container.getBoundingClientRect();

          if (completedRows % 2 === 0) {
            ctx.clearRect(0, y, partialW, strokeH + 1);
            onTipMoveRef.current?.({
              active:  true,
              screenX: divR.left + partialW,
              screenY: divR.top  + y + strokeH * 0.5,
            });
          } else {
            ctx.clearRect(W - partialW, y, partialW, strokeH + 1);
            onTipMoveRef.current?.({
              active:  true,
              screenX: divR.left + W - partialW,
              screenY: divR.top  + y + strokeH * 0.5,
            });
          }
        }

        if (progress >= 1) {
          ctx.clearRect(0, 0, W, H);
          onTipMoveRef.current?.({ active: false });
          return;
        }

        rafRef.current = requestAnimationFrame(loop);
      };

      rafRef.current = requestAnimationFrame(loop);
    });

    return () => {
      cancelAnimationFrame(frameId);
      cancelAnimationFrame(rafRef.current);
      onTipMoveRef.current?.({ active: false });
    };
  }, [svg, playing, duration, delay, boardBackground]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', ...style }}>
      {/* SVG layer */}
      <div
        ref={svgDivRef}
        style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
      />
      {/* Canvas overlay — covers fill until sweep reveals it */}
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      />
    </div>
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
    if (tag === 'circle')  return 2 * Math.PI * parseFloat(el.getAttribute('r') || 25);
    if (tag === 'ellipse') {
      const rx = parseFloat(el.getAttribute('rx') || 25);
      const ry = parseFloat(el.getAttribute('ry') || 25);
      return Math.PI * (3*(rx+ry) - Math.sqrt((3*rx+ry)*(rx+3*ry)));
    }
    if (tag === 'polygon' || tag === 'polyline') {
      const pts = (el.getAttribute('points') || '').trim().split(/[\s,]+/).map(Number);
      let len = 0;
      for (let i = 2; i < pts.length; i += 2) {
        const dx = pts[i] - pts[i-2];
        const dy = pts[i+1] - pts[i-1];
        len += Math.sqrt(dx*dx + dy*dy);
      }
      return len || 200;
    }
  } catch (_) {}
  return 200;
}