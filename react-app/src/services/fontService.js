import opentype from 'opentype.js';

const FONT_MAP = {
  'Pacifico':       '/Pacifico-Regular.ttf',
  'Caveat':         '/Caveat-Regular.ttf',
  'Dancing Script': '/DancingScript-Regular.ttf',
  'Open Sans':      '/OpenSans-Regular.ttf',
  'Georgia':        '/OpenSans-Regular.ttf',
  'Arial':          '/OpenSans-Regular.ttf',
  'sans-serif':     '/OpenSans-Regular.ttf',
  default:          '/OpenSans-Regular.ttf',
};

const fontCache    = {};
const loadPromises = {};

async function loadFont(family) {
  const path = FONT_MAP[family] || FONT_MAP.default;
  const url  = (process.env.PUBLIC_URL || '') + path;
  if (fontCache[url]) return fontCache[url];
  if (loadPromises[url]) return loadPromises[url];
  loadPromises[url] = (async () => {
    try {
      const res  = await fetch(url);
      if (!res.ok) throw new Error(`Font fetch failed: ${url} (${res.status})`);
      const buf  = await res.arrayBuffer();
      const font = opentype.parse(buf);
      fontCache[url] = font;
      return font;
    } catch (err) {
      delete loadPromises[url];
      throw err;
    }
  })();
  return loadPromises[url];
}

export async function warmFont(family) {
  try { await loadFont(family); } catch (e) { console.warn('warmFont failed:', e); }
}

/**
 * Convert path commands array → SVG path d= string
 */
function commandsToD(cmds) {
  return cmds.map(c => {
    switch (c.type) {
      case 'M': return `M${c.x.toFixed(2)} ${c.y.toFixed(2)}`;
      case 'L': return `L${c.x.toFixed(2)} ${c.y.toFixed(2)}`;
      case 'Q': return `Q${c.x1.toFixed(2)} ${c.y1.toFixed(2)} ${c.x.toFixed(2)} ${c.y.toFixed(2)}`;
      case 'C': return `C${c.x1.toFixed(2)} ${c.y1.toFixed(2)} ${c.x2.toFixed(2)} ${c.y2.toFixed(2)} ${c.x.toFixed(2)} ${c.y.toFixed(2)}`;
      case 'Z': return 'Z';
      default:  return '';
    }
  }).join(' ');
}

/**
 * Split a glyph's commands into individual sub-paths (each M starts a new one).
 * Each sub-path is one continuous pen stroke.
 */
function splitIntoSubpaths(commands) {
  const subpaths = [];
  let current = [];
  for (const cmd of commands) {
    if (cmd.type === 'M' && current.length > 0) {
      subpaths.push(current);
      current = [];
    }
    current.push(cmd);
  }
  if (current.length > 0) subpaths.push(current);
  return subpaths;
}

/**
 * Returns stroke-animation data for text.
 *
 * Each item in `strokes` is one continuous pen sub-path:
 *   { d, glyphIndex, charIndex }
 *
 * Plus the full per-glyph filled paths for the "completed" state:
 *   glyphs[i] = { d, charIndex }
 *
 * viewBox / totalWidth / totalHeight for the SVG element.
 */
export async function textToStrokeData(text, fontFamily, fontSize = 72) {
  const font     = await loadFont(fontFamily);
  // Use the actual fontSize for rendering so that the SVG glyph paths are
  // proportional to the fontSize. This ensures the animated text matches
  // the static text size (which is rendered with CSS fontSize directly).
  const RENDER   = Math.max(20, fontSize);
  const baseline = RENDER * 0.78;
  const scale    = RENDER / font.unitsPerEm;
  const chars    = font.stringToGlyphs(text || ' ');

  const strokes = [];  // individual sub-paths for animation
  const glyphs  = [];  // full per-glyph paths for fill-behind

  let cursorX = 0;

  chars.forEach((glyph, gi) => {
    const path     = glyph.getPath(cursorX, baseline, RENDER);
    const fullD    = commandsToD(path.commands);
    const subpaths = splitIntoSubpaths(path.commands);

    if (subpaths.length > 0 && fullD.trim().length > 1) {
      glyphs.push({ d: fullD, charIndex: gi });

      subpaths.forEach(cmds => {
        const d = commandsToD(cmds);
        if (d.trim().length > 1) {
          strokes.push({ d, glyphIndex: glyphs.length - 1, charIndex: gi });
        }
      });
    }

    const advance = (glyph.advanceWidth || 0) * scale;
    const kern    = gi < chars.length - 1
      ? (font.getKerningValue(glyph, chars[gi + 1]) || 0) * scale
      : 0;
    cursorX += advance + kern;
  });

  const totalWidth  = Math.max(cursorX, 10);
  const totalHeight = RENDER * 1.15;

  return {
    strokes,
    glyphs,
    viewBox:     `0 0 ${totalWidth.toFixed(1)} ${totalHeight.toFixed(1)}`,
    totalWidth,
    totalHeight,
    renderSize:  RENDER,
  };
}

/** Legacy compat */
export async function textToCharacterData(text, fontFamily, fontSize = 72) {
  return textToStrokeData(text, fontFamily, fontSize);
}
export async function textToSvgPaths(text, fontFamily, fontSize = 72) {
  const data = await textToStrokeData(text, fontFamily, fontSize);
  return {
    paths:   data.glyphs.map(g => g.d),
    viewBox: data.viewBox,
    width:   data.totalWidth,
    height:  data.totalHeight,
  };
}
// ─── Resolved CSS font name for static rendering ──────────────────────────────
// Maps the selected font to the CSS @font-face name that matches the TTF file
// used by the animation engine.  Static text should use this to stay consistent.
const FONT_CSS_NAME = {
  'Pacifico':         'Pacifico',
  'Caveat':           'Caveat',
  'Dancing Script':   'Dancing Script',
  'Open Sans':        'Open Sans',
};
const FALLBACK_CSS  = 'Open Sans';   // what all un-mapped fonts render as

/**
 * Returns the CSS font-family string that exactly matches what the animation
 * engine renders.  Use this for static text so it visually matches animated.
 */
export function getEffectiveFontFamily(requested) {
  return FONT_CSS_NAME[requested] ?? FALLBACK_CSS;
}