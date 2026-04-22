import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function BattenburgGenerator() {
  const navigate = useNavigate();
  const [pattern, setPattern] = useState({
    rows: 4,
    cols: 4,
    primaryColor: '#ff6b6b',
    secondaryColor: '#ffffff',
    cellSize: 50,
    rotation: 0
  });

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      {/* Navbar */}
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
        <img src="/itzz.svg" alt="itzz" className="h-7 w-auto cursor-pointer transition-transform hover:scale-105"
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
            <h1 className="text-4xl font-bold text-white mb-4">Battenburg Generator</h1>
            <p className="text-lg text-zinc-400">Create custom battenburg patterns for emergency vehicles</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Controls Panel */}
            <div className="space-y-6">
              <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800">
                <h2 className="text-xl font-semibold mb-4">Pattern Settings</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Rows</label>
                    <input
                      type="range"
                      min="2"
                      max="8"
                      value={pattern.rows}
                      onChange={(e) => setPattern({...pattern, rows: parseInt(e.target.value)})}
                      className="w-full"
                    />
                    <span className="text-sm text-zinc-400">{pattern.rows}</span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Columns</label>
                    <input
                      type="range"
                      min="2"
                      max="8"
                      value={pattern.cols}
                      onChange={(e) => setPattern({...pattern, cols: parseInt(e.target.value)})}
                      className="w-full"
                    />
                    <span className="text-sm text-zinc-400">{pattern.cols}</span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Cell Size</label>
                    <input
                      type="range"
                      min="20"
                      max="100"
                      value={pattern.cellSize}
                      onChange={(e) => setPattern({...pattern, cellSize: parseInt(e.target.value)})}
                      className="w-full"
                    />
                    <span className="text-sm text-zinc-400">{pattern.cellSize}px</span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Rotation</label>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={pattern.rotation}
                      onChange={(e) => setPattern({...pattern, rotation: parseInt(e.target.value)})}
                      className="w-full"
                    />
                    <span className="text-sm text-zinc-400">{pattern.rotation}°</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Primary Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={pattern.primaryColor}
                          onChange={(e) => setPattern({...pattern, primaryColor: e.target.value})}
                          className="w-full h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={pattern.primaryColor}
                          onChange={(e) => setPattern({...pattern, primaryColor: e.target.value})}
                          className="w-20 px-2 py-1 bg-zinc-800 rounded text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Secondary Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={pattern.secondaryColor}
                          onChange={(e) => setPattern({...pattern, secondaryColor: e.target.value})}
                          className="w-full h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={pattern.secondaryColor}
                          onChange={(e) => setPattern({...pattern, secondaryColor: e.target.value})}
                          className="w-20 px-2 py-1 bg-zinc-800 rounded text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800">
                <h2 className="text-xl font-semibold mb-4">Export Options</h2>
                <div className="space-y-3">
                  <button className="w-full bg-[#c4ff0d] hover:bg-[#d4ff3d] text-black font-semibold py-3 rounded-lg transition-all">
                    Download as PNG
                  </button>
                  <button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 rounded-lg transition-all">
                    Download as SVG
                  </button>
                  <button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 rounded-lg transition-all">
                    Copy CSS Code
                  </button>
                </div>
              </div>
            </div>

            {/* Preview Panel */}
            <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800">
              <h2 className="text-xl font-semibold mb-4">Preview</h2>
              <div className="flex items-center justify-center min-h-[400px] bg-zinc-950 rounded-lg">
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${pattern.cols}, ${pattern.cellSize}px)`,
                    gridTemplateRows: `repeat(${pattern.rows}, ${pattern.cellSize}px)`,
                    transform: `rotate(${pattern.rotation}deg)`,
                    transformOrigin: 'center',
                    border: '2px solid #333'
                  }}
                >
                  {Array.from({ length: pattern.rows * pattern.cols }).map((_, index) => {
                    const row = Math.floor(index / pattern.cols);
                    const col = index % pattern.cols;
                    const isPrimary = (row + col) % 2 === 0;
                    
                    return (
                      <div
                        key={index}
                        style={{
                          backgroundColor: isPrimary ? pattern.primaryColor : pattern.secondaryColor,
                          width: `${pattern.cellSize}px`,
                          height: `${pattern.cellSize}px`,
                          border: '1px solid rgba(0,0,0,0.1)'
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
  );
}
