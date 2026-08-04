"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type {
  ViajesExternalVideoV2,
  ViajesMediaAssetV2,
} from "@/app/(site)/clasificados/viajes/lib/v2/viajesOfferModelV2";
import {
  VIAJES_MEDIA_MAX_BYTES,
  VIAJES_MEDIA_MAX_IMAGES,
  VIAJES_MEDIA_MAX_VIDEOS,
} from "@/app/(site)/clasificados/viajes/lib/v2/viajesOfferModelV2";
import { createViajesMediaAssetDraft, newViajesStableId } from "@/app/(site)/clasificados/viajes/lib/v2/viajesOfferModelV2Defaults";
import { uploadViajesDraftPhotoWithRetry } from "@/app/(site)/clasificados/viajes/lib/viajesDraftPhotoUploadClient";
import {
  newViajesDraftMediaId,
  viajesDraftMediaDelete,
  viajesDraftMediaGetBlob,
  viajesDraftMediaPut,
} from "@/app/(site)/clasificados/viajes/lib/viajesDraftMediaIdb";

const LABEL = "block text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]";
const INPUT =
  "mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3 py-2 text-sm text-[color:var(--lx-text)] outline-none ring-[color:var(--lx-focus-ring)] focus:ring-2";
const BTN_SECONDARY =
  "inline-flex min-h-[36px] items-center justify-center rounded-lg border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] px-2.5 text-[11px] font-bold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)] disabled:opacity-40";
const BTN_PRIMARY =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[14px] bg-[color:var(--lx-cta-dark)] px-4 text-sm font-bold text-[#FFFCF7] shadow-md transition hover:bg-[color:var(--lx-cta-dark-hover)] disabled:opacity-50";

function idbScope(draftId: string) {
  return `viajes-v2:${draftId || "draft"}`;
}

function isLikelyImageFile(f: File): boolean {
  if (f.type.startsWith("image/")) return true;
  if (f.type === "image/heic" || f.type === "image/heif") return true;
  if (!f.type || f.type === "application/octet-stream") {
    return /\.(jpe?g|png|gif|webp|heic|heif|bmp|avif)$/i.test(f.name);
  }
  return false;
}

function sortImages(images: ViajesMediaAssetV2[]): ViajesMediaAssetV2[] {
  return [...images].sort((a, b) => a.galleryOrder - b.galleryOrder);
}

function reindex(images: ViajesMediaAssetV2[]): ViajesMediaAssetV2[] {
  return sortImages(images).map((img, i) => ({ ...img, galleryOrder: i }));
}

function previewSrc(img: ViajesMediaAssetV2): string {
  return img.localPreviewObjectUrl || img.url || "";
}

type ViajesMediaManagerProps = {
  images: ViajesMediaAssetV2[];
  videos: ViajesExternalVideoV2[];
  onChangeImages: (images: ViajesMediaAssetV2[]) => void;
  onChangeVideos: (videos: ViajesExternalVideoV2[]) => void;
  draftId: string;
  getBearerToken: () => Promise<string | null>;
  lang: "es" | "en";
};

export function ViajesMediaManager({
  images,
  videos,
  onChangeImages,
  onChangeVideos,
  draftId,
  getBearerToken,
  lang,
}: ViajesMediaManagerProps) {
  const es = lang !== "en";
  const baseId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef(images);
  const onChangeImagesRef = useRef(onChangeImages);
  const uploadControllersRef = useRef<Map<string, AbortController>>(new Map());
  const [dragOver, setDragOver] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [videoDraft, setVideoDraft] = useState("");

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);
  useEffect(() => {
    onChangeImagesRef.current = onChangeImages;
  }, [onChangeImages]);

  useEffect(() => {
    return () => {
      for (const controller of uploadControllersRef.current.values()) {
        try {
          controller.abort();
        } catch {
          /* ignore */
        }
      }
      uploadControllersRef.current.clear();
    };
  }, []);

  const patchImage = useCallback((id: string, partial: Partial<ViajesMediaAssetV2>) => {
    const next = imagesRef.current.map((img) => (img.id === id ? { ...img, ...partial } : img));
    imagesRef.current = next;
    onChangeImagesRef.current(next);
  }, []);

  const setImages = useCallback((next: ViajesMediaAssetV2[]) => {
    const indexed = reindex(next);
    imagesRef.current = indexed;
    onChangeImagesRef.current(indexed);
  }, []);

  const abortUpload = useCallback(
    (assetId: string, opts?: { silent?: boolean }) => {
      const controller = uploadControllersRef.current.get(assetId);
      if (controller) {
        try {
          controller.abort();
        } catch {
          /* ignore */
        }
        uploadControllersRef.current.delete(assetId);
      }
      const current = imagesRef.current.find((x) => x.id === assetId);
      if (current && (current.uploadStatus === "uploading" || current.uploadStatus === "local_pending")) {
        patchImage(assetId, {
          uploadStatus: "failed",
          uploadErrorCode: "aborted",
          uploadProgressPct: 0,
        });
      }
      if (!opts?.silent) {
        setStatusMsg(es ? "Subida cancelada." : "Upload canceled.");
      }
    },
    [es, patchImage],
  );

  const uploadOne = useCallback(
    async (assetId: string, file: Blob, fileName?: string) => {
      const token = await getBearerToken();
      if (!token) {
        patchImage(assetId, { uploadStatus: "failed", uploadErrorCode: "auth_required", uploadProgressPct: 0 });
        setStatusMsg(es ? "Inicia sesión para subir fotos." : "Sign in to upload photos.");
        return;
      }

      const existing = uploadControllersRef.current.get(assetId);
      if (existing) {
        try {
          existing.abort();
        } catch {
          /* ignore */
        }
        uploadControllersRef.current.delete(assetId);
      }

      const controller = new AbortController();
      uploadControllersRef.current.set(assetId, controller);

      patchImage(assetId, { uploadStatus: "uploading", uploadErrorCode: null, uploadProgressPct: 0 });
      setStatusMsg(es ? "Subiendo foto…" : "Uploading photo…");

      const result = await uploadViajesDraftPhotoWithRetry({
        file,
        draftId: draftId || "draft",
        slot: "gallery",
        bearerToken: token,
        fileName,
        signal: controller.signal,
        onProgress: (pct) => patchImage(assetId, { uploadProgressPct: pct, uploadStatus: "uploading" }),
      });

      uploadControllersRef.current.delete(assetId);

      if (result.ok) {
        const current = imagesRef.current.find((x) => x.id === assetId);
        if (current?.localPreviewObjectUrl) {
          try {
            URL.revokeObjectURL(current.localPreviewObjectUrl);
          } catch {
            /* ignore */
          }
        }
        patchImage(assetId, {
          url: result.publicUrl,
          pathname: result.pathname,
          mimeType: result.mimeType,
          byteSize: result.byteSize,
          uploadStatus: "uploaded",
          uploadProgressPct: 100,
          uploadErrorCode: null,
          localPreviewObjectUrl: undefined,
        });
        setStatusMsg(es ? "Foto subida." : "Photo uploaded.");
        return;
      }

      if (result.error === "aborted" || controller.signal.aborted) {
        const stillPresent = imagesRef.current.some((x) => x.id === assetId);
        if (stillPresent) {
          patchImage(assetId, {
            uploadStatus: "failed",
            uploadErrorCode: "aborted",
            uploadProgressPct: 0,
          });
          setStatusMsg(es ? "Subida cancelada." : "Upload canceled.");
        }
        return;
      }

      patchImage(assetId, {
        uploadStatus: "failed",
        uploadErrorCode: result.error,
        uploadProgressPct: 0,
      });
      setStatusMsg(es ? `Error al subir: ${result.error}` : `Upload failed: ${result.error}`);
    },
    [draftId, es, getBearerToken, patchImage],
  );

  const addFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList?.length) return;
      const room = VIAJES_MEDIA_MAX_IMAGES - imagesRef.current.length;
      if (room <= 0) {
        setStatusMsg(es ? `Máximo ${VIAJES_MEDIA_MAX_IMAGES} fotos.` : `Max ${VIAJES_MEDIA_MAX_IMAGES} photos.`);
        return;
      }
      const files = Array.from(fileList).filter(isLikelyImageFile).slice(0, room);
      if (!files.length) {
        setStatusMsg(es ? "Selecciona archivos de imagen." : "Select image files.");
        return;
      }

      const scope = idbScope(draftId);
      const base = sortImages(imagesRef.current);
      const additions: ViajesMediaAssetV2[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i]!;
        if (file.size > VIAJES_MEDIA_MAX_BYTES) {
          setStatusMsg(
            es
              ? `Archivo demasiado grande (máx ${Math.round(VIAJES_MEDIA_MAX_BYTES / (1024 * 1024))}MB).`
              : `File too large (max ${Math.round(VIAJES_MEDIA_MAX_BYTES / (1024 * 1024))}MB).`,
          );
          continue;
        }
        const localId = newViajesDraftMediaId();
        const preview = URL.createObjectURL(file);
        try {
          await viajesDraftMediaPut(scope, localId, file);
        } catch {
          /* IDB optional — preview URL still works this session */
        }
        const asset = createViajesMediaAssetDraft({
          galleryOrder: base.length + additions.length,
          isHero: base.length === 0 && additions.length === 0,
          isResultsCard: base.length === 0 && additions.length === 0,
          localPreviewObjectUrl: preview,
          localIdbKey: localId,
          localFileName: file.name,
          mimeType: file.type || undefined,
          byteSize: file.size,
          uploadStatus: "local_pending",
          alt: "",
        });
        additions.push(asset);
      }

      if (!additions.length) return;
      const merged = reindex([...base, ...additions]);
      setImages(merged);
      setStatusMsg(es ? `Agregadas ${additions.length} foto(s).` : `Added ${additions.length} photo(s).`);

      for (const asset of additions) {
        const key = asset.localIdbKey;
        let blob: Blob | null = null;
        if (key) {
          try {
            blob = await viajesDraftMediaGetBlob(scope, key);
          } catch {
            blob = null;
          }
        }
        if (!blob && asset.localPreviewObjectUrl) {
          try {
            const res = await fetch(asset.localPreviewObjectUrl);
            blob = await res.blob();
          } catch {
            blob = null;
          }
        }
        if (blob) void uploadOne(asset.id, blob, asset.localFileName);
        else patchImage(asset.id, { uploadStatus: "failed", uploadErrorCode: "missing_local_blob" });
      }
    },
    [draftId, es, patchImage, setImages, uploadOne],
  );

  const retryUpload = async (img: ViajesMediaAssetV2) => {
    const scope = idbScope(draftId);
    let blob: Blob | null = null;
    if (img.localIdbKey) {
      try {
        blob = await viajesDraftMediaGetBlob(scope, img.localIdbKey);
      } catch {
        blob = null;
      }
    }
    if (!blob && img.localPreviewObjectUrl) {
      try {
        const res = await fetch(img.localPreviewObjectUrl);
        blob = await res.blob();
      } catch {
        blob = null;
      }
    }
    if (!blob) {
      setStatusMsg(es ? "No se encontró el archivo local para reintentar." : "Local file missing for retry.");
      return;
    }
    await uploadOne(img.id, blob, img.localFileName);
  };

  const removeImage = async (img: ViajesMediaAssetV2) => {
    abortUpload(img.id, { silent: true });
    patchImage(img.id, { uploadStatus: "removing" });
    if (img.localPreviewObjectUrl) {
      try {
        URL.revokeObjectURL(img.localPreviewObjectUrl);
      } catch {
        /* ignore */
      }
    }
    if (img.localIdbKey) {
      try {
        await viajesDraftMediaDelete(idbScope(draftId), img.localIdbKey);
      } catch {
        /* ignore */
      }
    }
    const next = imagesRef.current.filter((x) => x.id !== img.id);
    const hadHero = img.isHero;
    const hadCard = img.isResultsCard;
    let indexed = reindex(next);
    if (indexed.length) {
      if (hadHero && !indexed.some((x) => x.isHero)) {
        indexed = indexed.map((x, i) => (i === 0 ? { ...x, isHero: true } : x));
      }
      if (hadCard && !indexed.some((x) => x.isResultsCard)) {
        indexed = indexed.map((x, i) => (i === 0 ? { ...x, isResultsCard: true } : x));
      }
    }
    setImages(indexed);
    setStatusMsg(es ? "Foto eliminada." : "Photo removed.");
  };

  const moveImage = (id: string, dir: -1 | 1) => {
    const sorted = sortImages(imagesRef.current);
    const idx = sorted.findIndex((x) => x.id === id);
    const j = idx + dir;
    if (idx < 0 || j < 0 || j >= sorted.length) return;
    const next = [...sorted];
    const tmp = next[idx]!;
    next[idx] = next[j]!;
    next[j] = tmp;
    setImages(next);
  };

  const setHero = (id: string) => {
    setImages(imagesRef.current.map((x) => ({ ...x, isHero: x.id === id })));
  };

  const setResultsCard = (id: string, on: boolean) => {
    if (on) {
      setImages(imagesRef.current.map((x) => ({ ...x, isResultsCard: x.id === id })));
      return;
    }
    setImages(imagesRef.current.map((x) => (x.id === id ? { ...x, isResultsCard: false } : x)));
  };

  const addVideo = () => {
    const url = videoDraft.trim();
    if (!url) return;
    if (videos.length >= VIAJES_MEDIA_MAX_VIDEOS) {
      setStatusMsg(es ? `Máximo ${VIAJES_MEDIA_MAX_VIDEOS} videos.` : `Max ${VIAJES_MEDIA_MAX_VIDEOS} videos.`);
      return;
    }
    if (!/^https:\/\//i.test(url)) {
      setStatusMsg(es ? "El video debe ser una URL HTTPS." : "Video must be an HTTPS URL.");
      return;
    }
    if (videos.some((v) => v.url.trim().toLowerCase() === url.toLowerCase())) {
      setStatusMsg(es ? "Ese video ya está agregado." : "That video is already added.");
      return;
    }
    onChangeVideos([...videos, { id: newViajesStableId("vid"), url }]);
    setVideoDraft("");
    setStatusMsg(es ? "Video agregado." : "Video added.");
  };

  const sorted = sortImages(images);
  const atMaxImages = images.length >= VIAJES_MEDIA_MAX_IMAGES;

  return (
    <section className="space-y-5" aria-labelledby={`${baseId}-title`}>
      <div>
        <h3 id={`${baseId}-title`} className="text-sm font-bold text-[color:var(--lx-text)] sm:text-base">
          {es ? "Fotos y videos" : "Photos and videos"}
        </h3>
        <p className="mt-1 text-xs text-[color:var(--lx-muted)]">
          {es
            ? `Hasta ${VIAJES_MEDIA_MAX_IMAGES} fotos y ${VIAJES_MEDIA_MAX_VIDEOS} videos externos (HTTPS).`
            : `Up to ${VIAJES_MEDIA_MAX_IMAGES} photos and ${VIAJES_MEDIA_MAX_VIDEOS} external videos (HTTPS).`}
        </p>
      </div>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {statusMsg}
      </p>
      {statusMsg ? (
        <p className="rounded-xl border border-[color:var(--lx-gold-border)]/50 bg-[color:var(--lx-section)]/50 px-3 py-2 text-xs text-[color:var(--lx-text-2)]" aria-hidden>
          {statusMsg}
        </p>
      ) : null}

      <div
        className={`rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors sm:py-7 ${
          dragOver
            ? "border-[color:var(--lx-cta-dark)] bg-[color:var(--lx-cta-dark)]/5"
            : "border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)]/30"
        }`}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!atMaxImages) void addFiles(e.dataTransfer.files);
        }}
      >
        <p className="text-sm font-semibold text-[color:var(--lx-text)]">
          {es ? "Arrastra fotos aquí o elige archivos" : "Drag photos here or choose files"}
        </p>
        <p className="mt-1 text-xs text-[color:var(--lx-muted)]">
          {images.length}/{VIAJES_MEDIA_MAX_IMAGES}
        </p>
        <div className="mt-4">
          <button type="button" className={BTN_PRIMARY} disabled={atMaxImages} onClick={() => fileRef.current?.click()}>
            {es ? "Agregar fotos" : "Add photos"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              void addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      <ul className="space-y-3">
        {sorted.map((img, index) => {
          const src = previewSrc(img);
          return (
            <li
              key={img.id}
              className="rounded-[16px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-3 shadow-[0_6px_20px_-14px_rgba(42,36,22,0.16)]"
            >
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] sm:h-32 sm:w-40">
                  {src ? (
                    <img
                      src={src}
                      alt={img.alt || ""}
                      className="h-full w-full object-cover"
                      style={{ objectPosition: `${(img.focal?.x ?? 0.5) * 100}% ${(img.focal?.y ?? 0.5) * 100}%` }}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-[color:var(--lx-muted)]">—</div>
                  )}
                  {img.uploadStatus === "uploading" ? (
                    <div className="absolute inset-x-0 bottom-0 bg-[color:var(--lx-text)]/70 px-2 py-1 text-[10px] font-bold text-[#FFFCF7]">
                      {img.uploadProgressPct ?? 0}%
                    </div>
                  ) : null}
                  {img.uploadStatus === "failed" ? (
                    <div className="absolute inset-x-0 bottom-0 bg-red-800/85 px-2 py-1 text-[10px] font-bold text-white">
                      {es ? "Falló" : "Failed"}
                    </div>
                  ) : null}
                </div>

                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    <button type="button" className={BTN_SECONDARY} disabled={index === 0} onClick={() => moveImage(img.id, -1)}>
                      ↑
                    </button>
                    <button
                      type="button"
                      className={BTN_SECONDARY}
                      disabled={index >= sorted.length - 1}
                      onClick={() => moveImage(img.id, 1)}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className={`${BTN_SECONDARY} ${img.isHero ? "border-[color:var(--lx-cta-dark)] bg-[color:var(--lx-cta-dark)]/10" : ""}`}
                      onClick={() => setHero(img.id)}
                      aria-pressed={img.isHero}
                    >
                      {es ? "Hero" : "Hero"}
                    </button>
                    <button
                      type="button"
                      className={`${BTN_SECONDARY} ${img.isResultsCard ? "border-[color:var(--lx-gold-border)] bg-[color:var(--lx-gold)]/15" : ""}`}
                      onClick={() => setResultsCard(img.id, !img.isResultsCard)}
                      aria-pressed={img.isResultsCard}
                    >
                      {es ? "Tarjeta" : "Card"}
                    </button>
                    {img.uploadStatus === "uploading" ? (
                      <button
                        type="button"
                        className={BTN_SECONDARY}
                        onClick={() => abortUpload(img.id)}
                        aria-label={es ? "Cancelar subida" : "Cancel upload"}
                      >
                        {es ? "Cancelar" : "Cancel"}
                      </button>
                    ) : null}
                    {img.uploadStatus === "failed" ? (
                      <button type="button" className={BTN_SECONDARY} onClick={() => void retryUpload(img)}>
                        {es ? "Reintentar" : "Retry"}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className={`${BTN_SECONDARY} border-red-300/70 text-red-800`}
                      onClick={() => void removeImage(img)}
                      disabled={img.uploadStatus === "removing"}
                    >
                      {es ? "Quitar" : "Remove"}
                    </button>
                  </div>

                  <div>
                    <label className={LABEL} htmlFor={`${baseId}-alt-${img.id}`}>
                      Alt
                    </label>
                    <input
                      id={`${baseId}-alt-${img.id}`}
                      className={INPUT}
                      value={img.alt}
                      onChange={(e) => patchImage(img.id, { alt: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={LABEL} htmlFor={`${baseId}-fx-${img.id}`}>
                        Focal X (0–1)
                      </label>
                      <input
                        id={`${baseId}-fx-${img.id}`}
                        type="number"
                        min={0}
                        max={1}
                        step={0.01}
                        className={INPUT}
                        value={img.focal?.x ?? 0.5}
                        onChange={(e) => {
                          const x = Math.max(0, Math.min(1, Number(e.target.value) || 0));
                          patchImage(img.id, { focal: { x, y: img.focal?.y ?? 0.5 } });
                        }}
                      />
                    </div>
                    <div>
                      <label className={LABEL} htmlFor={`${baseId}-fy-${img.id}`}>
                        Focal Y (0–1)
                      </label>
                      <input
                        id={`${baseId}-fy-${img.id}`}
                        type="number"
                        min={0}
                        max={1}
                        step={0.01}
                        className={INPUT}
                        value={img.focal?.y ?? 0.5}
                        onChange={(e) => {
                          const y = Math.max(0, Math.min(1, Number(e.target.value) || 0));
                          patchImage(img.id, { focal: { x: img.focal?.x ?? 0.5, y } });
                        }}
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-[color:var(--lx-muted)]">
                    {img.uploadStatus}
                    {img.uploadErrorCode ? ` · ${img.uploadErrorCode}` : ""}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="space-y-3 rounded-[16px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)]/40 p-4">
        <h4 className="text-sm font-bold text-[color:var(--lx-text)]">
          {es ? "Videos externos (URL HTTPS)" : "External videos (HTTPS URL)"}
        </h4>
        <ul className="space-y-2">
          {videos.map((v, index) => (
            <li key={v.id} className="flex flex-wrap items-center gap-2">
              <input
                className={`${INPUT} mt-0 min-w-[12rem] flex-1`}
                value={v.url}
                onChange={(e) => {
                  const url = e.target.value;
                  onChangeVideos(videos.map((x) => (x.id === v.id ? { ...x, url } : x)));
                }}
                aria-label={es ? `Video ${index + 1}` : `Video ${index + 1}`}
              />
              <button
                type="button"
                className={`${BTN_SECONDARY} border-red-300/70 text-red-800`}
                onClick={() => onChangeVideos(videos.filter((x) => x.id !== v.id))}
              >
                {es ? "Quitar" : "Remove"}
              </button>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[12rem] flex-1">
            <label className={LABEL} htmlFor={`${baseId}-video`}>
              {es ? "URL de video" : "Video URL"}
            </label>
            <input
              id={`${baseId}-video`}
              className={INPUT}
              value={videoDraft}
              placeholder="https://"
              disabled={videos.length >= VIAJES_MEDIA_MAX_VIDEOS}
              onChange={(e) => setVideoDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addVideo();
                }
              }}
            />
          </div>
          <button
            type="button"
            className={BTN_PRIMARY}
            disabled={videos.length >= VIAJES_MEDIA_MAX_VIDEOS || !videoDraft.trim()}
            onClick={addVideo}
          >
            {es ? "Agregar video" : "Add video"}
          </button>
        </div>
        <p className="text-xs text-[color:var(--lx-muted)]">
          {videos.length}/{VIAJES_MEDIA_MAX_VIDEOS}
        </p>
      </div>
    </section>
  );
}
