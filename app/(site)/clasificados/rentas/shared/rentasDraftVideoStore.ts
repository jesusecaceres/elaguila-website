"use client";

const DB_NAME = "rentas-draft-video-store";
const DB_VERSION = 1;
const STORE_NAME = "videos";

type RentasVideoRecord = {
  id: string;
  blob: Blob;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  updatedAt: number;
};

type RentasVideoMetadata = {
  videoLocalDraftId: string;
  videoLocalFileName: string;
  videoLocalMimeType: string;
  videoLocalSizeBytes: number;
  videoLocalUpdatedAt: number;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("idb_open_failed"));
  });
}

function txPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("idb_request_failed"));
  });
}

export function createRentasDraftVideoId(prefix: "privado" | "negocio"): string {
  const nonce = Math.random().toString(36).slice(2, 10);
  return `rentas:${prefix}:${Date.now()}:${nonce}`;
}

export async function putRentasDraftVideo(
  id: string,
  file: File,
): Promise<RentasVideoMetadata> {
  const db = await openDb();
  const record: RentasVideoRecord = {
    id,
    blob: file,
    fileName: file.name || "video-local",
    mimeType: file.type || "video/mp4",
    sizeBytes: file.size || 0,
    updatedAt: Date.now(),
  };
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  await txPromise(store.put(record));
  return {
    videoLocalDraftId: record.id,
    videoLocalFileName: record.fileName,
    videoLocalMimeType: record.mimeType,
    videoLocalSizeBytes: record.sizeBytes,
    videoLocalUpdatedAt: record.updatedAt,
  };
}

export async function readRentasDraftVideo(id: string): Promise<RentasVideoRecord | null> {
  if (!id.trim()) return null;
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  const rec = await txPromise(store.get(id)) as RentasVideoRecord | undefined;
  return rec ?? null;
}

export async function deleteRentasDraftVideo(id: string): Promise<void> {
  if (!id.trim()) return;
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  await txPromise(store.delete(id));
}
