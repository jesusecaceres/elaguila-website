"use client";

import Link from "next/link";
import {
  getMagazineUi,
  comingSoonHref,
  mediaKitHref,
  showDualMediaKitPdfButtons,
  MAGAZINE_KIT_PDF_EN,
  MAGAZINE_KIT_PDF_ES,
  type MagazineLang,
} from "@/app/(site)/magazine/2026/june/issueContent";
import {
  getMagazineVisualAsset,
  MAGAZINE_ISSUE_IDS,
} from "@/app/lib/magazine/languageAssets";

type MagazineReaderActionBarProps = {
  lang: MagazineLang;
  onOpenFlipbook: () => void;
  layout?: "stack" | "grid";
};

export function MagazineReaderActionBar({
  lang,
  onOpenFlipbook,
  layout = "grid",
}: MagazineReaderActionBarProps) {
  const ui = getMagazineUi(lang);
  const visual = getMagazineVisualAsset(MAGAZINE_ISSUE_IDS.june2026, lang);
  const wrapClass =
    layout === "stack"
      ? "flex min-w-0 flex-col gap-3"
      : "flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap";

  const btnPrimary =
    "inline-flex min-h-[2.875rem] w-full min-w-0 items-center justify-center rounded-full bg-[#7A1E2C] px-5 py-2.5 text-sm font-bold text-[#FFFDF7] transition hover:bg-[#5e1721] sm:w-auto sm:px-7";
  const btnOutline =
    "inline-flex min-h-[2.875rem] w-full min-w-0 items-center justify-center rounded-full border-2 border-[#7A1E2C]/80 bg-[#FFFDF7] px-5 py-2.5 text-sm font-bold text-[#7A1E2C] transition hover:bg-[#FBF7EF] sm:w-auto sm:px-7";
  const btnGold =
    "inline-flex min-h-[2.875rem] w-full min-w-0 items-center justify-center rounded-full border-2 border-[#C9A84A] bg-[#FFFDF7] px-5 py-2.5 text-sm font-bold text-[#1F241C] transition hover:border-[#b89742] hover:bg-[#FBF7EF] sm:w-auto sm:px-7";

  const dualMediaKit = showDualMediaKitPdfButtons(lang);

  return (
    <div className={wrapClass}>
      <button type="button" onClick={onOpenFlipbook} className={btnPrimary}>
        {ui.viewFlipbookSpanish}
      </button>
      <a href={visual.pdfUrl} download className={btnOutline}>
        {ui.downloadPdf}
      </a>
      {dualMediaKit ? (
        <>
          <a
            href={MAGAZINE_KIT_PDF_ES}
            className={btnGold}
            target="_blank"
            rel="noopener noreferrer"
          >
            {ui.mediaKitPdfEsLabel}
          </a>
          <a
            href={MAGAZINE_KIT_PDF_EN}
            className={btnGold}
            target="_blank"
            rel="noopener noreferrer"
          >
            {ui.mediaKitPdfEnLabel}
          </a>
        </>
      ) : (
        <Link
          href={mediaKitHref(lang)}
          className={btnGold}
          target="_blank"
          rel="noopener noreferrer"
        >
          {ui.viewMediaKit}
        </Link>
      )}
    </div>
  );
}

type MagazineReaderFooterNavProps = {
  lang: MagazineLang;
  showReaderLink?: boolean;
};

export function MagazineReaderFooterNav({ lang, showReaderLink = true }: MagazineReaderFooterNavProps) {
  const ui = getMagazineUi(lang);

  return (
    <nav
      className="mt-8 flex min-w-0 flex-col gap-3 border-t border-[#D6C7AD]/70 pt-6 sm:flex-row sm:flex-wrap sm:gap-4"
      aria-label={ui.backToMagazine}
    >
      <Link
        href={`/magazine?lang=${lang}`}
        className="text-sm font-semibold text-[#7A1E2C] hover:underline"
      >
        ← {ui.backToMagazine}
      </Link>
      <Link
        href={comingSoonHref(lang)}
        className="text-sm font-semibold text-[#556B3E] hover:underline"
      >
        {ui.backToComingSoon}
      </Link>
      {showReaderLink ? (
        <Link
          href={`/magazine/2026/june/read?lang=${lang}`}
          className="text-sm font-semibold text-[#556B3E] hover:underline"
        >
          {ui.openFullReader}
        </Link>
      ) : null}
    </nav>
  );
}
