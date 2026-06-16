"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FiImage, FiPlus, FiUpload } from "react-icons/fi";
import type { AutoDealerListing, MediaImageEntry } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import type { AutosNegociosCopy } from "@/app/clasificados/autos/negocios/lib/autosNegociosCopy";
import {
  ensureOnePrimaryMedia,
  newMediaImageId,
  normalizeMediaImagesOrder,
} from "@/app/clasificados/autos/negocios/lib/autoDealerHeroImages";
import { dedupeAutosVideoUrls } from "@/app/lib/clasificados/autos/autosExternalVideoUrlValidation";
import { readFileAsDataUrl } from "../lib/readFileAsDataUrl";
import { AutosSortablePhotoGrid } from "@/app/publicar/autos/shared/components/AutosSortablePhotoGrid";
import { AutosExternalVideoUrlsField } from "@/app/publicar/autos/shared/components/AutosExternalVideoUrlsField";
import { classifyAutosImageUrlInput } from "@/app/lib/clasificados/autos/autosImageUrlInput";
import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import { AutosLocalFileTemporaryDraftNote } from "@/app/publicar/autos/shared/components/AutosLocalFileTemporaryDraftNote";

const LABEL = "block text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]";
const INPUT =
  "mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3 py-2 text-sm text-[color:var(--lx-text)] outline-none ring-[color:var(--lx-focus-ring)] focus:ring-2";
const SUBHEAD = "mt-6 text-sm font-bold text-[color:var(--lx-text)]";
const DROPZONE_BASE =
  "rounded-xl border-2 border-dashed transition-colors px-4 py-8 text-center sm:py-7";
const BTN_PRIMARY =
  "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[14px] bg-[color:var(--lx-cta-dark)] px-5 text-sm font-bold text-[#FFFCF7] shadow-md transition hover:bg-[color:var(--lx-cta-dark-hover)] active:opacity-90";
const BTN_SECONDARY =
  "inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-4 py-2 text-xs font-bold text-[color:var(--lx-text)] hover:bg-[color:var(--lx-nav-hover)] active:opacity-90";

function sortByOrder(images: MediaImageEntry[]): MediaImageEntry[] {
  return normalizeMediaImagesOrder(images);
}

/** @deprecated Use normalizeMediaImagesOrder from autoDealerHeroImages */
function ensureOnePrimary(images: MediaImageEntry[]): MediaImageEntry[] {
  return ensureOnePrimaryMedia(images);
}

/** @deprecated Use normalizeMediaImagesOrder from autoDealerHeroImages */
function reindex(images: MediaImageEntry[]): MediaImageEntry[] {
  return normalizeMediaImagesOrder(images);
}

/** Some mobile pickers omit MIME or use HEIC; avoid dropping valid photos from multi-select. */
function isLikelyImageFile(f: File): boolean {
  if (f.type.startsWith("image/")) return true;
  if (f.type === "image/heic" || f.type === "image/heif") return true;
  if (!f.type || f.type === "application/octet-stream") {
    return /\.(jpe?g|png|gif|webp|heic|heif|bmp|avif|svg)$/i.test(f.name);
  }
  return false;
}

export function AutosNegociosMediaManager({
  listing,
  setListingPatch,
  copy,
  /** Hide dealership logo block (e.g. Autos Privado lane). */
  hideDealerLogo = false,
  /** For in-app “Vista previa” scroll target */
  sectionId = "autos-clasificados-app-media",
  lang,
  insideModal = false,
}: {
  listing: AutoDealerListing;
  setListingPatch: (patch: Partial<AutoDealerListing>) => void;
  copy: AutosNegociosCopy;
  hideDealerLogo?: boolean;
  sectionId?: string;
  lang?: AutosNegociosLang;
  insideModal?: boolean;
}) {
  const m = copy.media;
  const images = sortByOrder(listing.mediaImages ?? []);
  const [urlBatch, setUrlBatch] = useState("");
  const [singleImageUrlDraft, setSingleImageUrlDraft] = useState("");
  const [singleUrlError, setSingleUrlError] = useState<string | null>(null);
  const [batchUrlError, setBatchUrlError] = useState<string | null>(null);
  const [dragOverPhotos, setDragOverPhotos] = useState(false);
  const [logoUrlDraft, setLogoUrlDraft] = useState("");

  const photoInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const commitImages = useCallback(
    (next: MediaImageEntry[]) => {
      const cleaned = normalizeMediaImagesOrder(next);
      setListingPatch({
        mediaImages: cleaned,
        heroImages: cleaned.map((x) => x.url).filter(Boolean),
      });
    },
    [setListingPatch],
  );

  const addFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;
      const base = sortByOrder(listing.mediaImages ?? []);
      const filesArr = Array.from(files).filter(isLikelyImageFile);
      if (!filesArr.length) return;
      const dataUrls = await Promise.all(filesArr.map((f) => readFileAsDataUrl(f)));
      const additions: MediaImageEntry[] = dataUrls.map((url, i) => ({
        id: newMediaImageId(),
        url,
        sourceType: "file" as const,
        isPrimary: base.length === 0 && i === 0,
        sortOrder: base.length + i,
      }));
      const merged = reindex([...base, ...additions]);
      commitImages(ensureOnePrimary(merged));
    },
    [listing.mediaImages, commitImages],
  );

  const addUrlsFromText = (lines: string, clearBatchField: boolean): boolean => {
    const rawLines = lines.split(/\n/).map((s) => s.trim()).filter(Boolean);
    if (!rawLines.length) {
      setBatchUrlError(m.invalidImageUrl);
      return false;
    }
    const accepted: string[] = [];
    let sawVideo = false;
    let sawInvalid = false;
    for (const line of rawLines) {
      const result = classifyAutosImageUrlInput(line);
      if (result.ok) {
        accepted.push(result.url);
      } else if (result.reason === "video") {
        sawVideo = true;
      } else if (result.reason !== "empty") {
        sawInvalid = true;
      }
    }
    if (!accepted.length) {
      setBatchUrlError(sawVideo ? m.videoUrlRejected : m.invalidImageUrl);
      return false;
    }
    setBatchUrlError(sawVideo || sawInvalid ? m.invalidImageUrl : null);
    const base = sortByOrder(listing.mediaImages ?? []);
    const additions: MediaImageEntry[] = accepted.map((url, i) => ({
      id: newMediaImageId(),
      url,
      sourceType: "url" as const,
      isPrimary: base.length === 0 && i === 0,
      sortOrder: base.length + i,
    }));
    const merged = reindex([...base, ...additions]);
    commitImages(ensureOnePrimary(merged));
    if (clearBatchField) setUrlBatch("");
    return true;
  };

  const addSingleImageUrl = (): boolean => {
    const result = classifyAutosImageUrlInput(singleImageUrlDraft);
    if (!result.ok) {
      setSingleUrlError(
        result.reason === "video" ? m.videoUrlRejected : result.reason === "empty" ? m.invalidImageUrl : m.invalidImageUrl,
      );
      return false;
    }
    setSingleUrlError(null);
    addUrlsFromText(result.url, false);
    setSingleImageUrlDraft("");
    return true;
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

  const onVideoUrlsChange = useCallback(
    (urls: string[]) => {
      const videoUrls = dedupeAutosVideoUrls(urls);
      setListingPatch({
        videoUrls,
        videoUrl: videoUrls[0] ?? undefined,
        videoSourceType: videoUrls.length ? "url" : null,
        videoFileDataUrl: undefined,
        videoFileName: undefined,
        videoUploadStatus: videoUrls.length ? "local_preview" : null,
      });
    },
    [setListingPatch],
  );

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
    <section
      id={sectionId}
      data-autos-editor-media-count={images.length}
      data-autos-editor-video-count={listing.videoUrls?.length ?? 0}
      className="min-w-0 scroll-mt-24 overflow-x-hidden rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-5 shadow-[0_8px_28px_-12px_rgba(42,36,22,0.12)] sm:p-6"
    >
      <h2 className="text-lg font-bold text-[color:var(--lx-text)]">{copy.app.sections.media}</h2>
      <p className="mt-1 text-sm text-[color:var(--lx-muted)]">{m.sectionIntro}</p>
      {lang ? <AutosLocalFileTemporaryDraftNote lang={lang} /> : null}

      <input
        ref={photoInputRef}
        type="file"
        accept="image/*,image/heic,image/heif,.heic,.heif"
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          void addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <h3 className={SUBHEAD}>{m.photosHeading}</h3>

      <div
        className={`${photoDropClass} mt-3`}
        onDragEnter={onPhotoDragOver}
        onDragOver={onPhotoDragOver}
        onDragLeave={() => setDragOverPhotos(false)}
        onDrop={onPhotoDrop}
      >
        <FiImage className="mx-auto h-8 w-8 text-[color:var(--lx-muted)] opacity-70" aria-hidden />
        <p className="mt-2 text-sm font-semibold text-[color:var(--lx-text)]">{m.dropzone}</p>
        <button type="button" className={`${BTN_PRIMARY} mt-4 w-full max-w-sm sm:w-auto`} onClick={() => photoInputRef.current?.click()}>
          <FiUpload className="h-4 w-4" aria-hidden />
          {m.addPhotos}
        </button>
        <p className="mt-2 text-xs text-[color:var(--lx-muted)]">{m.pickerHint}</p>
        <p className="mt-1.5 text-[11px] leading-relaxed text-[color:var(--lx-muted)]">{m.pickerMultiNote}</p>
      </div>

      <h3 className={`${SUBHEAD} mt-6`}>{m.urlSectionHeading}</h3>
      <p className="mt-1 text-xs leading-relaxed text-[color:var(--lx-muted)]">{m.urlHelper}</p>

      <div className="mt-4">
        <label className={LABEL}>{m.singleUrl}</label>
        <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-end">
          <input
            className={`${INPUT} sm:min-w-0 sm:flex-1`}
            placeholder={copy.app.placeholders.https}
            value={singleImageUrlDraft}
            onChange={(e) => {
              setSingleImageUrlDraft(e.target.value);
              if (singleUrlError) setSingleUrlError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSingleImageUrl();
              }
            }}
            aria-invalid={Boolean(singleUrlError)}
          />
          <button type="button" className={BTN_SECONDARY} onClick={addSingleImageUrl}>
            {m.addImage}
          </button>
        </div>
        {singleUrlError ? (
          <p className="mt-2 text-xs font-medium text-red-800" role="alert">
            {singleUrlError}
          </p>
        ) : null}
      </div>

      <div className="mt-4">
        <label className={LABEL}>{m.batchUrls}</label>
        <textarea
          className={`${INPUT} min-h-[72px] font-mono text-xs`}
          placeholder={copy.app.placeholders.https}
          value={urlBatch}
          onChange={(e) => {
            setUrlBatch(e.target.value);
            if (batchUrlError) setBatchUrlError(null);
          }}
        />
        <button
          type="button"
          className={`${BTN_SECONDARY} mt-2`}
          onClick={() => addUrlsFromText(urlBatch, true)}
        >
          <FiPlus className="h-3.5 w-3.5" aria-hidden />
          {m.addImages}
        </button>
        {batchUrlError ? (
          <p className="mt-2 text-xs font-medium text-red-800" role="alert">
            {batchUrlError}
          </p>
        ) : null}
      </div>

      {images.length > 0 ? (
        <div className="mt-5 rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] px-4 py-3">
          <p className="text-sm font-bold text-[color:var(--lx-text)]">{m.reorderHeading}</p>
          <p className="mt-1 text-xs leading-relaxed text-[color:var(--lx-muted)]">{m.reorderHint}</p>
        </div>
      ) : null}

      {images.length === 0 ? (
        <div
          className="mt-4 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] px-4 py-6 text-center"
          role="status"
        >
          <p className="text-sm font-semibold text-[color:var(--lx-text-2)]">{m.emptyPhotos}</p>
          <p className="text-xs text-[color:var(--lx-muted)]">{m.emptyPhotosHint}</p>
        </div>
      ) : (
        <AutosSortablePhotoGrid
          images={images}
          onReorder={(next) => commitImages(next)}
          onSetPrimary={setPrimary}
          onRemove={remove}
          onMove={move}
          copy={{
            useAsCover: m.useAsCover,
            activeCover: m.activeCover,
            before: m.before,
            after: m.after,
            remove: m.remove,
            sourceFile: m.sourceFile,
            sourceUrl: m.sourceUrl,
            secondary: m.secondary,
            principal: m.principal,
            dragHandle: m.dragHandle,
          }}
        />
      )}

      {lang ? (
        <AutosExternalVideoUrlsField
          lang={lang}
          videoUrls={listing.videoUrls}
          onChange={onVideoUrlsChange}
          insideModal={insideModal}
        />
      ) : null}

      {!hideDealerLogo ? (
        <>
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

          <h3 className={SUBHEAD}>{m.logoHeading}</h3>
          <p className="mt-1 text-xs text-[color:var(--lx-muted)]">{m.logoUrlHint}</p>

          <div className="mt-2 rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] p-3">
            <label className={LABEL}>{m.logoUrlLabel}</label>
            <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-end">
              <input
                className={`${INPUT} sm:min-w-0 sm:flex-1`}
                placeholder={copy.app.placeholders.https}
                value={logoUrlDraft}
                onChange={(e) => setLogoUrlDraft(e.target.value)}
              />
              <button type="button" className={BTN_SECONDARY} onClick={applyLogoUrl}>
                {m.useLogoUrl}
              </button>
            </div>
            {logo && !logo.startsWith("data:") ? (
              <p className="mt-2 inline-flex items-center gap-1 rounded-full border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-nav-hover)] px-2.5 py-1 text-[11px] font-bold text-[color:var(--lx-text)]">
                {m.logoUrlSaved}
              </p>
            ) : null}
          </div>

          <div className="mt-3">
            <button type="button" className={BTN_PRIMARY} onClick={() => logoInputRef.current?.click()}>
              <FiUpload className="h-4 w-4" aria-hidden />
              {m.uploadLogo}
            </button>
            <p className="mt-1 text-xs text-[color:var(--lx-muted)]">{m.uploadLogoHint}</p>
          </div>

          {logo ? (
            <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] p-3">
              { }
              <img src={logo} alt="" className="h-16 w-16 rounded-lg border border-[color:var(--lx-nav-border)] object-cover" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[color:var(--lx-text)]">{m.logoPreviewTitle}</p>
                <p className="text-[11px] text-[color:var(--lx-muted)]">
                  {logo.startsWith("data:") ? m.logoPreviewFile : m.logoPreviewUrl}
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
                {m.removeLogo}
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
