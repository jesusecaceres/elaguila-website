"use client";

import Link from "next/link";
import { useState } from "react";
import type { EnVentaFreeApplicationState } from "@/app/clasificados/publicar/en-venta/free/application/schema/enVentaFreeFormState";
import { clearAllClassifiedsDrafts } from "@/app/clasificados/lib/classifiedsDraftStorage";
import { clearEnVentaPublishTempState } from "@/app/clasificados/en-venta/preview/enVentaPreviewDraft";
import { buildEnVentaPublishSuccessUrls } from "@/app/clasificados/en-venta/shared/constants/enVentaResultsRoutes";
import { buildEnVentaListingDetailHrefFromResults } from "@/app/clasificados/en-venta/results/utils/enVentaListingLinks";
import { validateEnVentaLocation } from "@/app/clasificados/en-venta/shared/utils/validateEnVentaLocation";
import { getEnVentaSupabaseBrowserEnvIssues } from "@/app/lib/supabase/enVentaClientEnvCheck";
import { publishEnVentaFromDraft, type EnVentaGalleryUploadOutcome } from "./enVentaPublishFromDraft";

const COPY = {
  es: {
    publishFree: "Publicar anuncio",
    publishPro: "Publicar anuncio Pro",
    publishing: "Publicando…",
    successTitle: "¡Tu anuncio ya está publicado!",
    successScoped: "Ver en resultados de esta categoría",
    successAll: "Ver todos los anuncios de En Venta",
    successDetail: "Ver mi anuncio publicado",
    successDashboard: "Ir a Mis anuncios",
    errPrefix: "No se pudo publicar:",
    blocked: "Marca las confirmaciones y completa categoría, tipo de artículo y condición para publicar.",
  },
  en: {
    publishFree: "Publish listing",
    publishPro: "Publish Pro listing",
    publishing: "Publishing…",
    successTitle: "Your listing is live!",
    successScoped: "View results in this category",
    successAll: "Browse all For Sale listings",
    successDetail: "View my published listing",
    successDashboard: "Go to My listings",
    errPrefix: "Could not publish:",
    blocked: "Confirm the checkboxes and complete category, item type, and condition to publish.",
  },
} as const;

function canAttemptPublish(state: EnVentaFreeApplicationState): boolean {
  if (!state.confirmListingAccurate || !state.confirmPhotosRepresentItem || !state.confirmCommunityRules) return false;
  const rama = state.rama.trim();
  const itemType = state.itemType.trim();
  const condition = state.condition.trim();
  return Boolean(rama && itemType && condition);
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
  } | null>(null);

  const ready = canAttemptPublish(state);
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
      const res = await publishEnVentaFromDraft(state, lang, plan);
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      clearEnVentaPublishTempState();
      clearAllClassifiedsDrafts();
      setPublishOutcome({ listingId: res.listingId, gallery: res.gallery });
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
      <p className="text-sm text-[#5D4A25]/90">{!ready ? t.blocked : null}</p>
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
        {busy ? t.publishing : plan === "pro" ? t.publishPro : t.publishFree}
      </button>
    </div>
  );
}
