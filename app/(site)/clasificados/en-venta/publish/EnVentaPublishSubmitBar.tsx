"use client";

import Link from "next/link";
import { useState } from "react";
import type { EnVentaFreeApplicationState } from "@/app/clasificados/publicar/en-venta/free/application/schema/enVentaFreeFormState";
import { clearAllClassifiedsDrafts } from "@/app/clasificados/lib/classifiedsDraftStorage";
import {
  clearEnVentaPublishTempState,
  saveEnVentaPreviewDraft,
  saveEnVentaPreviewReturnDraft,
} from "@/app/clasificados/en-venta/preview/enVentaPreviewDraft";
import { buildEnVentaPublishSuccessUrls } from "@/app/clasificados/en-venta/shared/constants/enVentaResultsRoutes";
import { buildEnVentaListingDetailHrefFromResults } from "@/app/clasificados/en-venta/results/utils/enVentaListingLinks";
import { validateEnVentaLocation } from "@/app/clasificados/en-venta/shared/utils/validateEnVentaLocation";
import { getEnVentaSupabaseBrowserEnvIssues } from "@/app/lib/supabase/enVentaClientEnvCheck";
import { evaluateEnVentaFamilySafetyFromState } from "@/app/clasificados/en-venta/moderation/enVentaFamilySafety";
import { enVentaPublicLabel } from "../shared/constants/enVentaPublicLabels";
import { publishEnVentaFromDraft, type EnVentaGalleryUploadOutcome } from "./enVentaPublishFromDraft";

const COPY = {
  es: {
    publish: "Publicar anuncio",
    publishing: "Publicando…",
    successTitle: "¡Tu anuncio ya está publicado!",
    successScoped: "Ver en resultados de esta categoría",
    successAll: `Ver todos los anuncios de ${enVentaPublicLabel("es")}`,
    successDetail: "Ver mi anuncio publicado",
    successDashboard: "Ir a Mis anuncios",
    errPrefix: "No se pudo publicar:",
    blockedIntro: "Para habilitar Publicar, completa lo siguiente:",
    blockerTitle: "Agrega un título para tu artículo.",
    blockerTaxonomy: "Completa categoría, tipo de artículo y condición.",
    blockerPrice: "Agrega un precio o marca Gratis.",
    blockerRules: "Confirma las reglas antes de publicar.",
  },
  en: {
    publish: "Publish listing",
    publishing: "Publishing…",
    successTitle: "Your listing is live!",
    successScoped: "View results in this category",
    successAll: `Browse all ${enVentaPublicLabel("en")} listings`,
    successDetail: "View my published listing",
    successDashboard: "Go to My listings",
    errPrefix: "Could not publish:",
    blockedIntro: "To enable Publish, complete the following:",
    blockerTitle: "Add a title for your item.",
    blockerTaxonomy: "Complete department, item type, and condition.",
    blockerPrice: "Add a price or mark it as Free.",
    blockerRules: "Confirm the rules before publishing.",
  },
} as const;

/** Mirrors `publishEnVentaFromDraft` gates (title, taxonomy, price/gratis, location, confirmations). */
function collectPublishBlockers(lang: "es" | "en", state: EnVentaFreeApplicationState): string[] {
  const t = COPY[lang];
  const reasons: string[] = [];

  if (!state.title.trim()) reasons.push(t.blockerTitle);

  const rama = state.rama.trim();
  const itemType = state.itemType.trim();
  const condition = state.condition.trim();
  if (!rama || !itemType || !condition) reasons.push(t.blockerTaxonomy);

  if (!state.priceIsFree && !String(state.price).trim()) reasons.push(t.blockerPrice);

  const loc = validateEnVentaLocation(state.city, state.zip);
  if (!loc.ok) reasons.push(lang === "es" ? loc.messageEs : loc.messageEn);

  if (!state.confirmListingAccurate || !state.confirmPhotosRepresentItem || !state.confirmCommunityRules) {
    reasons.push(t.blockerRules);
  }

  const safety = evaluateEnVentaFamilySafetyFromState(state, lang);
  if (safety.status !== "safe") {
    reasons.push(safety.userMessage);
  }

  return reasons;
}

type Props = {
  lang: "es" | "en";
  plan: "free" | "pro";
  state: EnVentaFreeApplicationState;
};

export function EnVentaPublishSubmitBar({ lang, plan, state }: Props) {
  const t = COPY[lang];
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [publishOutcome, setPublishOutcome] = useState<{
    listingId: string;
    gallery: EnVentaGalleryUploadOutcome;
    leonixAdId: string | null;
  } | null>(null);

  const blockers = collectPublishBlockers(lang, state);
  const ready = blockers.length === 0;
  const { generalUrl, scopedUrl } = buildEnVentaPublishSuccessUrls(lang, state);

  const onPublish = async () => {
    if (!ready || busy) return;
    setErr(null);
    const envIssues = getEnVentaSupabaseBrowserEnvIssues();
    if (envIssues.length) {
      setErr(
        lang === "es"
          ? `Falta configuración del cliente: ${envIssues.join(" · ")}`
          : `Client configuration missing: ${envIssues.join(" · ")}`
      );
      return;
    }
    setBusy(true);
    try {
      saveEnVentaPreviewDraft(plan, state, lang);
      saveEnVentaPreviewReturnDraft(plan, state);
      const res = await publishEnVentaFromDraft(state, lang, plan);
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      clearEnVentaPublishTempState();
      clearAllClassifiedsDrafts();
      setPublishOutcome({ listingId: res.listingId, gallery: res.gallery, leonixAdId: res.leonixAdId });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  if (publishOutcome) {
    const browseQs = new URLSearchParams();
    browseQs.set("lang", lang);
    const rama = state.rama.trim();
    if (rama) browseQs.set("evDept", rama);
    const sub = state.evSub.trim();
    if (sub) browseQs.set("evSub", sub);
    const loc = validateEnVentaLocation(state.city, state.zip);
    if (loc.ok) {
      if (loc.canonicalCity) browseQs.set("city", loc.canonicalCity);
      if (loc.zipNormalized) browseQs.set("zip", loc.zipNormalized);
    }

    const detailHref = buildEnVentaListingDetailHrefFromResults(publishOutcome.listingId, lang, browseQs);
    const dashboardHref = `/dashboard/mis-anuncios?lang=${lang}`;
    return (
      <div
        className="rounded-2xl border border-[#C9B46A]/45 bg-[#FFFCF7] p-5 shadow-sm ring-1 ring-[#C9B46A]/18"
        data-testid="ev-publish-success"
      >
        <p className="text-base font-bold text-[#3D2C12]">{t.successTitle}</p>
        {publishOutcome.leonixAdId ? (
          <p className="mt-2 rounded-lg border border-[#C9B46A]/30 bg-[#FBF7EF] px-3 py-2 font-mono text-[12px] text-[#3D2C12]/85">
            <span className="font-sans text-[10px] font-bold uppercase tracking-wide text-[#3D2C12]/50">Leonix Ad ID</span>
            <span className="ml-2 select-all font-semibold">{publishOutcome.leonixAdId}</span>
          </p>
        ) : null}
        <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
          <Link
            data-testid="ev-publish-success-detail"
            href={detailHref}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-[#2F4A65]/35 bg-gradient-to-br from-[#F5F8FB] to-[#E8EEF3] px-4 py-2.5 text-sm font-semibold text-[#2F4A65] transition hover:brightness-[1.02]"
          >
            {t.successDetail}
          </Link>
          <Link
            data-testid="ev-publish-success-dashboard"
            href={dashboardHref}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-[#B28A2F]/50 bg-[#B28A2F]/15 px-4 py-2.5 text-sm font-semibold text-[#3D2C12] transition hover:bg-[#B28A2F]/25"
          >
            {t.successDashboard}
          </Link>
          <Link
            data-testid="ev-publish-success-scoped-results"
            href={scopedUrl}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-[#B28A2F]/50 bg-[#B28A2F]/15 px-4 py-2.5 text-sm font-semibold text-[#3D2C12] transition hover:bg-[#B28A2F]/25"
          >
            {t.successScoped}
          </Link>
          <Link
            data-testid="ev-publish-success-all-results"
            href={generalUrl}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-[#D8C79A]/70 bg-[#FFFCF4] px-4 py-2.5 text-sm font-semibold text-[#3D2C12] transition hover:bg-[#FFF6E7]"
          >
            {t.successAll}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#D8C79A]/70 bg-[#FFF7E7] p-5 shadow-sm">
      {!ready ? (
        <div className="text-sm text-[#5D4A25]/95">
          <p className="font-semibold text-[#3D2C12]/95">{t.blockedIntro}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 leading-snug">
            {blockers.map((line, i) => (
              <li key={`${i}-${line}`}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {err ? (
        <p className="mt-2 text-sm font-medium text-red-800" role="alert" data-testid="ev-publish-error">
          {t.errPrefix} {err}
        </p>
      ) : null}
      <button
        type="button"
        disabled={!ready || busy}
        onClick={() => void onPublish()}
        className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A] px-6 text-sm font-bold text-[#1E1810] shadow-md transition hover:brightness-[1.03] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? t.publishing : t.publish}
      </button>
    </div>
  );
}
