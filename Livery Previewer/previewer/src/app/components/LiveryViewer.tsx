import { useEffect, useRef, useState, useCallback } from 'react';
import MODELS, { type VehicleModel } from '../../lib/models';
import type { DiscordUser } from '../../lib/discordAuth';
import { clearAuth } from '../../lib/discordAuth';
import { initLiveryViewer, type LiveryViewer as Viewer, type ShowcaseSide } from '../../lib/liveryEngine';
import { Upload, Camera, ChevronDown, ChevronRight, Palette, Box, Image, Search, LogOut, Send, Copy, Check } from 'lucide-react';
import type { ReactNode, ElementType } from 'react';
import itzzLogo from '../../imports/itzz-logo.png';
import ColorPicker from './ColorPicker';
import { uploadDecalToRoblox } from '../../lib/robloxUpload';

const PANELS   = ['Left', 'Right', 'Top', 'Front', 'Back'] as const;
type PanelFace = typeof PANELS[number];

const ACCENT = '#c4ff0d';

function ModelListItem({ model, selected, onClick }: { model: VehicleModel; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg px-3 py-2.5 transition-all ${
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
        className="w-full flex items-center gap-2.5 px-4 py-3.5 text-xs font-bold tracking-wider uppercase text-zinc-300 hover:text-[#c4ff0d] transition-colors group"
      >
        <Icon size={13} style={{ color: ACCENT }} />
        <span className="flex-1 text-left">{title}</span>
        {open
          ? <ChevronDown size={13} className="text-zinc-500 group-hover:text-[#c4ff0d]" />
          : <ChevronRight size={13} className="text-zinc-500 group-hover:text-[#c4ff0d]" />}
      </button>
      {open && <div className="px-4 pb-4 pt-1 space-y-3">{children}</div>}
    </div>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">{children}</p>;
}

interface Props { user: DiscordUser | null; onLogout: () => void; }

export default function LiveryViewer({ user, onLogout }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef    = useRef<Viewer | null>(null);

  const [glbUrl, setGlbUrl]               = useState('');
  const [selectedModel, setSelectedModel]   = useState<VehicleModel | null>(null);
  const [vehicleColor, setVehicleColor]     = useState('#000000');
  const [textures, setTextures]             = useState<Record<string, string>>({});
  const [loading, setLoading]               = useState<string | null>(null);
  const [error, setError]                   = useState<string | null>(null);
  const [panelNums, setPanelNums]           = useState<Record<PanelFace, number>>({ Left:1, Right:1, Top:1, Front:1, Back:1 });
  const [searchQuery, setSearchQuery]       = useState('');

  const [rblxCookie, setRblxCookie]         = useState(() => localStorage.getItem('rblx_cookie') ?? '');
  const [rblxGroupId, setRblxGroupId]       = useState(() => localStorage.getItem('rblx_group_id') ?? '');
  const [uploadStatus, setUploadStatus]     = useState<Record<string, string>>({});
  const [uploadResults, setUploadResults]   = useState<Record<string, string>>({});
  const [copiedPanel, setCopiedPanel]       = useState<string | null>(null);

  useEffect(() => {
    const viewer = initLiveryViewer(containerRef.current!);
    viewerRef.current = viewer;
    return () => viewer.dispose();
  }, []);

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
    if (!viewerRef.current) return;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      viewerRef.current?.updateColor(color);
      rafRef.current = null;
    });
  }, []);

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

  const filteredModels = MODELS
    .filter(m => !searchQuery || m.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const saveRblxCreds = (cookie: string, groupId: string) => {
    localStorage.setItem('rblx_cookie', cookie);
    localStorage.setItem('rblx_group_id', groupId);
  };

  const handlePublish = async (panel: string) => {
    const url = textures[panel];
    if (!url || !rblxCookie) return;
    saveRblxCreds(rblxCookie, rblxGroupId);
    setUploadStatus(s => ({ ...s, [panel]: 'Starting…' }));
    setUploadResults(r => { const n = { ...r }; delete n[panel]; return n; });
    try {
      const result = await uploadDecalToRoblox(
        url,
        `${selectedModel?.name ?? 'Livery'}_${panel}`,
        rblxCookie,
        rblxGroupId || undefined,
        (msg) => setUploadStatus(s => ({ ...s, [panel]: msg })),
      );
      setUploadResults(r => ({ ...r, [panel]: result.assetId }));
      setUploadStatus(s => ({ ...s, [panel]: '✓ Done!' }));
    } catch (e: unknown) {
      setUploadStatus(s => ({ ...s, [panel]: `✕ ${e instanceof Error ? e.message : 'Upload failed'}` }));
    }
  };

  const handleCopy = (panel: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPanel(panel);
    setTimeout(() => setCopiedPanel(null), 2000);
  };

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">

      <div className="relative flex-1 bg-gradient-to-br from-black via-zinc-950 to-black" ref={containerRef}>
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10 gap-3">
            <div className="w-6 h-6 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
            <p className="text-xs tracking-widest uppercase text-zinc-400">{loading}</p>
          </div>
        )}
        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-900/80 border border-red-500/30 text-red-300 text-xs px-4 py-2 rounded z-10">
            {error}
          </div>
        )}
        {!glbUrl && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-3">
            <div className="relative">
              <Box size={48} className="text-zinc-800" strokeWidth={1.5} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-[#c4ff0d]/10 rounded-full blur-xl" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold tracking-wider uppercase text-zinc-600 mb-1">Select a Vehicle</p>
              <p className="text-[10px] tracking-wider text-zinc-700">Choose from the sidebar to begin</p>
            </div>
          </div>
        )}
        {glbUrl && (
          <div className="absolute bottom-6 right-6 flex flex-col items-end gap-2">
            <div className="flex gap-1.5">
              {(['right', 'left', 'front', 'back'] as ShowcaseSide[]).map(side => (
                <button
                  key={side}
                  onClick={() => handleShowcase(side)}
                  className="flex items-center gap-1.5 bg-black/70 hover:bg-black/90 border border-white/10 hover:border-[#c4ff0d]/50 text-zinc-300 hover:text-[#c4ff0d] text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all backdrop-blur-sm uppercase tracking-wider"
                  title={`Showcase – ${side} side, transparent PNG`}
                >
                  <Image size={10} />
                  {side}
                </button>
              ))}
            </div>
            <button
              onClick={handleCapture}
              className="flex items-center gap-2 bg-[#c4ff0d] hover:bg-[#d4ff3d] text-black text-xs font-bold px-4 py-2.5 rounded-lg transition-all shadow-lg shadow-[#c4ff0d]/30 hover:shadow-[#c4ff0d]/50 hover:scale-105"
            >
              <Camera size={14} />
              CAPTURE
            </button>
          </div>
        )}
      </div>

      <div className="w-64 flex flex-col border-l border-[#c4ff0d]/10 bg-[#0a0a0a] overflow-y-auto">

        <div className="px-4 py-6 border-b border-[#c4ff0d]/20 bg-gradient-to-b from-[#c4ff0d]/5 to-transparent">
          <div className="flex items-center gap-2.5 mb-2">
            <img src={itzzLogo} alt="itzz" className="h-7 w-auto drop-shadow-[0_0_8px_rgba(196,255,13,0.5)]" />
            <div className="flex-1">
              <p className="text-sm font-bold tracking-wide uppercase text-white">Livery Previewer</p>
            </div>
            <button onClick={() => { clearAuth(); onLogout(); }} title="Log out" className="text-zinc-600 hover:text-zinc-400 transition-colors">
              <LogOut size={13} />
            </button>
          </div>
          <div className="h-0.5 bg-gradient-to-r from-[#c4ff0d] to-transparent mb-2" />
          <p className="text-[10px] text-zinc-400 tracking-wider uppercase font-medium">
            {user ? (user.global_name ?? user.username) : 'ERLC Vehicle Previewer'}
          </p>
        </div>

        <Section title="Model" icon={Box} defaultOpen={true}>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={13} />
            <input
              type="text"
              placeholder="Search vehicles..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg text-xs pl-9 pr-3 py-2.5 text-zinc-300 placeholder:text-zinc-600 outline-none focus:border-[#c4ff0d]/50 focus:bg-black/60 transition-all"
            />
          </div>

          <div className="space-y-1 max-h-96 overflow-y-auto pr-0.5">
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
                <div className="text-center py-12 text-zinc-600 text-xs">
                  <Box size={32} className="mx-auto mb-3 opacity-30" strokeWidth={1.5} />
                  <p className="font-semibold uppercase tracking-wider">No vehicles found</p>
                  <p className="text-[10px] text-zinc-700 mt-1">Try a different search</p>
                </div>
              )
            }
          </div>
        </Section>

        <Section title="Vehicle Color" icon={Palette} defaultOpen={true}>
          <div className="flex items-center gap-3">
            <ColorPicker color={vehicleColor} onChange={handleColorChange} />
            <span className="flex-1 bg-black/40 border border-white/10 rounded-lg text-xs px-3 py-2 text-zinc-300 font-mono uppercase select-all">{vehicleColor.toUpperCase()}</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {['#000000','#1a1a2e','#c0392b','#27ae60','#2980b9','#8e44ad','#f39c12','#ecf0f1','#2c2c2c'].map(c => (
              <button
                key={c}
                onClick={() => handleColorChange(c)}
                style={{ background: c }}
                className="w-6 h-6 rounded-lg border-2 border-white/20 hover:scale-110 hover:border-[#c4ff0d]/50 transition-all shadow-md"
                title={c}
              />
            ))}
          </div>
        </Section>

        <Section title="Livery Textures" icon={Image}>
          {PANELS.map(face => (
            <div key={face} className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <Label>{face}</Label>
                <div className="flex items-center gap-1.5 bg-black/40 rounded-lg px-2 py-1 border border-white/10">
                  <button
                    onClick={() => setPanelNums(p => ({ ...p, [face]: Math.max(1, p[face] - 1) }))}
                    className="text-zinc-500 hover:text-[#c4ff0d] text-xs w-4 h-4 flex items-center justify-center font-bold transition-colors"
                  >−</button>
                  <span className="text-[10px] text-zinc-400 font-semibold min-w-[12px] text-center">{panelNums[face]}</span>
                  <button
                    onClick={() => setPanelNums(p => ({ ...p, [face]: p[face] + 1 }))}
                    className="text-zinc-500 hover:text-[#c4ff0d] text-xs w-4 h-4 flex items-center justify-center font-bold transition-colors"
                  >+</button>
                </div>
              </div>
              {getPanelKeys(face).map(panel => (
                <div key={panel} className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] text-zinc-500 w-12 font-semibold">{panel}</span>
                  {textures[panel] ? (
                    <div className="flex-1 flex items-center gap-2 bg-[#c4ff0d]/10 border border-[#c4ff0d]/30 rounded-lg px-2 py-1.5">
                      <span className="flex-1 text-[10px] text-[#c4ff0d] truncate font-semibold">✓ LOADED</span>
                      <button onClick={() => handleRemoveTexture(panel)} className="text-red-400 hover:text-red-300 text-xs font-bold">✕</button>
                    </div>
                  ) : (
                    <label className="flex-1 cursor-pointer bg-black/40 hover:bg-black/60 border border-white/10 hover:border-[#c4ff0d]/50 border-dashed rounded-lg px-2 py-1.5 text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1.5 transition-all">
                      <Upload size={10} />
                      <span className="font-medium">Upload</span>
                      <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleTextureUpload(panel, e.target.files[0])} className="hidden" />
                    </label>
                  )}
                </div>
              ))}
            </div>
          ))}
        </Section>

        <Section title="Publish to Roblox" icon={Send}>
          <Label>.ROBLOSECURITY Cookie</Label>
          <input
            type="password"
            placeholder="Paste cookie token…"
            value={rblxCookie}
            onChange={e => setRblxCookie(e.target.value)}
            onBlur={() => saveRblxCreds(rblxCookie, rblxGroupId)}
            className="w-full bg-black/40 border border-white/10 rounded-lg text-xs px-3 py-2 text-zinc-300 placeholder:text-zinc-600 outline-none focus:border-[#c4ff0d]/50 font-mono mb-2"
          />
          <Label>Group ID <span className="normal-case text-zinc-600">(optional)</span></Label>
          <input
            type="text"
            placeholder="Upload to group instead of account…"
            value={rblxGroupId}
            onChange={e => setRblxGroupId(e.target.value)}
            onBlur={() => saveRblxCreds(rblxCookie, rblxGroupId)}
            className="w-full bg-black/40 border border-white/10 rounded-lg text-xs px-3 py-2 text-zinc-300 placeholder:text-zinc-600 outline-none focus:border-[#c4ff0d]/50 font-mono mb-3"
          />
          <p className="text-[10px] text-zinc-600 mb-3 leading-relaxed">
            Get your cookie from browser DevTools → Application → Cookies → roblox.com → <span className="text-zinc-500 font-mono">.ROBLOSECURITY</span>
          </p>

          <Label>Upload Panels</Label>
          <div className="space-y-2">
            {Object.keys(textures).length === 0 && (
              <p className="text-[10px] text-zinc-600 italic">Upload livery textures first</p>
            )}
            {Object.keys(textures).map(panel => (
              <div key={panel} className="rounded-lg border border-white/10 bg-white/5 p-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">{panel}</span>
                  <button
                    onClick={() => handlePublish(panel)}
                    disabled={!rblxCookie || uploadStatus[panel]?.includes('…')}
                    className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-md bg-[#c4ff0d] text-black disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#d4ff3d] transition-all"
                  >
                    <Send size={9} />
                    {uploadStatus[panel]?.includes('…') ? 'Uploading…' : 'Upload'}
                  </button>
                </div>
                {uploadStatus[panel] && (
                  <p className="text-[10px] text-zinc-500 truncate">{uploadStatus[panel]}</p>
                )}
                {uploadResults[panel] && (
                  <div className="mt-1.5 flex items-center gap-1.5 bg-[#c4ff0d]/10 border border-[#c4ff0d]/30 rounded-md px-2 py-1.5">
                    <span className="flex-1 text-[10px] font-mono text-[#c4ff0d] truncate select-all">{uploadResults[panel]}</span>
                    <button
                      onClick={() => handleCopy(panel, uploadResults[panel])}
                      className="text-zinc-400 hover:text-[#c4ff0d] transition-colors"
                      title="Copy asset ID"
                    >
                      {copiedPanel === panel ? <Check size={11} /> : <Copy size={11} />}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>

      </div>
    </div>
  );
}
