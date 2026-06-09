"use client";

import { useEffect, useRef, useState } from "react";
import { FiUpload } from "react-icons/fi";
import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { readFileAsDataUrl } from "@/app/publicar/autos/negocios/lib/readFileAsDataUrl";
import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import { AutosLocalFileTemporaryDraftNote } from "@/app/publicar/autos/shared/components/AutosLocalFileTemporaryDraftNote";

const LABEL = "block text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]";
const INPUT =
  "mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3 py-2 text-sm text-[color:var(--lx-text)] outline-none ring-[color:var(--lx-focus-ring)] focus:ring-2";
const BTN_PRIMARY =
  "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[14px] bg-[color:var(--lx-cta-dark)] px-5 text-sm font-bold text-[#FFFCF7] shadow-md transition hover:bg-[color:var(--lx-cta-dark-hover)] active:opacity-90";
const BTN_SECONDARY =
  "inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-4 py-2 text-xs font-bold text-[color:var(--lx-text)] hover:bg-[color:var(--lx-nav-hover)] active:opacity-90";

export type AutosDealerLogoCopy = {
  heading: string;
  intro: string;
  urlLabel: string;
  urlHint: string;
  useLogoUrl: string;
  logoUrlSaved: string;
  uploadLogo: string;
  uploadLogoHint: string;
  logoPreviewTitle: string;
  logoPreviewFile: string;
  logoPreviewUrl: string;
  removeLogo: string;
  httpsPlaceholder: string;
};

export function AutosDealerLogoUpload({
  listing,
  setListingPatch,
  copy,
  lang,
}: {
  listing: AutoDealerListing;
  setListingPatch: (patch: Partial<AutoDealerListing>) => void;
  copy: AutosDealerLogoCopy;
  lang?: AutosNegociosLang;
}) {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoUrlDraft, setLogoUrlDraft] = useState("");
  const logo = listing.dealerLogo?.trim();

  useEffect(() => {
    if (!logo) {
      setLogoUrlDraft("");
      return;
    }
    if (!logo.startsWith("data:")) setLogoUrlDraft(logo);
  }, [logo]);

  async function onLogoFile(files: FileList | null) {
    const f = files?.[0];
    if (!f || !f.type.startsWith("image/")) return;
    const dataUrl = await readFileAsDataUrl(f);
    setListingPatch({ dealerLogo: dataUrl });
    setLogoUrlDraft("");
    if (logoInputRef.current) logoInputRef.current.value = "";
  }

  function applyLogoUrl() {
    const t = logoUrlDraft.trim();
    if (!t) return;
    setListingPatch({ dealerLogo: t });
  }

  return (
    <div className="sm:col-span-2 rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] p-4">
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          void onLogoFile(e.target.files);
          e.target.value = "";
        }}
      />
      <h3 className="text-sm font-bold text-[color:var(--lx-text)]">{copy.heading}</h3>
      <p className="mt-1 text-xs leading-relaxed text-[color:var(--lx-muted)]">{copy.intro}</p>
      {lang ? <AutosLocalFileTemporaryDraftNote lang={lang} /> : null}
      <div className="mt-3 rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] p-3">
        <label className={LABEL}>{copy.urlLabel}</label>
        <p className="mt-0.5 text-[11px] text-[color:var(--lx-muted)]">{copy.urlHint}</p>
        <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-end">
          <input
            className={`${INPUT} sm:min-w-0 sm:flex-1`}
            placeholder={copy.httpsPlaceholder}
            value={logoUrlDraft}
            onChange={(e) => setLogoUrlDraft(e.target.value)}
          />
          <button type="button" className={BTN_SECONDARY} onClick={applyLogoUrl}>
            {copy.useLogoUrl}
          </button>
        </div>
        {logo && !logo.startsWith("data:") ? (
          <p className="mt-2 inline-flex items-center gap-1 rounded-full border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-nav-hover)] px-2.5 py-1 text-[11px] font-bold text-[color:var(--lx-text)]">
            {copy.logoUrlSaved}
          </p>
        ) : null}
      </div>
      <div className="mt-3">
        <button type="button" className={BTN_PRIMARY} onClick={() => logoInputRef.current?.click()}>
          <FiUpload className="h-4 w-4" aria-hidden />
          {copy.uploadLogo}
        </button>
        <p className="mt-1 text-xs text-[color:var(--lx-muted)]">{copy.uploadLogoHint}</p>
      </div>
      {logo ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] p-3">
          <img src={logo} alt="" className="h-16 w-16 rounded-lg border border-[color:var(--lx-nav-border)] object-cover" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-[color:var(--lx-text)]">{copy.logoPreviewTitle}</p>
            <p className="text-[11px] text-[color:var(--lx-muted)]">
              {logo.startsWith("data:") ? copy.logoPreviewFile : copy.logoPreviewUrl}
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
            {copy.removeLogo}
          </button>
        </div>
      ) : null}
    </div>
  );
}
