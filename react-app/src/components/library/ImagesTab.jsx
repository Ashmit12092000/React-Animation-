import { useRef, useState } from 'react';
import { useStore } from '../../store';

const REVEAL_EFFECTS = [
  { value: 'wipe-right', label: '→ Wipe Right' },
  { value: 'wipe-down',  label: '↓ Wipe Down'  },
  { value: 'fade',       label: '✦ Fade In'     },
  { value: 'zoom',       label: '⊕ Zoom In'     },
];

export default function ImagesTab() {
  const fileRef         = useRef(null);
  const addImageGraphic = useStore(s => s.addImageGraphic);

  const [pending, setPending]   = useState([]); // [{ id, name, src, w, h }]
  const [effect,  setEffect]    = useState('wipe-right');
  const [loading, setLoading]   = useState(false);

  const handleFiles = async (files) => {
    setLoading(true);
    const results = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      const src = await readAsDataURL(file);
      const { w, h } = await getImageDimensions(src);
      results.push({
        id: crypto.randomUUID(),
        name: file.name.replace(/\.[^.]+$/, ''),
        src, w, h,
      });
    }
    setPending(prev => [...prev, ...results]);
    setLoading(false);
  };

  const handleFileInput = (e) => {
    handleFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(Array.from(e.dataTransfer.files));
  };

  const addToCanvas = (item) => {
    // Keep aspect ratio, cap at 280px wide
    const maxW = 280;
    const aspect = item.h / item.w;
    const w = Math.min(item.w, maxW);
    const h = Math.round(w * aspect);
    addImageGraphic({ src: item.src, name: item.name, width: w, height: h, revealEffect: effect });
  };

  const removeFromPending = (id) => {
    setPending(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>

      {/* Reveal Effect selector */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid #1e293b', flexShrink: 0 }}>
        <label style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, display: 'block', marginBottom: 6 }}>
          Reveal Effect
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {REVEAL_EFFECTS.map(e => (
            <button
              key={e.value}
              onClick={() => setEffect(e.value)}
              style={{
                flex: '1 1 auto',
                padding: '5px 6px',
                fontSize: 10, fontWeight: 600,
                background: effect === e.value ? '#3b82f620' : '#1e293b',
                border: `1px solid ${effect === e.value ? '#3b82f6' : '#334155'}`,
                borderRadius: 5,
                color: effect === e.value ? '#3b82f6' : '#94a3b8',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {e.label}
            </button>
          ))}
        </div>
      </div>

      {/* Drop zone */}
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        style={{
          margin: '10px 12px 0',
          border: '2px dashed #334155',
          borderRadius: 8,
          padding: '18px 12px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'border-color 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f6'}
        onMouseLeave={e => e.currentTarget.style.borderColor = '#334155'}
      >
        <div style={{ fontSize: 24 }}>🖼️</div>
        <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', margin: 0 }}>
          {loading ? 'Loading…' : 'Click or drag images here'}
        </p>
        <p style={{ fontSize: 10, color: '#4b5563', margin: 0 }}>
          PNG, JPG, GIF, WebP, SVG
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileInput}
        />
      </div>

      {/* Uploaded image list */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '8px 10px 80px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {pending.length === 0 && (
          <p style={{ color: '#374151', fontSize: 12, textAlign: 'center', marginTop: 20 }}>
            No images uploaded yet
          </p>
        )}
        {pending.map(item => (
          <ImageCard
            key={item.id}
            item={item}
            onAdd={() => addToCanvas(item)}
            onRemove={() => removeFromPending(item.id)}
          />
        ))}
      </div>
    </div>
  );
}

function ImageCard({ item, onAdd, onRemove }) {
  return (
    <div style={{
      background: '#1e293b',
      border: '1px solid #334155',
      borderRadius: 8,
      padding: 8,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      transition: 'border-color 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#475569'}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#334155'}
    >
      {/* Thumbnail */}
      <div style={{
        width: 44, height: 44, flexShrink: 0,
        background: '#0f172a', borderRadius: 5,
        overflow: 'hidden', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <img
          src={item.src}
          alt={item.name}
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
        />
      </div>

      {/* Name + dimensions */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{
          fontSize: 11, color: '#e2e8f0', fontWeight: 600,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {item.name}
        </div>
        <div style={{ fontSize: 10, color: '#64748b' }}>
          {item.w} × {item.h}
        </div>
      </div>

      {/* Add */}
      <button
        onClick={onAdd}
        title="Add to canvas"
        style={{
          padding: '5px 8px', fontSize: 11, fontWeight: 700,
          background: '#3b82f620', border: '1px solid #3b82f650',
          borderRadius: 5, color: '#3b82f6', cursor: 'pointer',
          flexShrink: 0,
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#3b82f640'}
        onMouseLeave={e => e.currentTarget.style.background = '#3b82f620'}
      >
        + Add
      </button>

      {/* Remove */}
      <button
        onClick={onRemove}
        title="Remove"
        style={{
          padding: '5px 7px', fontSize: 11,
          background: '#ef444420', border: '1px solid #ef444440',
          borderRadius: 5, color: '#ef4444', cursor: 'pointer',
          flexShrink: 0,
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#ef444440'}
        onMouseLeave={e => e.currentTarget.style.background = '#ef444420'}
      >
        ✕
      </button>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function getImageDimensions(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload  = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve({ w: 200, h: 150 });
    img.src = src;
  });
}