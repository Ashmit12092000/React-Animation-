import { useState } from 'react';
import { useStore } from '../../store';
import { useMobile } from '../../hooks/useMobile';

function MenuDropdown({ label, items }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: open ? '#1e293b' : 'none', border: 'none',
          padding: '4px 10px', borderRadius: 4,
          color: '#cbd5e1', fontSize: 13, cursor: 'pointer',
          transition: 'background 0.1s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#1e293b')}
        onMouseLeave={e => !open && (e.currentTarget.style.background = 'none')}
      >
        {label}
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: '100%', left: 0, zIndex: 100,
            background: '#1e293b', border: '1px solid #334155',
            borderRadius: 8, minWidth: 180, overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            marginTop: 4,
          }}>
            {items.map((item, i) =>
              item === '---' ? (
                <div key={i} style={{ height: 1, background: '#334155', margin: '2px 0' }} />
              ) : (
                <button
                  key={i}
                  onClick={() => { item.action(); setOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '9px 14px',
                    background: 'none', border: 'none', textAlign: 'left',
                    color: item.danger ? '#ef4444' : '#e2e8f0',
                    fontSize: 13, cursor: 'pointer',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#334155')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <span style={{ width: 18, textAlign: 'center' }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.shortcut && (
                    <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>
                      {item.shortcut}
                    </span>
                  )}
                </button>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function TopBar() {
  const isMobile = useMobile();
  const project = useStore(s => s.project);
  const view = useStore(s => s.view);
  const saveProject = useStore(s => s.saveProject);
  const closeProject = useStore(s => s.closeProject);
  const undo = useStore(s => s.undo);
  const redo = useStore(s => s.redo);
  const undoStack = useStore(s => s.undoStack);
  const redoStack = useStore(s => s.redoStack);
  const openPreviewModal = useStore(s => s.openPreviewModal);
  const openProjectSettings = useStore(s => s.openProjectSettings);
  const selectedGraphicId = useStore(s => s.selectedGraphicId);
  const deleteGraphic = useStore(s => s.deleteGraphic);

  const menus = view === 'editor' ? [
    {
      label: 'File',
      items: [
        { icon: '💾', label: 'Save', shortcut: 'Ctrl+S', action: saveProject },
        { icon: '▶', label: 'Preview', action: openPreviewModal },
        '---',
        { icon: '⚙', label: 'Project Settings', action: openProjectSettings },
        '---',
        { icon: '🏠', label: 'Back to Home', action: closeProject, danger: false },
      ],
    },
    {
      label: 'Edit',
      items: [
        { icon: '↩', label: 'Undo', shortcut: 'Ctrl+Z', action: undo, disabled: undoStack.length === 0 },
        { icon: '↪', label: 'Redo', shortcut: 'Ctrl+Y', action: redo, disabled: redoStack.length === 0 },
        '---',
        { icon: '🗑', label: 'Delete Selected', shortcut: 'Del', danger: true,
          action: () => selectedGraphicId && deleteGraphic(selectedGraphicId) },
      ],
    },
    {
      label: 'Help',
      items: [
        { icon: 'ℹ', label: 'About Whiteboard Animation', action: () => window.open('https://github.com/Rsverma/OpenDoodler', '_blank') },
      ],
    },
  ] : [];

  return (
    <div style={{
      height: 46,
      background: '#0f172a',
      borderBottom: '1px solid #1e293b',
      display: 'flex',
      alignItems: 'center',
      padding: '0 14px',
      gap: 8,
      flexShrink: 0,
      userSelect: 'none',
    }}>
      {/* Logo */}
      <span style={{ fontSize: 20, marginRight: 4 }}>✏️</span>
      {!isMobile && (
        <span style={{
          fontFamily: 'Georgia, serif',
          fontSize: 16, fontWeight: 700,
          color: '#f1f5f9', marginRight: 8,
          letterSpacing: -0.3,
        }}>
          OpenDoodler
        </span>
      )}

      {/* Divider */}
      {menus.length > 0 && (
        <div style={{ width: 1, height: 20, background: '#1e293b', marginRight: 4 }} />
      )}

      {/* Menu items */}
      {menus.map(m => (
        <MenuDropdown key={m.label} label={m.label} items={m.items} />
      ))}

      {/* Center title */}
      {view === 'editor' && project && (
        <div style={{ flex: 1, textAlign: 'center', color: '#f59e0b', fontFamily: 'Georgia, serif', fontSize: isMobile ? 12 : 15, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {project.title}
        </div>
      )}

      {view === 'launch' && <div style={{ flex: 1 }} />}

      {/* Right: undo/redo when in editor */}
      {view === 'editor' && (
        <div style={{ display: 'flex', gap: 4 }}>
          <IconBtn
            title={`Undo (${undoStack.length})`}
            disabled={undoStack.length === 0}
            onClick={undo}
          >↩</IconBtn>
          <IconBtn
            title={`Redo (${redoStack.length})`}
            disabled={redoStack.length === 0}
            onClick={redo}
          >↪</IconBtn>
        </div>
      )}

      {/* Board badge */}
      {view === 'editor' && project && !isMobile && (
        <span style={{
          fontSize: 11, color: '#64748b', padding: '2px 8px',
          background: '#1e293b', borderRadius: 4, marginLeft: 4,
        }}>
          {project.boardType}
        </span>
      )}
    </div>
  );
}

function IconBtn({ children, onClick, disabled, title }) {
  return (
    <button
      title={title}
      disabled={disabled}
      onClick={onClick}
      style={{
        width: 28, height: 28, background: 'none',
        border: '1px solid #334155', borderRadius: 5,
        color: disabled ? '#334155' : '#94a3b8',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.1s',
      }}
      onMouseEnter={e => !disabled && (e.currentTarget.style.background = '#1e293b')}
      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
    >
      {children}
    </button>
  );
}
