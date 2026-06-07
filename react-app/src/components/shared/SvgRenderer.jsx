import { useEffect, useRef } from 'react';

// Renders an SVG string inside a div, filling the container exactly.
// Sets width/height="100%" and preserveAspectRatio="none" so the SVG
// stretches to the graphic item's dimensions — no letterboxing.
export default function SvgRenderer({ svg, style, className }) {
  const divRef = useRef(null);

  useEffect(() => {
    const div = divRef.current;
    if (!div) return;
    div.innerHTML = svg || '';
    const svgEl = div.querySelector('svg');
    if (!svgEl) return;
    svgEl.setAttribute('width', '100%');
    svgEl.setAttribute('height', '100%');
    svgEl.setAttribute('preserveAspectRatio', 'none');
    svgEl.style.display = 'block';
  }, [svg]);

  return (
    <div
      ref={divRef}
      className={className}
      style={{ lineHeight: 0, ...style }}
    />
  );
}