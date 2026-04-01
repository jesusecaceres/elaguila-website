"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { BienesRaicesNegocioPreviewView } from "@/app/clasificados/bienes-raices/preview/BienesRaicesNegocioPreviewView";
import { BR_PUBLICAR_NEGOCIO } from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import { mapNegocioFormStateToBrNegocioPreviewVm } from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/brNegocioInputToPreviewMap";
import type { BienesRaicesNegocioFormState } from "@/app/clasificados/publicar/bienes-raices/negocio/application/schema/bienesRaicesNegocioFormState";
import {
  loadBienesRaicesNegocioPreviewDraft,
  readBienesRaicesNegocioPreviewDraftRaw,
} from "@/app/clasificados/publicar/bienes-raices/negocio/application/utils/bienesRaicesPreviewDraft";
import {
  clearLeonixPreviewNavSessionFlag,
  markPublishFlowReturningToEdit,
} from "@/app/clasificados/lib/publishFlowLifecycleClient";

/**
 * BRT Negocio preview — En Venta–style plumbing: hooks are unconditional; draft hydrates once; UI branches after.
 */
export default function BienesRaicesNegocioPreviewClient() {
  const [hydrated, setHydrated] = useState(false);
  const [draft, setDraft] = useState<BienesRaicesNegocioFormState | null>(null);
  const [recoverReason, setRecoverReason] = useState<"missing" | "corrupt" | null>(null);

  useLayoutEffect(() => {
    clearLeonixPreviewNavSessionFlag();
  }, []);

  useEffect(() => {
    const raw = readBienesRaicesNegocioPreviewDraftRaw();
    try {
      const loaded = loadBienesRaicesNegocioPreviewDraft();
      if (loaded) {
        setDraft(loaded);
        setRecoverReason(null);
      } else if (raw != null && raw.length > 0) {
        setDraft(null);
        setRecoverReason("corrupt");
      } else {
        setDraft(null);
        setRecoverReason("missing");
      }
    } catch {
      setDraft(null);
      setRecoverReason(raw != null && raw.length > 0 ? "corrupt" : "missing");
    }
    setHydrated(true);
  }, []);

  const vm = useMemo(() => (draft ? mapNegocioFormStateToBrNegocioPreviewVm(draft) : null), [draft]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9F6F1] text-[#5C5346]">
        Cargando vista previa…
      </div>
    );
  }

  if (!draft || !vm) {
    const reason = recoverReason ?? "missing";
    const title =
      reason === "corrupt"
        ? "No se pudo leer el borrador de vista previa"
        : "No hay borrador de vista previa en esta sesión";
    const detail =
      reason === "corrupt"
        ? "Los datos guardados parecen dañados o incompletos. Vuelve al formulario o recarga esta página."
        : "Abre la vista previa desde “Publicar Bienes Raíces — Negocio” (paso Vista previa) para generar el borrador.";

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#F9F6F1] px-6 py-16 text-center text-[#5C5346]">
        <div className="max-w-md space-y-2">
          <p className="text-sm font-bold uppercase tracking-wide text-[#B8954A]">Leonix · BRT Negocio</p>
          <h1 className="text-xl font-extrabold text-[#2A2620]">{title}</h1>
          <p className="text-sm leading-relaxed">{detail}</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            className="rounded-xl border border-[#E8DFD0] bg-white px-4 py-2.5 text-sm font-semibold text-[#2C2416] hover:bg-[#FFFCF7]"
            onClick={() => window.location.reload()}
          >
            Recargar vista previa
          </button>
          <Link
            href={BR_PUBLICAR_NEGOCIO}
            className="rounded-xl bg-gradient-to-r from-[#C9A85A] to-[#B8954A] px-4 py-2.5 text-sm font-bold text-[#1E1810] shadow-md hover:opacity-95"
            prefetch={false}
            onClick={() => {
              markPublishFlowReturningToEdit();
            }}
          >
            Volver a editar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <BienesRaicesNegocioPreviewView
      vm={vm}
      editHref={BR_PUBLICAR_NEGOCIO}
      onBeforeNavigateToEdit={markPublishFlowReturningToEdit}
    />
  );
}
