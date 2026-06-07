import { useStore } from './store';
import { useMobile } from './hooks/useMobile';

export default function LaunchView() {
  const isMobile = useMobile();
  const recentProjects = useStore(s => s.recentProjects);
  const openProject = useStore(s => s.openProject);
  const deleteRecentProject = useStore(s => s.deleteRecentProject);
  const openNewProjectModal = useStore(s => s.openNewProjectModal);

  const fmt = (iso) => {
    try { return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); }
    catch { return '—'; }
  };

  return (
    <div style={{
      flex: 1, overflowY: 'auto',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '48px 24px',
      background: '#0a0f1e',
    }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 52 }}>
        <div style={{ fontSize: 64, marginBottom: 10, filter: 'drop-shadow(0 4px 16px rgba(245,158,11,0.3))' }}>✏️</div>
        <h1 style={{
          fontFamily: 'Georgia, serif', fontSize: isMobile ? 32 : 52, fontWeight: 700,
          color: '#f1f5f9', margin: 0, letterSpacing: -1.5,
          background: 'linear-gradient(135deg, #f1f5f9 30%, #f59e0b 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          Whiteboard Animation
        </h1>
        <p style={{ color: '#64748b', marginTop: 8, fontSize: isMobile ? 14 : 17 }}>
          whiteboard animation editor 
        </p>
      </div>

      {/* Content area */}
      <div style={{ width: '100%', maxWidth: 880 }}>

        {/* Recent projects card */}
        <div style={{
          background: '#111827', borderRadius: 12,
          border: '1px solid #1e293b', overflow: 'hidden', marginBottom: 20,
          boxShadow: '0 4px 32px rgba(0,0,0,0.3)',
        }}>
          <div style={{
            padding: '16px 24px', borderBottom: '1px solid #1e293b',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: '#f1f5f9', fontWeight: 700 }}>
              Recent Projects
            </span>
            <span style={{ fontSize: 12, color: '#64748b', background: '#1e293b', padding: '3px 10px', borderRadius: 20 }}>
              {recentProjects.length} project{recentProjects.length !== 1 ? 's' : ''}
            </span>
          </div>

          {recentProjects.length === 0 ? (
            <div style={{
              padding: '48px 0', textAlign: 'center', color: '#4b5563',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <p style={{ fontSize: 14 }}>No projects yet — create your first one below!</p>
            </div>
          ) : isMobile ? (
            /* ── Mobile: card list ── */
            <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentProjects.map(p => (
                <div key={p.id} style={{
                  background: '#0f172a', borderRadius: 8, border: '1px solid #1e293b',
                  padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                    <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>
                      {p.boardType} · {p.scenes?.length ?? 0} scene{(p.scenes?.length ?? 0) !== 1 ? 's' : ''} · {fmt(p.createdOn)}
                    </div>
                  </div>
                  <button onClick={() => openProject(p.id)} style={{
                    padding: '5px 14px', background: '#10b981', border: 'none',
                    borderRadius: 6, color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 700, flexShrink: 0,
                  }}>Edit</button>
                  <button onClick={() => { if (window.confirm(`Delete "${p.title}"?`)) deleteRecentProject(p.id); }} style={{
                    padding: '5px 10px', background: 'transparent', border: '1px solid #374151',
                    borderRadius: 6, color: '#94a3b8', fontSize: 12, cursor: 'pointer', fontWeight: 600, flexShrink: 0,
                  }}>✕</button>
                </div>
              ))}
            </div>
          ) : (
            /* ── Desktop: table ── */
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0f172a' }}>
                  {['Title', 'Board', 'Scenes', 'Created', '', ''].map((h, i) => (
                    <th key={i} style={{
                      padding: '10px 20px', textAlign: 'left',
                      fontSize: 10, color: '#64748b', fontWeight: 700,
                      letterSpacing: 1, textTransform: 'uppercase',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentProjects.map(p => (
                  <tr
                    key={p.id}
                    style={{ borderTop: '1px solid #1e293b', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#1e293b')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '13px 20px', color: '#f1f5f9', fontSize: 14, fontWeight: 600 }}>
                      {p.title}
                    </td>
                    <td style={{ padding: '13px 20px' }}>
                      <span style={{
                        fontSize: 11, color: '#94a3b8', background: '#1e293b',
                        padding: '2px 8px', borderRadius: 4, textTransform: 'capitalize',
                      }}>
                        {p.boardType}
                      </span>
                    </td>
                    <td style={{ padding: '13px 20px', color: '#64748b', fontSize: 13 }}>
                      {p.scenes?.length ?? 0}
                    </td>
                    <td style={{ padding: '13px 20px', color: '#64748b', fontSize: 13 }}>
                      {fmt(p.createdOn)}
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <button
                        onClick={() => openProject(p.id)}
                        style={{
                          padding: '5px 16px', background: '#10b981',
                          border: 'none', borderRadius: 6, color: '#fff',
                          fontSize: 12, cursor: 'pointer', fontWeight: 700,
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#059669')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#10b981')}
                      >
                        Edit
                      </button>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete "${p.title}"?`)) deleteRecentProject(p.id);
                        }}
                        style={{
                          padding: '5px 14px', background: 'transparent',
                          border: '1px solid #374151', borderRadius: 6, color: '#94a3b8',
                          fontSize: 12, cursor: 'pointer', fontWeight: 600,
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = '#ef4444';
                          e.currentTarget.style.color = '#ef4444';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = '#374151';
                          e.currentTarget.style.color = '#94a3b8';
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* New project button */}
        <button
          onClick={openNewProjectModal}
          style={{
            width: '100%', padding: '20px 0',
            background: '#111827', border: '2px dashed #334155',
            borderRadius: 12, color: '#94a3b8',
            fontSize: 15, cursor: 'pointer', fontWeight: 600,
            fontFamily: 'inherit', transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#f59e0b';
            e.currentTarget.style.color = '#f59e0b';
            e.currentTarget.style.background = '#1e1a09';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#334155';
            e.currentTarget.style.color = '#94a3b8';
            e.currentTarget.style.background = '#111827';
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="16"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
          Create New Project
        </button>
      </div>
    </div>
  );
}
