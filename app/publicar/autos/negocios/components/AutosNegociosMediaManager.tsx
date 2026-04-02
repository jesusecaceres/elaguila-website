"use client";

import { useCallback, useState } from "react";
import { FiChevronDown, FiChevronUp, FiImage, FiPlus, FiStar, FiTrash2, FiVideo } from "react-icons/fi";
import type { AutoDealerListing, MediaImageEntry } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { newMediaImageId } from "@/app/clasificados/autos/negocios/lib/autoDealerHeroImages";
import { readFileAsDataUrl } from "../lib/readFileAsDataUrl";

const LABEL = "block text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]";
const INPUT =
  "mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3 py-2 text-sm text-[color:var(--lx-text)] outline-none ring-[color:var(--lx-focus-ring)] focus:ring-2";
const SUBHEAD = "mt-6 text-sm font-bold text-[color:var(--lx-text)]";

function sortByOrder(images: MediaImageEntry[]): MediaImageEntry[] {
  return [...images].sort((a, b) => a.sortOrder - b.sortOrder);
}

function ensureOnePrimary(images: MediaImageEntry[]): MediaImageEntry[] {
  if (images.length === 0) return [];
  const primaries = images.filter((x) => x.isPrimary);
  if (primaries.length === 0) {
    return sortByOrder(images).map((x, i) => ({ ...x, isPrimary: i === 0, sortOrder: i }));
  }
  if (primaries.length === 1) {
    return sortByOrder(images).map((x, i) => ({ ...x, sortOrder: i }));
  }
  let seen = false;
  return sortByOrder(images).map((x, i) => {
    if (!x.isPrimary) return { ...x, sortOrder: i };
    if (!seen) {
      seen = true;
      return { ...x, sortOrder: i };
    }
    return { ...x, isPrimary: false, sortOrder: i };
  });
}

function reindex(images: MediaImageEntry[]): MediaImageEntry[] {
  return sortByOrder(images).map((x, i) => ({ ...x, sortOrder: i }));
}

export function AutosNegociosMediaManager({
  listing,
  setListingPatch,
}: {
  listing: AutoDealerListing;
  setListingPatch: (patch: Partial<AutoDealerListing>) => void;
}) {
  const images = sortByOrder(listing.mediaImages ?? []);
  const [urlBatch, setUrlBatch] = useState("");

  const commitImages = useCallback(
    (next: MediaImageEntry[]) => {
      const cleaned = reindex(ensureOnePrimary(next));
      setListingPatch({ mediaImages: cleaned });
    },
    [setListingPatch],
  );

  const addUrls = () => {
    const urls = urlBatch
      .split(/\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!urls.length) return;
    const base = sortByOrder(listing.mediaImages ?? []);
    const additions: MediaImageEntry[] = urls.map((url, i) => ({
      id: newMediaImageId(),
      url,
      sourceType: "url" as const,
      isPrimary: base.length === 0 && i === 0,
      sortOrder: base.length + i,
    }));
    const merged = reindex([...base, ...additions]);
    commitImages(ensureOnePrimary(merged));
    setUrlBatch("");
  };

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const base = sortByOrder(listing.mediaImages ?? []);
    const filesArr = Array.from(files);
    const additions: MediaImageEntry[] = [];
    for (let i = 0; i < filesArr.length; i++) {
      const f = filesArr[i]!;
      const url = await readFileAsDataUrl(f);
      additions.push({
        id: newMediaImageId(),
        url,
        sourceType: "file",
        isPrimary: base.length === 0 && i === 0,
        sortOrder: base.length + i,
      });
    }
    const merged = reindex([...base, ...additions]);
    commitImages(ensureOnePrimary(merged));
  };

  const remove = (id: string) => {
    const next = (listing.mediaImages ?? []).filter((x) => x.id !== id);
    commitImages(next);
  };

  const setPrimary = (id: string) => {
    const next = (listing.mediaImages ?? []).map((x) => ({ ...x, isPrimary: x.id === id }));
    commitImages(next);
  };

  const move = (id: string, dir: -1 | 1) => {
    const sorted = sortByOrder(listing.mediaImages ?? []);
    const idx = sorted.findIndex((x) => x.id === id);
    if (idx < 0) return;
    const j = idx + dir;
    if (j < 0 || j >= sorted.length) return;
    const a = sorted[idx]!;
    const b = sorted[j]!;
    const next = sorted.map((x) => {
      if (x.id === a.id) return { ...x, sortOrder: b.sortOrder };
      if (x.id === b.id) return { ...x, sortOrder: a.sortOrder };
      return x;
    });
    commitImages(next);
  };

  const vs = listing.videoSourceType ?? null;
  const videoUrl = listing.videoUrl?.trim() ?? "";
  const videoFile = listing.videoFileDataUrl?.trim() ?? "";

  const clearVideo = () => {
    setListingPatch({
      videoSourceType: null,
      videoUrl: undefined,
      videoFileDataUrl: undefined,
      videoFileName: undefined,
      videoUploadStatus: null,
    });
  };

  const setVideoUrlMode = () => {
    setListingPatch({
      videoSourceType: "url",
      videoFileDataUrl: undefined,
      videoFileName: undefined,
      videoUploadStatus: "local_preview",
    });
  };

  const onVideoUrlChange = (v: string) => {
    const t = v.trim();
    setListingPatch({
      videoSourceType: "url",
      videoUrl: t || undefined,
      videoUploadStatus: t ? "local_preview" : null,
    });
  };

  const onVideoFile = async (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    const dataUrl = await readFileAsDataUrl(f);
    setListingPatch({
      videoSourceType: "file",
      videoUrl: undefined,
      videoFileDataUrl: dataUrl,
      videoFileName: f.name,
      videoUploadStatus: "local_preview",
    });
  };

  const logo = listing.dealerLogo?.trim();

  return (
    <section className="rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-5 shadow-[0_8px_28px_-12px_rgba(42,36,22,0.12)]">
      <h2 className="text-lg font-bold text-[color:var(--lx-text)]">Multimedia</h2>
      <p className="mt-1 text-sm text-[color:var(--lx-muted)]">
        Puedes pegar URLs o subir archivos desde tu dispositivo. Selecciona una imagen principal para el anuncio.
      </p>

      <h3 className={SUBHEAD}>Fotos del vehículo</h3>

      <div className="mt-3">
        <label className={LABEL}>Agregar por URL (una por línea)</label>
        <textarea
          className={`${INPUT} min-h-[72px] font-mono text-xs`}
          placeholder="https://…"
          value={urlBatch}
          onChange={(e) => setUrlBatch(e.target.value)}
        />
        <button
          type="button"
          className="mt-2 inline-flex items-center gap-1 rounded-full border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3 py-1.5 text-xs font-bold text-[color:var(--lx-text)] hover:bg-[color:var(--lx-nav-hover)]"
          onClick={addUrls}
        >
          <FiPlus className="h-3.5 w-3.5" aria-hidden />
          Agregar URLs
        </button>
      </div>

      <div className="mt-4">
        <label className={LABEL}>Subir imágenes</label>
        <input
          type="file"
          accept="image/*"
          multiple
          className="mt-1 block w-full text-sm"
          onChange={async (e) => {
            await addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {images.length === 0 ? (
        <div
          className="mt-4 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] px-4 py-8 text-center"
          role="status"
        >
          <FiImage className="h-8 w-8 text-[color:var(--lx-muted)] opacity-60" aria-hidden />
          <p className="text-sm font-semibold text-[color:var(--lx-text-2)]">Aún no hay fotos</p>
          <p className="text-xs text-[color:var(--lx-muted)]">Agrega URLs o sube archivos para verlas aquí.</p>
        </div>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {images.map((img) => (
            <li
              key={img.id}
              className="flex gap-3 rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] p-2 shadow-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="h-20 w-28 shrink-0 rounded-lg object-cover" />
              <div className="flex min-w-0 flex-1 flex-col justify-between gap-1">
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    className={`inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                      img.isPrimary
                        ? "border-[color:var(--lx-gold)] bg-[color:var(--lx-nav-active)] text-[color:var(--lx-text)]"
                        : "border-[color:var(--lx-nav-border)] text-[color:var(--lx-text-2)] hover:bg-[color:var(--lx-nav-hover)]"
                    }`}
                    onClick={() => setPrimary(img.id)}
                    title="Marcar como principal"
                  >
                    <FiStar className="h-3 w-3" aria-hidden />
                    Principal
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-0.5 rounded-full border border-[color:var(--lx-nav-border)] px-2 py-0.5 text-[10px] font-bold text-[color:var(--lx-text-2)] hover:bg-[color:var(--lx-nav-hover)]"
                    onClick={() => move(img.id, -1)}
                    aria-label="Subir"
                  >
                    <FiChevronUp className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-0.5 rounded-full border border-[color:var(--lx-nav-border)] px-2 py-0.5 text-[10px] font-bold text-[color:var(--lx-text-2)] hover:bg-[color:var(--lx-nav-hover)]"
                    onClick={() => move(img.id, 1)}
                    aria-label="Bajar"
                  >
                    <FiChevronDown className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    className="ml-auto inline-flex items-center gap-0.5 rounded-full border border-red-200 px-2 py-0.5 text-[10px] font-bold text-red-800 hover:bg-red-50"
                    onClick={() => remove(img.id)}
                  >
                    <FiTrash2 className="h-3 w-3" aria-hidden />
                    Quitar
                  </button>
                </div>
                <p className="truncate text-[10px] text-[color:var(--lx-muted)]">
                  {img.sourceType === "file" ? "Archivo local" : "URL"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <h3 className={SUBHEAD}>Video / recorrido</h3>
      <p className="mt-1 text-xs leading-relaxed text-[color:var(--lx-muted)]">
        El archivo de video no se sube a Mux en la vista previa. Al publicar, el archivo se procesará en Mux. Si eliminas el
        anuncio más adelante, el video publicado deberá eliminarse de Mux.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className={`rounded-full px-3 py-1.5 text-xs font-bold ${
            vs === "url" ? "bg-[color:var(--lx-nav-active)] text-[color:var(--lx-text)]" : "border border-[color:var(--lx-nav-border)] bg-[#FFFCF7]"
          }`}
          onClick={setVideoUrlMode}
        >
          Enlace
        </button>
        <button
          type="button"
          className={`rounded-full px-3 py-1.5 text-xs font-bold ${
            vs === "file" ? "bg-[color:var(--lx-nav-active)] text-[color:var(--lx-text)]" : "border border-[color:var(--lx-nav-border)] bg-[#FFFCF7]"
          }`}
          onClick={() => setListingPatch({ videoSourceType: "file", videoUrl: undefined, videoUploadStatus: null })}
        >
          Archivo local
        </button>
        {(vs || videoUrl || videoFile) && (
          <button type="button" className="text-xs font-bold text-red-800 underline" onClick={clearVideo}>
            Quitar video
          </button>
        )}
      </div>

      {vs === "url" || (vs === null && videoUrl) ? (
        <div className="mt-3">
          <label className={LABEL}>URL del video</label>
          <input
            className={INPUT}
            placeholder="https://…"
            value={videoUrl}
            onChange={(e) => onVideoUrlChange(e.target.value)}
          />
        </div>
      ) : null}

      {vs === "file" ? (
        <div className="mt-3">
          <label className={LABEL}>Archivo de video</label>
          <input
            type="file"
            accept="video/*"
            className="mt-1 block w-full text-sm"
            onChange={(e) => {
              void onVideoFile(e.target.files);
              e.target.value = "";
            }}
          />
          {listing.videoFileName ? (
            <p className="mt-1 text-xs text-[color:var(--lx-muted)]">
              <FiVideo className="mr-1 inline h-3.5 w-3.5" aria-hidden />
              {listing.videoFileName} — listo para vista previa local
            </p>
          ) : null}
        </div>
      ) : null}

      {vs === null && !videoUrl && !videoFile ? (
        <p className="mt-2 text-xs text-[color:var(--lx-muted)]">Elige enlace o archivo para configurar el video.</p>
      ) : null}

      <h3 className={SUBHEAD}>Logo del negocio / concesionario</h3>
      <div className="mt-2">
        <label className={LABEL}>URL del logo</label>
        <input
          className={INPUT}
          placeholder="https://…"
          value={logo?.startsWith("data:") ? "" : logo ?? ""}
          onChange={(e) => setListingPatch({ dealerLogo: e.target.value.trim() || undefined })}
        />
      </div>
      <div className="mt-3">
        <label className={LABEL}>O subir imagen</label>
        <input
          type="file"
          accept="image/*"
          className="mt-1 block w-full text-sm"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const url = await readFileAsDataUrl(f);
            setListingPatch({ dealerLogo: url });
            e.target.value = "";
          }}
        />
      </div>
      {logo ? (
        <div className="mt-3 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt="" className="h-14 w-14 rounded-lg border border-[color:var(--lx-nav-border)] object-cover" />
          <button type="button" className="text-xs font-bold text-red-800 underline" onClick={() => setListingPatch({ dealerLogo: undefined })}>
            Quitar logo
          </button>
        </div>
      ) : null}
    </section>
  );
}
