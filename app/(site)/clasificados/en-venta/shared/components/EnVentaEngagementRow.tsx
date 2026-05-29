"use client";

import { FiHeart } from "react-icons/fi";
import { LeonixLikeButton } from "@/app/components/clasificados/analytics/LeonixLikeButton";
import { LeonixSaveButton } from "@/app/components/clasificados/analytics/LeonixSaveButton";
import { LeonixShareButton } from "@/app/components/clasificados/analytics/LeonixShareButton";
import { EN_VENTA_TYPO } from "../styles/enVentaTypography";

const PREVIEW_COPY = {
  es: {
    save: "Guardar",
    share: "Compartir",
    report: "Reportar",
    saveHint:
      "Los guardados reales usan tu cuenta: publica el anuncio y guárdalo desde la página del anuncio.",
    reportHint: "Disponible cuando el anuncio esté publicado.",
  },
  en: {
    save: "Save",
    share: "Share",
    report: "Report",
    saveHint:
      "Saved listings use your account: publish the ad and save from the live listing page.",
    reportHint: "Available once the listing is published.",
  },
} as const;

const leonixBtnShell =
  "max-w-none w-auto [&>button]:min-h-[40px] [&>button]:rounded-md [&>button]:border [&>button]:border-[#E8DFD0]/90 [&>button]:bg-white [&>button]:px-3 [&>button]:py-2 [&>button]:text-xs [&>button]:font-semibold [&>button]:text-[#3D3428] [&>button]:shadow-none [&>button]:hover:border-[#C9A84A]/55 [&>button]:hover:bg-[#FFFCF7]";

const leonixSaveShell =
  "max-w-none w-auto [&>button]:min-h-[40px] [&>button]:rounded-md [&>button]:border [&>button]:border-[#E8DFD0]/90 [&>button]:bg-white [&>button]:px-3 [&>button]:py-2 [&>button]:text-xs [&>button]:font-semibold [&>button]:text-[#3D3428] [&>button]:shadow-none [&>button]:ring-0 [&>button]:hover:border-[#C9A84A]/55 [&>button]:hover:bg-[#FFFCF7] [&_[data-leonix-save-active='1']]:!border-[#7A1E2C]/35 [&_[data-leonix-save-active='1']]:!bg-[#FBF0F2] [&_[data-leonix-save-active='1']]:!text-[#7A1E2C]";

const previewBtn =
  "inline-flex min-h-[40px] items-center gap-1.5 rounded-md border border-[#E8DFD0]/90 bg-white px-3 py-2 text-xs font-semibold text-[#3D3428] transition hover:border-[#C9A84A]/55 hover:bg-[#FFFCF7] disabled:cursor-not-allowed disabled:opacity-60";

const reportBtn =
  "inline-flex min-h-[40px] items-center rounded-md border border-[#E8DFD0]/80 bg-white/95 px-3 py-2 text-xs font-semibold text-[#5C5346] transition hover:border-[#C9A84A]/45 hover:bg-[#FFFCF7] disabled:cursor-not-allowed disabled:opacity-60";

type Props = {
  lang: "es" | "en";
  mode: "live" | "preview";
  listingId?: string | null;
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
  listingUrl,
  listingTitle,
  ownerUserId,
  showReport = false,
  showLike = true,
}: Props) {
  const effectiveId = (listingId ?? "").trim();
  const persist = mode === "live" && Boolean(effectiveId);

  if (mode === "preview") {
    return (
      <div className={EN_VENTA_TYPO.engagementWrap}>
        <button type="button" disabled title={PREVIEW_COPY[lang].saveHint} className={previewBtn}>
          <FiHeart className="h-4 w-4 shrink-0 text-[#7A7164]" aria-hidden />
          {PREVIEW_COPY[lang].save}
          <span className="sr-only"> — {PREVIEW_COPY[lang].saveHint}</span>
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
        <button type="button" disabled title={PREVIEW_COPY[lang].reportHint} className={reportBtn}>
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
        listingId={effectiveId}
        ownerUserId={ownerUserId}
        variant="small"
        lang={lang}
        category="en-venta"
        persistEngagement={persist}
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
        <button type="button" onClick={scrollToReportBlock} className={reportBtn}>
          {lang === "es" ? "Reportar" : "Report"}
        </button>
      ) : null}
    </div>
  );
}
