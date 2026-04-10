"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { publishLeonixListingFromBienesRaicesPrivadoDraft } from "@/app/clasificados/lib/leonixPublishRealEstateFromDraftState";
import {
  BR_NEGOCIO_Q_PROPIEDAD,
  coerceBrNegocioCategoriaPropiedad,
} from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import {
  BR_PREVIEW_PRIVADO,
  BR_PUBLICAR_PRIVADO_PUBLIC_ENTRY,
} from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import { mapBienesRaicesPrivadoStateToPreviewVm } from "@/app/clasificados/publicar/bienes-raices/privado/application/mapping/mapBienesRaicesPrivadoStateToPreviewVm";
import { loadBienesRaicesPrivadoDraft } from "@/app/clasificados/publicar/bienes-raices/privado/application/utils/bienesRaicesPrivadoDraft";
import type { BienesRaicesPrivadoFormState } from "@/app/clasificados/publicar/bienes-raices/privado/schema/bienesRaicesPrivadoFormState";
import { LeonixPreviewPageShell } from "@/app/clasificados/lib/preview/LeonixPreviewPageShell";
import { BienesRaicesPrivadoPreviewView } from "../BienesRaicesPrivadoPreviewView";

type Phase = "loading" | "ready" | "recovery";

const PUBLISH_BTN =
  "inline-flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-full bg-[#1E1810] px-5 py-2.5 text-center text-[11px] font-bold uppercase leading-snug tracking-wide text-[#F9F6F1] hover:bg-[#2C2416] disabled:opacity-50 sm:min-h-[40px] sm:w-auto sm:py-2";

export default function BienesRaicesPrivadoPreviewClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlCategoria = useMemo(
    () => coerceBrNegocioCategoriaPropiedad(searchParams?.get(BR_NEGOCIO_Q_PROPIEDAD) ?? null),
    [searchParams],
  );

  const [phase, setPhase] = useState<Phase>("loading");
  const [draft, setDraft] = useState<BienesRaicesPrivadoFormState | null>(null);
  const [publishBusy, setPublishBusy] = useState(false);
  const [publishErr, setPublishErr] = useState<string | null>(null);

  const lang = searchParams?.get("lang") === "en" ? "en" : "es";

  const onPublishLive = useCallback(async () => {
    const d = loadBienesRaicesPrivadoDraft();
    if (!d) return;
    setPublishBusy(true);
    setPublishErr(null);
    const r = await publishLeonixListingFromBienesRaicesPrivadoDraft(d, lang);
    setPublishBusy(false);
    if (r.ok) {
      router.push(`/clasificados/anuncio/${r.listingId}?lang=${lang}`);
    } else {
      setPublishErr(r.error);
    }
  }, [lang, router]);

  useEffect(() => {
    const d = loadBienesRaicesPrivadoDraft();
    setDraft(d);
    setPhase(d ? "ready" : "recovery");
  }, []);

  /** Keep `?propiedad=` aligned with draft category whenever both are known (survives remounts and query changes). */
  useEffect(() => {
    if (phase !== "ready" || !draft) return;
    if (draft.categoriaPropiedad !== urlCategoria) {
      router.replace(`${BR_PREVIEW_PRIVADO}?${BR_NEGOCIO_Q_PROPIEDAD}=${encodeURIComponent(draft.categoriaPropiedad)}`);
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
    const editHrefRecovery = `${BR_PUBLICAR_PRIVADO_PUBLIC_ENTRY}?${BR_NEGOCIO_Q_PROPIEDAD}=${encodeURIComponent(urlCategoria)}`;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 overflow-x-hidden bg-[#F9F6F1] px-4 py-8 text-center text-[#2C2416]">
        <p className="max-w-md text-sm leading-relaxed text-[#5C5346] [text-wrap:balance]">
          No encontramos un borrador de BR Privado en esta sesión. Publica o continúa editando para generar la vista previa.
        </p>
        <Link
          href={editHrefRecovery}
          className="inline-flex min-h-[48px] min-w-[200px] items-center justify-center rounded-full bg-[#B8954A] px-6 text-sm font-bold text-[#1E1810] transition hover:brightness-95"
        >
          Ir a publicar — Privado
        </Link>
      </div>
    );
  }

  const vm = mapBienesRaicesPrivadoStateToPreviewVm(draft);
  const editHref = `${BR_PUBLICAR_PRIVADO_PUBLIC_ENTRY}?${BR_NEGOCIO_Q_PROPIEDAD}=${encodeURIComponent(draft.categoriaPropiedad)}`;

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
