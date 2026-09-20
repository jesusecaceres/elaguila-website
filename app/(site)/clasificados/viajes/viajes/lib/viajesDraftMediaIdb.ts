/**
 * IndexedDB store for large Viajes draft images (privado / negocios).
 * Keeps localStorage JSON small; blobs survive refresh when IDB is available.
 */

const DB_NAME = "leonix-viajes-draft-media-v1";
const STORE = "media";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onerror = () => reject(req.error ?? new Error("indexedDB open failed"));
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE);
      }
    };
  });
}

function storeKey(scope: string, id: string) {
  return `${scope}:${id}`;
}

export function newViajesDraftMediaId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `hero-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function viajesDraftMediaPut(scope: string, id: string, file: Blob): Promise<void> {
  const db = await openDb();
  const key = storeKey(scope, id);
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("idb put failed"));
      tx.objectStore(STORE).put(file, key);
    });
  } finally {
    db.close();
  }
}

export async function viajesDraftMediaGetBlob(scope: string, id: string): Promise<Blob | null> {
  const db = await openDb();
  const key = storeKey(scope, id);
  try {
    return await new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const r = tx.objectStore(STORE).get(key);
      r.onsuccess = () => resolve((r.result as Blob | undefined) ?? null);
      r.onerror = () => reject(r.error ?? new Error("idb get failed"));
    });
  } finally {
    db.close();
  }
}

export async function viajesDraftMediaDelete(scope: string, id: string): Promise<void> {
  const db = await openDb();
  const key = storeKey(scope, id);
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("idb delete failed"));
      tx.objectStore(STORE).delete(key);
    });
  } finally {
    db.close();
  }
}
