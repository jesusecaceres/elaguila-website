"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ComidaLocalDetailShell } from "../components/ComidaLocalDetailShell";
import { createEmptyComidaLocalDraft } from "@/app/lib/clasificados/comida-local/createEmptyComidaLocalDraft";
import { loadComidaLocalDraftFromStorage } from "@/app/lib/clasificados/comida-local/comidaLocalDraftPersistence";
import {
  comidaLocalDraftHasPreviewContent,
  mapComidaLocalDraftToPreviewVm,
} from "@/app/lib/clasificados/comida-local/mapComidaLocalDraftToPreviewVm";
import type { ComidaLocalDraft } from "@/app/lib/clasificados/comida-local/comidaLocalTypes";

const PUBLISH_FORM_HREF = "/publicar/comida-local";

export function ComidaLocalPreviewClient() {
  const [draft, setDraft] = useState<ComidaLocalDraft | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = loadComidaLocalDraftFromStorage();
    setDraft(stored ?? createEmptyComidaLocalDraft());
    setReady(true);
  }, []);

  const vm = useMemo(() => {
    if (!draft) return null;
    return mapComidaLocalDraftToPreviewVm(draft);
  }, [draft]);

  const hasContent = draft ? comidaLocalDraftHasPreviewContent(draft) : false;

  if (!ready) {
    return (
      <div className="min-h-[40vh] bg-[#FFFCF7] px-4 py-16 text-center text-sm text-[#1E1814]/60">
        Cargando vista previa…
      </div>
    );
  }

  if (!hasContent || !vm) {
    return (
      <div className="min-h-[50vh] bg-[#FFFCF7] px-4 py-16">
        <div className="mx-auto max-w-lg rounded-2xl border border-[#D4C4A8]/80 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-[#1E1814]">Sin borrador de Comida Local</h1>
          <p className="mt-3 text-sm text-[#1E1814]/70">
            Aún no hay datos guardados en este navegador. Completa el formulario y vuelve a abrir la
            vista previa.
          </p>
          <Link
            href={PUBLISH_FORM_HREF}
            className="mt-6 inline-flex rounded-xl border border-[#7A1E2C] bg-[#7A1E2C] px-5 py-2.5 text-sm font-semibold text-[#FFFCF7] hover:bg-[#6a1a26]"
          >
            Ir al formulario
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFCF7] pb-16">
      <div className="border-b border-[#D4C4A8]/70 bg-[#FDF8F0]">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#7A1E2C]">
              Vista previa — Comida Local
            </p>
            <p className="mt-1 text-sm text-[#1E1814]/75">
              Esta vista previa no está publicada todavía.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={PUBLISH_FORM_HREF}
              className="inline-flex rounded-lg border border-[#D4C4A8] bg-white px-4 py-2 text-sm font-medium text-[#1E1814] hover:border-[#7A1E2C]/40"
            >
              Editar formulario
            </Link>
            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded-lg border border-[#7A1E2C]/30 bg-[#7A1E2C]/40 px-4 py-2 text-sm font-semibold text-[#FFFCF7]"
              title="Publicación próximamente"
            >
              Publicar próximamente
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {!vm.previewReady ? (
          <div className="mb-6 rounded-xl border border-[#D4C4A8]/70 bg-[#FDF8F0] px-4 py-3 text-xs text-[#7A1E2C]">
            <p className="font-semibold">Vista previa parcial</p>
            <ul className="mt-1 list-inside list-disc space-y-0.5">
              {vm.previewIssues.map((issue) => (
                <li key={`${issue.field}-${issue.message}`}>{issue.message}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <ComidaLocalDetailShell vm={vm} />
      </div>
    </div>
  );
}
