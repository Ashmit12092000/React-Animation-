import { useState, useRef } from 'react';
import SvgRenderer from '../shared/SvgRenderer';
import { useStore } from '../../store';
import { SAMPLE_GRAPHICS, ARROW_GRAPHICS } from '../../assets';

// ── NEW: Raw SVG Content for person-who-gargles.svg ──────────────────────────
const PERSON_WHO_GARGLES_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800">
  <path fill="#FFF" d="M0 0h800v800H0z"/>
  <path fill="#85B2D2" d="M451.7 508.8H356v153.3h95.7z"/>
  <path fill="#DDD" d="M366.1 332.2c1.7-10.7 7.2-22.3 22-26 15-3.8 28.5 2.8 38 10 7.8 5.8 11 15 15.6 23.3 2.5 4.6 6.5 9 12.3 9 7.4 0 11-8 15.3-13.4 12.8-16 33.6-25.2 54.4-19 28.3 8.3 39.5 39 41.5 66.8 3.5 48.6-3 103-27.2 145.4-4 7-9 14.5-17.2 16.4-7 .1-12.7-4.4-16.7-9.8-8-10.8-12-24.3-16-37.4l-7.4-23.7c-6.8-21.7-15-46.7-36.4-58-16.5-8.8-37.4-4.8-54 4l-44.4 23.6c-17 9-30 24.3-39.7 41.3-17.7 31-25 67.2-26 102.7-.4 14.5-3.4 30-14.7 39.4-6.4 5.3-15 6.4-22.8 4-13-4-21-16.7-25-29.6-13-41-13-87.3-3.6-129.7 9-40 28.8-79.6 63.8-103.5 21.6-14.7 49-21.2 73.2-11.8z"/>
  <path fill="#FFF" d="M362 266c0 14 3.7 27.4 10 39.2 15.2 28.5 45.4 48 80.4 48s65.2-19.5 80.4-48c6.3-11.8 10-25.2 10-39.2 0-51-41.4-92.4-92.4-92.4S362 215 362 266z"/>
  <path fill="#706865" d="M495.2 188c-1.3-4.5-3.3-8.8-6-12.7-7-10.5-18.7-18-31.5-20.3-4.6-.8-9.4-1-14.2-.6-3.8.3-7.5 1-11.2 2-2.5.7-5 1.7-7.4 3-1.4.6-2.7 1.4-4 2.2a46 46 0 0 0-14.4-5.2c-5.7-.8-11.4-.7-17 .3a45.6 45.6 0 0 0-29.7 17c-6.8 8.6-10.6 19.5-11 30.5a75 75 0 0 0-.2 12c.5 10 3 20 7 29.3 1.2 2.6 2.5 5 4 7.4-2.8-5-5-10.3-6.6-15.8-2.6-9-3.2-18.7-2-28 1.4-11 6.3-21.6 14.3-29.3a43.1 43.1 0 0 1 29-12.5c6-.2 12 .7 17.5 2.7 5.2 2 10 5 14 9l4 4.4c1.2-1.8 2.6-3.4 4-5a43.5 43.5 0 0 1 28-14c4.8-.4 9.6-.2 14.3.5 11.6 1.7 22.2 8.2 28.7 17.7 3.3 4.8 5.6 10.2 6.7 15.8a65 65 0 0 1 1 25.8c-1.4 10.4-5.4 20.3-11.4 28.8-1 1.4-2 2.7-3.2 4 4.7-6 8.3-12.8 10.5-20 3-10 3.7-20.7 2-31.1z"/>
  <path fill="none" stroke="#231815" strokeLinecap="round" strokeLinejoin="round" strokeWidth="8" d="M460.6 508.8H356v153.3h95.7v-153.3m-95.7 18.2c-15.5 1-27 10-27 24.3s10.3 22 25 24M441 216c5.5 0 10 4.5 10 10s-4.5 10-10 10-10-4.5-10-10 4.5-10 10-10m103.5 10c5.5 0 10 4.5 10 10s-4.5 10-10 10-10-4.5-10-10 4.5-10 10-10M480 322c3.5-5.7 12-14 26-6m-155.6 16.4c-2-8.5-8.5-15.6-17.2-17.3-11.3-2.3-22.3 4.3-26.4 15a49.7 49.7 0 0 0-2 29.3c3.4 19.3 15 36.3 32 46 8 4.7 17.2 7 26.3 6.3m138.8-59c5.2-1.3 10.3.3 14.4 4 10.7 10 10.2 28.7-1 38.6-8.7 7.7-21.2 8-31 1.2-6-4.2-10-10.7-11.8-18m2.5-115.3c-2.3-15-11-28.4-23.7-36.4-16.7-10.6-38.3-12.2-56.3-4.2-15 6.7-27.2 19-33.5 34.3-8 19.2-8.3 41-.8 60.3 5.4 14 15.2 26 27.7 33.6m108.5-1.2c7-6.5 12.3-15 15.3-24.2 4.7-14.8 4-31-2-45.3-7.5-17.7-22.6-31-40.8-36.4-14-4.2-29.2-2.7-42 4m41 192.6V762M253.2 599c-3 15-17 48-17 48s52 14 62-22m195.4-87.3c9.7 4.5 15.6 14.5 15.2 25.2-.5 13-10.3 24.3-23.3 25.6m144.3 12c4 26 5.3 56.4 5.3 90.5m-303.7-133c-36.6 24-58 64.6-58.4 110.3M586.6 601.5a11 11 0 0 1 5.7 3c3 3 5 7.4 6 11.8M575.6 397a48 48 0 0 1 19 19m-11 12a32 32 0 0 1 12 12m-242 163.6c-5-2-10-1-14 3-5 5-7 12.4-5.3 19 2 7.7 8.3 13.7 16 15 4.5.7 9-.7 12.3-3.7 5.2-4.7 7-12 5-18.4-1.6-5.5-6.6-10.7-12-12c-1-.2-1.3-.3-2.2-.2"/>
</svg>`;

export default function GraphicsTab() {
  const [search, setSearch] = useState('');
  const addDrawingGraphic = useStore(s => s.addDrawingGraphic);
  const fileRef = useRef(null);

  const [category, setCategory] = useState('all');

  // ── NEW: Injected local asset directly into the data pool ──────────────────
  const allGraphics = [
    {
      id: 'person-who-gargles',
      name: 'Person Who Gargles',
      svg: PERSON_WHO_GARGLES_SVG,
      category: 'figures',
    },
    ...SAMPLE_GRAPHICS.map(g => ({ ...g, category: 'figures' })),
    ...ARROW_GRAPHICS.map(g => ({ ...g, category: 'arrows' })),
  ];

  const filtered = allGraphics
    .filter(g => category === 'all' || g.category === category)
    .filter(g => !search || g.name.toLowerCase().includes(search.toLowerCase()));

  const handleImport = async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      const text = await file.text();
      addDrawingGraphic({ svg: text, name: file.name.replace('.svg', '') });
    }
    e.target.value = '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      {/* Search bar */}
      <div style={{ padding: '10px 12px', display: 'flex', gap: 6, flexShrink: 0 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <svg style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }}
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search graphics…"
            style={{
              width: '100%', paddingLeft: 28, paddingRight: 8, paddingTop: 6, paddingBottom: 6,
              background: '#1e293b', border: '1px solid #334155', borderRadius: 6,
              color: '#e2e8f0', fontSize: 12, outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          title="Import SVG"
          style={{
            padding: '6px 10px', background: '#1e293b',
            border: '1px solid #334155', borderRadius: 6,
            color: '#94a3b8', cursor: 'pointer', fontSize: 14,
          }}
        >
          ↑
        </button>
        <input ref={fileRef} type="file" accept=".svg" multiple style={{ display: 'none' }} onChange={handleImport} />
      </div>

      {/* Category pills */}
      <div style={{ padding: '0 12px 10px', display: 'flex', gap: 4, flexShrink: 0 }}>
        {[['all','All'],['figures','Figures'],['arrows','Arrows']].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setCategory(id)}
            style={{
              padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
              cursor: 'pointer', border: 'none',
              background: category === id ? '#3b82f6' : '#1e293b',
              color: category === id ? '#fff' : '#94a3b8',
              transition: 'all 0.15s',
            }}
          >{label}</button>
        ))}
      </div>

      {/* Grid */}
      <div style={{
        flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 8px 80px',
        display: 'flex', flexWrap: 'wrap', gap: 8, alignContent: 'flex-start',
      }}>
        {filtered.length === 0 && (
          <p style={{ color: '#4b5563', fontSize: 13, textAlign: 'center', width: '100%', marginTop: 20 }}>
            No graphics found
          </p>
        )}
        {filtered.map(item => (
          <AssetCard key={item.id} item={item} onAdd={() => addDrawingGraphic(item)} />
        ))}
      </div>
    </div>
  );
}

function AssetCard({ item, onAdd }) {
  return (
    <div style={{
      width: 106, background: '#1e293b', borderRadius: 8, padding: 8,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      border: '1px solid #334155', transition: 'border-color 0.15s, transform 0.1s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.transform = 'none'; }}
    >
      <SvgRenderer svg={item.svg} style={{ width: 80, height: 80 }} />
      <span style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center', lineHeight: 1.3 }}>
        {item.name}
      </span>
      <button
        onClick={onAdd}
        style={{
          width: '100%', padding: '4px 0',
          background: '#3b82f6', border: 'none', borderRadius: 4,
          color: '#fff', fontSize: 11, cursor: 'pointer', fontWeight: 600,
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#2563eb'}
        onMouseLeave={e => e.currentTarget.style.background = '#3b82f6'}
      >
        Add
      </button>
    </div>
  );
}