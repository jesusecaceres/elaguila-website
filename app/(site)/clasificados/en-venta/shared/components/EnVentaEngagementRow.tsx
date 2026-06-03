"use client";

import { FiHeart } from "react-icons/fi";
import { LeonixLikeButton } from "@/app/components/clasificados/analytics/LeonixLikeButton";
import { LeonixSaveButton } from "@/app/components/clasificados/analytics/LeonixSaveButton";
import { LeonixShareButton } from "@/app/components/clasificados/analytics/LeonixShareButton";
import { EN_VENTA_TYPO } from "../styles/enVentaTypography";
import { EN_VENTA_SURFACE } from "../styles/enVentaBrand";

const PREVIEW_COPY = {
  es: {
    save: "Guardar",
    share: "Compartir",
    report: "Reportar",
    unpublishedHint: "Disponible cuando el anuncio esté publicado.",
  },
  en: {
    save: "Save",
    share: "Share",
    report: "Report",
    unpublishedHint: "Available when the listing is published.",
  },
} as const;

const leonixBtnShell =
  "max-w-none w-auto [&>button]:min-h-[40px] [&>button]:rounded-lg [&>button]:border [&>button]:border-[#C9A84A]/55 [&>button]:bg-[#FFFDF7] [&>button]:px-3 [&>button]:py-2 [&>button]:text-xs [&>button]:font-semibold [&>button]:text-[#3D3428] [&>button]:shadow-none [&>button]:hover:border-[#C9A84A] [&>button]:hover:bg-[#FBF7EF]";

const leonixSaveShell =
  "max-w-none w-auto [&>button]:min-h-[40px] [&>button]:rounded-lg [&>button]:border [&>button]:border-[#C9A84A]/55 [&>button]:bg-[#FFFDF7] [&>button]:px-3 [&>button]:py-2 [&>button]:text-xs [&>button]:font-semibold [&>button]:text-[#3D3428] [&>button]:shadow-none [&>button]:ring-0 [&>button]:hover:border-[#C9A84A] [&>button]:hover:bg-[#FBF7EF] [&_[data-leonix-save-active='1']]:!border-[#7A1E2C]/35 [&_[data-leonix-save-active='1']]:!bg-[#FBF0F2] [&_[data-leonix-save-active='1']]:!text-[#7A1E2C]";

const previewBtn = `inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${EN_VENTA_SURFACE.secondaryBtn}`;

const reportBtnClass = `inline-flex min-h-[40px] items-center rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${EN_VENTA_SURFACE.reportBtn}`;

type Props = {
  lang: "es" | "en";
  mode: "live" | "preview";
  /** Like/share/analytics key (may be Leonix ad id when available). */
  listingId?: string | null;
  /** UUID for `saved_listings.listing_id` — must not be the human Leonix id. */
  saveListingId?: string | null;
  listingUrl?: string;
  listingTitle?: string;
  ownerUserId?: string | null;
  /** When true, report scrolls to `#enventa-listing-report` on the detail page. */
  showReport?: boolean;
  /** Include like (heart) alongside save on live listings — matches Servicios pattern. */
  showLike?: boolean;
};

function scrollToReportBlock() {
  document.getElementById("enventa-listing-report")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function EnVentaEngagementRow({
  lang,
  mode,
  listingId,
  saveListingId,
  listingUrl,
  listingTitle,
  ownerUserId,
  showReport = false,
  showLike = true,
}: Props) {
  const effectiveId = (listingId ?? "").trim();
  const saveKey = (saveListingId ?? listingId ?? "").trim();
  const persist = mode === "live" && Boolean(effectiveId);
  const persistSave = mode === "live" && Boolean(saveKey);

  if (mode === "preview") {
    return (
      <div className={EN_VENTA_TYPO.engagementWrap}>
        <button type="button" disabled title={PREVIEW_COPY[lang].unpublishedHint} className={previewBtn}>
          <FiHeart className="h-4 w-4 shrink-0 text-[#7A1E2C]/70" aria-hidden />
          {PREVIEW_COPY[lang].save}
          <span className="sr-only"> — {PREVIEW_COPY[lang].unpublishedHint}</span>
        </button>
        <LeonixShareButton
          listingId={null}
          listingUrl={listingUrl}
          listingTitle={listingTitle}
          lang={lang}
          variant="small"
          persistEngagement={false}
          category="en-venta"
          className={leonixBtnShell}
        />
        <button type="button" disabled title={PREVIEW_COPY[lang].unpublishedHint} className={reportBtnClass}>
          {PREVIEW_COPY[lang].report}
        </button>
      </div>
    );
  }

  return (
    <div className={EN_VENTA_TYPO.engagementWrap}>
      {showLike ? (
        <LeonixLikeButton
          listingId={effectiveId}
          ownerUserId={ownerUserId}
          variant="small"
          lang={lang}
          category="en-venta"
          persistEngagement={persist}
          className={leonixBtnShell}
        />
      ) : null}
      <LeonixSaveButton
        listingId={saveKey}
        ownerUserId={ownerUserId}
        variant="small"
        lang={lang}
        category="en-venta"
        persistEngagement={persistSave}
        iconStyle="heart"
        className={leonixSaveShell}
      />
      <LeonixShareButton
        listingId={effectiveId}
        listingUrl={listingUrl}
        listingTitle={listingTitle}
        lang={lang}
        variant="small"
        category="en-venta"
        ownerUserId={ownerUserId}
        persistEngagement={persist}
        className={leonixBtnShell}
      />
      {showReport ? (
        <button type="button" onClick={scrollToReportBlock} className={reportBtnClass}>
          {lang === "es" ? "Reportar" : "Report"}
        </button>
      ) : null}
    </div>
  );
}
