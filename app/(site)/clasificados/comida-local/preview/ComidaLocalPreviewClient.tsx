"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  saveComidaLocalDraftToStorage,
} from "@/app/lib/clasificados/comida-local/comidaLocalDraftPersistence";
import { readComidaLocalEditContext } from "@/app/lib/clasificados/comida-local/comidaLocalListingEditContext";
import {
  comidaLocalDraftHasPreviewContent,
  mapComidaLocalDraftToPreviewVm,
} from "@/app/lib/clasificados/comida-local/mapComidaLocalDraftToPreviewVm";
import type { ComidaLocalDraft } from "@/app/lib/clasificados/comida-local/comidaLocalTypes";
import { resolvePreviewMode } from "@/app/lib/listingIdentity/previewModeContract";
import { PublishCheckoutCheckpoint } from "@/app/(site)/clasificados/components/PublishCheckoutCheckpoint";
import { COMIDA_LOCAL_CHECKPOINT_CONFIRMATIONS, type PublishCheckpointConfig } from "@/app/lib/listingPlans/publishCheckoutCheckpoint";
import { COMIDA_LOCAL_BASE_CHECKOUT } from "@/app/lib/listingPlans/revenueCategoryCheckoutPayload";
import { redirectToRevenueCategoryCheckout, startRevenueCategoryCheckout } from "@/app/lib/listingPlans/revenueCategoryCheckoutClient";
import { saveComidaLocalPendingBeforeCheckout } from "../lib/saveComidaLocalPendingBeforeCheckout";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { validateComidaLocalDraftForFuturePublish } from "@/app/lib/clasificados/comida-local/comidaLocalValidation";

const PUBLISH_FORM_HREF = "/publicar/comida-local";

export function ComidaLocalPreviewClient() {
  const searchParams = useSearchParams();
  const [draft, setDraft] = useState<ComidaLocalDraft | null>(null);
  const [ready, setReady] = useState(false);

  /* Globalization Package A closure — edit-draft preview. When reached from the listing-edit
   * flow (?edit=1&listingId=..., with the hard-refresh-safe edit-context marker as fallback),
   * this previews the per-listing EDIT workspace (draftWorkspaceContract Rule 1 — never the
   * new-ad draft) and resolves "edit-draft" on the shared preview-mode contract. Gate D19 — this
   * lane saves directly (no re-checkout on an already-paid listing); the checkout checkpoint
   * below only renders for previewMode === "new-publish". */
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

  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const publishIssues = useMemo(
    () => (draft ? validateComidaLocalDraftForFuturePublish(draft) : []),
    [draft],
  );
  const publishReady = publishIssues.every((i) => i.severity !== "error");

  const onCheckout = useCallback(async () => {
    if (!draft) return;
    setCheckoutBusy(true);
    setCheckoutError(null);
    try {
      saveComidaLocalDraftToStorage(draft);
      const sb = createSupabaseBrowserClient();
      const { data: sess } = await sb.auth.getSession();
      const accessToken = sess.session?.access_token ?? null;
      const customerEmail = sess.session?.user?.email ?? null;
      if (!accessToken) {
        setCheckoutError("Inicia sesión para continuar al pago.");
        setCheckoutBusy(false);
        return;
      }

      const pending = await saveComidaLocalPendingBeforeCheckout({ draft, lang: "es", accessToken });
      if (!pending.ok) {
        setCheckoutError(pending.userMessage);
        setCheckoutBusy(false);
        return;
      }

      const checkout = await startRevenueCategoryCheckout({
        ...COMIDA_LOCAL_BASE_CHECKOUT,
        listingId: pending.listingId,
        leonixAdId: pending.leonixAdId,
        locale: "es",
        customerEmail,
      });

      if (!checkout.ok) {
        setCheckoutError(checkout.userMessage);
        setCheckoutBusy(false);
        return;
      }

      redirectToRevenueCategoryCheckout(checkout.checkoutUrl);
    } catch {
      setCheckoutError("No pudimos iniciar el pago seguro. Intenta de nuevo o contacta a Leonix.");
      setCheckoutBusy(false);
    }
  }, [draft]);

  const checkoutConfig: PublishCheckpointConfig | null = draft
    ? {
        category: COMIDA_LOCAL_BASE_CHECKOUT.category,
        packageKey: COMIDA_LOCAL_BASE_CHECKOUT.packageKey,
        lang: "es",
        mode: "checkout",
        confirmations: COMIDA_LOCAL_CHECKPOINT_CONFIRMATIONS,
      }
    : null;

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
            {previewMode === "edit-draft" ? (
              <Link href={backToEditHref} className={CL_BTN_PRIMARY}>
                Guardar desde formulario
              </Link>
            ) : null}
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

        {previewMode === "new-publish" && checkoutConfig ? (
          <div className="mt-6">
            <PublishCheckoutCheckpoint
              config={checkoutConfig}
              lang="es"
              busy={checkoutBusy}
              errorMessage={checkoutError}
              draftReady={publishReady}
              draftReadyMessage={
                publishReady
                  ? null
                  : "Completa los campos de «Lista para publicar» en el formulario para habilitar el pago."
              }
              onCheckout={() => void onCheckout()}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
