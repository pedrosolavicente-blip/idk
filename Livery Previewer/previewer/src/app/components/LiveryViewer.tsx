import { useEffect, useRef, useState, useCallback } from 'react';
import MODELS, { type VehicleModel, type VehicleCategory } from '../../lib/models';
import type { DiscordUser } from '../../lib/discordAuth';
import { clearAuth } from '../../lib/discordAuth';
import { initLiveryViewer, type LiveryViewer as Viewer, type ShowcaseSide, type SceneSettings } from '../../lib/liveryEngine';
import { Upload, Camera, ChevronDown, Palette, Box, Image, Search, LogOut, Settings, RotateCcw, Bookmark, X, MoreHorizontal, Users, Star, FileText, ChevronUp } from 'lucide-react';
import type { ReactNode, ElementType } from 'react';
import ColorPicker from './ColorPicker';
import Showcases, { type CurrentLivery } from './Showcases';
import type { LiveryConfig } from '../../lib/showcaseApi';

// ─── Types ────────────────────────────────────────────────────────────────────

const PANELS   = ['Left', 'Right', 'Top', 'Front', 'Back'] as const;
type PanelFace = typeof PANELS[number];

const ACCENT = '#c4ff0d';

const DEFAULT_SETTINGS: SceneSettings = {
  brightness:    1.1,
  skyRotX:       0,
  skyRotY:       0,
  skyRotZ:       0,
  background:    'default',
  bgCustomUrl:   '',
  bgCustomIsEXR: false,
};

const SKYBOX_LIGHTING: Record<'default' | 'sunset' | 'night', Pick<SceneSettings, 'brightness' | 'skyRotX' | 'skyRotY' | 'skyRotZ'>> = {
  default: { brightness: 1.1,  skyRotX: 0, skyRotY: 0,   skyRotZ: 0 },
  sunset:  { brightness: 0.9,  skyRotX: 0, skyRotY: 180, skyRotZ: 0 },
  night:   { brightness: 0.25, skyRotX: 0, skyRotY: 0,   skyRotZ: 0 },
};

// ─── Preset helpers ───────────────────────────────────────────────────────────

interface LiveryPreset {
  id:           string;
  name:         string;
  createdAt:    number;
  modelId:      string | null;
  vehicleColor: string;
  panelNums:    Record<PanelFace, number>;
  textures:     Record<string, string>;
}

function presetsKey(userId: string) { return `livery_presets_${userId}`; }
function loadPresets(userId: string): LiveryPreset[] {
  try { return JSON.parse(localStorage.getItem(presetsKey(userId)) ?? '[]'); }
  catch { return []; }
}
function savePresetsStorage(userId: string, presets: LiveryPreset[]) {
  localStorage.setItem(presetsKey(userId), JSON.stringify(presets));
}
async function blobUrlToDataUrl(url: string): Promise<string> {
  if (url.startsWith('data:')) return url;
  const res  = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ─── Global styles injected once ─────────────────────────────────────────────

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap');

  :root {
    --accent: #c4ff0d;
    --accent-dim: rgba(196,255,13,0.12);
    --accent-border: rgba(196,255,13,0.25);
    --surface: rgba(8,8,8,0.98);
    --surface-raised: rgba(14,14,14,0.98);
    --border: rgba(255,255,255,0.06);
    --text-muted: #52525b;
    --text-sub: #3f3f46;
  }

  @keyframes revealDown {
    from { opacity: 0; transform: translateY(-12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes revealUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes expandX {
    from { transform: scaleX(0); opacity: 0; }
    to   { transform: scaleX(1); opacity: 1; }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes pulse-glow {
    0%, 100% { opacity: 0.5; }
    50%       { opacity: 1; }
  }
  @keyframes scanline {
    0%   { transform: translateY(-100%); }
    100% { transform: translateY(400%); }
  }

  .sidebar-font { font-family: 'DM Sans', sans-serif; }
  .display-font { font-family: 'Bebas Neue', sans-serif; }

  .vehicle-item {
    position: relative;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.18s cubic-bezier(0.4,0,0.2,1);
  }
  .vehicle-item::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 2px;
    background: var(--accent);
    transform: scaleY(0);
    transform-origin: bottom;
    transition: transform 0.2s cubic-bezier(0.4,0,0.2,1);
  }
  .vehicle-item:hover::before,
  .vehicle-item.active::before {
    transform: scaleY(1);
  }
  .vehicle-item:hover {
    background: rgba(196,255,13,0.04) !important;
    padding-left: 18px !important;
  }
  .vehicle-item.active {
    background: rgba(196,255,13,0.07) !important;
    padding-left: 18px !important;
  }

  .cat-pill {
    position: relative;
    overflow: hidden;
    transition: all 0.15s ease;
    font-family: 'Bebas Neue', sans-serif;
    letter-spacing: 0.08em;
  }
  .cat-pill.active {
    color: #000 !important;
    background: var(--accent) !important;
    border-color: var(--accent) !important;
    box-shadow: 0 0 18px rgba(196,255,13,0.35);
  }
  .cat-pill:not(.active):hover {
    border-color: var(--accent-border) !important;
    color: var(--accent) !important;
  }

  .section-header {
    position: relative;
    transition: all 0.15s ease;
  }
  .section-header:hover .section-icon {
    transform: scale(1.15);
  }
  .section-icon {
    transition: transform 0.2s ease;
  }

  .nav-btn {
    position: relative;
    overflow: hidden;
    transition: all 0.18s ease;
    font-family: 'DM Sans', sans-serif;
  }
  .nav-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, transparent 0%, rgba(196,255,13,0.08) 100%);
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  .nav-btn:hover::after { opacity: 1; }
  .nav-btn.active {
    border-color: var(--accent-border) !important;
    color: var(--accent) !important;
    box-shadow: 0 0 14px rgba(196,255,13,0.1);
  }

  .capture-btn {
    position: relative;
    overflow: hidden;
    background: var(--accent);
    color: #000;
    font-family: 'Bebas Neue', sans-serif;
    letter-spacing: 0.12em;
    font-size: 13px;
    transition: all 0.2s ease;
  }
  .capture-btn::before {
    content: '';
    position: absolute;
    top: -50%; left: -50%;
    width: 200%; height: 200%;
    background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%);
    transform: translateX(-100%);
    transition: transform 0.5s ease;
  }
  .capture-btn:hover::before {
    transform: translateX(100%);
  }
  .capture-btn:hover {
    box-shadow: 0 6px 28px rgba(196,255,13,0.45), 0 2px 8px rgba(196,255,13,0.2);
    transform: translateY(-1px);
  }
  .capture-btn:active {
    transform: translateY(0);
  }

  .search-input {
    font-family: 'DM Sans', sans-serif;
    transition: all 0.2s ease;
  }
  .search-input:focus {
    border-color: rgba(196,255,13,0.4) !important;
    box-shadow: 0 0 0 1px rgba(196,255,13,0.15), 0 4px 16px rgba(196,255,13,0.06);
  }

  .preset-row {
    transition: all 0.15s ease;
  }
  .preset-row:hover {
    background: rgba(196,255,13,0.04) !important;
    border-color: rgba(196,255,13,0.15) !important;
  }

  .swatch {
    transition: all 0.15s ease;
    border: 1.5px solid rgba(255,255,255,0.08);
  }
  .swatch:hover {
    transform: scale(1.18) translateY(-2px);
    border-color: var(--accent) !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  }

  /* custom scrollbar */
  .sidebar-scroll::-webkit-scrollbar { width: 3px; }
  .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
  .sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(196,255,13,0.2); border-radius: 99px; }
  .sidebar-scroll::-webkit-scrollbar-thumb:hover { background: rgba(196,255,13,0.45); }

  .dropdown-enter {
    animation: revealDown 0.18s cubic-bezier(0.16,1,0.3,1) both;
  }
  .dropdown-enter-up {
    animation: revealUp 0.18s cubic-bezier(0.16,1,0.3,1) both;
  }
`;

// ─── Shared surface styles ────────────────────────────────────────────────────

const surface = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
} as const;

const surfaceActive = {
  background: 'rgba(196,255,13,0.08)',
  border: '1px solid rgba(196,255,13,0.3)',
  boxShadow: '0 0 18px rgba(196,255,13,0.1)',
} as const;

const dropdownSurface = {
  background: 'rgba(5,5,5,0.99)',
  border: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(32px)',
  WebkitBackdropFilter: 'blur(32px)',
  boxShadow: '0 24px 64px rgba(0,0,0,0.8), 0 0 0 1px rgba(196,255,13,0.04)',
} as const;

// ─── Section component ────────────────────────────────────────────────────────

function Section({ title, icon: Icon, children, defaultOpen = false, count }: {
  title: string; icon: ElementType; children: ReactNode; defaultOpen?: boolean; count?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="section-header w-full flex items-center gap-3 px-4 py-3.5 group"
      >
        <span className="section-icon" style={{ color: ACCENT }}>
          <Icon size={11} />
        </span>
        <span className="flex-1 text-left text-[10px] font-bold tracking-[0.2em] uppercase sidebar-font"
          style={{ color: open ? '#a1a1aa' : '#52525b', transition: 'color 0.15s' }}>
          {title}
        </span>
        {count !== undefined && count > 0 && (
          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: 'rgba(196,255,13,0.12)', color: ACCENT, border: '1px solid rgba(196,255,13,0.2)' }}>
            {count}
          </span>
        )}
        <span style={{ color: open ? ACCENT : '#3f3f46', transition: 'color 0.15s, transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-flex' }}>
          <ChevronDown size={10} />
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-0.5 space-y-2.5" style={{ animation: 'revealDown 0.2s cubic-bezier(0.16,1,0.3,1) both' }}>
          {children}
        </div>
      )}
    </div>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <p className="text-[9px] uppercase tracking-[0.18em] mb-1.5 sidebar-font font-semibold" style={{ color: '#3f3f46' }}>
      {children}
    </p>
  );
}

// ─── Vehicle Selector ─────────────────────────────────────────────────────────

function VehicleSelector({
  models, selectedModel, filterCat, searchQuery,
  onSelectModel, onFilterCat, onSearch,
}: {
  models: VehicleModel[];
  selectedModel: VehicleModel | null;
  filterCat: VehicleCategory | 'All';
  searchQuery: string;
  onSelectModel: (m: VehicleModel) => void;
  onFilterCat: (c: VehicleCategory | 'All') => void;
  onSearch: (q: string) => void;
}) {
  const AVAILABLE_CATEGORIES: VehicleCategory[] = ['PD', 'FD', 'DOT'];

  return (
    <div className="space-y-2.5">
      {/* Category pills */}
      <div className="flex gap-1.5">
        {(['All', ...AVAILABLE_CATEGORIES] as const).map(cat => (
          <button
            key={cat}
            onClick={() => onFilterCat(cat as VehicleCategory | 'All')}
            className={`cat-pill flex-1 text-[11px] py-1.5 rounded-lg ${filterCat === cat ? 'active' : ''}`}
            style={{
              background: filterCat === cat ? ACCENT : 'rgba(255,255,255,0.03)',
              border: `1px solid ${filterCat === cat ? ACCENT : 'rgba(255,255,255,0.07)'}`,
              color: filterCat === cat ? '#000' : '#52525b',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={10} style={{ color: '#3f3f46' }} />
        <input
          type="text"
          placeholder="Search vehicles…"
          value={searchQuery}
          onChange={e => onSearch(e.target.value)}
          className="search-input w-full rounded-xl text-[11px] pl-8 pr-3 py-2.5 outline-none sidebar-font"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#a1a1aa' }}
        />
        {searchQuery && (
          <button onClick={() => onSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors hover:text-white" style={{ color: '#52525b' }}>
            <X size={10} />
          </button>
        )}
      </div>

      {/* Vehicle list */}
      <div className="sidebar-scroll overflow-y-auto" style={{ maxHeight: '268px' }}>
        {models.length > 0 ? (
          <div className="space-y-px">
            {models.map((m, i) => (
              <button
                key={m.id}
                onClick={() => onSelectModel(m)}
                className={`vehicle-item w-full text-left px-3 py-2.5 rounded-lg sidebar-font`}
                style={{
                  background: selectedModel?.id === m.id ? 'rgba(196,255,13,0.07)' : 'transparent',
                  color: selectedModel?.id === m.id ? ACCENT : '#71717a',
                  fontSize: '11px',
                  fontWeight: selectedModel?.id === m.id ? 600 : 400,
                  paddingLeft: selectedModel?.id === m.id ? '18px' : '12px',
                  animation: `revealDown 0.15s ease ${Math.min(i * 0.02, 0.3)}s both`,
                }}
              >
                <span className="flex items-center gap-2">
                  {selectedModel?.id === m.id && (
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: ACCENT, display: 'inline-block', flexShrink: 0 }} />
                  )}
                  {m.name}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Box size={20} style={{ color: '#27272a' }} strokeWidth={1.5} />
            <p className="text-[9px] tracking-wider uppercase sidebar-font" style={{ color: '#3f3f46' }}>No vehicles found</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props { user: DiscordUser | null; onLogout: () => void; onShowDisclaimer: () => void; }

export default function LiveryViewer({ user, onLogout, onShowDisclaimer }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef    = useRef<Viewer | null>(null);

  const [glbUrl, setGlbUrl]                   = useState('');
  const [selectedModel, setSelectedModel]       = useState<VehicleModel | null>(null);
  const [vehicleColor, setVehicleColor]         = useState('#000000');
  const [hexSidebarInput, setHexSidebarInput]   = useState('000000');
  const [textures, setTextures]                 = useState<Record<string, string>>({});
  const [loading, setLoading]                   = useState<string | null>(null);
  const [error, setError]                       = useState<string | null>(null);
  const [panelNums, setPanelNums]               = useState<Record<PanelFace, number>>({ Left:1, Right:1, Top:1, Front:1, Back:1 });
  const [searchQuery, setSearchQuery]           = useState('');
  const [filterCat, setFilterCat]               = useState<VehicleCategory | 'All'>('All');
  const [showSettings, setShowSettings]         = useState(false);
  const [showAngleMenu, setShowAngleMenu]       = useState(false);
  const [settings, setSettings]                 = useState<SceneSettings>({ ...DEFAULT_SETTINGS });
  const [showMenu, setShowMenu]                 = useState(false);
  const [showCredits, setShowCredits]           = useState(false);
  const [showShowcases, setShowShowcases]       = useState(false);

  const userId = user?.id ?? 'guest';
  const [presets, setPresets]           = useState<LiveryPreset[]>(() => loadPresets(userId));
  const [presetName, setPresetName]     = useState('');
  const [savingPreset, setSavingPreset] = useState(false);

  // inject global styles once
  useEffect(() => {
    const id = 'lv-global-styles';
    if (!document.getElementById(id)) {
      const el = document.createElement('style');
      el.id = id;
      el.textContent = GLOBAL_STYLES;
      document.head.appendChild(el);
    }
  }, []);

  useEffect(() => {
    const viewer = initLiveryViewer(containerRef.current!);
    viewerRef.current = viewer;
    return () => viewer.dispose();
  }, []);

  useEffect(() => {
    if (!viewerRef.current) return;
    viewerRef.current.updateScene(settings);
  }, [settings]);

  const applyLivery = useCallback(async (url: string, color: string, tex: Record<string, string>) => {
    if (!url || !viewerRef.current) return;
    setError(null);
    try {
      await viewerRef.current.loadLivery(url, color, tex, (msg) => setLoading(msg));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load model');
    } finally {
      setLoading(null);
    }
  }, []);

  const handleSelectModel = (model: VehicleModel) => {
    setSelectedModel(model);
    setGlbUrl(model.path);
    applyLivery(model.path, vehicleColor, textures);
  };

  const rafRef = useRef<number | null>(null);
  const handleColorChange = useCallback((color: string) => {
    setVehicleColor(color);
    setHexSidebarInput(color.replace('#', '').toUpperCase());
    if (!viewerRef.current) return;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      viewerRef.current?.updateColor(color);
      rafRef.current = null;
    });
  }, []);

  const handleSidebarHexInput = (raw: string) => {
    const val = raw.replace(/[^0-9a-fA-F]/g, '').slice(0, 6).toUpperCase();
    setHexSidebarInput(val);
    if (val.length === 6) handleColorChange('#' + val);
  };

  const handleTextureUpload = (panel: string, file: File) => {
    const url  = URL.createObjectURL(file);
    const next = { ...textures, [panel]: url };
    setTextures(next);
    if (glbUrl) applyLivery(glbUrl, vehicleColor, next);
  };

  const handleRemoveTexture = (panel: string) => {
    const next = { ...textures };
    delete next[panel];
    setTextures(next);
    if (glbUrl) applyLivery(glbUrl, vehicleColor, next);
  };

  const getPanelKeys = (face: PanelFace) =>
    Array.from({ length: panelNums[face] }, (_, i) => `${face}${i + 1}`);

  const downloadDataUrl = (dataUrl: string, filename: string) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCapture = () => {
    if (!viewerRef.current) return;
    downloadDataUrl(viewerRef.current.captureThumbnail(), `${selectedModel?.name ?? 'livery-preview'}-${Date.now()}.png`);
  };

  const handleShowcase = (side: ShowcaseSide) => {
    if (!viewerRef.current) return;
    downloadDataUrl(viewerRef.current.captureShowcase(side), `${selectedModel?.name ?? 'livery'}-${side}-${Date.now()}.png`);
  };

  const handleBgCustomUpload = (file: File) => {
    const url   = URL.createObjectURL(file);
    const isEXR = file.name.toLowerCase().endsWith('.exr');
    setSettings(s => ({ ...s, background: 'custom', bgCustomUrl: url, bgCustomIsEXR: isEXR }));
  };

  const handleResetSettings = () => setSettings({ ...DEFAULT_SETTINGS });

  const handleSavePreset = async () => {
    if (!presetName.trim()) return;
    setSavingPreset(true);
    try {
      const persistedTextures: Record<string, string> = {};
      await Promise.all(Object.entries(textures).map(async ([panel, url]) => {
        persistedTextures[panel] = await blobUrlToDataUrl(url);
      }));
      const preset: LiveryPreset = {
        id: crypto.randomUUID(), name: presetName.trim(), createdAt: Date.now(),
        modelId: selectedModel?.id ?? null, vehicleColor, panelNums: { ...panelNums }, textures: persistedTextures,
      };
      const next = [preset, ...presets];
      setPresets(next);
      savePresetsStorage(userId, next);
      setPresetName('');
    } finally {
      setSavingPreset(false);
    }
  };

  const handleLoadPreset = async (preset: LiveryPreset) => {
    setVehicleColor(preset.vehicleColor);
    setHexSidebarInput(preset.vehicleColor.replace('#', '').toUpperCase());
    setPanelNums(preset.panelNums);
    setTextures(preset.textures);
    const model = MODELS.find(m => m.id === preset.modelId) ?? null;
    if (model) {
      setSelectedModel(model); setGlbUrl(model.path);
      await applyLivery(model.path, preset.vehicleColor, preset.textures);
    } else if (glbUrl) {
      await applyLivery(glbUrl, preset.vehicleColor, preset.textures);
    }
    viewerRef.current?.updateColor(preset.vehicleColor);
  };

  const handleDeletePreset = (id: string) => {
    const next = presets.filter(p => p.id !== id);
    setPresets(next);
    savePresetsStorage(userId, next);
  };

  const filteredModels = MODELS
    .filter(m => filterCat === 'All' || m.category === filterCat)
    .filter(m => !searchQuery || m.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // close overlays on outside click
  useEffect(() => {
    const handler = () => { setShowSettings(false); setShowMenu(false); setShowAngleMenu(false); };
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') handler(); });
    return () => document.removeEventListener('keydown', handler as any);
  }, []);

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen overflow-hidden sidebar-font" style={{ background: '#080808', color: '#fff' }}>

      {/* ── 3-D Viewport ── */}
      <div className="relative flex-1 overflow-hidden" ref={containerRef}>

        {/* Ambient glows */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="absolute -top-48 -right-48 rounded-full" style={{ width: 800, height: 800, opacity: 0.12, background: 'radial-gradient(circle, #c4ff0d 0%, transparent 60%)' }} />
          <div className="absolute -bottom-32 -left-32 rounded-full" style={{ width: 600, height: 600, opacity: 0.06, background: 'radial-gradient(circle, #88ff00 0%, transparent 65%)' }} />
        </div>

        {/* ── Navbar ── */}
        <nav
          className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-8"
          style={{
            paddingTop: 10, paddingBottom: 10,
            background: 'rgba(4,4,4,0.96)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            boxShadow: '0 1px 0 rgba(196,255,13,0.07)',
          }}
        >
          <img src="/itzz.svg" alt="itzz" className="h-7 w-auto" style={{ animation: 'fadeIn 0.5s ease both' }} />

          {/* Center nav */}
          <div className="flex items-center gap-1.5">
            {/* Settings */}
            <div className="relative">
              <button
                onClick={() => { setShowSettings(s => !s); setShowMenu(false); }}
                className={`nav-btn flex items-center gap-2 text-[10px] font-semibold tracking-[0.12em] uppercase px-4 py-2 rounded-xl ${showSettings ? 'active' : ''}`}
                style={{
                  background: showSettings ? 'rgba(196,255,13,0.08)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${showSettings ? 'rgba(196,255,13,0.3)' : 'rgba(255,255,255,0.07)'}`,
                  color: showSettings ? ACCENT : '#52525b',
                }}
              >
                <Settings size={11} style={{ color: showSettings ? ACCENT : '#52525b' }} />
                Settings
              </button>

              {showSettings && (
                <div className="dropdown-enter absolute left-0 top-full mt-2 w-72 rounded-2xl p-5 z-30" style={dropdownSurface}>
                  <div className="flex items-center justify-between mb-5">
                    <p className="display-font text-sm tracking-[0.15em]" style={{ color: '#a1a1aa' }}>SCENE SETTINGS</p>
                    <button onClick={handleResetSettings} className="flex items-center gap-1.5 text-[10px] sidebar-font transition-colors hover:text-[#c4ff0d]" style={{ color: '#52525b' }}>
                      <RotateCcw size={9} /> Reset
                    </button>
                  </div>

                  <div className="mb-5">
                    <Label>Brightness — {settings.brightness.toFixed(2)}</Label>
                    <input type="range" min={0.1} max={3} step={0.05} value={settings.brightness}
                      onChange={e => setSettings(s => ({ ...s, brightness: parseFloat(e.target.value) }))}
                      className="w-full accent-[#c4ff0d]" style={{ accentColor: ACCENT }} />
                  </div>

                  <div className="mb-5 space-y-3">
                    <Label>Sky Rotation</Label>
                    {([
                      { key: 'skyRotX' as const, label: 'X' },
                      { key: 'skyRotY' as const, label: 'Y' },
                      { key: 'skyRotZ' as const, label: 'Z' },
                    ]).map(({ key, label }) => (
                      <div key={key}>
                        <p className="text-[9px] mb-1 sidebar-font" style={{ color: '#3f3f46' }}>{label} — {settings[key].toFixed(1)}°</p>
                        <input type="range" min={-180} max={180} step={0.5} value={settings[key]}
                          onChange={e => setSettings(s => ({ ...s, [key]: parseFloat(e.target.value) }))}
                          className="w-full" style={{ accentColor: ACCENT }} />
                      </div>
                    ))}
                  </div>

                  <div>
                    <Label>Skybox</Label>
                    <div className="grid grid-cols-3 gap-1.5 mb-2">
                      {(['default', 'sunset', 'night'] as const).map(bg => (
                        <button key={bg}
                          onClick={() => setSettings(s => ({ ...s, background: bg, ...SKYBOX_LIGHTING[bg] }))}
                          className="cat-pill text-[10px] px-2 py-2 rounded-xl transition-all"
                          style={{
                            background: settings.background === bg ? ACCENT : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${settings.background === bg ? ACCENT : 'rgba(255,255,255,0.07)'}`,
                            color: settings.background === bg ? '#000' : '#52525b',
                          }}
                        >
                          {bg.charAt(0).toUpperCase() + bg.slice(1)}
                        </button>
                      ))}
                    </div>
                    <label
                      className="cat-pill w-full text-[10px] font-bold px-2 py-2 rounded-xl cursor-pointer text-center block"
                      style={{
                        background: settings.background === 'custom' ? ACCENT : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${settings.background === 'custom' ? ACCENT : 'rgba(255,255,255,0.07)'}`,
                        color: settings.background === 'custom' ? '#000' : '#52525b',
                      }}
                    >
                      Custom HDRI
                      <input type="file" accept="image/*,.exr" className="hidden"
                        onChange={e => e.target.files?.[0] && handleBgCustomUpload(e.target.files[0])} />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Showcases */}
            <button
              onClick={() => { setShowShowcases(true); setShowMenu(false); }}
              className="nav-btn flex items-center gap-2 text-[10px] font-semibold tracking-[0.12em] uppercase px-4 py-2 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#52525b' }}
            >
              <Users size={11} style={{ color: '#52525b' }} />
              Showcases
            </button>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {user && (
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="relative">
                  <img
                    src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=32`}
                    alt="" className="w-6 h-6 rounded-full"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full" style={{ background: ACCENT, border: '1.5px solid #080808' }} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold leading-none sidebar-font" style={{ color: '#e4e4e7' }}>{user.global_name ?? user.username}</p>
                  <p className="text-[8px] leading-none mt-0.5 sidebar-font font-bold tracking-widest uppercase" style={{ color: ACCENT }}>Member</p>
                </div>
              </div>
            )}

            {/* Menu */}
            <div className="relative">
              <button
                onClick={() => { setShowMenu(s => !s); setShowSettings(false); }}
                className={`nav-btn flex items-center gap-2 text-[10px] font-semibold tracking-[0.12em] uppercase px-4 py-2 rounded-xl ${showMenu ? 'active' : ''}`}
                style={{
                  background: showMenu ? 'rgba(196,255,13,0.08)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${showMenu ? 'rgba(196,255,13,0.3)' : 'rgba(255,255,255,0.07)'}`,
                  color: showMenu ? ACCENT : '#52525b',
                }}
              >
                <MoreHorizontal size={11} />
                Menu
              </button>

              {showMenu && (
                <div className="dropdown-enter absolute right-0 top-full mt-2 w-44 rounded-2xl overflow-hidden z-30" style={dropdownSurface}>
                  {[
                    { label: 'Credits',    icon: Star,     action: () => { setShowCredits(true); setShowMenu(false); },   danger: false },
                    { label: 'Disclaimer', icon: FileText,  action: () => { onShowDisclaimer(); setShowMenu(false); },     danger: false },
                    { label: 'Log Out',    icon: LogOut,    action: () => { clearAuth(); onLogout(); },                    danger: true  },
                  ].map((item, i, arr) => (
                    <button
                      key={item.label}
                      onClick={item.action}
                      className="nav-btn w-full flex items-center gap-3 px-4 py-3 text-[11px] font-semibold sidebar-font transition-colors"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        color: item.danger ? '#71717a' : '#71717a',
                        borderRadius: 0,
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = item.danger ? '#f87171' : '#fff'; (e.currentTarget as HTMLButtonElement).style.background = item.danger ? 'rgba(248,113,113,0.04)' : 'rgba(255,255,255,0.04)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#71717a'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                    >
                      <item.icon size={11} style={{ color: item.danger ? '#ef4444' : ACCENT }} />
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10 gap-4" style={{ backdropFilter: 'blur(4px)' }}>
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 rounded-full" style={{ border: '2px solid rgba(196,255,13,0.15)' }} />
              <div className="absolute inset-0 rounded-full animate-spin" style={{ border: '2px solid transparent', borderTopColor: ACCENT }} />
            </div>
            <p className="text-[10px] tracking-[0.2em] uppercase sidebar-font" style={{ color: '#52525b' }}>{loading}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 text-[11px] font-semibold px-4 py-2.5 rounded-xl z-10 sidebar-font"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
            {error}
          </div>
        )}

        {/* Empty state */}
        {!glbUrl && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-4 z-10">
            <div style={{ opacity: 0.15 }}>
              <Box size={40} strokeWidth={0.75} style={{ color: '#c4ff0d' }} />
            </div>
            <div className="text-center">
              <p className="display-font text-lg tracking-[0.25em]" style={{ color: '#27272a' }}>SELECT A VEHICLE</p>
              <p className="text-[10px] tracking-wider mt-1 sidebar-font" style={{ color: '#27272a' }}>Choose a model from the panel</p>
            </div>
          </div>
        )}

        {/* Capture buttons */}
        {glbUrl && (
          <div className="absolute bottom-6 right-6 flex flex-col items-end gap-2 z-10" style={{ animation: 'revealUp 0.3s ease both' }}>
            <div className="relative">
              <button
                onClick={() => setShowAngleMenu(o => !o)}
                className="nav-btn flex items-center gap-2 text-[10px] font-semibold tracking-[0.12em] uppercase px-4 py-2.5 rounded-xl"
                style={{
                  background: showAngleMenu ? 'rgba(196,255,13,0.08)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${showAngleMenu ? 'rgba(196,255,13,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  color: showAngleMenu ? ACCENT : '#52525b',
                  minWidth: 148,
                  backdropFilter: 'blur(16px)',
                }}
              >
                <Image size={10} />
                <span className="flex-1 text-left">Angle Shots</span>
                <ChevronDown size={9} style={{ transform: showAngleMenu ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
              </button>
              {showAngleMenu && (
                <div className="dropdown-enter-up absolute bottom-full mb-2 right-0 rounded-2xl overflow-hidden w-48 z-30" style={dropdownSurface}>
                  {([
                    { group: 'Sides' },
                    { side: 'front',       label: 'Front'       },
                    { side: 'back',        label: 'Back'        },
                    { side: 'left',        label: 'Left'        },
                    { side: 'right',       label: 'Right'       },
                    { group: 'Corners' },
                    { side: 'front-right', label: 'Front Right' },
                    { side: 'front-left',  label: 'Front Left'  },
                    { side: 'back-right',  label: 'Back Right'  },
                    { side: 'back-left',   label: 'Back Left'   },
                    { group: 'Top' },
                    { side: 'top',         label: 'Top Down'    },
                    { side: 'top-front',   label: 'Top Front'   },
                    { side: 'top-back',    label: 'Top Back'    },
                    { side: 'top-left',    label: 'Top Left'    },
                    { side: 'top-right',   label: 'Top Right'   },
                  ] as const).map((entry, i) => 'group' in entry ? (
                    <p key={i} className="px-3 pt-3 pb-1 text-[8px] font-bold uppercase tracking-[0.2em] display-font" style={{ color: '#3f3f46' }}>{entry.group}</p>
                  ) : (
                    <button
                      key={entry.side}
                      onClick={() => { handleShowcase(entry.side as ShowcaseSide); setShowAngleMenu(false); }}
                      className="w-full text-left px-4 py-2 text-[11px] sidebar-font transition-colors"
                      style={{ color: '#71717a', background: 'transparent' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(196,255,13,0.05)'; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#71717a'; }}
                    >
                      {entry.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleCapture}
              className="capture-btn flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl w-full"
              style={{ boxShadow: '0 4px 20px rgba(196,255,13,0.2)' }}
            >
              <Camera size={13} />
              CAPTURE
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="absolute bottom-5 left-8 z-20 pointer-events-none flex items-center gap-2.5" style={{ animation: 'fadeIn 1s ease 0.5s both', opacity: 0 }}>
          <div style={{ width: 20, height: 1, background: 'rgba(196,255,13,0.25)' }} />
          <p className="text-[9px] tracking-[0.22em] uppercase sidebar-font" style={{ color: '#3f3f46' }}>Developed by itzz industries</p>
        </div>

        {/* Credits modal */}
        {showCredits && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
            onMouseDown={e => { if (e.target === e.currentTarget) setShowCredits(false); }}
          >
            <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', animation: 'revealDown 0.25s cubic-bezier(0.16,1,0.3,1) both', boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }}>
              <div className="px-6 pt-6 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="display-font text-xl tracking-[0.2em]" style={{ color: '#a1a1aa' }}>CREDITS</p>
              </div>
              <div className="px-6 py-5 space-y-3">
                {[
                  { name: 'Sonarsilly', role: 'Backend Development' },
                  { name: 'Link',       role: 'Frontend Development' },
                ].map(p => (
                  <div key={p.name} className="px-4 py-4 rounded-xl flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-sm font-semibold sidebar-font" style={{ color: '#e4e4e7' }}>{p.name}</p>
                    <p className="text-[9px] font-bold uppercase tracking-widest sidebar-font" style={{ color: ACCENT }}>{p.role}</p>
                  </div>
                ))}
              </div>
              <div className="px-6 pb-6">
                <button
                  onClick={() => setShowCredits(false)}
                  className="capture-btn w-full py-3 rounded-xl"
                  style={{ boxShadow: '0 4px 16px rgba(196,255,13,0.15)' }}
                >
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Showcases */}
        {showShowcases && (
          <Showcases
            user={user}
            onClose={() => setShowShowcases(false)}
            currentLivery={glbUrl ? {
              modelId: selectedModel?.id ?? null, modelName: selectedModel?.name ?? null,
              modelPath: glbUrl, vehicleColor, panelNums: panelNums as Record<string, number>,
              textures, captureThumb: () => viewerRef.current?.captureThumbnail() ?? '',
            } satisfies CurrentLivery : undefined}
            onApplyLivery={(config: LiveryConfig) => {
              setVehicleColor(config.vehicleColor);
              setHexSidebarInput(config.vehicleColor.replace('#', '').toUpperCase());
              setPanelNums(config.panelNums as Record<PanelFace, number>);
              setTextures(config.textures);
              const model = MODELS.find(m => m.id === config.modelId);
              if (model) { setSelectedModel(model); setGlbUrl(model.path); applyLivery(model.path, config.vehicleColor, config.textures); }
              else if (glbUrl) applyLivery(glbUrl, config.vehicleColor, config.textures);
              viewerRef.current?.updateColor(config.vehicleColor);
              setShowShowcases(false);
            }}
          />
        )}
      </div>

      {/* ── Sidebar ── */}
      <div
        className="sidebar-scroll w-60 flex flex-col overflow-y-auto shrink-0"
        style={{
          background: 'rgba(5,5,5,0.99)',
          borderLeft: '1px solid rgba(255,255,255,0.05)',
          boxShadow: '-1px 0 0 rgba(196,255,13,0.04)',
        }}
      >
        {/* ── Sidebar Header ── */}
        <div
          className="relative flex flex-col items-center justify-center px-4 overflow-hidden"
          style={{
            paddingTop: 28,
            paddingBottom: 20,
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            minHeight: 110,
          }}
        >
          {/* Glow behind logo */}
          <div
            className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2"
            style={{
              width: 180,
              height: 70,
              background: 'radial-gradient(ellipse at top, rgba(196,255,13,0.1) 0%, transparent 70%)',
              animation: 'fadeIn 0.8s ease 0.2s both',
              opacity: 0,
            }}
          />

          {/* Logo */}
          <div style={{ animation: 'revealDown 0.5s cubic-bezier(0.16,1,0.3,1) 0.05s both', opacity: 0 }}>
            <img
              src="/Group_15.svg"
              alt="Livery Previewer"
              style={{ height: 52, width: 'auto', mixBlendMode: 'lighten', display: 'block' }}
            />
          </div>

          {/* Divider */}
          <div
            style={{
              marginTop: 14,
              width: '100%',
              height: 1,
              background: 'linear-gradient(to right, transparent 0%, rgba(196,255,13,0.4) 50%, transparent 100%)',
              transformOrigin: 'center',
              animation: 'expandX 0.6s cubic-bezier(0.16,1,0.3,1) 0.25s both',
              opacity: 0,
            }}
          />
        </div>

        {/* Model */}
        <Section title="Model" icon={Box} defaultOpen={true} count={filteredModels.length}>
          <VehicleSelector
            models={filteredModels}
            selectedModel={selectedModel}
            filterCat={filterCat}
            searchQuery={searchQuery}
            onSelectModel={handleSelectModel}
            onFilterCat={setFilterCat}
            onSearch={setSearchQuery}
          />
        </Section>

        {/* Presets */}
        <Section title="Presets" icon={Bookmark} count={presets.length}>
          <div className="flex gap-1.5">
            <input
              placeholder="Preset name…"
              value={presetName}
              onChange={e => setPresetName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSavePreset()}
              className="search-input flex-1 rounded-xl text-[11px] px-3 py-2 outline-none min-w-0"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#a1a1aa' }}
            />
            <button
              onClick={handleSavePreset}
              disabled={!presetName.trim() || savingPreset}
              className="capture-btn text-[10px] px-3 py-2 rounded-xl disabled:opacity-30 shrink-0"
              style={{ background: ACCENT, color: '#000', border: 'none', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em', fontSize: 11 }}
            >
              {savingPreset ? '…' : 'SAVE'}
            </button>
          </div>
          {presets.length === 0 ? (
            <p className="text-[9px] italic mt-1 sidebar-font" style={{ color: '#3f3f46' }}>No presets saved yet</p>
          ) : (
            <div className="sidebar-scroll space-y-1.5 mt-1 overflow-y-auto" style={{ maxHeight: 192 }}>
              {presets.map(preset => (
                <div key={preset.id} className="preset-row group flex items-center gap-1.5 rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <button className="flex-1 text-left px-3 py-2.5 min-w-0" onClick={() => handleLoadPreset(preset)}>
                    <p className="text-[10px] font-semibold sidebar-font truncate" style={{ color: '#d4d4d8' }}>{preset.name}</p>
                    <p className="text-[9px] sidebar-font truncate mt-0.5" style={{ color: '#52525b' }}>
                      {MODELS.find(m => m.id === preset.modelId)?.name ?? 'No model'} · {new Date(preset.createdAt).toLocaleDateString()}
                    </p>
                  </button>
                  <button
                    onClick={() => handleDeletePreset(preset.id)}
                    className="shrink-0 mr-3 opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                    style={{ color: '#52525b' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#52525b')}
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Vehicle Color */}
        <Section title="Vehicle Color" icon={Palette} defaultOpen={true}>
          <div className="flex items-center gap-3">
            <ColorPicker color={vehicleColor} onChange={handleColorChange} />
            <div className="flex items-center flex-1 rounded-xl text-[11px] px-3 py-2 gap-1.5 search-input"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <span className="sidebar-font font-mono" style={{ color: '#3f3f46' }}>#</span>
              <input
                value={hexSidebarInput}
                onChange={e => handleSidebarHexInput(e.target.value)}
                className="flex-1 bg-transparent font-mono uppercase outline-none min-w-0 text-[11px]"
                style={{ color: '#a1a1aa' }}
                maxLength={6}
                spellCheck={false}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {['#000000','#1a1a2e','#c0392b','#27ae60','#2980b9','#8e44ad','#f39c12','#ecf0f1','#2c2c2c'].map(c => (
              <button
                key={c}
                onClick={() => handleColorChange(c)}
                className="swatch w-6 h-6 rounded-lg"
                style={{ background: c }}
                title={c}
              />
            ))}
          </div>
        </Section>

        {/* Livery Textures */}
        <Section title="Livery Textures" icon={Image}>
          {!glbUrl && (
            <p className="text-[9px] italic sidebar-font" style={{ color: '#3f3f46' }}>Select a vehicle first</p>
          )}
          {glbUrl && PANELS.map(face => (
            <div key={face} className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <Label>{face}</Label>
                <div className="flex items-center gap-1.5 rounded-lg px-2 py-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <button
                    onClick={() => setPanelNums(p => ({ ...p, [face]: Math.max(1, p[face] - 1) }))}
                    className="w-4 h-4 flex items-center justify-center font-bold text-xs transition-colors"
                    style={{ color: '#3f3f46' }}
                    onMouseEnter={e => (e.currentTarget.style.color = ACCENT)}
                    onMouseLeave={e => (e.currentTarget.style.color = '#3f3f46')}
                  >−</button>
                  <span className="text-[9px] font-semibold sidebar-font min-w-[12px] text-center" style={{ color: '#71717a' }}>{panelNums[face]}</span>
                  <button
                    onClick={() => setPanelNums(p => ({ ...p, [face]: p[face] + 1 }))}
                    className="w-4 h-4 flex items-center justify-center font-bold text-xs transition-colors"
                    style={{ color: '#3f3f46' }}
                    onMouseEnter={e => (e.currentTarget.style.color = ACCENT)}
                    onMouseLeave={e => (e.currentTarget.style.color = '#3f3f46')}
                  >+</button>
                </div>
              </div>
              {getPanelKeys(face).map(panel => (
                <div key={panel} className="flex items-center gap-2 mb-1.5">
                  <span className="text-[9px] font-semibold sidebar-font w-10 shrink-0" style={{ color: '#52525b' }}>{panel}</span>
                  {textures[panel] ? (
                    <div className="flex-1 flex items-center gap-2 rounded-xl px-2.5 py-1.5" style={{ background: 'rgba(196,255,13,0.05)', border: '1px solid rgba(196,255,13,0.15)' }}>
                      <span className="flex-1 text-[9px] font-semibold sidebar-font truncate" style={{ color: ACCENT }}>✓ Loaded</span>
                      <button
                        onClick={() => handleRemoveTexture(panel)}
                        className="text-xs font-bold transition-colors"
                        style={{ color: '#ef4444' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#fca5a5')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#ef4444')}
                      >✕</button>
                    </div>
                  ) : (
                    <label className="flex-1 cursor-pointer rounded-xl px-2.5 py-1.5 text-[9px] flex items-center gap-1.5 transition-all sidebar-font"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.07)', color: '#52525b' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLLabelElement).style.borderColor = 'rgba(196,255,13,0.25)'; (e.currentTarget as HTMLLabelElement).style.color = '#a1a1aa'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLLabelElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLLabelElement).style.color = '#52525b'; }}
                    >
                      <Upload size={9} />
                      <span className="font-semibold">Upload</span>
                      <input type="file" accept="image/*"
                        onChange={e => e.target.files?.[0] && handleTextureUpload(panel, e.target.files[0])}
                        className="hidden" />
                    </label>
                  )}
                </div>
              ))}
            </div>
          ))}
        </Section>
      </div>
    </div>
  );
}
