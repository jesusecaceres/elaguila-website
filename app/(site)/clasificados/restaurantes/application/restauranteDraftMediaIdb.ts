/** IndexedDB KV for Restaurantes draft blobs — mirrors Servicios/Autos pattern. */

const DB_NAME = "lx-clasificados-restaurantes-draft";
const DB_VERSION = 1;
const STORE = "kv";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("indexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("idb open failed"));
  });
}

function key(namespace: string, segment: string, id?: string): string {
  return id ? `rt:${namespace}:${segment}:${id}` : `rt:${namespace}:${segment}`;
}

export async function idbRestaurantePutDataUrl(ns: string, segment: string, id: string | undefined, dataUrl: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(dataUrl, key(ns, segment, id));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("idb put failed"));
  });
}

export async function idbRestauranteGetDataUrl(ns: string, segment: string, id?: string): Promise<string | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(key(ns, segment, id));
      req.onsuccess = () => {
        const v = req.result;
        resolve(typeof v === "string" && v.trim().length > 0 ? v : null);
      };
      req.onerror = () => reject(req.error ?? new Error("idb get failed"));
    });
  } catch {
    return null;
  }
}

export async function idbRestauranteClearNamespace(namespace: string): Promise<void> {
  try {
    const db = await openDb();
    const prefix = `rt:${namespace}:`;
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      const req = store.openCursor();
      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor) return;
        const k = String(cursor.key ?? "");
        if (k.startsWith(prefix)) cursor.delete();
        cursor.continue();
      };
      req.onerror = () => reject(req.error ?? new Error("idb cursor failed"));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("idb tx failed"));
    });
  } catch {
    /* ignore */
  }
}
