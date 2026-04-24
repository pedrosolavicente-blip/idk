import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Layers, Sliders, Palette, RotateCw, Grid, X, ChevronUp, ChevronDown } from 'lucide-react';
import ColorPicker from './ColorPicker';

const ACCENT = '#D8FF63';
const BASE = (import.meta as any).env?.BASE_URL || '';

interface BattenburgPattern {
  rows: number;
  cols: number;
  colors: string[];
  cellSize: number;
  rotation: number;
  textureEnabled: boolean;
  textureOpacity: number;
  gap: number;
  borderRadius: number;
}

export default function BattenburgGenerator() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'basic' | 'advanced'>('basic');
  const [pattern, setPattern] = useState<BattenburgPattern>({
    rows: 2,
    cols: 7,
    colors: ['#ff6b6b', '#ffffff'],
    cellSize: 60,
    rotation: 0,
    textureEnabled: false,
    textureOpacity: 40,
    gap: 2,
    borderRadius: 0,
  });
  const [selectedCellIndex, setSelectedCellIndex] = useState<number | null>(null);
  const [showAdvancedColorPicker, setShowAdvancedColorPicker] = useState(false);
  const [textureImageLoaded, setTextureImageLoaded] = useState(false);
  const textureImgRef = useRef<HTMLImageElement | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Preload texture image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      textureImgRef.current = img;
      setTextureImageLoaded(true);
    };
    img.onerror = () => {
      // Fallback: create a canvas-based battenburg texture
      const c = document.createElement('canvas');
      c.width = 20; c.height = 20;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(0, 0, 10, 10);
      ctx.fillRect(10, 10, 10, 10);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(10, 0, 10, 10);
      ctx.fillRect(0, 10, 10, 10);
      const fallbackImg = new Image();
      fallbackImg.onload = () => {
        textureImgRef.current = fallbackImg;
        setTextureImageLoaded(true);
      };
      fallbackImg.src = c.toDataURL();
    };
    img.src = `${BASE}textures/battenburg.png`;
  }, []);

  const generateColors = useCallback((rows: number, cols: number, c1: string, c2: string): string[] => {
    const colors: string[] = [];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        colors.push((r + c) % 2 === 0 ? c1 : c2);
    return colors;
  }, []);

  const updateSize = useCallback((rows: number, cols: number) => {
    const r = Math.max(1, Math.min(12, rows));
    const c = Math.max(1, Math.min(16, cols));
    setPattern(prev => ({
      ...prev,
      rows: r,
      cols: c,
      colors: generateColors(r, c, prev.colors[0] || '#ff6b6b', prev.colors[1] || '#ffffff'),
    }));
  }, [generateColors]);

  const updateBasicColors = useCallback((c1: string, c2: string) => {
    setPattern(prev => ({
      ...prev,
      colors: generateColors(prev.rows, prev.cols, c1, c2),
    }));
  }, [generateColors]);

  const updateCellColor = useCallback((index: number, color: string) => {
    setPattern(prev => {
      const next = [...prev.colors];
      next[index] = color;
      return { ...prev, colors: next };
    });
  }, []);

  // ---- EXPORT: render to canvas and download ----
  const exportAsPNG = useCallback(() => {
    const { rows, cols, colors, cellSize, rotation, textureEnabled, textureOpacity, gap, borderRadius } = pattern;
    const totalW = cols * (cellSize + gap) - gap;
    const totalH = rows * (cellSize + gap) - gap;

    // Compute canvas size accounting for rotation
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.abs(Math.cos(rad));
    const sin = Math.abs(Math.sin(rad));
    const canvasW = Math.ceil(totalW * cos + totalH * sin);
    const canvasH = Math.ceil(totalW * sin + totalH * cos);

    const canvas = document.createElement('canvas');
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext('2d')!;

    ctx.save();
    ctx.translate(canvasW / 2, canvasH / 2);
    ctx.rotate(rad);
    ctx.translate(-totalW / 2, -totalH / 2);

    colors.forEach((color, idx) => {
      const row = Math.floor(idx / cols);
      const col = idx % cols;
      const x = col * (cellSize + gap);
      const y = row * (cellSize + gap);

      if (borderRadius > 0) {
        ctx.beginPath();
        ctx.roundRect(x, y, cellSize, cellSize, borderRadius);
        ctx.fillStyle = color;
        ctx.fill();
      } else {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, cellSize, cellSize);
      }

      // Texture overlay
      if (textureEnabled && textureImgRef.current) {
        ctx.save();
        if (borderRadius > 0) {
          ctx.beginPath();
          ctx.roundRect(x, y, cellSize, cellSize, borderRadius);
          ctx.clip();
        }
        ctx.globalAlpha = textureOpacity / 100;
        const tSize = 20;
        for (let ty = y; ty < y + cellSize; ty += tSize)
          for (let tx = x; tx < x + cellSize; tx += tSize)
            ctx.drawImage(textureImgRef.current, tx, ty, tSize, tSize);
        ctx.globalAlpha = 1;
        ctx.restore();
      }
    });

    ctx.restore();

    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `battenburg-${rows}x${cols}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  }, [pattern]);

  // ---- Stepper input component ----
  const Stepper = ({ label, value, min, max, onChange }: {
    label: string; value: number; min: number; max: number; onChange: (v: number) => void;
  }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ color: 'var(--text-3)', fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', minWidth: 32 }}>{label}</span>
      <div style={{
        display: 'flex', alignItems: 'center',
        background: 'var(--surface2)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        overflow: 'hidden',
        height: 30,
      }}>
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          style={{
            width: 28, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-3)', transition: 'color 0.15s',
            borderRight: '1px solid var(--border)',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = ACCENT)}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
        >
          <ChevronDown size={12} />
        </button>
        <input
          type="number" min={min} max={max} value={value}
          onChange={e => onChange(Math.max(min, Math.min(max, parseInt(e.target.value) || min)))}
          style={{
            width: 40, height: '100%', textAlign: 'center', background: 'none',
            border: 'none', color: 'var(--text-1)', fontSize: 12, fontWeight: 600,
            outline: 'none', MozAppearance: 'textfield',
          }}
        />
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          style={{
            width: 28, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-3)', transition: 'color 0.15s',
            borderLeft: '1px solid var(--border)',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = ACCENT)}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
        >
          <ChevronUp size={12} />
        </button>
      </div>
    </div>
  );

  const SliderControl = ({ label, value, min, max, unit = '', onChange }: {
    label: string; value: number; min: number; max: number; unit?: string; onChange: (v: number) => void;
  }) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ color: 'var(--text-2)', fontSize: 11, fontWeight: 500, letterSpacing: '0.02em' }}>{label}</span>
        <span style={{
          color: ACCENT, fontSize: 10, fontWeight: 700, fontFamily: 'monospace',
          background: 'rgba(216,255,99,0.08)', padding: '2px 8px',
          borderRadius: 4, border: '1px solid rgba(216,255,99,0.2)',
        }}>{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        className="lv-range" style={{ width: '100%' }}
      />
    </div>
  );

  const color1 = pattern.colors[0] || '#ff6b6b';
  const color2 = pattern.colors[1] || '#ffffff';

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
          --border-accent: rgba(216,255,99,0.28);
          --text-1: #f4f4f5;
          --text-2: #a1a1aa;
          --text-3: #71717a;
        }

        .lv-sidebar::-webkit-scrollbar       { width: 3px; }
        .lv-sidebar::-webkit-scrollbar-track { background: transparent; }
        .lv-sidebar::-webkit-scrollbar-thumb { background: rgba(216,255,99,0.2); border-radius: 99px; }
        .lv-sidebar::-webkit-scrollbar-thumb:hover { background: rgba(216,255,99,0.45); }

        .lv-range {
          -webkit-appearance: none;
          appearance: none;
          height: 3px;
          border-radius: 99px;
          outline: none;
          cursor: pointer;
          background: var(--surface3);
        }
        .lv-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px; height: 14px;
          border-radius: 50%;
          background: var(--accent);
          border: 2px solid #080808;
          box-shadow: 0 0 8px rgba(216,255,99,0.5);
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .lv-range::-webkit-slider-thumb:hover {
          transform: scale(1.3);
          box-shadow: 0 0 16px rgba(216,255,99,0.8);
        }

        .mode-btn {
          flex: 1;
          padding: 6px 0;
          border-radius: 8px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          border: 1px solid var(--border);
          background: var(--surface2);
          color: var(--text-3);
          cursor: pointer;
          transition: all 0.15s;
        }
        .mode-btn.active {
          background: rgba(216,255,99,0.1);
          border-color: rgba(216,255,99,0.35);
          color: #D8FF63;
          box-shadow: 0 0 12px rgba(216,255,99,0.1);
        }

        .section-card {
          background: var(--surface1);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 12px;
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
          width: 100%;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          border: 1px solid rgba(216,255,99,0.3);
          background: rgba(216,255,99,0.08);
          color: #D8FF63;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .export-btn:hover {
          background: rgba(216,255,99,0.15);
          border-color: rgba(216,255,99,0.5);
          box-shadow: 0 0 24px rgba(216,255,99,0.2);
          transform: translateY(-1px);
        }
        .export-btn:active { transform: translateY(0); }

        .color-cell-btn {
          aspect-ratio: 1;
          border: 2px solid rgba(255,255,255,0.1);
          border-radius: 5px;
          cursor: pointer;
          transition: all 0.15s;
          position: relative;
        }
        .color-cell-btn:hover {
          border-color: rgba(216,255,99,0.5);
          transform: scale(1.08);
          z-index: 2;
          box-shadow: 0 0 10px rgba(216,255,99,0.25);
        }
        .color-cell-btn.selected {
          border-color: #D8FF63;
          box-shadow: 0 0 12px rgba(216,255,99,0.5);
          z-index: 3;
        }

        .toggle-track {
          width: 36px; height: 20px;
          border-radius: 99px;
          border: 1px solid var(--border);
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          flex-shrink: 0;
        }
        .toggle-thumb {
          position: absolute;
          top: 2px;
          width: 14px; height: 14px;
          border-radius: 50%;
          background: white;
          transition: transform 0.2s, background 0.2s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.4);
        }

        .preset-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 4px;
        }
        .preset-btn {
          padding: 5px 2px;
          border-radius: 6px;
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.02em;
          border: 1px solid var(--border);
          background: var(--surface2);
          color: var(--text-3);
          cursor: pointer;
          transition: all 0.15s;
          text-align: center;
        }
        .preset-btn:hover {
          border-color: rgba(216,255,99,0.3);
          color: var(--text-1);
          background: rgba(216,255,99,0.05);
        }
        .preset-btn.active {
          background: rgba(216,255,99,0.12);
          border-color: rgba(216,255,99,0.4);
          color: #D8FF63;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
        .modal-enter { animation: fadeIn 0.15s ease; }

        .grid-cell {
          transition: transform 0.1s;
        }
        .grid-cell:hover {
          transform: scale(0.97);
          z-index: 1;
        }
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
          <button
            onClick={() => navigate('/tools')}
            style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
              padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
              color: 'var(--text-3)', background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
          >
            Back to Tools
          </button>
        </nav>

        {/* Main Layout */}
        <div style={{ display: 'flex', height: '100vh', paddingTop: 52 }}>

          {/* ---- SIDEBAR ---- */}
          <div className="lv-sidebar" style={{
            width: 300, minWidth: 300,
            overflowY: 'auto', padding: '16px 14px',
            borderRight: '1px solid var(--border)',
            background: 'var(--surface0)',
          }}>

            {/* Mode toggle */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {(['basic', 'advanced'] as const).map(m => (
                <button key={m} className={`mode-btn ${mode === m ? 'active' : ''}`}
                  onClick={() => setMode(m)}>
                  {m}
                </button>
              ))}
            </div>

            {/* === GRID SIZE === */}
            <div className="section-card">
              <div className="section-title">
                <Grid size={13} style={{ color: ACCENT }} />
                Grid Size
              </div>

              {/* Presets */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ color: 'var(--text-3)', fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', marginBottom: 8 }}>PRESETS</div>
                <div className="preset-grid">
                  {[
                    { r: 2, c: 2 }, { r: 2, c: 4 }, { r: 2, c: 7 }, { r: 3, c: 3 }, { r: 3, c: 5 },
                    { r: 4, c: 4 }, { r: 4, c: 6 }, { r: 2, c: 10 }, { r: 5, c: 5 }, { r: 6, c: 6 },
                  ].map(({ r, c }) => (
                    <button
                      key={`${r}x${c}`}
                      className={`preset-btn ${pattern.rows === r && pattern.cols === c ? 'active' : ''}`}
                      onClick={() => updateSize(r, c)}
                    >
                      {r}×{c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual steppers */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Stepper label="ROWS" value={pattern.rows} min={1} max={12} onChange={v => updateSize(v, pattern.cols)} />
                <Stepper label="COLS" value={pattern.cols} min={1} max={16} onChange={v => updateSize(pattern.rows, v)} />
              </div>
            </div>

            {/* === CELL SETTINGS === */}
            <div className="section-card">
              <div className="section-title">
                <Sliders size={13} style={{ color: ACCENT }} />
                Cell Settings
              </div>
              <SliderControl label="Cell Size" value={pattern.cellSize} min={20} max={120} unit="px"
                onChange={v => setPattern(p => ({ ...p, cellSize: v }))} />
              <SliderControl label="Gap" value={pattern.gap} min={0} max={20} unit="px"
                onChange={v => setPattern(p => ({ ...p, gap: v }))} />
              <SliderControl label="Border Radius" value={pattern.borderRadius} min={0} max={50} unit="%"
                onChange={v => setPattern(p => ({ ...p, borderRadius: v }))} />
            </div>

            {/* === TRANSFORM === */}
            <div className="section-card">
              <div className="section-title">
                <RotateCw size={13} style={{ color: ACCENT }} />
                Transform
              </div>
              <SliderControl label="Rotation" value={pattern.rotation} min={0} max={360} unit="°"
                onChange={v => setPattern(p => ({ ...p, rotation: v }))} />
            </div>

            {/* === COLORS === */}
            <div className="section-card">
              <div className="section-title">
                <Palette size={13} style={{ color: ACCENT }} />
                Colors
              </div>

              {mode === 'basic' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <div style={{ color: 'var(--text-3)', fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', marginBottom: 8 }}>COLOR A</div>
                    <ColorPicker color={color1} onChange={c => updateBasicColors(c, color2)} />
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-3)', fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', marginBottom: 8 }}>COLOR B</div>
                    <ColorPicker color={color2} onChange={c => updateBasicColors(color1, c)} />
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ color: 'var(--text-3)', fontSize: 10, marginBottom: 10 }}>
                    Click any cell to change its color
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${Math.min(pattern.cols, 8)}, 1fr)`,
                    gap: 3,
                    padding: 10,
                    background: 'var(--surface2)',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                  }}>
                    {pattern.colors.map((color, idx) => (
                      <button
                        key={idx}
                        className={`color-cell-btn ${selectedCellIndex === idx ? 'selected' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => { setSelectedCellIndex(idx); setShowAdvancedColorPicker(true); }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* === TEXTURE === */}
            <div className="section-card">
              <div className="section-title">
                <Layers size={13} style={{ color: ACCENT }} />
                Texture Overlay
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: pattern.textureEnabled ? 14 : 0 }}>
                <span style={{ color: 'var(--text-2)', fontSize: 11 }}>Battenburg texture</span>
                <div
                  className="toggle-track"
                  style={{ background: pattern.textureEnabled ? 'rgba(216,255,99,0.2)' : 'var(--surface2)' }}
                  onClick={() => setPattern(p => ({ ...p, textureEnabled: !p.textureEnabled }))}
                >
                  <div className="toggle-thumb" style={{
                    transform: pattern.textureEnabled ? 'translateX(16px)' : 'translateX(2px)',
                    background: pattern.textureEnabled ? ACCENT : 'rgba(255,255,255,0.6)',
                  }} />
                </div>
              </div>

              {pattern.textureEnabled && (
                <SliderControl
                  label="Opacity"
                  value={pattern.textureOpacity}
                  min={5} max={100} unit="%"
                  onChange={v => setPattern(p => ({ ...p, textureOpacity: v }))}
                />
              )}
            </div>

            {/* === EXPORT === */}
            <div className="section-card">
              <div className="section-title">Export</div>
              <button className="export-btn" onClick={exportAsPNG}>
                <Download size={14} />
                Download PNG ({pattern.rows}×{pattern.cols})
              </button>
            </div>

            {/* Stats footer */}
            <div style={{
              padding: '10px 12px',
              borderRadius: 8,
              background: 'var(--surface1)',
              border: '1px solid var(--border)',
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
              gap: 8, textAlign: 'center',
            }}>
              {[
                { label: 'Cells', val: pattern.rows * pattern.cols },
                { label: 'Size', val: `${pattern.cols * pattern.cellSize}px` },
                { label: 'Rotation', val: `${pattern.rotation}°` },
              ].map(({ label, val }) => (
                <div key={label}>
                  <div style={{ color: ACCENT, fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>{val}</div>
                  <div style={{ color: 'var(--text-3)', fontSize: 9, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ---- PREVIEW ---- */}
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--surface0)', overflow: 'hidden', position: 'relative',
          }} ref={previewRef}>

            {/* Background grid dots */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }} />

            <div style={{
              transform: `rotate(${pattern.rotation}deg)`,
              transformOrigin: 'center',
              transition: 'transform 0.1s ease',
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${pattern.cols}, ${pattern.cellSize}px)`,
                gridTemplateRows: `repeat(${pattern.rows}, ${pattern.cellSize}px)`,
                gap: `${pattern.gap}px`,
                boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
              }}>
                {pattern.colors.map((color, idx) => (
                  <div
                    key={idx}
                    className="grid-cell"
                    style={{
                      width: pattern.cellSize,
                      height: pattern.cellSize,
                      backgroundColor: color,
                      borderRadius: `${pattern.borderRadius}%`,
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Texture overlay in preview */}
                    {pattern.textureEnabled && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        backgroundImage: `url(${BASE}textures/battenburg.png)`,
                        backgroundSize: '20px 20px',
                        backgroundRepeat: 'repeat',
                        opacity: pattern.textureOpacity / 100,
                        mixBlendMode: 'overlay',
                      }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced color picker modal */}
      {showAdvancedColorPicker && selectedCellIndex !== null && (
        <div
          className="modal-enter"
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
          }}
          onClick={e => { if (e.target === e.currentTarget) { setShowAdvancedColorPicker(false); setSelectedCellIndex(null); } }}
        >
          <div style={{
            background: 'var(--surface1)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: 20,
            width: 300,
            boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 5,
                  backgroundColor: pattern.colors[selectedCellIndex],
                  border: '1px solid rgba(255,255,255,0.15)',
                }} />
                <span style={{ color: 'var(--text-1)', fontSize: 13, fontWeight: 700 }}>
                  Cell {selectedCellIndex + 1}
                </span>
              </div>
              <button
                onClick={() => { setShowAdvancedColorPicker(false); setSelectedCellIndex(null); }}
                style={{
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  borderRadius: 6, padding: '4px 8px', cursor: 'pointer',
                  color: 'var(--text-2)', transition: 'all 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-1)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}
              >
                <X size={14} />
              </button>
            </div>
            <ColorPicker
              color={pattern.colors[selectedCellIndex]}
              onChange={c => updateCellColor(selectedCellIndex, c)}
            />
            <button
              style={{
                marginTop: 14, width: '100%', padding: '8px',
                borderRadius: 8, border: '1px solid rgba(216,255,99,0.3)',
                background: 'rgba(216,255,99,0.08)', color: ACCENT,
                fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(216,255,99,0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(216,255,99,0.08)'; }}
              onClick={() => { setShowAdvancedColorPicker(false); setSelectedCellIndex(null); }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}