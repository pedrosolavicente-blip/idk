import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Copy, Grid, Sliders, Palette, Plus, Minus } from 'lucide-react';

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
  const [color1, setColor1] = useState('#C4FF0D');
  const [color2, setColor2] = useState('#006B2B');
  const [textureEnabled, setTextureEnabled] = useState(false);
  const [textureOpacity, setTextureOpacity] = useState(40);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Texture image ref
  const textureRef = useRef<HTMLImageElement | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Generate pattern colors
  const generatePattern = () => {
    const colors = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        colors.push((r + c) % 2 === 0 ? color1 : color2);
      }
    }
    return colors;
  };

  const patternColors = generatePattern();

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
    patternColors.forEach((color, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const x = col * (cellWidth + gap);
      const y = row * (cellHeight + gap);
      
      ctx.fillStyle = color;
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

  // Copy CSS
  const copyCSS = () => {
    const css = `.battenburg {
  display: grid;
  grid-template-columns: repeat(${cols}, ${cellWidth}px);
  grid-template-rows: repeat(${rows}, ${cellHeight}px);
  gap: ${gap}px;
}

.battenburg-cell {
  background: ${color1};
  border-radius: ${borderRadius}px;
}

.battenburg-cell:nth-child(even) {
  background: ${color2};
}`;
    
    navigator.clipboard.writeText(css);
    alert('CSS copied to clipboard!');
  };

  const totalWidth = cols * (cellWidth + gap) - gap;
  const totalHeight = rows * (cellHeight + gap) - gap;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080808',
      color: '#ffffff',
      fontFamily: 'Inter, sans-serif'
    }}>
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
          height: 4px;
          background: #1e1e1e;
          border-radius: 2px;
          outline: none;
          -webkit-appearance: none;
        }
        
        .control-slider::-webkit-slider-thumb {
          width: 16px;
          height: 16px;
          background: ${ACCENT};
          border-radius: 50%;
          cursor: pointer;
          -webkit-appearance: none;
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
        }
        
        .btn:hover {
          background: rgba(216,255,99,0.15);
          border-color: rgba(216,255,99,0.5);
          box-shadow: 0 4px 16px rgba(216,255,99,0.2);
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
        }
        
        .pattern-cell:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 16px rgba(216,255,99,0.3);
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
        }
        
        .zoom-btn:hover {
          color: #ffffff;
          border-color: ${ACCENT};
          background: rgba(216,255,99,0.1);
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
        }
      `}</style>

      {/* Navbar */}
      <nav className="navbar">
        <h1 className="nav-title">Battenburg Generator</h1>
        <button className="nav-btn" onClick={() => navigate('/tools')}>
          Back to Tools
        </button>
      </nav>

      {/* Main Content */}
      <div className="main-container">
        {/* Sidebar */}
        <div className="sidebar">
          {/* Pattern Size */}
          <div className="section">
            <div className="section-title">
              <Grid size={16} />
              Pattern Size
            </div>
            
            <div className="control-group">
              <label className="control-label">Rows: {rows}</label>
              <input
                type="range"
                min="1"
                max="8"
                value={rows}
                onChange={(e) => setRows(parseInt(e.target.value))}
                className="control-slider"
              />
            </div>
            
            <div className="control-group">
              <label className="control-label">Columns: {cols}</label>
              <input
                type="range"
                min="1"
                max="12"
                value={cols}
                onChange={(e) => setCols(parseInt(e.target.value))}
                className="control-slider"
              />
            </div>
          </div>

          {/* Cell Dimensions */}
          <div className="section">
            <div className="section-title">
              <Sliders size={16} />
              Cell Dimensions
            </div>
            
            <div className="control-group">
              <label className="control-label">Width: {cellWidth}px</label>
              <input
                type="range"
                min="20"
                max="200"
                value={cellWidth}
                onChange={(e) => setCellWidth(parseInt(e.target.value))}
                className="control-slider"
              />
            </div>
            
            <div className="control-group">
              <label className="control-label">Height: {cellHeight}px</label>
              <input
                type="range"
                min="20"
                max="200"
                value={cellHeight}
                onChange={(e) => setCellHeight(parseInt(e.target.value))}
                className="control-slider"
              />
            </div>
            
            <div className="control-group">
              <label className="control-label">Gap: {gap}px</label>
              <input
                type="range"
                min="0"
                max="20"
                value={gap}
                onChange={(e) => setGap(parseInt(e.target.value))}
                className="control-slider"
              />
            </div>
            
            <div className="control-group">
              <label className="control-label">Corner Radius: {borderRadius}%</label>
              <input
                type="range"
                min="0"
                max="50"
                value={borderRadius}
                onChange={(e) => setBorderRadius(parseInt(e.target.value))}
                className="control-slider"
              />
            </div>
          </div>

          {/* Colors */}
          <div className="section">
            <div className="section-title">
              <Palette size={16} />
              Colors
            </div>
            
            <div className="control-group">
              <label className="control-label">Primary Color</label>
              <input
                type="color"
                value={color1}
                onChange={(e) => setColor1(e.target.value)}
                className="color-input"
              />
            </div>
            
            <div className="control-group">
              <label className="control-label">Secondary Color</label>
              <input
                type="color"
                value={color2}
                onChange={(e) => setColor2(e.target.value)}
                className="color-input"
              />
            </div>
          </div>

          {/* Texture */}
          <div className="section">
            <div className="section-title">
              <Grid size={16} />
              Texture Overlay
            </div>
            
            <div className="control-group">
              <div className="toggle">
                <label className="control-label">Waves Texture</label>
                <div
                  className={`toggle-switch ${textureEnabled ? 'active' : ''}`}
                  onClick={() => setTextureEnabled(!textureEnabled)}
                />
              </div>
            </div>
            
            {textureEnabled && (
              <div className="control-group">
                <label className="control-label">Opacity: {textureOpacity}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={textureOpacity}
                  onChange={(e) => setTextureOpacity(parseInt(e.target.value))}
                  className="control-slider"
                />
              </div>
            )}
          </div>

          {/* Export */}
          <div className="section">
            <div className="section-title">Export</div>
            
            <button className="btn" onClick={exportPNG} style={{ marginBottom: '8px' }}>
              <Download size={16} />
              Export as PNG
            </button>
            
            <button className="btn" onClick={copyCSS}>
              <Copy size={16} />
              Copy CSS Code
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="preview-area" ref={previewRef}>
          <div className="preview-container">
            <div 
              className="pattern-grid"
              style={{
                width: totalWidth,
                height: totalHeight,
              }}
            >
              {patternColors.map((color, index) => {
                const radius = (borderRadius / 100) * Math.min(cellWidth, cellHeight);
                return (
                  <div
                    key={index}
                    className="pattern-cell"
                    style={{
                      backgroundColor: color,
                      borderRadius: radius > 0 ? `${radius}px` : '0',
                      width: cellWidth,
                      height: cellHeight,
                    }}
                  />
                );
              })}
            </div>
            
            {/* Texture Overlay */}
            {textureEnabled && (
              <div 
                className="texture-overlay"
                style={{
                  width: totalWidth,
                  height: totalHeight,
                }}
              />
            )}
          </div>

          {/* Zoom Controls */}
          <div className="zoom-controls">
            <button 
              className="zoom-btn"
              onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.5))}
            >
              <Minus size={16} />
            </button>
            <button 
              className="zoom-btn"
              onClick={() => setZoomLevel(1)}
            >
              100%
            </button>
            <button 
              className="zoom-btn"
              onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 5))}
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Zoom Indicator */}
          <div className="zoom-indicator">
            {Math.round(zoomLevel * 100)}%
          </div>
        </div>
      </div>
    </div>
  );
}
