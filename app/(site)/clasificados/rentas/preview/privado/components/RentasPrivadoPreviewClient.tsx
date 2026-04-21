"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { publishLeonixListingFromRentasPrivadoDraft } from "@/app/clasificados/lib/leonixPublishRealEstateFromDraftState";
import {
  BR_NEGOCIO_Q_PROPIEDAD,
  coerceBrNegocioCategoriaPropiedad,
} from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import { LeonixPreviewPageShell } from "@/app/clasificados/lib/preview/LeonixPreviewPageShell";
import { BienesRaicesPrivadoPreviewView } from "@/app/clasificados/bienes-raices/preview/privado/BienesRaicesPrivadoPreviewView";
import { buildRentasPrivadoTemplateVm } from "../model/buildRentasPrivadoTemplateVm";
import { mapRentasPrivadoStateToPreviewVm } from "@/app/clasificados/publicar/rentas/privado/application/mapping/mapRentasPrivadoStateToPreviewVm";
import {
  clearRentasPrivadoDraft,
  loadRentasPrivadoDraft,
} from "@/app/clasificados/publicar/rentas/privado/application/utils/rentasPrivadoDraft";
import type { RentasPrivadoFormState } from "@/app/clasificados/publicar/rentas/privado/schema/rentasPrivadoFormState";
import { withRentasLandingLang } from "@/app/clasificados/rentas/rentasLandingLang";
import {
  rentasListingPublicPath,
  RENTAS_PREVIEW_PRIVADO,
  RENTAS_PUBLICAR_PRIVADO_PUBLIC_ENTRY,
} from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";

type Phase = "loading" | "ready" | "recovery";

const PUBLISH_BTN =
  "inline-flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-full bg-[#1E1810] px-5 py-2.5 text-center text-[11px] font-bold uppercase leading-snug tracking-wide text-[#F9F6F1] hover:bg-[#2C2416] disabled:opacity-50 sm:min-h-[40px] sm:w-auto sm:py-2";

export default function RentasPrivadoPreviewClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlCategoria = useMemo(
    () => coerceBrNegocioCategoriaPropiedad(searchParams?.get(BR_NEGOCIO_Q_PROPIEDAD) ?? null),
    [searchParams],
  );

  const [phase, setPhase] = useState<Phase>("loading");
  const [draft, setDraft] = useState<RentasPrivadoFormState | null>(null);
  const [publishBusy, setPublishBusy] = useState(false);
  const [publishErr, setPublishErr] = useState<string | null>(null);

  const lang = searchParams?.get("lang") === "en" ? "en" : "es";

  const onPublishLive = useCallback(async () => {
    const d = loadRentasPrivadoDraft();
    if (!d) return;
    setPublishBusy(true);
    setPublishErr(null);
    const r = await publishLeonixListingFromRentasPrivadoDraft(d, lang);
    setPublishBusy(false);
    if (r.ok) {
      clearRentasPrivadoDraft();
      router.push(withRentasLandingLang(`${rentasListingPublicPath(r.listingId)}?published=1`, lang));
    } else {
      setPublishErr(r.error);
    }
  }, [lang, router]);

  useEffect(() => {
    const d = loadRentasPrivadoDraft();
    setDraft(d);
    setPhase(d ? "ready" : "recovery");
  }, []);

  useEffect(() => {
    if (phase !== "ready" || !draft) return;
    if (draft.categoriaPropiedad !== urlCategoria) {
      router.replace(`${RENTAS_PREVIEW_PRIVADO}?${BR_NEGOCIO_Q_PROPIEDAD}=${encodeURIComponent(draft.categoriaPropiedad)}`);
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
    const templateVm = buildRentasPrivadoTemplateVm(urlCategoria);
    const editHrefRecovery = `${RENTAS_PUBLICAR_PRIVADO_PUBLIC_ENTRY}?${BR_NEGOCIO_Q_PROPIEDAD}=${encodeURIComponent(urlCategoria)}`;
    return (
      <LeonixPreviewPageShell editHref={editHrefRecovery}>
        <p className="mx-auto max-w-[1240px] px-4 py-3 text-center text-xs text-[#5C5346] sm:px-6 lg:px-8">
          <span className="font-semibold text-[#2C2416]">Sin borrador en esta sesión</span>
          <span className="mx-2 opacity-40">·</span>
          Plantilla por categoría.{" "}
          <Link href={RENTAS_PUBLICAR_PRIVADO_PUBLIC_ENTRY} className="font-semibold underline" prefetch={false}>
            Ir a publicar — Privado
          </Link>
        </p>
        <BienesRaicesPrivadoPreviewView vm={templateVm} />
      </LeonixPreviewPageShell>
    );
  }

  const vm = mapRentasPrivadoStateToPreviewVm(draft);

  const editHref = `${RENTAS_PUBLICAR_PRIVADO_PUBLIC_ENTRY}?${BR_NEGOCIO_Q_PROPIEDAD}=${encodeURIComponent(draft.categoriaPropiedad)}`;

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
      <BienesRaicesPrivadoPreviewView vm={vm} />
    </LeonixPreviewPageShell>
  );
}
