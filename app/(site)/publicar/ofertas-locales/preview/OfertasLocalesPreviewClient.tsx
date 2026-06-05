"use client";

import Link from "next/link";
import { hasOfertaLocalDraftContent } from "@/app/lib/ofertas-locales/ofertasLocalesPreviewHelpers";
import { useOfertasLocalesDraft } from "@/app/lib/ofertas-locales/useOfertasLocalesDraft";
import { useOfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";
import { OfertasLocalesPreviewCard } from "./OfertasLocalesPreviewCard";
import { OFERTAS_LOCALES_PREVIEW_COPY } from "./ofertasLocalesPreviewCopy";

const PAGE_BG = "bg-[#FFFCF7]";
const BTN_PRIMARY =
  "inline-flex items-center justify-center rounded-xl bg-[#7A1E2C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6a1926]";

export default function OfertasLocalesPreviewClient() {
  const { draft, hasLoadedDraft } = useOfertasLocalesDraft();
  const lang = useOfertasLocalesAppLang();

  if (!hasLoadedDraft) {
    return (
      <div className={`min-h-screen ${PAGE_BG}`}>
        <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-[#1E1814]/60">
          {lang === "en" ? "Loading preview…" : "Cargando vista previa…"}
        </div>
      </div>
    );
  }

  if (!hasOfertaLocalDraftContent(draft)) {
    return (
      <div className={`min-h-screen ${PAGE_BG}`}>
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#7A1E2C]">
            {lang === "en" ? OFERTAS_LOCALES_PREVIEW_COPY.previewNoticeEn : OFERTAS_LOCALES_PREVIEW_COPY.previewNoticeEs}
          </p>
          <h1 className="mt-4 text-xl font-bold text-[#1E1814]">{OFERTAS_LOCALES_PREVIEW_COPY.emptyTitle}</h1>
          <p className="mt-2 text-sm text-[#1E1814]/70">{OFERTAS_LOCALES_PREVIEW_COPY.emptyBody}</p>
          <Link href={`/publicar/ofertas-locales?lang=${lang}`} className={`${BTN_PRIMARY} mt-6`}>
            {OFERTAS_LOCALES_PREVIEW_COPY.backToEditCreate}
          </Link>
        </div>
      </div>
    );
  }

  return <OfertasLocalesPreviewCard draft={draft} lang={lang} />;
}
