import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Copy, Grid, Sliders, Palette, Plus, Minus, X } from 'lucide-react';

const ACCENT = '#D8FF63';
const BASE = import.meta.env?.BASE_URL || '';

export default function BattenburgGenerator() {
  const navigate = useNavigate();
  
  // Pattern state
  const [rows, setRows] = useState(2);
  const [cols, setCols] = useState(7);
  const [cellWidth, setCellWidth] = useState(90);
  const [cellHeight, setCellHeight] = useState(60);
  const [gap, setGap] = useState(0);
  const [borderRadius, setBorderRadius] = useState(0);
  const [colour1, setColour1] = useState('#C4FF0D');
  const [colour2, setColour2] = useState('#006B2B');
  const [showAdvancedColourPicker, setShowAdvancedColourPicker] = useState(false);
  const [selectedColourIndex, setSelectedColourIndex] = useState<number | null>(null);
  const [individualColours, setIndividualColours] = useState<string[]>([]);
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [textureEnabled, setTextureEnabled] = useState(false);
  const [textureOpacity, setTextureOpacity] = useState(40);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Texture image ref
  const textureRef = useRef<HTMLImageElement | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Generate pattern colours
  const generatePattern = () => {
    const colours = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        colours.push((r + c) % 2 === 0 ? colour1 : colour2);
      }
    }
    return colours;
  };

  // Update individual colours when pattern changes
  useEffect(() => {
    if (individualColours.length === 0) {
      setIndividualColours(generatePattern());
    }
  }, [rows, cols, colour1, colour2]);

  // Update pattern when individual colours change
  useEffect(() => {
    if (individualColours.length > 0) {
      // Update pattern to use individual colours
    }
  }, [individualColours]);

  // Update pattern size
  const updateSize = useCallback((newRows: number, newCols: number) => {
    setRows(Math.max(1, Math.min(12, newRows)));
    setCols(Math.max(1, Math.min(16, newCols)));
    // Reset individual colours when pattern size changes
    setIndividualColours([]);
  }, []);

  const patternColours = individualColours.length > 0 ? individualColours : generatePattern();

  // Load texture
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      textureRef.current = img;
    };
    img.src = `${BASE}waves.png`;
  }, []);

  // Mouse wheel zoom
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        setZoomLevel(prev => Math.min(prev + 0.1, 5));
      } else {
        setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
      }
    };

    const element = previewRef.current;
    if (element) {
      element.addEventListener('wheel', handleWheel, { passive: false });
      return () => element.removeEventListener('wheel', handleWheel);
    }
  }, []);

  // Export as PNG
  const exportPNG = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const totalWidth = cols * (cellWidth + gap) - gap;
    const totalHeight = rows * (cellHeight + gap) - gap;
    
    canvas.width = totalWidth;
    canvas.height = totalHeight;

    // Draw pattern
    patternColours.forEach((colour, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const x = col * (cellWidth + gap);
      const y = row * (cellHeight + gap);
      
      ctx.fillStyle = colour;
      if (borderRadius > 0) {
        const radius = (borderRadius / 100) * Math.min(cellWidth, cellHeight);
        ctx.beginPath();
        ctx.roundRect(x, y, cellWidth, cellHeight, radius);
        ctx.fill();
      } else {
        ctx.fillRect(x, y, cellWidth, cellHeight);
      }
      
      // Apply texture
      if (textureEnabled && textureRef.current) {
        ctx.save();
        ctx.globalAlpha = textureOpacity / 100;
        ctx.drawImage(textureRef.current, x, y, cellWidth, cellHeight);
        ctx.restore();
      }
    });

    // Download
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `battenburg-${rows}x${cols}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  // Update individual colour
  const updateIndividualColour = (index: number, colour: string) => {
    const newColours = [...individualColours];
    if (newColours.length === 0) {
      // Initialize with generated pattern if not set
      newColours.push(...generatePattern());
    }
    newColours[index] = colour;
    setIndividualColours(newColours);
    setSelectedColourIndex(null);
    setShowAdvancedColourPicker(false);
  };
  const copyCSS = () => {
    const css = `.battenburg {
  display: grid;
  grid-template-columns: repeat(${cols}, ${cellWidth}px);
  grid-template-rows: repeat(${rows}, ${cellHeight}px);
  gap: ${gap}px;
}

.battenburg-cell {
  background: ${colour1};
  border-radius: ${borderRadius}px;
}

.battenburg-cell:nth-child(even) {
  background: ${colour2};
}`;
    
    navigator.clipboard.writeText(css);
    alert('CSS copied to clipboard!');
  };

  const totalWidth = cols * (cellWidth + gap) - gap;
  const totalHeight = rows * (cellHeight + gap) - gap;

  return (
    <div className="relative flex h-screen w-full bg-[#080808] text-white overflow-hidden">

      {/* ── Background layer ── */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <img
          src={`${BASE}Vector_(7).svg`}
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '92%',
            height: 'auto',
            opacity: 0.045,
            filter: 'brightness(0) invert(1)',
            pointerEvents: 'none',
          }}
        />
        <div className="absolute -top-32 -right-32 rounded-full" style={{ width: 700, height: 700, opacity: 0.2, background: 'radial-gradient(circle, #c4ff0d 0%, transparent 65%)' }} />
        <div className="absolute -bottom-24 -left-24 rounded-full" style={{ width: 500, height: 500, opacity: 0.12, background: 'radial-gradient(circle, #88ff00 0%, transparent 65%)' }} />
        <div className="absolute rounded-full" style={{ width: 620, height: 620, top: '50%', left: '58%', transform: 'translate(-50%,-50%)', opacity: 0.09, background: 'radial-gradient(circle, #c4ff0d 0%, transparent 60%)' }} />
        <div className="absolute rounded-full" style={{ width: 280, height: 280, top: '33%', left: '22%', opacity: 0.07, background: 'radial-gradient(circle, #aaff00 0%, transparent 70%)' }} />
      </div>
      <style>{`
        * { box-sizing: border-box; }
        
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 60px;
          background: linear-gradient(to bottom, rgba(0,0,0,0.97), rgba(0,0,0,0.92));
          backdrop-filter: blur(32px);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          z-index: 100;
        }
        
        .nav-title {
          color: #ffffff;
          font-size: 18px;
          font-weight: 700;
          margin: 0;
        }
        
        .nav-btn {
          padding: 8px 16px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: #a1a1aa;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .nav-btn:hover {
          color: #ffffff;
          border-color: rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.08);
        }
        
        .main-container {
          display: flex;
          height: 100vh;
          padding-top: 60px;
        }
        
        .sidebar {
          width: 320px;
          background: #0e0e0e;
          border-right: 1px solid rgba(255,255,255,0.07);
          padding: 20px;
          overflow-y: auto;
        }
        
        .section {
          background: #161616;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 16px;
        }
        
        .section-title {
          color: #ffffff;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .control-group {
          margin-bottom: 16px;
        }
        
        .control-label {
          color: #a1a1aa;
          font-size: 11px;
          font-weight: 500;
          margin-bottom: 8px;
          display: block;
        }
        
        .control-slider {
          width: 100%;
          height: 6px;
          background: #1e1e1e;
          border-radius: 3px;
          outline: none;
          cursor: pointer;
          -webkit-appearance: none;
          appearance: none;
        }
        
        .control-slider::-webkit-slider-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #1e1e1e;
          border: 2px solid rgba(255,255,255,0.1);
          cursor: pointer;
          box-shadow: none;
          transition: all 0.15s ease;
          -webkit-appearance: none;
        }
        
        .control-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #1e1e1e;
          border: 2px solid rgba(255,255,255,0.1);
          cursor: pointer;
          box-shadow: none;
          transition: all 0.15s ease;
        }
        
        .control-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 4px rgba(255,255,255,0.2);
          background: #2a2a2a;
        }
        
        .control-slider::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 4px rgba(255,255,255,0.2);
          background: #2a2a2a;
        }
        
        .btn {
          width: 100%;
          padding: 10px;
          background: rgba(216,255,99,0.08);
          border: 1px solid rgba(216,255,99,0.3);
          border-radius: 8px;
          color: ${ACCENT};
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          position: relative;
          overflow: hidden;
        }
        
        .btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(216,255,99,0.3), transparent);
          transition: left 0.6s ease;
        }
        
        .btn:hover {
          background: rgba(216,255,99,0.15);
          border-color: rgba(216,255,99,0.5);
          box-shadow: 0 4px 16px rgba(216,255,99,0.2);
        }
        
        .btn:hover::before {
          left: 100%;
        }
        
        .preview-area {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #080808;
          position: relative;
          overflow: hidden;
        }
        
        .preview-container {
          background: transparent;
          border: none;
          border-radius: 0;
          padding: 0;
          box-shadow: none;
          position: relative;
        }
        
        .pattern-grid {
          display: grid;
          grid-template-columns: repeat(${cols}, ${cellWidth}px);
          grid-template-rows: repeat(${rows}, ${cellHeight}px);
          gap: ${gap}px;
          transform: scale(${zoomLevel});
          transform-origin: center;
        }
        
        .pattern-cell {
          background: #1e1e1e;
          border: none;
          cursor: pointer;
          transition: none;
          position: relative;
          overflow: hidden;
        }
        
        .pattern-cell::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 6px;
          height: 6px;
          transform: translate(-50%, -50%);
          background: rgba(216,255,99,0.3);
          border-radius: 50%;
          backdrop-filter: blur(4px);
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        
        .pattern-cell:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 16px rgba(216,255,99,0.3);
        }
        
        .pattern-cell:hover::before {
          opacity: 1;
        }
        
        .texture-overlay {
          position: absolute;
          top: 0;
          left: 0;
          pointer-events: none;
          opacity: ${textureOpacity / 100};
          mix-blend-mode: multiply;
          background-image: url('${BASE}waves.png');
          background-size: cover;
          background-position: center;
          transform: scale(${zoomLevel});
          transform-origin: center;
        }
        
        .zoom-controls {
          position: absolute;
          bottom: 20px;
          right: 20px;
          display: flex;
          gap: 8px;
          background: #161616;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.07);
        }
        
        .zoom-btn {
          width: 36px;
          height: 36px;
          background: #1e1e1e;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 6px;
          color: #a1a1aa;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        
        .zoom-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(216,255,99,0.3), transparent);
          transition: left 0.6s ease;
        }
        
        .zoom-btn:hover {
          color: #ffffff;
          border-color: ${ACCENT};
          background: rgba(216,255,99,0.1);
        }
        
        .zoom-btn:hover::before {
          left: 100%;
        }
        
        .reset-zoom-btn {
          width: 36px;
          height: 36px;
          background: #1e1e1e;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 6px;
          color: #a1a1aa;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
          font-size: 10px;
          font-weight: 600;
        }
        
        .reset-zoom-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(216,255,99,0.3), transparent);
          transition: left 0.6s ease;
        }
        
        .reset-zoom-btn:hover {
          color: #ffffff;
          border-color: ${ACCENT};
          background: rgba(216,255,99,0.1);
        }
        
        .reset-zoom-btn:hover::before {
          left: 100%;
        }
        
        .zoom-indicator {
          position: absolute;
          top: 20px;
          left: 20px;
          background: #161616;
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.07);
          font-size: 11px;
          font-weight: 700;
          color: #ffffff;
        }
        
        .color-input {
          width: 50px;
          height: 40px;
          border: 2px solid rgba(255,255,255,0.1);
          border-radius: 6px;
          cursor: pointer;
          background: #1e1e1e;
          transition: all 0.2s ease;
        }
        
        .color-input:hover {
          border-color: rgba(216,255,99,0.3);
          box-shadow: 0 0 8px rgba(216,255,99,0.2);
        }
        
        .colour-input {
          width: 50px;
          height: 40px;
          border: 2px solid rgba(255,255,255,0.1);
          border-radius: 6px;
          cursor: pointer;
          background: #1e1e1e;
          transition: all 0.2s ease;
        }
        
        .colour-input:hover {
          border-color: rgba(216,255,99,0.3);
          box-shadow: 0 0 8px rgba(216,255,99,0.2);
        }
        
        .toggle {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .toggle-switch {
          width: 44px;
          height: 24px;
          background: #1e1e1e;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          cursor: pointer;
          position: relative;
          transition: all 0.2s ease;
        }
        
        .toggle-switch.active {
          background: rgba(216,255,99,0.2);
          border-color: ${ACCENT};
        }
        
        .toggle-switch::after {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 16px;
          height: 16px;
          background: #a1a1aa;
          border-radius: 50%;
          transition: all 0.2s ease;
        }
        
        .toggle-switch.active::after {
          transform: translateX(20px);
          background: ${ACCENT};
          box-shadow: 0 0 8px rgba(216,255,99,0.5);
        }
      `}</style>

      {/* Advanced Colour Picker Modal */}
      {showAdvancedColourPicker && selectedColourIndex !== null && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#161616',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '320px',
            width: '90%',
            boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}>
              <div style={{
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <div 
                  style={{ 
                    width: 24, 
                    height: 24, 
                    backgroundColor: selectedColourIndex === 0 ? colour1 : colour2, 
                    borderRadius: '4px', 
                    border: '1px solid rgba(255,255,255,0.1)' 
                  }} 
                />
                Cell {selectedColourIndex + 1} Colour
              </div>
              <button 
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.07)',
                  background: '#1e1e1e',
                  color: '#a1a1aa',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => {
                  setShowAdvancedColourPicker(false);
                  setSelectedColourIndex(null);
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.borderColor = ACCENT;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = '#a1a1aa';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                }}
              >
                <X size={16} />
              </button>
            </div>
            
            <input
              type="color"
              value={selectedColourIndex === 0 ? colour1 : colour2}
              onChange={(e) => {
                if (selectedColourIndex === 0) {
                  setColour1(e.target.value);
                } else {
                  setColour2(e.target.value);
                }
                updateIndividualColour(selectedColourIndex, e.target.value);
              }}
              style={{
                width: '100%',
                height: 50,
                border: '2px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                cursor: 'pointer',
                background: '#1e1e1e',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(216,255,99,0.3)';
                e.currentTarget.style.boxShadow = '0 0 8px rgba(216,255,99,0.2)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            
            <button 
              className="btn" 
              onClick={() => {
                setShowAdvancedColourPicker(false);
                setSelectedColourIndex(null);
              }}
              style={{ marginTop: '16px' }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ── Navbar ── */}
      <nav
        className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-8"
        style={{
          paddingTop: '10px',
          paddingBottom: '10px',
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 1px 0 0 rgba(196,255,13,0.05), inset 0 1px 0 0 rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-black tracking-tight">Battenburg Generator</h1>
          <div className="h-px w-4 bg-[#c4ff0d]/30" />
          <p className="text-[10px] text-zinc-600 tracking-[0.18em] uppercase">Emergency Services</p>
        </div>

        <button 
          onClick={() => navigate('/tools')}
          className="text-[10px] font-bold tracking-widest uppercase px-4 py-2 rounded-lg transition-all text-zinc-400 hover:text-white"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          Back to Tools
        </button>
      </nav>

      {/* ── Main Content ── */}
      <div className="flex h-full pt-[70px] relative z-10">
        {/* ── Sidebar ── */}
        <div className="w-[360px] bg-[#0f0f0f]/50 backdrop-blur-xl border-r border-white/8 overflow-y-auto">
          <div className="p-6 space-y-4">
            {/* Pattern Size */}
            <div className="bg-[#161616]/60 backdrop-blur-sm border border-white/8 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Grid size={18} className="text-[#c4ff0d]" />
                <h3 className="text-xs font-black uppercase tracking-widest text-white">Pattern Dimensions</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-medium text-zinc-400">Rows</label>
                    <span className="text-[10px] font-bold text-[#c4ff0d]">{rows}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="8"
                    value={rows}
                    onChange={(e) => {
                      const newRows = parseInt(e.target.value);
                      setRows(newRows);
                      updateSize(newRows, cols);
                    }}
                    className="w-full h-1.5 bg-[#1e1e1e] rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #c4ff0d 0%, #c4ff0d ${(rows - 1) / 7 * 100}%, #1e1e1e ${(rows - 1) / 7 * 100}%, #1e1e1e 100%)`,
                    }}
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-medium text-zinc-400">Columns</label>
                    <span className="text-[10px] font-bold text-[#c4ff0d]">{cols}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="12"
                    value={cols}
                    onChange={(e) => {
                      const newCols = parseInt(e.target.value);
                      setCols(newCols);
                      updateSize(rows, newCols);
                    }}
                    className="w-full h-1.5 bg-[#1e1e1e] rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #c4ff0d 0%, #c4ff0d ${(cols - 1) / 11 * 100}%, #1e1e1e ${(cols - 1) / 11 * 100}%, #1e1e1e 100%)`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Cell Properties */}
            <div className="bg-[#161616]/60 backdrop-blur-sm border border-white/8 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Sliders size={18} className="text-[#c4ff0d]" />
                <h3 className="text-xs font-black uppercase tracking-widest text-white">Cell Properties</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-medium text-zinc-400">Width</label>
                    <span className="text-[10px] font-bold text-[#c4ff0d]">{cellWidth}px</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="200"
                    value={cellWidth}
                    onChange={(e) => setCellWidth(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-[#1e1e1e] rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #c4ff0d 0%, #c4ff0d ${(cellWidth - 20) / 180 * 100}%, #1e1e1e ${(cellWidth - 20) / 180 * 100}%, #1e1e1e 100%)`,
                    }}
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-medium text-zinc-400">Height</label>
                    <span className="text-[10px] font-bold text-[#c4ff0d]">{cellHeight}px</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="200"
                    value={cellHeight}
                    onChange={(e) => setCellHeight(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-[#1e1e1e] rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #c4ff0d 0%, #c4ff0d ${(cellHeight - 20) / 180 * 100}%, #1e1e1e ${(cellHeight - 20) / 180 * 100}%, #1e1e1e 100%)`,
                    }}
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-medium text-zinc-400">Gap</label>
                    <span className="text-[10px] font-bold text-[#c4ff0d]">{gap}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={gap}
                    onChange={(e) => setGap(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-[#1e1e1e] rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #c4ff0d 0%, #c4ff0d ${gap / 20 * 100}%, #1e1e1e ${gap / 20 * 100}%, #1e1e1e 100%)`,
                    }}
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-medium text-zinc-400">Corner Radius</label>
                    <span className="text-[10px] font-bold text-[#c4ff0d]">{borderRadius}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={borderRadius}
                    onChange={(e) => setBorderRadius(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-[#1e1e1e] rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #c4ff0d 0%, #c4ff0d ${borderRadius / 50 * 100}%, #1e1e1e ${borderRadius / 50 * 100}%, #1e1e1e 100%)`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Colour Scheme */}
            <div className="bg-[#161616]/60 backdrop-blur-sm border border-white/8 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Palette size={18} className="text-[#c4ff0d]" />
                <h3 className="text-xs font-black uppercase tracking-widest text-white">Colour Scheme</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-medium text-zinc-400 block mb-2">Mode</label>
                  <button 
                    onClick={() => {
                      if (isAdvancedMode) {
                        setIndividualColours([]);
                      }
                      setIsAdvancedMode(!isAdvancedMode);
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 bg-[#1e1e1e]/50 border border-white/10 rounded-xl transition-all hover:bg-[#1e1e1e]/80 hover:border-[#c4ff0d]/30"
                  >
                    <span className="text-[10px] font-bold text-white">
                      {isAdvancedMode ? 'Individual Cells' : 'Basic Pattern'}
                    </span>
                    <div className="w-8 h-5 bg-[#1e1e1e] border border-white/20 rounded-full relative transition-all">
                      <div className={`absolute top-0.5 w-4 h-4 bg-[#c4ff0d] rounded-full transition-all ${isAdvancedMode ? 'translate-x-3' : 'translate-x-0.5'}`} />
                    </div>
                  </button>
                </div>
                
                {isAdvancedMode ? (
                  <div className="text-[10px] text-zinc-500 bg-[#1e1e1e]/30 border border-white/5 rounded-lg px-3 py-2">
                    Click any square to edit its colour individually
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="text-[10px] font-medium text-zinc-400 block mb-2">Primary Colour</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={colour1}
                          onChange={(e) => setColour1(e.target.value)}
                          className="w-12 h-12 bg-[#1e1e1e] border-2 border-white/10 rounded-lg cursor-pointer transition-all hover:border-[#c4ff0d]/50"
                        />
                        <span className="text-[10px] font-mono text-zinc-500">{colour1}</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-[10px] font-medium text-zinc-400 block mb-2">Secondary Colour</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={colour2}
                          onChange={(e) => setColour2(e.target.value)}
                          className="w-12 h-12 bg-[#1e1e1e] border-2 border-white/10 rounded-lg cursor-pointer transition-all hover:border-[#c4ff0d]/50"
                        />
                        <span className="text-[10px] font-mono text-zinc-500">{colour2}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Texture Overlay */}
            <div className="bg-[#161616]/60 backdrop-blur-sm border border-white/8 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Grid size={18} className="text-[#c4ff0d]" />
                <h3 className="text-xs font-black uppercase tracking-widest text-white">Texture Overlay</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <button
                    onClick={() => setTextureEnabled(!textureEnabled)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-[#1e1e1e]/50 border border-white/10 rounded-xl transition-all hover:bg-[#1e1e1e]/80 hover:border-[#c4ff0d]/30"
                  >
                    <span className="text-[10px] font-bold text-white">Waves Texture</span>
                    <div className="w-8 h-5 bg-[#1e1e1e] border border-white/20 rounded-full relative transition-all">
                      <div className={`absolute top-0.5 w-4 h-4 bg-[#c4ff0d] rounded-full transition-all ${textureEnabled ? 'translate-x-3' : 'translate-x-0.5'}`} />
                    </div>
                  </button>
                </div>
                
                {textureEnabled && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] font-medium text-zinc-400">Opacity</label>
                      <span className="text-[10px] font-bold text-[#c4ff0d]">{textureOpacity}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={textureOpacity}
                      onChange={(e) => setTextureOpacity(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-[#1e1e1e] rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #c4ff0d 0%, #c4ff0d ${textureOpacity}%, #1e1e1e ${textureOpacity}%, #1e1e1e 100%)`,
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Export Options */}
            <div className="bg-[#161616]/60 backdrop-blur-sm border border-white/8 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Download size={18} className="text-[#c4ff0d]" />
                <h3 className="text-xs font-black uppercase tracking-widest text-white">Export Options</h3>
              </div>
              
              <div className="space-y-3">
                <button 
                  onClick={exportPNG}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#c4ff0d]/10 border border-[#c4ff0d]/30 rounded-xl transition-all hover:bg-[#c4ff0d]/20 hover:border-[#c4ff0d]/50 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Download size={16} className="text-[#c4ff0d]" />
                  <span className="text-[10px] font-bold text-[#c4ff0d]">Export as PNG</span>
                </button>
                
                <button 
                  onClick={copyCSS}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#1e1e1e]/50 border border-white/10 rounded-xl transition-all hover:bg-[#1e1e1e]/80 hover:border-white/20 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Copy size={16} className="text-zinc-400" />
                  <span className="text-[10px] font-bold text-zinc-400">Copy CSS Code</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Preview Area ── */}
        <div className="flex-1 relative overflow-hidden" ref={previewRef}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div 
                className="grid transition-transform duration-200 ease-out"
                style={{
                  gridTemplateColumns: `repeat(${cols}, ${cellWidth}px)`,
                  gridTemplateRows: `repeat(${rows}, ${cellHeight}px)`,
                  gap: `${gap}px`,
                  width: totalWidth,
                  height: totalHeight,
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'center',
                }}
              >
                {patternColours.map((colour, index) => {
                  const radius = (borderRadius / 100) * Math.min(cellWidth, cellHeight);
                  return (
                    <div
                      key={index}
                      className="relative overflow-hidden transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-[#c4ff0d]/20 cursor-pointer"
                      style={{
                        backgroundColor: colour,
                        borderRadius: radius > 0 ? `${radius}px` : '0',
                        width: cellWidth,
                        height: cellHeight,
                      }}
                      onClick={() => {
                        if (isAdvancedMode) {
                          setSelectedColourIndex(index);
                          setShowAdvancedColourPicker(true);
                        }
                      }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                        <div className="w-2 h-2 bg-[#c4ff0d]/50 rounded-full backdrop-blur-sm" />
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Texture Overlay */}
              {textureEnabled && (
                <div 
                  className="absolute inset-0 pointer-events-none mix-blend-multiply"
                  style={{
                    backgroundImage: `url('${BASE}waves.png')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: textureOpacity / 100,
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: 'center',
                  }}
                />
              )}
            </div>
          </div>

          {/* Zoom Controls */}
          <div className="absolute bottom-6 right-6 flex items-center gap-2 bg-[#0f0f0f]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2">
            <button 
              className="w-10 h-10 flex items-center justify-center bg-[#1e1e1e]/50 border border-white/10 rounded-lg transition-all hover:bg-[#1e1e1e]/80 hover:border-[#c4ff0d]/30 hover:scale-105"
              onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.5))}
            >
              <Minus size={16} className="text-zinc-400" />
            </button>
            <button 
              className="w-10 h-10 flex items-center justify-center bg-[#c4ff0d]/10 border border-[#c4ff0d]/30 rounded-lg transition-all hover:bg-[#c4ff0d]/20 hover:scale-105"
              onClick={() => setZoomLevel(1)}
            >
              <span className="text-[10px] font-bold text-[#c4ff0d]">1x</span>
            </button>
            <button 
              className="w-10 h-10 flex items-center justify-center bg-[#1e1e1e]/50 border border-white/10 rounded-lg transition-all hover:bg-[#1e1e1e]/80 hover:border-[#c4ff0d]/30 hover:scale-105"
              onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 5))}
            >
              <Plus size={16} className="text-zinc-400" />
            </button>
          </div>

          {/* Zoom Indicator */}
          <div className="absolute top-6 left-6 bg-[#0f0f0f]/80 backdrop-blur-xl border border-white/10 rounded-xl px-3 py-2">
            <span className="text-[10px] font-bold text-[#c4ff0d]">{Math.round(zoomLevel * 100)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
