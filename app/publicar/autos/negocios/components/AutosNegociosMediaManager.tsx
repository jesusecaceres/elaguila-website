"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiImage, FiPlus, FiStar, FiTrash2, FiUpload, FiVideo } from "react-icons/fi";
import type { AutoDealerListing, MediaImageEntry } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { newMediaImageId } from "@/app/clasificados/autos/negocios/lib/autoDealerHeroImages";
import { readFileAsDataUrl } from "../lib/readFileAsDataUrl";

const LABEL = "block text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]";
const INPUT =
  "mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3 py-2 text-sm text-[color:var(--lx-text)] outline-none ring-[color:var(--lx-focus-ring)] focus:ring-2";
const SUBHEAD = "mt-6 text-sm font-bold text-[color:var(--lx-text)]";
const DROPZONE_BASE =
  "rounded-xl border-2 border-dashed transition-colors px-4 py-6 text-center";
const BTN_PRIMARY =
  "inline-flex h-11 items-center justify-center gap-2 rounded-[14px] bg-[color:var(--lx-cta-dark)] px-5 text-sm font-bold text-[#FFFCF7] shadow-md transition hover:bg-[color:var(--lx-cta-dark-hover)]";
const BTN_SECONDARY =
  "inline-flex items-center gap-1.5 rounded-full border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3 py-2 text-xs font-bold text-[color:var(--lx-text)] hover:bg-[color:var(--lx-nav-hover)]";

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
  const [singleImageUrlDraft, setSingleImageUrlDraft] = useState("");
  const [dragOverPhotos, setDragOverPhotos] = useState(false);
  const [videoUrlDraft, setVideoUrlDraft] = useState("");
  const [logoUrlDraft, setLogoUrlDraft] = useState("");

  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const commitImages = useCallback(
    (next: MediaImageEntry[]) => {
      const cleaned = reindex(ensureOnePrimary(next));
      setListingPatch({ mediaImages: cleaned });
    },
    [setListingPatch],
  );

  const addFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;
      const base = sortByOrder(listing.mediaImages ?? []);
      const filesArr = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (!filesArr.length) return;
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
    },
    [listing.mediaImages, commitImages],
  );

  const addUrlsFromText = (lines: string, clearBatchField: boolean) => {
    const urls = lines
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
    if (clearBatchField) setUrlBatch("");
  };

  const addSingleImageUrl = () => {
    const u = singleImageUrlDraft.trim();
    if (!u) return;
    addUrlsFromText(u, false);
    setSingleImageUrlDraft("");
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

  useEffect(() => {
    setVideoUrlDraft(listing.videoUrl ?? "");
  }, [listing.videoUrl]);

  const clearVideo = () => {
    setVideoUrlDraft("");
    setListingPatch({
      videoSourceType: null,
      videoUrl: undefined,
      videoFileDataUrl: undefined,
      videoFileName: undefined,
      videoUploadStatus: null,
    });
  };

  /** File source wins over URL when both would exist. */
  const applyVideoUrl = () => {
    const t = videoUrlDraft.trim();
    setListingPatch({
      videoSourceType: t ? "url" : null,
      videoUrl: t || undefined,
      videoFileDataUrl: undefined,
      videoFileName: undefined,
      videoUploadStatus: t ? "local_preview" : null,
    });
  };

  const onVideoFilePicked = async (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    const dataUrl = await readFileAsDataUrl(f);
    setVideoUrlDraft("");
    setListingPatch({
      videoSourceType: "file",
      videoUrl: undefined,
      videoFileDataUrl: dataUrl,
      videoFileName: f.name,
      videoUploadStatus: "local_preview",
    });
  };

  const setVideoModeUrl = () => {
    setListingPatch({
      videoSourceType: "url",
      videoFileDataUrl: undefined,
      videoFileName: undefined,
      videoUploadStatus: null,
    });
  };

  const setVideoModeFile = () => {
    setListingPatch({
      videoSourceType: "file",
      videoUrl: undefined,
      videoUploadStatus: null,
    });
  };

  const logo = listing.dealerLogo?.trim();
  useEffect(() => {
    if (!logo) {
      setLogoUrlDraft("");
      return;
    }
    if (!logo.startsWith("data:")) {
      setLogoUrlDraft(logo);
    } else {
      setLogoUrlDraft("");
    }
  }, [logo]);

  const applyLogoUrl = () => {
    const t = logoUrlDraft.trim();
    setListingPatch({ dealerLogo: t || undefined });
  };

  const onLogoFile = async (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    const url = await readFileAsDataUrl(f);
    setListingPatch({ dealerLogo: url });
    setLogoUrlDraft("");
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const onPhotoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverPhotos(false);
    if (e.dataTransfer.files?.length) void addFiles(e.dataTransfer.files);
  };

  const onPhotoDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setDragOverPhotos(true);
  };

  const photoDropClass = dragOverPhotos
    ? `${DROPZONE_BASE} border-[color:var(--lx-gold)] bg-[color:var(--lx-nav-hover)]`
    : `${DROPZONE_BASE} border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)]`;

  return (
    <section className="rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-5 shadow-[0_8px_28px_-12px_rgba(42,36,22,0.12)]">
      <h2 className="text-lg font-bold text-[color:var(--lx-text)]">Fotos y medios</h2>
      <p className="mt-1 text-sm text-[color:var(--lx-muted)]">
        Puedes pegar URLs o subir archivos. Selecciona la imagen principal para el anuncio.
      </p>

      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          void addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <h3 className={SUBHEAD}>Fotos del vehículo</h3>

      <div
        className={`${photoDropClass} mt-3`}
        onDragEnter={onPhotoDragOver}
        onDragOver={onPhotoDragOver}
        onDragLeave={() => setDragOverPhotos(false)}
        onDrop={onPhotoDrop}
      >
        <FiImage className="mx-auto h-8 w-8 text-[color:var(--lx-muted)] opacity-70" aria-hidden />
        <p className="mt-2 text-sm font-semibold text-[color:var(--lx-text)]">Arrastra imágenes aquí o usa el botón</p>
        <button type="button" className={`${BTN_PRIMARY} mt-4`} onClick={() => photoInputRef.current?.click()}>
          <FiUpload className="h-4 w-4" aria-hidden />
          Añadir fotos
        </button>
        <p className="mt-2 text-xs text-[color:var(--lx-muted)]">Se abrirá el selector de archivos del sistema.</p>
      </div>

      <div className="mt-5">
        <label className={LABEL}>Enlace de una imagen</label>
        <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-end">
          <input
            className={`${INPUT} sm:min-w-0 sm:flex-1`}
            placeholder="https://…"
            value={singleImageUrlDraft}
            onChange={(e) => setSingleImageUrlDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSingleImageUrl();
              }
            }}
          />
          <button type="button" className={BTN_SECONDARY} onClick={addSingleImageUrl}>
            Usar este enlace
          </button>
        </div>
      </div>

      <div className="mt-4">
        <label className={LABEL}>Varias URLs (una por línea)</label>
        <textarea
          className={`${INPUT} min-h-[72px] font-mono text-xs`}
          placeholder="https://…"
          value={urlBatch}
          onChange={(e) => setUrlBatch(e.target.value)}
        />
        <button type="button" className={`${BTN_SECONDARY} mt-2`} onClick={() => addUrlsFromText(urlBatch, true)}>
          <FiPlus className="h-3.5 w-3.5" aria-hidden />
          Agregar URLs
        </button>
      </div>

      {images.length === 0 ? (
        <div
          className="mt-4 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] px-4 py-6 text-center"
          role="status"
        >
          <p className="text-sm font-semibold text-[color:var(--lx-text-2)]">Aún no hay fotos en el borrador</p>
          <p className="text-xs text-[color:var(--lx-muted)]">Usa «Añadir fotos» o suelta archivos en el área de arriba.</p>
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
                    aria-label="Antes"
                  >
                    <FiChevronLeft className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-0.5 rounded-full border border-[color:var(--lx-nav-border)] px-2 py-0.5 text-[10px] font-bold text-[color:var(--lx-text-2)] hover:bg-[color:var(--lx-nav-hover)]"
                    onClick={() => move(img.id, 1)}
                    aria-label="Después"
                  >
                    <FiChevronRight className="h-3 w-3" />
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
                  {img.sourceType === "file" ? "Archivo local" : "URL"} · {img.isPrimary ? "Principal" : "Secundaria"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          void onVideoFilePicked(e.target.files);
          e.target.value = "";
        }}
      />

      <h3 className={SUBHEAD}>Video / recorrido</h3>
      <p className="mt-1 text-xs leading-relaxed text-[color:var(--lx-muted)]">
        En borrador, el video se muestra localmente en tu dispositivo. Solo se enviará a Mux al publicar. Si hay
        archivo local, tiene prioridad sobre el enlace.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className={`rounded-full px-3 py-1.5 text-xs font-bold ${
            vs === "url" ? "bg-[color:var(--lx-nav-active)] text-[color:var(--lx-text)]" : "border border-[color:var(--lx-nav-border)] bg-[#FFFCF7]"
          }`}
          onClick={setVideoModeUrl}
        >
          Enlace
        </button>
        <button
          type="button"
          className={`rounded-full px-3 py-1.5 text-xs font-bold ${
            vs === "file" ? "bg-[color:var(--lx-nav-active)] text-[color:var(--lx-text)]" : "border border-[color:var(--lx-nav-border)] bg-[#FFFCF7]"
          }`}
          onClick={setVideoModeFile}
        >
          Archivo local
        </button>
        {(vs || videoUrl || videoFile) && (
          <button type="button" className="text-xs font-bold text-red-800 underline" onClick={clearVideo}>
            Quitar video
          </button>
        )}
      </div>

      {(vs === "url" || (vs === null && videoUrl)) && (
        <div className="mt-3 rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] p-3">
          <label className={LABEL}>URL del video</label>
          <input
            className={INPUT}
            placeholder="https://…"
            value={videoUrlDraft}
            onChange={(e) => setVideoUrlDraft(e.target.value)}
          />
          <button type="button" className={`${BTN_SECONDARY} mt-2`} onClick={applyVideoUrl}>
            Usar este enlace
          </button>
          {videoUrl ? (
            <p className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-[color:var(--lx-text-2)]">
              <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-nav-hover)] px-2.5 py-1 text-[11px] font-bold text-[color:var(--lx-text)]">
                <FiVideo className="h-3.5 w-3.5 text-[color:var(--lx-gold)]" aria-hidden />
                Video por enlace — guardado en el borrador
              </span>
            </p>
          ) : null}
        </div>
      )}

      {vs === "file" && (
        <div className="mt-3 rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] p-3">
          <button type="button" className={BTN_PRIMARY} onClick={() => videoInputRef.current?.click()}>
            <FiUpload className="h-4 w-4" aria-hidden />
            Elegir archivo de video
          </button>
          {listing.videoFileName ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-nav-hover)] px-2.5 py-1 text-[11px] font-bold text-[color:var(--lx-text)]">
                Video guardado en el borrador (local)
              </span>
              <span className="text-xs text-[color:var(--lx-text-2)]">{listing.videoFileName}</span>
              <button
                type="button"
                className="text-xs font-bold text-[color:var(--lx-text-2)] underline"
                onClick={() => videoInputRef.current?.click()}
              >
                Reemplazar
              </button>
            </div>
          ) : (
            <p className="mt-2 text-xs text-[color:var(--lx-muted)]">Selecciona un archivo; se guarda solo en este dispositivo.</p>
          )}
        </div>
      )}

      {vs === null && !videoUrl && !videoFile ? (
        <p className="mt-2 text-xs text-[color:var(--lx-muted)]">Elige enlace o archivo para el video.</p>
      ) : null}

      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          void onLogoFile(e.target.files);
        }}
      />

      <h3 className={SUBHEAD}>Logo del concesionario</h3>
      <p className="mt-1 text-xs text-[color:var(--lx-muted)]">URL o archivo. Confirma la URL con el botón.</p>

      <div className="mt-2 rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] p-3">
        <label className={LABEL}>URL del logo</label>
        <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-end">
          <input
            className={`${INPUT} sm:min-w-0 sm:flex-1`}
            placeholder="https://…"
            value={logoUrlDraft}
            onChange={(e) => setLogoUrlDraft(e.target.value)}
          />
          <button type="button" className={BTN_SECONDARY} onClick={applyLogoUrl}>
            Usar esta URL
          </button>
        </div>
        {logo && !logo.startsWith("data:") ? (
          <p className="mt-2 inline-flex items-center gap-1 rounded-full border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-nav-hover)] px-2.5 py-1 text-[11px] font-bold text-[color:var(--lx-text)]">
            Logo confirmado en el borrador (URL)
          </p>
        ) : null}
      </div>

      <div className="mt-3">
        <button type="button" className={BTN_PRIMARY} onClick={() => logoInputRef.current?.click()}>
          <FiUpload className="h-4 w-4" aria-hidden />
          Subir logo desde archivo
        </button>
        <p className="mt-1 text-xs text-[color:var(--lx-muted)]">Abre el selector de archivos al instante.</p>
      </div>

      {logo ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt="" className="h-16 w-16 rounded-lg border border-[color:var(--lx-nav-border)] object-cover" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-[color:var(--lx-text)]">Logo confirmado en el borrador</p>
            <p className="text-[11px] text-[color:var(--lx-muted)]">
              {logo.startsWith("data:") ? "Archivo local (solo en este dispositivo)" : "Desde URL"}
            </p>
          </div>
          <button
            type="button"
            className="text-xs font-bold text-red-800 underline"
            onClick={() => {
              setLogoUrlDraft("");
              setListingPatch({ dealerLogo: undefined });
            }}
          >
            Quitar logo
          </button>
        </div>
      ) : null}
    </section>
  );
}
