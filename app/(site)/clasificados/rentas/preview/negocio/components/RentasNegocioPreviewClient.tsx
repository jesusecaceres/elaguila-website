"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BR_NEGOCIO_Q_PROPIEDAD,
  coerceBrNegocioCategoriaPropiedad,
} from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import { BienesRaicesNegocioPreviewView } from "@/app/clasificados/bienes-raices/preview/BienesRaicesNegocioPreviewView";
import { mapRentasNegocioStateToPreviewVm } from "@/app/clasificados/publicar/rentas/negocio/application/mapping/mapRentasNegocioStateToPreviewVm";
import { loadRentasNegocioDraft } from "@/app/clasificados/publicar/rentas/negocio/application/utils/rentasNegocioDraft";
import {
  createEmptyRentasNegocioFormState,
  mergePartialRentasNegocioState,
  type RentasNegocioFormState,
} from "@/app/clasificados/publicar/rentas/negocio/schema/rentasNegocioFormState";
import {
  RENTAS_PREVIEW_NEGOCIO,
  RENTAS_PUBLICAR_NEGOCIO_PUBLIC_ENTRY,
} from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";

type Phase = "loading" | "ready" | "recovery";

export default function RentasNegocioPreviewClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlCategoria = useMemo(
    () => coerceBrNegocioCategoriaPropiedad(searchParams?.get(BR_NEGOCIO_Q_PROPIEDAD) ?? null),
    [searchParams],
  );

  const [phase, setPhase] = useState<Phase>("loading");
  const [draft, setDraft] = useState<RentasNegocioFormState | null>(null);

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
    return (
      <div className="min-h-screen overflow-x-hidden bg-[#F9F6F1]">
        <div className="border-b px-4 py-3 text-center text-xs text-[#5C5346]" style={{ borderColor: "rgba(61, 54, 48, 0.12)" }}>
          <span className="font-semibold text-[#2C2416]">Sin borrador en esta sesión</span>
          <span className="mx-2 opacity-40">·</span>
          Plantilla mínima por categoría.{" "}
          <Link href={RENTAS_PUBLICAR_NEGOCIO_PUBLIC_ENTRY} className="font-semibold underline">
            Publicar — Negocio
          </Link>
        </div>
        <BienesRaicesNegocioPreviewView vm={vm} editHref={RENTAS_PUBLICAR_NEGOCIO_PUBLIC_ENTRY} />
      </div>
    );
  }

  const vm = mapRentasNegocioStateToPreviewVm(draft);

  return <BienesRaicesNegocioPreviewView vm={vm} editHref={RENTAS_PUBLICAR_NEGOCIO_PUBLIC_ENTRY} />;
}
