import { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '../../store';

// ─── Colour palette (matches app dark theme) ──────────────────────────────────
const C = {
  bg:         '#111827',
  surface:    '#1e293b',
  surface2:   '#0f172a',
  border:     '#334155',
  accent:     '#f59e0b',
  accentDim:  'rgba(245,158,11,0.15)',
  accentGlow: 'rgba(245,158,11,0.35)',
  green:      '#10b981',
  red:        '#ef4444',
  blue:       '#3b82f6',
  purple:     '#8b5cf6',
  muted:      '#64748b',
  text:       '#e2e8f0',
  textDim:    '#94a3b8',
};

// ─── Audio filters catalogue ───────────────────────────────────────────────────
const AUDIO_FILTERS = [
  { id: 'none',       label: 'Original',   icon: '◎', color: C.muted,   desc: 'No processing' },
  { id: 'warm',       label: 'Warm',       icon: '☀', color: '#fb923c', desc: 'Bass boost, smooth highs' },
  { id: 'bright',     label: 'Bright',     icon: '✦', color: '#fbbf24', desc: 'High-shelf boost' },
  { id: 'telephone',  label: 'Telephone',  icon: '📞', color: '#60a5fa', desc: 'Band-pass 300–3k Hz' },
  { id: 'deep',       label: 'Deep Bass',  icon: '◉', color: '#818cf8', desc: 'Sub-bass emphasis' },
  { id: 'reverb',     label: 'Reverb',     icon: '〰', color: '#34d399', desc: 'Convolution room reverb' },
  { id: 'echo',       label: 'Echo',       icon: '∿', color: '#22d3ee', desc: 'Delay 300ms feedback' },
  { id: 'vintage',    label: 'Vintage',    icon: '◈', color: '#d97706', desc: 'Vinyl warmth + noise' },
  { id: 'robot',      label: 'Robot',      icon: '⚙', color: '#94a3b8', desc: 'Ring-modulator 50 Hz' },
  { id: 'whisper',    label: 'Whisper',    icon: '~', color: '#a78bfa', desc: 'Low-pass gentle cut' },
];

// ─── Build Web Audio filter chain ─────────────────────────────────────────────
function buildFilterChain(ctx, filterId) {
  const nodes = [];
  switch (filterId) {
    case 'warm': {
      const lo = ctx.createBiquadFilter();
      lo.type = 'lowshelf'; lo.frequency.value = 200; lo.gain.value = 5;
      const hi = ctx.createBiquadFilter();
      hi.type = 'highshelf'; hi.frequency.value = 6000; hi.gain.value = -4;
      nodes.push(lo, hi);
      break;
    }
    case 'bright': {
      const hi = ctx.createBiquadFilter();
      hi.type = 'highshelf'; hi.frequency.value = 4000; hi.gain.value = 8;
      nodes.push(hi);
      break;
    }
    case 'telephone': {
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass'; hp.frequency.value = 300;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 3000;
      nodes.push(hp, lp);
      break;
    }
    case 'deep': {
      const lo = ctx.createBiquadFilter();
      lo.type = 'lowshelf'; lo.frequency.value = 80; lo.gain.value = 12;
      nodes.push(lo);
      break;
    }
    case 'echo': {
      const delay = ctx.createDelay(1.0);
      delay.delayTime.value = 0.3;
      const feedback = ctx.createGain();
      feedback.gain.value = 0.45;
      delay.connect(feedback);
      feedback.connect(delay);
      nodes.push(delay);
      break;
    }
    case 'whisper': {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 1500; lp.Q.value = 0.5;
      nodes.push(lp);
      break;
    }
    case 'robot': {
      const osc = ctx.createOscillator();
      osc.frequency.value = 50;
      const ring = ctx.createGain();
      osc.connect(ring.gain);
      osc.start();
      nodes.push(ring);
      break;
    }
    case 'vintage': {
      const lo = ctx.createBiquadFilter();
      lo.type = 'lowshelf'; lo.frequency.value = 100; lo.gain.value = 4;
      const mid = ctx.createBiquadFilter();
      mid.type = 'peaking'; mid.frequency.value = 1000; mid.gain.value = -2; mid.Q.value = 0.8;
      const hi = ctx.createBiquadFilter();
      hi.type = 'highshelf'; hi.frequency.value = 8000; hi.gain.value = -6;
      nodes.push(lo, mid, hi);
      break;
    }
    case 'reverb': {
      // Simple reverb via delay network
      const d1 = ctx.createDelay(0.5); d1.delayTime.value = 0.04;
      const d2 = ctx.createDelay(0.5); d2.delayTime.value = 0.07;
      const g1 = ctx.createGain(); g1.gain.value = 0.3;
      const g2 = ctx.createGain(); g2.gain.value = 0.2;
      d1.connect(g1); d2.connect(g2);
      nodes.push(d1, d2, g1, g2);
      break;
    }
    default:
      break;
  }
  return nodes;
}

// ─── Waveform visualiser ───────────────────────────────────────────────────────
function Waveform({ audioBuffer, trimStart, trimEnd, duration, onTrimChange, playing, playhead }) {
  const canvasRef = useRef(null);
  const WIDTH = 224, HEIGHT = 56;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !audioBuffer) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // Background
    ctx.fillStyle = C.surface2;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / WIDTH);
    const amp  = HEIGHT / 2;

    // Waveform bars
    for (let i = 0; i < WIDTH; i++) {
      let min = 1, max = -1;
      for (let j = 0; j < step; j++) {
        const d = data[i * step + j] || 0;
        if (d < min) min = d;
        if (d > max) max = d;
      }
      const xFrac = i / WIDTH;
      const inTrim = xFrac >= trimStart && xFrac <= trimEnd;
      ctx.strokeStyle = inTrim ? C.accent : '#334155';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(i, amp + min * amp * 0.9);
      ctx.lineTo(i, amp + max * amp * 0.9);
      ctx.stroke();
    }

    // Trim overlay – dimmed regions
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, trimStart * WIDTH, HEIGHT);
    ctx.fillRect(trimEnd * WIDTH, 0, WIDTH - trimEnd * WIDTH, HEIGHT);

    // Trim handles
    [[trimStart, C.accent], [trimEnd, C.green]].forEach(([frac, col]) => {
      const x = Math.round(frac * WIDTH);
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, 0); ctx.lineTo(x, HEIGHT);
      ctx.stroke();
      // Diamond head
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(x, HEIGHT / 2, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Playhead
    if (playing && playhead >= 0) {
      const px = playhead * WIDTH;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(px, 0); ctx.lineTo(px, HEIGHT);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [audioBuffer, trimStart, trimEnd, playing, playhead]);

  // Drag trim handles
  const dragRef = useRef(null);

  const getX = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  };

  const onMouseDown = (e) => {
    const x = getX(e);
    const dStart = Math.abs(x - trimStart);
    const dEnd   = Math.abs(x - trimEnd);
    dragRef.current = dStart < dEnd ? 'start' : 'end';

    const onMove = (ev) => {
      const nx = getX(ev);
      if (dragRef.current === 'start') {
        onTrimChange(Math.min(nx, trimEnd - 0.02), trimEnd);
      } else {
        onTrimChange(trimStart, Math.max(nx, trimStart + 0.02));
      }
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <canvas
      ref={canvasRef}
      width={WIDTH}
      height={HEIGHT}
      onMouseDown={audioBuffer ? onMouseDown : undefined}
      style={{
        width: '100%', height: HEIGHT, borderRadius: 6,
        cursor: audioBuffer ? 'col-resize' : 'default',
        border: `1px solid ${C.border}`,
        display: 'block',
      }}
    />
  );
}

// ─── Single track row ──────────────────────────────────────────────────────────
function AudioTrack({ track, isSelected, onSelect, onDelete, onUpdate }) {
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [playhead, setPlayhead]             = useState(0);
  const [showFilters, setShowFilters]       = useState(false);
  const [showTrim, setShowTrim]             = useState(false);
  const audioCtxRef = useRef(null);
  const sourceRef   = useRef(null);
  const animRef     = useRef(null);
  const startTimeRef = useRef(0);
  const startAtRef   = useRef(0);

  const stopPreview = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch {}
      sourceRef.current = null;
    }
    setPreviewPlaying(false);
    setPlayhead(0);
  }, []);

  const playPreview = useCallback(async () => {
    if (previewPlaying) { stopPreview(); return; }
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;

      const resp   = await fetch(track.src);
      const buf    = await resp.arrayBuffer();
      const decoded = await ctx.decodeAudioData(buf);

      const dur     = decoded.duration;
      const offsetS = track.trimStart * dur;
      const trimDur = (track.trimEnd - track.trimStart) * dur;

      // Filter chain
      const filterNodes = buildFilterChain(ctx, track.filter);
      const dest = ctx.destination;
      let chainIn  = ctx;
      let chainOut = dest;

      if (filterNodes.length) {
        for (let i = 0; i < filterNodes.length - 1; i++) {
          filterNodes[i].connect(filterNodes[i + 1]);
        }
        chainOut = filterNodes[0];
        filterNodes[filterNodes.length - 1].connect(dest);
      }

      const src = ctx.createBufferSource();
      src.buffer = decoded;
      src.connect(chainOut);
      sourceRef.current = src;

      src.start(0, offsetS, trimDur);
      startTimeRef.current = ctx.currentTime;
      startAtRef.current   = offsetS;

      setPreviewPlaying(true);

      const tick = () => {
        const elapsed = ctx.currentTime - startTimeRef.current;
        const frac    = Math.min(1, (startAtRef.current + elapsed) / dur);
        setPlayhead(track.trimStart + (track.trimEnd - track.trimStart) * (frac / 1));

        // Map frac to position within trim window
        const progress = elapsed / trimDur;
        setPlayhead(track.trimStart + (track.trimEnd - track.trimStart) * Math.min(1, progress));

        if (elapsed < trimDur) {
          animRef.current = requestAnimationFrame(tick);
        } else {
          stopPreview();
        }
      };
      animRef.current = requestAnimationFrame(tick);

      src.onended = () => stopPreview();
    } catch (err) {
      console.error('Audio preview error', err);
      stopPreview();
    }
  }, [previewPlaying, track, stopPreview]);

  useEffect(() => () => stopPreview(), [stopPreview]);

  const trimDurationSec = track.audioBuffer
    ? ((track.trimEnd - track.trimStart) * track.audioBuffer.duration).toFixed(1)
    : ((track.trimEnd - track.trimStart) * (track.duration || 0)).toFixed(1);

  const activeFilter = AUDIO_FILTERS.find(f => f.id === track.filter) || AUDIO_FILTERS[0];

  return (
    <div
      onClick={onSelect}
      style={{
        background: isSelected ? 'rgba(245,158,11,0.06)' : C.surface,
        border: `1px solid ${isSelected ? C.accent : C.border}`,
        borderRadius: 10,
        padding: '10px 12px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        marginBottom: 8,
      }}
    >
      {/* Track header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        {/* Play button */}
        <button
          onClick={e => { e.stopPropagation(); playPreview(); }}
          style={{
            width: 28, height: 28, borderRadius: '50%', border: 'none',
            background: previewPlaying ? C.red : C.green,
            color: '#fff', fontSize: 11, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'background 0.15s',
          }}
        >
          {previewPlaying ? '■' : '▶'}
        </button>

        {/* Name + badge */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 12, fontWeight: 700, color: C.text,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {track.name}
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 2, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 10, color: C.muted, background: C.surface2,
              padding: '1px 5px', borderRadius: 3,
            }}>
              {trimDurationSec}s
            </span>
            {track.filter !== 'none' && (
              <span style={{
                fontSize: 10, color: activeFilter.color, background: C.surface2,
                padding: '1px 5px', borderRadius: 3,
              }}>
                {activeFilter.icon} {activeFilter.label}
              </span>
            )}
            {(track.volume !== undefined && track.volume !== 1) && (
              <span style={{
                fontSize: 10, color: C.blue, background: C.surface2,
                padding: '1px 5px', borderRadius: 3,
              }}>
                🔊 {Math.round(track.volume * 100)}%
              </span>
            )}
          </div>
        </div>

        {/* Volume knob */}
        <input
          type="range" min={0} max={2} step={0.05}
          value={track.volume ?? 1}
          onClick={e => e.stopPropagation()}
          onChange={e => { e.stopPropagation(); onUpdate({ volume: Number(e.target.value) }); }}
          style={{ width: 52, accentColor: C.accent, cursor: 'pointer' }}
          title={`Volume: ${Math.round((track.volume ?? 1) * 100)}%`}
        />

        {/* Delete */}
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          style={{
            background: 'none', border: 'none', color: C.muted,
            cursor: 'pointer', fontSize: 14, lineHeight: 1,
            padding: '2px 4px', borderRadius: 4, transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = C.red}
          onMouseLeave={e => e.currentTarget.style.color = C.muted}
          title="Remove track"
        >
          ✕
        </button>
      </div>

      {/* Waveform */}
      <Waveform
        audioBuffer={track.audioBuffer}
        trimStart={track.trimStart}
        trimEnd={track.trimEnd}
        duration={track.duration}
        playing={previewPlaying}
        playhead={playhead}
        onTrimChange={(s, e) => onUpdate({ trimStart: s, trimEnd: e })}
      />

      {/* Action pills */}
      {isSelected && (
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          {/* Trim button */}
          <button
            onClick={e => { e.stopPropagation(); setShowTrim(v => !v); setShowFilters(false); }}
            style={pillStyle(showTrim ? C.accent : C.muted, showTrim)}
          >
            ✂ Trim
          </button>
          {/* Filters button */}
          <button
            onClick={e => { e.stopPropagation(); setShowFilters(v => !v); setShowTrim(false); }}
            style={pillStyle(showFilters ? C.purple : C.muted, showFilters)}
          >
            🎛 Filter
          </button>
          {/* Loop toggle */}
          <button
            onClick={e => { e.stopPropagation(); onUpdate({ loop: !track.loop }); }}
            style={pillStyle(track.loop ? C.green : C.muted, track.loop)}
          >
            {track.loop ? '∞ Loop On' : '⟳ Loop Off'}
          </button>
        </div>
      )}

      {/* ── Trim panel ── */}
      {isSelected && showTrim && (
        <TrimPanel track={track} onUpdate={onUpdate} />
      )}

      {/* ── Filter panel ── */}
      {isSelected && showFilters && (
        <FilterPanel track={track} onUpdate={onUpdate} />
      )}
    </div>
  );
}

function pillStyle(color, active) {
  return {
    flex: 1, padding: '5px 8px', border: `1px solid ${active ? color : C.border}`,
    borderRadius: 6, background: active ? `${color}22` : 'transparent',
    color: active ? color : C.muted, fontSize: 11, fontWeight: 700,
    cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center',
  };
}

// ─── Trim panel ───────────────────────────────────────────────────────────────
function TrimPanel({ track, onUpdate }) {
  const dur = track.duration || 0;
  const startSec = (track.trimStart * dur).toFixed(2);
  const endSec   = (track.trimEnd   * dur).toFixed(2);
  const trimDur  = ((track.trimEnd - track.trimStart) * dur).toFixed(2);

  return (
    <div style={{
      marginTop: 10, padding: '10px 12px', background: C.surface2,
      borderRadius: 8, border: `1px solid ${C.border}`,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, marginBottom: 8, letterSpacing: 1 }}>
        ✂ TRIM AUDIO
      </div>

      {/* Start control */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: C.muted }}>Start</span>
          <span style={{ fontSize: 11, color: C.accent, fontFamily: 'monospace' }}>{startSec}s</span>
        </div>
        <input
          type="range" min={0} max={track.trimEnd - 0.02} step={0.01}
          value={track.trimStart}
          onChange={e => onUpdate({ trimStart: Number(e.target.value) })}
          style={{ width: '100%', accentColor: C.accent }}
        />
      </div>

      {/* End control */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: C.muted }}>End</span>
          <span style={{ fontSize: 11, color: C.green, fontFamily: 'monospace' }}>{endSec}s</span>
        </div>
        <input
          type="range" min={track.trimStart + 0.02} max={1} step={0.01}
          value={track.trimEnd}
          onChange={e => onUpdate({ trimEnd: Number(e.target.value) })}
          style={{ width: '100%', accentColor: C.green }}
        />
      </div>

      {/* Fade in / out */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: C.muted }}>Fade In</span>
            <span style={{ fontSize: 11, color: C.blue, fontFamily: 'monospace' }}>{(track.fadeIn || 0).toFixed(2)}s</span>
          </div>
          <input
            type="range" min={0} max={2} step={0.05}
            value={track.fadeIn || 0}
            onChange={e => onUpdate({ fadeIn: Number(e.target.value) })}
            style={{ width: '100%', accentColor: C.blue }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: C.muted }}>Fade Out</span>
            <span style={{ fontSize: 11, color: C.purple, fontFamily: 'monospace' }}>{(track.fadeOut || 0).toFixed(2)}s</span>
          </div>
          <input
            type="range" min={0} max={2} step={0.05}
            value={track.fadeOut || 0}
            onChange={e => onUpdate({ fadeOut: Number(e.target.value) })}
            style={{ width: '100%', accentColor: C.purple }}
          />
        </div>
      </div>

      {/* Summary */}
      <div style={{
        display: 'flex', gap: 12, padding: '6px 10px',
        background: C.bg, borderRadius: 6, marginTop: 4,
      }}>
        {[
          { label: 'Total',  val: `${dur.toFixed(1)}s`,    col: C.muted },
          { label: 'Trimmed', val: `${trimDur}s`,          col: C.accent },
          { label: 'Start',  val: `${startSec}s`,          col: C.text },
          { label: 'End',    val: `${endSec}s`,            col: C.text },
        ].map(r => (
          <div key={r.label} style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>{r.label}</div>
            <div style={{ fontSize: 11, color: r.col, fontWeight: 700, fontFamily: 'monospace' }}>{r.val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Filter panel ─────────────────────────────────────────────────────────────
function FilterPanel({ track, onUpdate }) {
  return (
    <div style={{
      marginTop: 10, padding: '10px 12px', background: C.surface2,
      borderRadius: 8, border: `1px solid ${C.border}`,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.purple, marginBottom: 10, letterSpacing: 1 }}>
        🎛 AUDIO FILTERS
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 5 }}>
        {AUDIO_FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => onUpdate({ filter: f.id })}
            title={f.desc}
            style={{
              padding: '7px 8px',
              background: track.filter === f.id ? `${f.color}22` : C.bg,
              border: `1px solid ${track.filter === f.id ? f.color : C.border}`,
              borderRadius: 7, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: 14, color: f.color }}>{f.icon}</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 11, color: track.filter === f.id ? f.color : C.text, fontWeight: 700 }}>
                {f.label}
              </div>
              <div style={{ fontSize: 9, color: C.muted, lineHeight: 1.2 }}>{f.desc}</div>
            </div>
            {track.filter === f.id && (
              <span style={{ marginLeft: 'auto', color: f.color, fontSize: 12 }}>✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main AudioTab ─────────────────────────────────────────────────────────────
export default function AudioTab() {
  const project       = useStore(s => s.project);
  const addAudioTrack = useStore(s => s.addAudioTrack);
  const removeAudioTrack = useStore(s => s.removeAudioTrack);
  const updateAudioTrack = useStore(s => s.updateAudioTrack);

  const [selectedId, setSelectedId] = useState(null);
  const [dragging, setDragging]     = useState(false);
  const fileInputRef = useRef(null);

  const tracks = project?.audioTracks ?? [];

  const handleFileInput = async (files) => {
    const file = files[0];
    if (!file) return;
    if (!file.type.startsWith('audio/')) {
      alert('Please upload an audio file (MP3, WAV, OGG, M4A, etc.)');
      return;
    }

    const src  = await readFileAsDataURL(file);
    const dur  = await getAudioDuration(src);

    // Decode for waveform
    let audioBuffer = null;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const ab  = await file.arrayBuffer();
      audioBuffer = await ctx.decodeAudioData(ab);
      ctx.close();
    } catch {}

    const id = crypto.randomUUID();
    addAudioTrack({
      id,
      name: file.name.replace(/\.[^.]+$/, ''),
      src,
      duration: dur,
      audioBuffer,    // transient – won't serialize but fine for session
      volume: 1,
      trimStart: 0,
      trimEnd: 1,
      fadeIn: 0,
      fadeOut: 0,
      filter: 'none',
      loop: false,
    });
    setSelectedId(id);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFileInput(e.dataTransfer.files);
  };

  if (!project) return null;

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
      padding: '10px 12px', gap: 10,
    }}>

      {/* ── Drop zone ── */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? C.accent : C.border}`,
          borderRadius: 10,
          padding: '16px 12px',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragging ? C.accentDim : C.surface2,
          transition: 'all 0.2s',
          flexShrink: 0,
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.background = C.accentDim; }}
        onMouseLeave={e => { if (!dragging) { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.surface2; } }}
      >
        <div style={{ fontSize: 24, marginBottom: 4 }}>🎵</div>
        <div style={{ fontSize: 12, color: C.text, fontWeight: 700 }}>Drop audio here</div>
        <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>MP3 · WAV · OGG · M4A · FLAC</div>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          style={{ display: 'none' }}
          onChange={e => handleFileInput(e.target.files)}
        />
      </div>

      {/* ── Track count header ── */}
      {tracks.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            Tracks ({tracks.length})
          </span>
          <span style={{ fontSize: 10, color: C.muted }}>click to select</span>
        </div>
      )}

      {/* ── Track list ── */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {tracks.length === 0 ? (
          <EmptyState />
        ) : (
          tracks.map(track => (
            <AudioTrack
              key={track.id}
              track={track}
              isSelected={selectedId === track.id}
              onSelect={() => setSelectedId(selectedId === track.id ? null : track.id)}
              onDelete={() => {
                removeAudioTrack(track.id);
                if (selectedId === track.id) setSelectedId(null);
              }}
              onUpdate={(changes) => updateAudioTrack(track.id, changes)}
            />
          ))
        )}
      </div>

      {/* ── How audio works note ── */}
      {tracks.length > 0 && (
        <div style={{
          padding: '8px 10px', background: C.surface2, borderRadius: 7,
          border: `1px solid ${C.border}`, flexShrink: 0,
        }}>
          <div style={{ fontSize: 10, color: C.muted, lineHeight: 1.5 }}>
            <span style={{ color: C.accent }}>♪</span> Tracks play during Preview.
            Use <span style={{ color: C.text }}>Trim</span> to crop the clip and{' '}
            <span style={{ color: C.text }}>Filter</span> to shape the sound.
            Drag the waveform handles to trim visually.
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 10, padding: '24px 0', color: C.muted,
    }}>
      {/* Mini platform mockup */}
      <div style={{
        display: 'flex', gap: 4, alignItems: 'flex-end', marginBottom: 6,
      }}>
        {[0.5, 0.8, 0.4, 1, 0.6, 0.9, 0.3, 0.7].map((h, i) => (
          <div key={i} style={{
            width: 4, height: 28 * h, borderRadius: 2,
            background: `rgba(245,158,11,${0.1 + h * 0.25})`,
          }} />
        ))}
      </div>
      <p style={{ fontSize: 13, fontWeight: 700, color: '#4b5563', margin: 0 }}>No audio tracks</p>
      <p style={{ fontSize: 11, color: '#374151', margin: 0, textAlign: 'center', lineHeight: 1.5 }}>
        Upload a track above to add<br />background music or narration
      </p>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function readFileAsDataURL(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

function getAudioDuration(src) {
  return new Promise((res) => {
    const a = new Audio(src);
    a.onloadedmetadata = () => res(a.duration);
    a.onerror = () => res(0);
  });
}
