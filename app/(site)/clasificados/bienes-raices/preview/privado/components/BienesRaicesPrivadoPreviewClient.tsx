"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { BienesRaicesPrivadoPreviewView } from "../BienesRaicesPrivadoPreviewView";

type Phase = "loading" | "ready" | "recovery";

export default function BienesRaicesPrivadoPreviewClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlCategoria = useMemo(
    () => coerceBrNegocioCategoriaPropiedad(searchParams?.get(BR_NEGOCIO_Q_PROPIEDAD) ?? null),
    [searchParams],
  );

  const [phase, setPhase] = useState<Phase>("loading");
  const [draft, setDraft] = useState<BienesRaicesPrivadoFormState | null>(null);

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
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 overflow-x-hidden bg-[#F9F6F1] px-4 py-8 text-center text-[#2C2416]">
        <p className="max-w-md text-sm leading-relaxed text-[#5C5346] [text-wrap:balance]">
          No encontramos un borrador de BR Privado en este dispositivo. Publica o continúa editando para generar la vista previa.
        </p>
        <Link
          href={BR_PUBLICAR_PRIVADO_PUBLIC_ENTRY}
          className="inline-flex min-h-[48px] min-w-[200px] items-center justify-center rounded-full bg-[#B8954A] px-6 text-sm font-bold text-[#1E1810] transition hover:brightness-95"
        >
          Ir a publicar — Privado
        </Link>
      </div>
    );
  }

  const vm = mapBienesRaicesPrivadoStateToPreviewVm(draft);

  return <BienesRaicesPrivadoPreviewView vm={vm} editHref={BR_PUBLICAR_PRIVADO_PUBLIC_ENTRY} />;
}
