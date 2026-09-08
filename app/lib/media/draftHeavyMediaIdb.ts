/**
 * BR-INV-WAVE1-GATE3 — generic, reusable IndexedDB KV + ref-token engine for offloading heavy
 * (`data:`) draft blobs out of sessionStorage/localStorage JSON.
 *
 * This generalizes the pattern already proven in three places in this codebase — Restaurantes
 * (`restauranteDraftMediaIdb.ts`), Servicios (`clasificadosServiciosDraftMediaIdb.ts`), and BR
 * Negocio agente-individual (`brAgenteResDraftMediaIdb.ts` + `brAgenteResDraftMedia.ts`) — rather
 * than inventing a new architecture. Each caller gets its own IndexedDB database (`dbName`) and
 * ref-token prefix (`refPrefix`) so different draft kinds never collide, matching how those three
 * existing draft-media modules are each self-contained per category.
 *
 * A ref token looks like `${refPrefix}|${segment}` or `${refPrefix}|${segment}|${id}` — small
 * enough to sit inline in the JSON that DOES stay in sessionStorage, while the actual blob lives
 * only in IndexedDB.
 */

const STORE = "kv";

function isHeavyDataUrl(s: string): boolean {
  return typeof s === "string" && s.startsWith("data:") && s.length > 80;
}

export type DraftHeavyMediaIdbStore = {
  /** Offload a single scalar field (e.g. a seller/agent photo) if it's a heavy data: URL. */
  offloadScalar(ns: string, segment: string, id: string | undefined, value: string): Promise<string>;
  /** Resolve a scalar field back to a real data: URL if it's a ref token for this store. */
  inlineScalar(ns: string, segment: string, id: string | undefined, value: string): Promise<string>;
  /** Offload every heavy entry in a photo array, indexed by position. */
  offloadPhotoArray(ns: string, segment: string, photos: string[]): Promise<string[]>;
  /** Resolve every ref token in a photo array back to real data: URLs. */
  inlinePhotoArray(ns: string, segment: string, photos: string[]): Promise<string[]>;
  /** Remove every entry under a given namespace (e.g. on publish/clear-draft). */
  clearNamespace(ns: string): Promise<void>;
};

export function createDraftHeavyMediaIdbStore(dbName: string, refPrefix: string): DraftHeavyMediaIdbStore {
  function openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === "undefined") {
        reject(new Error("indexedDB unavailable"));
        return;
      }
      const req = indexedDB.open(dbName, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error ?? new Error("idb open failed"));
    });
  }

  function storageKey(namespace: string, segment: string, id?: string): string {
    return id ? `${namespace}:${segment}:${id}` : `${namespace}:${segment}`;
  }

  async function putDataUrl(ns: string, segment: string, id: string | undefined, dataUrl: string): Promise<void> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(dataUrl, storageKey(ns, segment, id));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("idb put failed"));
    });
  }

  async function getDataUrl(ns: string, segment: string, id?: string): Promise<string | null> {
    try {
      const db = await openDb();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        const req = tx.objectStore(STORE).get(storageKey(ns, segment, id));
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

  async function clearNamespace(namespace: string): Promise<void> {
    try {
      const db = await openDb();
      const prefix = `${namespace}:`;
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        const store = tx.objectStore(STORE);
        const req = store.openCursor();
        req.onsuccess = () => {
          const cursor = req.result;
          if (!cursor) return;
          if (String(cursor.key ?? "").startsWith(prefix)) cursor.delete();
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

  function ref(segment: string, id?: string): string {
    return id ? `${refPrefix}|${segment}|${id}` : `${refPrefix}|${segment}`;
  }

  function parseRef(url: string): { segment: string; id?: string } | null {
    if (!url.startsWith(refPrefix)) return null;
    const rest = url.slice(refPrefix.length);
    const parts = rest.split("|").filter(Boolean);
    if (!parts.length) return null;
    if (parts.length === 1) return { segment: parts[0]! };
    return { segment: parts[0]!, id: parts.slice(1).join("|") };
  }

  async function offloadScalar(ns: string, segment: string, id: string | undefined, value: string): Promise<string> {
    if (!isHeavyDataUrl(value)) return value;
    await putDataUrl(ns, segment, id, value);
    return ref(segment, id);
  }

  async function inlineScalar(ns: string, segment: string, id: string | undefined, value: string): Promise<string> {
    const parsed = parseRef(value);
    if (!parsed || parsed.segment !== segment || (id !== undefined && parsed.id !== id)) return value;
    const blob = await getDataUrl(ns, segment, id);
    return blob ?? "";
  }

  async function offloadPhotoArray(ns: string, segment: string, photos: string[]): Promise<string[]> {
    const out: string[] = [];
    for (let i = 0; i < photos.length; i++) {
      const u = String(photos[i] ?? "").trim();
      if (!u) continue;
      if (isHeavyDataUrl(u)) {
        await putDataUrl(ns, segment, String(i), u);
        out.push(ref(segment, String(i)));
      } else {
        out.push(u);
      }
    }
    return out;
  }

  async function inlinePhotoArray(ns: string, segment: string, photos: string[]): Promise<string[]> {
    const out: string[] = [];
    for (let i = 0; i < photos.length; i++) {
      const u = String(photos[i] ?? "").trim();
      if (!u) continue;
      const parsed = parseRef(u);
      if (parsed) {
        if (parsed.segment === segment) {
          const blob = await getDataUrl(ns, parsed.segment, parsed.id);
          if (blob) out.push(blob);
        }
        continue;
      }
      out.push(u);
    }
    return out;
  }

  return { offloadScalar, inlineScalar, offloadPhotoArray, inlinePhotoArray, clearNamespace };
}
