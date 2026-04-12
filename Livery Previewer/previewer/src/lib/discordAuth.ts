import { DISCORD_CLIENT_ID, DISCORD_GUILD_ID } from './config';

const REDIRECT_URI = window.location.origin + window.location.pathname;

export interface DiscordUser {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
}

function b64url(buf: Uint8Array): string {
  return btoa(String.fromCharCode(...buf))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function makeVerifier(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return b64url(arr);
}

async function makeChallenge(verifier: string): Promise<string> {
  const data   = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return b64url(new Uint8Array(digest));
}

export async function redirectToDiscordLogin(): Promise<void> {
  const verifier   = makeVerifier();
  const challenge  = await makeChallenge(verifier);
  sessionStorage.setItem('discord_pkce_verifier', verifier);

  const params = new URLSearchParams({
    client_id:             DISCORD_CLIENT_ID,
    redirect_uri:          REDIRECT_URI,
    response_type:         'code',
    scope:                 'identify guilds',
    code_challenge:        challenge,
    code_challenge_method: 'S256',
  });

  window.location.href = `https://discord.com/oauth2/authorize?${params}`;
}

export function extractCodeFromUrl(): string | null {
  return new URLSearchParams(window.location.search).get('code');
}

async function exchangeCode(code: string): Promise<{ access_token: string; expires_in: number }> {
  const verifier = sessionStorage.getItem('discord_pkce_verifier');
  if (!verifier) throw new Error('PKCE verifier missing — please try logging in again.');

  const res = await fetch('https://discord.com/api/oauth2/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams({
      client_id:     DISCORD_CLIENT_ID,
      code,
      grant_type:    'authorization_code',
      redirect_uri:  REDIRECT_URI,
      code_verifier: verifier,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`Discord token exchange failed: ${err || res.status}`);
  }

  sessionStorage.removeItem('discord_pkce_verifier');
  return res.json();
}

async function fetchUser(token: string): Promise<DiscordUser> {
  const res = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch Discord user');
  return res.json();
}

async function isInGuild(token: string): Promise<boolean> {
  const res = await fetch('https://discord.com/api/users/@me/guilds', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return false;
  const guilds: { id: string }[] = await res.json();
  return guilds.some(g => g.id === DISCORD_GUILD_ID);
}

const KEY_TOKEN  = 'discord_token';
const KEY_EXPIRY = 'discord_token_expiry';

function saveToken(token: string, expiresIn: number): void {
  localStorage.setItem(KEY_TOKEN,  token);
  localStorage.setItem(KEY_EXPIRY, String(Date.now() + expiresIn * 1000));
}

export function getStoredToken(): string | null {
  const token  = localStorage.getItem(KEY_TOKEN);
  const expiry = localStorage.getItem(KEY_EXPIRY);
  if (!token || !expiry) return null;
  if (Date.now() > Number(expiry)) {
    clearAuth();
    return null;
  }
  return token;
}

export function clearAuth(): void {
  localStorage.removeItem(KEY_TOKEN);
  localStorage.removeItem(KEY_EXPIRY);
}

export async function handleAuthCallback(): Promise<DiscordUser> {
  const code = extractCodeFromUrl();
  if (!code) throw new Error('No auth code in URL');

  history.replaceState(null, '', window.location.pathname);

  const { access_token, expires_in } = await exchangeCode(code);
  saveToken(access_token, expires_in);

  const [user, inGuild] = await Promise.all([
    fetchUser(access_token),
    isInGuild(access_token),
  ]);

  if (!inGuild) {
    clearAuth();
    throw new Error('Access denied — you must be a member of the itzz Discord server.');
  }

  return user;
}

export async function validateStoredToken(): Promise<DiscordUser | null> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const [user, inGuild] = await Promise.all([
      fetchUser(token),
      isInGuild(token),
    ]);
    if (!inGuild) { clearAuth(); return null; }
    return user;
  } catch {
    clearAuth();
    return null;
  }
}
