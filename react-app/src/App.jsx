import { useStore } from './store';
import TopBar from './components/topbar/TopBar';
import LaunchView from './LaunchView';
import EditorView from './EditorView';
import Toast from './components/shared/Toast';
import NewProjectModal from './components/dialogs/NewProjectModal';
import PreviewModal from './components/dialogs/PreviewModal';
import { ProjectSettingsModal, SceneSettingsModal } from './components/dialogs/SettingsModals';
import { useKeyboard } from './hooks/useKeyboard';

export default function App() {
  const view = useStore(s => s.view);
  const showNewProjectModal = useStore(s => s.showNewProjectModal);
  const showPreviewModal = useStore(s => s.showPreviewModal);
  const showSceneSettingsModal = useStore(s => s.showSceneSettingsModal);
  const showProjectSettingsModal = useStore(s => s.showProjectSettingsModal);

  useKeyboard();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <TopBar />

      {view === 'launch' && <LaunchView />}
      {view === 'editor' && <EditorView />}

      {/* Modals */}
      {showNewProjectModal && <NewProjectModal />}
      {showPreviewModal && <PreviewModal />}
      {showSceneSettingsModal && <SceneSettingsModal />}
      {showProjectSettingsModal && <ProjectSettingsModal />}

      {/* Toast notifications */}
      <Toast />
    </div>
  );
}
