"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { AUTOS_CLASSIFIEDS_EVENT } from "@/app/lib/clasificados/autos/autosClassifiedsEventTypes";
import { buildVehicleTitle, normalizeVehicleSegment } from "@/app/publicar/autos/negocios/lib/autoDealerTitle";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import type { AutosClassifiedsLane } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";
import type { AutosPublishConfirmMode, AutosPublishFlowLang } from "@/app/clasificados/autos/lib/autosPublishFlowCopy";
import { getAutosPublishFlowCopy } from "@/app/clasificados/autos/lib/autosPublishFlowCopy";
import {
  omitAutosInlineVideoForApiPayload,
  prepareAutosListingOptionalMuxUpload,
} from "@/app/(site)/publicar/autos/shared/lib/autosMuxPublishPrepare";
import type { AutosInventoryAddContext } from "@/app/lib/clasificados/autos/autosDealerInventoryAddFlow";
import {
  clearInventoryAddContextFromSession,
  readInventoryAddContextFromSession,
  resolveInventoryAddReturnHref,
} from "@/app/lib/clasificados/autos/autosDealerInventoryAddFlow";
import { autosDealerInventoryLimitMessage } from "@/app/lib/clasificados/autos/autosDealerInventoryCopy";
import type { AutosAdditionalInventoryVehicleDraft } from "@/app/lib/clasificados/autos/autosAdditionalInventoryDraft";
import { countApplicationInventoryVehicles } from "@/app/lib/clasificados/autos/autosAdditionalInventoryDraft";
import {
  AUTOS_BUNDLE_PUBLISH_RESULT_SESSION_KEY,
  type AutosBundlePublishSessionResult,
} from "@/app/lib/clasificados/autos/autosNegociosBundlePublish";
import { STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT } from "@/app/lib/clasificados/autos/autosDealerInventoryPolicy";
import { autosQaPaymentBypassLabel } from "@/app/lib/clasificados/autos/autosNegociosInventoryBundleCopy";

function sessionKey(lane: AutosClassifiedsLane) {
  return `lx-autos-publish-listing-${lane}`;
}

function formatUsd(n: number | undefined, lang: AutosPublishFlowLang) {
  if (n === undefined || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat(lang === "es" ? "es-US" : "en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function AutosPublishConfirmCore({
  lane,
  lang,
  listing,
  hydrated,
  flushDraft,
  editHref,
  inventoryAddMode = false,
  inventoryAddContext = null,
  additionalInventoryVehicles = [],
}: {
  lane: AutosClassifiedsLane;
  lang: AutosPublishFlowLang;
  listing: AutoDealerListing;
  hydrated: boolean;
  flushDraft: () => Promise<void>;
  editHref: string;
  inventoryAddMode?: boolean;
  inventoryAddContext?: AutosInventoryAddContext | null;
  /** Negocios bundle: additional inventory vehicles from application draft. */
  additionalInventoryVehicles?: AutosAdditionalInventoryVehicleDraft[];
}) {
  const [publishConfirmMode, setPublishConfirmMode] = useState<AutosPublishConfirmMode>("stripe");
  const inventoryCtx = inventoryAddContext ?? (inventoryAddMode ? readInventoryAddContextFromSession() : null);
  const c = getAutosPublishFlowCopy(lang, lane, publishConfirmMode, Boolean(inventoryCtx));
  const [listingId, setListingId] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "preparing" | "ready" | "error">("idle");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [checks, setChecks] = useState([false, false, false]);
  const [payBusy, setPayBusy] = useState(false);
  const [sessionMissing, setSessionMissing] = useState(false);
  const [muxPublishWarnings, setMuxPublishWarnings] = useState<string[]>([]);
  const listingRef = useRef(listing);
  listingRef.current = listing;

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    setPhase("preparing");
    void (async () => {
      setErrorDetail(null);
      let confirmMode: AutosPublishConfirmMode = "stripe";

      const supabase = createSupabaseBrowserClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      try {
        const optRes = await fetch("/api/clasificados/autos/publish-options", {
          cache: "no-store",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (optRes.ok) {
          const opts = (await optRes.json()) as {
            internalBypass?: boolean;
            testPublishBypass?: boolean;
            negociosQaAllowlistBypass?: boolean;
          };
          if (opts.internalBypass) confirmMode = "internal_bypass";
          else if (opts.testPublishBypass) confirmMode = "test_bypass";
          else if (opts.negociosQaAllowlistBypass) confirmMode = "test_bypass";
        }
      } catch {
        /* keep stripe copy */
      }
      if (!cancelled) setPublishConfirmMode(confirmMode);

      if (cancelled) return;
      if (!token) {
        setSessionMissing(true);
        setPhase("ready");
        return;
      }
      setSessionMissing(false);
      const sk = sessionKey(lane);
      const cached = typeof window !== "undefined" ? window.sessionStorage.getItem(sk) : null;
      if (cached) {
        const r = await fetch(`/api/clasificados/autos/listings/${cached}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        if (r.ok) {
          const j = (await r.json()) as { status?: string };
          if (j.status === "draft" || j.status === "pending_payment" || j.status === "payment_failed") {
            const sync = await fetch(`/api/clasificados/autos/listings/${cached}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ listing: omitAutosInlineVideoForApiPayload(listingRef.current), lang }),
            });
            if (cancelled) return;
            if (!sync.ok) {
              window.sessionStorage.removeItem(sk);
            } else {
              setListingId(cached);
              setPhase("ready");
              return;
            }
          }
        }
        window.sessionStorage.removeItem(sk);
      }
      await flushDraft();
      if (cancelled) return;
      const createBody: Record<string, unknown> = {
        listing: omitAutosInlineVideoForApiPayload(listingRef.current),
        lane,
        lang,
      };
      if (inventoryCtx?.parentListingId) {
        createBody.parentListingId = inventoryCtx.parentListingId;
        if (inventoryCtx.dealerInventoryGroupId) createBody.dealerInventoryGroupId = inventoryCtx.dealerInventoryGroupId;
      }
      const res = await fetch("/api/clasificados/autos/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(createBody),
      });
      const j = (await res.json()) as { ok?: boolean; id?: string };
      if (cancelled) return;
      if (!res.ok || !j.id) {
        setErrorDetail(c.createError);
        setPhase("error");
        return;
      }
      window.sessionStorage.setItem(sk, j.id);
      setListingId(j.id);
      setPhase("ready");
    })();
    return () => {
      cancelled = true;
    };
    // `c` is derived from `lang` + `lane`; avoid listing `c.createError` (new fn each render would thrash).
     
  }, [hydrated, lane, lang, flushDraft]);

  useEffect(() => {
    if (phase !== "ready" || !listingId || sessionMissing) return;
    const k = `lx-autos-publish-funnel-${listingId}`;
    if (typeof window !== "undefined" && sessionStorage.getItem(k)) return;
    void (async () => {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;
      if (typeof window !== "undefined") sessionStorage.setItem(k, "1");
      await fetch(`/api/clasificados/autos/listings/${listingId}/analytics`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ eventType: AUTOS_CLASSIFIEDS_EVENT.publishConversion }),
      });
    })();
  }, [phase, listingId, sessionMissing]);

  const allChecked = checks.every(Boolean);
  const loginHref =
    typeof window !== "undefined"
      ? `/clasificados/login?lang=${lang}&redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`
      : `/clasificados/login?lang=${lang}`;

  if (!hydrated || phase === "preparing" || phase === "idle") {
    const detail =
      publishConfirmMode === "stripe"
        ? c.preparingDetailStripe
        : `${c.preparingDetailStripe} ${c.preparingDetailBypass}`.trim();
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center text-[color:var(--lx-text)]">
        <p className="text-sm font-semibold">{c.preparing}</p>
        {detail ? <p className="mt-2 text-xs leading-relaxed text-[color:var(--lx-muted)]">{detail}</p> : null}
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-[color:var(--lx-text)]">
        <p className="font-semibold">{errorDetail ?? c.createError}</p>
        <Link href={editHref} className="mt-6 inline-block text-sm font-bold text-[color:var(--lx-gold)]">
          {c.backEdit}
        </Link>
      </div>
    );
  }

  if (sessionMissing) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-[color:var(--lx-text)]">
        <h1 className="text-2xl font-bold">{c.loginRequiredTitle}</h1>
        <p className="mt-2 text-sm text-[color:var(--lx-text-2)]">{c.loginRequiredBody}</p>
        <a
          href={loginHref}
          className="mt-8 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[color:var(--lx-cta-dark)] px-6 text-sm font-bold text-[#FFFCF7]"
        >
          {c.loginCta}
        </a>
        <div className="mt-6">
          <Link href={editHref} className="text-sm font-semibold text-[color:var(--lx-gold)]">
            {c.backEdit}
          </Link>
        </div>
      </div>
    );
  }

  async function startCheckout() {
    if (!listingId || !allChecked) return;
    const supabase = createSupabaseBrowserClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return;
    setPayBusy(true);
    setMuxPublishWarnings([]);
    const muxLang = lang === "en" ? "en" : "es";
    const prepared = await prepareAutosListingOptionalMuxUpload(listingRef.current, muxLang);
    listingRef.current = prepared.listing;
    if (prepared.publishWarnings.length) setMuxPublishWarnings(prepared.publishWarnings);

    const sync = await fetch(`/api/clasificados/autos/listings/${listingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ listing: omitAutosInlineVideoForApiPayload(listingRef.current), lang }),
    });
    if (!sync.ok) {
      setPayBusy(false);
      setErrorDetail(c.createError);
      setPhase("error");
      return;
    }
    const res = await fetch("/api/clasificados/autos/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        listingId,
        lang,
        ...(inventoryCtx?.returnToListingId ? { returnToListingId: inventoryCtx.returnToListingId } : {}),
        ...(lane === "negocios" && additionalInventoryVehicles.length > 0 && !inventoryCtx
          ? { additionalInventoryVehicles }
          : {}),
      }),
    });
    const j = (await res.json()) as {
      ok?: boolean;
      url?: string;
      internalBypass?: boolean;
      testPublishBypass?: boolean;
      negociosQaAllowlistBypass?: boolean;
      successUrl?: string;
      error?: string;
      message?: string;
      bundlePublish?: {
        mainListingId: string;
        published: AutosBundlePublishSessionResult["published"];
        totalPublished: number;
        additionalSkipped: number;
        inventoryIncluded: number;
        inventoryLimit: number;
      };
    };
    setPayBusy(false);
    if (!res.ok && j.error === "dealer_active_limit_reached") {
      setErrorDetail(j.message ?? autosDealerInventoryLimitMessage(lang));
      setPhase("error");
      return;
    }
    if (!res.ok && j.error === "bundle_requires_qa_bypass") {
      setErrorDetail(j.message ?? c.checkoutErrorGeneric);
      setPhase("error");
      return;
    }
    if (
      res.ok &&
      (j.internalBypass || j.testPublishBypass || j.negociosQaAllowlistBypass) &&
      typeof j.successUrl === "string" &&
      j.successUrl
    ) {
      if (j.bundlePublish && typeof window !== "undefined") {
        const sessionResult: AutosBundlePublishSessionResult = {
          mainListingId: j.bundlePublish.mainListingId,
          published: j.bundlePublish.published,
          totalPublished: j.bundlePublish.totalPublished,
          qaBypass: true,
          inventoryIncluded: j.bundlePublish.inventoryIncluded,
          inventoryLimit: j.bundlePublish.inventoryLimit,
        };
        window.sessionStorage.setItem(AUTOS_BUNDLE_PUBLISH_RESULT_SESSION_KEY, JSON.stringify(sessionResult));
      }
      if (inventoryCtx) {
        clearInventoryAddContextFromSession();
        const returnHref = resolveInventoryAddReturnHref({
          returnToListingId: inventoryCtx.returnToListingId,
          newListingId: listingId,
          lang,
        });
        window.location.href = returnHref;
        return;
      }
      window.location.href = j.successUrl;
      return;
    }
    if (res.ok && j.url) {
      window.location.href = j.url;
      return;
    }
    const code = j.error ?? "";
    const msg =
      code === "stripe_not_configured"
        ? c.checkoutErrorStripe
        : code === "stripe_price_missing"
          ? c.checkoutErrorPrice
          : c.checkoutErrorGeneric;
    setErrorDetail(msg);
    setPhase("error");
  }

  const vehicleLine =
    buildVehicleTitle(listing.year, listing.make, listing.model, listing.trim) ||
    normalizeVehicleSegment(listing.vehicleTitle?.trim()) ||
    "—";
  const locLine = [listing.city, listing.state, listing.zip].filter((x) => (x ?? "").trim()).join(", ") || "—";
  const qaBypassActive = publishConfirmMode !== "stripe";
  const bundleCount =
    lane === "negocios" && !inventoryCtx ? countApplicationInventoryVehicles(additionalInventoryVehicles.length) : 0;

  const summaryRow = (label: string, value: ReactNode, valueClass = "font-semibold text-[color:var(--lx-text)]") => (
    <div className="flex flex-col gap-1 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6 sm:py-3">
      <dt className="shrink-0 text-[11px] font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">{label}</dt>
      <dd className={`min-w-0 text-[15px] leading-snug sm:max-w-[min(100%,280px)] sm:text-right ${valueClass}`}>{value}</dd>
    </div>
  );

  return (
    <div className="mx-auto max-w-xl px-[max(1rem,env(safe-area-inset-left))] py-8 pb-[max(2rem,env(safe-area-inset-bottom))] pr-[max(1rem,env(safe-area-inset-right))] text-[color:var(--lx-text)] sm:py-10">
      <h1 className="text-2xl font-bold tracking-tight sm:text-[1.65rem]">{c.title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-[color:var(--lx-text-2)]">{c.subtitle}</p>
      {qaBypassActive ? (
        <p className="mt-3 inline-flex rounded-full border border-amber-300/80 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-950">
          {autosQaPaymentBypassLabel(lang)}
        </p>
      ) : null}
      {bundleCount > 1 ? (
        <p className="mt-3 text-xs leading-relaxed text-[color:var(--lx-muted)]">
          {lang === "es"
            ? `Esta solicitud publicará ${bundleCount} vehículos (${bundleCount}/${STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT} incluidos) bajo el mismo inventario del dealer.`
            : `This application will publish ${bundleCount} vehicles (${bundleCount}/${STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT} included) under the same dealer inventory.`}
          {!qaBypassActive
            ? lang === "es"
              ? " Con pago Stripe solo se activa el vehículo principal; los adicionales se agregan después desde el inventario."
              : " With Stripe payment only the main vehicle activates; add additional vehicles from inventory afterward."
            : null}
        </p>
      ) : null}
      <dl className="mt-8 divide-y divide-[color:var(--lx-nav-border)]/80 rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-4 py-2 text-sm shadow-sm sm:px-5 sm:py-3">
        {summaryRow(c.laneLine, c.laneValue)}
        {summaryRow(c.summaryVehicle, vehicleLine)}
        {summaryRow(c.summaryPrice, formatUsd(listing.price, lang))}
        {lane === "negocios" && listing.monthlyEstimate?.trim()
          ? summaryRow(c.summaryMonthly, listing.monthlyEstimate.trim(), "font-medium text-[color:var(--lx-text-2)]")
          : null}
        {summaryRow(c.summaryLocation, locLine, "font-medium text-[color:var(--lx-text-2)]")}
      </dl>
      {muxPublishWarnings.length > 0 ? (
        <div
          className="mt-6 rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
          role="status"
        >
          <p className="font-semibold">{lang === "es" ? "Aviso de video (opcional)" : "Optional video notice"}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {muxPublishWarnings.map((w, i) => (
              <li key={`${i}-${w.slice(0, 48)}`}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <ul className="mt-8 space-y-4">
        {[0, 1, 2].map((i) => (
          <li key={i}>
            <label className="flex cursor-pointer items-start gap-3 text-sm leading-snug">
              <input
                type="checkbox"
                className="mt-0.5 h-5 w-5 shrink-0 rounded border-[color:var(--lx-nav-border)]"
                checked={checks[i]!}
                onChange={(e) => {
                  const next = [...checks];
                  next[i] = e.target.checked;
                  setChecks(next);
                }}
              />
              <span>{[c.checks.accurate, c.checks.rules, c.checks.paid][i]}</span>
            </label>
          </li>
        ))}
      </ul>
      {!allChecked ? <p className="mt-4 text-xs leading-relaxed text-[color:var(--lx-muted)]">{c.mustCheck}</p> : null}
      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          disabled={!listingId || !allChecked || payBusy}
          onClick={() => void startCheckout()}
          className="inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-[color:var(--lx-cta-dark)] px-6 text-sm font-bold text-[#FFFCF7] transition active:opacity-90 disabled:opacity-50 sm:w-auto"
        >
          {payBusy ? c.payBusy : c.payCta}
        </button>
        <Link
          href={editHref}
          className="inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-[color:var(--lx-nav-border)] px-6 text-sm font-bold text-[color:var(--lx-text)] transition active:opacity-90 sm:w-auto"
        >
          {c.backEdit}
        </Link>
      </div>
    </div>
  );
}
