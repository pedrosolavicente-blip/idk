import { useEffect, useRef, useState, useCallback } from 'react';
import MODELS, { type VehicleModel, type VehicleCategory } from '../../lib/models';
import type { DiscordUser } from '../../lib/discordAuth';
import { clearAuth } from '../../lib/discordAuth';
import { initLiveryViewer, type LiveryViewer as Viewer, type ShowcaseSide, type SceneSettings } from '../../lib/liveryEngine';
import {
  Upload, Camera, ChevronDown, Palette, Box, Image as ImageIcon,
  Search, LogOut, Settings, RotateCcw, Bookmark, X, MoreHorizontal,
  Users, Star, FileText, Grid, List, Plus, Trash2, Eye, EyeOff,
  Sun, Moon, Sunset, Sliders
} from 'lucide-react';
import type { ReactNode, ElementType } from 'react';
import ColorPicker from './ColorPicker';
import Showcases, { type CurrentLivery } from './Showcases';
import type { LiveryConfig } from '../../lib/showcaseApi';

// ─── Types ────────────────────────────────────────────────────────────────────

const PANELS   = ['Left', 'Right', 'Top', 'Front', 'Back'] as const;
type PanelFace = typeof PANELS[number];
const ACCENT   = '#D8FF63'; // Neon yellow-green

const DEFAULT_SETTINGS: SceneSettings = {
  brightness: 1.1, skyRotX: 0, skyRotY: 0, skyRotZ: 0,
  background: 'default', bgCustomUrl: '', bgCustomIsEXR: false,
};

const SKYBOX_LIGHTING: Record<'default'|'sunset'|'night', Pick<SceneSettings,'brightness'|'skyRotX'|'skyRotY'|'skyRotZ'>> = {
  default: { brightness: 1.1,  skyRotX: 0, skyRotY: 0,   skyRotZ: 0 },
  sunset:  { brightness: 0.9,  skyRotX: 0, skyRotY: 180, skyRotZ: 0 },
  night:   { brightness: 0.25, skyRotX: 0, skyRotY: 0,   skyRotZ: 0 },
};

// ─── Preset helpers ───────────────────────────────────────────────────────────

interface LiveryPreset {
  id: string; name: string; createdAt: number;
  modelId: string | null; vehicleColor: string;
  panelNums: Record<PanelFace, number>; textures: Record<string, string>;
}

function presetsKey(uid: string) { return `livery_presets_${uid}`; }
function loadPresets(uid: string): LiveryPreset[] {
  try { return JSON.parse(localStorage.getItem(presetsKey(uid)) ?? '[]'); } catch { return []; }
}
function savePresetsStorage(uid: string, p: LiveryPreset[]) {
  localStorage.setItem(presetsKey(uid), JSON.stringify(p));
}
async function blobUrlToDataUrl(url: string): Promise<string> {
  if (url.startsWith('data:')) return url;
  const blob = await (await fetch(url)).blob();
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(blob);
  });
}

// ─── HSL ↔ HEX helpers ───────────────────────────────────────────────────────

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1,3),16)/255;
  const g = parseInt(hex.slice(3,5),16)/255;
  const b = parseInt(hex.slice(5,7),16)/255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h=0, s=0, l=(max+min)/2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d/(2-max-min) : d/(max+min);
    switch(max) {
      case r: h=((g-b)/d+(g<b?6:0))/6; break;
      case g: h=((b-r)/d+2)/6; break;
      case b: h=((r-g)/d+4)/6; break;
    }
  }
  return [Math.round(h*360), Math.round(s*100), Math.round(l*100)];
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h/30) % 12;
  const a = s * Math.min(l, 1-l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n)-3, Math.min(9-k(n), 1)));
  const toHex = (x: number) => Math.round(x*255).toString(16).padStart(2,'0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

function hexToRgb(hex: string): [number,number,number] {
  return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)];
}

// ─── Global Styles ────────────────────────────────────────────────────────────

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

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

  @keyframes slideDown  { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
  @keyframes slideUp    { from { opacity:0; transform:translateY(8px);  } to { opacity:1; transform:translateY(0); } }
  @keyframes expandX    { from { transform:scaleX(0); opacity:0; } to { transform:scaleX(1); opacity:1; } }
  @keyframes fadeIn     { from { opacity:0; } to { opacity:1; } }

  .lv-sidebar::-webkit-scrollbar       { width: 2px; }
  .lv-sidebar::-webkit-scrollbar-track { background: transparent; }
  .lv-sidebar::-webkit-scrollbar-thumb { background: rgba(216,255,99,0.2); border-radius: 99px; }
  .lv-sidebar::-webkit-scrollbar-thumb:hover { background: rgba(216,255,99,0.45); }

  .lv-list::-webkit-scrollbar       { width: 2px; }
  .lv-list::-webkit-scrollbar-track { background: transparent; }
  .lv-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 99px; }

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

  .hue-range {
    -webkit-appearance: none;
    appearance: none;
    height: 10px;
    border-radius: 99px;
    background: linear-gradient(to right,
      hsl(0,100%,50%), hsl(30,100%,50%), hsl(60,100%,50%), hsl(90,100%,50%),
      hsl(120,100%,50%), hsl(150,100%,50%), hsl(180,100%,50%), hsl(210,100%,50%),
      hsl(240,100%,50%), hsl(270,100%,50%), hsl(300,100%,50%), hsl(330,100%,50%), hsl(360,100%,50%)
    ) !important;
    outline: none;
    cursor: pointer;
  }
  .hue-range::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px; height: 16px;
    border-radius: 50%;
    background: white;
    border: 2px solid rgba(0,0,0,0.4);
    box-shadow: 0 1px 6px rgba(0,0,0,0.6);
    cursor: pointer;
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

  .vehicle-row {
    display: flex; align-items: center;
    padding: 8px 10px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.13s ease;
    border: 1px solid transparent;
    gap: 8px;
  }
  .vehicle-row:hover { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.06); transition: all 0.3s ease-out; }
  .vehicle-row:hover { transform: scale(1.02); }
  .vehicle-row.sel   { background: rgba(216,255,99,0.07); border-color: rgba(216,255,99,0.2); transition: all 0.3s ease-out; }

  .vehicle-card {
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease-out;
    border: 1px solid rgba(255,255,255,0.06);
    background: var(--surface2);
    overflow: hidden;
    aspect-ratio: 4/3;
    display: flex; flex-direction: column;
  }
  .vehicle-card:hover { border-color: rgba(216,255,99,0.2); transform: translateY(-1px) scale(1.02); }
  .vehicle-card.sel   { border-color: rgba(216,255,99,0.5); box-shadow: 0 0 16px rgba(216,255,99,0.12); }

  .panel-card {
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--surface1);
    overflow: hidden;
    transition: border-color 0.15s ease;
  }
  .panel-card.loaded { border-color: rgba(216,255,99,0.25); background: rgba(216,255,99,0.04); }
  .panel-card:hover  { border-color: rgba(216,255,99,0.2); }

  .drop-zone {
    border: 1.5px dashed rgba(255,255,255,0.1);
    border-radius: 8px;
    transition: all 0.15s ease;
    cursor: pointer;
  }
  .drop-zone:hover { border-color: rgba(216,255,99,0.35); background: rgba(216,255,99,0.03); }
  .drop-zone.dragover { border-color: var(--accent); background: rgba(216,255,99,0.06); }

  .preset-card {
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--surface1);
    transition: all 0.15s ease;
    cursor: pointer;
    overflow: hidden;
  }
  .preset-card:hover { border-color: rgba(216,255,99,0.2); background: var(--surface2); transform: translateY(-1px); }

  .pill-btn {
    padding: 5px 10px;
    border-radius: 6px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    border: 1px solid var(--border);
    background: var(--surface2);
    color: var(--text-3);
    cursor: pointer;
    transition: all 0.13s ease;
  }
  .pill-btn.active {
    background: #D8FF63;
    border-color: #D8FF63;
    color: #000;
    box-shadow: 0 0 14px rgba(216,255,99,0.3);
  }
  .pill-btn:not(.active):hover { border-color: rgba(216,255,99,0.15); color: var(--text-2); background: linear-gradient(to right, rgba(216,255,99,0.1), rgba(216,255,99,0.02)); transform: translateY(-1px); }

  .section-toggle {
    width: 100%;
    display: flex; align-items: center; gap: 8px;
    padding: 11px 16px;
    background: transparent;
    border: none;
    cursor: pointer;
    border-bottom: 0.5px solid rgba(255,255,255,0.03);
    transition: background 0.13s ease;
  }
  .section-toggle:hover { background: rgba(255,255,255,0.02); }

  .capture-btn {
    background: linear-gradient(135deg, rgba(216,255,99,0.12) 0%, rgba(216,255,99,0.08) 100%);
    border: 1px solid rgba(216,255,99,0.3);
    color: #D8FF63;
    box-shadow: 0 0 16px rgba(216,255,99,0.08);
    border-radius: 8px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.06em;
    cursor: pointer;
    transition: all 0.18s ease;
    position: relative;
    overflow: hidden;
  }
  .capture-btn::before {
    content: '';
    position: absolute; top: -50%; left: -50%;
    width: 200%; height: 200%;
    background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%);
    transform: translateX(-120%);
    transition: transform 0.5s ease;
  }
  .capture-btn:hover::before { transform: translateX(120%); }
  .capture-btn:hover { box-shadow: 0 6px 24px rgba(216,255,99,0.4); transform: translateY(-1px); }
  .capture-btn:active { transform: translateY(0); }

  .toggle-switch {
    width: 36px; height: 20px;
    border-radius: 99px;
    position: relative; cursor: pointer;
    transition: background 0.2s ease;
    flex-shrink: 0;
  }
  .toggle-switch::after {
    content: '';
    position: absolute;
    top: 3px; left: 3px;
    width: 14px; height: 14px;
    border-radius: 50%;
    background: white;
    transition: transform 0.2s ease;
  }
  .toggle-switch.on::after { transform: translateX(16px); }
`;

// ─── Sub-components ───────────────────────────────────────────────────────────

function Label({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-[10px] font-semibold uppercase tracking-widest mb-1.5 ${className}`} style={{ color: 'var(--text-4)' }}>
      {children}
    </p>
  );
}

function Section({
  title, icon: Icon, children, defaultOpen = false, count, accent = false,
}: {
  title: string; icon: ElementType; children: ReactNode;
  defaultOpen?: boolean; count?: number; accent?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: '0.5px solid rgba(255,255,255,0.03)' }}>
      <button className="section-toggle" onClick={() => setOpen(o => !o)}>
        <Icon size={11} style={{ color: accent ? ACCENT : 'var(--text-4)', flexShrink: 0 }} />
        <span className="flex-1 text-left text-[10px] font-semibold tracking-widest uppercase" style={{ color: open ? 'var(--text-2)' : 'var(--text-4)' }}>
          {title}
        </span>
        {count !== undefined && count > 0 && (
          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(196,255,13,0.1)', color: ACCENT, border: '1px solid rgba(196,255,13,0.2)' }}>
            {count}
          </span>
        )}
        <ChevronDown size={10} style={{ color: open ? ACCENT : 'var(--text-4)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease, color 0.15s', flexShrink: 0 }} />
      </button>
      {open && (
        <div className="px-4 pb-4 pt-2" style={{ animation: 'slideDown 0.18s cubic-bezier(0.16,1,0.3,1) both' }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Advanced Color Picker ────────────────────────────────────────────────────

function AdvancedColorPicker({ color, onChange }: { color: string; onChange: (c: string) => void }) {
  const [hsl, setHsl] = useState<[number,number,number]>(() => hexToHsl(color));
  const [hexInput, setHexInput] = useState(color.replace('#','').toUpperCase());
  const [mode, setMode] = useState<'basic'|'advanced'>('basic');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    const newHsl = hexToHsl(color);
    setHsl(newHsl);
    setHexInput(color.replace('#','').toUpperCase());
  }, [color]);

  useEffect(() => {
    if (mode !== 'advanced') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const W = canvas.width, H = canvas.height;

    const colorGrad = ctx.createLinearGradient(0,0,W,0);
    colorGrad.addColorStop(0, '#fff');
    colorGrad.addColorStop(1, `hsl(${hsl[0]},100%,50%)`);
    ctx.fillStyle = colorGrad;
    ctx.fillRect(0,0,W,H);

    const darkGrad = ctx.createLinearGradient(0,0,0,H);
    darkGrad.addColorStop(0, 'rgba(0,0,0,0)');
    darkGrad.addColorStop(1, '#000');
    ctx.fillStyle = darkGrad;
    ctx.fillRect(0,0,W,H);
  }, [hsl[0], mode]);

  const pickFromCanvas = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    const s = Math.round(x * 100);
    const l = Math.round((1 - y) * 50);
    const newHsl: [number,number,number] = [hsl[0], s, l];
    setHsl(newHsl);
    const hex = hslToHex(newHsl[0], newHsl[1], newHsl[2]);
    setHexInput(hex.replace('#','').toUpperCase());
    onChange(hex);
  }, [hsl, onChange]);

  const updateHue = (h: number) => {
    const newHsl: [number,number,number] = [h, hsl[1], hsl[2]];
    setHsl(newHsl);
    const hex = hslToHex(h, hsl[1], hsl[2]);
    setHexInput(hex.replace('#','').toUpperCase());
    onChange(hex);
  };

  const updateSat = (s: number) => {
    const newHsl: [number,number,number] = [hsl[0], s, hsl[2]];
    setHsl(newHsl);
    const hex = hslToHex(hsl[0], s, hsl[2]);
    setHexInput(hex.replace('#','').toUpperCase());
    onChange(hex);
  };

  const updateLight = (l: number) => {
    const newHsl: [number,number,number] = [hsl[0], hsl[1], l];
    setHsl(newHsl);
    const hex = hslToHex(hsl[0], hsl[1], l);
    setHexInput(hex.replace('#','').toUpperCase());
    onChange(hex);
  };

  const rgb = hexToRgb(color.length === 7 ? color : '#000000');
  const cursorX = `${hsl[1]}%`;
  const cursorY = `${100 - (hsl[2] / 50) * 100}%`;

  const SWATCHES = ['#000000','#1a1a2e','#c0392b','#27ae60','#2980b9','#8e44ad','#f39c12','#ecf0f1','#D8FF63','#2c2c2c'];

  return (
    <div>
      <div className="flex gap-1.5 mb-3">
        {(['basic','advanced'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className="pill-btn flex-1"
            style={{
              background: mode === m ? 'rgba(216,255,99,0.1)' : 'var(--surface2)',
              borderColor: mode === m ? 'rgba(216,255,99,0.3)' : 'var(--border)',
              color: mode === m ? ACCENT : 'var(--text-3)',
            }}
          >
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      {mode === 'basic' ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-md shrink-0 overflow-hidden" style={{ border: '2px solid rgba(255,255,255,0.1)' }}>
              <div className="absolute inset-0" style={{ background: color }} />
            </div>
            <div className="flex items-center flex-1 rounded-md px-3 py-2 gap-1.5"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
              <span className="font-mono text-[11px]" style={{ color: 'var(--text-4)' }}>#</span>
              <input
                value={hexInput}
                onChange={e => {
                  const v = e.target.value.replace(/[^0-9a-fA-F]/g,'').slice(0,6).toUpperCase();
                  setHexInput(v);
                  if (v.length === 6) { onChange('#'+v); setHsl(hexToHsl('#'+v)); }
                }}
                className="flex-1 bg-transparent font-mono uppercase outline-none text-[11px] min-w-0"
                style={{ color: 'var(--text-1)' }}
                maxLength={6} spellCheck={false}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SWATCHES.map(c => (
              <button key={c} onClick={() => { onChange(c); setHsl(hexToHsl(c)); setHexInput(c.replace('#','').toUpperCase()); }}
                title={c}
                className="w-6 h-6 rounded-md transition-all hover:scale-110"
                style={{
                  background: c,
                  border: color.toLowerCase() === c.toLowerCase() ? `2px solid ${ACCENT}` : '1.5px solid rgba(255,255,255,0.1)',
                  boxShadow: color.toLowerCase() === c.toLowerCase() ? `0 0 8px rgba(216,255,99,0.4)` : 'none',
                }}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative rounded-md overflow-hidden" style={{ aspectRatio: '2/1', cursor: 'crosshair' }}>
            <canvas
              ref={canvasRef}
              width={240} height={120}
              className="w-full h-full block"
              onMouseDown={e => { isDragging.current = true; pickFromCanvas(e); }}
              onMouseMove={e => { if (isDragging.current) pickFromCanvas(e); }}
              onMouseUp={() => { isDragging.current = false; }}
              onMouseLeave={() => { isDragging.current = false; }}
            />
            <div className="pointer-events-none absolute w-3 h-3 rounded-full -translate-x-1/2 -translate-y-1/2"
              style={{
                left: cursorX, top: cursorY,
                border: '2px solid white',
                boxShadow: '0 0 4px rgba(0,0,0,0.8)',
                background: color,
              }}
            />
          </div>

          <div>
            <Label>Hue — {hsl[0]}°</Label>
            <input type="range" min={0} max={360} step={1} value={hsl[0]}
              onChange={e => updateHue(Number(e.target.value))}
              className="hue-range w-full" />
          </div>

          <div>
            <Label>Saturation — {hsl[1]}%</Label>
            <input type="range" min={0} max={100} step={1} value={hsl[1]}
              onChange={e => updateSat(Number(e.target.value))}
              className="lv-range w-full"
              style={{ background: `linear-gradient(to right, hsl(${hsl[0]},0%,50%), hsl(${hsl[0]},100%,50%))` }}
            />
          </div>

          <div>
            <Label>Lightness — {hsl[2]}%</Label>
            <input type="range" min={0} max={100} step={1} value={hsl[2]}
              onChange={e => updateLight(Number(e.target.value))}
              className="lv-range w-full"
              style={{ background: `linear-gradient(to right, #000, hsl(${hsl[0]},${hsl[1]}%,50%), #fff)` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {[
              { label: 'HEX', value: `#${hexInput}` },
              { label: 'RGB', value: rgb.join(', ') },
              { label: 'HSL', value: `${hsl[0]}° ${hsl[1]}% ${hsl[2]}%` },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-md px-2 py-2 text-center" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                <p className="text-[8px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-4)' }}>{label}</p>
                <p className="text-[9px] font-semibold font-mono truncate" style={{ color: 'var(--text-2)' }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Livery Panel Card ────────────────────────────────────────────────────────

function PanelCard({
  face, panelNum, totalPanels,
  onIncrement, onDecrement,
  textures, onUpload, onRemove,
}: {
  face: PanelFace; panelNum: number; totalPanels: number;
  onIncrement: () => void; onDecrement: () => void;
  textures: Record<string, string>;
  onUpload: (panel: string, file: File) => void;
  onRemove: (panel: string) => void;
}) {
  const panels = Array.from({ length: totalPanels }, (_, i) => `${face}${i+1}`);
  const loadedCount = panels.filter(p => textures[p]).length;
  const [dragOver, setDragOver] = useState<string|null>(null);

  return (
    <div className="panel-card" style={{ borderColor: loadedCount > 0 ? 'rgba(216,255,99,0.2)' : 'var(--border)' }}>
      <div className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.05)', background: loadedCount > 0 ? 'rgba(216,255,99,0.04)' : 'rgba(255,255,255,0.02)' }}>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: loadedCount > 0 ? ACCENT : '#3f3f46' }} />
          <span className="text-[11px] font-semibold" style={{ color: loadedCount > 0 ? 'var(--text-1)' : 'var(--text-3)' }}>{face}</span>
          {loadedCount > 0 && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(216,255,99,0.1)', color: ACCENT }}>
              {loadedCount}/{totalPanels}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 rounded-md px-2 py-1" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
          <button onClick={onDecrement} className="w-3.5 h-3.5 flex items-center justify-center text-xs font-bold transition-colors" style={{ color: '#52525b' }}
            onMouseEnter={e => (e.currentTarget.style.color = ACCENT)} onMouseLeave={e => (e.currentTarget.style.color = '#52525b')}>−</button>
          <span className="text-[9px] font-semibold min-w-[10px] text-center" style={{ color: 'var(--text-2)' }}>{totalPanels}</span>
          <button onClick={onIncrement} className="w-3.5 h-3.5 flex items-center justify-center text-xs font-bold transition-colors" style={{ color: '#52525b' }}
            onMouseEnter={e => (e.currentTarget.style.color = ACCENT)} onMouseLeave={e => (e.currentTarget.style.color = '#52525b')}>+</button>
        </div>
      </div>

      <div className="p-2.5 space-y-1.5">
        {panels.map(panel => (
          <div key={panel}>
            {textures[panel] ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-md" style={{ background: 'rgba(216,255,99,0.06)', border: '1px solid rgba(216,255,99,0.15)' }}>
                <div className="w-7 h-7 rounded shrink-0 overflow-hidden" style={{ border: '1px solid rgba(216,255,99,0.2)' }}>
                  <img src={textures[panel]} className="w-full h-full object-cover" alt={panel} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold truncate" style={{ color: ACCENT }}>{panel}</p>
                  <p className="text-[8px]" style={{ color: 'rgba(216,255,99,0.5)' }}>Texture loaded</p>
                </div>
                <button onClick={() => onRemove(panel)} className="shrink-0 w-5 h-5 rounded flex items-center justify-center transition-all hover:scale-110"
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                  <X size={9} />
                </button>
              </div>
            ) : (
              <label
                className={`drop-zone flex items-center gap-2.5 px-3 py-2 ${dragOver === panel ? 'dragover' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragOver(panel); }}
                onDragLeave={() => setDragOver(null)}
                onDrop={e => {
                  e.preventDefault(); setDragOver(null);
                  const f = e.dataTransfer.files[0];
                  if (f) onUpload(panel, f);
                }}
              >
                <div className="w-7 h-7 rounded flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.1)' }}>
                  <Upload size={9} style={{ color: 'var(--text-4)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium" style={{ color: 'var(--text-3)' }}>{panel}</p>
                  <p className="text-[8px]" style={{ color: 'var(--text-4)' }}>Click or drag to upload</p>
                </div>
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files?.[0] && onUpload(panel, e.target.files[0])} />
              </label>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Scene Settings Panel ─────────────────────────────────────────────────────

function SceneSettingsPanel({ settings, onUpdate, onReset }: {
  settings: SceneSettings;
  onUpdate: (s: Partial<SceneSettings>) => void;
  onReset: () => void;
}) {
  const sliderTrack = (val: number, min: number, max: number, fromColor: string, toColor: string) => {
    const pct = ((val - min) / (max - min)) * 100;
    return `linear-gradient(to right, ${fromColor} 0%, ${fromColor} ${pct}%, rgba(255,255,255,0.08) ${pct}%, rgba(255,255,255,0.08) 100%)`;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--text-3)' }}>Scene Settings</p>
        <button onClick={onReset} className="flex items-center gap-1.5 text-[10px] font-semibold transition-colors" style={{ color: 'var(--text-4)' }}
          onMouseEnter={e => (e.currentTarget.style.color = ACCENT)} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-4)')}>
          <RotateCcw size={9} /> Reset
        </button>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="mb-0">Brightness</Label>
          <span className="text-[10px] font-bold font-mono" style={{ color: ACCENT }}>{settings.brightness.toFixed(2)}</span>
        </div>
        <input type="range" min={0.1} max={3} step={0.05} value={settings.brightness}
          onChange={e => onUpdate({ brightness: parseFloat(e.target.value) })}
          className="lv-range w-full"
          style={{ background: sliderTrack(settings.brightness, 0.1, 3, ACCENT, 'rgba(255,255,255,0.08)') }} />
        <div className="flex justify-between mt-1">
          <span className="text-[8px]" style={{ color: 'var(--text-4)' }}>0.1</span>
          <span className="text-[8px]" style={{ color: 'var(--text-4)' }}>3.0</span>
        </div>
      </div>

      <div>
        <Label>Sky Rotation</Label>
        <div className="space-y-3">
          {(['skyRotX','skyRotY','skyRotZ'] as const).map((key, i) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold" style={{ color: 'var(--text-3)' }}>{['X Axis','Y Axis','Z Axis'][i]}</span>
                <span className="text-[10px] font-bold font-mono" style={{ color: 'var(--text-2)' }}>{settings[key].toFixed(0)}°</span>
              </div>
              <input type="range" min={-180} max={180} step={1} value={settings[key]}
                onChange={e => onUpdate({ [key]: parseFloat(e.target.value) })}
                className="lv-range w-full"
                style={{ background: sliderTrack(settings[key], -180, 180, ACCENT, 'rgba(255,255,255,0.08)') }} />
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>Environment</Label>
        <div className="grid grid-cols-3 gap-1.5 mb-2">
          {([
            { id: 'default', label: 'Day',    icon: Sun  },
            { id: 'sunset',  label: 'Sunset', icon: Sunset },
            { id: 'night',   label: 'Night',  icon: Moon },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button key={id}
              onClick={() => onUpdate({ background: id, ...SKYBOX_LIGHTING[id] })}
              className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-lg transition-all"
              style={{
                background: settings.background === id ? 'rgba(216,255,99,0.08)' : 'var(--surface2)',
                border: `1px solid ${settings.background === id ? 'rgba(216,255,99,0.3)' : 'var(--border)'}`,
                color: settings.background === id ? ACCENT : 'var(--text-3)',
                boxShadow: settings.background === id ? '0 0 12px rgba(216,255,99,0.1)' : 'none',
              }}
            >
              <Icon size={14} />
              <span className="text-[9px] font-semibold">{label}</span>
            </button>
          ))}
        </div>
        <label
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg cursor-pointer transition-all"
          style={{
            background: settings.background === 'custom' ? 'rgba(216,255,99,0.08)' : 'var(--surface2)',
            border: `1px solid ${settings.background === 'custom' ? 'rgba(216,255,99,0.3)' : 'var(--border)'}`,
            color: settings.background === 'custom' ? ACCENT : 'var(--text-3)',
          }}
        >
          <ImageIcon size={11} />
          <span className="text-[10px] font-semibold">Custom HDRI / Image</span>
          <input type="file" accept="image/*,.exr" className="hidden"
            onChange={e => {
              const f = e.target.files?.[0]; if (!f) return;
              const url = URL.createObjectURL(f);
              onUpdate({ background: 'custom', bgCustomUrl: url, bgCustomIsEXR: f.name.endsWith('.exr') });
            }} />
        </label>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props { user: DiscordUser | null; onLogout: () => void; onShowDisclaimer: () => void; }
const AVAILABLE_CATEGORIES: VehicleCategory[] = ['PD', 'FD', 'DOT'];

export default function LiveryViewer({ user, onLogout, onShowDisclaimer }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef    = useRef<Viewer | null>(null);

  const [glbUrl, setGlbUrl]                   = useState('');
  const [selectedModel, setSelectedModel]       = useState<VehicleModel | null>(null);
  const [vehicleColor, setVehicleColor]         = useState('#000000');
  const [textures, setTextures]                 = useState<Record<string, string>>({});
  const [loading, setLoading]                   = useState<string | null>(null);
  const [error, setError]                       = useState<string | null>(null);
  const [panelNums, setPanelNums]               = useState<Record<PanelFace, number>>({ Left:1, Right:1, Top:1, Front:1, Back:1 });
  const [searchQuery, setSearchQuery]           = useState('');
  const [filterCat, setFilterCat]               = useState<VehicleCategory | 'All'>('All');
  const [vehicleViewMode, setVehicleViewMode]   = useState<'list'|'grid'>('list');
  const [showSettings, setShowSettings]         = useState(false);
  const [showAngleMenu, setShowAngleMenu]       = useState(false);
  const [settings, setSettings]                 = useState<SceneSettings>({ ...DEFAULT_SETTINGS });
  const [showMenu, setShowMenu]                 = useState(false);
  const [showCredits, setShowCredits]           = useState(false);
  const [showShowcases, setShowShowcases]       = useState(false);
  const [showLiveryPanel, setShowLiveryPanel]   = useState(false);

  const userId = user?.id ?? 'guest';
  const [presets, setPresets]           = useState<LiveryPreset[]>(() => loadPresets(userId));
  const [presetName, setPresetName]     = useState('');
  const [savingPreset, setSavingPreset] = useState(false);

  useEffect(() => {
    const id = 'lv-global';
    if (!document.getElementById(id)) {
      const el = document.createElement('style'); el.id = id; el.textContent = GLOBAL_STYLES;
      document.head.appendChild(el);
    }
  }, []);

  useEffect(() => {
    const v = initLiveryViewer(containerRef.current!);
    viewerRef.current = v;
    return () => v.dispose();
  }, []);

  useEffect(() => { viewerRef.current?.updateScene(settings); }, [settings]);

  const applyLivery = useCallback(async (url: string, color: string, tex: Record<string, string>) => {
    if (!url || !viewerRef.current) return;
    setError(null);
    try { await viewerRef.current.loadLivery(url, color, tex, msg => setLoading(msg)); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to load'); }
    finally { setLoading(null); }
  }, []);

  const handleSelectModel = (m: VehicleModel) => {
    setSelectedModel(m); setGlbUrl(m.path); applyLivery(m.path, vehicleColor, textures);
  };

  const rafRef = useRef<number | null>(null);
  const handleColorChange = useCallback((c: string) => {
    setVehicleColor(c);
    if (!viewerRef.current) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => { viewerRef.current?.updateColor(c); rafRef.current = null; });
  }, []);

  const handleTextureUpload = (panel: string, file: File) => {
    const url = URL.createObjectURL(file);
    const next = { ...textures, [panel]: url };
    setTextures(next);
    if (glbUrl) applyLivery(glbUrl, vehicleColor, next);
  };

  const handleRemoveTexture = (panel: string) => {
    const next = { ...textures }; delete next[panel];
    setTextures(next);
    if (glbUrl) applyLivery(glbUrl, vehicleColor, next);
  };

  const downloadDataUrl = (dataUrl: string, fn: string) => {
    const a = document.createElement('a'); a.href = dataUrl; a.download = fn;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };
  const handleCapture  = () => viewerRef.current && downloadDataUrl(viewerRef.current.captureThumbnail(), `${selectedModel?.name ?? 'livery'}-${Date.now()}.png`);
  const handleShowcase = (side: ShowcaseSide) => viewerRef.current && downloadDataUrl(viewerRef.current.captureShowcase(side), `${selectedModel?.name ?? 'livery'}-${side}.png`);

  const handleSavePreset = async () => {
    if (!presetName.trim()) return; setSavingPreset(true);
    try {
      const pt: Record<string, string> = {};
      await Promise.all(Object.entries(textures).map(async ([k, v]) => { pt[k] = await blobUrlToDataUrl(v); }));
      const p: LiveryPreset = { id: crypto.randomUUID(), name: presetName.trim(), createdAt: Date.now(), modelId: selectedModel?.id ?? null, vehicleColor, panelNums: { ...panelNums }, textures: pt };
      const next = [p, ...presets]; setPresets(next); savePresetsStorage(userId, next); setPresetName('');
    } finally { setSavingPreset(false); }
  };

  const handleLoadPreset = async (p: LiveryPreset) => {
    setVehicleColor(p.vehicleColor); setPanelNums(p.panelNums); setTextures(p.textures);
    const m = MODELS.find(m => m.id === p.modelId) ?? null;
    if (m) { setSelectedModel(m); setGlbUrl(m.path); await applyLivery(m.path, p.vehicleColor, p.textures); }
    else if (glbUrl) await applyLivery(glbUrl, p.vehicleColor, p.textures);
    viewerRef.current?.updateColor(p.vehicleColor);
  };

  const handleDeletePreset = (id: string) => {
    const next = presets.filter(p => p.id !== id); setPresets(next); savePresetsStorage(userId, next);
  };

  const filteredModels = MODELS
    .filter(m => filterCat === 'All' || m.category === filterCat)
    .filter(m => !searchQuery || m.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const totalLoadedTextures = Object.keys(textures).length;

  // ─── render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: 'var(--surface0)', color: 'var(--text-1)', fontFamily: 'Inter, sans-serif' }}>

      {/* ── Viewport ── */}
      <div className="relative flex-1 overflow-hidden" ref={containerRef}>
        {/* Ambient */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="absolute -top-48 -right-48 rounded-full" style={{ width:800, height:800, opacity:0.1, background:'radial-gradient(circle,#D8FF63 0%,transparent 60%)' }} />
          <div className="absolute -bottom-32 -left-32 rounded-full" style={{ width:600, height:600, opacity:0.05, background:'radial-gradient(circle,#D8FF63 0%,transparent 65%)' }} />
        </div>

        {/* ── Navbar ── */}
        <nav className="absolute top-0 left-0 right-0 z-20 flex items-center gap-3 px-6"
          style={{ height: 52, background: 'rgba(4,4,4,0.97)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderBottom: '0.5px solid rgba(255,255,255,0.05)', boxShadow: '0 1px 0 rgba(216,255,99,0.06)' }}>

          <img src="/itzz.svg" alt="itzz" style={{ height: 28, width: 'auto' }} />

          <div className="flex-1 flex items-center justify-center gap-2">
            <div className="relative">
              <button className={`nav-item ${showSettings ? 'active' : ''}`} onClick={() => { setShowSettings(s=>!s); setShowMenu(false); }}>
                <Settings size={11} /> Settings
              </button>
              {showSettings && (
                <div className="absolute left-0 top-full mt-2 w-80 rounded-xl p-5 z-30" style={{ background:'rgba(5,5,5,0.99)', border:'1px solid rgba(255,255,255,0.08)', backdropFilter:'blur(32px)', WebkitBackdropFilter:'blur(32px)', boxShadow:'0 24px 64px rgba(0,0,0,0.8)', animation:'slideDown 0.18s cubic-bezier(0.16,1,0.3,1) both' }}>
                  <SceneSettingsPanel settings={settings} onUpdate={u => setSettings(s=>({...s,...u}))} onReset={() => setSettings({...DEFAULT_SETTINGS})} />
                </div>
              )}
            </div>

            <button className="nav-item" onClick={() => { setShowShowcases(true); setShowMenu(false); }}>
              <Users size={11} /> Showcases
            </button>
          </div>

          <div className="flex items-center gap-2">
            {user && (
              <div className="flex items-center gap-2 px-3 rounded-md" style={{ height:32, background:'rgba(255,255,255,0.03)', border:'1px solid var(--border)' }}>
                <div className="relative">
                  <img src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=32`} alt="" className="w-5 h-5 rounded-full" onError={e=>{(e.target as HTMLImageElement).style.display='none';}} />
                  <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full" style={{ background:ACCENT, border:'1.5px solid #080808' }} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold leading-none" style={{ color:'var(--text-1)' }}>{user.global_name ?? user.username}</p>
                  <p className="text-[8px] font-bold uppercase tracking-widest leading-none mt-0.5" style={{ color:ACCENT }}>Member</p>
                </div>
              </div>
            )}

            <div className="relative">
              <button className={`nav-item ${showMenu ? 'active' : ''}`} onClick={() => { setShowMenu(s=>!s); setShowSettings(false); }}>
                <MoreHorizontal size={11} /> Menu
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-2 w-44 rounded-xl overflow-hidden z-30" style={{ background:'rgba(5,5,5,0.99)', border:'1px solid rgba(255,255,255,0.08)', backdropFilter:'blur(32px)', WebkitBackdropFilter:'blur(32px)', boxShadow:'0 24px 64px rgba(0,0,0,0.8)', animation:'slideDown 0.18s cubic-bezier(0.16,1,0.3,1) both' }}>
                  {[
                    { label:'Credits',    icon:Star,     action:()=>{ setShowCredits(true); setShowMenu(false); }, danger:false },
                    { label:'Disclaimer', icon:FileText,  action:()=>{ onShowDisclaimer(); setShowMenu(false); }, danger:false },
                    { label:'Log Out',    icon:LogOut,    action:()=>{ clearAuth(); onLogout(); },                  danger:true },
                  ].map((item, i, arr) => (
                    <button key={item.label} onClick={item.action}
                      className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-semibold transition-colors"
                      style={{ background:'transparent', border:'none', borderBottom: i<arr.length-1 ? '0.5px solid rgba(255,255,255,0.04)' : 'none', color:'var(--text-3)', borderRadius:0 }}
                      onMouseEnter={e=>{ (e.currentTarget as HTMLButtonElement).style.color=item.danger?'#f87171':'var(--text-1)'; (e.currentTarget as HTMLButtonElement).style.background=item.danger?'rgba(248,113,113,0.04)':'rgba(255,255,255,0.03)'; }}
                      onMouseLeave={e=>{ (e.currentTarget as HTMLButtonElement).style.color='var(--text-3)'; (e.currentTarget as HTMLButtonElement).style.background='transparent'; }}
                    >
                      <item.icon size={11} style={{ color:item.danger?'#ef4444':ACCENT }} />
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Loading */}
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 gap-4" style={{ background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)' }}>
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 rounded-full" style={{ border:'2px solid rgba(216,255,99,0.15)' }} />
              <div className="absolute inset-0 rounded-full animate-spin" style={{ border:'2px solid transparent', borderTopColor:ACCENT }} />
            </div>
            <p className="text-[10px] font-semibold tracking-widest uppercase" style={{ color:'var(--text-4)' }}>{loading}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-lg z-10 text-[11px] font-semibold"
            style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', color:'#f87171', animation:'slideDown 0.2s ease both' }}>
            {error}
          </div>
        )}

        {/* Empty */}
        {!glbUrl && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-3 z-10">
            <Box size={40} strokeWidth={0.75} style={{ color:'rgba(216,255,99,0.15)' }} />
            <p className="text-[11px] font-bold tracking-widest uppercase" style={{ color:'#27272a' }}>Select a Vehicle</p>
            <p className="text-[10px]" style={{ color:'#1f1f23' }}>Choose a model from the panel</p>
          </div>
        )}

        {/* Capture */}
        {glbUrl && (
          <div className="absolute bottom-6 right-6 flex flex-col items-end gap-2 z-10" style={{ animation:'slideUp 0.3s ease both' }}>
            <div className="relative">
              <button className={`nav-item ${showAngleMenu ? 'active' : ''}`} onClick={() => setShowAngleMenu(o=>!o)} style={{ minWidth:140, justifyContent:'space-between' }}>
                <span className="flex items-center gap-1.5"><ImageIcon size={10} /> Angle Shots</span>
                <ChevronDown size={9} style={{ transform:showAngleMenu?'rotate(180deg)':'none', transition:'transform 0.2s' }} />
              </button>
              {showAngleMenu && (
                <div className="absolute bottom-full mb-2 right-0 rounded-xl overflow-hidden w-48 z-30" style={{ background:'rgba(5,5,5,0.99)', border:'1px solid rgba(255,255,255,0.08)', backdropFilter:'blur(32px)', boxShadow:'0 24px 64px rgba(0,0,0,0.8)', animation:'slideUp 0.18s cubic-bezier(0.16,1,0.3,1) both' }}>
                  {([
                    { group:'Sides' },
                    { side:'front', label:'Front' },{ side:'back', label:'Back' },{ side:'left', label:'Left' },{ side:'right', label:'Right' },
                    { group:'Corners' },
                    { side:'front-right', label:'Front Right' },{ side:'front-left', label:'Front Left' },{ side:'back-right', label:'Back Right' },{ side:'back-left', label:'Back Left' },
                    { group:'Top' },
                    { side:'top', label:'Top Down' },{ side:'top-front', label:'Top Front' },{ side:'top-back', label:'Top Back' },{ side:'top-left', label:'Top Left' },{ side:'top-right', label:'Top Right' },
                  ] as const).map((e, i) => 'group' in e ? (
                    <p key={i} className="px-3 pt-3 pb-1 text-[8px] font-bold uppercase tracking-widest" style={{ color:'var(--text-4)' }}>{e.group}</p>
                  ) : (
                    <button key={e.side} onClick={() => { handleShowcase(e.side as ShowcaseSide); setShowAngleMenu(false); }}
                      className="w-full text-left px-4 py-2 text-[11px] font-medium transition-colors"
                      style={{ color:'var(--text-3)', background:'transparent', border:'none' }}
                      onMouseEnter={e=>{ (e.currentTarget as HTMLButtonElement).style.background='rgba(216,255,99,0.05)'; (e.currentTarget as HTMLButtonElement).style.color='var(--text-1)'; }}
                      onMouseLeave={ev=>{ (ev.currentTarget as HTMLButtonElement).style.background='transparent'; (ev.currentTarget as HTMLButtonElement).style.color='var(--text-3)'; }}
                    >{e.label}</button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={handleCapture} className="capture-btn flex items-center justify-center gap-2 w-full" style={{ height:40, paddingLeft:24, paddingRight:24 }}>
              <Camera size={13} /> Capture
            </button>
          </div>
        )}

        {/* Livery Panel Trigger */}
        {selectedModel && (
          <div className="absolute bottom-12 left-6 z-20 pointer-events-auto">
            <button
              onClick={() => setShowLiveryPanel(true)}
              className="px-4 py-2.5 flex items-center justify-center gap-2 rounded-md transition-all capture-btn"
              style={{
                background: 'rgba(216,255,99,0.1)',
                border: '1px solid rgba(216,255,99,0.3)',
                color: ACCENT,
                animation:'fadeIn 1s ease 0.5s both',
                opacity:0
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(216,255,99,0.2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(216,255,99,0.1)')}
            >
              <ImageIcon size={12} />
              <span className="text-[10px] font-semibold">Open Livery Panel</span>
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="absolute bottom-5 left-6 z-20 pointer-events-none flex items-center gap-2" style={{ animation:'fadeIn 1s ease 0.5s both', opacity:0 }}>
          <div style={{ width:16, height:1, background:'linear-gradient(to right, transparent, rgba(216,255,99,0.4), transparent)', transformOrigin:'center', animation:'expandX 0.6s cubic-bezier(0.16,1,0.3,1) 0.2s both', opacity:0 }} />
          <p className="text-[9px] font-medium tracking-wider uppercase" style={{ color:'var(--text-4)' }}>Developed by itzz industries</p>
        </div>

        {/* Credits modal */}
        {showCredits && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:'rgba(0,0,0,0.85)', backdropFilter:'blur(8px)' }}
            onMouseDown={e=>{ if (e.target===e.currentTarget) setShowCredits(false); }}>
            <div className="w-full max-w-sm rounded-lg overflow-hidden" style={{ background:'#0a0a0a', border:'1px solid rgba(255,255,255,0.08)', animation:'slideDown 0.25s cubic-bezier(0.16,1,0.3,1) both', boxShadow:'0 32px 80px rgba(0,0,0,0.9)' }}>
              <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom:'0.5px solid rgba(255,255,255,0.05)' }}>
                <p className="text-sm font-bold tracking-widest uppercase" style={{ color:'var(--text-2)' }}>Credits</p>
                <button onClick={()=>setShowCredits(false)} className="w-7 h-7 rounded-md flex items-center justify-center transition-colors" style={{ color:'var(--text-4)' }}>
                  <X size={12} />
                </button>
              </div>
              <div className="px-6 py-5 space-y-3">
                {[{ name:'Sonarsilly', role:'Backend Development' },{ name:'Link', role:'Frontend Development' }].map(p => (
                  <div key={p.name} className="flex items-center justify-between px-4 py-4 rounded-md" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background:'rgba(216,255,99,0.1)', color:'#D8FF63', border:'1px solid rgba(216,255,99,0.2)' }}>{p.name[0]}</div>
                      <p className="text-sm font-semibold" style={{ color:'var(--text-1)' }}>{p.name}</p>
                    </div>
                    <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color:'#D8FF63' }}>{p.role}</p>
                  </div>
                ))}
              </div>
              <div className="px-6 pb-6">
                <button onClick={()=>setShowCredits(false)} className="capture-btn w-full flex items-center justify-center" style={{ height:40 }}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Showcases */}
        {showShowcases && (
          <Showcases user={user} onClose={()=>setShowShowcases(false)}
            currentLivery={glbUrl ? { modelId:selectedModel?.id??null, modelName:selectedModel?.name??null, modelPath:glbUrl, vehicleColor, panelNums:panelNums as Record<string,number>, textures, captureThumb:()=>viewerRef.current?.captureThumbnail()??'' } satisfies CurrentLivery : undefined}
            onApplyLivery={(config:LiveryConfig) => {
              setVehicleColor(config.vehicleColor); setPanelNums(config.panelNums as Record<PanelFace,number>); setTextures(config.textures);
              const m = MODELS.find(m=>m.id===config.modelId);
              if (m) { setSelectedModel(m); setGlbUrl(m.path); applyLivery(m.path, config.vehicleColor, config.textures); }
              else if (glbUrl) applyLivery(glbUrl, config.vehicleColor, config.textures);
              viewerRef.current?.updateColor(config.vehicleColor); setShowShowcases(false);
            }}
          />
        )}
      </div>

      {/* ── Left Livery Panel ── */}
      {selectedModel && (
        <div
          className="fixed left-0 top-0 h-full w-80 z-30 flex flex-col overflow-hidden"
          style={{
            background: 'rgba(0,0,0,0.98)',
            borderRight: '1px solid rgba(216,255,99,0.2)',
            boxShadow: '4px 0 24px rgba(216,255,99,0.15)',
            transform: showLiveryPanel ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)'
          }}
        >
          {/* Panel Header */}
          <div className="relative flex items-center justify-between px-6 py-5" style={{ borderBottom: '0.5px solid rgba(216,255,99,0.08)', background: 'rgba(216,255,99,0.05)' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: 'rgba(216,255,99,0.15)', border: '1px solid rgba(216,255,99,0.3)' }}>
                <ImageIcon size={14} style={{ color: '#D8FF63' }} />
              </div>
              <div>
                <h3 className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>{selectedModel.name}</h3>
                <p className="text-[10px]" style={{ color: '#D8FF63' }}>Livery Panel</p>
              </div>
            </div>
            <button
              onClick={() => setShowLiveryPanel(false)}
              className="w-8 h-8 rounded-md flex items-center justify-center transition-all hover:scale-110"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            >
              <X size={14} style={{ color: 'var(--text-3)' }} />
            </button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            {/* Panel Number Controls */}
            <div>
              <Label>Panel Numbers</Label>
              <div className="space-y-3">
                {PANELS.map(face => (
                  <div key={face} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                    <span className="text-[12px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-2)' }}>{face}</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setPanelNums(p => ({...p, [face]: Math.max(1, p[face] - 1)}))}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all"
                        style={{ background: 'rgba(216,255,99,0.1)', border: '1px solid rgba(216,255,99,0.3)', color: '#D8FF63' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(216,255,99,0.2)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(216,255,99,0.1)')}
                      >−</button>
                      <div className="w-12 text-center">
                        <span className="text-[14px] font-bold" style={{ color: '#D8FF63', textShadow: '0 0 8px rgba(216,255,99,0.5)' }}>{panelNums[face]}</span>
                      </div>
                      <button
                        onClick={() => setPanelNums(p => ({...p, [face]: p[face] + 1}))}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all"
                        style={{ background: 'rgba(216,255,99,0.1)', border: '1px solid rgba(216,255,99,0.3)', color: '#D8FF63' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(216,255,99,0.2)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(216,255,99,0.1)')}
                      >+</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Texture Upload */}
            <div>
              <Label>Texture Management</Label>
              <div className="space-y-4">
                {PANELS.map(face => (
                  <div key={face} className="p-4 rounded-lg" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-[12px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-2)' }}>{face} Panels</h4>
                      <label className="flex items-center gap-2 px-3 py-1.5 rounded cursor-pointer transition-all"
                        style={{ background: 'rgba(216,255,99,0.1)', border: '1px solid rgba(216,255,99,0.3)', color: '#D8FF63', fontSize: '10px', fontWeight: '600' }}>
                        <Upload size={8} />
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={e => {
                            const files = Array.from(e.target.files || []);
                            files.forEach(file => {
                              const availableSlots = Array.from({ length: panelNums[face] }, (_, i) => `${face}${i + 1}`)
                                .filter(slot => !textures[slot]);
                              if (availableSlots.length > 0) {
                                handleTextureUpload(availableSlots[0], file);
                              }
                            });
                          }}
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {Array.from({ length: panelNums[face] }, (_, i) => `${face}${i + 1}`).map(panel => (
                        <div key={panel}>
                          {textures[panel] ? (
                            <div className="flex items-center gap-2 p-2 rounded" style={{ background: 'rgba(216,255,99,0.05)', border: '1px solid rgba(216,255,99,0.15)' }}>
                              <img src={textures[panel]} className="w-8 h-8 rounded object-cover" alt={panel} />
                              <div className="flex-1 min-w-0">
                                <p className="text-[9px] font-medium truncate" style={{ color: '#D8FF63' }}>{panel}</p>
                              </div>
                              <button
                                onClick={() => handleRemoveTexture(panel)}
                                className="w-5 h-5 rounded flex items-center justify-center transition-all"
                                style={{ color:'#ef4444', background:'rgba(239,68,68,0.1)' }}>
                                <X size={8} />
                              </button>
                            </div>
                          ) : (
                            <label className="flex items-center gap-2 p-2 rounded cursor-pointer transition-all border border-dashed"
                              style={{ borderColor: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.02)' }}>
                              <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                <Upload size={8} style={{ color: 'var(--text-4)' }} />
                              </div>
                              <p className="text-[9px] font-medium" style={{ color: 'var(--text-4)' }}>{panel}</p>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={e => e.target.files?.[0] && handleTextureUpload(panel, e.target.files[0])}
                              />
                            </label>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Sidebar ── */}
      <div className="lv-sidebar w-64 flex flex-col overflow-y-auto shrink-0"
        style={{ background:'rgba(5,5,5,0.99)', borderLeft:'1px solid rgba(255,255,255,0.05)', boxShadow:'-1px 0 0 rgba(0,255,136,0.03)' }}>

        {/* Header */}
        <div className="relative flex flex-col items-center justify-center overflow-hidden"
          style={{ paddingTop:28, paddingBottom:20, borderBottom:'1px solid rgba(255,255,255,0.05)', minHeight:108 }}>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-16"
            style={{ background:'radial-gradient(ellipse at top, rgba(0,255,136,0.08) 0%, transparent 70%)', animation:'fadeIn 0.8s ease 0.3s both', opacity:0 }} />
          <div style={{ animation:'slideDown 0.4s cubic-bezier(0.16,1,0.3,1) 0.05s both', opacity:0 }}>
            <img src="/Group_15.svg" alt="Livery Previewer" style={{ height:50, width:'auto', mixBlendMode:'lighten', display:'block' }} />
          </div>
          <div style={{ marginTop:12, width:'80%', height:1, background:'linear-gradient(to right, transparent, rgba(0,255,136,0.4), transparent)', transformOrigin:'center', animation:'expandX 0.6s cubic-bezier(0.16,1,0.3,1) 0.2s both', opacity:0 }} />
        </div>

        {/* Model */}
        <Section title="Model" icon={Box} defaultOpen={true} count={filteredModels.length}>
          <div className="flex gap-1.5 mb-3">
            {(['All', ...AVAILABLE_CATEGORIES] as const).map(cat => (
              <button key={cat} onClick={() => setFilterCat(cat as VehicleCategory | 'All')}
                className={`pill-btn flex-1 ${filterCat === cat ? 'active' : ''}`}>
                {cat}
              </button>
            ))}
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={10} style={{ color: '#D8FF63' }} />
            <input type="text" placeholder="Search vehicles…" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}
              className="w-full rounded-md text-[11px] pl-8 pr-8 py-2.5 outline-none"
              style={{ background:'var(--surface2)', border:'1px solid var(--border)', color:'var(--text-2)' }}
              onFocus={e=>(e.target.style.borderColor='rgba(216,255,99,0.35)')} onBlur={e=>(e.target.style.borderColor='var(--border)')} />
            {searchQuery && (
              <button onClick={()=>setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#D8FF63' }}>
                <X size={9} />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between mb-2">
            <p className="text-[9px] font-semibold uppercase tracking-widest" style={{ color:'var(--text-4)' }}>{filteredModels.length} vehicles</p>
            <div className="flex gap-1">
              {([['list', List], ['grid', Grid]] as const).map(([mode, Icon]) => (
                <button key={mode} onClick={() => setVehicleViewMode(mode)}
                  className="w-6 h-6 rounded flex items-center justify-center transition-all"
                  style={{ background: vehicleViewMode===mode ? 'rgba(216,255,99,0.1)' : 'transparent', border: `1px solid ${vehicleViewMode===mode ? 'rgba(216,255,99,0.25)' : 'transparent'}`, color: '#D8FF63' }}>
                  <Icon size={10} />
                </button>
              ))}
            </div>
          </div>

          <div className="lv-list overflow-y-auto" style={{ maxHeight:260 }}>
            {filteredModels.length === 0 ? (
              <div className="flex flex-col items-center py-10 gap-2">
                <Box size={20} strokeWidth={1.5} style={{ color: ACCENT }} />
                <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color:'var(--text-4)' }}>No vehicles found</p>
              </div>
            ) : vehicleViewMode === 'list' ? (
              <div className="space-y-px">
                {filteredModels.map(m => (
                  <button key={m.id} onClick={() => handleSelectModel(m)}
                    className={`vehicle-row w-full text-left ${selectedModel?.id===m.id ? 'sel' : ''}`}>
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: selectedModel?.id===m.id ? ACCENT : 'var(--text-4)' }} />
                    <span className="text-[11px] font-medium truncate flex-1" style={{ color: selectedModel?.id===m.id ? 'var(--text-1)' : 'var(--text-3)' }}>{m.name}</span>
                    {selectedModel?.id===m.id && <span className="text-[8px] font-bold uppercase tracking-wider shrink-0" style={{ color: ACCENT }}>Active</span>}
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {filteredModels.map(m => (
                  <button key={m.id} onClick={() => handleSelectModel(m)}
                    className={`vehicle-card text-left ${selectedModel?.id===m.id ? 'sel' : ''}`}>
                    <div className="flex-1 flex items-center justify-center" style={{ background:'var(--surface3)', minHeight:56 }}>
                      <img
                        src={`/${m.name}-front-left.png`}
                        alt={m.name}
                        className="w-full h-full object-cover"
                        style={{ opacity: selectedModel?.id===m.id ? 1 : 0.7 }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'block';
                        }}
                      />
                      <Box
                        size={20}
                        strokeWidth={1}
                        style={{ color: selectedModel?.id===m.id ? ACCENT : 'var(--text-4)', opacity:0.5, display: 'none' }}
                      />
                    </div>
                    <div className="px-2 py-1.5" style={{ borderTop:'1px solid rgba(255,255,255,0.05)' }}>
                      <p className="text-[9px] font-semibold truncate" style={{ color: selectedModel?.id===m.id ? ACCENT : 'var(--text-2)' }}>{m.name}</p>
                      <p className="text-[8px]" style={{ color:'var(--text-4)' }}>{m.category}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Section>

        {/* Presets */}
        <Section title="Presets" icon={Bookmark} count={presets.length}>
          <div className="flex gap-2 mb-3">
            <input placeholder="Name this preset…" value={presetName} onChange={e=>setPresetName(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&handleSavePreset()}
              className="flex-1 rounded-md text-[11px] px-3 py-2 outline-none min-w-0"
              style={{ background:'var(--surface2)', border:'1px solid var(--border)', color:'var(--text-2)' }}
              onFocus={e=>(e.target.style.borderColor='var(--accent)')} onBlur={e=>(e.target.style.borderColor='var(--border)')} />
            <button onClick={handleSavePreset} disabled={!presetName.trim()||savingPreset}
              className="capture-btn flex items-center justify-center gap-1 shrink-0 disabled:opacity-30"
              style={{ width:36, height:36, borderRadius:8 }}>
              {savingPreset ? <div className="w-3 h-3 rounded-full animate-spin" style={{ border:'1.5px solid transparent', borderTopColor:'#000' }} /> : <Plus size={13} />}
            </button>
          </div>

          {presets.length === 0 ? (
            <div className="flex flex-col items-center py-6 gap-1.5">
              <Bookmark size={18} strokeWidth={1.5} style={{ color:'var(--text-4)' }} />
              <p className="text-[9px] font-medium" style={{ color:'var(--text-4)' }}>No presets saved yet</p>
            </div>
          ) : (
            <div className="lv-list space-y-2 overflow-y-auto" style={{ maxHeight:200 }}>
              {presets.map(p => (
                <div key={p.id} className="preset-card group" onClick={()=>handleLoadPreset(p)}>
                  <div className="flex items-center gap-3 px-3 py-3">
                    <div className="w-7 h-7 rounded-md shrink-0" style={{ background: p.vehicleColor, border:'1.5px solid rgba(255,255,255,0.1)' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold truncate" style={{ color:'var(--text-1)' }}>{p.name}</p>
                      <p className="text-[9px] truncate mt-0.5" style={{ color:'var(--text-4)' }}>
                        {MODELS.find(m=>m.id===p.modelId)?.name ?? 'No model'} · {new Date(p.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button onClick={e=>{ e.stopPropagation(); handleDeletePreset(p.id); }}
                      className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center transition-all shrink-0"
                      style={{ color:'var(--text-4)', background:'rgba(255,255,255,0.04)' }}
                      onMouseEnter={e=>{ (e.currentTarget.style.color='#f87171'); (e.currentTarget.style.background='rgba(239,68,68,0.08)'); }}
                      onMouseLeave={e=>{ (e.currentTarget.style.color='var(--text-4)'); (e.currentTarget.style.background='rgba(255,255,255,0.04)'); }}>
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Vehicle Color */}
        <Section title="Vehicle Color" icon={Palette} defaultOpen={true} accent={true}>
          <AdvancedColorPicker color={vehicleColor} onChange={handleColorChange} />
        </Section>

      </div>
    </div>
  );
}