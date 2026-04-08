"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BR_NEGOCIO_Q_PROPIEDAD,
  coerceBrNegocioCategoriaPropiedad,
} from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import { BienesRaicesPrivadoPreviewView } from "@/app/clasificados/bienes-raices/preview/privado/BienesRaicesPrivadoPreviewView";
import { buildRentasPrivadoTemplateVm } from "../model/buildRentasPrivadoTemplateVm";
import { mapRentasPrivadoStateToPreviewVm } from "@/app/clasificados/publicar/rentas/privado/application/mapping/mapRentasPrivadoStateToPreviewVm";
import { loadRentasPrivadoDraft } from "@/app/clasificados/publicar/rentas/privado/application/utils/rentasPrivadoDraft";
import type { RentasPrivadoFormState } from "@/app/clasificados/publicar/rentas/privado/schema/rentasPrivadoFormState";
import {
  RENTAS_PREVIEW_PRIVADO,
  RENTAS_PUBLICAR_PRIVADO_PUBLIC_ENTRY,
} from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";

type Phase = "loading" | "ready" | "recovery";

export default function RentasPrivadoPreviewClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlCategoria = useMemo(
    () => coerceBrNegocioCategoriaPropiedad(searchParams?.get(BR_NEGOCIO_Q_PROPIEDAD) ?? null),
    [searchParams],
  );

  const [phase, setPhase] = useState<Phase>("loading");
  const [draft, setDraft] = useState<RentasPrivadoFormState | null>(null);

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
    return (
      <div className="min-h-screen overflow-x-hidden bg-[#F9F6F1]">
        <div className="border-b px-4 py-3 text-center text-xs text-[#5C5346]" style={{ borderColor: "rgba(61, 54, 48, 0.12)" }}>
          <span className="font-semibold text-[#2C2416]">Sin borrador en este dispositivo</span>
          <span className="mx-2 opacity-40">·</span>
          Mostrando plantilla por categoría (
          <Link href={RENTAS_PUBLICAR_PRIVADO_PUBLIC_ENTRY} className="font-semibold underline">
            publicar
          </Link>
          ).
        </div>
        <BienesRaicesPrivadoPreviewView
          vm={templateVm}
          editHref={RENTAS_PUBLICAR_PRIVADO_PUBLIC_ENTRY}
          previewNavHubLabel="Rentas"
        />
      </div>
    );
  }

  const vm = mapRentasPrivadoStateToPreviewVm(draft);

  return (
    <BienesRaicesPrivadoPreviewView
      vm={vm}
      editHref={RENTAS_PUBLICAR_PRIVADO_PUBLIC_ENTRY}
      previewNavHubLabel="Rentas"
    />
  );
}
