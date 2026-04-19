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

// ─── Shared styles ────────────────────────────────────────────────────────────

const glassBtn = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
} as const;

const glassBtnLime = {
  color: ACCENT,
  background: 'rgba(196,255,13,0.07)',
  border: '1px solid rgba(196,255,13,0.22)',
} as const;

const glassBtnActive = {
  background: 'rgba(196,255,13,0.10)',
  border: '1px solid rgba(196,255,13,0.35)',
  boxShadow: '0 0 16px rgba(196,255,13,0.12), inset 0 0 0 1px rgba(196,255,13,0.1)',
} as const;

const navbarStyle = {
  paddingTop: '10px',
  paddingBottom: '10px',
  background: 'rgba(4,4,4,0.97)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
  boxShadow: '0 1px 0 0 rgba(196,255,13,0.08)',
} as const;

const dropdownStyle = {
  background: 'rgba(6,6,6,0.98)',
  border: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
} as const;

// ─── GlassButton component — handles hover green-sweep effect ─────────────────

interface GlassBtnProps {
  onClick?: () => void;
  active?: boolean;
  lime?: boolean;
  className?: string;
  children: ReactNode;
  style?: React.CSSProperties;
  disabled?: boolean;
  title?: string;
}

function GlassButton({ onClick, active, lime, className = '', children, style = {}, disabled, title }: GlassBtnProps) {
  const [hovered, setHovered] = useState(false);

  const baseStyle = active ? glassBtnActive : lime ? glassBtnLime : glassBtn;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative overflow-hidden transition-all duration-200 ${className}`}
      style={{
        ...baseStyle,
        ...style,
        ...(hovered && !active && !lime ? {
          borderColor: 'rgba(196,255,13,0.28)',
          boxShadow: '0 0 14px rgba(196,255,13,0.07), inset 0 0 0 1px rgba(196,255,13,0.08)',
        } : {}),
        transform: hovered ? 'scale(1.01)' : 'scale(1)',
      }}
    >
      {/* Green sweep from right on hover */}
      <span
        className="pointer-events-none absolute inset-y-0 right-0 transition-all duration-300"
        style={{
          width: hovered ? '55%' : '0%',
          background: 'linear-gradient(to left, rgba(196,255,13,0.13) 0%, transparent 100%)',
          borderRadius: 'inherit',
        }}
      />
      <span className="relative z-10 flex items-center gap-1.5">{children}</span>
    </button>
  );
}

// ─── Small shared components ──────────────────────────────────────────────────

function ModelListItem({ model, selected, onClick }: { model: VehicleModel; selected: boolean; onClick: () => void }) {
  return (
    <GlassButton
      onClick={onClick}
      active={selected}
      className="w-full text-left rounded-xl px-3 py-2.5 text-[11px] font-semibold truncate"
      style={{ color: selected ? ACCENT : '#71717a', justifyContent: 'flex-start' }}
    >
      {model.name}
    </GlassButton>
  );
}

function Section({ title, icon: Icon, children, defaultOpen = false }: {
  title: string; icon: ElementType; children: ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 px-4 py-3 transition-colors group"
      >
        <Icon size={11} style={{ color: ACCENT }} />
        <span className="flex-1 text-left text-[10px] font-black tracking-widest uppercase text-zinc-500 group-hover:text-white transition-colors">{title}</span>
        {open
          ? <ChevronDown size={10} className="text-zinc-700 group-hover:text-[#c4ff0d] transition-colors" />
          : <ChevronRight size={10} className="text-zinc-700 group-hover:text-[#c4ff0d] transition-colors" />}
      </button>
      {open && <div className="px-4 pb-4 pt-1 space-y-2.5">{children}</div>}
    </div>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <p className="text-[9px] uppercase tracking-widest text-zinc-600 mb-1.5">
      {children}
    </p>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props { user: DiscordUser | null; onLogout: () => void; onShowDisclaimer: () => void; }

const AVAILABLE_CATEGORIES: VehicleCategory[] = ['PD', 'FD', 'DOT'];

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
  const [presets, setPresets]         = useState<LiveryPreset[]>(() => loadPresets(userId));
  const [presetName, setPresetName]   = useState('');
  const [savingPreset, setSavingPreset] = useState(false);

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

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-[#080808] text-white overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ── 3-D Viewport ── */}
      <div className="relative flex-1 overflow-hidden" ref={containerRef}>

        {/* Background glows */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <img src="/Vector_(7).svg" alt="" aria-hidden="true"
            style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '92%', height: 'auto',
              opacity: 0.03, filter: 'brightness(0) invert(1)', pointerEvents: 'none',
            }}
          />
          <div className="absolute -top-32 -right-32 rounded-full" style={{ width: 700, height: 700, opacity: 0.15, background: 'radial-gradient(circle, #c4ff0d 0%, transparent 65%)' }} />
          <div className="absolute -bottom-24 -left-24 rounded-full" style={{ width: 500, height: 500, opacity: 0.08, background: 'radial-gradient(circle, #88ff00 0%, transparent 65%)' }} />
          <div className="absolute rounded-full" style={{ width: 500, height: 500, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', opacity: 0.05, background: 'radial-gradient(circle, #c4ff0d 0%, transparent 60%)' }} />
        </div>

        {/* Credits modal */}
        {showCredits && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onMouseDown={e => { if (e.target === e.currentTarget) setShowCredits(false); }}
          >
            <div className="w-full max-w-sm overflow-hidden rounded-2xl shadow-2xl" style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Credits</p>
                <button onClick={() => setShowCredits(false)} className="text-zinc-600 hover:text-white transition-colors text-xs">✕</button>
              </div>
              <div className="px-5 py-5 space-y-3">
                {[
                  { name: 'Sonarsilly', role: 'Backend Development' },
                  { name: 'Link',       role: 'Frontend Development' },
                ].map(p => (
                  <div key={p.name} className="px-4 py-4 rounded-xl" style={glassBtn}>
                    <p className="text-sm font-bold text-white">{p.name}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{ color: ACCENT }}>{p.role}</p>
                  </div>
                ))}
              </div>
              <div className="px-5 pb-5">
                <button
                  onClick={() => setShowCredits(false)}
                  className="w-full text-xs font-black tracking-widest uppercase bg-[#c4ff0d] hover:bg-[#d4ff3d] text-black py-2.5 rounded-xl transition-all"
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

        {/* ── Navbar ── */}
        <nav className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-8" style={navbarStyle}>

          <img src="/itzz.svg" alt="itzz" className="h-7 w-auto" />

          {/* Center */}
          <div className="flex items-center gap-2">
            {/* Settings */}
            <div className="relative">
              <GlassButton
                onClick={() => { setShowSettings(s => !s); setShowMenu(false); }}
                active={showSettings}
                className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-4 py-2 rounded-lg"
                style={{ color: showSettings ? ACCENT : '#71717a' }}
              >
                <Settings size={11} style={{ color: showSettings ? ACCENT : '#71717a' }} />
                Settings
              </GlassButton>

              {showSettings && (
                <div className="absolute left-0 top-full mt-2 w-72 rounded-2xl p-4 shadow-2xl z-30" style={dropdownStyle}>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Scene Settings</p>
                    <button onClick={handleResetSettings} className="flex items-center gap-1.5 text-[10px] text-zinc-600 hover:text-[#c4ff0d] transition-colors">
                      <RotateCcw size={10} /> Reset
                    </button>
                  </div>

                  <div className="mb-4">
                    <Label>Brightness — {settings.brightness.toFixed(2)}</Label>
                    <input type="range" min={0.1} max={3} step={0.05} value={settings.brightness}
                      onChange={e => setSettings(s => ({ ...s, brightness: parseFloat(e.target.value) }))}
                      className="w-full accent-[#c4ff0d]" />
                  </div>

                  <div className="mb-4 space-y-2">
                    <Label>Sky Rotation</Label>
                    {([
                      { key: 'skyRotX' as const, label: 'X' },
                      { key: 'skyRotY' as const, label: 'Y' },
                      { key: 'skyRotZ' as const, label: 'Z' },
                    ]).map(({ key, label }) => (
                      <div key={key}>
                        <p className="text-[9px] text-zinc-600 mb-1">{label} — {settings[key].toFixed(1)}°</p>
                        <input type="range" min={-180} max={180} step={0.5} value={settings[key]}
                          onChange={e => setSettings(s => ({ ...s, [key]: parseFloat(e.target.value) }))}
                          className="w-full accent-[#c4ff0d]" />
                      </div>
                    ))}
                  </div>

                  <div>
                    <Label>Skybox</Label>
                    <div className="grid grid-cols-3 gap-1.5 mb-2">
                      {(['default', 'sunset', 'night'] as const).map(bg => (
                        <GlassButton key={bg}
                          onClick={() => setSettings(s => ({ ...s, background: bg, ...SKYBOX_LIGHTING[bg] }))}
                          active={settings.background === bg}
                          className="text-[10px] font-bold px-2 py-1.5 rounded-lg capitalize"
                          style={{ color: settings.background === bg ? ACCENT : '#52525b' }}
                        >
                          {bg === 'default' ? 'Default' : bg === 'sunset' ? 'Sunset' : 'Night'}
                        </GlassButton>
                      ))}
                    </div>
                    <label
                      className="relative overflow-hidden w-full text-[10px] font-bold px-2 py-1.5 rounded-lg transition-all cursor-pointer text-center block"
                      style={settings.background === 'custom' ? { ...glassBtnActive, color: ACCENT } : { ...glassBtn, color: '#52525b' }}
                    >
                      Custom
                      <input type="file" accept="image/*,.exr" className="hidden"
                        onChange={e => e.target.files?.[0] && handleBgCustomUpload(e.target.files[0])} />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Showcases */}
            <GlassButton
              onClick={() => { setShowShowcases(true); setShowMenu(false); }}
              className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-4 py-2 rounded-lg"
              style={{ color: '#71717a' }}
            >
              <Users size={11} style={{ color: '#71717a' }} />
              Showcases
            </GlassButton>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {user && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={glassBtn}>
                <img
                  src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=32`}
                  alt="" className="w-5 h-5 rounded-full"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div>
                  <p className="text-[10px] font-bold text-white leading-none">{user.global_name ?? user.username}</p>
                  <p className="text-[8px] uppercase tracking-widest leading-none mt-0.5" style={{ color: ACCENT }}>Member</p>
                </div>
              </div>
            )}

            <div className="relative">
              <GlassButton
                onClick={() => { setShowMenu(s => !s); setShowSettings(false); }}
                active={showMenu}
                className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-4 py-2 rounded-lg"
                style={{ color: showMenu ? ACCENT : '#71717a' }}
              >
                <MoreHorizontal size={11} style={{ color: showMenu ? ACCENT : '#71717a' }} />
                Menu
              </GlassButton>

              {showMenu && (
                <div className="absolute right-0 top-full mt-2 w-44 rounded-2xl overflow-hidden shadow-2xl z-30" style={dropdownStyle}>
                  {[
                    { label: 'Credits',    icon: Star,     action: () => { setShowCredits(true); setShowMenu(false); },   danger: false },
                    { label: 'Disclaimer', icon: FileText,  action: () => { onShowDisclaimer(); setShowMenu(false); },     danger: false },
                    { label: 'Log Out',    icon: LogOut,    action: () => { clearAuth(); onLogout(); },                    danger: true  },
                  ].map((item, i, arr) => (
                    <GlassButton
                      key={item.label}
                      onClick={item.action}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-[11px] font-bold ${
                        item.danger ? 'text-zinc-500 hover:text-red-400' : 'text-zinc-400 hover:text-white'
                      } ${i < arr.length - 1 ? 'border-b border-white/[0.04]' : ''}`}
                      style={{ background: 'transparent', border: 'none', backdropFilter: 'none', borderRadius: 0, ...(i < arr.length - 1 ? { borderBottom: '1px solid rgba(255,255,255,0.04)' } : {}) }}
                    >
                      <item.icon size={11} style={{ color: item.danger ? '#ef4444' : ACCENT }} />
                      {item.label}
                    </GlassButton>
                  ))}
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-10 gap-3 backdrop-blur-sm">
            <div className="w-5 h-5 border-2 border-zinc-800 border-t-[#c4ff0d] rounded-full animate-spin" />
            <p className="text-[10px] tracking-widest uppercase text-zinc-500">{loading}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 text-red-400 text-[11px] font-semibold px-4 py-2.5 rounded-xl z-10"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}>
            {error}
          </div>
        )}

        {/* Empty state */}
        {!glbUrl && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-3 z-10">
            <Box size={36} className="text-zinc-800" strokeWidth={1} />
            <div className="text-center">
              <p className="text-[11px] font-black tracking-widest uppercase text-zinc-700 mb-1">Select a Vehicle</p>
              <p className="text-[10px] tracking-wider text-zinc-800">Choose a model from the sidebar</p>
            </div>
          </div>
        )}

        {/* Capture buttons */}
        {glbUrl && (
          <div className="absolute bottom-6 right-6 flex flex-col items-end gap-2 z-10">
            <div className="relative">
              <GlassButton
                onClick={() => setShowAngleMenu(o => !o)}
                className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase px-4 py-2 rounded-lg w-full justify-between"
                style={{ color: '#71717a', minWidth: '140px' }}
              >
                <span className="flex items-center gap-1.5"><Image size={10} />Angle Shots</span>
                <ChevronDown size={10} className={`transition-transform ${showAngleMenu ? 'rotate-180' : ''}`} />
              </GlassButton>
              {showAngleMenu && (
                <div className="absolute bottom-full mb-2 right-0 rounded-2xl shadow-2xl overflow-hidden w-48" style={dropdownStyle}>
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
                    <p key={i} className="px-3 pt-2.5 pb-0.5 text-[8px] font-black uppercase tracking-widest text-zinc-700">{entry.group}</p>
                  ) : (
                    <GlassButton
                      key={entry.side}
                      onClick={() => { handleShowcase(entry.side as ShowcaseSide); setShowAngleMenu(false); }}
                      className="w-full flex items-center px-3 py-1.5 text-[11px] font-semibold text-left"
                      style={{ background: 'transparent', border: 'none', backdropFilter: 'none', borderRadius: 0, color: '#71717a' }}
                    >
                      {entry.label}
                    </GlassButton>
                  ))}
                </div>
              )}
            </div>

            {/* Capture — lime version with right-sweep in white */}
            <CaptureButton onClick={handleCapture} />
          </div>
        )}

        {/* Footer */}
        <div className="absolute bottom-5 left-8 z-20 pointer-events-none flex items-center gap-2">
          <div className="h-px w-4 bg-[#c4ff0d]/30" />
          <p className="text-[10px] text-zinc-600 tracking-[0.18em] uppercase">Developed by itzz industries</p>
          <span className="text-zinc-700 text-[10px]">·</span>
          <p className="text-[10px] text-zinc-700 tracking-[0.12em] uppercase">sonar &amp; itzz_link</p>
        </div>
      </div>

      {/* ── Sidebar ── */}
      <div
        className="w-60 flex flex-col overflow-y-auto shrink-0"
        style={{ background: 'rgba(6,6,6,0.98)', borderLeft: '1px solid rgba(255,255,255,0.05)' }}
      >
        {/* Header */}
        <div className="px-4 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <img src="/Group_15.svg" alt="Livery Previewer" className="h-14 w-auto mb-3" style={{ mixBlendMode: 'lighten' }} />
          <div className="h-px bg-gradient-to-r from-[#c4ff0d]/40 to-transparent mb-2.5" />
          <p className="text-[9px] text-zinc-600 tracking-widest uppercase font-semibold">
            {user ? (user.global_name ?? user.username) : 'ERLC Vehicle Previewer'}
          </p>
        </div>

        {/* Model */}
        <Section title="Model" icon={Box} defaultOpen={true}>
          <div className="flex gap-1 mb-2">
            {(['All', ...AVAILABLE_CATEGORIES] as const).map(cat => (
              <GlassButton key={cat} onClick={() => setFilterCat(cat as VehicleCategory | 'All')}
                active={filterCat === cat}
                className="flex-1 text-[9px] font-black py-1.5 rounded-lg"
                style={{ color: filterCat === cat ? ACCENT : '#52525b' }}
              >
                {cat}
              </GlassButton>
            ))}
          </div>

          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-700" size={11} />
            <input
              type="text" placeholder="Search vehicles…" value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-xl text-[11px] pl-8 pr-3 py-2.5 text-zinc-300 placeholder:text-zinc-700 outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              onFocus={e => (e.target.style.borderColor = 'rgba(196,255,13,0.35)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.07)')}
            />
          </div>

          <div className="space-y-1 max-h-72 overflow-y-auto pr-0.5">
            {filteredModels.length > 0
              ? filteredModels.map(m => (
                  <ModelListItem key={m.id} model={m} selected={selectedModel?.id === m.id} onClick={() => handleSelectModel(m)} />
                ))
              : (
                <div className="text-center py-8">
                  <Box size={22} className="mx-auto mb-2 text-zinc-800" strokeWidth={1.5} />
                  <p className="text-[9px] font-black uppercase tracking-wider text-zinc-700">No vehicles found</p>
                </div>
              )
            }
          </div>
        </Section>

        {/* Presets */}
        <Section title="Presets" icon={Bookmark}>
          <div className="flex gap-1.5">
            <input
              placeholder="Preset name…" value={presetName}
              onChange={e => setPresetName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSavePreset()}
              className="flex-1 rounded-xl text-[11px] px-3 py-2 text-zinc-300 placeholder:text-zinc-700 outline-none min-w-0 transition-all"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              onFocus={e => (e.target.style.borderColor = 'rgba(196,255,13,0.35)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.07)')}
            />
            <button
              onClick={handleSavePreset} disabled={!presetName.trim() || savingPreset}
              className="text-[10px] font-black px-3 py-2 rounded-xl bg-[#c4ff0d] text-black disabled:opacity-30 hover:bg-[#d4ff3d] transition-all shrink-0"
            >
              {savingPreset ? '…' : 'Save'}
            </button>
          </div>
          {presets.length === 0 ? (
            <p className="text-[9px] text-zinc-700 italic mt-1">No presets saved yet</p>
          ) : (
            <div className="space-y-1.5 mt-1 max-h-48 overflow-y-auto pr-0.5">
              {presets.map(preset => (
                <div key={preset.id} className="group flex items-center gap-1.5 rounded-xl overflow-hidden" style={glassBtn}>
                  <button className="flex-1 text-left px-2.5 py-2 min-w-0" onClick={() => handleLoadPreset(preset)}>
                    <p className="text-[10px] font-bold text-zinc-300 truncate">{preset.name}</p>
                    <p className="text-[9px] text-zinc-700 truncate">
                      {MODELS.find(m => m.id === preset.modelId)?.name ?? 'No model'} · {new Date(preset.createdAt).toLocaleDateString()}
                    </p>
                  </button>
                  <button onClick={() => handleDeletePreset(preset.id)}
                    className="shrink-0 mr-2.5 text-zinc-800 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
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
            <div className="flex items-center flex-1 rounded-xl text-[11px] px-3 py-2 gap-1"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <span className="text-zinc-600 font-mono">#</span>
              <input value={hexSidebarInput} onChange={e => handleSidebarHexInput(e.target.value)}
                className="flex-1 bg-transparent text-zinc-300 font-mono uppercase outline-none min-w-0 text-[11px]"
                maxLength={6} spellCheck={false} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {['#000000','#1a1a2e','#c0392b','#27ae60','#2980b9','#8e44ad','#f39c12','#ecf0f1','#2c2c2c'].map(c => (
              <button key={c} onClick={() => handleColorChange(c)}
                style={{ background: c }}
                className="w-6 h-6 rounded-lg border-2 border-white/10 hover:scale-110 hover:border-[#c4ff0d]/60 transition-all shadow-md" title={c} />
            ))}
          </div>
        </Section>

        {/* Livery Textures */}
        <Section title="Livery Textures" icon={Image}>
          {!glbUrl && <p className="text-[9px] text-zinc-700 italic">Select a vehicle first</p>}
          {glbUrl && PANELS.map(face => (
            <div key={face} className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <Label>{face}</Label>
                <div className="flex items-center gap-1.5 rounded-lg px-2 py-1"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <button onClick={() => setPanelNums(p => ({ ...p, [face]: Math.max(1, p[face] - 1) }))}
                    className="text-zinc-700 hover:text-[#c4ff0d] text-xs w-4 h-4 flex items-center justify-center font-bold transition-colors">−</button>
                  <span className="text-[9px] text-zinc-400 font-semibold min-w-[12px] text-center">{panelNums[face]}</span>
                  <button onClick={() => setPanelNums(p => ({ ...p, [face]: p[face] + 1 }))}
                    className="text-zinc-700 hover:text-[#c4ff0d] text-xs w-4 h-4 flex items-center justify-center font-bold transition-colors">+</button>
                </div>
              </div>
              {getPanelKeys(face).map(panel => (
                <div key={panel} className="flex items-center gap-2 mb-1.5">
                  <span className="text-[9px] text-zinc-600 w-10 font-semibold shrink-0">{panel}</span>
                  {textures[panel] ? (
                    <div className="flex-1 flex items-center gap-2 rounded-xl px-2.5 py-1.5"
                      style={{ background: 'rgba(196,255,13,0.06)', border: '1px solid rgba(196,255,13,0.18)' }}>
                      <span className="flex-1 text-[9px] font-bold truncate" style={{ color: ACCENT }}>✓ Loaded</span>
                      <button onClick={() => handleRemoveTexture(panel)} className="text-red-500 hover:text-red-300 text-xs font-bold transition-colors">✕</button>
                    </div>
                  ) : (
                    <label className="flex-1 cursor-pointer rounded-xl px-2.5 py-1.5 text-[9px] text-zinc-600 hover:text-zinc-300 flex items-center gap-1.5 transition-all border-dashed"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.07)' }}>
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

// ─── Capture button — separate to keep hook rules clean ───────────────────────

function CaptureButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative overflow-hidden flex items-center justify-center gap-2 bg-[#c4ff0d] text-black text-[11px] font-black tracking-widest uppercase px-5 py-2.5 rounded-xl transition-all w-full"
      style={{
        boxShadow: hovered ? '0 6px 28px rgba(196,255,13,0.4)' : '0 4px 20px rgba(196,255,13,0.2)',
        transform: hovered ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      <span
        className="pointer-events-none absolute inset-y-0 right-0 transition-all duration-300"
        style={{
          width: hovered ? '50%' : '0%',
          background: 'linear-gradient(to left, rgba(255,255,255,0.25) 0%, transparent 100%)',
        }}
      />
      <span className="relative z-10 flex items-center gap-2">
        <Camera size={13} />
        Capture
      </span>
    </button>
  );
}
