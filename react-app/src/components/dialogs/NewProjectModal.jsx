import { useState } from 'react';
import { useStore } from '../../store';
import { BOARD_TYPES } from '../../assets';

export default function NewProjectModal() {
  const createNewProject = useStore(s => s.createNewProject);
  const closeNewProjectModal = useStore(s => s.closeNewProjectModal);

  const [title, setTitle] = useState('Untitled Project');
  const [boardType, setBoardType] = useState('whiteboard');

  const confirm = () => {
    createNewProject(title.trim() || 'Untitled Project', boardType);
  };

  return (
    <Overlay onClose={closeNewProjectModal}>
      <div style={{ width: '100%' }}>
        <h2 style={styles.title}>New Project</h2>

        <Field label="Project Title">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && confirm()}
            autoFocus
            style={styles.input}
          />
        </Field>

        <Field label="Board Type">
          <div style={{ display: 'flex', gap: 8 }}>
            {BOARD_TYPES.map(bt => (
              <button
                key={bt.id}
                onClick={() => setBoardType(bt.id)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 8, cursor: 'pointer',
                  background: boardType === bt.id ? '#3b82f6' : '#1e293b',
                  border: `2px solid ${boardType === bt.id ? '#3b82f6' : '#334155'}`,
                  color: boardType === bt.id ? '#fff' : '#94a3b8',
                  fontSize: 12, fontWeight: 700, transition: 'all 0.15s',
                }}
              >
                <div style={{
                  width: 24, height: 16, borderRadius: 3, margin: '0 auto 6px',
                  background: bt.bg, border: '1px solid #475569',
                }} />
                {bt.label}
              </button>
            ))}
          </div>
        </Field>

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button onClick={closeNewProjectModal} style={styles.btnSecondary}>Cancel</button>
          <button onClick={confirm} style={styles.btnPrimary}>Create Project →</button>
        </div>
      </div>
    </Overlay>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 11, color: '#94a3b8', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export function Overlay({ children, onClose }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.8)',
        zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: '#111827',
        border: '1px solid #1e293b',
        borderRadius: 12,
        padding: 'clamp(16px, 5vw, 32px)',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        width: '100%',
        maxWidth: 460,
        animation: 'modalIn 0.2s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {children}
      </div>
    </div>
  );
}

const styles = {
  title: {
    fontFamily: 'Georgia, serif',
    fontSize: 22, color: '#f1f5f9',
    marginTop: 0, marginBottom: 20,
  },
  input: {
    width: '100%', background: '#1e293b',
    border: '1px solid #334155', borderRadius: 6,
    padding: '8px 10px', color: '#f1f5f9',
    fontSize: 14, outline: 'none', boxSizing: 'border-box',
  },
  btnPrimary: {
    flex: 2, padding: '10px 0',
    background: '#3b82f6', border: 'none',
    borderRadius: 8, color: '#fff',
    cursor: 'pointer', fontWeight: 700, fontSize: 14,
  },
  btnSecondary: {
    flex: 1, padding: '10px 0',
    background: '#1e293b', border: '1px solid #334155',
    borderRadius: 8, color: '#94a3b8',
    cursor: 'pointer', fontWeight: 700, fontSize: 14,
  },
};
