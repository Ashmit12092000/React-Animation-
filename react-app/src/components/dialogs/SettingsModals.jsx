import { useState } from 'react';
import { useStore } from '../../store';
import { Overlay } from './NewProjectModal';
import { BOARD_TYPES } from '../../assets';

// ─── Project Settings ─────────────────────────────────────────────────────────
export function ProjectSettingsModal() {
  const project = useStore(s => s.project);
  const updateProjectSettings = useStore(s => s.updateProjectSettings);
  const closeProjectSettings = useStore(s => s.closeProjectSettings);

  const [title, setTitle] = useState(project?.title ?? '');
  const [boardType, setBoardType] = useState(project?.boardType ?? 'whiteboard');

  const save = () => {
    updateProjectSettings({ title: title.trim() || 'Untitled Project', boardType });
    closeProjectSettings();
  };

  return (
    <Overlay onClose={closeProjectSettings}>
      <h2 style={styles.title}>⚙ Project Settings</h2>

      <Field label="Title">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={styles.input}
          autoFocus
        />
      </Field>

      <Field label="Board Type">
        <div style={{ display: 'flex', gap: 8 }}>
          {BOARD_TYPES.map(bt => (
            <button
              key={bt.id}
              onClick={() => setBoardType(bt.id)}
              style={{
                flex: 1, padding: '8px 4px', borderRadius: 6, cursor: 'pointer',
                background: boardType === bt.id ? '#3b82f6' : '#1e293b',
                border: `2px solid ${boardType === bt.id ? '#3b82f6' : '#334155'}`,
                color: boardType === bt.id ? '#fff' : '#94a3b8',
                fontSize: 11, fontWeight: 700,
              }}
            >
              <div style={{ width: 20, height: 12, background: bt.bg, border: '1px solid #475569', borderRadius: 2, margin: '0 auto 4px' }} />
              {bt.label}
            </button>
          ))}
        </div>
      </Field>

      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <button onClick={closeProjectSettings} style={styles.btnSec}>Cancel</button>
        <button onClick={save} style={styles.btnPri}>Save Changes</button>
      </div>
    </Overlay>
  );
}

// ─── Scene Settings ───────────────────────────────────────────────────────────
export function SceneSettingsModal() {
  const getSelectedScene = useStore(s => s.getSelectedScene);
  const updateSceneSettings = useStore(s => s.updateSceneSettings);
  const closeSceneSettings = useStore(s => s.closeSceneSettings);

  const scene = getSelectedScene();
  const [name, setName] = useState(scene?.name ?? '');

  const save = () => {
    updateSceneSettings(scene.id, { name: name.trim() || scene.name });
    closeSceneSettings();
  };

  return (
    <Overlay onClose={closeSceneSettings}>
      <h2 style={styles.title}>🎬 Scene Settings</h2>

      <Field label="Scene Name">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && save()}
          style={styles.input}
          autoFocus
        />
      </Field>

      <p style={{ fontSize: 12, color: '#64748b', marginBottom: 20 }}>
        {scene?.graphics.length ?? 0} item(s) in this scene
      </p>

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={closeSceneSettings} style={styles.btnSec}>Cancel</button>
        <button onClick={save} style={styles.btnPri}>Save</button>
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

const styles = {
  title: { fontFamily: 'Georgia, serif', fontSize: 20, color: '#f1f5f9', marginTop: 0, marginBottom: 20 },
  input: {
    width: '100%', background: '#1e293b', border: '1px solid #334155',
    borderRadius: 6, padding: '8px 10px', color: '#f1f5f9',
    fontSize: 14, outline: 'none', boxSizing: 'border-box',
  },
  btnPri: {
    flex: 2, padding: '9px 0', background: '#3b82f6', border: 'none',
    borderRadius: 8, color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 14,
  },
  btnSec: {
    flex: 1, padding: '9px 0', background: '#1e293b', border: '1px solid #334155',
    borderRadius: 8, color: '#94a3b8', cursor: 'pointer', fontWeight: 700, fontSize: 14,
  },
};
