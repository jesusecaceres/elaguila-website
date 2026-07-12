"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AutoPrivadoPreviewPage } from "../components/AutoPrivadoPreviewPage";
import { AutosPrivadoPreviewEmptyState } from "../components/AutosPrivadoPreviewEmptyState";
import { AutosDraftPreviewErrorBoundary } from "@/app/clasificados/autos/shared/components/AutosDraftPreviewErrorBoundary";
import { loadAutosPrivadoDraftResolved, safeNormalizePrivadoListing } from "../lib/autosPrivadoDraftStorage";
import { resolveAutosPrivadoDraftNamespace, storageEventAffectsAutosPrivadoDraft } from "../lib/autosPrivadoDraftNamespace";
import { peekAutosDraftNamespaceHint } from "@/app/clasificados/autos/shared/lib/autosDraftPreviewNamespaceHint";
import { mockAutosPrivadoListing } from "../mock/mockAutosPrivadoListing";
import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { AutosPrivadoPreviewLocaleProvider, useAutosPrivadoPreviewCopy } from "../lib/AutosPrivadoPreviewLocaleContext";
import { withAutosEditorResumeFromPreview } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import { PublishCheckoutCheckpoint } from "@/app/(site)/clasificados/components/PublishCheckoutCheckpoint";
import { isAutosPreviewStructurallyComplete } from "@/app/clasificados/autos/shared/lib/autosPreviewCompleteness";
import {
  applyAutosPrivadoPreviewPromoCode,
  autosPrivadoPreviewCheckpointConfig,
  AUTOS_PRIVADO_NEWSLETTER_INTERESTS,
  AUTOS_PRIVADO_PREVIEW_RULES_MODAL,
} from "../lib/autosPrivadoPreviewPaidCheckout";
import { saveAutosPrivadoPendingBeforeCheckout } from "../lib/saveAutosPrivadoPendingBeforeCheckout";
import {
  redirectToRevenueCategoryCheckout,
  startRevenueCategoryCheckout,
} from "@/app/lib/listingPlans/revenueCategoryCheckoutClient";
import { AUTOS_PRIVADO_CHECKOUT } from "@/app/lib/listingPlans/revenueCategoryCheckoutPayload";
import {
  CHECKOUT_NEWSLETTER_SOURCES,
  captureCheckoutNewsletterSubscriber,
} from "@/app/lib/newsletter/checkoutNewsletterCapture";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";

const EDIT_BASE = "/publicar/autos/privado";

type AutosPrivadoPreviewMode = "empty" | "draft" | "mock" | "dashboard_edit";

function isDemoQuery(): boolean {
  if (typeof window === "undefined") return false;
  const q = new URLSearchParams(window.location.search);
  const v = q.get("demo");
  return v === "1" || v === "true";
}

function getDashboardEditListingId(): string | null {
  if (typeof window === "undefined") return null;
  const q = new URLSearchParams(window.location.search);
  if (q.get("source") !== "dashboard" || q.get("edit") !== "1") return null;
  const listingId = q.get("listingId")?.trim();
  return listingId || null;
}

async function resolvePreviewState(): Promise<{
  mode: AutosPrivadoPreviewMode;
  listing: AutoDealerListing;
}> {
  try {
    const demo = isDemoQuery();
    if (demo) {
      return {
        mode: "mock",
        listing: safeNormalizePrivadoListing({ ...mockAutosPrivadoListing, autosLane: "privado" }),
      };
    }

    const dashboardEditListingId = getDashboardEditListingId();
    if (dashboardEditListingId) {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token?.trim()) {
        const res = await fetch(`/api/clasificados/autos/listings/${encodeURIComponent(dashboardEditListingId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          lane?: string;
          listing?: AutoDealerListing;
        };
        if (res.ok && json.ok && json.lane === "privado" && json.listing) {
          return {
            mode: "dashboard_edit",
            listing: safeNormalizePrivadoListing({ ...json.listing, autosLane: "privado" }),
          };
        }
      }
    }

    const hint = peekAutosDraftNamespaceHint("privado");
    const resolved = await resolveAutosPrivadoDraftNamespace();

    let d = null as Awaited<ReturnType<typeof loadAutosPrivadoDraftResolved>>;
    if (hint) {
      d = await loadAutosPrivadoDraftResolved(hint);
    }
    if (!d) {
      d = await loadAutosPrivadoDraftResolved(resolved);
    }

    if (!d) {
      return { mode: "empty", listing: safeNormalizePrivadoListing(undefined) };
    }

    const normalized = safeNormalizePrivadoListing({ ...d.listing, autosLane: "privado" });
    return { mode: "draft", listing: normalized };
  } catch {
    return { mode: "empty", listing: safeNormalizePrivadoListing(undefined) };
  }
}

function AutosPrivadoPreviewInner({
  ready,
  mode,
  listing,
}: {
  ready: boolean;
  mode: AutosPrivadoPreviewMode;
  listing: AutoDealerListing;
}) {
  const { lang } = useAutosPrivadoPreviewCopy();
  const cardLang = lang === "en" ? "en" : "es";
  const [dashboardEditListingId, setDashboardEditListingId] = useState("");
  useEffect(() => {
    setDashboardEditListingId(getDashboardEditListingId() ?? "");
  }, []);
  const editBaseHref = dashboardEditListingId
    ? `${EDIT_BASE}?${new URLSearchParams({
        edit: "1",
        source: "dashboard",
        listingId: dashboardEditListingId,
        returnPanel: "autos",
      }).toString()}`
    : EDIT_BASE;
  const editBackHref = withAutosEditorResumeFromPreview(editBaseHref, lang);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutErr, setCheckoutErr] = useState<string | null>(null);

  const showSellerCheckout = mode === "draft";
  const publishReadinessOk = useMemo(
    () => isAutosPreviewStructurallyComplete("privado", listing),
    [listing],
  );
  const checkpointConfig = useMemo(() => autosPrivadoPreviewCheckpointConfig(cardLang), [cardLang]);

  const handlePromoApply = useCallback(
    async (code: string) => applyAutosPrivadoPreviewPromoCode({ code, lang: cardLang }),
    [cardLang],
  );

  const onCheckout = useCallback(
    async (ctx: { newsletterOptIn: boolean; promoCode: string | null }) => {
      setCheckoutErr(null);
      setCheckoutBusy(true);

      if (!publishReadinessOk) {
        setCheckoutBusy(false);
        setCheckoutErr(
          cardLang === "es"
            ? "Completa los campos requeridos en el formulario antes de iniciar el pago seguro."
            : "Complete the required fields in the form before starting secure checkout.",
        );
        return;
      }

      const supabase = createSupabaseBrowserClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token ?? null;
      const customerEmail = sessionData.session?.user?.email ?? null;

      if (!accessToken) {
        setCheckoutBusy(false);
        setCheckoutErr(
          cardLang === "es"
            ? "Inicia sesión para continuar al pago seguro."
            : "Sign in to continue to secure checkout.",
        );
        return;
      }

      void captureCheckoutNewsletterSubscriber({
        email: customerEmail,
        lang: cardLang,
        preferredLanguage: cardLang,
        source: CHECKOUT_NEWSLETTER_SOURCES.autosPrivado,
        interests: AUTOS_PRIVADO_NEWSLETTER_INTERESTS,
        checked: ctx.newsletterOptIn,
      });

      const pending = await saveAutosPrivadoPendingBeforeCheckout({
        listing,
        lang: cardLang,
        accessToken,
      });
      if (!pending.ok) {
        setCheckoutBusy(false);
        setCheckoutErr(pending.userMessage);
        return;
      }

      let leonixAdId = pending.leonixAdId;
      if (!leonixAdId) {
        try {
          const ownerRes = await fetch(`/api/clasificados/autos/listings/${pending.listingId}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (ownerRes.ok) {
            const ownerJson = (await ownerRes.json()) as { leonixAdId?: string | null };
            leonixAdId = ownerJson.leonixAdId?.trim() || null;
          }
        } catch {
          /* optional metadata */
        }
      }

      const checkout = await startRevenueCategoryCheckout({
        ...AUTOS_PRIVADO_CHECKOUT,
        listingId: pending.listingId,
        leonixAdId,
        locale: cardLang,
        customerEmail,
        promoCode: ctx.promoCode,
      });
      setCheckoutBusy(false);
      if (!checkout.ok) {
        setCheckoutErr(checkout.userMessage);
        return;
      }

      redirectToRevenueCategoryCheckout(checkout.checkoutUrl);
    },
    [cardLang, listing, publishReadinessOk],
  );

  if (!ready) {
    return <div className="min-h-[50vh] bg-[color:var(--lx-page)]" aria-busy="true" />;
  }

  if (mode === "empty") {
    return <AutosPrivadoPreviewEmptyState />;
  }

  return (
    <AutosDraftPreviewErrorBoundary logLabel="privado" fallback={<AutosPrivadoPreviewEmptyState />}>
      <AutoPrivadoPreviewPage data={listing} editBackHref={editBackHref} />

      {showSellerCheckout ? (
        <div className="mx-auto mt-8 max-w-3xl px-4 pb-12 sm:px-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-[#1E1810]">
              {cardLang === "en" ? "Final checkout" : "Pago final"}
            </h2>
            <p className="mt-1 text-sm text-[#5C5346]">
              {cardLang === "en"
                ? "The preview above does not require confirmations. Complete the summary and checkboxes below only when you are ready for secure payment."
                : "La vista previa no requiere confirmaciones. Completa el resumen y las casillas abajo solo cuando estés listo para el pago seguro."}
            </p>
          </div>
          <PublishCheckoutCheckpoint
            id="autos-privado-publish-checkout-checkpoint"
            config={checkpointConfig}
            lang={cardLang}
            busy={checkoutBusy}
            errorMessage={checkoutErr}
            draftReady={publishReadinessOk}
            draftReadyMessage={
              publishReadinessOk
                ? null
                : cardLang === "es"
                  ? "Completa los campos requeridos en el formulario antes de iniciar el pago seguro."
                  : "Complete the required fields in the form before starting secure checkout."
            }
            onPromoApply={handlePromoApply}
            onCheckout={(ctx) => void onCheckout(ctx)}
            editHref={editBackHref}
            rulesModal={AUTOS_PRIVADO_PREVIEW_RULES_MODAL}
          />
        </div>
      ) : null}
    </AutosDraftPreviewErrorBoundary>
  );
}

export function AutosPrivadoPreviewClient() {
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<AutosPrivadoPreviewMode>("empty");
  const [listing, setListing] = useState<AutoDealerListing>(() => safeNormalizePrivadoListing(undefined));
  const [recoverHint, setRecoverHint] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const next = await resolvePreviewState();
      setRecoverHint(null);
      setMode(next.mode);
      setListing(next.listing);
    } catch {
      setMode("empty");
      setListing(safeNormalizePrivadoListing(undefined));
      if (process.env.NODE_ENV === "development") {
        setRecoverHint("Preview fell back to empty state after an unexpected error");
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await refresh();
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (storageEventAffectsAutosPrivadoDraft(e.key)) void refresh();
    }
    function onFocus() {
      void refresh();
    }
    function onPopState() {
      void refresh();
    }
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("popstate", onPopState);
    };
  }, [refresh]);

  return (
    <AutosPrivadoPreviewLocaleProvider>
      {process.env.NODE_ENV === "development" && recoverHint ? (
        <p
          className="mx-auto max-w-3xl px-4 pt-2 text-xs text-amber-900/90 dark:text-amber-100/90"
          role="note"
        >
          {recoverHint}
        </p>
      ) : null}
      <AutosPrivadoPreviewInner ready={ready} mode={mode} listing={listing} />
    </AutosPrivadoPreviewLocaleProvider>
  );
}
