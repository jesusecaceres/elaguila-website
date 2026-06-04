"use client";

import { useEffect, useRef, useState } from "react";
import { FiUpload } from "react-icons/fi";
import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { readFileAsDataUrl } from "@/app/publicar/autos/negocios/lib/readFileAsDataUrl";
import { safeExternalHref } from "@/app/clasificados/autos/negocios/lib/dealerDraftSanitize";
import { AUTOS_DRAFT_FINANCE_IMAGE_REF } from "@/app/clasificados/autos/negocios/lib/autosNegociosDraftIdbRefs";

const LABEL = "block text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]";
const INPUT =
  "mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3 py-2 text-sm text-[color:var(--lx-text)] outline-none ring-[color:var(--lx-focus-ring)] focus:ring-2";
const BTN_PRIMARY =
  "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[14px] bg-[color:var(--lx-cta-dark)] px-5 text-sm font-bold text-[#FFFCF7] shadow-md transition hover:bg-[color:var(--lx-cta-dark-hover)] active:opacity-90";
const BTN_SECONDARY =
  "inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-4 py-2 text-xs font-bold text-[color:var(--lx-text)] hover:bg-[color:var(--lx-nav-hover)] active:opacity-90";

export type AutosDealerFinanceImageCopy = {
  imageUrl: string;
  imageHelper: string;
  imageUrlLabel: string;
  useImageUrl: string;
  imageConfirmed: string;
  imageUpload: string;
  imageUploadHint: string;
  imagePreviewTitle: string;
  imagePreviewFile: string;
  imagePreviewUrl: string;
  removeImage: string;
  httpsPlaceholder: string;
};

export function AutosDealerFinanceImageUpload({
  listing,
  setListingPatch,
  copy,
}: {
  listing: AutoDealerListing;
  setListingPatch: (patch: Partial<AutoDealerListing>) => void;
  copy: AutosDealerFinanceImageCopy;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urlDraft, setUrlDraft] = useState("");
  const raw = listing.financeContactImageUrl?.trim();
  const previewSrc =
    raw && raw !== AUTOS_DRAFT_FINANCE_IMAGE_REF
      ? raw.startsWith("data:image/")
        ? raw
        : safeExternalHref(raw)
      : undefined;

  useEffect(() => {
    if (!raw || raw === AUTOS_DRAFT_FINANCE_IMAGE_REF) {
      setUrlDraft("");
      return;
    }
    if (!raw.startsWith("data:")) setUrlDraft(raw);
  }, [raw]);

  async function onImageFile(files: FileList | null) {
    const f = files?.[0];
    if (!f || !f.type.startsWith("image/")) return;
    const dataUrl = await readFileAsDataUrl(f);
    setListingPatch({
      financeContactImageUrl: dataUrl,
      financeContactImageSource: "local",
      financeContactImageFileName: f.name,
    });
    setUrlDraft("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function applyImageUrl() {
    const t = urlDraft.trim();
    if (!t) return;
    const href = safeExternalHref(t);
    if (!href) return;
    setListingPatch({
      financeContactImageUrl: href,
      financeContactImageSource: "url",
      financeContactImageFileName: undefined,
    });
  }

  function removeImage() {
    setUrlDraft("");
    setListingPatch({
      financeContactImageUrl: undefined,
      financeContactImageSource: undefined,
      financeContactImageFileName: undefined,
    });
  }

  const isUrlConfirmed = Boolean(raw && raw !== AUTOS_DRAFT_FINANCE_IMAGE_REF && !raw.startsWith("data:"));

  return (
    <div className="sm:col-span-2 rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] p-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          void onImageFile(e.target.files);
          e.target.value = "";
        }}
      />
      <h3 className="text-sm font-bold text-[color:var(--lx-text)]">{copy.imageUrl}</h3>
      <p className="mt-1 text-xs leading-relaxed text-[color:var(--lx-muted)]">{copy.imageHelper}</p>
      <div className="mt-3 rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] p-3">
        <label className={LABEL}>{copy.imageUrlLabel}</label>
        <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-end">
          <input
            className={`${INPUT} sm:min-w-0 sm:flex-1`}
            placeholder={copy.httpsPlaceholder}
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
          />
          <button type="button" className={BTN_SECONDARY} onClick={applyImageUrl}>
            {copy.useImageUrl}
          </button>
        </div>
        {isUrlConfirmed ? (
          <p className="mt-2 inline-flex items-center gap-1 rounded-full border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-nav-hover)] px-2.5 py-1 text-[11px] font-bold text-[color:var(--lx-text)]">
            {copy.imageConfirmed}
          </p>
        ) : null}
      </div>
      <div className="mt-3">
        <button type="button" className={BTN_PRIMARY} onClick={() => fileInputRef.current?.click()}>
          <FiUpload className="h-4 w-4" aria-hidden />
          {copy.imageUpload}
        </button>
        <p className="mt-1 text-xs text-[color:var(--lx-muted)]">{copy.imageUploadHint}</p>
      </div>
      {previewSrc ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] p-3">
          <img src={previewSrc} alt="" className="h-16 w-16 rounded-lg border border-[color:var(--lx-nav-border)] object-cover" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-[color:var(--lx-text)]">{copy.imagePreviewTitle}</p>
            <p className="text-[11px] text-[color:var(--lx-muted)]">
              {previewSrc.startsWith("data:") ? copy.imagePreviewFile : copy.imagePreviewUrl}
              {listing.financeContactImageFileName ? ` · ${listing.financeContactImageFileName}` : ""}
            </p>
          </div>
          <button type="button" className="text-xs font-bold text-red-800 underline" onClick={removeImage}>
            {copy.removeImage}
          </button>
        </div>
      ) : null}
    </div>
  );
}
