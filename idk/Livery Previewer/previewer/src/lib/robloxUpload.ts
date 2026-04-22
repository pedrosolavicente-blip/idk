function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function fetchCsrfToken(cookie: string): Promise<string> {
  const res = await fetch('/roblox-auth/v2/logout', {
    method: 'POST',
    headers: {
      Cookie: `.ROBLOSECURITY=${cookie}`,
    },
  });
  const token = res.headers.get('x-csrf-token');
  if (!token) throw new Error('Could not get CSRF token — check your cookie is valid');
  return token;
}

async function blobFromUrl(url: string): Promise<Blob> {
  const res = await fetch(url);
  return res.blob();
}

async function uploadOnce(
  blob: Blob,
  name: string,
  cookie: string,
  csrf: string,
  groupId?: string,
): Promise<string> {
  const params = new URLSearchParams({
    assetid: '0',
    type: 'Decal',
    name,
    description: 'Uploaded via ITZZ Livery Previewer',
    genreTypeId: '1',
    ispublic: 'False',
    allowComments: 'False',
  });
  if (groupId) params.set('groupid', groupId);

  const res = await fetch(`/roblox-data/Data/Upload.ashx?${params}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'image/png',
      Cookie: `.ROBLOSECURITY=${cookie}`,
      'X-CSRF-TOKEN': csrf,
    },
    body: blob,
  });

  const text = await res.text();

  if (!res.ok) {
    if (res.status === 403 && res.headers.get('x-csrf-token')) {
      throw Object.assign(new Error('CSRF_ROTATE'), {
        newCsrf: res.headers.get('x-csrf-token')!,
      });
    }
    throw new Error(`Upload failed (${res.status}): ${text}`);
  }

  const id = text.trim();
  if (!id || isNaN(Number(id))) throw new Error(`Unexpected response: ${text}`);
  return id;
}

async function uploadOnceWithRetry(
  blob: Blob,
  name: string,
  cookie: string,
  csrf: string,
  groupId?: string,
): Promise<string> {
  try {
    return await uploadOnce(blob, name, cookie, csrf, groupId);
  } catch (e: any) {
    if (e.message === 'CSRF_ROTATE') {
      return uploadOnce(blob, name, cookie, e.newCsrf, groupId);
    }
    throw e;
  }
}

export interface UploadResult {
  assetId: string;
  rbxassetid: string;
}

export async function uploadDecalToRoblox(
  textureUrl: string,
  name: string,
  cookie: string,
  groupId?: string,
  onStatus?: (msg: string) => void,
): Promise<UploadResult> {
  onStatus?.('Getting CSRF token…');
  const csrf = await fetchCsrfToken(cookie);

  const blob = await blobFromUrl(textureUrl);

  onStatus?.('Upload 1 of 2…');
  await uploadOnceWithRetry(blob, `${name}_v1`, cookie, csrf, groupId);

  await sleep(1500);

  onStatus?.('Upload 2 of 2 (sharpening)…');
  const assetId = await uploadOnceWithRetry(blob, name, cookie, csrf, groupId);

  return { assetId, rbxassetid: `rbxassetid://${assetId}` };
}
