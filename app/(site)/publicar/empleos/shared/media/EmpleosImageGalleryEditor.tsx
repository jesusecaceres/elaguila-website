"use client";

import { useCallback, useRef } from "react";
import Image from "next/image";

import type { EmpleosImageItem } from "./empleosMediaTypes";
import { newImageId } from "./empleosMediaTypes";

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
};

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
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);

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
    const item: EmpleosImageItem = {
      id: newImageId(),
      url: u,
      alt: "",
      isMain: images.length === 0,
    };
    onChange(images.length === 0 ? [item] : [...images.map((i) => ({ ...i, isMain: false })), { ...item, isMain: true }]);
    if (urlRef.current) urlRef.current.value = "";
  }, [images, onChange]);

  const onFiles = useCallback(
    (files: FileList | null) => {
      if (!files?.length) return;
      const readers: Promise<EmpleosImageItem>[] = Array.from(files).map(
        (file) =>
          new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => {
              resolve({
                id: newImageId(),
                url: String(r.result ?? ""),
                alt: file.name,
                isMain: false,
              });
            };
            r.onerror = () => reject(new Error("read"));
            r.readAsDataURL(file);
          })
      );
      void Promise.all(readers).then((items) => {
        const base = images.length === 0 ? items.map((x, i) => ({ ...x, isMain: i === 0 })) : [...images, ...items.map((x) => ({ ...x, isMain: false }))];
        if (images.length > 0 && !base.some((b) => b.isMain)) base[0] = { ...base[0], isMain: true };
        onChange(base);
      });
    },
    [images, onChange]
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
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => void onFiles(e.target.files)} />
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
          {images.map((im, idx) => (
            <li key={im.id} className="flex flex-col gap-2 rounded-lg border border-black/10 bg-white p-3 sm:flex-row sm:items-center">
              <div className="relative h-24 w-40 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                <Image src={im.url} alt={im.alt || "preview"} fill className="object-cover" sizes="160px" unoptimized />
              </div>
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
                  <button type="button" onClick={() => setMain(im.id)} className={`text-xs font-semibold ${im.isMain ? "text-emerald-700" : "text-[color:var(--lx-muted)]"}`}>
                    {mainLabel}
                  </button>
                  <button type="button" onClick={() => move(im.id, -1)} disabled={idx === 0} className="text-xs disabled:opacity-40">
                    {upLabel}
                  </button>
                  <button type="button" onClick={() => move(im.id, 1)} disabled={idx === images.length - 1} className="text-xs disabled:opacity-40">
                    {downLabel}
                  </button>
                  <button type="button" onClick={() => remove(im.id)} className="text-xs font-semibold text-red-700">
                    {removeLabel}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
