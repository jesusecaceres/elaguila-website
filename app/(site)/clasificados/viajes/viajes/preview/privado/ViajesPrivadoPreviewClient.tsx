"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import Navbar from "@/app/components/Navbar";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { resolveClasificadosPublishLang } from "@/app/lib/clasificados/clasificadosPublishLang";
import { ViajesLangSwitch } from "@/app/(site)/clasificados/viajes/components/ViajesLangSwitch";
import { ViajesOfferDetailLayout } from "@/app/(site)/clasificados/viajes/components/ViajesOfferDetailLayout";
import { getViajesUi } from "@/app/(site)/clasificados/viajes/data/viajesUiCopy";
import { useViajesLocalHeroObjectUrl } from "@/app/(site)/clasificados/viajes/lib/useViajesLocalHeroObjectUrl";
import { normalizeViajesOfferToV2 } from "@/app/(site)/clasificados/viajes/lib/v2/normalizeViajesOfferToV2";
import { mapViajesOfferV2ToDetailModel } from "@/app/(site)/clasificados/viajes/lib/v2/mapViajesOfferV2ToDetailModel";
import { getViajesHeroAsset } from "@/app/(site)/clasificados/viajes/lib/v2/viajesOfferV2Validation";
import { createSupabaseBrowserClient, withAuthTimeout, AUTH_CHECK_TIMEOUT_MS } from "@/app/lib/supabase/browser";
import { useViajesPrivadoDraftV2 } from "@/app/(site)/publicar/viajes/privado/lib/useViajesPrivadoDraftV2";
import { viajesPreviewReturnToEditHref } from "@/app/(site)/clasificados/viajes/lib/viajesOwnerDashboardLinks";

export function ViajesPrivadoPreviewClient() {
  const sp = useSearchParams();
  const { routeLang, copyLang: lang } = resolveClasificadosPublishLang(sp?.get("lang"));
  const ui = getViajesUi(lang);
  const { draft, hydrated } = useViajesPrivadoDraftV2(lang === "en" ? "en" : "es");
  const stagedId = (sp?.get("stagedId") ?? "").trim();
  const [stagedOfferV2, setStagedOfferV2] = useState(draft.offer);
  const [stagedErr, setStagedErr] = useState<string | null>(null);
  const [useStaged, setUseStaged] = useState(false);

  const hero = getViajesHeroAsset(draft.offer.media.images);
  const heroBlobUrl = useViajesLocalHeroObjectUrl("privado", hero?.localIdbKey ?? null);

  useEffect(() => {
    if (!stagedId) {
      setUseStaged(false);
      setStagedErr(null);
      return;
    }
    let cancelled = false;
    async function run() {
      setStagedErr(null);
      try {
        const sb = createSupabaseBrowserClient();
        const sess = await withAuthTimeout(sb.auth.getSession(), AUTH_CHECK_TIMEOUT_MS);
        const token = sess.data.session?.access_token;
        if (!token) {
          if (!cancelled) setStagedErr(lang === "en" ? "Sign in to preview this submission." : "Inicia sesión para previsualizar este envío.");
          return;
        }
        const res = await fetch(`/api/clasificados/viajes/staged-owner?id=${encodeURIComponent(stagedId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = (await res.json()) as { ok?: boolean; row?: { slug?: string; listing_json?: unknown }; error?: string };
        if (!res.ok || !json.ok || !json.row?.listing_json) {
          if (!cancelled) setStagedErr(json.error ?? "load_failed");
          return;
        }
        const offer = normalizeViajesOfferToV2(json.row.listing_json, { locale: lang === "en" ? "en" : "es", laneHint: "private" });
        offer.lifecycle = { ...offer.lifecycle, slug: json.row.slug, stagedListingId: stagedId };
        if (!cancelled) {
          setStagedOfferV2(offer);
          setUseStaged(true);
        }
      } catch {
        if (!cancelled) setStagedErr("network");
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [lang, stagedId]);

  const activeOffer = useStaged ? stagedOfferV2 : draft.offer;
  const detail = useMemo(
    () =>
      mapViajesOfferV2ToDetailModel(activeOffer, {
        sparse: true,
        lang: lang === "en" ? "en" : "es",
        heroSrcOverride: !useStaged ? heroBlobUrl || hero?.localPreviewObjectUrl || undefined : undefined,
        trustNote:
          lang === "en"
            ? "Private Inquiry Hub preview — exact address stays hidden by default."
            : "Vista previa Inquiry Hub — la dirección exacta permanece oculta por defecto.",
      }),
    [activeOffer, hero?.localPreviewObjectUrl, heroBlobUrl, lang, useStaged]
  );

  const backHref = viajesPreviewReturnToEditHref({
    lane: "private",
    stagedId: stagedId || null,
    lang: lang === "en" ? "en" : "es",
  });

  const exploreViajesHref = appendLangToPath("/clasificados/viajes", routeLang);

  if (!hydrated && !stagedId) {
    return (
      <div className="min-h-screen bg-[color:var(--lx-page)]">
        <Navbar />
        <p className="p-8 text-sm text-[color:var(--lx-muted)]">…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--lx-page)]">
      <Navbar />
      <div className="mx-auto flex max-w-5xl justify-end px-4 pt-4">
        <ViajesLangSwitch compact />
      </div>
      {stagedErr ? (
        <p className="mx-auto max-w-5xl px-4 text-sm text-red-700" role="alert">
          {stagedErr}
        </p>
      ) : null}
      <ViajesOfferDetailLayout
        offer={detail}
        lang={lang}
        backHref={backHref}
        backLabel={lang === "en" ? "Back to editor" : "Volver al editor"}
        preview
        sparseSections
        ui={ui}
        stagedListingId={stagedId || null}
        exploreViajesHref={exploreViajesHref}
      />
    </div>
  );
}
