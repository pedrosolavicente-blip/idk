import { useEffect, useRef, useState, useCallback } from 'react';
import MODELS, { type VehicleModel, type VehicleCategory } from '../../lib/models';
import type { DiscordUser } from '../../lib/discordAuth';
import { clearAuth } from '../../lib/discordAuth';
import { initLiveryViewer, type LiveryViewer as Viewer, type ShowcaseSide, type SceneSettings } from '../../lib/liveryEngine';
import { Upload, Camera, ChevronDown, ChevronRight, Palette, Box, Image, Search, LogOut, Settings, RotateCcw, Bookmark, X, MoreHorizontal, Users, Star, FileText } from 'lucide-react';
import type { ReactNode, ElementType } from 'react';
import ColorPicker from './ColorPicker';
import Showcases, { type CurrentLivery } from './Showcases';
import type { LiveryConfig } from '../../lib/showcaseApi';

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Liquid glass button style helper ────────────────────────────────────────

const glassBtn = (active = false) =>
  `flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase px-4 py-2 rounded-xl transition-all duration-200 border backdrop-blur-md ${
    active
      ? 'text-[#c4ff0d] bg-[#c4ff0d]/12 border-[#c4ff0d]/40 shadow-[0_0_16px_rgba(196,255,13,0.15),inset_0_1px_0_rgba(255,255,255,0.1)]'
      : 'text-zinc-400 hover:text-white bg-white/4 border-white/10 hover:bg-white/8 hover:border-white/20 shadow-[0_2px_12px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)]'
  }`;

// ─── Liquid Glass panel ───────────────────────────────────────────────────────

function GlassPanel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`animate-settings-in border border-white/10 rounded-2xl overflow-hidden ${className}`}
      style={{
        background: 'rgba(8,8,8,0.78)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        boxShadow: '0 8px 48px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.07), inset 0 -1px 0 rgba(0,0,0,0.3)',
      }}
    >
      {children}
    </div>
  );
}

// ─── Small shared components ──────────────────────────────────────────────────

function ModelListItem({ model, selected, onClick }: { model: VehicleModel; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg px-3 py-2.5 transition-all duration-300 ${
        selected
          ? 'bg-gradient-to-r from-[#c4ff0d]/20 to-transparent border border-[#c4ff0d]/50 text-white shadow-lg shadow-[#c4ff0d]/10'
          : 'border border-white/5 bg-white/5 hover:bg-white/10 hover:border-[#c4ff0d]/30 text-zinc-400 hover:text-zinc-200'
      }`}
    >
      <p className={`text-xs font-semibold truncate ${selected ? 'text-white' : ''}`}>{model.name}</p>
    </button>
  );
}

function Section({ title, icon: Icon, children, defaultOpen = false }: {
  title: string; icon: ElementType; children: ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/5">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 px-4 py-3.5 text-xs font-bold tracking-wider uppercase text-zinc-300 hover:text-[#c4ff0d] transition-colors duration-200 group"
      >
        <Icon size={13} style={{ color: ACCENT }} />
        <span className="flex-1 text-left">{title}</span>
        {open
          ? <ChevronDown size={13} className="text-zinc-500 group-hover:text-[#c4ff0d] transition-colors" />
          : <ChevronRight size={13} className="text-zinc-500 group-hover:text-[#c4ff0d] transition-colors" />}
      </button>
      {open && <div className="px-4 pb-4 pt-1 space-y-3">{children}</div>}
    </div>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">{children}</p>;
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props { user: DiscordUser | null; onLogout: () => void; onShowDisclaimer: () => void; }

const AVAILABLE_CATEGORIES: VehicleCategory[] = ['PD', 'FD', 'DOT'];

export default function LiveryViewer({ user, onLogout, onShowDisclaimer }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef    = useRef<Viewer | null>(null);

  const [glbUrl, setGlbUrl]                 = useState('');
  const [selectedModel, setSelectedModel]   = useState<VehicleModel | null>(null);
  const [vehicleColor, setVehicleColor]     = useState('#000000');
  const [hexSidebarInput, setHexSidebarInput] = useState('000000');
  const [textures, setTextures]             = useState<Record<string, string>>({});
  const [loading, setLoading]               = useState<string | null>(null);
  const [error, setError]                   = useState<string | null>(null);
  const [panelNums, setPanelNums]           = useState<Record<PanelFace, number>>({ Left:1, Right:1, Top:1, Front:1, Back:1 });
  const [searchQuery, setSearchQuery]       = useState('');
  const [filterCat, setFilterCat]           = useState<VehicleCategory | 'All'>('All');
  const [showSettings, setShowSettings]     = useState(false);
  const [showAngleMenu, setShowAngleMenu]   = useState(false);
  const [settings, setSettings]             = useState<SceneSettings>({ ...DEFAULT_SETTINGS });
  const [showMenu, setShowMenu]           = useState(false);
  const [showCredits, setShowCredits]     = useState(false);
  const [showShowcases, setShowShowcases] = useState(false);

  // Preset state
  const userId   = user?.id ?? 'guest';
  const [presets, setPresets]         = useState<LiveryPreset[]>(() => loadPresets(userId));
  const [presetName, setPresetName]   = useState('');
  const [savingPreset, setSavingPreset] = useState(false);

  // ─── Engine init ───
  useEffect(() => {
    const viewer = initLiveryViewer(containerRef.current!);
    viewerRef.current = viewer;
    return () => viewer.dispose();
  }, []);

  useEffect(() => {
    if (!viewerRef.current) return;
    viewerRef.current.updateScene(settings);
  }, [settings]);

  // ─── Livery loading ───
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

  // ─── Colour ───
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

  // ─── Textures ───
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

  // ─── Capture ───
  const downloadDataUrl = (dataUrl: string, filename: string) => {
    const a = document.createElement('a');
    a.href     = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCapture = () => {
    if (!viewerRef.current) return;
    downloadDataUrl(
      viewerRef.current.captureThumbnail(),
      `${selectedModel?.name ?? 'livery-preview'}-${Date.now()}.png`,
    );
  };

  const handleShowcase = (side: ShowcaseSide) => {
    if (!viewerRef.current) return;
    downloadDataUrl(
      viewerRef.current.captureShowcase(side),
      `${selectedModel?.name ?? 'livery'}-${side}-${Date.now()}.png`,
    );
  };

  const handleBgCustomUpload = (file: File) => {
    const url   = URL.createObjectURL(file);
    const isEXR = file.name.toLowerCase().endsWith('.exr');
    setSettings(s => ({ ...s, background: 'custom', bgCustomUrl: url, bgCustomIsEXR: isEXR }));
  };

  const handleResetSettings = () => setSettings({ ...DEFAULT_SETTINGS });

  // ─── Presets ───
  const handleSavePreset = async () => {
    if (!presetName.trim()) return;
    setSavingPreset(true);
    try {
      const persistedTextures: Record<string, string> = {};
      await Promise.all(
        Object.entries(textures).map(async ([panel, url]) => {
          persistedTextures[panel] = await blobUrlToDataUrl(url);
        }),
      );
      const preset: LiveryPreset = {
        id:           crypto.randomUUID(),
        name:         presetName.trim(),
        createdAt:    Date.now(),
        modelId:      selectedModel?.id ?? null,
        vehicleColor,
        panelNums:    { ...panelNums },
        textures:     persistedTextures,
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
      setSelectedModel(model);
      setGlbUrl(model.path);
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

  // Liquid glass CSS classes for reused polished buttons
  const glassButtonClass = "flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase px-4 py-2 rounded-xl transition-all duration-300 bg-white/10 backdrop-blur-md border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_4px_12px_rgba(0,0,0,0.1)] hover:bg-white/20 hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_8px_20px_rgba(0,0,0,0.15)]";

  // ─── Render ───
  return (
    <div className="flex h-screen bg-black text-white overflow-hidden" style={{ fontFamily: '"Inter", sans-serif' }}>

      {/* ── 3-D Viewport ── */}
      <div className="relative flex-1 bg-gradient-to-br from-black via-zinc-950 to-black" ref={containerRef}>
        
        {/* Background Big Image */}
        <img src="/Vector_(7).png" alt="" className="absolute inset-0 w-full h-full object-cover opacity-15 pointer-events-none mix-blend-screen" />

        {/* Developer Credits - More Visible */}
        <div className="absolute bottom-4 left-6 z-10 pointer-events-none">
          <p className="text-xs font-medium tracking-wide text-white/80 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            developed by itzz industries | sonar & itzz_link
          </p>
        </div>

        {/* Credits modal */}
        {showCredits && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
            onMouseDown={e => { if (e.target === e.currentTarget) setShowCredits(false); }}
          >
            <div className="bg-[#0f0f0f]/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              {/* Header */}
              <div className="px-6 pt-6 pb-4 text-center border-b border-white/5">
                <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 mb-1">Built by</p>
                <p className="text-lg font-black tracking-widest uppercase text-white">itzz industries</p>
                <div className="mt-3 h-px bg-gradient-to-r from-transparent via-[#c4ff0d]/40 to-transparent" />
              </div>

              <div className="px-6 py-5 space-y-3">
                {/* Sonarsilly */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                  <p className="text-sm font-bold text-white">Sonarsilly</p>
                  <p className="text-[10px] text-[#c4ff0d] font-semibold uppercase tracking-widest mt-1">Backend Development</p>
                </div>
                {/* Link */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                  <p className="text-sm font-bold text-white">Link</p>
                  <p className="text-[10px] text-[#c4ff0d] font-semibold uppercase tracking-widest mt-1">Frontend Development</p>
                </div>
              </div>

              <div className="px-6 pb-5">
                <button
                  onClick={() => setShowCredits(false)}
                  className="w-full text-xs font-bold bg-[#c4ff0d] hover:bg-[#d4ff3d] text-black py-2.5 rounded-xl transition-all duration-300 shadow-lg shadow-[#c4ff0d]/20 hover:shadow-[#c4ff0d]/40 hover:-translate-y-0.5"
                >
                  Close
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
              modelId:      selectedModel?.id ?? null,
              modelName:    selectedModel?.name ?? null,
              modelPath:    glbUrl,
              vehicleColor,
              panelNums:    panelNums as Record<string, number>,
              textures,
              captureThumb: () => viewerRef.current?.captureThumbnail() ?? '',
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

        {/* ── Glassmorphism Navbar ── */}
        <nav
          className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4"
        >
          {/* Left: logo */}
          <img src="/itzz.svg" alt="itzz" className="h-7 w-auto drop-shadow-lg" />

          {/* Center: Settings panel inline */}
          <div className="flex items-center gap-3">

            {/* Settings toggle */}
            <div className="relative">
              <button
                onClick={() => { setShowSettings(s => !s); setShowMenu(false); }}
                className={`${glassButtonClass} ${
                  showSettings ? 'text-[#c4ff0d] border-[#c4ff0d]/50 bg-white/20' : 'text-zinc-300 hover:text-white'
                }`}
              >
                <Settings size={14} />
                Settings
              </button>

              {showSettings && (
                <div className="animate-settings-in absolute left-0 top-full mt-3 w-72 bg-[#0a0a0a]/80 border border-white/20 rounded-2xl p-5 backdrop-blur-xl shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-300">Scene Settings</p>
                    <button
                      onClick={handleResetSettings}
                      className="flex items-center gap-1.5 text-[10px] text-zinc-400 hover:text-[#c4ff0d] transition-colors"
                    >
                      <RotateCcw size={10} />
                      Reset
                    </button>
                  </div>

                  {/* Brightness */}
                  <div className="mb-4">
                    <Label>Brightness — {settings.brightness.toFixed(2)}</Label>
                    <input
                      type="range" min={0.1} max={3} step={0.05}
                      value={settings.brightness}
                      onChange={e => setSettings(s => ({ ...s, brightness: parseFloat(e.target.value) }))}
                      className="w-full accent-[#c4ff0d]"
                    />
                  </div>

                  {/* Sky Rotation */}
                  <div className="mb-4 space-y-2">
                    <Label>Sky Rotation</Label>
                    {([
                      { key: 'skyRotX' as const, label: 'X', min: -180, max: 180 },
                      { key: 'skyRotY' as const, label: 'Y', min: -180, max: 180 },
                      { key: 'skyRotZ' as const, label: 'Z', min: -180, max: 180 },
                    ]).map(({ key, label, min, max }) => (
                      <div key={key}>
                        <p className="text-[10px] text-zinc-500 mb-1">{label} — {settings[key].toFixed(1)}°</p>
                        <input
                          type="range" min={min} max={max} step={0.5}
                          value={settings[key]}
                          onChange={e => setSettings(s => ({ ...s, [key]: parseFloat(e.target.value) }))}
                          className="w-full accent-[#c4ff0d]"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Background */}
                  <div>
                    <Label>Skybox</Label>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {(['default', 'sunset', 'night'] as const).map(bg => (
                        <button
                          key={bg}
                          onClick={() => setSettings(s => ({ ...s, background: bg, ...SKYBOX_LIGHTING[bg] }))}
                          className={`text-[10px] font-bold px-2 py-2 rounded-xl border transition-all duration-300 capitalize ${
                            settings.background === bg
                              ? 'border-[#c4ff0d]/50 bg-[#c4ff0d]/10 text-[#c4ff0d] shadow-[inset_0_1px_0_rgba(196,255,13,0.2)]'
                              : 'border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          {bg === 'default' ? 'Default' : bg === 'sunset' ? 'Sunset' : 'Night'}
                        </button>
                      ))}
                    </div>
                    <label className={`w-full text-[10px] font-bold px-2 py-2 rounded-xl border transition-all duration-300 cursor-pointer text-center block ${
                      settings.background === 'custom'
                        ? 'border-[#c4ff0d]/50 bg-[#c4ff0d]/10 text-[#c4ff0d] shadow-[inset_0_1px_0_rgba(196,255,13,0.2)]'
                        : 'border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                    }`}>
                      Custom
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
              className={`${glassButtonClass} text-zinc-300 hover:text-white`}
            >
              <Users size={14} />
              Showcases
            </button>

          </div>

          {/* Right: menu */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => { setShowMenu(s => !s); setShowSettings(false); }}
                className={`${glassButtonClass} ${
                  showMenu ? 'text-[#c4ff0d] border-[#c4ff0d]/50 bg-white/20' : 'text-zinc-300 hover:text-white'
                }`}
              >
                <MoreHorizontal size={14} />
                Menu
              </button>

              {showMenu && (
                <div className="animate-settings-in absolute right-0 top-full mt-3 w-48 bg-[#0a0a0a]/80 border border-white/20 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl">
                  <button
                    onClick={() => { setShowCredits(true); setShowMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-xs font-bold text-zinc-300 hover:text-white hover:bg-white/10 transition-all border-b border-white/10"
                  >
                    <Star size={14} style={{ color: ACCENT }} />
                    Credits
                  </button>
                  <button
                    onClick={() => { onShowDisclaimer(); setShowMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-xs font-bold text-zinc-300 hover:text-white hover:bg-white/10 transition-all border-b border-white/10"
                  >
                    <FileText size={14} style={{ color: ACCENT }} />
                    Disclaimer
                  </button>
                  <button
                    onClick={() => { clearAuth(); onLogout(); }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-xs font-bold text-zinc-300 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <LogOut size={14} className="text-red-500" />
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Loading overlay */}
        {loading && (
           <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-10 gap-3">
            <div className="w-8 h-8 border-2 border-zinc-600 border-t-white rounded-full animate-spin shadow-lg" />
            <p className="text-xs tracking-widest uppercase text-white font-medium">{loading}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-red-900/80 border border-red-500/50 backdrop-blur-md text-white font-medium text-xs px-5 py-2.5 rounded-xl z-10 shadow-2xl">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!glbUrl && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-4">
            <div className="relative">
               <Box size={56} className="text-zinc-700 drop-shadow-md" strokeWidth={1.5} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-[#c4ff0d]/10 rounded-full blur-2xl" />
              </div>
            </div>
            <div className="text-center">
               <p className="text-sm font-bold tracking-wider uppercase text-zinc-400 mb-1 drop-shadow-md">Select a Vehicle</p>
              <p className="text-[11px] font-medium tracking-wider text-zinc-600">Choose from the sidebar to begin</p>
            </div>
          </div>
        )}

        {/* Capture buttons */}
        {glbUrl && (
          <div className="absolute bottom-8 right-8 flex flex-col items-end gap-3 z-20">
            {/* Angle shots dropdown */}
            <div className="relative w-full">
              <button
                onClick={() => setShowAngleMenu(o => !o)}
                className="flex items-center justify-between gap-2 bg-black/40 backdrop-blur-xl border border-white/20 hover:bg-white/10 hover:border-white/30 text-zinc-200 hover:text-white text-[11px] font-bold px-4 py-2.5 rounded-xl transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_4px_12px_rgba(0,0,0,0.2)] w-full"
              >
                <span className="flex items-center gap-2"><Image size={12} />Angle Shots</span>
                <ChevronDown size={12} className={`transition-transform duration-300 ${showAngleMenu ? 'rotate-180' : ''}`} />
              </button>
              {showAngleMenu && (
                <div className="absolute bottom-full mb-2 right-0 bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl overflow-hidden w-52">
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
                  ].map((entry, i) => 'group' in entry ? (
                    <p key={i} className="px-4 pt-3 pb-1 text-[9px] font-black uppercase tracking-widest text-zinc-500 bg-white/5">{entry.group}</p>
                  ) : (
                    <button
                      key={entry.side}
                      onClick={() => { handleShowcase(entry.side as ShowcaseSide); setShowAngleMenu(false); }}
                      className="w-full flex items-center px-4 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-[#c4ff0d]/20 transition-all duration-300 text-left"
                    >
                      {entry.label}
                    </button>
                  )))}
                </GlassPanel>
              )}
            </div>
            {/* Freeform capture */}
             <button
              onClick={handleCapture}
              className="flex items-center justify-center gap-2 bg-gradient-to-b from-[#d4ff3d] to-[#c4ff0d] text-black text-xs font-black tracking-wide px-5 py-3 rounded-xl transition-all duration-300 border border-[#d4ff3d]/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),0_8px_16px_rgba(196,255,13,0.25)] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_12px_24px_rgba(196,255,13,0.4)] hover:-translate-y-1 w-full"
            >
              <Camera size={14} />
              CAPTURE
            </button>
          </div>
        )}

        {/* Developer watermark — now visible */}
        <p
          className="absolute bottom-4 left-5 text-[10px] font-semibold tracking-widest uppercase select-none pointer-events-none"
          style={{ color: 'rgba(196,255,13,0.5)' }}
        >
          Developed by itzz industries
        </p>

      </div>

      {/* ── Sidebar ── */}
      <div className="w-72 flex flex-col border-l border-white/10 bg-[#080808]/95 backdrop-blur-2xl overflow-y-auto shadow-[-8px_0_24px_rgba(0,0,0,0.5)] z-30 relative">

        {/* Header */}
        <div className="px-5 py-6 border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent">
          <img src="/Group_15.svg" alt="Livery Previewer" className="h-16 w-auto mb-3 drop-shadow-md" />
          <div className="h-[2px] bg-gradient-to-r from-[#c4ff0d] to-transparent mb-3 rounded-full opacity-80" />
           <p className="text-[11px] text-zinc-400 tracking-wider uppercase font-bold">
            {user ? (user.global_name ?? user.username) : 'ERLC Vehicle Previewer'}
          </p>
        </div>

        {/* ── Model section ── */}
        <Section title="Model" icon={Box} defaultOpen={true}>
          {/* Category filter */}
          <div className="flex gap-1.5 mb-3">
            <button
              onClick={() => setFilterCat('All')}
              className={`flex-1 text-[10px] font-bold py-2 rounded-xl border transition-all duration-300 ${
                filterCat === 'All'
                  ? 'border-[#c4ff0d]/50 bg-[#c4ff0d]/15 text-[#c4ff0d] shadow-[inset_0_1px_0_rgba(196,255,13,0.2)]'
                  : 'border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              All
            </button>
            {AVAILABLE_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                className={`flex-1 text-[10px] font-bold py-2 rounded-xl border transition-all duration-300 ${
                  filterCat === cat
                    ? 'border-[#c4ff0d]/50 bg-[#c4ff0d]/15 text-[#c4ff0d] shadow-[inset_0_1px_0_rgba(196,255,13,0.2)]'
                    : 'border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative mb-3 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[#c4ff0d] transition-colors duration-300" size={14} />
            <input
              type="text"
              placeholder="Search vehicles..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl text-xs pl-9 pr-3 py-3 text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-[#c4ff0d]/50 focus:bg-white/10 transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
            />
          </div>

          <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
            {filteredModels.length > 0
              ? filteredModels.map(m => (
                  <ModelListItem
                    key={m.id}
                    model={m}
                    selected={selectedModel?.id === m.id}
                    onClick={() => handleSelectModel(m)}
                  />
                ))
              : (
                <div className="text-center py-8 text-zinc-600 text-xs bg-white/5 rounded-xl border border-white/5">
                  <Box size={28} className="mx-auto mb-2 opacity-40" strokeWidth={1.5} />
                  <p className="font-bold uppercase tracking-wider text-[10px]">No vehicles found</p>
                </div>
              )
            }
          </div>
        </Section>

        {/* ── Presets section ── */}
        <Section title="Presets" icon={Bookmark} defaultOpen={false}>
          <div className="flex gap-2">
            <input
              placeholder="Preset name…"
              value={presetName}
              onChange={e => setPresetName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSavePreset()}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl text-xs px-3 py-2.5 text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-[#c4ff0d]/50 focus:bg-white/10 transition-all duration-300 min-w-0 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
            />
            <button
              onClick={handleSavePreset}
              disabled={!presetName.trim() || savingPreset}
              className="text-[10px] font-bold px-3.5 py-2.5 rounded-xl bg-gradient-to-b from-[#d4ff3d] to-[#c4ff0d] text-black disabled:opacity-30 disabled:grayscale hover:brightness-110 transition-all duration-300 shrink-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]"
            >
              {savingPreset ? '…' : 'Save'}
            </button>
          </div>

          {presets.length === 0 ? (
            <p className="text-[11px] text-zinc-600 font-medium italic mt-2 text-center">No presets saved yet</p>
          ) : (
            <div className="space-y-2 mt-3 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
              {presets.map(preset => (
                <div
                  key={preset.id}
                  className="group flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:border-[#c4ff0d]/40 hover:bg-white/10 transition-all duration-300 overflow-hidden shadow-sm"
                >
                  <button
                    className="flex-1 text-left px-3 py-2.5 min-w-0"
                    onClick={() => handleLoadPreset(preset)}
                  >
                    <p className="text-[11px] font-bold text-zinc-200 truncate">{preset.name}</p>
                    <p className="text-[10px] text-zinc-500 font-medium truncate mt-0.5">
                      {MODELS.find(m => m.id === preset.modelId)?.name ?? 'No model'} · {new Date(preset.createdAt).toLocaleDateString()}
                    </p>
                  </button>
                  <button
                    onClick={() => handleDeletePreset(preset.id)}
                    className="shrink-0 mr-2 text-zinc-600 hover:text-white hover:bg-red-500/80 p-1.5 rounded-lg transition-all duration-300 opacity-0 group-hover:opacity-100"
                    title="Delete preset"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ── Vehicle Colour section ── */}
        <Section title="Vehicle Color" icon={Palette} defaultOpen={true}>
          <div className="flex items-center gap-3">
            <ColorPicker color={vehicleColor} onChange={handleColorChange} />
            {/* Editable hex field */}
            <div className="flex items-center flex-1 bg-white/5 border border-white/10 rounded-xl text-xs px-3 py-2.5 gap-1.5 focus-within:border-[#c4ff0d]/50 focus-within:bg-white/10 transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]">
              <span className="text-zinc-500 font-mono font-bold">#</span>
              <input
                value={hexSidebarInput}
                onChange={e => handleSidebarHexInput(e.target.value)}
                className="flex-1 bg-transparent text-zinc-200 font-mono font-bold uppercase outline-none min-w-0 tracking-wider"
                maxLength={6}
                spellCheck={false}
              />
            </div>
          </div>
           <div className="flex flex-wrap gap-2.5 mt-4">
            {['#000000','#1a1a2e','#c0392b','#27ae60','#2980b9','#8e44ad','#f39c12','#ecf0f1','#2c2c2c'].map(c => (
              <button
                key={c}
                onClick={() => handleColorChange(c)}
                style={{ background: c }}
                className="w-7 h-7 rounded-xl border-2 border-white/10 hover:-translate-y-1 hover:border-[#c4ff0d] transition-all duration-300 shadow-md"
                title={c}
              />
            ))}
          </div>
        </Section>

        {/* ── Livery Textures section ── */}
        <Section title="Livery Textures" icon={Image}>
           {!glbUrl && (
            <div className="text-center py-4 bg-white/5 rounded-xl border border-white/5">
              <p className="text-[11px] text-zinc-500 font-medium italic">Select a vehicle first</p>
            </div>
          )}
          {glbUrl && PANELS.map(face => (
            <div key={face} className="mb-4 bg-black/20 p-3 rounded-xl border border-white/5">
              <div className="flex items-center justify-between mb-3">
                 <Label>{face}</Label>
                <div className="flex items-center gap-2 bg-white/10 rounded-lg px-2 py-1 border border-white/10 backdrop-blur-sm">
                  <button
                    onClick={() => setPanelNums(p => ({ ...p, [face]: Math.max(1, p[face] - 1) }))}
                    className="text-zinc-400 hover:text-[#c4ff0d] text-xs w-5 h-5 flex items-center justify-center font-bold transition-colors bg-white/5 rounded-md"
                  >−</button>
                  <span className="text-[11px] text-zinc-200 font-bold min-w-[14px] text-center">{panelNums[face]}</span>
                  <button
                    onClick={() => setPanelNums(p => ({ ...p, [face]: p[face] + 1 }))}
                     className="text-zinc-400 hover:text-[#c4ff0d] text-xs w-5 h-5 flex items-center justify-center font-bold transition-colors bg-white/5 rounded-md"
                  >+</button>
                </div>
              </div>
              {getPanelKeys(face).map(panel => (
                <div key={panel} className="flex items-center gap-2.5 mb-2">
                  <span className="text-[10px] text-zinc-400 w-12 font-bold tracking-widest uppercase">{panel}</span>
                  {textures[panel] ? (
                    <div className="flex-1 flex items-center gap-2 bg-[#c4ff0d]/15 border border-[#c4ff0d]/40 rounded-xl px-3 py-2 shadow-[inset_0_1px_0_rgba(196,255,13,0.2)]">
                      <span className="flex-1 text-[10px] text-[#c4ff0d] truncate font-bold tracking-widest">✓ LOADED</span>
                      <button onClick={() => handleRemoveTexture(panel)} className="text-red-400 hover:text-white hover:bg-red-500/80 p-1 rounded transition-all duration-300">
                        <X size={12} strokeWidth={3} />
                      </button>
                     </div>
                  ) : (
                    <label className="flex-1 cursor-pointer bg-white/5 hover:bg-white/10 border border-white/20 hover:border-[#c4ff0d]/50 border-dashed rounded-xl px-3 py-2 text-[11px] text-zinc-400 hover:text-white flex items-center justify-center gap-2 transition-all duration-300 group">
                      <Upload size={12} className="group-hover:-translate-y-0.5 transition-transform duration-300" />
                       <span className="font-semibold tracking-wide">Upload</span>
                      <input
                        type="file" accept="image/*"
                        onChange={e => e.target.files?.[0] && handleTextureUpload(panel, e.target.files[0])}
                        className="hidden"
                      />
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
