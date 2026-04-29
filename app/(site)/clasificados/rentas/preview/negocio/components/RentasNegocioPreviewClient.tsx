"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { publishLeonixListingFromRentasNegocioDraft } from "@/app/clasificados/lib/leonixPublishRealEstateFromDraftState";
import {
  BR_NEGOCIO_Q_PROPIEDAD,
  coerceBrNegocioCategoriaPropiedad,
} from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import { LeonixPreviewPageShell } from "@/app/clasificados/lib/preview/LeonixPreviewPageShell";
import { BienesRaicesNegocioPreviewView } from "@/app/clasificados/bienes-raices/preview/BienesRaicesNegocioPreviewView";
import { RentasPreviewCard } from "@/app/(site)/clasificados/rentas/shell/RentasPreviewCard";
import { mapRentasNegocioStateToPreviewVm } from "@/app/clasificados/publicar/rentas/negocio/application/mapping/mapRentasNegocioStateToPreviewVm";
import {
  clearRentasNegocioDraft,
  loadRentasNegocioDraft,
} from "@/app/clasificados/publicar/rentas/negocio/application/utils/rentasNegocioDraft";
import {
  createEmptyRentasNegocioFormState,
  mergePartialRentasNegocioState,
  type RentasNegocioFormState,
} from "@/app/clasificados/publicar/rentas/negocio/schema/rentasNegocioFormState";
import { withRentasLandingLang } from "@/app/clasificados/rentas/rentasLandingLang";
import {
  rentasListingPublicPath,
  RENTAS_PREVIEW_NEGOCIO,
  RENTAS_PUBLICAR_NEGOCIO_PUBLIC_ENTRY,
} from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";

type Phase = "loading" | "ready" | "recovery";

const PUBLISH_BTN =
  "inline-flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-full bg-[#1E1810] px-5 py-2.5 text-center text-[11px] font-bold uppercase leading-snug tracking-wide text-[#F9F6F1] hover:bg-[#2C2416] disabled:opacity-50 sm:min-h-[40px] sm:w-auto sm:py-2";

export default function RentasNegocioPreviewClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlCategoria = useMemo(
    () => coerceBrNegocioCategoriaPropiedad(searchParams?.get(BR_NEGOCIO_Q_PROPIEDAD) ?? null),
    [searchParams],
  );

  const [phase, setPhase] = useState<Phase>("loading");
  const [draft, setDraft] = useState<RentasNegocioFormState | null>(null);
  const [publishBusy, setPublishBusy] = useState(false);
  const [publishErr, setPublishErr] = useState<string | null>(null);

  const lang = searchParams?.get("lang") === "en" ? "en" : "es";

  const onPublishLive = useCallback(async () => {
    const d = loadRentasNegocioDraft();
    if (!d) return;
    setPublishBusy(true);
    setPublishErr(null);
    const r = await publishLeonixListingFromRentasNegocioDraft(d, lang);
    setPublishBusy(false);
    if (r.ok) {
      clearRentasNegocioDraft();
      router.push(withRentasLandingLang(`${rentasListingPublicPath(r.listingId)}?published=1`, lang));
    } else {
      setPublishErr(r.error);
    }
  }, [lang, router]);

  useEffect(() => {
    const d = loadRentasNegocioDraft();
    setDraft(d);
    setPhase(d ? "ready" : "recovery");
  }, []);

  useEffect(() => {
    if (phase !== "ready" || !draft) return;
    if (draft.categoriaPropiedad !== urlCategoria) {
      router.replace(`${RENTAS_PREVIEW_NEGOCIO}?${BR_NEGOCIO_Q_PROPIEDAD}=${encodeURIComponent(draft.categoriaPropiedad)}`);
    }
  }, [phase, draft, urlCategoria, router]);

  if (phase === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center overflow-x-hidden bg-[#F9F6F1] px-4 text-sm text-[#5C5346]">
        Cargando vista previa…
      </div>
    );
  }

  if (phase === "recovery" || !draft) {
    const shell = mergePartialRentasNegocioState({
      ...createEmptyRentasNegocioFormState(),
      categoriaPropiedad: urlCategoria,
    });
    const vm = mapRentasNegocioStateToPreviewVm(shell);
    const editHrefRecovery = `${RENTAS_PUBLICAR_NEGOCIO_PUBLIC_ENTRY}?${BR_NEGOCIO_Q_PROPIEDAD}=${encodeURIComponent(urlCategoria)}`;
    return (
      <LeonixPreviewPageShell editHref={editHrefRecovery}>
        <p className="mx-auto max-w-[1240px] px-4 py-3 text-center text-xs text-[#5C5346] sm:px-6 lg:px-8">
          <span className="font-semibold text-[#2C2416]">Sin borrador en esta sesión</span>
          <span className="mx-2 opacity-40">·</span>
          Plantilla mínima por categoría.{" "}
          <Link href={RENTAS_PUBLICAR_NEGOCIO_PUBLIC_ENTRY} className="font-semibold underline" prefetch={false}>
            Ir a publicar — Negocio
          </Link>
        </p>
        <div className="space-y-8">
          {/* New Rentas Preview Card */}
          <div className="max-w-2xl mx-auto">
            <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">Vista previa de la renta</h2>
            <RentasPreviewCard 
              data={vm} 
              lang={lang}
              showEngagementMetrics={true}
            />
          </div>
          
          {/* Original Detail View */}
          <div>
            <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">Vista completa del anuncio</h2>
            <BienesRaicesNegocioPreviewView vm={vm} />
          </div>
        </div>
      </LeonixPreviewPageShell>
    );
  }

  const vm = mapRentasNegocioStateToPreviewVm(draft);
  const editHref = `${RENTAS_PUBLICAR_NEGOCIO_PUBLIC_ENTRY}?${BR_NEGOCIO_Q_PROPIEDAD}=${encodeURIComponent(draft.categoriaPropiedad)}`;

  return (
    <LeonixPreviewPageShell
      editHref={editHref}
      publishSlot={
        <div className="flex w-full flex-col items-stretch gap-1 sm:w-auto sm:items-end">
          <button type="button" className={PUBLISH_BTN} disabled={publishBusy} onClick={() => void onPublishLive()}>
            {publishBusy
              ? lang === "es"
                ? "Publicando…"
                : "Publishing…"
              : lang === "es"
                ? "Publicar anuncio"
                : "Publish listing"}
          </button>
          {publishErr ? (
            <p className="max-w-[280px] text-right text-[11px] text-red-700" role="alert">
              {publishErr}
            </p>
          ) : null}
        </div>
      }
    >
      <div className="space-y-8">
          {/* New Rentas Preview Card */}
          <div className="max-w-2xl mx-auto">
            <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">Vista previa de la renta</h2>
            <RentasPreviewCard 
              data={vm} 
              lang={lang}
              showEngagementMetrics={true}
            />
          </div>
          
          {/* Original Detail View */}
          <div>
            <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">Vista completa del anuncio</h2>
            <BienesRaicesNegocioPreviewView vm={vm} />
          </div>
        </div>
    </LeonixPreviewPageShell>
  );
}
