import type { MediaAssetKind } from '../types/builder';

const DB_NAME = 'slbuilder_media_library_v1';
const STORE_NAME = 'blobs';

const objectUrlCache = new Map<string, string>();

function openMediaDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is unavailable in this browser.'));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Failed to open media database.'));
  });
}

export async function saveMediaBlobToIdb(assetId: string, blob: Blob): Promise<string> {
  const db = await openMediaDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(blob, assetId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Failed to store media file.'));
  });
  db.close();
  const objectUrl = URL.createObjectURL(blob);
  const old = objectUrlCache.get(assetId);
  if (old) URL.revokeObjectURL(old);
  objectUrlCache.set(assetId, objectUrl);
  return objectUrl;
}

export async function loadMediaBlobUrlFromIdb(assetId: string): Promise<string | null> {
  const cached = objectUrlCache.get(assetId);
  if (cached) return cached;
  try {
    const db = await openMediaDb();
    const blob = await new Promise<Blob | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(assetId);
      req.onsuccess = () => resolve(req.result as Blob | undefined);
      req.onerror = () => reject(req.error);
    });
    db.close();
    if (!blob) return null;
    const url = URL.createObjectURL(blob);
    objectUrlCache.set(assetId, url);
    return url;
  } catch {
    return null;
  }
}

export async function deleteMediaBlobFromIdb(assetId: string): Promise<void> {
  const old = objectUrlCache.get(assetId);
  if (old) {
    URL.revokeObjectURL(old);
    objectUrlCache.delete(assetId);
  }
  try {
    const db = await openMediaDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(assetId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // ignore cleanup failure
  }
}

export function resolveMediaAssetUrl(
  rawUrl: string | undefined,
  resolvedMap: Record<string, string>
): string {
  if (!rawUrl) return '';
  if (rawUrl.startsWith('idb://')) {
    const id = rawUrl.slice('idb://'.length);
    return resolvedMap[id] || objectUrlCache.get(id) || '';
  }
  return rawUrl;
}

export function detectMediaKindFromFile(file: File): MediaAssetKind | null {
  const mime = (file.type || '').toLowerCase();
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'avif'].includes(ext)) {
    return 'image';
  }
  if (mime.startsWith('video/') || ['mp4', 'webm', 'mov', 'm4v', 'ogv'].includes(ext)) {
    return 'video';
  }
  if (mime.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(ext)) {
    return 'audio';
  }
  if (mime === 'application/pdf' || ext === 'pdf') {
    return 'pdf';
  }
  return null;
}

export function detectMediaKindFromUrl(url: string): MediaAssetKind {
  const lower = url.toLowerCase().trim();
  if (
    lower.includes('youtube.com') ||
    lower.includes('youtu.be') ||
    lower.includes('vimeo.com') ||
    /\.(mp4|webm|mov|m4v)(\?|$)/.test(lower)
  ) {
    return 'video';
  }
  if (/\.(mp3|wav|ogg|m4a|aac|flac)(\?|$)/.test(lower)) {
    return 'audio';
  }
  if (/\.pdf(\?|$)/.test(lower)) {
    return 'pdf';
  }
  return 'image';
}

export function formatMediaBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
