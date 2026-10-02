/**
 * Service for caching audio assets locally in the browser
 * using Cache Storage API with IndexedDB fallback.
 */

const CACHE_NAME = 'musica-en-familia-audio-v1';
const IDB_NAME = 'CoralMusicaEnFamiliaDB';
const IDB_STORE = 'audio_cache';

interface CachedMeta {
  url: string;
  hymnId: string;
  resourceKey: string;
  timestamp: number;
  blob?: Blob;
}

// Open IndexedDB
function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: 'url' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const AudioCacheService = {
  /**
   * Check if a URL or resource key is already cached locally
   */
  async isCached(url: string): Promise<boolean> {
    if (!url) return false;
    
    // Check Cache API first
    if ('caches' in window) {
      try {
        const cache = await caches.open(CACHE_NAME);
        const match = await cache.match(url);
        if (match) return true;
      } catch (e) {
        console.warn('Cache API check failed:', e);
      }
    }

    // Check IndexedDB
    try {
      const db = await openIndexedDB();
      return new Promise<boolean>((resolve) => {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const store = tx.objectStore(IDB_STORE);
        const req = store.get(url);
        req.onsuccess = () => resolve(!!req.result);
        req.onerror = () => resolve(false);
      });
    } catch {
      return false;
    }
  },

  /**
   * Fetch and cache an audio file
   */
  async cacheAudio(url: string, hymnId: string = '', resourceKey: string = ''): Promise<boolean> {
    if (!url) return false;

    try {
      let blob: Blob;

      if (url.startsWith('data:')) {
        // Base64 data URL
        const res = await fetch(url);
        blob = await res.blob();
      } else {
        const response = await fetch(url, { mode: 'cors' });
        if (!response.ok) {
          throw new Error(`Failed to fetch audio: ${response.statusText}`);
        }
        
        // Cache API storage
        if ('caches' in window) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(url, response.clone());
        }

        blob = await response.blob();
      }

      // Also store in IndexedDB as reliable blob storage
      try {
        const db = await openIndexedDB();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(IDB_STORE, 'readwrite');
          const store = tx.objectStore(IDB_STORE);
          const meta: CachedMeta = {
            url,
            hymnId,
            resourceKey,
            timestamp: Date.now(),
            blob,
          };
          const req = store.put(meta);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
      } catch (idbErr) {
        console.warn('IndexedDB save failed, Cache API used instead', idbErr);
      }

      return true;
    } catch (err) {
      console.error('Error caching audio:', err);
      return false;
    }
  },

  /**
   * Retrieve cached audio as an object URL (ready to play offline)
   */
  async getCachedAudioUrl(url: string): Promise<string | null> {
    if (!url) return null;

    // Check Cache API
    if ('caches' in window) {
      try {
        const cache = await caches.open(CACHE_NAME);
        const match = await cache.match(url);
        if (match) {
          const blob = await match.blob();
          return URL.createObjectURL(blob);
        }
      } catch (e) {
        console.warn('Cache API retrieve failed', e);
      }
    }

    // Check IndexedDB
    try {
      const db = await openIndexedDB();
      return new Promise<string | null>((resolve) => {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const store = tx.objectStore(IDB_STORE);
        const req = store.get(url);
        req.onsuccess = () => {
          if (req.result && req.result.blob) {
            resolve(URL.createObjectURL(req.result.blob));
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  },

  /**
   * Get all cached keys for quick UI badge lookup
   */
  async getAllCachedKeys(): Promise<Set<string>> {
    const set = new Set<string>();

    if ('caches' in window) {
      try {
        const cache = await caches.open(CACHE_NAME);
        const requests = await cache.keys();
        requests.forEach(r => set.add(r.url));
      } catch (e) {
        console.warn('Cache API keys failed', e);
      }
    }

    try {
      const db = await openIndexedDB();
      await new Promise<void>((resolve) => {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const store = tx.objectStore(IDB_STORE);
        const req = store.getAllKeys();
        req.onsuccess = () => {
          (req.result as string[]).forEach(k => set.add(k));
          resolve();
        };
        req.onerror = () => resolve();
      });
    } catch {}

    return set;
  },

  /**
   * Clear all audio cache
   */
  async clearAll(): Promise<void> {
    if ('caches' in window) {
      try {
        await caches.delete(CACHE_NAME);
      } catch {}
    }
    try {
      const db = await openIndexedDB();
      await new Promise<void>((resolve) => {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        const store = tx.objectStore(IDB_STORE);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      });
    } catch {}
  }
};

/**
 * Downloads an audio file with the exact requested format:
 * [NOMBRE DE LA CACION - VOZ].ext
 * Uses Blob URLs to ensure the browser strictly respects the custom filename
 * (avoiding browser default cross-origin filename overrides).
 */
export async function downloadAudioFile(
  url: string,
  songTitle: string,
  voiceName: string,
  originalFileName?: string
): Promise<void> {
  if (!url) return;

  // Determine file extension
  let ext = 'mp3';
  if (originalFileName && originalFileName.includes('.')) {
    const parts = originalFileName.split('.');
    ext = parts[parts.length - 1].toLowerCase();
  } else if (url && url.includes('.')) {
    const rawExt = url.split('.').pop()?.split('?')[0]?.split('#')[0]?.toLowerCase();
    if (rawExt && rawExt.length <= 4) {
      ext = rawExt;
    }
  }

  // Remove invalid filename characters
  const cleanSongTitle = songTitle.replace(/[\\/:*?"<>|]/g, '').trim();
  const cleanVoiceName = voiceName.replace(/[\\/:*?"<>|]/g, '').trim();
  const customFilename = `[${cleanSongTitle} - ${cleanVoiceName}].${ext}`;

  try {
    let blob: Blob | null = null;

    // Check Cache Storage first
    if ('caches' in window) {
      try {
        const cache = await caches.open(CACHE_NAME);
        const match = await cache.match(url);
        if (match) {
          blob = await match.blob();
        }
      } catch (e) {
        console.warn('Cache match failed:', e);
      }
    }

    // Check IndexedDB
    if (!blob) {
      try {
        const db = await openIndexedDB();
        blob = await new Promise<Blob | null>((resolve) => {
          const tx = db.transaction(IDB_STORE, 'readonly');
          const store = tx.objectStore(IDB_STORE);
          const req = store.get(url);
          req.onsuccess = () => {
            if (req.result && req.result.blob) {
              resolve(req.result.blob);
            } else {
              resolve(null);
            }
          };
          req.onerror = () => resolve(null);
        });
      } catch {}
    }

    // If not found in cache, fetch directly
    if (!blob) {
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      blob = await response.blob();
    }

    // Trigger download with Blob URL (guarantees custom filename)
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = customFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 20000);
  } catch (err) {
    console.warn('Blob download fallback:', err);
    const link = document.createElement('a');
    link.href = url;
    link.download = customFilename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

