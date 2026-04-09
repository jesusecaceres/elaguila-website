"use client";

import Image from "next/image";
import { useCallback, useRef } from "react";

type Props = {
  url: string;
  alt: string;
  onChange: (next: { url: string; alt: string }) => void;
  urlPlaceholder: string;
  addUrlLabel: string;
  uploadLabel: string;
  removeLabel: string;
  altLabel: string;
  showAlt?: boolean;
};

export function EmpleosSingleImageField({
  url,
  alt,
  onChange,
  urlPlaceholder,
  addUrlLabel,
  uploadLabel,
  removeLabel,
  altLabel,
  showAlt = true,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);

  const addFromUrl = useCallback(() => {
    const u = urlRef.current?.value?.trim();
    if (!u) return;
    onChange({ url: u, alt: alt || "" });
    if (urlRef.current) urlRef.current.value = "";
  }, [alt, onChange]);

  const onFile = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;
      const r = new FileReader();
      r.onload = () => {
        onChange({ url: String(r.result ?? ""), alt: file.name });
      };
      r.readAsDataURL(file);
    },
    [onChange]
  );

  return (
    <div className="space-y-3">
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
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => void onFile(e.target.files)} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="min-h-11 rounded-lg border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-4 text-xs font-bold"
        >
          {uploadLabel}
        </button>
      </div>
      {url.trim() ? (
        <div className="flex flex-col gap-2 rounded-lg border border-black/10 bg-white p-3 sm:flex-row sm:items-start">
          <div className="relative h-40 w-full max-w-sm shrink-0 overflow-hidden rounded-md bg-neutral-100 sm:h-32 sm:w-48">
            <Image src={url} alt={alt || "preview"} fill className="object-contain" sizes="320px" unoptimized />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            {showAlt ? (
              <label className="block text-xs font-semibold text-[color:var(--lx-text)]">
                {altLabel}
                <input
                  value={alt}
                  onChange={(e) => onChange({ url, alt: e.target.value })}
                  className="mt-1 w-full rounded border border-black/10 px-2 py-1 text-sm"
                />
              </label>
            ) : null}
            <button type="button" onClick={() => onChange({ url: "", alt: "" })} className="text-xs font-semibold text-red-700">
              {removeLabel}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
