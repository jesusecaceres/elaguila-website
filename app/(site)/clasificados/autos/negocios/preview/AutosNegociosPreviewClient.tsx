"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AutoDealerPreviewPage } from "../components/AutoDealerPreviewPage";
import { AutoDealerPreviewChrome } from "../components/AutoDealerPreviewChrome";
import { AutosNegociosPreviewEmptyState } from "../components/AutosNegociosPreviewEmptyState";
import { loadAutosNegociosCanonicalActiveDraft } from "@/app/lib/clasificados/autos/autosNegociosCanonicalDraftLoad";
import { safeNormalizeAutosDraftListing } from "@/app/clasificados/autos/shared/lib/safeNormalizeAutosDraftListing";
import { mockAutoDealerListing } from "../mock/mockAutoDealerListing";
import type { AutoDealerListing } from "../types/autoDealerListing";
import { AutosNegociosPreviewLocaleProvider, useAutosNegociosPreviewCopy } from "../lib/AutosNegociosPreviewLocaleContext";
import { buildAutosNegociosEditorResumeHref } from "@/app/lib/clasificados/autos/autosDealerInventoryAddFlow";
import {
  migrateLegacyAutosNegociosDraftJsonToNamespace,
  storageEventAffectsAutosNegociosDraft,
} from "../lib/autosNegociosDraftNamespace";
import { AutosNegociosPreviewInventorySection } from "../components/AutosNegociosPreviewInventorySection";
import { AutosNegociosPreviewCaptureBanner } from "../components/AutosNegociosPreviewCaptureBanner";
import { AutosNegociosResultsCardPreview } from "@/app/(site)/publicar/autos/negocios/components/AutosNegociosResultsCardPreview";
import type { AutosAdditionalInventoryVehicleDraft } from "@/app/lib/clasificados/autos/autosAdditionalInventoryDraft";
import { AutosDraftPreviewErrorBoundary } from "@/app/clasificados/autos/shared/components/AutosDraftPreviewErrorBoundary";
import { AutosNegociosPreviewPromiseStrip } from "../components/AutosNegociosPreviewPromiseStrip";
import { mapAutosNegociosBuyerPreviewViewModel } from "@/app/lib/clasificados/autos/mapAutosNegociosBuyerPreviewViewModel";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { PublishCheckoutCheckpoint } from "@/app/(site)/clasificados/components/PublishCheckoutCheckpoint";
import {
  redirectToRevenueCategoryCheckout,
  startRevenueCategoryCheckout,
} from "@/app/lib/listingPlans/revenueCategoryCheckoutClient";
import { AUTOS_DEALER_CHECKOUT } from "@/app/lib/listingPlans/revenueCategoryCheckoutPayload";
import {
  CHECKOUT_NEWSLETTER_SOURCES,
  captureCheckoutNewsletterSubscriber,
} from "@/app/lib/newsletter/checkoutNewsletterCapture";
import { prepareAutosListingForApiTransport } from "@/app/(site)/publicar/autos/shared/lib/autosMuxPublishPrepare";
import { resolveAutosDraftPhotosForPublish } from "@/app/lib/clasificados/autos/autosDraftPhotoPublishPrepare";
import { resolveAutosNegociosDraftNamespace } from "../lib/autosNegociosDraftNamespace";
import { countApplicationInventoryVehicles } from "@/app/lib/clasificados/autos/autosAdditionalInventoryDraft";
import {
  applyAutosDealerPreviewPromoCode,
  AUTOS_DEALER_NEWSLETTER_INTERESTS,
  AUTOS_DEALER_PREVIEW_RULES_MODAL,
  autosDealerPreviewCheckpointConfig,
  autosDealerSelectedAddOns,
} from "../lib/autosDealerRevenueCheckout";
import {
  autosPreviewPageMaxWidthClass,
  autosPreviewSectionEyebrowClass,
} from "@/app/lib/clasificados/autos/autosNegociosPremiumPreviewTokens";

const EDIT_BASE = "/publicar/autos/negocios";
const AUTOS_DEALER_PENDING_CHECKOUT_KEY = "lx-autos-publish-listing-negocios";

type AutosNegociosPreviewMode = "empty" | "draft" | "mock";

function isDemoQuery(): boolean {
  if (typeof window === "undefined") return false;
  const q = new URLSearchParams(window.location.search);
  const v = q.get("demo");
  return v === "1" || v === "true";
}

function readCachedDealerListingId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(AUTOS_DEALER_PENDING_CHECKOUT_KEY)?.trim() || null;
  } catch {
    return null;
  }
}

function writeCachedDealerListingId(listingId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(AUTOS_DEALER_PENDING_CHECKOUT_KEY, listingId);
  } catch {
    /* ignore */
  }
}

async function resolvePreviewState(): Promise<{
  mode: AutosNegociosPreviewMode;
  listing: AutoDealerListing;
  additionalInventoryVehicles: AutosAdditionalInventoryVehicleDraft[];
}> {
  try {
    const demo = isDemoQuery();
    if (demo) {
      const base = mockAutoDealerListing;
      const relatedDealerListings =
        base.relatedDealerListings?.length ? base.relatedDealerListings : (mockAutoDealerListing.relatedDealerListings ?? []);
      return {
        mode: "mock",
        listing: safeNormalizeAutosDraftListing({ ...base, relatedDealerListings }, "negocios"),
        additionalInventoryVehicles: [],
      };
    }

    const d = await loadAutosNegociosCanonicalActiveDraft();

    if (!d) {
      return { mode: "empty", listing: safeNormalizeAutosDraftListing(undefined, "negocios"), additionalInventoryVehicles: [] };
    }

    return {
      mode: "draft",
      listing: d.listing,
      additionalInventoryVehicles: d.additionalInventoryVehicles ?? [],
    };
  } catch {
    return { mode: "empty", listing: safeNormalizeAutosDraftListing(undefined, "negocios"), additionalInventoryVehicles: [] };
  }
}

function AutosNegociosPreviewInner({
  ready,
  mode,
  listing,
  additionalInventoryVehicles,
}: {
  ready: boolean;
  mode: AutosNegociosPreviewMode;
  listing: AutoDealerListing;
  additionalInventoryVehicles: AutosAdditionalInventoryVehicleDraft[];
}) {
  const { lang } = useAutosNegociosPreviewCopy();
  const editBackHref = buildAutosNegociosEditorResumeHref(EDIT_BASE, lang);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const viewModel = useMemo(
    () => mapAutosNegociosBuyerPreviewViewModel(listing, additionalInventoryVehicles, lang),
    [listing, additionalInventoryVehicles, lang],
  );
  const totalVehicleCount = countApplicationInventoryVehicles(additionalInventoryVehicles.length);
  const checkpointConfig = useMemo(
    () => autosDealerPreviewCheckpointConfig({ lang, totalVehicleCount }),
    [lang, totalVehicleCount],
  );

  const ensurePendingDealerListing = useCallback(async (): Promise<
    | { ok: true; listingId: string; leonixAdId: string | null; customerEmail: string | null }
    | { ok: false; message: string }
  > => {
    const sb = createSupabaseBrowserClient();
    const { data } = await sb.auth.getSession();
    const token = data.session?.access_token;
    if (!token?.trim()) {
      return {
        ok: false,
        message: lang === "es" ? "Inicia sesion para continuar al pago." : "Sign in to continue to payment.",
      };
    }

    const namespace = await resolveAutosNegociosDraftNamespace();
    const photoPrep = await resolveAutosDraftPhotosForPublish({
      listing,
      additionalInventoryVehicles,
      draftNamespace: namespace,
      draftId: namespace.replace(/[^a-zA-Z0-9_-]+/g, "").slice(0, 80) || "negocios",
      authToken: token,
      lang,
    });
    if (!photoPrep.ok) return { ok: false, message: photoPrep.message };

    const preparedListing = prepareAutosListingForApiTransport(photoPrep.listing);
    const cached = readCachedDealerListingId();
    if (cached) {
      const sync = await fetch(`/api/clasificados/autos/listings/${encodeURIComponent(cached)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ listing: preparedListing, lang }),
      });
      if (sync.ok) {
        const j = (await sync.json().catch(() => ({}))) as {
          id?: string;
          leonixAdId?: string | null;
          leonix_ad_id?: string | null;
        };
        return {
          ok: true,
          listingId: cached,
          leonixAdId: j.leonixAdId?.trim() || j.leonix_ad_id?.trim() || null,
          customerEmail: data.session?.user?.email ?? null,
        };
      }
      try {
        window.sessionStorage.removeItem(AUTOS_DEALER_PENDING_CHECKOUT_KEY);
      } catch {
        /* ignore */
      }
    }

    const res = await fetch("/api/clasificados/autos/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ listing: preparedListing, lane: "negocios", lang }),
    });
    const j = (await res.json().catch(() => ({}))) as {
      id?: string;
      leonixAdId?: string | null;
      leonix_ad_id?: string | null;
      message?: string;
    };
    if (!res.ok || !j.id?.trim()) {
      return {
        ok: false,
        message:
          j.message?.trim() ||
          (lang === "es"
            ? "No pudimos preparar tu dealer para el pago seguro."
            : "We could not prepare your dealer listing for secure checkout."),
      };
    }
    writeCachedDealerListingId(j.id.trim());
    return {
      ok: true,
      listingId: j.id.trim(),
      leonixAdId: j.leonixAdId?.trim() || j.leonix_ad_id?.trim() || null,
      customerEmail: data.session?.user?.email ?? null,
    };
  }, [additionalInventoryVehicles, lang, listing]);

  const onStartDealerCheckout = useCallback(
    async (ctx: { newsletterOptIn: boolean; promoCode: string | null }) => {
      setCheckoutBusy(true);
      setCheckoutError(null);
      const pending = await ensurePendingDealerListing();
      if (!pending.ok) {
        setCheckoutBusy(false);
        setCheckoutError(pending.message);
        return;
      }

      void captureCheckoutNewsletterSubscriber({
        checked: ctx.newsletterOptIn,
        email: pending.customerEmail,
        businessName: listing.dealerName,
        city: listing.city,
        zipCode: listing.zip,
        preferredLanguage: lang,
        lang,
        source: CHECKOUT_NEWSLETTER_SOURCES.autosDealer,
        interests: AUTOS_DEALER_NEWSLETTER_INTERESTS,
        consentText:
          lang === "es"
            ? "Acepto recibir promociones y novedades de Leonix relacionadas con mi checkout dealer."
            : "I agree to receive Leonix promotions and updates related to my dealer checkout.",
      });

      const checkout = await startRevenueCategoryCheckout({
        ...AUTOS_DEALER_CHECKOUT,
        listingId: pending.listingId,
        leonixAdId: pending.leonixAdId,
        locale: lang,
        customerEmail: pending.customerEmail,
        promoCode: ctx.promoCode,
        addOns: autosDealerSelectedAddOns(totalVehicleCount),
      });
      setCheckoutBusy(false);
      if (!checkout.ok) {
        setCheckoutError(checkout.userMessage);
        return;
      }
      redirectToRevenueCategoryCheckout(checkout.checkoutUrl);
    },
    [ensurePendingDealerListing, lang, listing.city, listing.dealerName, listing.zip, totalVehicleCount],
  );

  if (!ready) {
    return <div className="min-h-[50vh] bg-[color:var(--lx-page)]" aria-busy="true" />;
  }

  if (mode === "empty") {
    return <AutosNegociosPreviewEmptyState />;
  }

  const isDraftCapture = mode === "draft";
  const additionalCount = additionalInventoryVehicles.length;

  if (isDraftCapture) {
    return (
      <AutosDraftPreviewErrorBoundary logLabel="negocios" fallback={<AutosNegociosPreviewEmptyState />}>
        <div className="min-h-[50vh] bg-[#FAF7F2] text-[#1F241C]">
        <AutoDealerPreviewChrome editBackHref={editBackHref} showSiteLogo={false} hideBackToEdit>
          <AutosNegociosPreviewCaptureBanner lang={lang} editBackHref={editBackHref} />
          <div className={`mx-auto ${autosPreviewPageMaxWidthClass} px-4 pt-4 text-center md:px-6 lg:px-8`}>
            <p className={autosPreviewSectionEyebrowClass}>
              {lang === "es" ? "Clasificados Premium" : "Premium Classifieds"}
            </p>
            <h1 className="font-serif text-pretty text-[1.85rem] font-bold tracking-tight text-[#7A1E2C] sm:text-[2.25rem] md:text-[2.5rem]">
              {lang === "es" ? "Autos en Leonix" : "Autos on Leonix"}
            </h1>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-[#5C5346] sm:text-[15px]">
              {lang === "es"
                ? "Concesionarios, inventario y contacto en una experiencia clara."
                : "Dealers, inventory, and contact in one clear experience."}
            </p>
          </div>
          <div className={`mx-auto ${autosPreviewPageMaxWidthClass} px-4 md:px-6 lg:px-8`}>
            <AutosNegociosResultsCardPreview lang={lang} listing={listing} additionalCount={additionalCount} />
          </div>
          <AutoDealerPreviewPage
            data={listing}
            embeddedInShell
            draftPreviewMode
            heroSpecItems={viewModel.heroSpecItems}
          />
          <AutosNegociosPreviewInventorySection
            lang={lang}
            parentListing={listing}
            additionalVehicles={additionalInventoryVehicles}
            viewModelCards={viewModel.additionalInventory}
          />
          <AutosNegociosPreviewPromiseStrip lang={lang} />
          <div className={`mx-auto ${autosPreviewPageMaxWidthClass} px-4 pb-10 pt-2 md:px-6 lg:px-8`}>
            <PublishCheckoutCheckpoint
              config={checkpointConfig}
              lang={lang}
              busy={checkoutBusy}
              errorMessage={checkoutError}
              onPromoApply={(code) => applyAutosDealerPreviewPromoCode({ code, lang, totalVehicleCount })}
              onCheckout={(ctx) => void onStartDealerCheckout(ctx)}
              rulesModal={AUTOS_DEALER_PREVIEW_RULES_MODAL}
              className="mx-auto w-full max-w-xl"
            />
          </div>
        </AutoDealerPreviewChrome>
        </div>
      </AutosDraftPreviewErrorBoundary>
    );
  }

  return (
    <AutosDraftPreviewErrorBoundary logLabel="negocios" fallback={<AutosNegociosPreviewEmptyState />}>
      <AutoDealerPreviewPage data={listing} editBackHref={editBackHref} />
    </AutosDraftPreviewErrorBoundary>
  );
}

export function AutosNegociosPreviewClient() {
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<AutosNegociosPreviewMode>("empty");
  const [listing, setListing] = useState<AutoDealerListing>(() => safeNormalizeAutosDraftListing(undefined, "negocios"));
  const [additionalInventoryVehicles, setAdditionalInventoryVehicles] = useState<AutosAdditionalInventoryVehicleDraft[]>([]);
  const [recoverHint, setRecoverHint] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const next = await resolvePreviewState();
      setRecoverHint(null);
      setMode(next.mode);
      setListing(next.listing);
      setAdditionalInventoryVehicles(next.additionalInventoryVehicles);
    } catch {
      setMode("empty");
      setListing(safeNormalizeAutosDraftListing(undefined, "negocios"));
      setAdditionalInventoryVehicles([]);
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
      if (storageEventAffectsAutosNegociosDraft(e.key)) void refresh();
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
    <AutosNegociosPreviewLocaleProvider>
      {process.env.NODE_ENV === "development" && recoverHint ? (
        <p className="mx-auto max-w-3xl px-4 pt-2 text-xs text-amber-900/90 dark:text-amber-100/90" role="note">
          {recoverHint}
        </p>
      ) : null}
      <AutosNegociosPreviewInner
        ready={ready}
        mode={mode}
        listing={listing}
        additionalInventoryVehicles={additionalInventoryVehicles}
      />
    </AutosNegociosPreviewLocaleProvider>
  );
}
