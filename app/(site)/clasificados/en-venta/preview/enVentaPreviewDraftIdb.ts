/**
 * IndexedDB fallback for En Venta preview drafts (large base64 photo payloads exceed sessionStorage quota).
 * Keys mirror sessionStorage plan keys documented in enVentaPreviewDraft.ts.
 */

const DB_NAME = "en-venta-preview-draft";
const DB_VERSION = 1;
const STORE = "kv";

function draftKey(plan: "free" | "pro"): string {
  return `draft:${plan}`;
}

function returnKey(plan: "free" | "pro"): string {
  return `return:${plan}`;
}

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
    req.onerror = () => reject(req.error ?? new Error("indexedDB open failed"));
  });
}

async function idbPut(key: string, value: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("idb put failed"));
  });
}

async function idbGet(key: string): Promise<string | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => {
      const v = req.result;
      resolve(typeof v === "string" && v.length > 0 ? v : null);
    };
    req.onerror = () => reject(req.error ?? new Error("idb get failed"));
  });
}

async function idbDelete(key: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("idb delete failed"));
  });
}

export async function idbPutEnVentaPreviewDraft(plan: "free" | "pro", json: string): Promise<void> {
  await idbPut(draftKey(plan), json);
}

export async function idbGetEnVentaPreviewDraft(plan: "free" | "pro"): Promise<string | null> {
  return idbGet(draftKey(plan));
}

export async function idbPutEnVentaPreviewReturnDraft(plan: "free" | "pro", json: string): Promise<void> {
  await idbPut(returnKey(plan), json);
}

export async function idbGetEnVentaPreviewReturnDraft(plan: "free" | "pro"): Promise<string | null> {
  return idbGet(returnKey(plan));
}

export async function idbClearEnVentaPreviewDrafts(): Promise<void> {
  await Promise.all([
    idbDelete(draftKey("free")),
    idbDelete(draftKey("pro")),
    idbDelete(returnKey("free")),
    idbDelete(returnKey("pro")),
  ]);
}
