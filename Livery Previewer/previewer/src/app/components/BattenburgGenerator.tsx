import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Layers, Sliders, Palette, Grid, X, ChevronUp, ChevronDown } from 'lucide-react';
import ColorPicker from './ColorPicker';

const ACCENT = '#D8FF63';
const BASE = (import.meta as any).env?.BASE_URL || '';

const LIVERY_IMAGES = [
  `${BASE}Rectangle_38.png`,
  `${BASE}Rectangle_38 (1).png`,
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

export default function BattenburgGenerator() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'basic' | 'advanced'>('basic');
  const [activeLivery, setActiveLivery] = useState(0);
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
  const textureImgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { textureImgRef.current = img; };
    img.onerror = () => {
      const c = document.createElement('canvas');
      c.width = 16; c.height = 16;
      const ctx = c.getContext('2d')!;
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.moveTo(8,0); ctx.lineTo(16,16); ctx.lineTo(0,16); ctx.closePath(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(16,0); ctx.lineTo(8,16); ctx.closePath(); ctx.stroke();
      const fb = new Image();
      fb.onload = () => { textureImgRef.current = fb; };
      fb.src = c.toDataURL();
    };
    img.src = `${BASE}textures/battenburg.png`;
  }, []);

  const generateColors = useCallback((rows: number, cols: number, c1: string, c2: string): string[] => {
    const out: string[] = [];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        out.push((r + c) % 2 === 0 ? c1 : c2);
    return out;
  }, []);

  const updateSize = useCallback((rows: number, cols: number) => {
    const r = Math.max(1, Math.min(12, rows));
    const c = Math.max(1, Math.min(16, cols));
    setPattern(prev => ({
      ...prev, rows: r, cols: c,
      colors: generateColors(r, c, prev.colors[0] || '#C4FF0D', prev.colors[1] || '#006B2B'),
    }));
  }, [generateColors]);

  const updateBasicColors = useCallback((c1: string, c2: string) => {
    setPattern(prev => ({ ...prev, colors: generateColors(prev.rows, prev.cols, c1, c2) }));
  }, [generateColors]);

  const updateCellColor = useCallback((index: number, color: string) => {
    setPattern(prev => {
      const next = [...prev.colors];
      next[index] = color;
      return { ...prev, colors: next };
    });
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
        ctx.save(); ctx.clip();
        ctx.globalAlpha = textureOpacity / 100;
        const tSize = 16;
        for (let ty = y; ty < y + cellHeight; ty += tSize)
          for (let tx = x; tx < x + cellWidth; tx += tSize)
            ctx.drawImage(textureImgRef.current, tx, ty, tSize, tSize);
        ctx.globalAlpha = 1; ctx.restore();
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
        .mode-btn.active { background: rgba(216,255,99,0.1); border-color: rgba(216,255,99,0.35); color: #D8FF63; }

        .section-card { background: var(--surface1); border: 1px solid var(--border); border-radius: 12px; padding: 16px; margin-bottom: 10px; }

        .section-title { color: var(--text-1); font-weight: 700; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }

        .export-btn {
          width: 100%; padding: 10px 14px; border-radius: 8px; font-size: 10px; font-weight: 700;
          letter-spacing: 0.06em; text-transform: uppercase;
          border: 1px solid rgba(216,255,99,0.3); background: rgba(216,255,99,0.08); color: #D8FF63;
          cursor: pointer; transition: all 0.15s; display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .export-btn:hover { background: rgba(216,255,99,0.15); border-color: rgba(216,255,99,0.5); box-shadow: 0 0 24px rgba(216,255,99,0.2); transform: translateY(-1px); }

        .livery-tab {
          flex: 1; padding: 6px 8px; border-radius: 8px; font-size: 9px; font-weight: 700;
          letter-spacing: 0.05em; text-transform: uppercase; border: 1px solid var(--border);
          background: var(--surface2); color: var(--text-3); cursor: pointer; transition: all 0.15s;
        }
        .livery-tab.active { background: rgba(216,255,99,0.08); border-color: rgba(216,255,99,0.3); color: #D8FF63; }

        .preset-btn {
          padding: 5px 4px; border-radius: 6px; font-size: 9px; font-weight: 700;
          border: 1px solid var(--border); background: var(--surface2); color: var(--text-3);
          cursor: pointer; transition: all 0.15s; text-align: center;
        }
        .preset-btn:hover { border-color: rgba(216,255,99,0.3); color: var(--text-1); }
        .preset-btn.active { background: rgba(216,255,99,0.12); border-color: rgba(216,255,99,0.4); color: #D8FF63; }

        .color-cell-btn {
          aspect-ratio: 1; border: 2px solid rgba(255,255,255,0.1); border-radius: 5px; cursor: pointer; transition: all 0.15s;
        }
        .color-cell-btn:hover { border-color: rgba(216,255,99,0.5); transform: scale(1.08); }
        .color-cell-btn.selected { border-color: #D8FF63; box-shadow: 0 0 12px rgba(216,255,99,0.5); }

        .toggle-track { width: 36px; height: 20px; border-radius: 99px; border: 1px solid var(--border); cursor: pointer; transition: all 0.2s; position: relative; flex-shrink: 0; }
        .toggle-thumb { position: absolute; top: 2px; width: 14px; height: 14px; border-radius: 50%; transition: transform 0.2s, background 0.2s; box-shadow: 0 1px 4px rgba(0,0,0,0.4); }

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

            {/* GRID SIZE */}
            <div className="section-card">
              <div className="section-title"><Grid size={13} style={{ color: ACCENT }} />Grid Size</div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ color: 'var(--text-3)', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 8 }}>PRESETS</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
                  {PRESETS.map(({ r, c }) => (
                    <button key={`${r}x${c}`}
                      className={`preset-btn ${pattern.rows === r && pattern.cols === c ? 'active' : ''}`}
                      onClick={() => updateSize(r, c)}>{r}×{c}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Stepper label="ROWS" value={pattern.rows} min={1} max={12} onChange={v => updateSize(v, pattern.cols)} />
                <Stepper label="COLS" value={pattern.cols} min={1} max={16} onChange={v => updateSize(pattern.rows, v)} />
              </div>
            </div>

            {/* CELL DIMENSIONS */}
            <div className="section-card">
              <div className="section-title"><Sliders size={13} style={{ color: ACCENT }} />Cell Dimensions</div>
              <SliderControl label="Cell Width" value={pattern.cellWidth} min={20} max={200} unit="px" onChange={v => setPattern(p => ({ ...p, cellWidth: v }))} />
              <SliderControl label="Cell Height" value={pattern.cellHeight} min={20} max={200} unit="px" onChange={v => setPattern(p => ({ ...p, cellHeight: v }))} />
              <SliderControl label="Gap" value={pattern.gap} min={0} max={20} unit="px" onChange={v => setPattern(p => ({ ...p, gap: v }))} />
              <SliderControl label="Border Radius" value={pattern.borderRadius} min={0} max={50} unit="%" onChange={v => setPattern(p => ({ ...p, borderRadius: v }))} />
            </div>

            {/* COLORS */}
            <div className="section-card">
              <div className="section-title"><Palette size={13} style={{ color: ACCENT }} />Colors</div>
              {mode === 'basic' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <div style={{ color: 'var(--text-3)', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 8 }}>COLOR A</div>
                    <ColorPicker color={color1} onChange={c => updateBasicColors(c, color2)} />
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-3)', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 8 }}>COLOR B</div>
                    <ColorPicker color={color2} onChange={c => updateBasicColors(color1, c)} />
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ color: 'var(--text-3)', fontSize: 10, marginBottom: 10 }}>Click a cell to change its color.</div>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(pattern.cols, 8)}, 1fr)`, gap: 3, padding: 10, background: 'var(--surface2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    {pattern.colors.map((color, idx) => (
                      <button key={idx}
                        className={`color-cell-btn ${selectedCellIndex === idx ? 'selected' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => { setSelectedCellIndex(idx); setShowAdvancedColorPicker(true); }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* TEXTURE */}
            <div className="section-card">
              <div className="section-title"><Layers size={13} style={{ color: ACCENT }} />Texture Overlay</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: pattern.textureEnabled ? 14 : 0 }}>
                <span style={{ color: 'var(--text-2)', fontSize: 11 }}>Battenburg texture</span>
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
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface0)', overflow: 'hidden', position: 'relative' }}>
            {/* Dot grid bg */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

            {/* Composite: livery + pattern */}
            <div style={{
              position: 'relative',
              width: totalW, height: totalH,
              boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
              borderRadius: 4, overflow: 'hidden',
            }}>
              {/* Base livery */}
              <img
                src={LIVERY_IMAGES[activeLivery]}
                alt="livery"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />

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
                    }}>
                      {pattern.textureEnabled && (
                        <div style={{
                          position: 'absolute', inset: 0,
                          backgroundImage: `url(${BASE}textures/battenburg.png)`,
                          backgroundSize: '16px 16px', backgroundRepeat: 'repeat',
                          opacity: pattern.textureOpacity / 100,
                          mixBlendMode: 'overlay',
                        }} />
                      )}
                    </div>
                  );
                })}
              </div>
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