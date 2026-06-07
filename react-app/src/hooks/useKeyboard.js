import { useEffect } from 'react';
import { useStore } from '../store';

export function useKeyboard() {
  const undo = useStore(s => s.undo);
  const redo = useStore(s => s.redo);
  const selectedGraphicId = useStore(s => s.selectedGraphicId);
  const deleteGraphic = useStore(s => s.deleteGraphic);
  const selectGraphic = useStore(s => s.selectGraphic);
  const view = useStore(s => s.view);

  useEffect(() => {
    if (view !== 'editor') return;

    const handler = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedGraphicId) {
          e.preventDefault();
          deleteGraphic(selectedGraphicId);
        }
      }
      if (e.key === 'Escape') {
        selectGraphic(null);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [view, selectedGraphicId, undo, redo, deleteGraphic, selectGraphic]);
}
