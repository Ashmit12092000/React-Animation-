import { useStore } from '../../store';

const COLORS = {
  success: { bg: '#10b981', shadow: 'rgba(16,185,129,0.4)' },
  error: { bg: '#ef4444', shadow: 'rgba(239,68,68,0.4)' },
  info: { bg: '#3b82f6', shadow: 'rgba(59,130,246,0.4)' },
};

export default function Toast() {
  const toast = useStore(s => s.toast);
  if (!toast) return null;

  const { bg, shadow } = COLORS[toast.type] ?? COLORS.success;

  return (
    <div style={{
      position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
      background: bg, color: '#fff', padding: '10px 28px',
      borderRadius: 10, fontWeight: 700, fontSize: 14, zIndex: 9999,
      boxShadow: `0 4px 24px ${shadow}`,
      animation: 'toastIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
      whiteSpace: 'nowrap',
    }}>
      {toast.message}
    </div>
  );
}
