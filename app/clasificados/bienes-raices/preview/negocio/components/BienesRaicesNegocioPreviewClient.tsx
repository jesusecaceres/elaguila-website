"use client";

import Link from "next/link";
import { useLayoutEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BienesRaicesNegocioPreviewView } from "@/app/clasificados/bienes-raices/preview/BienesRaicesNegocioPreviewView";
import { BR_PUBLICAR_NEGOCIO } from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import type { BienesRaicesNegocioPreviewVm } from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/bienesRaicesNegocioPreviewVm";
import { mapNegocioFormStateToBrNegocioPreviewVm } from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/brNegocioInputToPreviewMap";
import {
  loadBienesRaicesNegocioPreviewDraft,
  readBienesRaicesNegocioPreviewDraftRaw,
} from "@/app/clasificados/publicar/bienes-raices/negocio/application/utils/bienesRaicesPreviewDraft";
import {
  clearLeonixPreviewNavSessionFlag,
  markPublishFlowReturningToEdit,
} from "@/app/clasificados/lib/publishFlowLifecycleClient";

type PreviewPhase =
  | { kind: "loading" }
  | { kind: "ok"; vm: BienesRaicesNegocioPreviewVm }
  | { kind: "recover"; reason: "missing" | "corrupt" };

/**
 * Thin boundary: only `useSearchParams` (may suspend). No other hooks here.
 * `key` forces a fresh inner instance when the query string changes so phase state
 * never reconciles across incompatible trees (avoids #300/#310 with Next searchParams).
 */
export function BienesRaicesNegocioPreviewRoot() {
  const searchParams = useSearchParams();
  const reloadKey = searchParams?.toString() ?? "";
  return <BienesRaicesNegocioPreviewInner key={reloadKey} reloadKey={reloadKey} />;
}

/**
 * All non–search-param hooks live here; hook order is identical every render.
 * Recovery vs preview UI branches only after hooks run.
 */
function BienesRaicesNegocioPreviewInner({ reloadKey }: { reloadKey: string }) {
  const [phase, setPhase] = useState<PreviewPhase>({ kind: "loading" });

  useLayoutEffect(() => {
    let cancelled = false;
    let clearTimer: number | undefined;

    const raw = readBienesRaicesNegocioPreviewDraftRaw();
    let next: PreviewPhase;

    try {
      const draft = loadBienesRaicesNegocioPreviewDraft();
      if (draft) {
        next = { kind: "ok", vm: mapNegocioFormStateToBrNegocioPreviewVm(draft) };
      } else if (raw != null && raw.length > 0) {
        next = { kind: "recover", reason: "corrupt" };
      } else {
        next = { kind: "recover", reason: "missing" };
      }
    } catch {
      next =
        raw != null && raw.length > 0
          ? { kind: "recover", reason: "corrupt" }
          : { kind: "recover", reason: "missing" };
    }

    if (!cancelled) {
      setPhase(next);
    }

    clearTimer = window.setTimeout(() => {
      clearLeonixPreviewNavSessionFlag();
    }, 0);

    return () => {
      cancelled = true;
      if (clearTimer != null) window.clearTimeout(clearTimer);
    };
  }, [reloadKey]);

  if (phase.kind === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9F6F1] text-[#5C5346]">
        Cargando vista previa…
      </div>
    );
  }

  if (phase.kind === "recover") {
    const title =
      phase.reason === "corrupt"
        ? "No se pudo leer el borrador de vista previa"
        : "No hay borrador de vista previa en esta sesión";
    const detail =
      phase.reason === "corrupt"
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
      vm={phase.vm}
      editHref={BR_PUBLICAR_NEGOCIO}
      onBeforeNavigateToEdit={markPublishFlowReturningToEdit}
    />
  );
}
