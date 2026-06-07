import { useState } from 'react';
import GraphicsTab from './GraphicsTab';
import ShapesTab from './ShapesTab';
import TextTab from './TextTab';
import ImagesTab from './ImagesTab';
import AIImageTab from './AIImageTab';
import AudioTab from './AudioTab';
import PaintTab from './PaintTab';
import { useMobile } from '../../hooks/useMobile';

const TABS = [
  { id: 'graphics', label: 'Graphics', icon: '👤' },
  { id: 'shapes',   label: 'Shapes',   icon: '⬟' },
  { id: 'paint',    label: 'Paint',    icon: '🎨' },
  { id: 'text',     label: 'Text',     icon: 'T' },
  { id: 'images',   label: 'Images',   icon: '🖼' },
  { id: 'ai',       label: 'AI Image', icon: '✨' },
  { id: 'audio',    label: 'Audio',    icon: '♪' },
];

export default function EditorLibrary() {
  const isMobile = useMobile();
  const [activeTab, setActiveTab] = useState('graphics');

  return (
    <div style={{
      width: isMobile ? '100%' : 256,
      height: isMobile ? '100%' : undefined,
      background: '#111827',
      borderRight: isMobile ? 'none' : '1px solid #1e293b',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      {/* Panel header */}
      <div style={{
        padding: '12px 14px 0',
        borderBottom: '1px solid #1e293b',
      }}>
        <p style={{
          fontSize: 10, fontWeight: 700, color: '#64748b',
          letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10,
        }}>
          Library
        </p>
        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              title={tab.label}
              style={{
                flex: 1, padding: '8px 0',
                background: 'none', border: 'none',
                color: activeTab === tab.id ? '#f59e0b' : '#6b7280',
                fontSize: tab.id === 'text' ? 13 : 17,
                fontWeight: 700,
                cursor: 'pointer',
                borderBottom: activeTab === tab.id ? '2px solid #f59e0b' : '2px solid transparent',
                transition: 'color 0.15s, border-color 0.15s',
              }}
              onMouseEnter={e => { if (activeTab !== tab.id) e.currentTarget.style.color = '#e2e8f0'; }}
              onMouseLeave={e => { if (activeTab !== tab.id) e.currentTarget.style.color = '#6b7280'; }}
            >
              {tab.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content — flex:1 + minHeight:0 lets the child control its own scroll */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {activeTab === 'graphics' && <GraphicsTab />}
        {activeTab === 'shapes' && <ShapesTab />}
        {activeTab === 'paint' && <PaintTab />}
        {activeTab === 'text' && <TextTab />}
        {activeTab === 'images' && <ImagesTab />}
        {activeTab === 'ai' && <AIImageTab />}
        {activeTab === 'audio' && <AudioTab />}
      </div>
    </div>
  );
}