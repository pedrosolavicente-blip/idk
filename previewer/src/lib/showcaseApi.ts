import { getStoredToken } from './discordAuth';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PostType = 'image' | 'showcase' | 'release';

export interface ShowcasePost {
  id:            string;
  user_id:       string;
  username:      string;
  avatar:        string | null;
  image_key:     string;
  caption:       string;
  created_at:    number;
  post_type:     PostType;
  livery_key:    string | null;
  comment_count: number;
  view_count:    number;
  like_count:    number;
  dislike_count: number;
  // client-side only (not from API)
  user_reaction?: 1 | -1 | null;
}

export interface ShowcaseComment {
  id: string; post_id: string; user_id: string;
  username: string; avatar: string | null; body: string; created_at: number;
  edited_at?: number | null;
}

export const RELEASE_RULES = [
  { id: 'no_reselling',   label: 'No reselling' },
  { id: 'credit',         label: 'Credit required' },
  { id: 'members_only',   label: 'itzz members only' },
  { id: 'personal_only',  label: 'Personal use only' },
  { id: 'no_edits',       label: 'No edits without permission' },
] as const;
export type RuleId = typeof RELEASE_RULES[number]['id'];

export interface LiveryConfig {
  modelId:      string;
  modelName?:   string;
  modelPath:    string;
  vehicleColor: string;
  panelNums:    Record<string, number>;
  textures:     Record<string, string>; // panel → base64 data URL (may be empty if using roblox IDs)
  robloxIds?:   Record<string, string>; // panel → Roblox asset ID
  rules?:       RuleId[];
}

export interface Analytics {
  views:    number;
  likes:    number;
  dislikes: number;
  viewers:  { user_id: string; username: string | null; avatar: string | null; created_at: number }[];
  reactors: { user_id: string; username: string; avatar: string | null; value: number; created_at: number }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function avatarUrl(userId: string, avatarHash: string | null): string {
  if (!avatarHash) return `https://cdn.discordapp.com/embed/avatars/${Number(BigInt(userId) % 5n)}.png`;
  return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png?size=64`;
}

export function imageUrl(imageKey: string): string {
  return `/api/showcases/images/${encodeURIComponent(imageKey)}`;
}

export function liveryConfigUrl(liveryKey: string): string {
  return `/api/showcases/livery/${encodeURIComponent(liveryKey)}`;
}

export function relativeTime(ts: number): string {
  const d = Date.now() - ts;
  if (d < 60_000)    return 'just now';
  if (d < 3600_000)  return `${Math.floor(d / 60_000)}m ago`;
  if (d < 86400_000) return `${Math.floor(d / 3600_000)}h ago`;
  return `${Math.floor(d / 86400_000)}d ago`;
}

function authHeaders(): Record<string, string> {
  const t = getStoredToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const b = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(b.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Posts ────────────────────────────────────────────────────────────────────

export async function fetchPosts(sort = 'new', tag?: string): Promise<ShowcasePost[]> {
  const p = new URLSearchParams({ sort });
  if (tag) p.set('tag', tag);
  return handle(await fetch(`/api/showcases?${p}`, { headers: authHeaders() }));
}

export async function fetchPost(id: string): Promise<ShowcasePost> {
  return handle(await fetch(`/api/showcases/${id}`, { headers: authHeaders() }));
}

export async function editPost(id: string, caption: string): Promise<void> {
  await handle(await fetch(`/api/showcases/${id}`, {
    method: 'PATCH',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ caption }),
  }));
}

export async function editComment(postId: string, commentId: string, body: string): Promise<void> {
  await handle(await fetch(`/api/showcases/${postId}/comments/${commentId}`, {
    method: 'PATCH',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ body }),
  }));
}

export async function createPost(
  image: File,
  caption: string,
  postType: PostType,
  livery?: LiveryConfig,
): Promise<ShowcasePost> {
  const form = new FormData();
  form.append('image', image);
  form.append('caption', caption);
  form.append('post_type', postType);
  if (livery) form.append('livery', JSON.stringify(livery));
  return handle(await fetch('/api/showcases', { method: 'POST', headers: authHeaders(), body: form }));
}

export async function deletePost(id: string): Promise<void> {
  await handle(await fetch(`/api/showcases/${id}`, { method: 'DELETE', headers: authHeaders() }));
}

export async function fetchLiveryConfig(liveryKey: string): Promise<LiveryConfig> {
  return handle(await fetch(liveryConfigUrl(liveryKey)));
}

// ─── Reactions ────────────────────────────────────────────────────────────────

export async function reactToPost(postId: string, value: 1 | -1): Promise<void> {
  await handle(await fetch(`/api/showcases/${postId}/react`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ value }),
  }));
}

export async function removeReaction(postId: string): Promise<void> {
  await handle(await fetch(`/api/showcases/${postId}/react`, {
    method: 'DELETE', headers: authHeaders(),
  }));
}

// ─── Views ────────────────────────────────────────────────────────────────────

export async function recordView(postId: string): Promise<void> {
  fetch(`/api/showcases/${postId}/view`, {
    method: 'POST', headers: authHeaders(),
  }).catch(() => {});
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function fetchAnalytics(postId: string): Promise<Analytics> {
  return handle(await fetch(`/api/showcases/${postId}/analytics`, { headers: authHeaders() }));
}

// ─── Comments ────────────────────────────────────────────────────────────────

export async function fetchComments(postId: string): Promise<ShowcaseComment[]> {
  return handle(await fetch(`/api/showcases/${postId}/comments`));
}

export async function addComment(postId: string, body: string): Promise<ShowcaseComment> {
  return handle(await fetch(`/api/showcases/${postId}/comments`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ body }),
  }));
}

export async function deleteComment(postId: string, commentId: string): Promise<void> {
  await handle(await fetch(`/api/showcases/${postId}/comments/${commentId}`, {
    method: 'DELETE', headers: authHeaders(),
  }));
}
