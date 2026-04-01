"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BR_PUBLICAR_NEGOCIO } from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import { mapAgenteIndividualResidencialToPreview } from "../mapping/mapAgenteIndividualResidencialToPreview";
import type { AgenteIndividualResidencialPreviewVm } from "../mapping/agenteIndividualResidencialPreviewVm";
import {
  loadAgenteResPreviewDraft,
  readAgenteResPreviewDraftRaw,
} from "../application/utils/previewDraft";
import {
  clearLeonixPreviewNavSessionFlag,
  markPublishFlowReturningToEdit,
} from "@/app/clasificados/lib/publishFlowLifecycleClient";
import { AgenteIndividualResidencialPreviewView } from "./AgenteIndividualResidencialPreviewView";

const GRACE_STEP_MS = 200;
const GRACE_TOTAL_MS = 1000;

type Phase = "loading" | "ready" | "recovery";

function tryMapDraft(): AgenteIndividualResidencialPreviewVm | null {
  const raw = readAgenteResPreviewDraftRaw();
  if (!raw) return null;
  const draft = loadAgenteResPreviewDraft();
  if (!draft) return null;
  try {
    return mapAgenteIndividualResidencialToPreview(draft);
  } catch {
    return null;
  }
}

export default function AgenteIndividualResidencialPreviewClient() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [vm, setVm] = useState<AgenteIndividualResidencialPreviewVm | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | undefined;
    const deadline = Date.now() + GRACE_TOTAL_MS;

    const attempt = () => {
      if (cancelled) return;
      const next = tryMapDraft();
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

  if (phase === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9F6F1] text-[#5C5346]">
        Cargando vista previa…
      </div>
    );
  }

  if (phase === "ready" && vm) {
    return (
      <AgenteIndividualResidencialPreviewView
        vm={vm}
        editHref={BR_PUBLICAR_NEGOCIO}
        footerExtra="Leonix es una vitrina premium: el listado oficial puede estar en tu MLS o sitio web."
        onBeforeNavigateToEdit={markPublishFlowReturningToEdit}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#F9F6F1] px-4 text-[#2C2416]">
      <div className="max-w-md rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7] p-6 text-center shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-[#B8954A]">Vista previa</p>
        <p className="mt-2 text-sm text-[#5C5346]">
          No pudimos cargar el borrador todavía. Reintenta o vuelve al formulario.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            className="rounded-xl bg-gradient-to-r from-[#C9A85A] to-[#B8954A] px-5 py-2.5 text-sm font-bold text-[#1E1810] shadow-md"
            onClick={() => {
              setVm(null);
              setPhase("loading");
              setRetryKey((k) => k + 1);
            }}
          >
            Reintentar
          </button>
          <Link
            href={BR_PUBLICAR_NEGOCIO}
            prefetch={false}
            className="rounded-xl border border-[#E8DFD0] bg-white px-5 py-2.5 text-center text-sm font-semibold"
            onClick={() => markPublishFlowReturningToEdit()}
          >
            Volver a editar
          </Link>
        </div>
      </div>
    </div>
  );
}
