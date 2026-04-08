"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LeonixPreviewPageShell } from "@/app/clasificados/lib/preview/LeonixPreviewPageShell";
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

const GRACE_STEP_MS = 200;
const GRACE_TOTAL_MS = 1000;

type Phase = "loading" | "ready" | "recovery";

function tryReadPreviewDraftForMap(): BienesRaicesNegocioPreviewVm | null {
  const raw = readBienesRaicesNegocioPreviewDraftRaw();
  if (!raw) return null;
  const draft = loadBienesRaicesNegocioPreviewDraft();
  if (!draft) return null;
  try {
    return mapNegocioFormStateToBrNegocioPreviewVm(draft);
  } catch {
    return null;
  }
}

/**
 * Hooks: fixed order every render — three useState, one useEffect only.
 * UI branches use a single return (no early return after hooks).
 */
export default function BienesRaicesNegocioPreviewClient() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [vm, setVm] = useState<BienesRaicesNegocioPreviewVm | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | undefined;
    const deadline = Date.now() + GRACE_TOTAL_MS;

    const attempt = () => {
      if (cancelled) return;
      const next = tryReadPreviewDraftForMap();
      if (next) {
        setVm(next);
        setPhase("ready");
        clearLeonixPreviewNavSessionFlag();
        return;
      }
      if (Date.now() >= deadline) {
        setPhase("recovery");
        return;
      }
      timeoutId = window.setTimeout(attempt, GRACE_STEP_MS);
    };

    attempt();
    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [retryKey]);

  return (
    <>
      {phase === "loading" ? (
        <div className="flex min-h-screen items-center justify-center bg-[#F9F6F1] text-[#5C5346]">
          Cargando vista previa…
        </div>
      ) : phase === "ready" && vm != null ? (
        <LeonixPreviewPageShell editHref={BR_PUBLICAR_NEGOCIO} onBeforeNavigateToEdit={markPublishFlowReturningToEdit}>
          <BienesRaicesNegocioPreviewView vm={vm} />
        </LeonixPreviewPageShell>
      ) : (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#F9F6F1] px-4 text-[#2C2416]">
          <div className="max-w-md rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7] p-6 text-center shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-[#B8954A]">Vista previa</p>
            <p className="mt-2 text-sm text-[#5C5346]">
              No pudimos cargar el borrador de vista previa todavía. Puedes reintentar o volver al formulario para seguir
              editando.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                className="rounded-xl bg-gradient-to-r from-[#C9A85A] to-[#B8954A] px-5 py-2.5 text-sm font-bold text-[#1E1810] shadow-md hover:opacity-95"
                onClick={() => {
                  setVm(null);
                  setPhase("loading");
                  setRetryKey((k) => k + 1);
                }}
              >
                Reintentar cargar vista previa
              </button>
              <Link
                href={BR_PUBLICAR_NEGOCIO}
                className="rounded-xl border border-[#E8DFD0] bg-white px-5 py-2.5 text-center text-sm font-semibold text-[#2C2416] hover:bg-[#FFFCF7]"
                prefetch={false}
                onClick={() => {
                  markPublishFlowReturningToEdit();
                }}
              >
                Volver a editar
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
