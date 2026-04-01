/**
 * Keeps business card design drafts under sessionStorage quota by compressing inline logos
 * and optionally offloading very large previews to IndexedDB (client-only; order flow unchanged).
 */

import imageCompression from "browser-image-compression";
import type { BusinessCardDocument } from "./types";
import type { BusinessCardSessionPayloadV3Design } from "../../order/mappers/businessCardDocumentToReview";
import { toBusinessCardSessionPayloadV3Design } from "../../order/mappers/businessCardDocumentToReview";

const DB_NAME = "leonix-bc-drafts";
const DB_VER = 1;
const STORE = "logoDataUrls";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(key: string, dataUrl: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put({ key, dataUrl, savedAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Offload logos to IndexedDB early so sessionStorage JSON stays small (typical quota ~5MB). */
const PROACTIVE_VAULT_MIN_BYTES = 22_000;
/** Secondary strip threshold when JSON is still oversized after compression. */
const STRIP_VAULT_MIN_BYTES = 32_000;

async function tryVaultLogo(
  productSlug: string,
  side: "front" | "back",
  data: string | null,
  vault: DraftLogoVault,
  minBytes: number
): Promise<string | null> {
  if (!data || dataUrlByteLength(data) <= minBytes) return data;
  try {
    await idbPut(vaultKey(productSlug, side), data);
    if (side === "front") vault.front = true;
    else vault.back = true;
    return null;
  } catch {
    return data;
  }
}

export async function idbGetLogoDataUrl(key: string): Promise<string | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => {
        const v = req.result as { dataUrl?: string } | undefined;
        resolve(v?.dataUrl ?? null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

const SESSION_KEY = (slug: string) => `leonix-bc-draft-${slug}`;

function dataUrlByteLength(dataUrl: string): number {
  return new Blob([dataUrl]).size;
}

async function compressOnce(
  dataUrl: string | null,
  opts: { maxSizeMB: number; maxWidthOrHeight: number; initialQuality: number }
): Promise<string | null> {
  if (!dataUrl?.trim()) return null;
  const t = dataUrl.trim();
  if (!t.startsWith("data:image/")) return t;
  if (t.startsWith("data:image/svg+xml")) {
    return dataUrlByteLength(t) < 500_000 ? t : t;
  }
  try {
    const blob = await (await fetch(t)).blob();
    const file = new File([blob], "logo", { type: blob.type || "image/jpeg" });
    const compressed = await imageCompression(file, {
      maxSizeMB: opts.maxSizeMB,
      maxWidthOrHeight: opts.maxWidthOrHeight,
      useWebWorker: true,
      initialQuality: opts.initialQuality,
    });
    const outBlob = compressed instanceof Blob ? compressed : file;
    return await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(r.error);
      r.readAsDataURL(outBlob);
    });
  } catch {
    return dataUrl;
  }
}

export async function compressLogoDataUrlForSession(dataUrl: string | null): Promise<string | null> {
  return compressOnce(dataUrl, { maxSizeMB: 0.38, maxWidthOrHeight: 1680, initialQuality: 0.88 });
}

async function compressLogoAggressive(dataUrl: string | null): Promise<string | null> {
  return compressOnce(dataUrl, { maxSizeMB: 0.2, maxWidthOrHeight: 1200, initialQuality: 0.78 });
}

export type DraftLogoVault = { front?: boolean; back?: boolean };

export type DesignDraftMeta = {
  frontFileName?: string;
  backFileName?: string;
};

function vaultKey(slug: string, side: "front" | "back"): string {
  return `${slug}::${side}`;
}

/**
 * Build v3 session payload with compressed logos; offload to IndexedDB when inline data is heavy
 * so sessionStorage writes succeed reliably.
 */
export async function buildSessionPayloadWithLogos(
  doc: BusinessCardDocument,
  resolvedLogos: { front: string | null; back: string | null },
  meta?: DesignDraftMeta,
  savedAt?: string
): Promise<BusinessCardSessionPayloadV3Design> {
  const ts = savedAt ?? new Date().toISOString();
  const vault: DraftLogoVault = {};

  let front = await compressLogoDataUrlForSession(resolvedLogos.front);
  let back = await compressLogoDataUrlForSession(resolvedLogos.back);

  front = await tryVaultLogo(doc.productSlug, "front", front, vault, PROACTIVE_VAULT_MIN_BYTES);
  back = await tryVaultLogo(doc.productSlug, "back", back, vault, PROACTIVE_VAULT_MIN_BYTES);

  const pack = (f: string | null, b: string | null): BusinessCardSessionPayloadV3Design => {
    const base = toBusinessCardSessionPayloadV3Design(doc, { front: f, back: b }, ts);
    const v = Object.keys(vault).length ? vault : undefined;
    return {
      ...base,
      draftLogoMeta: meta?.frontFileName || meta?.backFileName ? meta : undefined,
      draftLogoVault: v,
    };
  };

  let payload = pack(front, back);
  if (JSON.stringify(payload).length < 3_800_000) return payload;

  if (!vault.front) front = await compressLogoAggressive(resolvedLogos.front);
  else front = null;
  if (!vault.back) back = await compressLogoAggressive(resolvedLogos.back);
  else back = null;

  front = await tryVaultLogo(doc.productSlug, "front", front, vault, PROACTIVE_VAULT_MIN_BYTES);
  back = await tryVaultLogo(doc.productSlug, "back", back, vault, PROACTIVE_VAULT_MIN_BYTES);

  payload = pack(front, back);
  if (JSON.stringify(payload).length < 3_800_000) return payload;

  /* Strip remaining heavy inline logos into IndexedDB */
  if (front && dataUrlByteLength(front) > STRIP_VAULT_MIN_BYTES) {
    const v = await tryVaultLogo(doc.productSlug, "front", front, vault, 0);
    front = v;
  }
  if (back && dataUrlByteLength(back) > STRIP_VAULT_MIN_BYTES) {
    const v = await tryVaultLogo(doc.productSlug, "back", back, vault, 0);
    back = v;
  }

  payload = pack(front, back);
  if (JSON.stringify(payload).length < 4_800_000) return payload;

  /* Force both sides to vault if still oversized */
  if (resolvedLogos.front && !vault.front) {
    const f = await compressLogoAggressive(resolvedLogos.front);
    const v = await tryVaultLogo(doc.productSlug, "front", f, vault, 0);
    front = v;
  }
  if (resolvedLogos.back && !vault.back) {
    const b = await compressLogoAggressive(resolvedLogos.back);
    const v = await tryVaultLogo(doc.productSlug, "back", b, vault, 0);
    back = v;
  }

  return pack(front, back);
}

export function writeSessionDesignDraft(
  productSlug: string,
  payload: BusinessCardSessionPayloadV3Design
): { ok: true } | { ok: false; reason: "quota" | "unknown" } {
  try {
    sessionStorage.setItem(SESSION_KEY(productSlug), JSON.stringify(payload));
    return { ok: true };
  } catch (e) {
    const name = e instanceof DOMException ? e.name : "";
    if (name === "QuotaExceededError" || name === "NS_ERROR_DOM_QUOTA_REACHED") {
      return { ok: false, reason: "quota" };
    }
    return { ok: false, reason: "unknown" };
  }
}

/**
 * Merge vaulted logos from IndexedDB into a hydrated document (call from client after sync hydrate).
 */
export async function mergeVaultedLogosIntoDocument(
  productSlug: string,
  doc: BusinessCardDocument,
  vault: DraftLogoVault | undefined
): Promise<BusinessCardDocument> {
  if (!vault || (!vault.front && !vault.back)) return doc;

  let next = doc;
  if (vault.front) {
    const url = await idbGetLogoDataUrl(vaultKey(productSlug, "front"));
    if (url) {
      next = {
        ...next,
        front: {
          ...next.front,
          logo: {
            ...next.front.logo,
            visible: true,
            previewUrl: url,
            file: null,
          },
        },
      };
    }
  }
  if (vault.back) {
    const url = await idbGetLogoDataUrl(vaultKey(productSlug, "back"));
    if (url) {
      next = {
        ...next,
        back: {
          ...next.back,
          logo: {
            ...next.back.logo,
            visible: true,
            previewUrl: url,
            file: null,
          },
        },
      };
    }
  }
  return next;
}
