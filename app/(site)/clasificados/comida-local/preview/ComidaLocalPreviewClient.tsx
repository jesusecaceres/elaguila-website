"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
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
import {
  comidaLocalEditWorkspaceStorageKey,
  loadComidaLocalDraftFromStorage,
} from "@/app/lib/clasificados/comida-local/comidaLocalDraftPersistence";
import { readComidaLocalEditContext } from "@/app/lib/clasificados/comida-local/comidaLocalListingEditContext";
import {
  comidaLocalDraftHasPreviewContent,
  mapComidaLocalDraftToPreviewVm,
} from "@/app/lib/clasificados/comida-local/mapComidaLocalDraftToPreviewVm";
import type { ComidaLocalDraft } from "@/app/lib/clasificados/comida-local/comidaLocalTypes";
import { resolvePreviewMode } from "@/app/lib/listingIdentity/previewModeContract";

const PUBLISH_FORM_HREF = "/publicar/comida-local";

export function ComidaLocalPreviewClient() {
  const searchParams = useSearchParams();
  const [draft, setDraft] = useState<ComidaLocalDraft | null>(null);
  const [ready, setReady] = useState(false);

  /* Globalization Package A closure — edit-draft preview. When reached from the listing-edit
   * flow (?edit=1&listingId=..., with the hard-refresh-safe edit-context marker as fallback),
   * this previews the per-listing EDIT workspace (draftWorkspaceContract Rule 1 — never the
   * new-ad draft) and resolves "edit-draft" on the shared preview-mode contract. This lane is
   * free — there is no checkout to suppress (pinned by gate-pkgA-preview-modes). */
  const editListingIdParam = ((searchParams?.get("edit") ?? "") === "1" ? searchParams?.get("listingId") ?? "" : "").trim();
  const [editListingId, setEditListingId] = useState<string>(editListingIdParam);

  useEffect(() => {
    const marker = readComidaLocalEditContext();
    // URL param wins; the marker only backs up a hard refresh that lost the query string AND
    // only when it matches an existing edit workspace.
    const resolvedEditId = editListingIdParam || (marker ? marker.listingId : "");
    const editWorkspace = resolvedEditId
      ? loadComidaLocalDraftFromStorage(comidaLocalEditWorkspaceStorageKey(resolvedEditId))
      : null;
    if (resolvedEditId && editWorkspace) {
      setEditListingId(resolvedEditId);
      setDraft(editWorkspace);
    } else {
      setEditListingId("");
      setDraft(loadComidaLocalDraftFromStorage() ?? createEmptyComidaLocalDraft());
    }
    setReady(true);
  }, [editListingIdParam]);

  const previewMode = resolvePreviewMode({ listingBound: Boolean(editListingId), hasUnsavedEditDraft: Boolean(editListingId) });
  const backToEditHref = editListingId
    ? `${PUBLISH_FORM_HREF}?edit=1&listingId=${encodeURIComponent(editListingId)}`
    : PUBLISH_FORM_HREF;

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
          <Link href={backToEditHref} className={`${CL_BTN_PRIMARY} mt-6`}>
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
            <p className={CL_EYEBROW}>
              {previewMode === "edit-draft" ? "Vista previa · Edición" : "Vista previa · no publicada"}
            </p>
            <p className="mt-1 text-sm text-[#1E1814]/72">
              {previewMode === "edit-draft"
                ? "Así se verán tus cambios. Regresa al formulario y guarda para actualizar el mismo anuncio publicado."
                : "Así se verá tu ficha. Solo tú ves esta página — no tiene ID Leonix ni aparece en resultados."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={backToEditHref} className={CL_BTN_SECONDARY}>
              {previewMode === "edit-draft" ? "Volver a editar" : "Editar formulario"}
            </Link>
            <Link href={backToEditHref} className={CL_BTN_PRIMARY}>
              {previewMode === "edit-draft" ? "Guardar desde formulario" : "Publicar desde formulario"}
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
