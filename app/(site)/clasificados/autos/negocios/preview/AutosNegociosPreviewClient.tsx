"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AutosNegociosDealershipPreviewPage } from "./dealershipPreview/AutosNegociosDealershipPreviewPage";
import { AutosListingTranslationLayer } from "@/app/clasificados/autos/vehiculo/[id]/AutosListingTranslationLayer";
import { autosLiveVehiclePath } from "../../filters/autosBrowseFilterContract";
import { normalizeAutosNegociosLang } from "../lib/autosNegociosLang";
import { AutoDealerPreviewChrome } from "../components/AutoDealerPreviewChrome";
import { AutosNegociosPreviewEmptyState } from "../components/AutosNegociosPreviewEmptyState";
import { loadAutosNegociosCanonicalActiveDraft } from "@/app/lib/clasificados/autos/autosNegociosCanonicalDraftLoad";
import { safeNormalizeAutosDraftListing } from "@/app/clasificados/autos/shared/lib/safeNormalizeAutosDraftListing";
import { mockAutoDealerListing } from "../mock/mockAutoDealerListing";
import type { AutoDealerListing } from "../types/autoDealerListing";
import { AutosNegociosPreviewLocaleProvider, useAutosNegociosPreviewCopy } from "../lib/AutosNegociosPreviewLocaleContext";
import { buildAutosNegociosEditorResumeHref } from "@/app/lib/clasificados/autos/autosDealerInventoryAddFlow";
import { storageEventAffectsAutosNegociosDraft } from "../lib/autosNegociosDraftNamespace";
import { AutosNegociosPreviewInventorySection } from "../components/AutosNegociosPreviewInventorySection";
import { AutosNegociosPreviewCaptureBanner } from "../components/AutosNegociosPreviewCaptureBanner";
import { AutosNegociosResultsCardPreview } from "../components/AutosNegociosResultsCardPreview";
import type { AutosAdditionalInventoryVehicleDraft } from "@/app/lib/clasificados/autos/autosAdditionalInventoryDraft";
import { AutosDraftPreviewErrorBoundary } from "@/app/clasificados/autos/shared/components/AutosDraftPreviewErrorBoundary";
import { AutosNegociosPreviewPromiseStrip } from "../components/AutosNegociosPreviewPromiseStrip";
import { AutosNegociosSaveChangesBar } from "../components/AutosNegociosSaveChangesBar";
import { mapAutosNegociosBuyerPreviewViewModel } from "@/app/lib/clasificados/autos/mapAutosNegociosBuyerPreviewViewModel";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { PublishCheckoutCheckpoint } from "@/app/(site)/clasificados/components/PublishCheckoutCheckpoint";
import {
  redirectToRevenueCategoryCheckout,
  startRevenueCategoryCheckout,
} from "@/app/lib/listingPlans/revenueCategoryCheckoutClient";
import { AUTOS_DEALER_CHECKOUT, AUTOS_DEALER_QUICK_CHECKOUT } from "@/app/lib/listingPlans/revenueCategoryCheckoutPayload";
import {
  businessPlanFromSearchParams,
  carryBusinessPlanParam,
  selectBusinessBaseCheckout,
} from "@/app/lib/listingPlans/businessQuickPlanSignal";
import { useIsQuickBusinessPlan } from "@/app/lib/quickBusiness/useIsQuickBusinessPlan";
import { useBusinessBasePlanOffer } from "@/app/lib/listingPlans/businessBasePlanOfferClient";
import {
  CHECKOUT_NEWSLETTER_SOURCES,
  captureCheckoutNewsletterSubscriber,
} from "@/app/lib/newsletter/checkoutNewsletterCapture";
import { prepareAutosListingForApiTransport } from "@/app/(site)/publicar/autos/shared/lib/autosMuxPublishPrepare";
import {
  autosDraftListingHasLocalPhotos,
  autosInventoryDraftHasLocalPhotos,
  resolveAutosDraftPhotosForPublish,
} from "@/app/lib/clasificados/autos/autosDraftPhotoPublishPrepare";
import { resolveAutosNegociosDraftNamespace } from "../lib/autosNegociosDraftNamespace";
import {
  countApplicationInventoryVehicles,
  normalizeAdditionalInventoryVehicles,
} from "@/app/lib/clasificados/autos/autosAdditionalInventoryDraft";
import {
  applyAutosDealerPreviewPromoCode,
  AUTOS_DEALER_NEWSLETTER_INTERESTS,
  AUTOS_DEALER_PREVIEW_RULES_MODAL,
  autosDealerPreviewCheckpointConfig,
  autosDealerSelectedAddOns,
} from "../lib/autosDealerRevenueCheckout";
import { QUICK_DEALER_ACTIVE_VEHICLE_LIMIT } from "@/app/lib/clasificados/autos/autosDealerInventoryPolicy";
import {
  autosPreviewPageMaxWidthClass,
  autosPreviewSectionEyebrowClass,
} from "@/app/lib/clasificados/autos/autosNegociosPremiumPreviewTokens";

const EDIT_BASE = "/publicar/autos/negocios";
const AUTOS_DEALER_PENDING_CHECKOUT_KEY = "lx-autos-publish-listing-negocios";

type AutosNegociosPreviewMode = "empty" | "draft" | "mock" | "canonical-active" | "canonical-error";

/**
 * Gate C: reasons a canonical (listingId-bound) Preview fetch can fail. Kept distinct from the
 * generic "empty" (no draft yet — normal for a brand-new visitor) so a missing/unauthorized
 * identity never silently falls through to the "start a new listing" empty state.
 */
type CanonicalPreviewErrorReason = "auth" | "not_found" | "wrong_lane" | "unsupported_role" | "network";

type CanonicalDealerListingApiResponse = {
  ok?: boolean;
  id?: string;
  lane?: string;
  status?: string;
  lang?: "es" | "en";
  listing?: AutoDealerListing;
  inventory_role?: string | null;
};

/**
 * Fetch and hydrate the owner-authorized dealer parent or vehicle child row for `listingId`.
 * This is the ONLY source of truth when a canonical identity is present — the shared,
 * user-scoped local draft (loadAutosNegociosCanonicalActiveDraft) is never used to fill in or
 * override data for an identified listing, since that draft carries no field identifying which
 * DB row (if any) it belongs to and could otherwise leak another listing's or another tab's
 * unsaved state into this one.
 */
async function fetchCanonicalDealerPreview(
  listingId: string,
): Promise<
  | {
      ok: true;
      listing: AutoDealerListing;
      status: string;
      listingLang: "es" | "en" | null;
      additionalInventoryVehicles: AutosAdditionalInventoryVehicleDraft[];
    }
  | { ok: false; reason: CanonicalPreviewErrorReason }
> {
  let token: string | null = null;
  try {
    const sb = createSupabaseBrowserClient();
    const { data } = await sb.auth.getSession();
    token = data.session?.access_token ?? null;
  } catch {
    token = null;
  }
  if (!token) return { ok: false, reason: "auth" };

  let res: Response;
  try {
    res = await fetch(`/api/clasificados/autos/listings/${encodeURIComponent(listingId)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    return { ok: false, reason: "network" };
  }
  if (res.status === 401 || res.status === 403) return { ok: false, reason: "auth" };
  if (res.status === 404) return { ok: false, reason: "not_found" };
  if (!res.ok) return { ok: false, reason: "network" };

  const json = (await res.json().catch(() => null)) as CanonicalDealerListingApiResponse | null;
  if (!json?.ok || !json.listing) return { ok: false, reason: "not_found" };
  if (json.lane !== "negocios") return { ok: false, reason: "wrong_lane" };
  if (json.inventory_role != null && json.inventory_role !== "main" && json.inventory_role !== "inventory_vehicle") {
    return { ok: false, reason: "unsupported_role" };
  }

  const listing = safeNormalizeAutosDraftListing({ ...json.listing, autosLane: "negocios" }, "negocios");
  const listingLang = json.lang === "en" || json.lang === "es" ? json.lang : null;
  // Gate 4/11 (Autos Dealer lifecycle closeout, 2026-09-18): `listing_payload.additionalInventoryVehicles`
  // is the pre-fulfillment child fallback bundle — it rides along as a sibling field inside the same
  // stored JSON `json.listing` (AutoDealerListing's TS type doesn't declare it, since it's not part of
  // the parent's own vehicle fields), exactly like the server-side reads in
  // revenueAutosDealerFulfillment.ts / syncDealerInventoryChildRowsFromParentPayload. It must be
  // hydrated here, not discarded, or a dashboard-edit Save would silently wipe it.
  const additionalInventoryVehicles = normalizeAdditionalInventoryVehicles(
    (json.listing as { additionalInventoryVehicles?: unknown })?.additionalInventoryVehicles,
  );
  return { ok: true, listing, status: json.status ?? "", listingLang, additionalInventoryVehicles };
}

function autosNegociosCanonicalErrorCopy(reason: CanonicalPreviewErrorReason, lang: "es" | "en"): { title: string; body: string } {
  const es = lang === "es";
  switch (reason) {
    case "auth":
      return {
        title: es ? "Inicia sesión" : "Sign in required",
        body: es ? "Inicia sesión para ver este anuncio de dealer." : "Sign in to view this dealer listing.",
      };
    case "wrong_lane":
      return {
        title: es ? "Anuncio no compatible" : "Unsupported listing",
        body: es
          ? "Este enlace no corresponde a un anuncio de dealer (Negocios)."
          : "This link does not point to a dealer (Negocios) listing.",
      };
    case "unsupported_role":
      return {
        title: es ? "Registro no compatible" : "Unsupported record",
        body: es
          ? "No pudimos determinar el tipo de este registro de inventario."
          : "We could not determine this inventory record's type.",
      };
    case "not_found":
      return {
        title: es ? "Anuncio no encontrado" : "Listing not found",
        body: es
          ? "No encontramos este anuncio o no tienes acceso a él."
          : "We couldn't find this listing, or you don't have access to it.",
      };
    case "network":
    default:
      return {
        title: es ? "No se pudo cargar" : "Could not load",
        body: es ? "No pudimos cargar este anuncio. Intenta de nuevo." : "We could not load this listing. Please try again.",
      };
  }
}

/** Distinct from AutosNegociosPreviewEmptyState — never offers a "start new listing" CTA for a
 * failed canonical-identity lookup, so a missing/unauthorized listing never reads as an
 * invitation to create a duplicate. */
function AutosNegociosPreviewCanonicalErrorState({
  reason,
  lang,
}: {
  reason: CanonicalPreviewErrorReason;
  lang: "es" | "en";
}) {
  const copy = autosNegociosCanonicalErrorCopy(reason, lang);
  const dashboardHref = `/dashboard/mis-anuncios?lang=${lang}`;
  return (
    <AutoDealerPreviewChrome showSiteLogo={false} hideBackToEdit>
      <main className="mx-auto mt-8 max-w-[1280px] px-4 md:px-5 lg:px-6">
        <div className="rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-5 shadow-[0_8px_32px_-8px_rgba(42,36,22,0.1)] sm:p-6">
          <h1 className="text-xl font-bold tracking-tight text-[color:var(--lx-text)] sm:text-2xl">{copy.title}</h1>
          <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-[color:var(--lx-text-2)]">{copy.body}</p>
          <div className="mt-6">
            <Link
              href={dashboardHref}
              className="inline-flex h-11 items-center justify-center rounded-[14px] bg-[color:var(--lx-cta-dark)] px-5 text-sm font-bold text-[#FFFCF7] shadow-lg transition hover:bg-[color:var(--lx-cta-dark-hover)]"
            >
              {lang === "es" ? "Volver al panel" : "Back to dashboard"}
            </Link>
          </div>
        </div>
      </main>
    </AutoDealerPreviewChrome>
  );
}

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

type PreviewResolveResult = {
  mode: AutosNegociosPreviewMode;
  listing: AutoDealerListing;
  additionalInventoryVehicles: AutosAdditionalInventoryVehicleDraft[];
  /** Set only when `listing` was hydrated from a real DB row via `urlListingId`. Threads through
   * to checkout so it PATCHes the same row instead of the local-draft cached-id-or-create path. */
  canonicalListingId: string | null;
  canonicalError: CanonicalPreviewErrorReason | null;
  /** The real persisted `autos_classifieds_listings.lang` (seller's authored language) — set only
   * when `listing` was hydrated from a real DB row. Null for a purely local, never-saved draft,
   * which has no authored-language row to read yet (the current session's own site locale IS its
   * honest authored language in that case — see the isDraftCapture render branch). */
  listingLang: "es" | "en" | null;
};

/**
 * `urlListingId`, when present, comes from the dashboard-edit/Preview URL convention already
 * used elsewhere in the repo (`?listingId=...`, see autosDealerListingPreviewHref-equivalent
 * query shape). When present it is the ONLY source of truth for this preview — the shared,
 * user-scoped local draft is never consulted or merged in, since it carries no field
 * identifying which DB row (if any) it belongs to.
 */
async function resolvePreviewStateForRoute(urlListingId: string | null): Promise<PreviewResolveResult> {
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
        canonicalListingId: null,
        canonicalError: null,
        listingLang: null,
      };
    }

    if (urlListingId) {
      const fetched = await fetchCanonicalDealerPreview(urlListingId);
      if (!fetched.ok) {
        return {
          mode: "canonical-error",
          listing: safeNormalizeAutosDraftListing(undefined, "negocios"),
          additionalInventoryVehicles: [],
          canonicalListingId: urlListingId,
          canonicalError: fetched.reason,
          listingLang: null,
        };
      }
      return {
        // Already-active: render the plain live-style shell (no checkout — already published).
        // Not yet active (draft/pending_payment/payment_failed): reuse the existing
        // draft-capture shell so the owner can still complete checkout, bound to this same id.
        mode: fetched.status === "active" ? "canonical-active" : "draft",
        listing: fetched.listing,
        // Gate 4/11: hydrate the real embedded fallback bundle instead of discarding it — a
        // dashboard-edit save must round-trip whatever children already exist, never wipe them.
        additionalInventoryVehicles: fetched.additionalInventoryVehicles,
        canonicalListingId: urlListingId,
        canonicalError: null,
        listingLang: fetched.listingLang,
      };
    }

    const d = await loadAutosNegociosCanonicalActiveDraft();

    if (!d) {
      return {
        mode: "empty",
        listing: safeNormalizeAutosDraftListing(undefined, "negocios"),
        additionalInventoryVehicles: [],
        canonicalListingId: null,
        canonicalError: null,
        listingLang: null,
      };
    }

    return {
      mode: "draft",
      listing: d.listing,
      additionalInventoryVehicles: d.additionalInventoryVehicles ?? [],
      canonicalListingId: null,
      canonicalError: null,
      listingLang: null,
    };
  } catch {
    return {
      mode: "empty",
      listing: safeNormalizeAutosDraftListing(undefined, "negocios"),
      additionalInventoryVehicles: [],
      canonicalListingId: null,
      canonicalError: null,
      listingLang: null,
    };
  }
}

function AutosNegociosPreviewInner({
  ready,
  mode,
  listing,
  additionalInventoryVehicles,
  canonicalListingId,
  canonicalError,
  resolvedListingLang,
  mediaReadiness,
}: {
  ready: boolean;
  mode: AutosNegociosPreviewMode;
  listing: AutoDealerListing;
  additionalInventoryVehicles: AutosAdditionalInventoryVehicleDraft[];
  canonicalListingId: string | null;
  canonicalError: CanonicalPreviewErrorReason | null;
  /** Real persisted authored language for a canonical (DB-backed) listing; null for a purely
   * local, never-saved draft — see PreviewResolveResult.listingLang. */
  resolvedListingLang: "es" | "en" | null;
  /** Gate 05: truthful media-preparation progress, computed one level up (where the durable
   * results are written back into `listing`/`additionalInventoryVehicles`). Only meaningful in
   * the draft-capture branch, which is the only one with a real Pay action. */
  mediaReadiness: { phase: "idle" | "preparing" | "ready"; done: number; total: number };
}) {
  const { lang } = useAutosNegociosPreviewCopy();
  const searchParams = useSearchParams();
  const genericEditBackHref = buildAutosNegociosEditorResumeHref(EDIT_BASE, lang);
  // Translation cache-key fallback for a local, un-persisted draft (no real listingId yet). A
  // shared literal like "draft" would let one browser tab's cached translation of a DIFFERENT
  // draft's content bleed into this session (the client cache has no content hash — see
  // buildTranslateCacheKey). A per-mount random id keeps every draft-preview session isolated;
  // it naturally expires with the tab/mount, same lifetime as the sessionStorage cache itself.
  const draftTranslationSessionKey = useMemo(
    () =>
      typeof window !== "undefined" && window.crypto?.randomUUID
        ? window.crypto.randomUUID()
        : `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    [],
  );
  /** Preserves the same listingId/leonixAdId/mode/returnPanel identity context so "back to
   * edit" resumes editing the SAME listing rather than the generic new-application resume. */
  const canonicalEditBackHref = useMemo(() => {
    if (!canonicalListingId) return null;
    const p = new URLSearchParams();
    p.set("edit", "1");
    p.set("source", "dashboard");
    p.set("mode", searchParams?.get("mode") || "listing-edit");
    p.set("listingId", canonicalListingId);
    const leonixAdId = searchParams?.get("leonixAdId");
    if (leonixAdId) p.set("leonixAdId", leonixAdId);
    p.set("returnPanel", searchParams?.get("returnPanel") || "autos");
    p.set("lang", lang);
    return `${EDIT_BASE}?${p.toString()}`;
  }, [canonicalListingId, searchParams, lang]);
  /** Gate H: a canonical-active listing is a real, already-published DB row (`status === "active"`
   * — see resolvePreviewStateForRoute's `fetched.status === "active" ? "canonical-active" : "draft"`
   * branch) with a real public URL, so Share here must target that URL truthfully — never the
   * Preview/dashboard-edit URL the owner is actually viewing. A pending/draft canonical listing
   * (mode "draft") has no such URL yet and must not fabricate one. */
  const canonicalPublicUrl = useMemo(() => {
    if (mode !== "canonical-active" || !canonicalListingId || typeof window === "undefined") return undefined;
    return `${window.location.origin}${autosLiveVehiclePath(canonicalListingId)}?lang=${lang}`;
  }, [mode, canonicalListingId, lang]);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  /** Gate 6/7/8/9: "Guardar cambios" for an existing (canonical) parent or child — separate busy/
   * error/success state from the checkout flow, since the two actions are mutually exclusive per
   * session (edit intent vs brand-new purchase) but must never share error/success messaging. */
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  /**
   * Owner lock (2026-09-19): a canonical dashboard edit (real listingId, reached via
   * ?edit=1&source=dashboard — see AutosNegociosApplication's previewHref, which sets these
   * exact params for listing-edit AND inventory-edit) is NOT a new-purchase Preview merely
   * because the row's lifecycle status happens to be pending_payment. Route intent and lifecycle
   * status are separate axes — only route intent decides whether this Preview offers a
   * $399 Revenue OS checkout or a plain Save Changes action on the SAME row.
   */
  const isDashboardListingEditPreview =
    Boolean(canonicalListingId) && searchParams?.get("edit") === "1" && searchParams?.get("source") === "dashboard";
  /**
   * Owner lock (2026-09-17, Gate 08): the newsletter checkout identity is the AUTHENTICATED
   * session email — never an editable/marketing address the customer could redirect elsewhere.
   * Resolved once on mount (mirrors Servicios' pattern) so it's visible in the checkpoint UI
   * before the dealer ever clicks Pay, not a hidden `session.user.email` they never see.
   */
  const [newsletterEmail, setNewsletterEmail] = useState<string | null>(null);
  const [newsletterCaptureNote, setNewsletterCaptureNote] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const sb = createSupabaseBrowserClient();
        const { data } = await sb.auth.getSession();
        if (!cancelled) setNewsletterEmail(data.session?.user?.email ?? null);
      } catch {
        if (!cancelled) setNewsletterEmail(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  const viewModel = useMemo(
    () => mapAutosNegociosBuyerPreviewViewModel(listing, additionalInventoryVehicles, lang),
    [listing, additionalInventoryVehicles, lang],
  );
  const totalVehicleCount = countApplicationInventoryVehicles(additionalInventoryVehicles.length);
  // Quick Business intake hands off here with the Quick plan marker; the standard dealer
  // application arrives without it and keeps the Full package and its inventory pack unchanged.
  const urlQuickPlan = businessPlanFromSearchParams(searchParams) === "quick";
  // The marker is only evidence for a dealer row that does not exist yet. A Quick dealer who
  // abandoned Stripe returns here from the dashboard through `?listingId=…` with no marker at
  // all, and offering the Full package there would bill a $99 customer the Full price for the
  // listing they already started. The server answers from the entitlement table and the payment
  // ledger, and its answer wins over the URL.
  const businessBasePlan = useBusinessBasePlanOffer({
    category: AUTOS_DEALER_CHECKOUT.category,
    listingId: canonicalListingId,
    enabled: Boolean(canonicalListingId),
  });
  const baseCheckout = selectBusinessBaseCheckout({
    quick: AUTOS_DEALER_QUICK_CHECKOUT,
    full: AUTOS_DEALER_CHECKOUT,
    urlPlan: urlQuickPlan ? "quick" : "full",
    serverSellPackageKey: businessBasePlan?.sellPackageKey,
  });
  // One derived flag drives the allowance, the add-on row and the line-item copy, so the package
  // actually charged can never disagree with what the checkpoint showed.
  const quickPlan = baseCheckout.packageKey === AUTOS_DEALER_QUICK_CHECKOUT.packageKey;
  // Plan drift fix: "Volver a editar" used to drop the plan, so one edit round trip re-mounted the
  // application as Full (no photo cap, video, every Full-only field). Quick is carried on the link
  // (server answer OR staff custody OR the handoff marker); Full is never written into a URL.
  const staffQuickPlan = useIsQuickBusinessPlan("autos");
  const editBackHref = carryBusinessPlanParam(
    canonicalEditBackHref ?? genericEditBackHref,
    quickPlan || staffQuickPlan.isQuick ? "quick" : "full",
  );
  const checkpointConfig = useMemo(
    () => autosDealerPreviewCheckpointConfig({ lang, totalVehicleCount, quickPlan }),
    [lang, totalVehicleCount, quickPlan],
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

    // Stage the exact saved children (with durable photo URLs) inside the parent's own durable
    // row before Stripe Checkout opens. The webhook that fulfills payment runs server-side with
    // no access to browser state, so this is the only place it can read the bundle from.
    const preparedListing = prepareAutosListingForApiTransport({
      ...photoPrep.listing,
      additionalInventoryVehicles: photoPrep.additionalInventoryVehicles,
    });

    // An existing canonical listing (reached via dashboard edit) is PATCHed only — never
    // falls back to POST/create. A failure here is surfaced as a clear error, not silently
    // routed into creating a duplicate listing.
    if (canonicalListingId) {
      const sync = await fetch(`/api/clasificados/autos/listings/${encodeURIComponent(canonicalListingId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ listing: preparedListing, lang, basePackageKey: baseCheckout.packageKey }),
      });
      if (sync.ok) {
        const j = (await sync.json().catch(() => ({}))) as {
          id?: string;
          leonixAdId?: string | null;
          leonix_ad_id?: string | null;
        };
        return {
          ok: true,
          listingId: canonicalListingId,
          leonixAdId: j.leonixAdId?.trim() || j.leonix_ad_id?.trim() || null,
          customerEmail: data.session?.user?.email ?? null,
        };
      }
      const errJson = (await sync.json().catch(() => ({}))) as { message?: string };
      return {
        ok: false,
        message:
          errJson.message?.trim() ||
          (lang === "es"
            ? "No pudimos actualizar tu anuncio. Intenta de nuevo o contacta a Leonix."
            : "We could not update your listing. Please try again or contact Leonix."),
      };
    }

    const cached = readCachedDealerListingId();
    if (cached) {
      const sync = await fetch(`/api/clasificados/autos/listings/${encodeURIComponent(cached)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ listing: preparedListing, lang, basePackageKey: baseCheckout.packageKey }),
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

    /**
     * Gate QB-BOUNDARY-01 — say which base package this dealer publish belongs to, so the server
     * does not have to infer a PRODUCT from the `negocios` LANE (which Quick and Full dealers
     * share). `baseCheckout.packageKey` is already the server's own answer wherever the server
     * has one (`selectBusinessBaseCheckout` prefers `serverSellPackageKey` over the URL marker).
     *
     * This is a declaration, not authority. The route reads it only when it names the SIMPLE
     * ($99 Quick) key, and any server-owned record overrides it in either direction — so it can
     * add the Quick contract to a Quick dealer and can never lift it off one.
     */
    const res = await fetch("/api/clasificados/autos/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        listing: preparedListing,
        lane: "negocios",
        lang,
        basePackageKey: baseCheckout.packageKey,
      }),
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
  }, [additionalInventoryVehicles, lang, listing, canonicalListingId, baseCheckout.packageKey]);

  /**
   * Payment firewall (owner lock, 2026-09-19): a dashboard listing-edit Save only durably
   * persists the SAME canonical row via the existing PATCH-only path inside
   * ensurePendingDealerListing — it never touches startRevenueCategoryCheckout,
   * redirectToRevenueCategoryCheckout, promo apply, verified-intro, or newsletter checkout
   * capture. No lifecycle mutation, no payment mutation, no new row. Also covers Gate 8/9: the
   * same action is reused for an already-active parent and for a canonical child, both reached
   * only via a dashboard edit link (never a brand-new-purchase entry point).
   */
  const onSaveDealerChanges = useCallback(async () => {
    setSaveBusy(true);
    setSaveError(null);
    setSaveSuccess(false);
    const result = await ensurePendingDealerListing();
    setSaveBusy(false);
    if (!result.ok) {
      setSaveError(result.message);
      return;
    }
    setSaveSuccess(true);
  }, [ensurePendingDealerListing]);

  const onStartDealerCheckout = useCallback(
    async (ctx: {
      newsletterOptIn: boolean;
      promoCode: string | null;
      recurringConsent?: { accepted: true; consentTextVersion: string; lang: "es" | "en" } | null;
      requestVerifiedIntroDiscount?: boolean;
    }) => {
      setCheckoutBusy(true);
      setCheckoutError(null);
      setNewsletterCaptureNote(null);

      // Owner lock (2026-09-17, Gate 08/10/11): resolve a fresh authenticated session for the
      // newsletter capture's own identity (accessToken — the server resolves the canonical
      // account email itself, never a client-supplied alternate), and fire the capture BEFORE
      // awaiting the required listing preparation so the two independent operations overlap
      // instead of serializing optional newsletter work ahead of required checkout work.
      const capturePromise = (async () => {
        let accessToken: string | null = null;
        let sessionEmail: string | null = newsletterEmail;
        try {
          const sb = createSupabaseBrowserClient();
          const { data } = await sb.auth.getSession();
          accessToken = data.session?.access_token ?? null;
          sessionEmail = data.session?.user?.email ?? newsletterEmail;
        } catch {
          /* best-effort — capture below still runs with whatever identity is already known */
        }
        return captureCheckoutNewsletterSubscriber({
          checked: ctx.newsletterOptIn,
          email: sessionEmail,
          accessToken,
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
      })();

      const pending = await ensurePendingDealerListing();

      const captureResult = await capturePromise;
      if (captureResult.status === "FAILED") {
        console.warn("[autos-dealer-checkout] newsletter capture failed", captureResult.reason);
        setNewsletterCaptureNote(
          lang === "es"
            ? "No pudimos guardar tu suscripción al boletín. Tu pago no se vio afectado."
            : "We couldn't save your newsletter subscription. Your payment was not affected.",
        );
      }

      if (!pending.ok) {
        setCheckoutBusy(false);
        setCheckoutError(pending.message);
        return;
      }

      const checkout = await startRevenueCategoryCheckout({
        ...baseCheckout,
        listingId: pending.listingId,
        leonixAdId: pending.leonixAdId,
        locale: lang,
        customerEmail: pending.customerEmail,
        promoCode: ctx.promoCode,
        recurringConsent: ctx.recurringConsent ?? null,
        requestVerifiedIntroDiscount: ctx.requestVerifiedIntroDiscount ?? false,
        addOns: autosDealerSelectedAddOns(totalVehicleCount, quickPlan),
      });
      setCheckoutBusy(false);
      if (!checkout.ok) {
        setCheckoutError(checkout.userMessage);
        return;
      }
      redirectToRevenueCategoryCheckout(checkout.checkoutUrl);
    },
    [ensurePendingDealerListing, lang, listing.city, listing.dealerName, listing.zip, baseCheckout, quickPlan, totalVehicleCount, newsletterEmail],
  );

  if (!ready) {
    return <div className="min-h-[50vh] bg-[color:var(--lx-page)]" aria-busy="true" />;
  }

  // A missing/unauthorized/unsupported canonical identity fails clearly here — it never falls
  // through to the generic "start a new listing" empty state below.
  if (mode === "canonical-error") {
    return <AutosNegociosPreviewCanonicalErrorState reason={canonicalError ?? "network"} lang={lang} />;
  }

  if (mode === "canonical-active") {
    return (
      <AutosDraftPreviewErrorBoundary logLabel="negocios" fallback={<AutosNegociosPreviewEmptyState />}>
        <AutosListingTranslationLayer
          listing={listing}
          siteLocale={lang}
          listingLang={resolvedListingLang}
          listingKey={canonicalListingId ?? draftTranslationSessionKey}
        >
          {(displayListing, translateControl, adDisplayLang) => (
            <AutosNegociosPreviewLocaleProvider lang={normalizeAutosNegociosLang(adDisplayLang)} manageDocumentTitle={false}>
              <AutosNegociosDealershipPreviewPage
                data={displayListing}
                editBackHref={editBackHref}
                publicUrl={canonicalPublicUrl}
                canonicalListingId={canonicalPublicUrl ? canonicalListingId : undefined}
                translateControl={translateControl}
              />
            </AutosNegociosPreviewLocaleProvider>
          )}
        </AutosListingTranslationLayer>
        {/* Gate 8/9: an already-active parent or a canonical child is opened here only via the
            dashboard edit route (?listingId=...) — never a brand-new-purchase entry point — so
            Save (same-row PATCH), never checkout, is the only action. */}
        <AutosNegociosSaveChangesBar
          lang={lang}
          busy={saveBusy}
          error={saveError}
          saved={saveSuccess}
          onSave={() => void onSaveDealerChanges()}
        />
      </AutosDraftPreviewErrorBoundary>
    );
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
          <AutosListingTranslationLayer
            listing={listing}
            siteLocale={lang}
            listingLang={resolvedListingLang ?? lang}
            listingKey={canonicalListingId ?? draftTranslationSessionKey}
          >
            {(displayListing, translateControl, adDisplayLangRaw) => {
              const adDisplayLang = normalizeAutosNegociosLang(adDisplayLangRaw);
              return (
                <AutosNegociosPreviewLocaleProvider lang={adDisplayLang} manageDocumentTitle={false}>
                  <div className={`mx-auto ${autosPreviewPageMaxWidthClass} px-4 md:px-6 lg:px-8`}>
                    <AutosNegociosResultsCardPreview lang={adDisplayLang}
                      listing={displayListing}
                      additionalCount={quickPlan ? 0 : additionalCount}
                      inventoryVehicleLimit={quickPlan ? QUICK_DEALER_ACTIVE_VEHICLE_LIMIT : undefined}
                    />
                  </div>
                  <AutosNegociosDealershipPreviewPage
                    data={displayListing}
                    embeddedInShell
                    draftPreviewMode
                    relatedPreviewOnly
                    heroSpecItems={viewModel.heroSpecItems}
                    translateControl={translateControl}
                  />
                  <AutosNegociosPreviewInventorySection
                    lang={adDisplayLang}
                    parentListing={displayListing}
                    additionalVehicles={additionalInventoryVehicles}
                    viewModelCards={viewModel.additionalInventory}
                  />
                  <AutosNegociosPreviewPromiseStrip lang={adDisplayLang} />
                </AutosNegociosPreviewLocaleProvider>
              );
            }}
          </AutosListingTranslationLayer>
          <div className={`mx-auto ${autosPreviewPageMaxWidthClass} px-4 pb-10 pt-2 md:px-6 lg:px-8`}>
            {isDashboardListingEditPreview ? (
              <div className="mx-auto w-full max-w-xl rounded-2xl border border-[#D6C7AD]/70 bg-[#FFFDF7] p-5 text-center shadow-[0_10px_28px_-16px_rgba(31,36,28,0.18)]">
                <p className="text-sm text-[#5C5346]">
                  {mediaReadiness.phase === "preparing"
                    ? lang === "es"
                      ? `Preparando imágenes… ${mediaReadiness.done} de ${mediaReadiness.total}`
                      : `Preparing images… ${mediaReadiness.done} of ${mediaReadiness.total}`
                    : lang === "es"
                      ? "Revisa tu anuncio y guarda los cambios cuando esté listo."
                      : "Review your listing and save your changes when ready."}
                </p>
                <button
                  type="button"
                  disabled={saveBusy || mediaReadiness.phase === "preparing"}
                  onClick={() => void onSaveDealerChanges()}
                  className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[#7A1E2C] px-5 text-sm font-bold text-[#FFFCF7] shadow-md transition hover:bg-[#5e1721] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saveBusy
                    ? lang === "es"
                      ? "Guardando cambios…"
                      : "Saving changes…"
                    : lang === "es"
                      ? "Guardar cambios"
                      : "Save changes"}
                </button>
                {saveSuccess ? (
                  <p className="mt-3 text-sm font-semibold text-[#2A7F3E]" role="status">
                    {lang === "es" ? "Cambios guardados." : "Changes saved."}
                  </p>
                ) : null}
                {saveError ? (
                  <p className="mt-3 text-sm font-semibold text-red-800" role="alert">
                    {saveError}
                  </p>
                ) : null}
                <Link href={editBackHref} className="mt-4 inline-block text-xs font-bold text-[#7A1E2C] underline">
                  {lang === "es" ? "Volver a editar" : "Back to edit"}
                </Link>
              </div>
            ) : (
              <PublishCheckoutCheckpoint
                config={checkpointConfig}
                lang={lang}
                busy={checkoutBusy}
                errorMessage={checkoutError}
                draftReady={mediaReadiness.phase !== "preparing"}
                draftReadyMessage={
                  mediaReadiness.phase === "preparing"
                    ? lang === "es"
                      ? `Preparando imágenes… ${mediaReadiness.done} de ${mediaReadiness.total}`
                      : `Preparing images… ${mediaReadiness.done} of ${mediaReadiness.total}`
                    : null
                }
                onPromoApply={(code) => applyAutosDealerPreviewPromoCode({ code, lang, totalVehicleCount, quickPlan })}
                onCheckout={(ctx) => void onStartDealerCheckout(ctx)}
                rulesModal={AUTOS_DEALER_PREVIEW_RULES_MODAL}
                newsletterEmail={newsletterEmail}
                newsletterCaptureNote={newsletterCaptureNote}
                className="mx-auto w-full max-w-xl"
              />
            )}
          </div>
        </AutoDealerPreviewChrome>
        </div>
      </AutosDraftPreviewErrorBoundary>
    );
  }

  return (
    <AutosDraftPreviewErrorBoundary logLabel="negocios" fallback={<AutosNegociosPreviewEmptyState />}>
      <AutosNegociosDealershipPreviewPage data={listing} editBackHref={editBackHref} />
    </AutosDraftPreviewErrorBoundary>
  );
}

export function AutosNegociosPreviewClient() {
  const searchParams = useSearchParams();
  const canonicalListingId = useMemo(() => searchParams?.get("listingId")?.trim() || null, [searchParams]);

  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<AutosNegociosPreviewMode>("empty");
  const [listing, setListing] = useState<AutoDealerListing>(() => safeNormalizeAutosDraftListing(undefined, "negocios"));
  const [additionalInventoryVehicles, setAdditionalInventoryVehicles] = useState<AutosAdditionalInventoryVehicleDraft[]>([]);
  const [resolvedCanonicalListingId, setResolvedCanonicalListingId] = useState<string | null>(null);
  const [canonicalError, setCanonicalError] = useState<CanonicalPreviewErrorReason | null>(null);
  const [resolvedListingLang, setResolvedListingLang] = useState<"es" | "en" | null>(null);
  const [recoverHint, setRecoverHint] = useState<string | null>(null);
  /**
   * Owner lock (2026-09-17, Gate 03/05): media durability moved EARLIER than Pay. While the
   * dealer is already sitting in Preview (before ever clicking Pay), this progressively uploads
   * any still-local draft photos using the SAME resolveAutosDraftPhotosForPublish engine Pay
   * itself uses — so by the time Pay is actually clicked, that same call is a fast no-op (every
   * image is already a durable URL) instead of the start of a real upload batch. "error" here
   * never blocks Pay: Pay's own click-time call remains the real safety net and surfaces a
   * proper localized error if photos still fail there.
   */
  const [mediaReadiness, setMediaReadiness] = useState<{ phase: "idle" | "preparing" | "ready"; done: number; total: number }>({
    phase: "idle",
    done: 0,
    total: 0,
  });
  const mediaPrepStartedRef = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const next = await resolvePreviewStateForRoute(canonicalListingId);
      setRecoverHint(null);
      setMode(next.mode);
      setListing(next.listing);
      setAdditionalInventoryVehicles(next.additionalInventoryVehicles);
      setResolvedCanonicalListingId(next.canonicalListingId);
      setCanonicalError(next.canonicalError);
      setResolvedListingLang(next.listingLang);
    } catch {
      setMode("empty");
      setListing(safeNormalizeAutosDraftListing(undefined, "negocios"));
      setAdditionalInventoryVehicles([]);
      setResolvedCanonicalListingId(null);
      setCanonicalError(null);
      setResolvedListingLang(null);
      if (process.env.NODE_ENV === "development") {
        setRecoverHint("Preview fell back to empty state after an unexpected error");
      }
    }
  }, [canonicalListingId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setReady(false);
      await refresh();
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      // A canonical (listingId-bound) preview never reflects local draft storage — no need to
      // refetch the DB record just because an unrelated draft key changed in another tab.
      if (!canonicalListingId && storageEventAffectsAutosNegociosDraft(e.key)) void refresh();
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

  // Gate 03/05: begin durable media preparation as soon as the dealer is sitting in a real,
  // signed-in draft Preview with local photos — well before Pay exists as an option. Runs once
  // per mount (mediaPrepStartedRef) so it never re-fires on every keystroke/autosave re-render.
  // Session-lang best-effort only (?lang= param) — this background pass renders no user-facing
  // text of its own; the readiness message shown near Pay is computed inside AutosNegociosPreviewInner
  // using its own real adDisplayLang-correct `lang`.
  useEffect(() => {
    if (!ready || mode !== "draft" || mediaPrepStartedRef.current) return;
    if (!autosDraftListingHasLocalPhotos(listing) && !autosInventoryDraftHasLocalPhotos(additionalInventoryVehicles)) return;
    mediaPrepStartedRef.current = true;
    let cancelled = false;
    const bgLang: "es" | "en" = searchParams?.get("lang") === "en" ? "en" : "es";
    void (async () => {
      setMediaReadiness({ phase: "preparing", done: 0, total: 0 });
      try {
        const sb = createSupabaseBrowserClient();
        const { data } = await sb.auth.getSession();
        const token = data.session?.access_token ?? null;
        if (!token) {
          if (!cancelled) setMediaReadiness({ phase: "idle", done: 0, total: 0 });
          return;
        }
        const namespace = await resolveAutosNegociosDraftNamespace();
        const draftId = namespace.replace(/[^a-zA-Z0-9_-]+/g, "").slice(0, 80) || "negocios";
        const result = await resolveAutosDraftPhotosForPublish({
          listing,
          additionalInventoryVehicles,
          draftNamespace: namespace,
          draftId,
          authToken: token,
          lang: bgLang,
          onProgress: (done, total) => {
            if (!cancelled) setMediaReadiness({ phase: "preparing", done, total });
          },
        });
        if (cancelled) return;
        if (!result.ok) {
          // Never blocks Pay — Pay's own click-time call is the real safety net and will surface
          // a proper localized error if photos still fail there.
          setMediaReadiness({ phase: "idle", done: 0, total: 0 });
          return;
        }
        setListing(result.listing);
        setAdditionalInventoryVehicles(result.additionalInventoryVehicles);
        setMediaReadiness({ phase: "ready", done: 0, total: 0 });
      } catch {
        if (!cancelled) setMediaReadiness({ phase: "idle", done: 0, total: 0 });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, mode]);

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
        canonicalListingId={resolvedCanonicalListingId}
        canonicalError={canonicalError}
        resolvedListingLang={resolvedListingLang}
        mediaReadiness={mediaReadiness}
      />
    </AutosNegociosPreviewLocaleProvider>
  );
}
