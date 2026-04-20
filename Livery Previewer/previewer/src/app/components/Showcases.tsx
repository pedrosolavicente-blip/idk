import { useState, useEffect, useRef, useCallback, useContext } from 'react';
import type { DiscordUser } from '../../lib/discordAuth';
import {
  type ShowcasePost, type ShowcaseComment, type LiveryConfig, type Analytics, type PostType,
  fetchPosts, fetchPost, createPost, deletePost, fetchLiveryConfig,
  fetchComments, addComment, deleteComment,
  reactToPost, removeReaction, recordView, fetchAnalytics,
  avatarUrl, imageUrl, relativeTime,
} from '../../lib/showcaseApi';
import { initLiveryViewer, type LiveryViewer as Viewer, type SceneSettings } from '../../lib/liveryEngine';
import { useShowcase, ShowcaseProvider } from '../hooks/useShowcase';
import {
  X, Upload, Send, Trash2, MessageSquare, Image, ArrowLeft,
  ThumbsUp, ThumbsDown, Eye, Settings2, BarChart2, Box,
  CornerDownRight, Search, Share2, Hash,
} from 'lucide-react';

const ACCENT = '#c4ff0d';

// ─── Badges ───────────────────────────────────────────────────────────────────

const BADGES: Record<string, { label: string; shortLabel: string; color: string }> = {
  '1256593664856162384': { label: 'Developer & Creator', shortLabel: 'CREATOR', color: '#f59e0b' },
  '1195666796099948597': { label: 'Developer', shortLabel: 'DEV', color: '#3b82f6' },
};

function UserBadge({ userId }: { userId: string }) {
  const badge = BADGES[userId];
  if (!badge) return null;
  return (
    <span className="relative group/badge inline-flex items-center">
      <span
        className="text-[8px] font-black px-1.5 py-px rounded uppercase tracking-widest cursor-default select-none"
        style={{ color: badge.color, border: `1px solid ${badge.color}50`, background: `${badge.color}18` }}>
        {badge.shortLabel}
      </span>
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded-lg bg-zinc-900 border border-white/10 text-[9px] text-white whitespace-nowrap opacity-0 group-hover/badge:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
        {badge.label}
      </span>
    </span>
  );
}

// ─── Word filter ──────────────────────────────────────────────────────────────

const BUILTIN_WORDS = [
  'fuck','shit','bitch','cunt','dick','cock','pussy','asshole','motherfucker',
  'fucker','bastard','wanker','twat','prick','bollocks','arsehole','dipshit',
  'dumbass','jackass','bullshit','horseshit','piss','cum','jizz','slut','whore',
  'nigger','nigga','nigg','niga','nig','chink','gook','spic','spick',
  'wetback','beaner','kike','kyke','hymie','raghead','towelhead','sandnigger',
  'jap','nip','coon','sambo','cracker','honky','redskin','injun','pickaninny',
  'faggot','fag','dyke','retard','retarded',
];

let _wordCache: string[] | null = null;
async function getWordFilter(): Promise<string[]> {
  if (_wordCache) return _wordCache;
  const remote: string[] = [];
  function parseWords(text: string) {
    text.split(/[\n,]+/).forEach(w => {
      const clean = w.trim().toLowerCase();
      if (clean) remote.push(clean);
    });
  }
  const sources = [
    'https://raw.githubusercontent.com/BREN0sx/discord-automod-words/main/WordFilter-01',
    'https://raw.githubusercontent.com/BREN0sx/discord-automod-words/main/WordFilter-02',
    'https://raw.githubusercontent.com/BREN0sx/discord-automod-words/main/WordFilter-03',
    '/wordlist.txt',
  ];
  await Promise.allSettled(sources.map(async url => {
    try {
      const res = await fetch(url, { cache: 'force-cache' });
      if (res.ok) parseWords(await res.text());
    } catch { /* ignore */ }
  }));
  _wordCache = [...new Set([...BUILTIN_WORDS, ...remote])];
  return _wordCache;
}

function normaliseText(raw: string): string[] {
  const s = raw.toLowerCase()
    .replace(/[\u200b-\u200f\u202a-\u202e\u00ad\ufeff]/g, '')
    .replace(/[4@]/g, 'a').replace(/3/g, 'e').replace(/[1!|]/g, 'i')
    .replace(/0/g, 'o').replace(/[$5]/g, 's').replace(/[7+]/g, 't')
    .replace(/8/g, 'b').replace(/9/g, 'g')
    .replace(/[.\-_*,;:~^]+/g, '');
  const noSpaces  = s.replace(/\s+/g, '');
  const collapsed = noSpaces.replace(/(.)\1+/g, '$1');
  return [s, noSpaces, collapsed];
}

function hasBannedWord(text: string, list: string[]): boolean {
  const [withSeps, noSpaces, collapsed] = normaliseText(text);
  return list.some(w => {
    if (!w) return false;
    const wn = normaliseText(w)[0];
    if (!wn) return false;
    if (wn.length <= 4) return new RegExp(`(?<![a-z])${wn}(?![a-z])`).test(withSeps);
    return withSeps.includes(wn) || noSpaces.includes(wn) || collapsed.includes(wn);
  });
}

// ─── Tag helpers ──────────────────────────────────────────────────────────────

function extractTags(text: string): string[] {
  return [...new Set((text.match(/#(\w+)/g) ?? []).map(t => t.slice(1).toLowerCase()))];
}

function TagPill({ tag, onClick }: { tag: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-0.5 text-xs text-[#c4ff0d] bg-[#c4ff0d]/10 border border-[#c4ff0d]/20 px-2 py-0.5 rounded-full hover:bg-[#c4ff0d]/20 transition-all"
    >
      <Hash size={9} />{tag}
    </button>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseReply(body: string): { replyTo: string; text: string } | null {
  const match = body.match(/^@(\S+) ([\s\S]+)$/);
  if (match) return { replyTo: match[1], text: match[2] };
  return null;
}

// ─── Shared ───────────────────────────────────────────────────────────────────

function Avatar({ userId, hash, size = 8 }: { userId: string; hash: string | null; size?: number }) {
  return (
    <img src={avatarUrl(userId, hash)} alt=""
      className={`w-${size} h-${size} rounded-full object-cover bg-zinc-800 shrink-0`} />
  );
}

function TypeBadge({ type }: { type: PostType }) {
  const map = { image: ['Image', 'text-zinc-500 border-zinc-700'], showcase: ['3D Showcase', 'text-[#c4ff0d] border-[#c4ff0d]/40'], release: ['Free Release', 'text-green-400 border-green-500/40'] };
  const [label, cls] = map[type] ?? map.image;
  return <span className={`text-[9px] font-bold uppercase tracking-widest border rounded px-1.5 py-0.5 ${cls}`}>{label}</span>;
}

// ─── Post card ────────────────────────────────────────────────────────────────

function PostCard({ post, currentUserId, onClick, onDeleted, onTagClick }: {
  post: ShowcasePost; currentUserId?: string; onClick: () => void;
  onDeleted: () => void; onTagClick: (tag: string) => void;
}) {
  const [showSettings, setShowSettings] = useState(false);
  const tags = extractTags(post.caption);

  return (
    <>
      <button onClick={onClick}
        className="group relative w-full text-left rounded-xl overflow-hidden border border-white/8 bg-zinc-950 hover:border-[#c4ff0d]/40 transition-all hover:shadow-lg hover:shadow-[#c4ff0d]/5">
        <div className="aspect-video w-full overflow-hidden bg-zinc-900">
          <img src={imageUrl(post.image_key)} alt={post.caption}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        </div>
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Avatar userId={post.user_id} hash={post.avatar} size={6} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-xs font-semibold text-white truncate">{post.username}</p>
                <UserBadge userId={post.user_id} />
              </div>
              <p className="text-xs text-zinc-400">{relativeTime(post.created_at)}</p>
            </div>
            <TypeBadge type={post.post_type} />
          </div>
          {post.title && <p className="text-sm font-bold text-white truncate">{post.title}</p>}
          {post.caption && <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{post.caption.replace(/#\w+/g, '').trim()}</p>}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1" onClick={e => e.stopPropagation()}>
              {tags.slice(0, 3).map(t => <TagPill key={t} tag={t} onClick={() => onTagClick(t)} />)}
            </div>
          )}
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span className="flex items-center gap-1"><Eye size={11} />{post.view_count}</span>
            <span className="flex items-center gap-1"><ThumbsUp size={11} />{post.like_count}</span>
            <span className="flex items-center gap-1"><ThumbsDown size={11} />{post.dislike_count}</span>
            <span className="flex items-center gap-1 ml-auto"><MessageSquare size={11} />{post.comment_count}</span>
          </div>
        </div>
        {currentUserId === post.user_id && (
          <button onClick={e => { e.stopPropagation(); setShowSettings(true); }}
            className="absolute top-2 right-2 bg-black/70 hover:bg-black/90 border border-white/10 hover:border-[#c4ff0d]/50 text-zinc-400 hover:text-[#c4ff0d] p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
            <Settings2 size={11} />
          </button>
        )}
      </button>
      {showSettings && <PostSettings post={post} onClose={() => setShowSettings(false)} onDeleted={onDeleted} />}
    </>
  );
}

// ─── Post settings / analytics ────────────────────────────────────────────────

function PostSettings({ post: initialPost, onClose, onDeleted }: {
  post: ShowcasePost; onClose: () => void; onDeleted: () => void;
}) {
  const [post, setPost]            = useState(initialPost);
  const [tab, setTab]              = useState<'info' | 'analytics'>('info');
  const [analytics, setAnalytics]  = useState<Analytics | null>(null);
  const [loading, setLoading]      = useState(false);
  const [deleting, setDeleting]    = useState(false);

  useEffect(() => { if (tab === 'analytics') { setLoading(true); fetchAnalytics(post.id).then(setAnalytics).catch(() => {}).finally(() => setLoading(false)); } }, [tab]);

  const handleDelete = async () => {
    if (!confirm('Delete this post permanently?')) return;
    setDeleting(true);
    try { await deletePost(post.id); onDeleted(); }
    catch (e) { alert(e instanceof Error ? e.message : 'Failed'); setDeleting(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-300">Post Settings</p>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={15} /></button>
        </div>
        <div className="flex border-b border-white/8">
          {(['info', 'analytics'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all ${tab === t ? 'text-[#c4ff0d] border-b-2 border-[#c4ff0d]' : 'text-zinc-500 hover:text-zinc-300'}`}>
              {t === 'info' ? <><Settings2 size={11} />Info</> : <><BarChart2 size={11} />Analytics</>}
            </button>
          ))}
        </div>

        {tab === 'info' && (
          <div className="p-5 space-y-4">
            <div className="rounded-xl border border-white/8 bg-white/3 overflow-hidden">
              <img src={imageUrl(post.image_key)} alt="" className="w-full aspect-video object-cover" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <TypeBadge type={post.post_type} />
                <p className="text-xs text-zinc-400">{new Date(post.created_at).toLocaleDateString()}</p>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">{post.caption || <span className="text-zinc-600 italic">No description</span>}</p>
              <div className="flex gap-4 text-xs text-zinc-500 pt-1">
                <span className="flex items-center gap-1"><Eye size={11} /> {post.view_count}</span>
                <span className="flex items-center gap-1"><ThumbsUp size={11} /> {post.like_count}</span>
                <span className="flex items-center gap-1"><ThumbsDown size={11} /> {post.dislike_count}</span>
              </div>
            </div>
            <button onClick={handleDelete} disabled={deleting}
              className="w-full flex items-center justify-center gap-2 text-xs font-bold bg-red-900/20 hover:bg-red-900/40 border border-red-500/30 text-red-400 py-2.5 rounded-xl transition-all disabled:opacity-40">
              <Trash2 size={13} />{deleting ? 'Deleting…' : 'Delete Post'}
            </button>
          </div>
        )}

        {tab === 'analytics' && (
          <div className="p-5 space-y-4 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-zinc-700 border-t-white rounded-full animate-spin" /></div>
            ) : analytics ? (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {[{ icon: Eye, label: 'Views', value: analytics.views }, { icon: ThumbsUp, label: 'Likes', value: analytics.likes }, { icon: ThumbsDown, label: 'Dislikes', value: analytics.dislikes }].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="rounded-xl border border-white/8 bg-white/3 p-3 text-center">
                      <Icon size={14} className="mx-auto mb-1 text-zinc-500" />
                      <p className="text-lg font-black text-white">{value}</p>
                      <p className="text-[9px] text-zinc-500 uppercase tracking-widest">{label}</p>
                    </div>
                  ))}
                </div>
                {analytics.viewers.length > 0 && (
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Eye size={10} />Recent viewers</p>
                    <div className="space-y-1.5">
                      {analytics.viewers.map((v, i) => (
                        <div key={i} className="flex items-center gap-2">
                          {v.user_id ? <Avatar userId={v.user_id} hash={v.avatar} size={6} /> : <div className="w-6 h-6 rounded-full bg-zinc-800 shrink-0" />}
                          <p className="text-xs text-zinc-300 flex-1">{v.username ?? 'Anonymous'}</p>
                          <p className="text-xs text-zinc-500">{relativeTime(v.created_at)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {analytics.reactors.length > 0 && (
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><ThumbsUp size={10} />Reactions</p>
                    <div className="space-y-1.5">
                      {analytics.reactors.map((r, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Avatar userId={r.user_id} hash={r.avatar} size={6} />
                          <p className="text-xs text-zinc-300 flex-1">{r.username}</p>
                          {r.value === 1 ? <ThumbsUp size={11} className="text-green-400" /> : <ThumbsDown size={11} className="text-red-400" />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {analytics.viewers.length === 0 && analytics.reactors.length === 0 && (
                  <p className="text-xs text-zinc-600 text-center py-4">No activity yet</p>
                )}
              </>
            ) : (
              <p className="text-xs text-red-400 text-center py-4">Failed to load analytics</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 3D livery viewer ─────────────────────────────────────────────────────────

const DEFAULT_SCENE: SceneSettings = {
  brightness: 1.1, skyRotX: 0, skyRotY: 0, skyRotZ: 0,
  background: 'default', bgCustomUrl: '', bgCustomIsEXR: false,
};

function LiveryView3D({ config }: { config: LiveryConfig }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef    = useRef<Viewer | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const viewer = initLiveryViewer(containerRef.current, { zoomFactor: 1.3 });
    viewerRef.current = viewer;
    viewer.updateScene(DEFAULT_SCENE);
    viewer.loadLivery(config.modelPath, config.vehicleColor, config.textures, (_msg, pct) => { if (pct >= 100) setReady(true); }).catch(() => {});
    return () => viewer.dispose();
  }, [config]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 gap-3 flex-col">
          <div className="w-5 h-5 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
          <p className="text-xs text-zinc-500 uppercase tracking-widest">Loading 3D…</p>
        </div>
      )}
      {ready && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none">
          <p className="text-xs text-zinc-400 bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm">
            Drag to rotate · Scroll to zoom
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Post detail ──────────────────────────────────────────────────────────────

function PostDetail({ post: initialPost, currentUserId, onBack, onDeleted, onApplyLivery, onTagClick }: {
  post: ShowcasePost; currentUserId?: string; onBack: () => void;
  onDeleted: () => void; onApplyLivery?: (c: LiveryConfig) => void;
  onTagClick: (tag: string) => void;
}) {
  const [post, setPost]                 = useState(initialPost);
  const [comments, setComments]         = useState<ShowcaseComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentText, setCommentText]   = useState('');
  const [sending, setSending]           = useState(false);
  const [liveryConfig, setLiveryConfig] = useState<LiveryConfig | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText]       = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [wordList, setWordList]         = useState<string[]>([]);
  const [copied, setCopied]             = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { getWordFilter().then(setWordList); }, []);

  // View — once per session
  useEffect(() => {
    const key = `viewed_${post.id}`;
    if (!sessionStorage.getItem(key)) { sessionStorage.setItem(key, '1'); recordView(post.id); }
  }, [post.id]);

  // Load comments
  useEffect(() => {
    const refresh = useContext(ShowcaseProvider);
    refresh(post.id).then(setComments).finally(() => setLoadingComments(false));
  }, [post.id]);

  // Auto-update comments every 30s
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const fresh = await useContext(ShowcaseProvider).refresh(post.id);
        setComments(prev => {
          const ids = new Set(prev.map(c => c.id));
          const newOnes = fresh.filter(c => !ids.has(c.id));
          return newOnes.length ? [...prev, ...newOnes] : prev;
        });
      } catch { /* ignore */ }
    }, 30_000);
    return () => clearInterval(timer);
  }, [post.id]);

  // Load livery config
  useEffect(() => {
    if (post.livery_key && (post.post_type === 'showcase' || post.post_type === 'release')) {
      fetchLiveryConfig(post.livery_key).then(setLiveryConfig).catch(() => {});
    }
  }, [post.livery_key, post.post_type]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [comments.length]);

  const handleReact = async (value: 1 | -1) => {
    if (!currentUserId) return;
    const prev = post.user_reaction;
    if (prev === value) {
      await removeReaction(post.id).catch(() => {});
      setPost(p => ({ ...p, user_reaction: null, like_count: p.like_count - (value === 1 ? 1 : 0), dislike_count: p.dislike_count - (value === -1 ? 1 : 0) }));
    } else {
      await reactToPost(post.id, value).catch(() => {});
      setPost(p => ({ ...p, user_reaction: value, like_count: p.like_count + (value === 1 ? 1 : 0) - (prev === 1 ? 1 : 0), dislike_count: p.dislike_count + (value === -1 ? 1 : 0) - (prev === -1 ? 1 : 0) }));
    }
  };

  const filter = (text: string) => {
    const wl = wordList.length ? wordList : BUILTIN_WORDS;
    return hasBannedWord(text, wl);
  };

  const handleSend = async () => {
    if (!commentText.trim() || sending) return;
    if (filter(commentText)) { alert('Your comment contains a word that is not allowed.'); return; }
    setSending(true);
    try {
      const c = await addComment(post.id, commentText.trim());
      setComments(prev => [...prev, c]);
      setCommentText('');
    } catch (e) { alert(e instanceof Error ? e.message : 'Failed'); }
    finally { setSending(false); }
  };

  const handleSendReply = async (parent: ShowcaseComment) => {
    if (!replyText.trim() || sendingReply) return;
    const body = `@${parent.username} ${replyText.trim()}`;
    if (filter(body)) { alert('Your comment contains a word that is not allowed.'); return; }
    setSendingReply(true);
    try {
      const c = await addComment(post.id, body);
      setComments(prev => [...prev, c]);
      setReplyText('');
      setReplyingToId(null);
    } catch (e) { alert(e instanceof Error ? e.message : 'Failed'); }
    finally { setSendingReply(false); }
  };

  const handleDeleteComment = async (c: ShowcaseComment) => {
    if (!confirm('Delete this comment?')) return;
    await deleteComment(post.id, c.id).catch(() => {});
    setComments(p => p.filter(x => x.id !== c.id));
  };

  const handleShare = () => {
    const url = `${window.location.origin}${window.location.pathname}?showcase=${post.id}`;
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => {});
  };

  const tags = extractTags(post.caption);
  const captionText = post.caption.replace(/#\w+/g, '').trim();

  return (
    <>
      {showSettings && <PostSettings post={post} onClose={() => setShowSettings(false)} onDeleted={onDeleted} />}

      <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 shrink-0 bg-[#0a0a0a] z-10">
          <button onClick={onBack} className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-xs font-bold transition-colors">
            <ArrowLeft size={13} />Back
          </button>
          <div className="h-4 w-px bg-white/10" />
          <Avatar userId={post.user_id} hash={post.avatar} size={6} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-bold text-white truncate">{post.username}</p>
              <UserBadge userId={post.user_id} />
            </div>
            <p className="text-xs text-zinc-400">{relativeTime(post.created_at)}</p>
          </div>
          <TypeBadge type={post.post_type} />
          <button onClick={handleShare}
            className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg border border-white/10 hover:border-[#c4ff0d]/40 text-zinc-400 hover:text-[#c4ff0d] transition-all">
            <Share2 size={11} />{copied ? 'Copied!' : 'Share'}
          </button>
          {currentUserId === post.user_id && (
            <button onClick={() => setShowSettings(true)} className="text-zinc-500 hover:text-[#c4ff0d] transition-colors"><Settings2 size={14} /></button>
          )}
        </div>

        {/* Body — two-column */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* Left: media + info */}
          <div className="flex-1 min-w-0 overflow-y-auto border-r border-white/8">
            {/* Media */}
            <div className="w-full bg-black shrink-0">
              {post.post_type === 'showcase' && liveryConfig ? (
                <div className="w-full h-[700px]">
                  <LiveryView3D config={liveryConfig} />
                </div>
              ) : (
                <div className="flex items-center justify-center p-4">
                  <img src={imageUrl(post.image_key)} alt={post.caption} className="max-w-full max-h-[60vh] object-contain rounded-xl" />
                </div>
              )}
            </div>

            {/* Release rules + Roblox IDs */}
            {post.post_type === 'release' && liveryConfig && (
              <div className="px-5 py-4 border-t border-white/8 space-y-3">
                {liveryConfig.rules && liveryConfig.rules.length > 0 && (
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Usage rules</p>
                    <div className="flex flex-wrap gap-1.5">
                      {liveryConfig.rules.map(r => (
                        <span key={r} className="text-xs font-bold uppercase tracking-wider border border-amber-500/40 bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded">
                          {RELEASE_RULES.find(x => x.id === r)?.label ?? r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {liveryConfig.robloxIds && Object.keys(liveryConfig.robloxIds).length > 0 && (
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Roblox IDs</p>
                    <div className="space-y-1.5">
                      {Object.entries(liveryConfig.robloxIds).map(([panel, id]) => (
                        <div key={panel} className="flex items-center gap-2">
                          <span className="text-xs text-zinc-500 w-14 shrink-0">{panel}</span>
                          <button onClick={() => navigator.clipboard.writeText(id)}
                            className="flex-1 text-left font-mono text-xs text-[#c4ff0d] bg-black/40 border border-white/10 hover:border-[#c4ff0d]/40 rounded px-2 py-1 transition-all truncate" title="Click to copy">
                            {id}
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-zinc-500 mt-1.5">Click an ID to copy</p>
                  </div>
                )}
              </div>
            )}

            {/* Description + tags + reactions */}
            <div className="px-5 py-4 border-t border-white/8 space-y-3">
              {post.title && <p className="text-lg font-black text-white leading-tight">{post.title}</p>}
              {liveryConfig?.modelName && (
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{liveryConfig.modelName}</p>
              )}
              {captionText && <p className="text-sm text-zinc-200 leading-relaxed">{captionText}</p>}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map(t => <TagPill key={t} tag={t} onClick={() => { onTagClick(t); onBack(); }} />)}
                </div>
              )}
              <div className="flex items-center gap-3 flex-wrap">
                <button onClick={() => handleReact(1)} disabled={!currentUserId}
                  className={`flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-lg border transition-all ${post.user_reaction === 1 ? 'bg-green-500/15 border-green-500/50 text-green-400' : 'border-white/10 text-zinc-400 hover:text-green-400 hover:border-green-500/30 disabled:opacity-40'}`}>
                  <ThumbsUp size={13} />{post.like_count}
                </button>
                <button onClick={() => handleReact(-1)} disabled={!currentUserId}
                  className={`flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-lg border transition-all ${post.user_reaction === -1 ? 'bg-red-500/15 border-red-500/50 text-red-400' : 'border-white/10 text-zinc-400 hover:text-red-400 hover:border-red-500/30 disabled:opacity-40'}`}>
                  <ThumbsDown size={13} />{post.dislike_count}
                </button>
                <span className="flex items-center gap-1.5 text-sm text-zinc-500"><Eye size={13} />{post.view_count} views</span>
                {post.post_type === 'release' && liveryConfig && onApplyLivery && !liveryConfig.robloxIds && (
                  <button onClick={() => onApplyLivery(liveryConfig)}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-[#c4ff0d] text-black hover:bg-[#d4ff3d] transition-all ml-auto">
                    <Box size={12} />Apply Livery
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right: comments sidebar */}
          <div className="w-80 shrink-0 flex flex-col min-h-0">
            <div className="px-4 py-3 border-b border-white/8 shrink-0">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                Comments <span className="text-zinc-600 font-normal">({comments.length})</span>
              </p>
            </div>

            {/* Scrollable comments list */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
              {loadingComments ? (
                <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-zinc-700 border-t-white rounded-full animate-spin" /></div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8"><MessageSquare size={20} className="mx-auto text-zinc-800 mb-2" /><p className="text-xs text-zinc-600">No comments yet</p></div>
              ) : (
                <>
                  {comments.map(c => {
                    const isCreator = c.user_id === post.user_id;
                    const isReplying = replyingToId === c.id;
                    const parsed = parseReply(c.body);
                    return (
                      <div key={c.id} className="space-y-2">
                        <div className="flex gap-2.5">
                          <Avatar userId={c.user_id} hash={c.avatar} size={7} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                              <p className="text-xs font-bold text-white">{c.username}</p>
                              <UserBadge userId={c.user_id} />
                              {isCreator && (
                                <span className="text-[9px] font-black px-1.5 py-px rounded uppercase tracking-widest text-sky-400 border border-sky-400/30 bg-sky-400/10">Creator</span>
                              )}
                              <p className="text-[10px] text-zinc-500">{relativeTime(c.created_at)}</p>
                            </div>
                            {parsed && (
                              <div className="flex items-center gap-1 mb-0.5 text-[10px] text-zinc-500">
                                <CornerDownRight size={9} />@{parsed.replyTo}
                              </div>
                            )}
                            <p className="text-xs text-zinc-300 leading-relaxed break-words">
                                {parsed ? parsed.text : c.body}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                                {currentUserId && (
                                  <button onClick={() => { setReplyingToId(isReplying ? null : c.id); setReplyText(''); }}
                                    className="text-[10px] font-bold text-zinc-500 hover:text-[#c4ff0d] transition-colors">
                                    {isReplying ? 'Cancel' : 'Reply'}
                                  </button>
                                )}
                                {currentUserId === c.user_id && (
                                  <button onClick={() => handleDeleteComment(c)}
                                    className="text-[10px] font-bold text-zinc-500 hover:text-red-400 transition-colors">Delete</button>
                                )}
                              </div>
                          </div>
                        </div>
                        {/* Inline reply input */}
                        {isReplying && (
                          <div className="ml-9 flex gap-2">
                            <input autoFocus value={replyText} onChange={e => setReplyText(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendReply(c)}
                              placeholder={`Reply to @${c.username}…`}
                              className="flex-1 bg-black/40 border border-[#c4ff0d]/30 rounded-lg text-xs px-3 py-1.5 text-zinc-300 placeholder:text-zinc-600 outline-none focus:border-[#c4ff0d]/60 min-w-0" />
                            <button onClick={() => handleSendReply(c)} disabled={!replyText.trim() || sendingReply}
                              className="shrink-0 bg-[#c4ff0d] hover:bg-[#d4ff3d] disabled:opacity-40 text-black px-3 rounded-lg text-xs font-bold transition-all">
                              {sendingReply ? '…' : 'Send'}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </>
              )}
            </div>

            {/* New comment input — pinned to bottom */}
            <div className="shrink-0 px-4 py-3 border-t border-white/8">
              {currentUserId ? (
                <div className="flex gap-2">
                  <input value={commentText} onChange={e => setCommentText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder="Add a comment…"
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg text-xs px-3 py-2 text-zinc-300 placeholder:text-zinc-600 outline-none focus:border-[#c4ff0d]/50 transition-all min-w-0" />
                  <button onClick={handleSend} disabled={!commentText.trim() || sending}
                    className="shrink-0 bg-[#c4ff0d] hover:bg-[#d4ff3d] disabled:opacity-40 text-black p-2 rounded-lg transition-all">
                    <Send size={13} />
                  </button>
                </div>
              ) : (
                <p className="text-xs text-zinc-600 text-center">Log in to comment</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

// ─── Upload modal ─────────────────────────────────────────────────────────────

interface CurrentLivery {
  modelId: string | null; modelPath: string | null;
  modelName: string | null;
  vehicleColor: string;
  panelNums: Record<string, number>; textures: Record<string, string>;
  captureThumb: () => string;
}

function UploadModal({ onClose, onUploaded, currentLivery }: {
  onClose: () => void; onUploaded: (p: ShowcasePost) => void; currentLivery?: CurrentLivery;
}) {
  const [postType, setPostType]   = useState<PostType>('image');
  const [file, setFile]           = useState<File | null>(null);
  const [preview, setPreview]     = useState<string | null>(null);
  const [title, setTitle]         = useState('');
  const [caption, setCaption]     = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [assetMode, setAssetMode] = useState<'textures' | 'roblox_ids'>('textures');
  const [robloxIds, setRobloxIds] = useState<Record<string, string>>({});
  const [rules, setRules]         = useState<RuleId[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const has3D = !!currentLivery?.modelId;
  const panelKeys = currentLivery ? Object.keys(currentLivery.panelNums).flatMap(face =>
    Array.from({ length: currentLivery.panelNums[face] }, (_, i) => `${face}${i + 1}`)
  ) : [];

  useEffect(() => {
    if ((postType === 'showcase' || postType === 'release') && currentLivery?.modelId && !file) {
      try {
        const dataUrl = currentLivery.captureThumb();
        const blob    = dataURLtoBlob(dataUrl);
        const f       = new File([blob], 'thumbnail.png', { type: 'image/png' });
        setFile(f); setPreview(dataUrl);
      } catch { /* ignore */ }
    }
  }, [postType]);

  const handleFile = (f: File) => { setFile(f); setPreview(URL.createObjectURL(f)); setUploadErr(null); };

  const handleSubmit = async () => {
    if (!file) return;
    if (caption.trim()) {
      const wl = await getWordFilter();
      if (hasBannedWord(caption, wl)) { setUploadErr('Your description contains a word that is not allowed.'); return; }
    }
    setUploading(true); setUploadErr(null);
    try {
      let livery: LiveryConfig | undefined;
      if ((postType === 'showcase' || postType === 'release') && currentLivery?.modelId) {
        const textures: Record<string, string> = {};
        if (assetMode === 'textures') {
          await Promise.all(Object.entries(currentLivery.textures).map(async ([k, v]) => {
            textures[k] = v.startsWith('data:') ? v : await blobToBase64(v);
          }));
        }
        livery = {
          modelId: currentLivery.modelId!, modelName: currentLivery.modelName ?? undefined,
          modelPath: currentLivery.modelPath!,
          vehicleColor: currentLivery.vehicleColor, panelNums: currentLivery.panelNums,
          textures,
          robloxIds: assetMode === 'roblox_ids' ? robloxIds : undefined,
          rules: postType === 'release' ? rules : undefined,
        };
      }
      onUploaded(await createPost(file, caption, postType, livery, title.trim() || undefined));
    } catch (e) { setUploadErr(e instanceof Error ? e.message : 'Upload failed'); }
    finally { setUploading(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-300">Post to Showcases</p>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={15} /></button>
        </div>

        <div className="flex gap-1.5 p-4 pb-0">
          {([
            { type: 'image', label: 'Image Post' },
            { type: 'showcase', label: '3D Showcase' },
            { type: 'release', label: 'Free Release' },
          ] as { type: PostType }[]).map(({ type, label }: any) => (
            <button key={type} onClick={() => setPostType(type)}
              className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg border transition-all ${postType === type ? 'border-[#c4ff0d]/50 bg-[#c4ff0d]/10 text-[#c4ff0d]' : 'border-white/10 bg-white/3 text-zinc-400 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-3">
          {postType === 'image' ? (
            <div onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) handleFile(f); }}
              onClick={() => inputRef.current?.click()}
              className={`relative rounded-xl border-2 border-dashed cursor-pointer transition-all overflow-hidden ${preview ? 'border-[#c4ff0d]/50' : 'border-white/10 hover:border-white/30'}`}>
              {preview
                ? <img src={preview} alt="" className="w-full aspect-video object-cover" />
                : <div className="flex flex-col items-center justify-center gap-2 py-10">
                    <Image size={32} className="text-zinc-700" strokeWidth={1.5} />
                    <p className="text-xs text-zinc-500">Click or drag to upload a screenshot</p>
                    <p className="text-[10px] text-zinc-700">PNG, JPG, WEBP — max 8 MB</p>
                  </div>
              }
              <input ref={inputRef} type="file" accept="image/*" className="hidden"
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </div>
          ) : !has3D ? (
            <div className="aspect-video flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-white/10 bg-zinc-950">
              <Box size={28} className="text-zinc-700" strokeWidth={1.5} />
              <div className="text-center">
                <p className="text-xs font-bold text-zinc-400">No vehicle loaded</p>
                <p className="text-[10px] text-zinc-600 mt-0.5">Choose a car in the Livery Previewer first</p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-[#c4ff0d]/30 overflow-hidden">
              {preview
                ? <img src={preview} alt="Thumbnail" className="w-full aspect-video object-cover" />
                : <div className="aspect-video flex items-center justify-center bg-zinc-900 text-zinc-700 text-xs">Generating thumbnail…</div>
              }
              <p className="text-[9px] text-zinc-600 px-3 py-2">Thumbnail auto-captured from your current view</p>
            </div>
          )}

          <div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">Post Name</p>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. LSPD Bullhorn Prancer"
              className="w-full bg-black/40 border border-white/10 rounded-lg text-xs px-3 py-2 text-zinc-300 placeholder:text-zinc-600 outline-none focus:border-[#c4ff0d]/50 transition-all" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">Description (optional) — use #tags</p>
            <textarea value={caption} onChange={e => setCaption(e.target.value)} placeholder="Describe your livery… #sports #clean #roblox"
              rows={2} className="w-full bg-black/40 border border-white/10 rounded-lg text-xs px-3 py-2 text-zinc-300 placeholder:text-zinc-600 outline-none focus:border-[#c4ff0d]/50 transition-all resize-none" />
          </div>

          {postType === 'release' && (
            <>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">Texture assets</p>
                <div className="flex gap-1.5">
                  {(['textures', 'roblox_ids'] as const).map(m => (
                    <button key={m} onClick={() => setAssetMode(m)}
                      className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg border transition-all ${assetMode === m ? 'border-[#c4ff0d]/50 bg-[#c4ff0d]/10 text-[#c4ff0d]' : 'border-white/10 bg-white/3 text-zinc-400 hover:text-white'}`}>
                      {m === 'textures' ? 'Image Files' : 'Roblox IDs'}
                    </button>
                  ))}
                </div>
              </div>
              {assetMode === 'roblox_ids' && panelKeys.length > 0 && (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
                  {panelKeys.map(panel => (
                    <div key={panel} className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-500 w-12 shrink-0 font-semibold">{panel}</span>
                      <input value={robloxIds[panel] ?? ''} onChange={e => setRobloxIds(p => ({ ...p, [panel]: e.target.value }))}
                        placeholder="Roblox asset ID"
                        className="flex-1 bg-black/40 border border-white/10 rounded-lg text-xs px-2.5 py-1.5 text-zinc-300 placeholder:text-zinc-600 outline-none focus:border-[#c4ff0d]/50 font-mono transition-all" />
                    </div>
                  ))}
                </div>
              )}
              <div>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">Usage rules</p>
                <div className="flex flex-wrap gap-1.5">
                  {RELEASE_RULES.map(r => {
                    const active = rules.includes(r.id);
                    return (
                      <button key={r.id} onClick={() => setRules(p => active ? p.filter(x => x !== r.id) : [...p, r.id])}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${active ? 'border-[#c4ff0d]/50 bg-[#c4ff0d]/10 text-[#c4ff0d]' : 'border-white/10 bg-white/3 text-zinc-400 hover:text-white'}`}>
                        {r.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {uploadErr && <p className="text-xs text-red-400 bg-red-900/20 border border-red-500/20 rounded-lg px-3 py-2">{uploadErr}</p>}
        </div>

        <div className="px-4 pb-4 flex gap-2">
          <button onClick={onClose} className="flex-1 text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 py-2.5 rounded-xl transition-all">Cancel</button>
          <button onClick={handleSubmit} disabled={!file || uploading || ((postType === 'showcase' || postType === 'release') && !has3D)}
            className="flex-1 flex items-center justify-center gap-2 text-xs font-bold bg-[#c4ff0d] hover:bg-[#d4ff3d] text-black py-2.5 rounded-xl transition-all disabled:opacity-40 shadow-lg shadow-[#c4ff0d]/20">
            {uploading ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <><Upload size={13} />Post</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function dataURLtoBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/png';
  const bytes = atob(data);
  const arr   = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

async function blobToBase64(url: string): Promise<string> {
  const res  = await fetch(url);
  const blob = await res.blob();
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(blob);
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Showcases() {
  const { posts, loading, refresh } = useContext(ShowcaseProvider);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<PostType>('all');
  const [selectedPost, setSelectedPost] = useState<ShowcasePost | null>(null);
  const [showUpload, setShowUpload] = useState(false);
    setLoading(true); setFetchErr(null);
    try { setPosts(await fetchPosts(s, tag ?? undefined)); }
    catch (e) { setFetchErr(e instanceof Error ? e.message : 'Failed to load'); }
    finally { setLoading(false); }
  }, [sort]);

  useEffect(() => { load(sort, activeTag); }, [sort, activeTag]);

  // Check URL for shared post on mount
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('showcase');
    if (!id) return;
    fetchPost(id).then(p => setActivePost(p)).catch(() => {});
  }, []);

  const handleUploaded = (post: ShowcasePost) => {
    setPosts(p => [post, ...p]);
    setShowUpload(false);
    setActivePost(post);
  };

  const handlePostDeleted = (id: string) => {
    setPosts(p => p.filter(x => x.id !== id));
    setActivePost(null);
  };

  const handleTagClick = (tag: string) => {
    setActiveTag(tag);
    setActivePost(null);
  };

  const filtered = posts.filter(p => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return p.username.toLowerCase().includes(q) || p.caption.toLowerCase().includes(q);
  });

  const SORT_LABELS: { key: SortMode; label: string }[] = [
    { key: 'new', label: 'New' },
    { key: 'liked', label: 'Most Liked' },
    { key: 'viewed', label: 'Most Viewed' },
    { key: 'comments', label: 'Most Comments' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0a0a]">
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onUploaded={handleUploaded} currentLivery={currentLivery} />}

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 shrink-0">
        <div>
          <p className="text-sm font-black uppercase tracking-widest text-white">Showcases</p>
          <p className="text-xs text-zinc-400 mt-0.5">{loading ? 'Loading…' : `${posts.length} post${posts.length === 1 ? '' : 's'}`}</p>
        </div>
        <div className="flex items-center gap-2">
          {user && !activePost && (
            <button onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg transition-all shadow-lg"
              style={{ background: ACCENT, color: '#000', boxShadow: `0 4px 16px ${ACCENT}33` }}>
              <Upload size={12} />Post Livery
            </button>
          )}
          <button onClick={onClose}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white text-xs font-bold px-3 py-2 rounded-lg transition-all">
            <X size={13} />Close
          </button>
        </div>
      </div>

      {/* Body */}
      {activePost ? (
        <div className="flex-1 min-h-0 overflow-hidden">
          <PostDetail
            post={activePost}
            currentUserId={user?.id}
            onBack={() => setActivePost(null)}
            onDeleted={() => handlePostDeleted(activePost.id)}
            onApplyLivery={livery => { onApplyLivery?.(livery); onClose(); }}
            onTagClick={handleTagClick}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Search + sort */}
          <div className="px-6 pt-4 pb-3 space-y-3 border-b border-white/8">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by username or description…"
                className="w-full bg-black/40 border border-white/10 rounded-lg text-xs pl-8 pr-3 py-2 text-zinc-300 placeholder:text-zinc-600 outline-none focus:border-[#c4ff0d]/40 transition-all" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {SORT_LABELS.map(({ key, label }) => (
                <button key={key} onClick={() => setSort(key)}
                  className={`text-xs font-bold px-3 py-1 rounded-lg border transition-all ${sort === key ? 'border-[#c4ff0d]/50 bg-[#c4ff0d]/10 text-[#c4ff0d]' : 'border-white/10 text-zinc-500 hover:text-zinc-300'}`}>
                  {label}
                </button>
              ))}
              {activeTag && (
                <button onClick={() => setActiveTag(null)}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-lg border border-[#c4ff0d]/30 bg-[#c4ff0d]/10 text-[#c4ff0d]">
                  <Hash size={10} />{activeTag}<X size={9} />
                </button>
              )}
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64 gap-3 flex-col">
                <div className="w-6 h-6 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
                <p className="text-xs text-zinc-500 uppercase tracking-widest">Loading…</p>
              </div>
            ) : fetchErr ? (
              <div className="flex items-center justify-center h-64 flex-col gap-3 text-center">
                <p className="text-sm text-red-400">{fetchErr}</p>
                <button onClick={() => load(sort, activeTag)} className="text-xs font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 px-4 py-2 rounded-lg">Retry</button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex items-center justify-center h-64 flex-col gap-4 text-center">
                <Image size={48} className="text-zinc-800" strokeWidth={1.5} />
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-zinc-600 mb-1">{search || activeTag ? 'No results' : 'No posts yet'}</p>
                  <p className="text-xs text-zinc-700">{search || activeTag ? 'Try a different search or tag' : 'Be the first to showcase your livery work'}</p>
                </div>
                {user && !search && !activeTag && (
                  <button onClick={() => setShowUpload(true)}
                    className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg"
                    style={{ background: ACCENT, color: '#000' }}>
                    <Upload size={13} />Post Livery
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map(post => (
                  <PostCard key={post.id} post={post} currentUserId={user?.id}
                    onClick={() => setActivePost(post)}
                    onDeleted={() => handlePostDeleted(post.id)}
                    onTagClick={handleTagClick} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
