"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import Navbar from "@/app/components/Navbar";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { ViajesOfferDetailLayout } from "@/app/(site)/clasificados/viajes/components/ViajesOfferDetailLayout";
import { getViajesUi } from "@/app/(site)/clasificados/viajes/data/viajesUiCopy";
import { ViajesLangSwitch } from "@/app/(site)/clasificados/viajes/components/ViajesLangSwitch";
import { useViajesLocalHeroObjectUrl } from "@/app/(site)/clasificados/viajes/lib/useViajesLocalHeroObjectUrl";
import { getPublicarViajesPrivadoCopy } from "@/app/(site)/publicar/viajes/privado/data/publicarViajesPrivadoCopy";
import { mapViajesPrivadoDraftToOffer } from "@/app/(site)/publicar/viajes/privado/lib/mapViajesPrivadoDraftToOffer";
import { useViajesPrivadoDraft } from "@/app/(site)/publicar/viajes/privado/lib/useViajesPrivadoDraft";

export function ViajesPrivadoPreviewClient() {
  const sp = useSearchParams();
  const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";
  const ui = getViajesUi(lang);
  const c = getPublicarViajesPrivadoCopy(lang);
  const { draft, hydrated } = useViajesPrivadoDraft();
  const heroBlobUrl = useViajesLocalHeroObjectUrl("privado", draft.localHeroBlobId);

  const offer = useMemo(
    () =>
      mapViajesPrivadoDraftToOffer(draft, c, lang === "en" ? "en" : "es", {
        sparse: true,
        heroSrcOverride: heroBlobUrl ?? undefined,
      }),
    [draft, c, lang, heroBlobUrl]
  );

  const backHref = appendLangToPath("/publicar/viajes/privado", lang);
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
      ) : (
        <ViajesOfferDetailLayout
          offer={offer}
          backHref={backHref}
          backLabel={c.previewBackEdit}
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
