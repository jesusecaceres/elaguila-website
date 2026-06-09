"use client";

import Link from "next/link";
import {
  mediaKitHref,
  type MagazineLang,
} from "@/app/(site)/magazine/2026/june/issueContent";
import { getQrGuideCopy } from "@/app/lib/magazine/qrGuideCopy";
import {
  getMagazineVisualAsset,
  MAGAZINE_ISSUE_IDS,
} from "@/app/lib/magazine/languageAssets";

type MagazinePrintPrimaryActionsProps = {
  lang: MagazineLang;
  onOpenFlipbook: () => void;
};

export function MagazinePrintPrimaryActions({
  lang,
  onOpenFlipbook,
}: MagazinePrintPrimaryActionsProps) {
  const copy = getQrGuideCopy(lang);
  const visual = getMagazineVisualAsset(MAGAZINE_ISSUE_IDS.june2026, lang);
  const mediaKit = mediaKitHref(lang);
  const contactHref = `/contacto?inquiryType=advertising&sourceCta=magazine-qr&lang=${lang}`;

  const btnPrimary =
    "inline-flex min-h-[3rem] w-full min-w-0 items-center justify-center rounded-full bg-[#7A1E2C] px-5 py-3 text-center text-sm font-bold text-[#FFFDF7] transition hover:bg-[#5e1721] sm:min-h-[3.125rem] sm:text-[0.9375rem]";
  const btnOutline =
    "inline-flex min-h-[3rem] w-full min-w-0 items-center justify-center rounded-full border-2 border-[#7A1E2C]/80 bg-[#FFFDF7] px-5 py-3 text-center text-sm font-bold text-[#7A1E2C] transition hover:bg-[#FBF7EF] sm:min-h-[3.125rem] sm:text-[0.9375rem]";
  const btnGold =
    "inline-flex min-h-[3rem] w-full min-w-0 items-center justify-center rounded-full border-2 border-[#C9A84A] bg-[#FFFDF7] px-5 py-3 text-center text-sm font-bold text-[#1F241C] transition hover:border-[#b89742] hover:bg-[#FBF7EF] sm:min-h-[3.125rem] sm:text-[0.9375rem]";

  return (
    <section
      className="mt-4 rounded-2xl border border-[#D6C7AD] bg-[#FFFDF7] p-4 sm:p-6"
      aria-labelledby="print-primary-actions-title"
    >
      <p
        id="print-primary-actions-title"
        className="text-xs font-bold uppercase tracking-[0.14em] text-[#556B3E]"
      >
        {copy.actionsEyebrow}
      </p>
      <div className="mt-4 flex min-w-0 flex-col gap-2.5 sm:flex-row sm:flex-wrap">
        <button type="button" onClick={onOpenFlipbook} className={btnPrimary}>
          {copy.actions.openDigital}
        </button>
        <a href={visual.pdfUrl} download className={btnOutline}>
          {copy.actions.downloadPdf}
        </a>
        <a href={mediaKit} target="_blank" rel="noopener noreferrer" className={btnGold}>
          {copy.actions.mediaKit}
        </a>
        <Link href={contactHref} className={btnOutline}>
          {copy.actions.contact}
        </Link>
      </div>
    </section>
  );
}
