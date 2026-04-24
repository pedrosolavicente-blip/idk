import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Download, Copy, Grid3x3, Palette, Layers, ChevronDown } from 'lucide-react';
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
  { id: 'none', name: 'None', url: '' },
  { id: 'grid', name: 'Grid', url: '/textures/grid.png' },
  { id: 'dots', name: 'Dots', url: '/textures/dots.png' },
  { id: 'lines', name: 'Lines', url: '/textures/lines.png' },
  { id: 'chevron', name: 'Chevron', url: '/textures/chevron.png' },
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
  }, []);

  const exportAsPNG = useCallback(() => {
    // TODO: Implement PNG export
    console.log('Export as PNG');
  }, []);

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
        .bg-container {
          background: var(--surface0);
          color: var(--text-1);
        }
        .control-panel {
          background: var(--surface1);
          border: 1px solid var(--border);
          border-radius: 12px;
        }
        .preview-panel {
          background: var(--surface1);
          border: 1px solid var(--border);
          border-radius: 12px;
        }
        .section-title {
          color: var(--text-1);
          font-weight: 600;
          font-size: 13px;
          letter-spacing: 0.04em;
          margin-bottom: 16px;
        }
        .control-label {
          color: var(--text-2);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.02em;
          margin-bottom: 8px;
        }
        .size-btn {
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.04em;
          border: 1px solid var(--border);
          background: var(--surface2);
          color: var(--text-3);
          cursor: pointer;
          transition: all 0.13s ease;
        }
        .size-btn:hover {
          border-color: rgba(216,255,99,0.2);
          color: var(--text-2);
        }
        .size-btn.active {
          border-color: rgba(216,255,99,0.3);
          background: rgba(216,255,99,0.08);
          color: #D8FF63;
          box-shadow: 0 0 12px rgba(216,255,99,0.08);
        }
        .export-btn {
          width: 100%;
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.04em;
          border: 1px solid var(--border);
          cursor: pointer;
          transition: all 0.13s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .export-btn.primary {
          background: rgba(216,255,99,0.1);
          border-color: rgba(216,255,99,0.3);
          color: #D8FF63;
        }
        .export-btn.primary:hover {
          background: rgba(216,255,99,0.15);
          border-color: rgba(216,255,99,0.4);
          box-shadow: 0 0 16px rgba(216,255,99,0.15);
        }
        .export-btn.secondary {
          background: var(--surface2);
          color: var(--text-2);
        }
        .export-btn.secondary:hover {
          background: var(--surface3);
          border-color: rgba(216,255,99,0.2);
          color: var(--text-1);
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
          gap: 4px;
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
          transition: all 0.13s ease;
          position: relative;
        }
        .color-cell-btn:hover {
          border-color: rgba(216,255,99,0.3);
          transform: scale(1.05);
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
        <div className="container mx-auto px-8 py-12">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-white mb-4" style={{ color: 'var(--text-1)' }}>Battenburg Generator</h1>
              <p className="text-lg text-zinc-400" style={{ color: 'var(--text-2)' }}>Create custom battenburg patterns for emergency vehicles</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Controls Panel */}
              <div className="space-y-6">
                {/* Pattern Settings */}
                <div className="control-panel p-6">
                  <h3 className="section-title">Pattern Settings</h3>
                  
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

                  {/* Size Presets */}
                  <div className="mb-6">
                    <div className="control-label">Size</div>
                    <div className="grid grid-cols-5 gap-2">
                      {PRESET_SIZES.map(size => (
                        <button
                          key={size.label}
                          onClick={() => updatePatternSize(size.rows, size.cols)}
                          className={`size-btn ${pattern.rows === size.rows && pattern.cols === size.cols ? 'active' : ''}`}
                        >
                          {size.label}
                        </button>
                      ))}
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
                    <div className="space-y-4">
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
                    <div className="space-y-4">
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
                            className="color-cell-btn"
                            style={{ backgroundColor: color }}
                            onClick={() => {
                              // TODO: Open color picker for individual cell
                              console.log('Pick color for cell', index);
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Texture Settings */}
                <div className="control-panel p-6">
                  <h3 className="section-title">Texture Overlay</h3>
                  
                  <div className="relative">
                    <button
                      onClick={() => setShowTextureDropdown(!showTextureDropdown)}
                      className="export-btn secondary"
                    >
                      <Layers size={16} />
                      {DEFAULT_TEXTURES.find(t => t.id === pattern.texture)?.name || 'None'}
                      <ChevronDown size={14} className={`transition-transform ${showTextureDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showTextureDropdown && (
                      <div className="texture-dropdown">
                        {DEFAULT_TEXTURES.map(texture => (
                          <div
                            key={texture.id}
                            className="texture-option"
                            onClick={() => {
                              setPattern({...pattern, texture: texture.id});
                              setShowTextureDropdown(false);
                            }}
                          >
                            {texture.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Export Options */}
                <div className="control-panel p-6">
                  <h3 className="section-title">Export Options</h3>
                  <div className="space-y-3">
                    <button onClick={exportAsPNG} className="export-btn primary">
                      <Download size={16} />
                      Download as PNG
                    </button>
                    <button onClick={exportAsSVG} className="export-btn secondary">
                      <Download size={16} />
                      Download as SVG
                    </button>
                    <button onClick={copyCSSCode} className="export-btn secondary">
                      <Copy size={16} />
                      Copy CSS Code
                    </button>
                  </div>
                </div>
              </div>

              {/* Preview Panel */}
              <div className="preview-panel p-6">
                <h3 className="section-title">Preview</h3>
                <div className="flex items-center justify-center min-h-[400px] rounded-lg" style={{ background: 'var(--surface0)' }}>
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
        </div>
      </div>
    </>
  );
}
