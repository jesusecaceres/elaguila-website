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
import {
  clearComidaLocalEditContext,
  fetchOwnerComidaLocalListingForEdit,
  readComidaLocalEditContext,
  resolveComidaLocalPreviewEditTarget,
  writeComidaLocalEditContext,
} from "@/app/lib/clasificados/comida-local/comidaLocalListingEditContext";
import {
  decideComidaLocalPreviewCheckout,
  isComidaLocalAwaitingPayment,
} from "@/app/lib/clasificados/comida-local/comidaLocalPaymentResume";
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

  /** The listing row's REAL status (owner-scoped read), or null while unknown. Drives the payment-resume
   * checkout: only a `pending_payment` row ever shows checkout in a listing-bound preview. */
  const [editRowStatus, setEditRowStatus] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const marker = readComidaLocalEditContext();
      let sessionUserId = "";
      try {
        const { data: sess0 } = await createSupabaseBrowserClient().auth.getSession();
        sessionUserId = sess0.session?.user?.id ?? "";
      } catch {
        sessionUserId = "";
      }
      // Gate 2 (edit-context marker): URL param wins; the marker (one browser-global localStorage key) only backs up a
      // payment-resume that lost its query string, and ONLY for the signed-in owner's own `pending_payment` row. A stale
      // marker from an abandoned edit or another account never turns a NEW application preview into an old listing.
      const target = resolveComidaLocalPreviewEditTarget({ urlListingId: editListingIdParam, marker, sessionUserId });
      let resolvedEditId = target.listingId;
      if (!resolvedEditId && marker) clearComidaLocalEditContext();
      const editStorageKey = resolvedEditId ? comidaLocalEditWorkspaceStorageKey(resolvedEditId) : undefined;
      let editWorkspace = editStorageKey ? loadComidaLocalDraftFromStorage(editStorageKey) : null;
      let rowStatus: string | null = null;
      if (resolvedEditId) {
        // Owner-scoped truth of the row (status), and - closeout 2 payment resume - self-hydration when the
        // owner arrives straight from the dashboard ("Completar pago") with no edit workspace in this
        // browser. The draft's draftListingId is forced to the ROW's own value so the pending save is a
        // SAME-ROW update, never a duplicate.
        try {
          const sb = createSupabaseBrowserClient();
          const { data: sess } = await sb.auth.getSession();
          const ownerUserId = sess.session?.user?.id ?? "";
          if (ownerUserId) {
            const hydrated = await fetchOwnerComidaLocalListingForEdit(sb, { ownerUserId, listingId: resolvedEditId });
            if (hydrated.ok) {
              rowStatus = hydrated.context.status || null;
              if (!editWorkspace && editStorageKey) {
                editWorkspace = hydrated.draft;
                saveComidaLocalDraftToStorage(hydrated.draft, editStorageKey);
                writeComidaLocalEditContext(hydrated.context);
              } else if (editWorkspace && editWorkspace.draftListingId !== hydrated.context.draftListingId) {
                editWorkspace = { ...editWorkspace, draftListingId: hydrated.context.draftListingId };
              }
            }
          }
        } catch {
          rowStatus = null; // unknown status fails closed: no checkout is offered on a bound preview
        }
      }
      if (cancelled) return;
      // A marker fallback is only valid while the row is still awaiting payment: once it was paid / changed, the
      // preview is a fresh application again (and the stale marker is dropped).
      if (target.source === "marker" && !isComidaLocalAwaitingPayment(rowStatus)) {
        clearComidaLocalEditContext();
        resolvedEditId = "";
        editWorkspace = null;
      }
      if (resolvedEditId && editWorkspace) {
        setEditListingId(resolvedEditId);
        setEditRowStatus(rowStatus);
        setDraft(editWorkspace);
      } else {
        setEditListingId("");
        setEditRowStatus(null);
        setDraft(loadComidaLocalDraftFromStorage() ?? createEmptyComidaLocalDraft());
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [editListingIdParam]);

  const previewMode = resolvePreviewMode({ listingBound: Boolean(editListingId), hasUnsavedEditDraft: Boolean(editListingId) });
  // Closeout 2 - payment resume: a listing-bound row still `pending_payment` shows the SAME base checkout
  // (COMIDA_LOCAL_BASE_CHECKOUT) against the SAME row. Every other bound status is edit-only (no re-charge).
  const checkoutMode = decideComidaLocalPreviewCheckout({ listingBound: Boolean(editListingId), rowStatus: editRowStatus });
  const resumingPayment = checkoutMode === "resume_payment";
  const backToEditHref = editListingId
    ? `${PUBLISH_FORM_HREF}?edit=1&listingId=${encodeURIComponent(editListingId)}&lang=${routeLang}`
    : `${PUBLISH_FORM_HREF}?lang=${routeLang}`;

  const vm = useMemo(() => {
    if (!draft) return null;
    // Gate COMIDA-LOCAL-1 — this is the OWNER looking at their own draft, so "Encuéntrame Hoy"
    // shows their current draft truth even when it is stale (the PM decision allows exactly
    // this), together with an explicit warning that a stale location is not public. The
    // published vitrina uses `viewer: "public"` and drops it instead.
    return mapComidaLocalDraftToPreviewVm(draft, es ? "es" : "en", {
      viewer: "owner",
      ownerListingPublished: Boolean(editListingId) && !isComidaLocalAwaitingPayment(editRowStatus),
    });
  }, [draft, es, editListingId, editRowStatus]);

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
  /** Gate COMIDA-LOCAL-1 — non-blocking owner notice when the shared media contract could not
   * persist some selected photos. Same channel/behavior as the newsletter capture note. */
  const [mediaDroppedNote, setMediaDroppedNote] = useState<string | null>(null);

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
    async (ctx: {
      newsletterOptIn: boolean;
      recurringConsent?: { accepted: true; consentTextVersion: string; lang: "es" | "en" } | null;
    }) => {
      if (!draft) return;
      setCheckoutBusy(true);
      setCheckoutError(null);
      setNewsletterCaptureNote(null);
      try {
        // draftWorkspaceContract Rule 1: a listing-bound (payment-resume) preview writes only its own EDIT
        // workspace, never the new-ad draft key.
        if (editListingId) saveComidaLocalDraftToStorage(draft, comidaLocalEditWorkspaceStorageKey(editListingId));
        else saveComidaLocalDraftToStorage(draft);
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

        // Gate 2 (item 12): a payment RESUME must pay the SAME listing row. The pending save is keyed on the row's own
        // draft_listing_id; if it ever resolved to a different row we stop BEFORE opening a checkout for it.
        if (editListingId && pending.listingId !== editListingId) {
          setCheckoutError(
            es
              ? "No pudimos confirmar que el pago corresponde a este mismo anuncio. Actualiza la página e inténtalo de nuevo."
              : "We could not confirm the payment belongs to this same listing. Refresh the page and try again.",
          );
          setCheckoutBusy(false);
          return;
        }

        // Gate COMIDA-LOCAL-1 — the save SUCCEEDED, but the shared media contract could not
        // persist some selected photos. Never block checkout for this (the payment is
        // unaffected); the owner is simply told what did not save, on the same non-blocking
        // note channel the newsletter capture failure already uses.
        if (pending.droppedUnpersistableMedia?.length) {
          const n = pending.droppedUnpersistableMedia.length;
          setMediaDroppedNote(
            es
              ? `${n} foto(s) no se pudieron guardar y no están en tu anuncio. Abre «Volver a editar», agrégalas de nuevo y guarda.`
              : `${n} photo(s) could not be saved and are not on your listing. Open "Back to edit", add them again, and save.`,
          );
        }

        const checkout = await startRevenueCategoryCheckout({
          ...COMIDA_LOCAL_BASE_CHECKOUT,
          listingId: pending.listingId,
          leonixAdId: pending.leonixAdId,
          locale: es ? "es" : "en",
          customerEmail,
          // comida_local_base_monthly is a subscription: the server hard-requires the versioned recurring-billing
          // consent the checkpoint collected (Agreement v1.2 §17).
          recurringConsent: ctx.recurringConsent ?? null,
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
    [draft, newsletterEmail, es, editListingId],
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
              {resumingPayment
                ? es
                  ? "Vista previa · Pago pendiente"
                  : "Preview · Payment pending"
                : previewMode === "edit-draft"
                ? es
                  ? "Vista previa · Edición"
                  : "Preview · Editing"
                : es
                  ? "Vista previa · no publicada"
                  : "Preview · not published"}
            </p>
            <p className="mt-1 text-sm text-[#1E1814]/72">
              {resumingPayment
                ? es
                  ? "Tu ficha ya está guardada pero aún no está publicada. Completa el pago abajo para publicarla — se usa el mismo anuncio, no se crea uno nuevo."
                  : "Your listing is saved but not published yet. Complete payment below to publish it — this uses the same listing, no new one is created."
                : previewMode === "edit-draft"
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
            {previewMode === "edit-draft" && !resumingPayment ? (
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

        {mediaDroppedNote ? (
          <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900">
            {mediaDroppedNote}
          </div>
        ) : null}

        {(previewMode === "new-publish" || resumingPayment) && checkoutConfig ? (
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
