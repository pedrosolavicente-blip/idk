import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Copy, Layers, Sliders, Palette, Grid, Plus, Minus, X } from 'lucide-react';
import ColorPicker from './ColorPicker';

const ACCENT = '#D8FF63';
const BASE = (import.meta as any).env?.BASE_URL || '';

const TEXTURE_IMAGES = [
  `${BASE}waves.png`,
];

interface BattenburgPattern {
  rows: number;
  cols: number;
  colors: string[];
  cellWidth: number;
  cellHeight: number;
  textureEnabled: boolean;
  textureOpacity: number;
  gap: number;
  borderRadius: number;
}

const PRESET_SIZES = [
  { label: '2x2', rows: 2, cols: 2 },
  { label: '2x3', rows: 2, cols: 3 },
  { label: '2x4', rows: 2, cols: 4 },
  { label: '2x5', rows: 2, cols: 5 },
  { label: '2x6', rows: 2, cols: 6 },
  { label: '2x7', rows: 2, cols: 7 },
  { label: '2x8', rows: 2, cols: 8 },
  { label: '3x3', rows: 3, cols: 3 },
  { label: '3x4', rows: 3, cols: 4 },
  { label: '4x4', rows: 4, cols: 4 },
];

export default function BattenburgGenerator() {
  const navigate = useNavigate();
  const [pattern, setPattern] = useState<BattenburgPattern>({
    rows: 2,
    cols: 7,
    colors: ['#C4FF0D', '#006B2B'],
    cellWidth: 90,
    cellHeight: 60,
    textureEnabled: false,
    textureOpacity: 40,
    gap: 0,
    borderRadius: 0,
  });
  const [selectedCellIndex, setSelectedCellIndex] = useState<number | null>(null);
  const [showAdvancedColorPicker, setShowAdvancedColorPicker] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const textureImgRef = useRef<HTMLImageElement | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Mouse wheel zoom
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY < 0) {
        // Zoom in
        setZoomLevel(prev => Math.min(prev + 0.1, 3));
      } else if (e.deltaY > 0) {
        // Zoom out
        setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
      }
    };

    const element = previewRef.current;
    if (element) {
      element.addEventListener('wheel', handleWheel, { passive: false });
      return () => element.removeEventListener('wheel', handleWheel);
    }
  }, []);

  // Generate battenburg colors
  const generateColors = useCallback((rows: number, cols: number, c1: string, c2: string): string[] => {
    const out: string[] = [];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        out.push((r + c) % 2 === 0 ? c1 : c2);
    return out;
  }, []);

  // Update pattern size
  const updateSize = useCallback((rows: number, cols: number) => {
    setPattern(prev => ({
      ...prev,
      rows: Math.max(1, Math.min(12, rows)),
      cols: Math.max(1, Math.min(16, cols)),
      colors: generateColors(Math.max(1, Math.min(12, rows)), Math.max(1, Math.min(16, cols)), prev.colors[0] || '#C4FF0D', prev.colors[1] || '#006B2B')
    }));
  }, [generateColors]);

  // Update basic colors
  const updateBasicColors = useCallback((c1: string, c2: string) => {
    setPattern(prev => ({
      ...prev,
      colors: generateColors(prev.rows, prev.cols, c1, c2)
    }));
  }, [generateColors]);

  // Update individual cell color
  const updateCellColor = useCallback((index: number, color: string) => {
    setPattern(prev => {
      const newColors = [...prev.colors];
      newColors[index] = color;
      return { ...prev, colors: newColors };
    });
    setSelectedCellIndex(null);
    setShowAdvancedColorPicker(false);
  }, []);

  const exportAsPNG = useCallback(() => {
    const { rows, cols, colors, cellWidth, cellHeight, textureEnabled, textureOpacity, gap, borderRadius } = pattern;
    const totalW = cols * (cellWidth + gap) - gap;
    const totalH = rows * (cellHeight + gap) - gap;
    const canvas = document.createElement('canvas');
    canvas.width = totalW; canvas.height = totalH;
    const ctx = canvas.getContext('2d')!;

    colors.forEach((color, idx) => {
      const row = Math.floor(idx / cols);
      const col = idx % cols;
      const x = col * (cellWidth + gap);
      const y = row * (cellHeight + gap);
      const rx = (borderRadius / 100) * Math.min(cellWidth, cellHeight);
      ctx.beginPath();
      if (rx > 0) ctx.roundRect(x, y, cellWidth, cellHeight, rx);
      else ctx.rect(x, y, cellWidth, cellHeight);
      ctx.fillStyle = color;
      ctx.fill();
      if (textureEnabled && textureImgRef.current) {
        ctx.save(); 
        ctx.globalAlpha = textureOpacity / 100;
        
        // Draw waves texture over entire battenburg pattern
        ctx.drawImage(
          textureImgRef.current,
          0, 0,
          totalW, totalH
        );
        
        ctx.restore();
      }
    });

    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `battenburg-${rows}x${cols}.png`;
      a.click(); URL.revokeObjectURL(url);
    }, 'image/png');
  }, [pattern]);

  const Stepper = ({ label, value, min, max, onChange }: {
    label: string; value: number; min: number; max: number; onChange: (v: number) => void;
  }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ color: 'var(--text-3)', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', minWidth: 36 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', height: 30, flex: 1 }}>
        <button onClick={() => onChange(Math.max(min, value - 1))}
          style={{ width: 28, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', borderRight: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-3)', transition: 'color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = ACCENT)}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
        ><ChevronDown size={11} /></button>
        <input type="number" min={min} max={max} value={value}
          onChange={e => onChange(Math.max(min, Math.min(max, parseInt(e.target.value) || min)))}
          style={{ flex: 1, textAlign: 'center', background: 'none', border: 'none', color: 'var(--text-1)', fontSize: 12, fontWeight: 700, outline: 'none' }}
        />
        <button onClick={() => onChange(Math.min(max, value + 1))}
          style={{ width: 28, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', borderLeft: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-3)', transition: 'color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = ACCENT)}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
        ><ChevronUp size={11} /></button>
      </div>
    </div>
  );

  const SliderControl = ({ label, value, min, max, unit = '', onChange }: {
    label: string; value: number; min: number; max: number; unit?: string; onChange: (v: number) => void;
  }) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ color: 'var(--text-2)', fontSize: 11, fontWeight: 500 }}>{label}</span>
        <span style={{ color: ACCENT, fontSize: 10, fontWeight: 700, fontFamily: 'monospace', background: 'rgba(216,255,99,0.08)', padding: '2px 8px', borderRadius: 4, border: '1px solid rgba(216,255,99,0.2)' }}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        className="lv-range" style={{ width: '100%' }} />
    </div>
  );

  const color1 = pattern.colors[0] || '#C4FF0D';
  const color2 = pattern.colors[1] || '#006B2B';
  const totalW = pattern.cols * (pattern.cellWidth + pattern.gap) - pattern.gap;
  const totalH = pattern.rows * (pattern.cellHeight + pattern.gap) - pattern.gap;

  const PRESETS = [
    { r: 2, c: 4 }, { r: 2, c: 7 }, { r: 2, c: 10 },
    { r: 3, c: 5 }, { r: 4, c: 4 }, { r: 4, c: 8 },
  ];

  return (
    <>
      <style>{`
        *, *::before, *::after { font-family: 'Inter', sans-serif !important; box-sizing: border-box; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }

        :root {
          --accent: #D8FF63;
          --surface0: #080808;
          --surface1: #0e0e0e;
          --surface2: #161616;
          --surface3: #1e1e1e;
          --border: rgba(255,255,255,0.07);
          --text-1: #f4f4f5;
          --text-2: #a1a1aa;
          --text-3: #71717a;
        }

        /* Navbar-inspired theme */
        .navbar-bg {
          background: linear-gradient(to bottom, rgba(0,0,0,0.97), rgba(0,0,0,0.92));
          backdrop-filter: blur(32px);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          box-shadow: 0 8px 32px rgba(0,0,0,0.8);
        }
        .navbar-btn {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          color: var(--text-3);
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          transition: all 0.15s;
        }
        .navbar-btn:hover {
          color: var(--text-1);
          border-color: rgba(255,255,255,0.2);
        }
        .navbar-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(216,255,99,0.2), transparent);
          transition: left 0.5s ease;
        }
        .navbar-btn:hover::before {
          left: 100%;
        }

        .lv-sidebar::-webkit-scrollbar { width: 3px; }
        .lv-sidebar::-webkit-scrollbar-track { background: transparent; }
        .lv-sidebar::-webkit-scrollbar-thumb { background: rgba(216,255,99,0.2); border-radius: 99px; }

        .lv-range {
          -webkit-appearance: none; appearance: none;
          height: 3px; border-radius: 99px; outline: none; cursor: pointer; background: var(--surface3);
        }
        .lv-range::-webkit-slider-thumb {
          -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%;
          background: var(--accent); border: 2px solid #080808;
          box-shadow: 0 0 8px rgba(216,255,99,0.5); cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .lv-range::-webkit-slider-thumb:hover { transform: scale(1.3); box-shadow: 0 0 16px rgba(216,255,99,0.8); }

        .mode-btn {
          flex: 1; padding: 6px 0; border-radius: 8px; font-size: 10px; font-weight: 700;
          letter-spacing: 0.06em; text-transform: uppercase; border: 1px solid var(--border);
          background: var(--surface2); color: var(--text-3); cursor: pointer; transition: all 0.15s;
        }
        .mode-btn:hover {
          color: var(--text-1);
          border-color: rgba(255,255,255,0.2);
        }
        .mode-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(216,255,99,0.2), transparent);
          transition: left 0.5s ease;
        }
        .mode-btn:hover::before {
          left: 100%;
        }

        .section-card { 
          background: var(--surface1); 
          border: 1px solid var(--border); 
          border-radius: 12px; 
          padding: 16px; 
          margin-bottom: 10px; 
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .section-title { 
          color: var(--text-1); 
          font-weight: 700; 
          font-size: 11px; 
          letter-spacing: 0.08em; 
          text-transform: uppercase; 
          margin-bottom: 14px; 
          display: flex; 
          align-items: center; 
          gap: 8px; 
        }

        .export-btn {
          width: 100%; padding: 10px 14px; border-radius: 8px; font-size: 10px; font-weight: 700;
          letter-spacing: 0.06em; text-transform: uppercase;
          border: 1px solid rgba(216,255,99,0.3); background: rgba(216,255,99,0.08); color: #D8FF63;
          cursor: pointer; transition: all 0.15s; display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .export-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(216,255,99,0.2), transparent);
          transition: left 0.5s ease;
        }
        .export-btn:hover::before {
          left: 100%;
        }

        .livery-tab {
          flex: 1; padding: 6px 8px; border-radius: 8px; font-size: 9px; font-weight: 700;
          letter-spacing: 0.05em; text-transform: uppercase; border: 1px solid var(--border);
          background: var(--surface2); color: var(--text-3); cursor: pointer; transition: all 0.15s;
        }
        .livery-tab::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(216,255,99,0.2), transparent);
          transition: left 0.5s ease;
        }
        .livery-tab:hover::before {
          left: 100%;
        }
        .livery-tab.active { background: rgba(216,255,99,0.08); border-color: rgba(216,255,99,0.3); color: #D8FF63; }

        .preset-btn {
          padding: 5px 4px; border-radius: 6px; font-size: 9px; font-weight: 700;
          border: 1px solid var(--border); background: var(--surface2); color: var(--text-3);
          cursor: pointer; transition: all 0.15s; text-align: center;
        }
        .preset-btn:hover { border-color: rgba(216,255,99,0.3); color: var(--text-1); }
        .preset-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(216,255,99,0.2), transparent);
          transition: left 0.5s ease;
        }
        .preset-btn:hover::before {
          left: 100%;
        }
        .preset-btn.active { background: rgba(216,255,99,0.12); border-color: rgba(216,255,99,0.4); color: #D8FF63; }

        .color-cell-btn {
          aspect-ratio: 1; border: 2px solid rgba(255,255,255,0.1); border-radius: 5px; cursor: pointer; transition: all 0.15s;
        }
        .color-cell-btn:hover { border-color: rgba(216,255,99,0.5); transform: scale(1.08); }
        .color-cell-btn.selected { border-color: #D8FF63; box-shadow: 0 0 12px rgba(216,255,99,0.5); }

        .toggle-track { 
          width: 36px; 
          height: 20px; 
          border-radius: 99px; 
          border: 1px solid var(--border); 
          cursor: pointer; 
          transition: all 0.2s; 
          position: relative; 
          flex-shrink: 0; 
          background: var(--surface2);
        }
        .toggle-thumb { 
          position: absolute; 
          top: 2px; 
          width: 14px; 
          height: 14px; 
          border-radius: 50%; 
          transition: transform 0.2s, background 0.2s; 
          box-shadow: 0 1px 4px rgba(0,0,0,0.4); 
          background: rgba(255,255,255,0.6);
        }
        .toggle-track:hover .toggle-thumb {
          background: var(--accent);
        }

        .zoom-controls {
          position: absolute;
          bottom: 20px;
          right: 20px;
          display: flex;
          gap: 8px;
          background: var(--surface1);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        .zoom-btn {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          border: 1px solid var(--border);
          background: var(--surface2);
          color: var(--text-3);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }
        .zoom-btn:hover {
          color: var(--text-1);
          border-color: rgba(255,255,255,0.2);
        }
        .zoom-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(216,255,99,0.2), transparent);
          transition: left 0.5s ease;
        }
        .zoom-btn:hover::before {
          left: 100%;
        }

        @keyframes fadeIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
        .modal-enter { animation: fadeIn 0.15s ease; }
      `}</style>

      <div style={{ minHeight: '100vh', background: 'var(--surface0)' }}>
        {/* Navbar */}
        <nav style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 32px',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.97), rgba(0,0,0,0.92))',
          backdropFilter: 'blur(32px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
        }}>
          <img src={`${BASE}itzz.svg`} alt="itzz"
            style={{ height: 28, cursor: 'pointer', transition: 'transform 0.2s' }}
            onClick={() => navigate('/')}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          />
          <button onClick={() => navigate('/tools')}
            style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', color: 'var(--text-3)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
          >Back to Tools</button>
        </nav>

        <div style={{ display: 'flex', height: '100vh', paddingTop: 52 }}>

          {/* SIDEBAR */}
          <div className="lv-sidebar" style={{ width: 300, minWidth: 300, overflowY: 'auto', padding: '16px 14px', borderRight: '1px solid var(--border)', background: 'var(--surface0)' }}>

            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              {(['basic', 'advanced'] as const).map(m => (
                <button key={m} className={`mode-btn ${mode === m ? 'active' : ''}`} onClick={() => setMode(m)}>{m}</button>
              ))}
            </div>

            {/* LIVERY */}
            <div className="section-card">
              <div className="section-title"><Layers size={13} style={{ color: ACCENT }} />Livery Base</div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                <button className={`livery-tab ${activeLivery === 0 ? 'active' : ''}`} onClick={() => setActiveLivery(0)}>Rect 38</button>
                <button className={`livery-tab ${activeLivery === 1 ? 'active' : ''}`} onClick={() => setActiveLivery(1)}>Rect 38 (1)</button>
              </div>
              <div style={{
                borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)',
                height: 44, background: 'var(--surface2)',
                backgroundImage: `url(${LIVERY_IMAGES[activeLivery]})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
              }} />
            </div>

            {/* TEXTURE */}
            <div className="section-card">
              <div className="section-title"><Layers size={13} style={{ color: ACCENT }} />Texture Overlay</div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: pattern.textureEnabled ? 14 : 0 }}>
                <span style={{ color: 'var(--text-2)', fontSize: 11 }}>Waves overlay</span>
                <div className="toggle-track"
                  style={{ background: pattern.textureEnabled ? 'rgba(216,255,99,0.2)' : 'var(--surface2)' }}
                  onClick={() => setPattern(p => ({ ...p, textureEnabled: !p.textureEnabled }))}>
                  <div className="toggle-thumb" style={{ transform: pattern.textureEnabled ? 'translateX(16px)' : 'translateX(2px)', background: pattern.textureEnabled ? ACCENT : 'rgba(255,255,255,0.6)' }} />
                </div>
              </div>
              {pattern.textureEnabled && (
                <div style={{ marginTop: 12 }}>
                  <SliderControl label="Opacity" value={pattern.textureOpacity} min={5} max={100} unit="%" onChange={v => setPattern(p => ({ ...p, textureOpacity: v }))} />
                </div>
              )}
            </div>

            {/* EXPORT */}
            <div className="section-card">
              <div className="section-title">Export</div>
              <button className="export-btn" onClick={exportAsPNG}>
                <Download size={14} />
                Download PNG ({pattern.rows}×{pattern.cols})
              </button>
            </div>

            {/* Stats */}
            <div style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--surface1)', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center' }}>
              {[
                { label: 'Cells', val: pattern.rows * pattern.cols },
                { label: 'Width', val: `${totalW}px` },
                { label: 'Height', val: `${totalH}px` },
              ].map(({ label, val }) => (
                <div key={label}>
                  <div style={{ color: ACCENT, fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>{val}</div>
                  <div style={{ color: 'var(--text-3)', fontSize: 9, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* PREVIEW */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface0)', overflow: 'hidden', position: 'relative' }} ref={previewRef}>
            {/* Dot grid bg */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

            {/* Zoom Controls */}
            <div className="zoom-controls">
              <button 
                className={`zoom-btn ${zoomLevel === 0.5 ? 'active' : ''}`}
                onClick={() => setZoomLevel(0.5)}
              >−</button>
              <button 
                className={`zoom-btn ${zoomLevel === 1 ? 'active' : ''}`}
                onClick={() => setZoomLevel(1)}
              >100%</button>
              <button 
                className={`zoom-btn ${zoomLevel === 2 ? 'active' : ''}`}
                onClick={() => setZoomLevel(2)}
              >+</button>
            </div>

            {/* Zoom Indicator */}
            <div className="zoom-indicator">
              {Math.round(zoomLevel * 100)}%
            </div>

            {/* Composite: pattern */}
            <div style={{
              position: 'relative',
              width: totalW * zoomLevel, 
              height: totalH * zoomLevel,
              boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
              borderRadius: 4, 
              overflow: 'hidden',
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'center',
            }}>
              {/* Pattern overlay */}
              <div style={{
                position: 'absolute', inset: 0,
                display: 'grid',
                gridTemplateColumns: `repeat(${pattern.cols}, ${pattern.cellWidth}px)`,
                gridTemplateRows: `repeat(${pattern.rows}, ${pattern.cellHeight}px)`,
                gap: `${pattern.gap}px`,
                width: totalW, height: totalH,
              }}>
                {pattern.colors.map((color, idx) => {
                  const rx = (pattern.borderRadius / 100) * Math.min(pattern.cellWidth, pattern.cellHeight);
                  return (
                    <div key={idx} style={{
                      backgroundColor: color,
                      borderRadius: rx,
                      position: 'relative', overflow: 'hidden',
                      width: pattern.cellWidth, height: pattern.cellHeight,
                    }} />
                  );
                })}
              </div>
              
              {/* Waves overlay - covers entire pattern */}
              {pattern.textureEnabled && textureImgRef.current && (
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundImage: `url(${textureImgRef.current.src})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  opacity: pattern.textureOpacity / 100,
                  mixBlendMode: 'multiply',
                  pointerEvents: 'none',
                }} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showAdvancedColorPicker && selectedCellIndex !== null && (
        <div className="modal-enter" style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) { setShowAdvancedColorPicker(false); setSelectedCellIndex(null); } }}>
          <div style={{ background: 'var(--surface1)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, width: 300, boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 20, height: 20, borderRadius: 5, backgroundColor: pattern.colors[selectedCellIndex], border: '1px solid rgba(255,255,255,0.15)' }} />
                <span style={{ color: 'var(--text-1)', fontSize: 13, fontWeight: 700 }}>Cell {selectedCellIndex + 1}</span>
              </div>
              <button onClick={() => { setShowAdvancedColorPicker(false); setSelectedCellIndex(null); }}
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: 'var(--text-2)', display: 'flex', alignItems: 'center' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-1)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}
              ><X size={14} /></button>
            </div>
            <ColorPicker color={pattern.colors[selectedCellIndex]} onChange={c => updateCellColor(selectedCellIndex, c)} />
            <button onClick={() => { setShowAdvancedColorPicker(false); setSelectedCellIndex(null); }}
              style={{ marginTop: 14, width: '100%', padding: '8px', borderRadius: 8, border: '1px solid rgba(216,255,99,0.3)', background: 'rgba(216,255,99,0.08)', color: ACCENT, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(216,255,99,0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(216,255,99,0.08)'; }}
            >Done</button>
          </div>
        </div>
      )}
    </>
  );
}