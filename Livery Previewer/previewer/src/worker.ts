export interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  SHOWCASE_IMAGES: R2Bucket;
}

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function addCors(h: Headers): void {
  h.set('Access-Control-Allow-Origin', '*');
  h.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  h.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function json(data: unknown, status = 200): Response {
  const h = new Headers({ 'Content-Type': 'application/json' });
  addCors(h);
  return new Response(JSON.stringify(data), { status, headers: h });
}

function err(msg: string, status = 400): Response {
  return json({ error: msg }, status);
}

async function getUser(req: Request): Promise<{
  id: string; username: string; global_name: string | null; avatar: string | null;
} | null> {
  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const res = await fetch('https://discord.com/api/v10/users/@me', { headers: { Authorization: auth } });
  if (!res.ok) return null;
  return res.json() as Promise<{ id: string; username: string; global_name: string | null; avatar: string | null }>;
}

function postSelect(viewerId: string | null) {
  return `
    SELECT p.*,
      (SELECT COUNT(*)  FROM showcase_comments WHERE post_id=p.id)                                       AS comment_count,
      (SELECT COUNT(*)  FROM post_views        WHERE post_id=p.id)                                       AS view_count,
      (SELECT COALESCE(SUM(CASE WHEN value=1  THEN 1 ELSE 0 END),0) FROM post_likes WHERE post_id=p.id) AS like_count,
      (SELECT COALESCE(SUM(CASE WHEN value=-1 THEN 1 ELSE 0 END),0) FROM post_likes WHERE post_id=p.id) AS dislike_count,
      (SELECT value FROM post_likes WHERE post_id=p.id AND user_id=${viewerId ? '?' : 'NULL'})           AS user_reaction
    FROM showcase_posts p
  `;
}

const API_PREFIX = '/previewer/api/showcases';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url    = new URL(request.url);
    const path   = url.pathname;
    const method = request.method;

    if (method === 'OPTIONS') {
      const h = new Headers(); addCors(h);
      return new Response(null, { status: 204, headers: h });
    }

    // ── Vehicle model proxy ───────────────────────────────────────────────────
    if (path.startsWith('/previewer/api/models/')) {
      const key      = path.slice('/previewer/api/models/'.length);
      const upstream = await fetch(`https://pub-13c1fc73579544bdb2eb07e28434bd74.r2.dev/${key}`);
      if (!upstream.ok) return err('Model not found', 404);
      const h = new Headers();
      h.set('Content-Type', 'model/gltf-binary');
      h.set('Cache-Control', 'public, max-age=86400');
      addCors(h);
      return new Response(upstream.body, { status: 200, headers: h });
    }

    // ── Serve static assets (SPA fallback) ────────────────────────────────────
 if (!path.startsWith(API_PREFIX)) {
  // Strip /previewer prefix for asset lookup
  const assetPath = path.startsWith('/previewer') ? path.slice('/previewer'.length) || '/' : path;
  const assetUrl = new URL(assetPath, request.url);
  const assetRequest = new Request(assetUrl, request);
  const assetResponse = await env.ASSETS.fetch(assetRequest);
  if (assetResponse.status === 404) {
    return env.ASSETS.fetch(new Request(new URL('/index.html', request.url)));
  }
  return assetResponse;
}

    // ── Serve R2 image ────────────────────────────────────────────────────────
    const assetMatch = path.match(/^\/previewer\/api\/showcases\/images\/(.+)$/);
    if (assetMatch && method === 'GET') {
      const obj = await env.SHOWCASE_IMAGES.get(decodeURIComponent(assetMatch[1]));
      if (!obj) return err('Not found', 404);
      const h = new Headers(); obj.writeHttpMetadata(h);
      h.set('Cache-Control', 'public, max-age=31536000, immutable');
      addCors(h);
      return new Response(obj.body, { headers: h });
    }

    // ── Livery config ─────────────────────────────────────────────────────────
    const liveryMatch = path.match(/^\/previewer\/api\/showcases\/livery\/(.+)$/);
    if (liveryMatch && method === 'GET') {
      const obj = await env.SHOWCASE_IMAGES.get(decodeURIComponent(liveryMatch[1]));
      if (!obj) return err('Not found', 404);
      const h = new Headers({ 'Content-Type': 'application/json' });
      addCors(h);
      return new Response(obj.body, { headers: h });
    }

    // ── Reactions ─────────────────────────────────────────────────────────────
    const reactMatch = path.match(/^\/previewer\/api\/showcases\/([^/]+)\/react$/);
    if (reactMatch) {
      const [, postId] = reactMatch;
      const user = await getUser(request);
      if (!user) return err('Unauthorized', 401);
      const name = user.global_name ?? user.username;

      if (method === 'POST') {
        const { value } = await request.json<{ value: 1 | -1 }>();
        if (value !== 1 && value !== -1) return err('value must be 1 or -1');
        await env.DB.prepare(
          'INSERT INTO post_likes (post_id,user_id,username,avatar,value,created_at) VALUES (?,?,?,?,?,?) ON CONFLICT(post_id,user_id) DO UPDATE SET value=excluded.value,created_at=excluded.created_at'
        ).bind(postId, user.id, name, user.avatar, value, Date.now()).run();
        return json({ ok: true });
      }
      if (method === 'DELETE') {
        await env.DB.prepare('DELETE FROM post_likes WHERE post_id=? AND user_id=?').bind(postId, user.id).run();
        return json({ ok: true });
      }
    }

    // ── View tracking ─────────────────────────────────────────────────────────
    const viewMatch = path.match(/^\/previewer\/api\/showcases\/([^/]+)\/view$/);
    if (viewMatch && method === 'POST') {
      const [, postId] = viewMatch;
      const user = await getUser(request);
      const name = user ? (user.global_name ?? user.username) : null;
      if (user) {
        const existing = await env.DB.prepare(
          'SELECT id FROM post_views WHERE post_id=? AND user_id=? LIMIT 1'
        ).bind(postId, user.id).first();
        if (!existing) {
          await env.DB.prepare(
            'INSERT INTO post_views (id,post_id,user_id,username,avatar,created_at) VALUES (?,?,?,?,?,?)'
          ).bind(crypto.randomUUID(), postId, user.id, name, user.avatar, Date.now()).run().catch(() => {});
        }
      } else {
        await env.DB.prepare(
          'INSERT INTO post_views (id,post_id,user_id,username,avatar,created_at) VALUES (?,?,?,?,?,?)'
        ).bind(crypto.randomUUID(), postId, null, null, null, Date.now()).run().catch(() => {});
      }
      return json({ ok: true });
    }

    // ── Analytics (owner only) ────────────────────────────────────────────────
    const analyticsMatch = path.match(/^\/previewer\/api\/showcases\/([^/]+)\/analytics$/);
    if (analyticsMatch && method === 'GET') {
      const [, postId] = analyticsMatch;
      const user = await getUser(request);
      if (!user) return err('Unauthorized', 401);
      const post = await env.DB.prepare('SELECT user_id FROM showcase_posts WHERE id=?').bind(postId).first<{ user_id: string }>();
      if (!post) return err('Not found', 404);
      if (post.user_id !== user.id) return err('Forbidden', 403);

      const [viewsRes, likesRes, dislikesRes, viewersRes, reactorsRes] = await Promise.all([
        env.DB.prepare('SELECT COUNT(*) as n FROM post_views WHERE post_id=?').bind(postId).first<{ n: number }>(),
        env.DB.prepare('SELECT COUNT(*) as n FROM post_likes WHERE post_id=? AND value=1').bind(postId).first<{ n: number }>(),
        env.DB.prepare('SELECT COUNT(*) as n FROM post_likes WHERE post_id=? AND value=-1').bind(postId).first<{ n: number }>(),
        env.DB.prepare('SELECT user_id,username,avatar,created_at FROM post_views WHERE post_id=? AND user_id IS NOT NULL ORDER BY created_at DESC LIMIT 50').bind(postId).all(),
        env.DB.prepare('SELECT user_id,username,avatar,value,created_at FROM post_likes WHERE post_id=? ORDER BY created_at DESC').bind(postId).all(),
      ]);

      return json({
        views:    viewsRes?.n    ?? 0,
        likes:    likesRes?.n    ?? 0,
        dislikes: dislikesRes?.n ?? 0,
        viewers:  viewersRes.results,
        reactors: reactorsRes.results,
      });
    }

    // ── Comments ──────────────────────────────────────────────────────────────
    const commentsBase = path.match(/^\/previewer\/api\/showcases\/([^/]+)\/comments$/);
    if (commentsBase) {
      const [, postId] = commentsBase;
      if (method === 'GET') {
        const { results } = await env.DB.prepare(
          'SELECT * FROM showcase_comments WHERE post_id=? ORDER BY created_at ASC'
        ).bind(postId).all();
        return json(results);
      }
      if (method === 'POST') {
        const user = await getUser(request);
        if (!user) return err('Unauthorized', 401);
        const { body } = await request.json<{ body: string }>();
        if (!body?.trim()) return err('Comment cannot be empty');
        const id = crypto.randomUUID(); const now = Date.now();
        const name = user.global_name ?? user.username;
        await env.DB.prepare(
          'INSERT INTO showcase_comments (id,post_id,user_id,username,avatar,body,created_at) VALUES (?,?,?,?,?,?,?)'
        ).bind(id, postId, user.id, name, user.avatar, body.trim(), now).run();
        return json({ id, post_id: postId, user_id: user.id, username: name, avatar: user.avatar, body: body.trim(), created_at: now }, 201);
      }
    }

    // ── Edit / Delete comment ─────────────────────────────────────────────────
    const commentSingle = path.match(/^\/previewer\/api\/showcases\/([^/]+)\/comments\/([^/]+)$/);
    if (commentSingle) {
      const [, postId, commentId] = commentSingle;
      const user = await getUser(request);
      if (!user) return err('Unauthorized', 401);
      const row = await env.DB.prepare('SELECT user_id FROM showcase_comments WHERE id=? AND post_id=?').bind(commentId, postId).first<{ user_id: string }>();
      if (!row) return err('Not found', 404);
      if (row.user_id !== user.id) return err('Forbidden', 403);

      if (method === 'PATCH') {
        const { body } = await request.json<{ body: string }>();
        if (!body?.trim()) return err('Comment cannot be empty');
        const now = Date.now();
        await env.DB.prepare('UPDATE showcase_comments SET body=?,edited_at=? WHERE id=?').bind(body.trim(), now, commentId).run();
        return json({ ok: true });
      }
      if (method === 'DELETE') {
        await env.DB.prepare('DELETE FROM showcase_comments WHERE id=?').bind(commentId).run();
        return json({ ok: true });
      }
    }

    // ── List posts ────────────────────────────────────────────────────────────
    if (path === '/previewer/api/showcases' && method === 'GET') {
      const viewer = request.headers.get('Authorization')?.startsWith('Bearer ')
        ? await getUser(request) : null;
      const viewerId = viewer?.id ?? null;

      const sortParam = url.searchParams.get('sort') ?? 'new';
      const tagParam  = url.searchParams.get('tag') ?? '';
      const orderBy   = sortParam === 'liked'    ? 'like_count DESC, p.created_at DESC'
                      : sortParam === 'viewed'   ? 'view_count DESC, p.created_at DESC'
                      : sortParam === 'comments' ? 'comment_count DESC, p.created_at DESC'
                      : 'p.created_at DESC';
      const tagFilter = tagParam
        ? `AND p.caption LIKE '%#${tagParam.replace(/'/g, "''")}%'`
        : '';

      let results: unknown[];
      try {
        const sel = postSelect(viewerId);
        const binds = viewerId ? [viewerId] : [];
        ({ results } = await env.DB.prepare(
          `${sel} WHERE 1=1 ${tagFilter} ORDER BY ${orderBy} LIMIT 100`
        ).bind(...binds).all());
      } catch {
        return err('Database not initialised', 503);
      }
      return json(results);
    }

    // ── Create post ───────────────────────────────────────────────────────────
    if (path === '/previewer/api/showcases' && method === 'POST') {
      const user = await getUser(request);
      if (!user) return err('Unauthorized', 401);

      const form      = await request.formData();
      const file      = form.get('image') as File | null;
      const caption   = (form.get('caption')   as string | null) ?? '';
      const postType  = (form.get('post_type') as string | null) ?? 'image';
      const liveryRaw = form.get('livery')     as string | null;

      if (!file) return err('No image provided');
      if (file.size > MAX_IMAGE_BYTES) return err('Image too large — max 8 MB');

      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png';
      const imgKey = `${user.id}/${crypto.randomUUID()}.${ext}`;
      await env.SHOWCASE_IMAGES.put(imgKey, file.stream(), {
        httpMetadata: { contentType: file.type || 'application/octet-stream' },
      });

      let liveryKey: string | null = null;
      if (liveryRaw && (postType === 'showcase' || postType === 'release')) {
        liveryKey = `liveries/${user.id}/${crypto.randomUUID()}.json`;
        await env.SHOWCASE_IMAGES.put(liveryKey, new TextEncoder().encode(liveryRaw), {
          httpMetadata: { contentType: 'application/json' },
        });
      }

      const id = crypto.randomUUID(); const now = Date.now();
      const name = user.global_name ?? user.username;
      await env.DB.prepare(
        'INSERT INTO showcase_posts (id,user_id,username,avatar,image_key,caption,created_at,post_type,livery_key) VALUES (?,?,?,?,?,?,?,?,?)'
      ).bind(id, user.id, name, user.avatar, imgKey, caption.trim(), now, postType, liveryKey).run();

      return json({ id, user_id: user.id, username: name, avatar: user.avatar, image_key: imgKey,
        caption: caption.trim(), created_at: now, post_type: postType, livery_key: liveryKey,
        comment_count: 0, view_count: 0, like_count: 0, dislike_count: 0 }, 201);
    }

    // ── Single post: GET / PATCH / DELETE ─────────────────────────────────────
    const postMatch = path.match(/^\/previewer\/api\/showcases\/([^/]+)$/);
    if (postMatch) {
      const postId = postMatch[1];

      if (method === 'GET') {
        const viewer2 = request.headers.get('Authorization')?.startsWith('Bearer ')
          ? await getUser(request) : null;
        const vid = viewer2?.id ?? null;
        const sel = postSelect(vid);
        const binds = vid ? [vid, postId] : [postId];
        const row = await env.DB.prepare(`${sel} WHERE p.id=?`).bind(...binds).first();
        if (!row) return err('Not found', 404);
        return json(row);
      }

      if (method === 'PATCH') {
        const user = await getUser(request);
        if (!user) return err('Unauthorized', 401);
        const { caption } = await request.json<{ caption: string }>();
        const row = await env.DB.prepare('SELECT user_id FROM showcase_posts WHERE id=?').bind(postId).first<{ user_id: string }>();
        if (!row) return err('Not found', 404);
        if (row.user_id !== user.id) return err('Forbidden', 403);
        await env.DB.prepare('UPDATE showcase_posts SET caption=? WHERE id=?').bind(caption.trim(), postId).run();
        return json({ ok: true });
      }

      if (method === 'DELETE') {
        const user = await getUser(request);
        if (!user) return err('Unauthorized', 401);
        const row = await env.DB.prepare('SELECT user_id,image_key,livery_key FROM showcase_posts WHERE id=?')
          .bind(postId).first<{ user_id: string; image_key: string; livery_key: string | null }>();
        if (!row) return err('Not found', 404);
        if (row.user_id !== user.id) return err('Forbidden', 403);
        await env.SHOWCASE_IMAGES.delete(row.image_key);
        if (row.livery_key) await env.SHOWCASE_IMAGES.delete(row.livery_key);
        await env.DB.prepare('DELETE FROM showcase_posts WHERE id=?').bind(postId).run();
        return json({ ok: true });
      }
    }

    return err('Not found', 404);
  },
};
