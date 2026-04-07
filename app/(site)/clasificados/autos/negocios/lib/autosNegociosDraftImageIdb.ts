/**
 * IndexedDB blobs for large draft images (gallery files + dealer logo) so localStorage
 * quota does not silently drop the whole draft JSON.
 * Same DB + store as video (`autosNegociosDraftVideoIdb`).
 */

const DB_NAME = "autos-negocios-draft";
const DB_VERSION = 1;
const STORE = "kv";

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

function imgKey(namespace: string, imageId: string): string {
  return `img:${namespace}:${imageId}`;
}

const logoKey = (namespace: string) => `logo:${namespace}`;

export async function idbPutDraftImageDataUrl(namespace: string, imageId: string, dataUrl: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(dataUrl, imgKey(namespace, imageId));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("idb put image failed"));
  });
}

export async function idbGetDraftImageDataUrl(namespace: string, imageId: string): Promise<string | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(imgKey(namespace, imageId));
    req.onsuccess = () => {
      const v = req.result;
      resolve(typeof v === "string" && v.trim() ? v : null);
    };
    req.onerror = () => reject(req.error ?? new Error("idb get image failed"));
  });
}

export async function idbDeleteDraftImage(namespace: string, imageId: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(imgKey(namespace, imageId));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("idb delete image failed"));
  });
}

export async function idbPutDealerLogoDataUrl(namespace: string, dataUrl: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(dataUrl, logoKey(namespace));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("idb put logo failed"));
  });
}

export async function idbGetDealerLogoDataUrl(namespace: string): Promise<string | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(logoKey(namespace));
    req.onsuccess = () => {
      const v = req.result;
      resolve(typeof v === "string" && v.trim() ? v : null);
    };
    req.onerror = () => reject(req.error ?? new Error("idb get logo failed"));
  });
}

export async function idbClearDealerLogo(namespace: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(logoKey(namespace));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("idb clear logo failed"));
  });
}
