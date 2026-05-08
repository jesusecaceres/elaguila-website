"use client";

import { useCallback, useRef } from "react";
import Image from "next/image";

import type { EmpleosImageItem } from "./empleosMediaTypes";
import { newImageId } from "./empleosMediaTypes";

export type EmpleosImageGalleryUploadMode = "images" | "imagesAndPdf";

type Props = {
  images: EmpleosImageItem[];
  onChange: (next: EmpleosImageItem[]) => void;
  urlPlaceholder: string;
  addUrlLabel: string;
  uploadLabel: string;
  mainLabel: string;
  removeLabel: string;
  upLabel: string;
  downLabel: string;
  /** Alt text input placeholder (i18n). */
  altPlaceholder?: string;
  /**
   * `images` (default): Empleos Quick / Premium — image uploads only.
   * `imagesAndPdf`: Clases / Comunidad quick — images + PDF flyers (data URLs in session).
   */
  uploadMode?: EmpleosImageGalleryUploadMode;
  /** For PDF/file card subtitles (optional). */
  lang?: "es" | "en";
};

/** Images + PDF in-session (data URLs). Word (.doc/.docx) needs storage/API vetting — not in accept yet. */
const PDF_ACCEPT = "image/*,application/pdf,.pdf,.png,.jpg,.jpeg,.webp";

function isHttpPdfUrl(url: string): boolean {
  const base = url.split(/[?#]/)[0]?.toLowerCase() ?? "";
  return base.endsWith(".pdf");
}

function isPdfItem(url: string, mime?: string): boolean {
  if (mime === "application/pdf") return true;
  if (url.startsWith("data:application/pdf")) return true;
  if (url.startsWith("http") && isHttpPdfUrl(url)) return true;
  return false;
}

function fileTypeLabel(lang: "es" | "en" | undefined, mime?: string): string {
  if (mime === "application/pdf" || !mime) {
    return lang === "en" ? "PDF" : "PDF";
  }
  return mime.split("/")[1]?.toUpperCase() ?? (lang === "en" ? "File" : "Archivo");
}

export function EmpleosImageGalleryEditor({
  images,
  onChange,
  urlPlaceholder,
  addUrlLabel,
  uploadLabel,
  mainLabel,
  removeLabel,
  upLabel,
  downLabel,
  altPlaceholder = "",
  uploadMode = "images",
  lang = "es",
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);
  const allowPdf = uploadMode === "imagesAndPdf";

  const setMain = useCallback(
    (id: string) => {
      onChange(images.map((im) => ({ ...im, isMain: im.id === id })));
    },
    [images, onChange]
  );

  const remove = useCallback(
    (id: string) => {
      const next = images.filter((i) => i.id !== id);
      if (next.length && !next.some((i) => i.isMain)) next[0] = { ...next[0], isMain: true };
      onChange(next);
    },
    [images, onChange]
  );

  const move = useCallback(
    (id: string, dir: -1 | 1) => {
      const idx = images.findIndex((i) => i.id === id);
      if (idx < 0) return;
      const j = idx + dir;
      if (j < 0 || j >= images.length) return;
      const copy = [...images];
      [copy[idx], copy[j]] = [copy[j], copy[idx]];
      onChange(copy);
    },
    [images, onChange]
  );

  const addFromUrl = useCallback(() => {
    const u = urlRef.current?.value?.trim();
    if (!u) return;
    const pdfUrl = allowPdf && isHttpPdfUrl(u);
    const item: EmpleosImageItem = {
      id: newImageId(),
      url: u,
      alt: "",
      isMain: images.length === 0,
      ...(pdfUrl ? { attachmentMime: "application/pdf" } : {}),
    };
    onChange(images.length === 0 ? [item] : [...images.map((i) => ({ ...i, isMain: false })), { ...item, isMain: true }]);
    if (urlRef.current) urlRef.current.value = "";
  }, [allowPdf, images, onChange]);

  const onFiles = useCallback(
    (files: FileList | null) => {
      if (!files?.length) return;
      const readers: Promise<EmpleosImageItem | null>[] = Array.from(files).map(
        (file) =>
          new Promise((resolve, reject) => {
            const isPdf =
              allowPdf &&
              (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"));
            const isImage = file.type.startsWith("image/");
            if (!isImage && !isPdf) {
              resolve(null);
              return;
            }
            const r = new FileReader();
            r.onload = () => {
              resolve({
                id: newImageId(),
                url: String(r.result ?? ""),
                alt: file.name,
                isMain: false,
                ...(isPdf ? { attachmentMime: "application/pdf" as const } : {}),
              });
            };
            r.onerror = () => reject(new Error("read"));
            r.readAsDataURL(file);
          })
      );
      void Promise.all(readers).then((items) => {
        const added = items.filter((x): x is EmpleosImageItem => Boolean(x));
        if (!added.length) return;
        const base =
          images.length === 0
            ? added.map((x, i) => ({ ...x, isMain: i === 0 }))
            : [...images, ...added.map((x) => ({ ...x, isMain: false }))];
        if (images.length > 0 && !base.some((b) => b.isMain)) base[0] = { ...base[0], isMain: true };
        onChange(base);
      });
    },
    [allowPdf, images, onChange]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <input
          ref={urlRef}
          type="url"
          placeholder={urlPlaceholder}
          className="min-h-11 flex-1 rounded-lg border border-black/10 bg-white px-3 text-sm"
        />
        <button type="button" onClick={addFromUrl} className="min-h-11 rounded-lg bg-[color:var(--lx-cta-dark)] px-4 text-xs font-bold text-[#FFFCF7]">
          {addUrlLabel}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept={allowPdf ? PDF_ACCEPT : "image/*"}
          multiple
          className="hidden"
          onChange={(e) => void onFiles(e.target.files)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="min-h-11 rounded-lg border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-4 text-xs font-bold"
        >
          {uploadLabel}
        </button>
      </div>

      {images.length > 0 ? (
        <ul className="space-y-3">
          {images.map((im, idx) => {
            const showFileCard = allowPdf && isPdfItem(im.url, im.attachmentMime);
            return (
              <li
                key={im.id}
                className="flex flex-col gap-2 rounded-lg border border-black/10 bg-white p-3 sm:flex-row sm:items-center"
              >
                {showFileCard ? (
                  <div className="flex h-24 w-full min-w-0 shrink-0 items-center gap-3 rounded-md border border-black/10 bg-[#FAFAFA] px-3 sm:w-56">
                    <span className="text-2xl" aria-hidden>
                      📄
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-[#111111]">{im.alt || (lang === "en" ? "Flyer" : "Volante")}</p>
                      <p className="text-[11px] text-[#5C564E]">{fileTypeLabel(lang, im.attachmentMime)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative h-24 w-40 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                    <Image src={im.url} alt={im.alt || "preview"} fill className="object-cover" sizes="160px" unoptimized />
                  </div>
                )}
                <div className="min-w-0 flex-1 space-y-1">
                  <input
                    type="text"
                    value={im.alt}
                    onChange={(e) => {
                      const v = e.target.value;
                      onChange(images.map((x) => (x.id === im.id ? { ...x, alt: v } : x)));
                    }}
                    className="w-full rounded border border-black/10 px-2 py-1 text-xs"
                    placeholder={altPlaceholder}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setMain(im.id)}
                      className={`text-xs font-semibold ${im.isMain ? "text-emerald-700" : "text-[color:var(--lx-muted)]"}`}
                    >
                      {mainLabel}
                    </button>
                    <button type="button" onClick={() => move(im.id, -1)} disabled={idx === 0} className="text-xs disabled:opacity-40">
                      {upLabel}
                    </button>
                    <button
                      type="button"
                      onClick={() => move(im.id, 1)}
                      disabled={idx === images.length - 1}
                      className="text-xs disabled:opacity-40"
                    >
                      {downLabel}
                    </button>
                    <button type="button" onClick={() => remove(im.id)} className="text-xs font-semibold text-red-700">
                      {removeLabel}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
