// ─── ID helper ────────────────────────────────────────────────────────────────
const uid = () => crypto.randomUUID();

// ─── Project ──────────────────────────────────────────────────────────────────
export function createProject(title = 'Untitled Project', boardType = 'whiteboard') {
  const now = new Date().toISOString();
  const firstScene = createScene('1');
  return {
    id: uid(),
    title,
    boardType,
    createdOn: now,
    modifiedOn: now,
    scenes: [firstScene],
    audioTracks: [],
  };
}

// ─── Scene ────────────────────────────────────────────────────────────────────
export function createScene(name = '1') {
  return {
    id: uid(),
    name,
    graphics: [],
    transition: 'none', // 'none', 'fade', 'slideLeft', 'slideRight', 'slideUp', 'slideDown', 'zoomIn', 'zoomOut'
    transitionDuration: 0.5, // in seconds
  };
}

export function cloneScene(scene) {
  return {
    ...JSON.parse(JSON.stringify(scene)),
    id: uid(),
    graphics: scene.graphics.map(g => ({ ...g, id: uid() })),
  };
}

// ─── Graphics ─────────────────────────────────────────────────────────────────

/**
 * @param {string} svgText   – raw SVG markup
 * @param {string} name      – display name
 * @param {{ x, y, width, height }} pos
 */
export function createDrawingModel(svgText, name = 'Graphic', pos = {}, paintFill = false) {
  return {
    id: uid(),
    type: 'drawing',
    name,
    svgText,
    paintFill,
    x: pos.x ?? 60,
    y: pos.y ?? 60,
    width: pos.width ?? 120,
    height: pos.height ?? 120,
    delay: 0,
    duration: paintFill ? 3.0 : 1.5,
    hand_speed: 1.0,
  };
}

/**
 * @param {{ src, name }} imageProps  – src is a data-URL or object-URL
 * @param {{ x, y, width, height }} pos
 */
export function createImageModel({ src, name = 'Image' }, pos = {}) {
  return {
    id: uid(),
    type: 'image',
    name,
    src,                    // base64 data-URL so it survives JSON serialisation
    x: pos.x ?? 80,
    y: pos.y ?? 80,
    width:  pos.width  ?? 200,
    height: pos.height ?? 150,
    delay: 0,
    duration: 1.2,
    hand_speed: 1.0,
    // reveal effect: 'draw' | 'wipe-right' | 'wipe-down' | 'fade' | 'zoom'
    revealEffect: 'draw',
  };
}

/**
 * @param {{ rawText, fontFamily, fontStyle, fontWeight, fontSize }} textProps
 * @param {{ x, y }} pos
 */
export function createTextModel(
  { rawText = 'Text', fontFamily = 'Georgia', fontStyle = 'normal', fontWeight = 'normal', fontSize = 36, color = '#1a1a1a' },
  pos = {}
) {
  return {
    id: uid(),
    type: 'text',
    name: rawText.slice(0, 20) || 'Text',
    rawText,
    fontFamily,
    fontStyle,
    fontWeight,
    fontSize,
    color,
    x: pos.x ?? 80,
    y: pos.y ?? 100,
    width: Math.max(120, fontSize * rawText.length * 0.65),
    // height = SVG natural height (RENDER * 1.15 = fontSize * 1.15) + 2px margin
    // This ensures the animated SVG (at natural 1:1 scale) fits without clipping
    height: Math.ceil(fontSize * 1.15) + 2,
    delay: 0,
    duration: 1,
    hand_speed: 1.0,
  };
}