import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Copy, Layers, ChevronDown, Sliders, Palette } from 'lucide-react';
import ColorPicker from './ColorPicker';

const ACCENT = '#D8FF63';
const BASE = (import.meta as any).env?.BASE_URL || '';

interface BattenburgPattern {
  rows: number;
  cols: number;
  colors: string[];
  cellSize: number;
  rotation: number;
  texture?: string;
}

const DEFAULT_TEXTURES = [
  { id: 'battenburg', name: 'Battenburg', url: `${BASE}textures/battenburg.png` },
];

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
  const [mode, setMode] = useState<'basic' | 'advanced'>('basic');
  const [pattern, setPattern] = useState<BattenburgPattern>({
    rows: 2,
    cols: 7,
    colors: ['#ff6b6b', '#ffffff'],
    cellSize: 50,
    rotation: 0,
    texture: 'none'
  });
  const [showTextureDropdown, setShowTextureDropdown] = useState(false);
  const [selectedCellIndex, setSelectedCellIndex] = useState<number | null>(null);
  const [showAdvancedColorPicker, setShowAdvancedColorPicker] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const generateBattenburgColors = useCallback((rows: number, cols: number, color1: string, color2: string): string[] => {
    const colors: string[] = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        colors.push((row + col) % 2 === 0 ? color1 : color2);
      }
    }
    return colors;
  }, []);

  const updatePatternSize = useCallback((rows: number, cols: number) => {
    if (mode === 'basic') {
      setPattern(prev => ({
        ...prev,
        rows,
        cols,
        colors: generateBattenburgColors(rows, cols, prev.colors[0] || '#ff6b6b', prev.colors[1] || '#ffffff')
      }));
    } else {
      setPattern(prev => ({
        ...prev,
        rows,
        cols,
        colors: generateBattenburgColors(rows, cols, prev.colors[0] || '#ff6b6b', prev.colors[1] || '#ffffff')
      }));
    }
  }, [mode, generateBattenburgColors]);

  const updateBasicColors = useCallback((color1: string, color2: string) => {
    setPattern(prev => ({
      ...prev,
      colors: generateBattenburgColors(prev.rows, prev.cols, color1, color2)
    }));
  }, [generateBattenburgColors]);

  const updateIndividualColor = useCallback((index: number, color: string) => {
    setPattern(prev => {
      const newColors = [...prev.colors];
      newColors[index] = color;
      return { ...prev, colors: newColors };
    });
    setSelectedCellIndex(null);
    setShowAdvancedColorPicker(false);
  }, []);

  const exportAsPNG = useCallback(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = pattern.cellSize;
    const totalWidth = pattern.cols * cellSize;
    const totalHeight = pattern.rows * cellSize;
    
    canvas.width = totalWidth;
    canvas.height = totalHeight;

    // Save context state
    ctx.save();
    
    // Apply rotation
    ctx.translate(totalWidth / 2, totalHeight / 2);
    ctx.rotate((pattern.rotation * Math.PI) / 180);
    ctx.translate(-totalWidth / 2, -totalHeight / 2);

    // Draw battenburg pattern
    pattern.colors.forEach((color, index) => {
      const row = Math.floor(index / pattern.cols);
      const col = index % pattern.cols;
      const x = col * cellSize;
      const y = row * cellSize;
      
      // Draw base color
      ctx.fillStyle = color;
      ctx.fillRect(x, y, cellSize, cellSize);
      
      // Apply texture overlay if selected
      if (pattern.texture === 'battenburg') {
        const texture = DEFAULT_TEXTURES.find(t => t.id === pattern.texture);
        if (texture?.url) {
          const img = new Image();
          img.onload = () => {
            ctx.globalAlpha = 0.5;
            ctx.drawImage(img, x, y, cellSize, cellSize);
            ctx.globalAlpha = 1.0;
            
            // Download when all textures are loaded
            canvas.toBlob((blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `battenburg-${pattern.rows}x${pattern.cols}.png`;
                a.click();
                URL.revokeObjectURL(url);
              }
            }, 'image/png');
          };
          img.src = texture.url;
        }
      }
    });
    
    // Restore context state
    ctx.restore();
  }, [pattern]);

  const exportAsSVG = useCallback(() => {
    // TODO: Implement SVG export
    console.log('Export as SVG');
  }, []);

  const copyCSSCode = useCallback(() => {
    // TODO: Implement CSS export
    console.log('Copy CSS code');
  }, []);

  return (
    <>
      <style>{`
        *, *::before, *::after { font-family: 'Inter', sans-serif !important; }

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
          --text-4: #3f3f46;
        }

        .lv-sidebar::-webkit-scrollbar       { width: 2px; }
        .lv-sidebar::-webkit-scrollbar-track { background: transparent; }
        .lv-sidebar::-webkit-scrollbar-thumb { background: rgba(216,255,99,0.2); border-radius: 99px; }
        .lv-sidebar::-webkit-scrollbar-thumb:hover { background: rgba(216,255,99,0.45); }

        .lv-range {
          -webkit-appearance: none;
          appearance: none;
          height: 4px;
          border-radius: 99px;
          outline: none;
          cursor: pointer;
        }
        .lv-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px; height: 14px;
          border-radius: 50%;
          background: var(--accent);
          border: 2px solid #080808;
          box-shadow: 0 0 8px rgba(216,255,99,0.5);
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .lv-range::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 14px rgba(216,255,99,0.7);
        }

        .nav-item {
          display: flex; align-items: center; gap: 6px;
          padding: 0 14px;
          height: 32px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.04em;
          border: 1px solid var(--border);
          background: var(--surface1);
          color: var(--text-3);
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
        }
        .nav-item:hover { border-color: rgba(216,255,99,0.2); color: var(--text-2); }
        .nav-item.active { border-color: rgba(216,255,99,0.3); background: rgba(216,255,99,0.08); color: #D8FF63; box-shadow: 0 0 12px rgba(216,255,99,0.08); }

        .size-btn {
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.04em;
          border: 1px solid var(--border);
          background: var(--surface2);
          color: var(--text-3);
          cursor: pointer;
          transition: all 0.15s ease;
          position: relative;
          overflow: hidden;
        }
        .size-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(216,255,99,0.2), transparent);
          transition: left 0.5s ease;
        }
        .size-btn:hover::before {
          left: 100%;
        }
        .size-btn:hover { 
          border-color: rgba(216,255,99,0.3); 
          color: var(--text-2); 
          background: linear-gradient(135deg, rgba(216,255,99,0.05), rgba(216,255,99,0.02)); 
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(216,255,99,0.15);
        }
        .size-btn.active {
          background: #D8FF63;
          border-color: #D8FF63;
          color: #000;
          box-shadow: 0 0 16px rgba(216,255,99,0.4), inset 0 0 0 1px rgba(255,255,255,0.2);
        }
        .size-btn.active::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%);
          border-radius: 6px;
        }

        .control-section {
          background: var(--surface1);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 16px;
        }

        .section-title {
          color: var(--text-1);
          font-weight: 600;
          font-size: 13px;
          letter-spacing: 0.04em;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .control-label {
          color: var(--text-2);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.02em;
          margin-bottom: 8px;
        }

        .export-btn {
          width: 100%;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.04em;
          border: 1px solid var(--border);
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          position: relative;
          overflow: hidden;
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
        .export-btn.primary {
          background: rgba(216,255,99,0.1);
          border-color: rgba(216,255,99,0.3);
          color: #D8FF63;
        }
        .export-btn.primary:hover {
          background: rgba(216,255,99,0.15);
          border-color: rgba(216,255,99,0.4);
          box-shadow: 0 0 20px rgba(216,255,99,0.2);
          transform: translateY(-1px);
        }
        .export-btn.secondary {
          background: var(--surface2);
          color: var(--text-2);
        }
        .export-btn.secondary:hover {
          background: var(--surface3);
          border-color: rgba(216,255,99,0.2);
          color: var(--text-1);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          transform: translateY(-1px);
        }

        .texture-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          margin-top: 4px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 8px;
          z-index: 50;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }
        .texture-option {
          padding: 8px 12px;
          font-size: 11px;
          color: var(--text-2);
          cursor: pointer;
          transition: all 0.13s ease;
          border-bottom: 1px solid var(--border);
        }
        .texture-option:last-child {
          border-bottom: none;
        }
        .texture-option:hover {
          background: var(--surface3);
          color: var(--text-1);
        }

        .individual-color-grid {
          display: grid;
          gap: 3px;
          padding: 12px;
          background: var(--surface2);
          border-radius: 8px;
          border: 1px solid var(--border);
        }
        .color-cell-btn {
          aspect-ratio: 1;
          border: 2px solid var(--border);
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.15s ease;
          position: relative;
          overflow: hidden;
        }
        .color-cell-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(216,255,99,0.3), transparent);
          transition: left 0.4s ease;
        }
        .color-cell-btn:hover::before {
          left: 100%;
        }
        .color-cell-btn:hover {
          border-color: rgba(216,255,99,0.3);
          transform: scale(1.05);
          box-shadow: 0 0 12px rgba(216,255,99,0.2);
        }
        .color-cell-btn.selected {
          border-color: var(--accent);
          box-shadow: 0 0 10px rgba(216,255,99,0.4), inset 0 0 0 1px rgba(255,255,255,0.2);
        }

        .main-preview {
          background: var(--surface0);
          border: 1px solid var(--border);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 500px;
          position: relative;
        }

        .controls-sidebar {
          width: 320px;
          background: var(--surface1);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 20px;
          height: fit-content;
        }
      `}</style>
      
      <div className="min-h-screen bg-container">
        {/* Shared Navbar */}
        <nav className="relative z-50 flex items-center justify-between px-8 transition-all duration-300"
          style={{
            paddingTop: '10px',
            paddingBottom: '10px',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.9) 100%)',
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.8), 0 1px 0 0 rgba(196,255,13,0.03), inset 0 1px 0 0 rgba(255,255,255,0.05)',
          }}
        >
          <img src={`${BASE}itzz.svg`} alt="itzz" className="h-7 w-auto cursor-pointer transition-transform hover:scale-105"
            onClick={() => navigate('/')} />
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/tools')}
              className="text-[10px] font-bold tracking-widest uppercase px-4 py-2.5 rounded-lg transition-all duration-300 relative overflow-hidden group"
              style={{
                color: '#a1a1aa',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <span className="relative z-10">Back to Tools</span>
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <div className="flex h-screen pt-16" style={{ background: 'var(--surface0)' }}>
          {/* Controls Sidebar */}
          <div className="controls-sidebar lv-sidebar overflow-y-auto">
            <h3 className="section-title">
              <Sliders size={16} />
              Pattern Settings
            </h3>
            
            {/* Mode Toggle */}
            <div className="flex gap-1.5 mb-6">
              {(['basic','advanced'] as const).map(m => (
                <button key={m} onClick={() => setMode(m)}
                  className="size-btn flex-1"
                  style={{
                    background: mode === m ? 'rgba(216,255,99,0.1)' : 'var(--surface2)',
                    borderColor: mode === m ? 'rgba(216,255,99,0.3)' : 'var(--border)',
                    color: mode === m ? '#D8FF63' : 'var(--text-3)',
                  }}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>

            {/* Size Selector - Compact & Innovative */}
            <div className="mb-6">
              <div className="control-label mb-3">Pattern Size</div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: 'var(--text-3)' }}>Rows:</span>
                  <input
                    type="number"
                    min="2"
                    max="8"
                    value={pattern.rows}
                    onChange={(e) => updatePatternSize(parseInt(e.target.value), pattern.cols)}
                    className="w-16 px-2 py-1 text-xs rounded"
                    style={{
                      background: 'var(--surface2)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-1)',
                    }}
                  />
                </div>
                <div className="text-lg" style={{ color: 'var(--accent)' }}>×</div>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: 'var(--text-3)' }}>Cols:</span>
                  <input
                    type="number"
                    min="2"
                    max="8"
                    value={pattern.cols}
                    onChange={(e) => updatePatternSize(pattern.rows, parseInt(e.target.value))}
                    className="w-16 px-2 py-1 text-xs rounded"
                    style={{
                      background: 'var(--surface2)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-1)',
                    }}
                  />
                </div>
                <div className="flex-1" />
                <div className="text-xs font-mono px-2 py-1 rounded" style={{
                  background: 'rgba(216,255,99,0.1)',
                  color: '#D8FF63',
                  border: '1px solid rgba(216,255,99,0.3)',
                }}>
                  {pattern.rows}×{pattern.cols}
                </div>
              </div>
            </div>

            {/* Cell Size */}
            <div className="mb-6">
              <div className="control-label">Cell Size: {pattern.cellSize}px</div>
              <input
                type="range"
                min="20"
                max="100"
                value={pattern.cellSize}
                onChange={(e) => setPattern({...pattern, cellSize: parseInt(e.target.value)})}
                className="lv-range w-full"
                style={{
                  background: 'linear-gradient(to right, var(--surface3) 0%, var(--surface3) 100%)',
                }}
              />
            </div>

            {/* Rotation */}
            <div className="mb-6">
              <div className="control-label">Rotation: {pattern.rotation}°</div>
              <input
                type="range"
                min="0"
                max="360"
                value={pattern.rotation}
                onChange={(e) => setPattern({...pattern, rotation: parseInt(e.target.value)})}
                className="lv-range w-full"
                style={{
                  background: 'linear-gradient(to right, var(--surface3) 0%, var(--surface3) 100%)',
                }}
              />
            </div>

            {/* Colors Section */}
            {mode === 'basic' ? (
              <div className="space-y-4 mb-6">
                <div className="control-label">Colors</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <ColorPicker
                      color={pattern.colors[0] || '#ff6b6b'}
                      onChange={(color) => updateBasicColors(color, pattern.colors[1] || '#ffffff')}
                    />
                    <div className="text-xs mt-2" style={{ color: 'var(--text-3)' }}>Color 1</div>
                  </div>
                  <div>
                    <ColorPicker
                      color={pattern.colors[1] || '#ffffff'}
                      onChange={(color) => updateBasicColors(pattern.colors[0] || '#ff6b6b', color)}
                    />
                    <div className="text-xs mt-2" style={{ color: 'var(--text-3)' }}>Color 2</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                <div className="control-label">Individual Colors</div>
                <div 
                  className="individual-color-grid"
                  style={{
                    gridTemplateColumns: `repeat(${pattern.cols}, 1fr)`,
                  }}
                >
                  {pattern.colors.map((color, index) => (
                    <button
                      key={index}
                      className={`color-cell-btn ${selectedCellIndex === index ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        setSelectedCellIndex(index);
                        setShowAdvancedColorPicker(true);
                      }}
                    />
                  ))}
                </div>
                
                {/* Advanced Color Picker Modal */}
                {showAdvancedColorPicker && selectedCellIndex !== null && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
                    <div className="control-section" style={{ width: '320px' }}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="section-title" style={{ margin: 0 }}>
                          <Palette size={16} />
                          Cell Color
                        </div>
                        <button
                          onClick={() => {
                            setShowAdvancedColorPicker(false);
                            setSelectedCellIndex(null);
                          }}
                          className="size-btn"
                          style={{ padding: '4px 8px' }}
                        >
                          ×
                        </button>
                      </div>
                      <ColorPicker
                        color={pattern.colors[selectedCellIndex]}
                        onChange={(color) => updateIndividualColor(selectedCellIndex, color)}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Texture Settings */}
            <div className="control-section mb-6">
              <h3 className="section-title">
                <Layers size={16} />
                Texture Overlay
              </h3>
              
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pattern.texture === 'battenburg'}
                    onChange={(e) => setPattern({...pattern, texture: e.target.checked ? 'battenburg' : 'none'})}
                    className="sr-only"
                  />
                  <div className="w-10 h-6 rounded-full transition-colors duration-200 ease-in-out" style={{
                    background: pattern.texture === 'battenburg' ? 'rgba(216,255,99,0.2)' : 'var(--surface2)',
                    border: '1px solid var(--border)',
                  }}>
                    <div className="w-4 h-4 rounded-full bg-white transition-transform duration-200 ease-in-out" style={{
                      transform: pattern.texture === 'battenburg' ? 'translateX(16px)' : 'translateX(2px)',
                      boxShadow: '0 0 4px rgba(0,0,0,0.3)',
                    }} />
                  </div>
                </label>
                <span className="text-xs" style={{ color: 'var(--text-2)' }}>Apply battenburg texture</span>
              </div>
            </div>

            {/* Export Options */}
            <div className="control-section">
              <h3 className="section-title">Export</h3>
              <div className="space-y-2">
                <button onClick={exportAsPNG} className="export-btn primary">
                  <Download size={16} />
                  Download as PNG
                </button>
              </div>
            </div>
          </div>

          {/* Main Preview Area */}
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="main-preview w-full h-full" ref={canvasRef}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${pattern.cols}, ${pattern.cellSize}px)`,
                  gridTemplateRows: `repeat(${pattern.rows}, ${pattern.cellSize}px)`,
                  transform: `rotate(${pattern.rotation}deg)`,
                  transformOrigin: 'center',
                  border: '2px solid var(--border)',
                  position: 'relative',
                }}
              >
                {pattern.colors.map((color, index) => {
                  const texture = DEFAULT_TEXTURES.find(t => t.id === pattern.texture);
                  return (
                    <div
                      key={index}
                      style={{
                        backgroundColor: color,
                        width: `${pattern.cellSize}px`,
                        height: `${pattern.cellSize}px`,
                        border: '1px solid rgba(0,0,0,0.1)',
                        backgroundImage: texture?.url ? `url(${texture.url})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        position: 'relative',
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
