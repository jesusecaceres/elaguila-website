/**
 * Stores large draft video (data URL) outside localStorage so JSON draft saves
 * do not hit quota and silently fail (which dropped dealer + media + video).
 */

const DB_NAME = "autos-negocios-draft";
const DB_VERSION = 1;
const STORE = "kv";
const VIDEO_KEY = "videoFileDataUrl";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("indexedDB open failed"));
  });
}

export async function idbPutDraftVideoDataUrl(dataUrl: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(dataUrl, VIDEO_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("idb put video failed"));
  });
}

export async function idbGetDraftVideoDataUrl(): Promise<string | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(VIDEO_KEY);
    req.onsuccess = () => {
      const v = req.result;
      resolve(typeof v === "string" && v.trim() ? v : null);
    };
    req.onerror = () => reject(req.error ?? new Error("idb get video failed"));
  });
}

export async function idbClearDraftVideo(): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(VIDEO_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("idb clear video failed"));
  });
}
