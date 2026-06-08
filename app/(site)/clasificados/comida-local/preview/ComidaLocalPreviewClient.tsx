"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ComidaLocalDetailShell } from "../components/ComidaLocalDetailShell";
import {
  CL_BTN_PRIMARY,
  CL_BTN_SECONDARY,
  CL_CONTAINER_NARROW,
  CL_EYEBROW,
  CL_HEADER_BAR,
  CL_PAGE,
  CL_PANEL,
} from "../components/comidaLocalCustomerStyles";
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
      <div className={`${CL_PAGE} px-4 py-16 text-center text-sm text-[#1E1814]/60`}>
        Cargando vista previa…
      </div>
    );
  }

  if (!hasContent || !vm) {
    return (
      <div className={`${CL_PAGE} px-4 py-16`}>
        <div className={`${CL_PANEL} mx-auto max-w-lg p-8 text-center`}>
          <h1 className="text-xl font-bold text-[#1E1814]">Sin borrador de Comida Local</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#1E1814]/70">
            Aún no hay datos guardados en este navegador. Completa el formulario y vuelve a abrir la
            vista previa.
          </p>
          <Link href={PUBLISH_FORM_HREF} className={`${CL_BTN_PRIMARY} mt-6`}>
            Ir al formulario
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={CL_PAGE}>
      <div className={`${CL_HEADER_BAR} border-[#C4A35A]/50`}>
        <div className={`${CL_CONTAINER_NARROW} flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between`}>
          <div>
            <p className={CL_EYEBROW}>Vista previa · no publicada</p>
            <p className="mt-1 text-sm text-[#1E1814]/72">
              Así se verá tu ficha. Solo tú ves esta página — no tiene ID Leonix ni aparece en
              resultados.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={PUBLISH_FORM_HREF} className={CL_BTN_SECONDARY}>
              Editar formulario
            </Link>
            <Link href={PUBLISH_FORM_HREF} className={CL_BTN_PRIMARY}>
              Ir a publicar
            </Link>
          </div>
        </div>
      </div>

      <div className={`${CL_CONTAINER_NARROW} py-6 sm:py-8`}>
        {!vm.previewReady ? (
          <div className="mb-5 rounded-lg border border-[#D4C4A8]/70 bg-[#FDF8F0] px-4 py-3 text-xs text-[#7A1E2C]">
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
