"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import Navbar from "@/app/components/Navbar";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { ViajesLangSwitch } from "@/app/(site)/clasificados/viajes/components/ViajesLangSwitch";
import { ViajesOfferDetailLayout } from "@/app/(site)/clasificados/viajes/components/ViajesOfferDetailLayout";
import type { ViajesOfferDetailModel } from "@/app/(site)/clasificados/viajes/data/viajesOfferDetailSampleData";
import { getViajesUi } from "@/app/(site)/clasificados/viajes/data/viajesUiCopy";
import { useViajesLocalHeroObjectUrl } from "@/app/(site)/clasificados/viajes/lib/useViajesLocalHeroObjectUrl";
import { createSupabaseBrowserClient, withAuthTimeout, AUTH_CHECK_TIMEOUT_MS } from "@/app/lib/supabase/browser";
import { getPublicarViajesNegociosCopy } from "@/app/(site)/publicar/viajes/negocios/data/publicarViajesNegociosCopy";
import { mapViajesNegociosDraftToOffer } from "@/app/(site)/publicar/viajes/negocios/lib/mapViajesNegociosDraftToOffer";
import type { ViajesNegociosDraft } from "@/app/(site)/publicar/viajes/negocios/lib/viajesNegociosDraftTypes";
import { useViajesNegociosDraft } from "@/app/(site)/publicar/viajes/negocios/lib/useViajesNegociosDraft";

export function ViajesNegociosPreviewClient() {
  const sp = useSearchParams();
  const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";
  const ui = getViajesUi(lang);
  const c = getPublicarViajesNegociosCopy(lang);
  const { draft, hydrated } = useViajesNegociosDraft();
  const heroBlobUrl = useViajesLocalHeroObjectUrl("negocios", draft.localHeroImageId);
  const stagedId = (sp?.get("stagedId") ?? "").trim();

  const [stagedOffer, setStagedOffer] = useState<ViajesOfferDetailModel | null>(null);
  const [stagedErr, setStagedErr] = useState<string | null>(null);

  useEffect(() => {
    if (!stagedId) {
      setStagedOffer(null);
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
        const json = (await res.json()) as {
          ok?: boolean;
          row?: { slug: string; listing_json?: { negocios?: ViajesNegociosDraft }; hero_image_url?: string | null };
          error?: string;
        };
        if (!res.ok || !json.ok || !json.row?.listing_json?.negocios) {
          if (!cancelled) setStagedErr(json.error ?? "load_failed");
          return;
        }
        const d = json.row.listing_json.negocios;
        const hero = json.row.hero_image_url?.trim() || undefined;
        const base = mapViajesNegociosDraftToOffer(d, c, lang === "en" ? "en" : "es", { sparse: true, heroSrcOverride: hero });
        const trust =
          lang === "en"
            ? "Owner preview — not public until approved. Leonix is discovery-only; confirm details with the operator."
            : "Vista previa del titular — no es pública hasta aprobación. Leonix es solo descubrimiento; confirma con el operador.";
        if (!cancelled) {
          setStagedOffer({
            ...base,
            slug: json.row.slug,
            trustNote: trust,
            partner: { ...base.partner, privateSeller: false },
          });
        }
      } catch {
        if (!cancelled) setStagedErr("network");
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [c, lang, stagedId]);

  const draftOffer = useMemo(
    () =>
      mapViajesNegociosDraftToOffer(draft, c, lang === "en" ? "en" : "es", {
        sparse: true,
        heroSrcOverride: heroBlobUrl ?? undefined,
      }),
    [draft, c, lang, heroBlobUrl]
  );

  const offer = stagedOffer ?? draftOffer;
  const stagedPreviewPending = Boolean(stagedId) && !stagedOffer && !stagedErr;
  const backHref = stagedId
    ? appendLangToPath("/dashboard/viajes", lang)
    : appendLangToPath("/publicar/viajes/negocios", lang);
  const backLabel = stagedId ? (lang === "en" ? "Back to Viajes dashboard" : "Volver al panel Viajes") : c.previewBackEdit;
  const exploreViajesHref = appendLangToPath("/clasificados/viajes", lang);

  return (
    <div className="min-h-screen bg-[color:var(--lx-page)] text-[color:var(--lx-text)]">
      <Navbar />
      <div className="border-b border-[color:var(--lx-nav-border)] bg-[color:var(--lx-nav-bg)] px-4 py-2 sm:px-5">
        <div className="mx-auto flex max-w-7xl justify-end">
          <ViajesLangSwitch compact />
        </div>
      </div>
      {!hydrated ? (
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="h-96 animate-pulse rounded-2xl bg-[color:var(--lx-section)]" aria-busy="true" />
        </div>
      ) : stagedPreviewPending ? (
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="h-96 animate-pulse rounded-2xl bg-[color:var(--lx-section)]" aria-busy="true" />
        </div>
      ) : stagedErr ? (
        <div className="mx-auto max-w-7xl px-4 py-10 text-sm text-rose-800">
          {stagedErr === "load_failed" || stagedErr === "network"
            ? lang === "en"
              ? "Could not load this owner preview."
              : "No se pudo cargar esta vista previa."
            : stagedErr}
        </div>
      ) : (
        <ViajesOfferDetailLayout
          offer={offer}
          backHref={backHref}
          backLabel={backLabel}
          preview
          previewTone="minimal"
          sparseSections
          ui={ui}
          exploreViajesHref={exploreViajesHref}
        />
      )}
    </div>
  );
}
