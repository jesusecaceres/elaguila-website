"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { normalizeLang } from "@/app/lib/language";
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
import {
  CHECKOUT_NEWSLETTER_SOURCES,
  captureCheckoutNewsletterSubscriber,
} from "@/app/lib/newsletter/checkoutNewsletterCapture";

const PUBLISH_FORM_HREF = "/publicar/comida-local";

export function ComidaLocalPreviewClient() {
  const searchParams = useSearchParams();
  const routeLang = normalizeLang(searchParams?.get("lang"));
  const es = routeLang !== "en";
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
    ? `${PUBLISH_FORM_HREF}?edit=1&listingId=${encodeURIComponent(editListingId)}&lang=${routeLang}`
    : `${PUBLISH_FORM_HREF}?lang=${routeLang}`;

  const vm = useMemo(() => {
    if (!draft) return null;
    return mapComidaLocalDraftToPreviewVm(draft, es ? "es" : "en");
  }, [draft, es]);

  const hasContent = draft ? comidaLocalDraftHasPreviewContent(draft) : false;

  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Newsletter Engine v2 — Comida Local's Stripe checkout only just shipped and previously never
  // captured the newsletter opt-in checkbox at all (the checkbox rendered via the shared
  // PublishCheckoutCheckpoint, but `onCheckout` below ignored its `ctx` entirely). Resolve the
  // session email up front so it can be shown/edited before checkout starts, matching Servicios
  // and Restaurantes.
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterCaptureNote, setNewsletterCaptureNote] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const sb = createSupabaseBrowserClient();
        const { data: sess } = await sb.auth.getSession();
        const email = sess.session?.user?.email ?? "";
        if (!cancelled) setNewsletterEmail((prev) => (prev ? prev : email));
      } catch {
        // Best-effort prefill only — the field stays editable/empty either way.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const publishIssues = useMemo(
    () => (draft ? validateComidaLocalDraftForFuturePublish(draft, es) : []),
    [draft, es],
  );
  const publishReady = publishIssues.every((i) => i.severity !== "error");

  const onCheckout = useCallback(
    async (ctx: { newsletterOptIn: boolean }) => {
      if (!draft) return;
      setCheckoutBusy(true);
      setCheckoutError(null);
      setNewsletterCaptureNote(null);
      try {
        saveComidaLocalDraftToStorage(draft);
        const sb = createSupabaseBrowserClient();
        const { data: sess } = await sb.auth.getSession();
        const accessToken = sess.session?.access_token ?? null;
        const customerEmail = sess.session?.user?.email ?? null;
        if (!accessToken) {
          setCheckoutError(es ? "Inicia sesión para continuar al pago." : "Sign in to continue to payment.");
          setCheckoutBusy(false);
          return;
        }

        // Best-effort newsletter capture — awaited (never fire-and-forget `void`) so a FAILED
        // result can be surfaced, but never blocks/gates checkout. This was previously not wired
        // at all for Comida Local; the opt-in checkbox rendered but nothing captured it.
        const captureEmail = newsletterEmail.trim() || customerEmail;
        const capturePromise = captureCheckoutNewsletterSubscriber({
          email: captureEmail,
          lang: es ? "es" : "en",
          preferredLanguage: es ? "es" : "en",
          source: CHECKOUT_NEWSLETTER_SOURCES.comidaLocal,
          interests: ["package:comida_local_base_monthly"],
          checked: ctx.newsletterOptIn,
        });

        const pending = await saveComidaLocalPendingBeforeCheckout({
          draft,
          lang: es ? "es" : "en",
          accessToken,
        });

        const captureResult = await capturePromise;
        if (captureResult.status === "FAILED") {
          console.warn("[comida-local] newsletter checkout capture failed", captureResult.reason);
          setNewsletterCaptureNote(
            es
              ? "No pudimos guardar tu suscripción al boletín. Tu pago no se vio afectado."
              : "We couldn't save your newsletter subscription. Your payment wasn't affected.",
          );
        }

        if (!pending.ok) {
          setCheckoutError(pending.userMessage);
          setCheckoutBusy(false);
          return;
        }

        const checkout = await startRevenueCategoryCheckout({
          ...COMIDA_LOCAL_BASE_CHECKOUT,
          listingId: pending.listingId,
          leonixAdId: pending.leonixAdId,
          locale: es ? "es" : "en",
          customerEmail,
        });

        if (!checkout.ok) {
          setCheckoutError(checkout.userMessage);
          setCheckoutBusy(false);
          return;
        }

        redirectToRevenueCategoryCheckout(checkout.checkoutUrl);
      } catch {
        setCheckoutError(
          es
            ? "No pudimos iniciar el pago seguro. Intenta de nuevo o contacta a Leonix."
            : "We couldn't start secure payment. Try again or contact Leonix.",
        );
        setCheckoutBusy(false);
      }
    },
    [draft, newsletterEmail, es],
  );

  const checkoutConfig: PublishCheckpointConfig | null = draft
    ? {
        category: COMIDA_LOCAL_BASE_CHECKOUT.category,
        packageKey: COMIDA_LOCAL_BASE_CHECKOUT.packageKey,
        lang: es ? "es" : "en",
        mode: "checkout",
        confirmations: COMIDA_LOCAL_CHECKPOINT_CONFIRMATIONS,
      }
    : null;

  if (!ready) {
    return (
      <div className={`${CL_PAGE} px-4 py-16 text-center text-sm text-[#1E1814]/60`}>
        {es ? "Cargando vista previa…" : "Loading preview…"}
      </div>
    );
  }

  if (!hasContent || !vm) {
    return (
      <div className={`${CL_PAGE} px-4 py-16`}>
        <div className={`${CL_PANEL} mx-auto max-w-lg p-8 text-center`}>
          <h1 className="text-xl font-bold text-[#1E1814]">
            {es ? "Sin borrador de Comida Local" : "No Local Food draft"}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#1E1814]/70">
            {es
              ? "Aún no hay datos guardados en este navegador. Completa el formulario y vuelve a abrir la vista previa."
              : "There's no data saved in this browser yet. Fill out the form and open the preview again."}
          </p>
          <Link href={backToEditHref} className={`${CL_BTN_PRIMARY} mt-6`}>
            {es ? "Ir al formulario" : "Go to the form"}
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
              {previewMode === "edit-draft"
                ? es
                  ? "Vista previa · Edición"
                  : "Preview · Editing"
                : es
                  ? "Vista previa · no publicada"
                  : "Preview · not published"}
            </p>
            <p className="mt-1 text-sm text-[#1E1814]/72">
              {previewMode === "edit-draft"
                ? es
                  ? "Así se verán tus cambios. Regresa al formulario y guarda para actualizar el mismo anuncio publicado."
                  : "This is how your changes will look. Go back to the form and save to update the same published listing."
                : es
                  ? "Así se verá tu ficha. Solo tú ves esta página — no tiene ID Leonix ni aparece en resultados."
                  : "This is how your listing will look. Only you can see this page — it has no Leonix ID and doesn't appear in results."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={backToEditHref} className={CL_BTN_SECONDARY}>
              {previewMode === "edit-draft"
                ? es
                  ? "Volver a editar"
                  : "Back to edit"
                : es
                  ? "Editar formulario"
                  : "Edit form"}
            </Link>
            {previewMode === "edit-draft" ? (
              <Link href={backToEditHref} className={CL_BTN_PRIMARY}>
                {es ? "Guardar desde formulario" : "Save from the form"}
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <div className={`${CL_CONTAINER_NARROW} py-6 sm:py-8`}>
        {!vm.previewReady ? (
          <div className="mb-5 rounded-lg border border-[#D4C4A8]/70 bg-[#FDF8F0] px-4 py-3 text-xs text-[#7A1E2C]">
            <p className="font-semibold">{es ? "Vista previa parcial" : "Partial preview"}</p>
            <ul className="mt-1 list-inside list-disc space-y-0.5">
              {vm.previewIssues.map((issue) => (
                <li key={`${issue.field}-${issue.message}`}>{issue.message}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <ComidaLocalDetailShell vm={vm} lang={es ? "es" : "en"} />

        {previewMode === "new-publish" && checkoutConfig ? (
          <div className="mt-6">
            <PublishCheckoutCheckpoint
              config={checkoutConfig}
              lang={es ? "es" : "en"}
              busy={checkoutBusy}
              errorMessage={checkoutError}
              draftReady={publishReady}
              draftReadyMessage={
                publishReady
                  ? null
                  : es
                    ? "Completa los campos de «Lista para publicar» en el formulario para habilitar el pago."
                    : "Complete the fields in the “Ready to publish” checklist in the form to enable payment."
              }
              onCheckout={(ctx) => void onCheckout(ctx)}
              newsletterEmail={newsletterEmail}
              onNewsletterEmailChange={setNewsletterEmail}
              newsletterCaptureNote={newsletterCaptureNote}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
