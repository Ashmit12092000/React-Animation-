import { useEffect, useRef, useState } from 'react';
import { useStore } from '../../store';
import { useMobile } from '../../hooks/useMobile';

export const ENTRY_EFFECTS = [
  { id: 'none',         label: 'No Effect',     icon: '✕',  desc: 'Appears instantly' },
  { id: 'fadeIn',       label: 'Fade In',        icon: '👁',  desc: 'Dissolve into view' },
  { id: 'slideInLeft',  label: 'Slide In Left',  icon: '⬅',  desc: 'Enters from the left' },
  { id: 'slideInRight', label: 'Slide In Right', icon: '➡',  desc: 'Enters from the right' },
  { id: 'slideInUp',    label: 'Slide In Up',    icon: '⬆',  desc: 'Rises from below' },
  { id: 'slideInDown',  label: 'Slide In Down',  icon: '⬇',  desc: 'Drops from above' },
  { id: 'zoomIn',       label: 'Zoom In',        icon: '🔍', desc: 'Scales up from nothing' },
  { id: 'bounceIn',     label: 'Bounce In',      icon: '🏀', desc: 'Springs into place' },
  { id: 'flipInX',      label: 'Flip In',        icon: '🔄', desc: 'Flips in on X axis' },
  { id: 'rubberBand',   label: 'Rubber Band',    icon: '🎸', desc: 'Stretches and snaps' },
];

const KEYFRAMES_CSS = `
@keyframes wb-fadeIn       { from{opacity:0}to{opacity:1} }
@keyframes wb-slideInLeft  { from{opacity:0;transform:translateX(-60px)}to{opacity:1;transform:translateX(0)} }
@keyframes wb-slideInRight { from{opacity:0;transform:translateX(60px)}to{opacity:1;transform:translateX(0)} }
@keyframes wb-slideInUp    { from{opacity:0;transform:translateY(60px)}to{opacity:1;transform:translateY(0)} }
@keyframes wb-slideInDown  { from{opacity:0;transform:translateY(-60px)}to{opacity:1;transform:translateY(0)} }
@keyframes wb-zoomIn       { from{opacity:0;transform:scale(0.3)}to{opacity:1;transform:scale(1)} }
@keyframes wb-bounceIn     {
  0%{opacity:0;transform:scale(0.3)} 50%{opacity:1;transform:scale(1.12)}
  70%{transform:scale(0.92)} 85%{transform:scale(1.05)} 100%{transform:scale(1)}
}
@keyframes wb-flipInX {
  from{opacity:0;transform:perspective(400px) rotateX(90deg)}
  to{opacity:1;transform:perspective(400px) rotateX(0deg)}
}
@keyframes wb-rubberBand {
  0%{transform:scaleX(1)} 30%{transform:scaleX(1.25) scaleY(0.75)}
  40%{transform:scaleX(0.75) scaleY(1.25)} 60%{transform:scaleX(1.15) scaleY(0.85)}
  80%{transform:scaleX(0.95) scaleY(1.05)} 100%{transform:scaleX(1)}
}
@keyframes wb-sheetUp { from{transform:translateY(100%)}to{transform:translateY(0)} }
@keyframes wb-sheetDown { from{transform:translateY(0)}to{transform:translateY(100%)} }
/* Custom scrollbar for submenu */
.wb-submenu-scroll::-webkit-scrollbar { width: 4px; }
.wb-submenu-scroll::-webkit-scrollbar-track { background: transparent; }
.wb-submenu-scroll::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
.wb-submenu-scroll::-webkit-scrollbar-thumb:hover { background: #475569; }
`;

let injected = false;
function ensureKeyframes() {
  if (injected) return;
  injected = true;
  const s = document.createElement('style');
  s.textContent = KEYFRAMES_CSS;
  document.head.appendChild(s);
}

export function getEntryEffectStyle(effectId, durationSec = 0.6) {
  if (!effectId || effectId === 'none') return {};
  const map = {
    fadeIn:'wb-fadeIn', slideInLeft:'wb-slideInLeft', slideInRight:'wb-slideInRight',
    slideInUp:'wb-slideInUp', slideInDown:'wb-slideInDown', zoomIn:'wb-zoomIn',
    bounceIn:'wb-bounceIn', flipInX:'wb-flipInX', rubberBand:'wb-rubberBand',
  };
  const name = map[effectId];
  if (!name) return {};
  return { animation: `${name} ${durationSec}s cubic-bezier(0.22,1,0.36,1) both` };
}

// ─── Desktop flyout context menu ────────────────────────────────────────────
function DesktopMenu({ x, y, graphicId, graphic, currentEffect, onEffectClick, onDelete, onDuplicate, onClose }) {
  const menuRef     = useRef(null);
  const [showEffects, setShowEffects] = useState(false);
  const [subPos, setSubPos]           = useState({ top: -4, left: '100%' });
  const effectRowRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    const onDown = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) onClose(); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onDown); };
  }, [onClose]);

  // Position menu so it stays in viewport
  const menuW = 220, subW = 240, subMaxH = 340;
  const vw = window.innerWidth, vh = window.innerHeight;
  const adjX = x + menuW > vw ? x - menuW : x;
  const adjY = y + 260 > vh ? Math.max(10, y - 260) : y;

  const handleEffectRowEnter = () => {
    if (!effectRowRef.current) return;
    const rect = effectRowRef.current.getBoundingClientRect();
    const goLeft = adjX + menuW + subW > vw;
    // Clamp top so submenu doesn't go below viewport
    let top = rect.top - (adjY); // relative to menu
    const estimatedSubH = Math.min(subMaxH, ENTRY_EFFECTS.length * 58 + 40);
    if (adjY + top + estimatedSubH > vh) {
      top = Math.max(4, vh - adjY - estimatedSubH - 8);
    }
    setSubPos({ top, [goLeft ? 'right' : 'left']: menuW });
    setShowEffects(true);
  };

  const itemBase = {
    padding: '9px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center',
    gap: 9, borderRadius: 6, margin: '2px 4px', transition: 'background 0.1s', position: 'relative',
  };

  return (
    <div ref={menuRef} onContextMenu={e => e.preventDefault()}
      style={{
        position: 'fixed', top: adjY, left: adjX, zIndex: 9999,
        background: '#1e293b', border: '1px solid #334155', borderRadius: 10,
        boxShadow: '0 12px 40px rgba(0,0,0,0.55)', minWidth: menuW,
        fontFamily: 'system-ui,sans-serif', fontSize: 13, color: '#e2e8f0',
        overflow: 'visible', userSelect: 'none',
        animation: 'wb-fadeIn 0.12s ease both',
      }}>

      {/* Header */}
      <div style={{ padding: '8px 14px 4px', color: '#64748b', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {graphic?.name ?? 'Object'}
      </div>
      <Divider />

      {/* Effects row */}
      <div ref={effectRowRef}
        onMouseEnter={handleEffectRowEnter}
        onMouseLeave={() => setShowEffects(false)}
        style={{ ...itemBase, background: showEffects ? '#2d3f55' : '' }}>
        <span style={{ fontSize: 16 }}>✨</span>
        <span style={{ flex: 1 }}>Entry Effect</span>
        <span style={{ color: '#64748b', fontSize: 11, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {currentEffect !== 'none' ? ENTRY_EFFECTS.find(e => e.id === currentEffect)?.label : 'None'}
        </span>
        <span style={{ color: '#64748b', fontSize: 10, marginLeft: 4 }}>▶</span>

        {/* Flyout submenu */}
        {showEffects && (
          <div
            className="wb-submenu-scroll"
            onMouseEnter={() => setShowEffects(true)}
            onMouseLeave={() => setShowEffects(false)}
            style={{
              position: 'fixed',
              top: adjY + subPos.top,
              ...(subPos.left !== undefined
                ? { left: adjX + (typeof subPos.left === 'number' ? subPos.left : menuW) }
                : { right: window.innerWidth - adjX }),
              background: '#1e293b', border: '1px solid #334155', borderRadius: 10,
              boxShadow: '0 12px 40px rgba(0,0,0,0.55)', minWidth: subW,
              zIndex: 10000, animation: 'wb-fadeIn 0.1s ease both',
              maxHeight: subMaxH, overflowY: 'auto', overflowX: 'hidden',
            }}>
            <div style={{ padding: '8px 14px 4px', color: '#64748b', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', position: 'sticky', top: 0, background: '#1e293b', zIndex: 1 }}>
              Entry Animation
            </div>
            <div style={{ height: 1, background: '#334155', marginBottom: 4 }} />
            {ENTRY_EFFECTS.map(eff => {
              const isActive = currentEffect === eff.id;
              return (
                <div key={eff.id} onClick={() => onEffectClick(eff.id)}
                  onMouseEnter={e => e.currentTarget.style.background = '#2d3f55'}
                  onMouseLeave={e => e.currentTarget.style.background = isActive ? 'rgba(59,130,246,0.18)' : ''}
                  style={{
                    ...itemBase, margin: '1px 4px',
                    background: isActive ? 'rgba(59,130,246,0.18)' : '',
                    borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent',
                  }}>
                  <span style={{ fontSize: 15, width: 22, textAlign: 'center', flexShrink: 0 }}>{eff.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: isActive ? 700 : 500, color: isActive ? '#93c5fd' : '#e2e8f0' }}>{eff.label}</div>
                    <div style={{ color: '#64748b', fontSize: 11, marginTop: 1 }}>{eff.desc}</div>
                  </div>
                  {isActive && <span style={{ color: '#3b82f6', fontSize: 14, flexShrink: 0 }}>✓</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Divider />

      {/* Duplicate */}
      <MenuItem icon="⧉" label="Duplicate" onClick={onDuplicate} />

      <Divider />

      {/* Delete */}
      <MenuItem icon="🗑" label="Delete" hint="Del" onClick={onDelete} danger />
    </div>
  );
}

// ─── Mobile bottom sheet ─────────────────────────────────────────────────────
function MobileSheet({ graphicId, graphic, currentEffect, onEffectClick, onDelete, onDuplicate, onClose }) {
  const [view, setView] = useState('main'); // 'main' | 'effects'
  const [closing, setClosing] = useState(false);
  const sheetRef = useRef(null);

  const close = () => {
    setClosing(true);
    setTimeout(onClose, 250);
  };

  // Close on backdrop tap
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) close();
  };

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const itemStyle = {
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '14px 20px', cursor: 'pointer',
    fontFamily: 'system-ui,sans-serif', fontSize: 15,
    color: '#e2e8f0', borderBottom: '1px solid #1e293b',
    transition: 'background 0.1s', userSelect: 'none',
  };

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        background: 'rgba(0,0,0,0.45)',
        animation: closing ? 'wb-fadeIn 0.2s ease reverse both' : 'wb-fadeIn 0.2s ease both',
      }}>
      <div
        ref={sheetRef}
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: '#0f172a', borderRadius: '16px 16px 0 0',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
          animation: closing ? 'wb-sheetDown 0.25s ease both' : 'wb-sheetUp 0.3s cubic-bezier(0.22,1,0.36,1) both',
          overflow: 'hidden',
          maxHeight: '80vh',
          display: 'flex', flexDirection: 'column',
        }}>

        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
          <div style={{ width: 36, height: 4, background: '#334155', borderRadius: 2 }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 20px 12px' }}>
          {view === 'effects' ? (
            <button onClick={() => setView('main')}
              style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: 15, cursor: 'pointer', padding: '4px 0', fontFamily: 'system-ui', display: 'flex', alignItems: 'center', gap: 4 }}>
              ‹ Back
            </button>
          ) : (
            <span style={{ fontFamily: 'system-ui', fontWeight: 700, fontSize: 15, color: '#f1f5f9' }}>
              {graphic?.name ?? 'Object'}
            </span>
          )}
          <button onClick={close}
            style={{ background: '#1e293b', border: 'none', color: '#94a3b8', width: 28, height: 28, borderRadius: '50%', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ✕
          </button>
        </div>

        {/* Main view */}
        {view === 'main' && (
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {/* Effects row */}
            <div
              onTouchEnd={() => setView('effects')}
              onClick={() => setView('effects')}
              style={{ ...itemStyle, justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: 20 }}>✨</span>
                <div>
                  <div style={{ fontWeight: 600 }}>Entry Effect</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                    {currentEffect !== 'none' ? ENTRY_EFFECTS.find(e => e.id === currentEffect)?.label : 'None set'}
                  </div>
                </div>
              </div>
              <span style={{ color: '#64748b', fontSize: 18 }}>›</span>
            </div>

            {/* Duplicate */}
            <div onTouchEnd={() => { onDuplicate(); close(); }} onClick={() => { onDuplicate(); close(); }} style={itemStyle}>
              <span style={{ fontSize: 20 }}>⧉</span>
              <span style={{ fontWeight: 500 }}>Duplicate</span>
            </div>

            {/* Delete */}
            <div
              onTouchEnd={() => { onDelete(); }}
              onClick={() => { onDelete(); }}
              style={{ ...itemStyle, color: '#f87171', borderBottom: 'none' }}>
              <span style={{ fontSize: 20 }}>🗑</span>
              <span style={{ fontWeight: 600 }}>Delete</span>
            </div>
          </div>
        )}

        {/* Effects grid view */}
        {view === 'effects' && (
          <div style={{ overflowY: 'auto', flex: 1, padding: '0 0 20px' }}>
            <div style={{ padding: '0 16px 8px', color: '#64748b', fontSize: 12, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
              Choose Entry Animation
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, padding: '0 12px' }}>
              {ENTRY_EFFECTS.map(eff => {
                const isActive = currentEffect === eff.id;
                return (
                  <div key={eff.id}
                    onClick={() => { onEffectClick(eff.id); close(); }}
                    onTouchEnd={() => { onEffectClick(eff.id); close(); }}
                    style={{
                      background: isActive ? 'rgba(59,130,246,0.2)' : '#1e293b',
                      border: isActive ? '2px solid #3b82f6' : '2px solid #334155',
                      borderRadius: 12, padding: '14px 12px',
                      cursor: 'pointer', display: 'flex', flexDirection: 'column',
                      alignItems: 'flex-start', gap: 6, userSelect: 'none',
                      transition: 'all 0.15s',
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <span style={{ fontSize: 22 }}>{eff.icon}</span>
                      {isActive && <span style={{ color: '#3b82f6', fontSize: 16 }}>✓</span>}
                    </div>
                    <div style={{ fontFamily: 'system-ui', fontSize: 13, fontWeight: isActive ? 700 : 600, color: isActive ? '#93c5fd' : '#e2e8f0' }}>
                      {eff.label}
                    </div>
                    <div style={{ fontFamily: 'system-ui', fontSize: 11, color: '#64748b', lineHeight: 1.3 }}>
                      {eff.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function Divider() {
  return <div style={{ height: 1, background: '#334155', margin: '4px 0' }} />;
}

function MenuItem({ icon, label, hint, onClick, danger }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '9px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center',
        gap: 9, borderRadius: 6, margin: '2px 4px', transition: 'background 0.1s',
        background: hovered ? (danger ? 'rgba(239,68,68,0.12)' : '#2d3f55') : '',
        color: danger ? '#f87171' : '#e2e8f0',
      }}>
      <span style={{ fontSize: 15 }}>{icon}</span>
      <span style={{ flex: 1, fontWeight: danger ? 600 : 400 }}>{label}</span>
      {hint && <span style={{ color: '#64748b', fontSize: 11 }}>{hint}</span>}
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────
export default function ContextMenu({ x, y, graphicId, onClose }) {
  const isMobile           = useMobile();
  const deleteGraphic      = useStore(s => s.deleteGraphic);
  const updateGraphicProps = useStore(s => s.updateGraphicProps);
  const getSelectedScene   = useStore(s => s.getSelectedScene);

  ensureKeyframes();

  const scene        = getSelectedScene();
  const graphic      = scene?.graphics.find(g => g.id === graphicId);
  const currentEffect = graphic?.entryEffect ?? 'none';

  const handleEffectClick = (effectId) => {
    updateGraphicProps(graphicId, { entryEffect: effectId });
    onClose();
  };

  const handleDelete = () => {
    deleteGraphic(graphicId);
    onClose();
  };

  const handleDuplicate = () => {
    useStore.getState().duplicateGraphic(graphicId);
  };

  if (isMobile) {
    return (
      <MobileSheet
        graphicId={graphicId}
        graphic={graphic}
        currentEffect={currentEffect}
        onEffectClick={handleEffectClick}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onClose={onClose}
      />
    );
  }

  return (
    <DesktopMenu
      x={x} y={y}
      graphicId={graphicId}
      graphic={graphic}
      currentEffect={currentEffect}
      onEffectClick={handleEffectClick}
      onDelete={handleDelete}
      onDuplicate={handleDuplicate}
      onClose={onClose}
    />
  );
}