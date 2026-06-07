// ─── Board types ──────────────────────────────────────────────────────────────
export const BOARD_TYPES = [
  { id: 'whiteboard', label: 'Whiteboard', bg: '#ffffff' },
  { id: 'blackboard', label: 'Blackboard', bg: '#1c2a1c' },
  { id: 'greenboard', label: 'Greenboard', bg: '#1a3a1a' },
];

// ─── System fonts ─────────────────────────────────────────────────────────────
export const SYSTEM_FONTS = [
  // These have TTF files in public/ and render as real strokes during animation
  'Pacifico',
  'Caveat',
  'Dancing Script',
  'Open Sans',
  // System fonts (fall back to Open Sans for stroke animation)
  
  'Georgia',
  'Times New Roman',
  'Arial',
  'Helvetica',
  'Verdana',
  'Trebuchet MS',
  'Comic Sans MS',
  'Impact',
  'Courier New',
  'Palatino',
];

// ─── Sample shapes (inline SVG) ───────────────────────────────────────────────
export const SAMPLE_SHAPES = [
  {
    id: 'shape_circle',
    name: 'Circle',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="44" fill="none" stroke="#1e293b" stroke-width="6"/>
    </svg>`,
  },
  {
    id: 'shape_rect',
    name: 'Rectangle',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="18" width="84" height="64" rx="4" fill="none" stroke="#1e293b" stroke-width="6"/>
    </svg>`,
  },
  {
    id: 'shape_triangle',
    name: 'Triangle',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <polygon points="50,8 94,92 6,92" fill="none" stroke="#1e293b" stroke-width="6" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: 'shape_star',
    name: 'Star',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <polygon points="50,6 61,35 92,35 68,57 77,88 50,70 23,88 32,57 8,35 39,35"
        fill="none" stroke="#1e293b" stroke-width="5" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: 'shape_arrow_right',
    name: 'Arrow →',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <polyline points="10,50 78,50" fill="none" stroke="#1e293b" stroke-width="7" stroke-linecap="round"/>
      <polyline points="58,28 82,50 58,72" fill="none" stroke="#1e293b" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: 'shape_arrow_up',
    name: 'Arrow ↑',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <polyline points="50,88 50,18" fill="none" stroke="#1e293b" stroke-width="7" stroke-linecap="round"/>
      <polyline points="28,42 50,16 72,42" fill="none" stroke="#1e293b" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: 'shape_diamond',
    name: 'Diamond',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <polygon points="50,6 94,50 50,94 6,50" fill="none" stroke="#1e293b" stroke-width="6" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: 'shape_checkmark',
    name: 'Check',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <polyline points="12,52 38,78 88,22" fill="none" stroke="#10b981" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: 'shape_cross',
    name: 'Cross ✕',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <line x1="16" y1="16" x2="84" y2="84" stroke="#ef4444" stroke-width="9" stroke-linecap="round"/>
      <line x1="84" y1="16" x2="16" y2="84" stroke="#ef4444" stroke-width="9" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'shape_speech',
    name: 'Speech Bubble',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M10,12 Q10,6 16,6 H84 Q90,6 90,12 V58 Q90,64 84,64 H46 L28,88 L32,64 H16 Q10,64 10,58 Z"
        fill="none" stroke="#1e293b" stroke-width="5" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: 'shape_lightbulb',
    name: 'Lightbulb',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M50,10 A28,28 0 0 1 78,38 C78,54 66,62 64,70 H36 C34,62 22,54 22,38 A28,28 0 0 1 50,10 Z"
        fill="none" stroke="#f59e0b" stroke-width="5"/>
      <line x1="38" y1="78" x2="62" y2="78" stroke="#f59e0b" stroke-width="5" stroke-linecap="round"/>
      <line x1="40" y1="86" x2="60" y2="86" stroke="#f59e0b" stroke-width="5" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'shape_heart',
    name: 'Heart',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M50,82 C50,82 12,58 12,34 A22,22 0 0 1 50,26 A22,22 0 0 1 88,34 C88,58 50,82 50,82 Z"
        fill="none" stroke="#ef4444" stroke-width="6" stroke-linejoin="round"/>
    </svg>`,
  },
];

// ─── Sample graphics (whiteboard-style stick figures, icons, etc.) ────────────
export const SAMPLE_GRAPHICS = [
  {
    id: 'gfx_person',
    name: 'Person',
    svg: `<svg viewBox="0 0 100 160" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="22" r="18" fill="none" stroke="#1e293b" stroke-width="5"/>
      <line x1="50" y1="40" x2="50" y2="100" stroke="#1e293b" stroke-width="5" stroke-linecap="round"/>
      <line x1="50" y1="60" x2="20" y2="85" stroke="#1e293b" stroke-width="5" stroke-linecap="round"/>
      <line x1="50" y1="60" x2="80" y2="85" stroke="#1e293b" stroke-width="5" stroke-linecap="round"/>
      <line x1="50" y1="100" x2="26" y2="148" stroke="#1e293b" stroke-width="5" stroke-linecap="round"/>
      <line x1="50" y1="100" x2="74" y2="148" stroke="#1e293b" stroke-width="5" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'gfx_person_raising_hand',
    name: 'Raising Hand',
    svg: `<svg viewBox="0 0 100 160" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="22" r="18" fill="none" stroke="#1e293b" stroke-width="5"/>
      <line x1="50" y1="40" x2="50" y2="100" stroke="#1e293b" stroke-width="5" stroke-linecap="round"/>
      <line x1="50" y1="60" x2="16" y2="30" stroke="#1e293b" stroke-width="5" stroke-linecap="round"/>
      <line x1="50" y1="60" x2="80" y2="85" stroke="#1e293b" stroke-width="5" stroke-linecap="round"/>
      <line x1="50" y1="100" x2="26" y2="148" stroke="#1e293b" stroke-width="5" stroke-linecap="round"/>
      <line x1="50" y1="100" x2="74" y2="148" stroke="#1e293b" stroke-width="5" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'gfx_magnifier',
    name: 'Magnifier',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="42" cy="42" r="28" fill="none" stroke="#1e293b" stroke-width="7"/>
      <line x1="62" y1="62" x2="88" y2="88" stroke="#1e293b" stroke-width="8" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'gfx_laptop',
    name: 'Laptop',
    svg: `<svg viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="18" y="12" width="84" height="56" rx="4" fill="none" stroke="#1e293b" stroke-width="5"/>
      <rect x="24" y="18" width="72" height="44" rx="2" fill="none" stroke="#1e293b" stroke-width="3"/>
      <line x1="8" y1="74" x2="112" y2="74" stroke="#1e293b" stroke-width="5" stroke-linecap="round"/>
      <path d="M40,74 Q60,82 80,74" fill="none" stroke="#1e293b" stroke-width="4" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'gfx_lightbulb',
    name: 'Idea Bulb',
    svg: `<svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
      <path d="M50,8 A30,30 0 0 1 80,38 C80,56 68,64 66,74 H34 C32,64 20,56 20,38 A30,30 0 0 1 50,8 Z"
        fill="none" stroke="#f59e0b" stroke-width="5"/>
      <line x1="36" y1="82" x2="64" y2="82" stroke="#f59e0b" stroke-width="5" stroke-linecap="round"/>
      <line x1="38" y1="92" x2="62" y2="92" stroke="#f59e0b" stroke-width="5" stroke-linecap="round"/>
      <line x1="50" y1="0" x2="50" y2="-8" stroke="#f59e0b" stroke-width="4" stroke-linecap="round"/>
      <line x1="20" y1="10" x2="14" y2="4" stroke="#f59e0b" stroke-width="4" stroke-linecap="round"/>
      <line x1="80" y1="10" x2="86" y2="4" stroke="#f59e0b" stroke-width="4" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'gfx_cloud',
    name: 'Cloud',
    svg: `<svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M96,64 H28 A20,20 0 0 1 24,24 A28,28 0 0 1 78,18 A22,22 0 0 1 100,40 A20,20 0 0 1 96,64 Z"
        fill="none" stroke="#3b82f6" stroke-width="5" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: 'gfx_chart_bar',
    name: 'Bar Chart',
    svg: `<svg viewBox="0 0 110 100" xmlns="http://www.w3.org/2000/svg">
      <line x1="14" y1="8" x2="14" y2="84" stroke="#1e293b" stroke-width="4" stroke-linecap="round"/>
      <line x1="14" y1="84" x2="100" y2="84" stroke="#1e293b" stroke-width="4" stroke-linecap="round"/>
      <rect x="22" y="44" width="16" height="40" fill="#3b82f6" rx="2"/>
      <rect x="44" y="26" width="16" height="58" fill="#10b981" rx="2"/>
      <rect x="66" y="54" width="16" height="30" fill="#f59e0b" rx="2"/>
      <rect x="88" y="18" width="16" height="66" fill="#8b5cf6" rx="2"/>
    </svg>`,
  },
  {
    id: 'gfx_chart_line',
    name: 'Line Chart',
    svg: `<svg viewBox="0 0 110 100" xmlns="http://www.w3.org/2000/svg">
      <line x1="14" y1="8" x2="14" y2="84" stroke="#1e293b" stroke-width="4" stroke-linecap="round"/>
      <line x1="14" y1="84" x2="100" y2="84" stroke="#1e293b" stroke-width="4" stroke-linecap="round"/>
      <polyline points="22,72 44,50 66,60 88,24 100,30"
        fill="none" stroke="#3b82f6" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="22" cy="72" r="4" fill="#3b82f6"/>
      <circle cx="44" cy="50" r="4" fill="#3b82f6"/>
      <circle cx="66" cy="60" r="4" fill="#3b82f6"/>
      <circle cx="88" cy="24" r="4" fill="#3b82f6"/>
    </svg>`,
  },
  {
    id: 'gfx_trophy',
    name: 'Trophy',
    svg: `<svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
      <path d="M28,10 H72 V52 A22,22 0 0 1 28,52 Z" fill="none" stroke="#f59e0b" stroke-width="5" stroke-linejoin="round"/>
      <path d="M28,20 Q10,20 10,38 Q10,52 28,52" fill="none" stroke="#f59e0b" stroke-width="4"/>
      <path d="M72,20 Q90,20 90,38 Q90,52 72,52" fill="none" stroke="#f59e0b" stroke-width="4"/>
      <line x1="50" y1="72" x2="50" y2="94" stroke="#f59e0b" stroke-width="5" stroke-linecap="round"/>
      <rect x="32" y="94" width="36" height="10" rx="3" fill="none" stroke="#f59e0b" stroke-width="4"/>
    </svg>`,
  },
  {
    id: 'gfx_rocket',
    name: 'Rocket',
    svg: `<svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
      <path d="M50,6 C50,6 72,22 72,58 L50,74 L28,58 C28,22 50,6 50,6 Z"
        fill="none" stroke="#3b82f6" stroke-width="5" stroke-linejoin="round"/>
      <circle cx="50" cy="42" r="10" fill="none" stroke="#3b82f6" stroke-width="4"/>
      <path d="M28,58 L16,72 L28,68 Z" fill="none" stroke="#ef4444" stroke-width="4" stroke-linejoin="round"/>
      <path d="M72,58 L84,72 L72,68 Z" fill="none" stroke="#ef4444" stroke-width="4" stroke-linejoin="round"/>
      <path d="M42,74 Q50,90 58,74" fill="none" stroke="#f59e0b" stroke-width="5" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: 'gfx_target',
    name: 'Target',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="44" fill="none" stroke="#ef4444" stroke-width="4"/>
      <circle cx="50" cy="50" r="30" fill="none" stroke="#ef4444" stroke-width="4"/>
      <circle cx="50" cy="50" r="15" fill="none" stroke="#ef4444" stroke-width="4"/>
      <circle cx="50" cy="50" r="4" fill="#ef4444"/>
    </svg>`,
  },
  {
    id: 'gfx_puzzle',
    name: 'Puzzle',
    svg: `<svg viewBox="0 0 110 110" xmlns="http://www.w3.org/2000/svg">
      <path d="M10,10 H46 V26 Q54,20 54,30 Q54,40 46,34 V54 H26 Q32,62 22,62 Q12,62 18,54 H10 Z"
        fill="none" stroke="#8b5cf6" stroke-width="4" stroke-linejoin="round"/>
      <path d="M54,10 H100 V54 H84 Q90,62 80,62 Q70,62 76,54 H54 V34 Q46,40 46,30 Q46,20 54,26 Z"
        fill="none" stroke="#3b82f6" stroke-width="4" stroke-linejoin="round"/>
      <path d="M10,54 H18 Q12,62 22,62 Q32,62 26,54 H46 V100 H10 Z"
        fill="none" stroke="#10b981" stroke-width="4" stroke-linejoin="round"/>
      <path d="M54,54 H76 Q70,62 80,62 Q90,62 84,54 H100 V100 H54 Z"
        fill="none" stroke="#f59e0b" stroke-width="4" stroke-linejoin="round"/>
    </svg>`,
  },
];
// ─── Arrow graphics (all directions & styles) ─────────────────────────────────
export const ARROW_GRAPHICS = [
  // ── Outline block arrows (like the image reference) ──
  {
    id: 'arrow_block_right',
    name: 'Block →',
    svg: `<svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M5,28 H72 V12 L112,40 L72,68 V52 H5 Z"
        fill="none" stroke="#1e293b" stroke-width="5" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: 'arrow_block_left',
    name: 'Block ←',
    svg: `<svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M115,28 H48 V12 L8,40 L48,68 V52 H115 Z"
        fill="none" stroke="#1e293b" stroke-width="5" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: 'arrow_block_up',
    name: 'Block ↑',
    svg: `<svg viewBox="0 0 80 120" xmlns="http://www.w3.org/2000/svg">
      <path d="M28,115 V48 H12 L40,8 L68,48 H52 V115 Z"
        fill="none" stroke="#1e293b" stroke-width="5" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: 'arrow_block_down',
    name: 'Block ↓',
    svg: `<svg viewBox="0 0 80 120" xmlns="http://www.w3.org/2000/svg">
      <path d="M28,5 V72 H12 L40,112 L68,72 H52 V5 Z"
        fill="none" stroke="#1e293b" stroke-width="5" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: 'arrow_block_upleft',
    name: 'Block ↖',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M8,8 L8,52 L24,36 L58,70 L70,58 L36,24 L52,8 Z"
        fill="none" stroke="#1e293b" stroke-width="5" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: 'arrow_block_upright',
    name: 'Block ↗',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M92,8 L48,8 L64,24 L30,58 L42,70 L76,36 L92,52 Z"
        fill="none" stroke="#1e293b" stroke-width="5" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: 'arrow_block_downleft',
    name: 'Block ↙',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M8,92 L52,92 L36,76 L70,42 L58,30 L24,64 L8,48 Z"
        fill="none" stroke="#1e293b" stroke-width="5" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: 'arrow_block_downright',
    name: 'Block ↘',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M92,92 L92,48 L76,64 L42,30 L30,42 L64,76 L48,92 Z"
        fill="none" stroke="#1e293b" stroke-width="5" stroke-linejoin="round"/>
    </svg>`,
  },
  // ── Thin line arrows ──
  {
    id: 'arrow_line_right',
    name: 'Arrow →',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <line x1="10" y1="50" x2="78" y2="50" stroke="#1e293b" stroke-width="7" stroke-linecap="round"/>
      <polyline points="58,28 82,50 58,72" fill="none" stroke="#1e293b" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: 'arrow_line_left',
    name: 'Arrow ←',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <line x1="90" y1="50" x2="22" y2="50" stroke="#1e293b" stroke-width="7" stroke-linecap="round"/>
      <polyline points="42,28 18,50 42,72" fill="none" stroke="#1e293b" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: 'arrow_line_up',
    name: 'Arrow ↑',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <line x1="50" y1="90" x2="50" y2="22" stroke="#1e293b" stroke-width="7" stroke-linecap="round"/>
      <polyline points="28,42 50,18 72,42" fill="none" stroke="#1e293b" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: 'arrow_line_down',
    name: 'Arrow ↓',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <line x1="50" y1="10" x2="50" y2="78" stroke="#1e293b" stroke-width="7" stroke-linecap="round"/>
      <polyline points="28,58 50,82 72,58" fill="none" stroke="#1e293b" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },
  // ── Curved arrows ──
  {
    id: 'arrow_curve_right',
    name: 'Curve →',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M15,70 Q15,20 80,20" fill="none" stroke="#1e293b" stroke-width="6" stroke-linecap="round"/>
      <polyline points="65,8 82,22 68,38" fill="none" stroke="#1e293b" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: 'arrow_curve_left',
    name: 'Curve ←',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M85,70 Q85,20 20,20" fill="none" stroke="#1e293b" stroke-width="6" stroke-linecap="round"/>
      <polyline points="35,8 18,22 32,38" fill="none" stroke="#1e293b" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: 'arrow_curve_up',
    name: 'Curve ↑',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M30,85 Q80,85 80,20" fill="none" stroke="#1e293b" stroke-width="6" stroke-linecap="round"/>
      <polyline points="68,35 80,18 92,35" fill="none" stroke="#1e293b" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },
  // ── Double-headed arrows ──
  {
    id: 'arrow_double_horiz',
    name: '↔ Double H',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <line x1="18" y1="50" x2="82" y2="50" stroke="#1e293b" stroke-width="7" stroke-linecap="round"/>
      <polyline points="35,32 12,50 35,68" fill="none" stroke="#1e293b" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="65,32 88,50 65,68" fill="none" stroke="#1e293b" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: 'arrow_double_vert',
    name: '↕ Double V',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <line x1="50" y1="18" x2="50" y2="82" stroke="#1e293b" stroke-width="7" stroke-linecap="round"/>
      <polyline points="32,35 50,12 68,35" fill="none" stroke="#1e293b" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="32,65 50,88 68,65" fill="none" stroke="#1e293b" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },
  // ── Circular arrow ──
  {
    id: 'arrow_circular',
    name: 'Cycle ↻',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M50,15 A35,35 0 1 1 18,62" fill="none" stroke="#1e293b" stroke-width="6" stroke-linecap="round"/>
      <polyline points="6,48 16,65 30,52" fill="none" stroke="#1e293b" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: 'arrow_circular_ccw',
    name: 'Cycle ↺',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M50,15 A35,35 0 1 0 82,62" fill="none" stroke="#1e293b" stroke-width="6" stroke-linecap="round"/>
      <polyline points="94,48 84,65 70,52" fill="none" stroke="#1e293b" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },
];

// ─── Paint fills (solid color rectangles for bucket-fill effect) ──────────────
export const PAINT_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
  '#a855f7', '#ec4899', '#f43f5e', '#1e293b',
  '#64748b', '#94a3b8', '#ffffff', '#000000',
];
