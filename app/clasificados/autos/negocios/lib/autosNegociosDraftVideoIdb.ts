/**
 * Stores large draft video (data URL) outside localStorage, keyed by draft namespace
 * so quota failures do not drop dealer + media, and users do not share one video slot.
 */

const DB_NAME = "autos-negocios-draft";
const DB_VERSION = 1;
const STORE = "kv";

/** Pre–7C single-object key inside the same store. */
const LEGACY_VIDEO_IDB_KEY = "videoFileDataUrl";

function videoKeyForNamespace(namespace: string): string {
  return `video:${namespace}`;
}

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

function idbDeleteRawKey(rawKey: string): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).delete(rawKey);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error ?? new Error("idb delete failed"));
      }),
  );
}

export async function idbPutDraftVideoDataUrl(namespace: string, dataUrl: string): Promise<void> {
  const db = await openDb();
  const key = videoKeyForNamespace(namespace);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(dataUrl, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("idb put video failed"));
  });
}

export async function idbGetDraftVideoDataUrl(namespace: string): Promise<string | null> {
  const db = await openDb();
  const key = videoKeyForNamespace(namespace);

  const scoped = await new Promise<string | null>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => {
      const v = req.result;
      resolve(typeof v === "string" && v.trim() ? v : null);
    };
    req.onerror = () => reject(req.error ?? new Error("idb get video failed"));
  });

  if (scoped) return scoped;

  if (!namespace.startsWith("anon:")) return null;

  const legacy = await new Promise<string | null>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(LEGACY_VIDEO_IDB_KEY);
    req.onsuccess = () => {
      const v = req.result;
      resolve(typeof v === "string" && v.trim() ? v : null);
    };
    req.onerror = () => reject(req.error ?? new Error("idb get legacy video failed"));
  });

  if (!legacy) return null;
  await idbPutDraftVideoDataUrl(namespace, legacy);
  await idbDeleteRawKey(LEGACY_VIDEO_IDB_KEY);
  return legacy;
}

export async function idbClearDraftVideo(namespace: string): Promise<void> {
  const db = await openDb();
  const key = videoKeyForNamespace(namespace);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("idb clear video failed"));
  });
}
