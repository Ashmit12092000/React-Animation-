import { create } from 'zustand';
import { produce } from 'immer';
import { createProject, createScene, createDrawingModel, createTextModel, createImageModel, cloneScene } from '../models';

// ─── Undo/Redo history helpers ────────────────────────────────────────────────
const MAX_HISTORY = 50;

function pushHistory(state) {
  const snapshot = JSON.stringify(state.project);
  const newUndo = [...state.undoStack, snapshot].slice(-MAX_HISTORY);
  return { undoStack: newUndo, redoStack: [] };
}

// ─── Persistence helpers ──────────────────────────────────────────────────────
const STORAGE_KEY = 'opendoodler_projects';

function loadPersistedProjects() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistProjects(projects) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch { /* quota exceeded, ignore */ }
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useStore = create((set, get) => ({
  // ── Navigation ──────────────────────────────────────────────────────────────
  view: 'launch', // 'launch' | 'editor'

  // ── Projects list (launch screen) ───────────────────────────────────────────
  recentProjects: loadPersistedProjects(),

  // ── Active editor state ──────────────────────────────────────────────────────
  project: null,
  selectedSceneId: null,
  selectedGraphicId: null,
  undoStack: [],
  redoStack: [],

  // ── UI state ─────────────────────────────────────────────────────────────────
  showPreviewModal: false,
  showNewProjectModal: false,
  showSceneSettingsModal: false,
  showProjectSettingsModal: false,
  toast: null, // { message, type }

  // ── Derived helpers ──────────────────────────────────────────────────────────
  getSelectedScene() {
    const { project, selectedSceneId } = get();
    if (!project) return null;
    return project.scenes.find(s => s.id === selectedSceneId) ?? project.scenes[0] ?? null;
  },

  getSelectedGraphic() {
    const scene = get().getSelectedScene();
    if (!scene) return null;
    return scene.graphics.find(g => g.id === get().selectedGraphicId) ?? null;
  },

  // ── Navigation ───────────────────────────────────────────────────────────────
  navigateTo(view) {
    set({ view });
  },

  // ── Toast ────────────────────────────────────────────────────────────────────
  showToast(message, type = 'success') {
    set({ toast: { message, type } });
    setTimeout(() => set({ toast: null }), 2500);
  },

  // ── Project CRUD ─────────────────────────────────────────────────────────────
  createNewProject(title, boardType) {
    const p = createProject(title, boardType);
    const updated = [p, ...get().recentProjects];
    persistProjects(updated);
    set({
      recentProjects: updated,
      project: JSON.parse(JSON.stringify(p)),
      selectedSceneId: p.scenes[0].id,
      selectedGraphicId: null,
      undoStack: [],
      redoStack: [],
      view: 'editor',
      showNewProjectModal: false,
    });
  },

  openProject(projectId) {
    const p = get().recentProjects.find(r => r.id === projectId);
    if (!p) return;
    set({
      project: JSON.parse(JSON.stringify(p)),
      selectedSceneId: p.scenes[0]?.id ?? null,
      selectedGraphicId: null,
      undoStack: [],
      redoStack: [],
      view: 'editor',
    });
  },

  deleteRecentProject(projectId) {
    const updated = get().recentProjects.filter(p => p.id !== projectId);
    persistProjects(updated);
    set({ recentProjects: updated });
  },

  saveProject() {
    const { project, recentProjects } = get();
    if (!project) return;
    const saved = { ...project, modifiedOn: new Date().toISOString() };
    const idx = recentProjects.findIndex(p => p.id === saved.id);
    let updated;
    if (idx >= 0) {
      updated = [...recentProjects];
      updated[idx] = saved;
    } else {
      updated = [saved, ...recentProjects];
    }
    persistProjects(updated);
    set({ recentProjects: updated, project: saved });
    get().showToast('Project saved ✓');
  },

  closeProject() {
    set({ view: 'launch', project: null, selectedSceneId: null, selectedGraphicId: null });
  },

  updateProjectSettings(changes) {
    set(state => produce(state, draft => {
      Object.assign(draft.project, changes);
    }));
  },

  // ── Undo / Redo ──────────────────────────────────────────────────────────────
  _snapshot() {
    const state = get();
    return produce(state, draft => {
      const hist = pushHistory(state);
      draft.undoStack = hist.undoStack;
      draft.redoStack = hist.redoStack;
    });
  },

  undo() {
    const { undoStack, redoStack, project } = get();
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    set({
      project: JSON.parse(prev),
      undoStack: undoStack.slice(0, -1),
      redoStack: [...redoStack, JSON.stringify(project)],
      selectedGraphicId: null,
    });
  },

  redo() {
    const { undoStack, redoStack, project } = get();
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    set({
      project: JSON.parse(next),
      redoStack: redoStack.slice(0, -1),
      undoStack: [...undoStack, JSON.stringify(project)],
      selectedGraphicId: null,
    });
  },

  // ── Scene actions ─────────────────────────────────────────────────────────────
  selectScene(sceneId) {
    set({ selectedSceneId: sceneId, selectedGraphicId: null });
  },

  addScene() {
    set(state => {
      const hist = pushHistory(state);
      return produce({ ...state, ...hist }, draft => {
        const name = String(draft.project.scenes.length + 1);
        const s = createScene(name);
        draft.project.scenes.push(s);
        draft.selectedSceneId = s.id;
        draft.selectedGraphicId = null;
      });
    });
  },

  deleteScene(sceneId) {
    set(state => {
      if (state.project.scenes.length <= 1) return state;
      const hist = pushHistory(state);
      return produce({ ...state, ...hist }, draft => {
        const idx = draft.project.scenes.findIndex(s => s.id === sceneId);
        draft.project.scenes.splice(idx, 1);
        // Renumber
        draft.project.scenes.forEach((s, i) => { s.name = String(i + 1); });
        draft.selectedSceneId = draft.project.scenes[Math.max(0, idx - 1)]?.id ?? draft.project.scenes[0]?.id;
        draft.selectedGraphicId = null;
      });
    });
  },

  duplicateScene(sceneId) {
    set(state => {
      const hist = pushHistory(state);
      return produce({ ...state, ...hist }, draft => {
        const idx = draft.project.scenes.findIndex(s => s.id === sceneId);
        const clone = cloneScene(draft.project.scenes[idx]);
        draft.project.scenes.splice(idx + 1, 0, clone);
        draft.project.scenes.forEach((s, i) => { s.name = String(i + 1); });
        draft.selectedSceneId = clone.id;
      });
    });
  },

  moveScene(fromIdx, toIdx) {
    if (fromIdx === toIdx) return;
    
    set(state => {
      const hist = pushHistory(state);
      const result = produce({ ...state, ...hist }, draft => {
        const removed = draft.project.scenes.splice(fromIdx, 1);
        draft.project.scenes.splice(toIdx, 0, removed[0]);
      });
      
      return result;
    });
  },

  updateSceneSettings(sceneId, changes) {
    set(state => {
      const hist = pushHistory(state);
      return produce({ ...state, ...hist }, draft => {
        const scene = draft.project.scenes.find(s => s.id === sceneId);
        if (scene) Object.assign(scene, changes);
      });
    });
  },

  // ── Graphic actions ────────────────────────────────────────────────────────
  selectGraphic(graphicId) {
    set({ selectedGraphicId: graphicId });
  },

  addDrawingGraphic(svgAsset) {
    set(state => {
      const hist = pushHistory(state);
      return produce({ ...state, ...hist }, draft => {
        const scene = draft.project.scenes.find(s => s.id === draft.selectedSceneId)
          ?? draft.project.scenes[0];
        if (!scene) return;
        const g = createDrawingModel(svgAsset.svg, svgAsset.name, {
          x: 60 + Math.random() * 200,
          y: 60 + Math.random() * 100,
          width: 120, height: 120,
        }, svgAsset.paintFill ?? false);
        scene.graphics.push(g);
        draft.selectedGraphicId = g.id;
      });
    });
  },

  addTextGraphic({ rawText, fontFamily, fontStyle, fontWeight, fontSize, color }) {
    set(state => {
      const hist = pushHistory(state);
      return produce({ ...state, ...hist }, draft => {
        const scene = draft.project.scenes.find(s => s.id === draft.selectedSceneId)
          ?? draft.project.scenes[0];
        if (!scene) return;
        const g = createTextModel({ rawText, fontFamily, fontStyle, fontWeight, fontSize, color }, {
          x: 80 + Math.random() * 200,
          y: 100 + Math.random() * 80,
        });
        scene.graphics.push(g);
        draft.selectedGraphicId = g.id;
      });
    });
  },

  addImageGraphic({ src, name, width, height }) {
    set(state => {
      const hist = pushHistory(state);
      return produce({ ...state, ...hist }, draft => {
        const scene = draft.project.scenes.find(s => s.id === draft.selectedSceneId)
          ?? draft.project.scenes[0];
        if (!scene) return;
        const g = createImageModel({ src, name }, {
          x: 60 + Math.random() * 160,
          y: 60 + Math.random() * 80,
          width:  width  ?? 200,
          height: height ?? 150,
        });
        scene.graphics.push(g);
        draft.selectedGraphicId = g.id;
      });
    });
  },

  moveGraphic(graphicId, x, y) {
    set(state => produce(state, draft => {
      for (const scene of draft.project.scenes) {
        const g = scene.graphics.find(g => g.id === graphicId);
        if (g) { g.x = Math.max(0, x); g.y = Math.max(0, y); return; }
      }
    }));
  },

  resizeGraphic(graphicId, width, height, x, y) {
    set(state => produce(state, draft => {
      for (const scene of draft.project.scenes) {
        const g = scene.graphics.find(g => g.id === graphicId);
        if (g) {
          g.width  = Math.max(20, width);
          g.height = Math.max(20, height);
          if (x !== undefined) g.x = Math.max(0, x);
          if (y !== undefined) g.y = Math.max(0, y);
          return;
        }
      }
    }));
  },

  rotateGraphic(graphicId, rotation) {
    set(state => produce(state, draft => {
      for (const scene of draft.project.scenes) {
        const g = scene.graphics.find(g => g.id === graphicId);
        if (g) { g.rotation = rotation; return; }
      }
    }));
  },

  updateGraphicProps(graphicId, changes) {
    set(state => {
      const hist = pushHistory(state);
      return produce({ ...state, ...hist }, draft => {
        for (const scene of draft.project.scenes) {
          const g = scene.graphics.find(g => g.id === graphicId);
          if (g) { Object.assign(g, changes); return; }
        }
      });
    });
  },

  deleteGraphic(graphicId) {
    set(state => {
      const hist = pushHistory(state);
      return produce({ ...state, ...hist }, draft => {
        const scene = draft.project.scenes.find(s => s.id === draft.selectedSceneId);
        if (!scene) return;
        const idx = scene.graphics.findIndex(g => g.id === graphicId);
        if (idx >= 0) scene.graphics.splice(idx, 1);
        draft.selectedGraphicId = null;
      });
    });
  },

  moveGraphicInList(graphicId, direction) {
    set(state => {
      const hist = pushHistory(state);
      return produce({ ...state, ...hist }, draft => {
        const scene = draft.project.scenes.find(s => s.id === draft.selectedSceneId);
        if (!scene) return;
        const idx = scene.graphics.findIndex(g => g.id === graphicId);
        const to = idx + direction;
        if (to < 0 || to >= scene.graphics.length) return;
        const [g] = scene.graphics.splice(idx, 1);
        scene.graphics.splice(to, 0, g);
      });
    });
  },

  reorderGraphic(fromIdx, toIdx) {
    set(state => {
      const hist = pushHistory(state);
      return produce({ ...state, ...hist }, draft => {
        const scene = draft.project.scenes.find(s => s.id === draft.selectedSceneId);
        if (!scene) return;
        if (fromIdx === toIdx) return;
        if (fromIdx < 0 || fromIdx >= scene.graphics.length) return;
        if (toIdx   < 0 || toIdx   >= scene.graphics.length) return;
        const [g] = scene.graphics.splice(fromIdx, 1);
        scene.graphics.splice(toIdx, 0, g);
      });
    });
  },

  duplicateGraphic(graphicId) {
    set(state => {
      const hist = pushHistory(state);
      return produce({ ...state, ...hist }, draft => {
        const scene = draft.project.scenes.find(s => s.id === draft.selectedSceneId);
        if (!scene) return;
        const idx = scene.graphics.findIndex(g => g.id === graphicId);
        if (idx < 0) return;
        const clone = { ...scene.graphics[idx], id: crypto.randomUUID(), x: scene.graphics[idx].x + 20, y: scene.graphics[idx].y + 20 };
        scene.graphics.splice(idx + 1, 0, clone);
        draft.selectedGraphicId = clone.id;
      });
    });
  },

  // ── Audio track actions ───────────────────────────────────────────────────────
  addAudioTrack(track) {
    set(state => produce(state, draft => {
      if (!draft.project.audioTracks) draft.project.audioTracks = [];
      // Strip non-serialisable audioBuffer before saving (keep for session use only)
      const { audioBuffer, ...serialisable } = track;
      draft.project.audioTracks.push(serialisable);
      // Re-attach transient buffer so the current session can use it
      draft.project.audioTracks[draft.project.audioTracks.length - 1]._audioBuffer = audioBuffer;
    }));
  },

  removeAudioTrack(trackId) {
    set(state => produce(state, draft => {
      if (!draft.project.audioTracks) return;
      draft.project.audioTracks = draft.project.audioTracks.filter(t => t.id !== trackId);
    }));
  },

  updateAudioTrack(trackId, changes) {
    set(state => produce(state, draft => {
      if (!draft.project.audioTracks) return;
      const track = draft.project.audioTracks.find(t => t.id === trackId);
      if (track) {
        // Keep transient audioBuffer if caller is not trying to update it
        const { audioBuffer, ...safeChanges } = changes;
        Object.assign(track, safeChanges);
        if (audioBuffer !== undefined) track._audioBuffer = audioBuffer;
      }
    }));
  },

  // ── Modal toggles ─────────────────────────────────────────────────────────────
  openPreviewModal() { set({ showPreviewModal: true }); },
  closePreviewModal() { set({ showPreviewModal: false }); },
  openNewProjectModal() { set({ showNewProjectModal: true }); },
  closeNewProjectModal() { set({ showNewProjectModal: false }); },
  openSceneSettings() { set({ showSceneSettingsModal: true }); },
  closeSceneSettings() { set({ showSceneSettingsModal: false }); },
  openProjectSettings() { set({ showProjectSettingsModal: true }); },
  closeProjectSettings() { set({ showProjectSettingsModal: false }); },
}));