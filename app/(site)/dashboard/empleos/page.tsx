"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { formatEmpleosLocationLine } from "@/app/publicar/empleos/shared/lib/empleosGlobalLocation";

import { LeonixDashboardShell } from "../components/LeonixDashboardShell";
import { OwnerProductPageFrame } from "../components/OwnerProductPageFrame";
import { OwnerEntityWorkspace } from "../components/OwnerEntityWorkspace";
import type { ActionItem } from "../components/DashboardListingActionBar";
import { getOwnerEntityCapabilities, isLiveCapability } from "../lib/ownerEntityCapabilityRegistry";
import { resolveListingUiStatus, listingUiStatusLabel, listingUiStatusChipClass } from "../lib/listingDisplayStatus";
import {
  editListingLabel,
  publicViewLabel,
  publicResultsLabel,
  pauseListingLabel,
  resumeListingLabel,
  archiveListingLabel,
} from "../lib/dashboardMisAnunciosCategoryTools";
import { ownerToolsTitle, ownerApplicationsModuleTitle } from "../lib/dashboardI18n";
import { getStatusChipClass } from "@/app/lib/clasificados/listingLifecycleDomain";
import {
  dashboardAwaitingPaymentLabel,
  dashboardCompletePaymentLabel,
  dashboardNotLiveNote,
  dashboardStartingPaymentLabel,
  isEmpleosDraftAwaitingPayment,
} from "../lib/dashboardPendingPayment";
import { startDashboardResumePayment } from "../lib/dashboardResumePaymentClient";
import {
  dashboardEmpleosOwnerTransitions,
  dashboardEmpleosTransitionErrorMessage,
  dashboardOwnerActionPlan,
  dashboardOwnerReasonNote,
  dashboardVisibleModerationReason,
} from "../lib/dashboardListingStateMachine";

export const dynamic = "force-dynamic";

type Lang = "es" | "en";

type Row = {
  id: string;
  slug: string;
  title: string;
  company_name: string;
  lifecycle_status: string;
  lane: string;
  leonix_ad_id?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  listing_snapshot?: {
    jobRecord?: {
      stateRegion?: string | null;
      country?: string | null;
      employerAddressLine?: string | null;
      employerAddressLine2?: string | null;
    };
  } | null;
  updated_at: string;
  /** Set when the row was ever live (gates the owner's reopen of an archived post). */
  published_at?: string | null;
  /** Staff marker: non-empty = a staff decision / hold is attached to the row. */
  moderation_reason?: string | null;
};

function laneLabel(lane: string, lang: Lang): string {
  if (lane === "quick") return lang === "es" ? "Empleo local" : "Local job ad";
  if (lane === "premium") return lang === "es" ? "Preservado (premium)" : "Preserved (premium)";
  if (lane === "feria") return lang === "es" ? "Feria de empleo" : "Job fair";
  return lane;
}

function empleosEditHref(lane: string, id: string, q: string): string | null {
  if (lane === "quick") return `/publicar/empleos/quick?edit=${id}&${q}`;
  if (lane === "premium") return `/publicar/empleos/premium?edit=${id}&${q}`;
  if (lane === "feria") return `/publicar/empleos/feria?edit=${id}&${q}`;
  return null;
}

function EmpleosEmployerDashboardPageContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const pathname = "/dashboard/empleos";
  const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";
  const q = `lang=${lang}`;
  const capabilities = getOwnerEntityCapabilities("empleos");

  const t = useMemo(
    () =>
      lang === "es"
        ? {
            eyebrow: "Empleos",
            title: "Tus vacantes",
            subtitle: "Tus anuncios de empleo publicados o en revisión en Leonix.",
            loading: "Cargando…",
            empty: "Aún no tienes vacantes en esta cuenta.",
            publish: "Publicar vacante",
            moreOptions: "Más opciones",
            moreOptionsClose: "Cerrar",
            company: "Empresa",
            location: "Ubicación",
            updated: "Actualizado",
          }
        : {
            eyebrow: "Jobs",
            title: "Your job listings",
            subtitle: "Your job ads published or under review on Leonix.",
            loading: "Loading…",
            empty: "No job listings for this account yet.",
            publish: "Post a job",
            moreOptions: "More options",
            moreOptionsClose: "Close",
            company: "Company",
            location: "Location",
            updated: "Updated",
          },
    [lang],
  );

  const [authLoading, setAuthLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  /** CLOSEOUT 2 — paid-lane draft "Completar pago": row in flight + last checkout-client message. */
  const [payBusyId, setPayBusyId] = useState<string | null>(null);
  const [payError, setPayError] = useState<{ id: string; message: string } | null>(null);
  /** Gate 2: a FAILED read is an error, never the "no vacantes yet" empty state; a refused lifecycle action is shown. */
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<{ id: string; message: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createSupabaseBrowserClient();
    void (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          const redirect = encodeURIComponent(`${pathname}${typeof window !== "undefined" ? window.location.search || "" : ""}`);
          router.replace(`/login?redirect=${redirect}`);
          return;
        }
        if (!cancelled) setOwnerId(userData.user.id);
        const { data, error } = await supabase
          .from("empleos_public_listings")
          .select("id, slug, title, company_name, lifecycle_status, lane, leonix_ad_id, city, state, postal_code, listing_snapshot, updated_at, published_at, moderation_reason")
          .eq("owner_user_id", userData.user.id)
          .order("updated_at", { ascending: false });
        if (!cancelled) {
          if (!error && data) {
            setRows(data as Row[]);
            setLoadError(null);
          } else {
            console.error("[dashboard/empleos] read failed", error?.message ?? "no data");
            setLoadError(
              lang === "es"
                ? "No pudimos cargar tus vacantes. Actualiza la página e inténtalo de nuevo."
                : "We could not load your job listings. Refresh the page and try again.",
            );
          }
        }
      } catch (err) {
        console.error("[dashboard/empleos] load failed", err);
        if (!cancelled) {
          setLoadError(
            lang === "es"
              ? "No pudimos cargar tus vacantes. Actualiza la página e inténtalo de nuevo."
              : "We could not load your job listings. Refresh the page and try again.",
          );
        }
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function patchStatus(listingId: string, next: "published" | "paused" | "archived") {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;
    setBusyId(listingId);
    setActionError(null);
    try {
      const res = await fetch(`/api/clasificados/empleos/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ lifecycle_status: next }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (json.ok) {
        setRows((prev) => prev.map((r) => (r.id === listingId ? { ...r, lifecycle_status: next } : r)));
      } else {
        // Never fail silently (Gate 2): the policy refuses with payment_required / staff_hold / forbidden_transition.
        setActionError({ id: listingId, message: dashboardEmpleosTransitionErrorMessage(json.error, lang) });
      }
    } finally {
      setBusyId(null);
    }
  }

  /** CLOSEOUT 2 — Revenue OS EMPLEOS_PAID_JOB_CHECKOUT for this owned `draft` row (server accepts only draft). */
  async function completePayment(r: Row) {
    setPayBusyId(r.id);
    setPayError(null);
    try {
      const result = await startDashboardResumePayment({
        lane: "empleos",
        listingId: r.id,
        leonixAdId: r.leonix_ad_id ?? null,
        lang,
      });
      if (!result.ok) {
        setPayError({ id: r.id, message: result.userMessage });
        setPayBusyId(null);
      }
    } catch {
      setPayError({
        id: r.id,
        message:
          lang === "es"
            ? "No pudimos iniciar el pago seguro. Intenta de nuevo o contacta a Leonix."
            : "We could not start secure payment. Please try again or contact Leonix.",
      });
      setPayBusyId(null);
    }
  }

  const rowLocationLine = (r: Row) =>
    formatEmpleosLocationLine(
      {
        city: r.city,
        stateRegion: r.listing_snapshot?.jobRecord?.stateRegion ?? r.state,
        postalCode: r.postal_code,
        country: r.listing_snapshot?.jobRecord?.country,
        addressLine1: r.listing_snapshot?.jobRecord?.employerAddressLine,
        addressLine2: r.listing_snapshot?.jobRecord?.employerAddressLine2,
      },
      { compact: true, includePostal: true },
    );

  return (
    <LeonixDashboardShell
      lang={lang}
      activeNav="empleos"
      plan="free"
      userName={null}
      email={null}
      accountRef={null}
      ownerId={ownerId}
      contentLayout="workbench"
    >
      <OwnerProductPageFrame
        eyebrow={t.eyebrow}
        title={t.title}
        subtitle={t.subtitle}
        primaryAction={{ href: appendLangToPath("/publicar/empleos", lang), label: t.publish }}
        secondaryAction={{ href: appendLangToPath("/clasificados/empleos/resultados", lang), label: publicResultsLabel(lang) }}
        loading={authLoading}
        loadingLabel={t.loading}
        error={!authLoading ? loadError : null}
        empty={!authLoading && !loadError && rows.length === 0}
        emptyLabel={t.empty}
      >
        {rows.map((r) => {
          const uiStatus = resolveListingUiStatus({ status: r.lifecycle_status });
          // Gate 2: one owner plan per row - the reason note, the public link and every lifecycle button come from the
          // same status / marker truth as the server transition policy.
          const empleosPlan = dashboardOwnerActionPlan("empleos", {
            status: r.lifecycle_status,
            lane: r.lane,
            published_at: r.published_at,
            moderation_reason: r.moderation_reason,
          });
          const empleosTransitions = dashboardEmpleosOwnerTransitions({
            lane: r.lane,
            lifecycle_status: r.lifecycle_status,
            published_at: r.published_at,
            moderation_reason: r.moderation_reason,
          });
          const reasonNote = dashboardOwnerReasonNote(empleosPlan.reason, lang);
          const rowActionError = actionError && actionError.id === r.id ? actionError.message : null;
          // CLOSEOUT 2 — a paid-lane (quick / premium) draft is an UNPAID application, not a resumable draft.
          const awaitingPayment = isEmpleosDraftAwaitingPayment(r);
          const rowPayError = payError && payError.id === r.id ? payError.message : null;
          const editHref = empleosEditHref(r.lane, r.id, q);
          const locationLine = rowLocationLine(r);
          const busy = busyId === r.id;
          const supportsApplications = r.lane !== "feria" && isLiveCapability(capabilities.specialized.applications);
          const detailItems = [
            r.company_name ? { label: t.company, value: r.company_name, wide: true } : null,
            locationLine ? { label: t.location, value: locationLine } : null,
            r.updated_at ? { label: t.updated, value: new Date(r.updated_at).toLocaleString(lang === "es" ? "es-US" : "en-US") } : null,
          ].filter((x): x is { label: string; value: string; wide?: boolean } => x !== null);

          const quickActions: ActionItem[] = [];
          if (awaitingPayment) {
            quickActions.push({
              label: payBusyId === r.id ? dashboardStartingPaymentLabel(lang) : dashboardCompletePaymentLabel(lang),
              onClick: () => void completePayment(r),
              disabled: payBusyId === r.id,
              tone: "warning",
            });
          }
          if (empleosPlan.viewPublic && isLiveCapability(capabilities.identity.publicView)) {
            quickActions.push({
              href: appendLangToPath(`/clasificados/empleos/${r.slug}`, lang),
              label: publicViewLabel(lang),
              tone: "secondary",
            });
          }

          const lifecycleActions: ActionItem[] = [];
          if (isLiveCapability(capabilities.lifecycle.pause) && empleosTransitions.pause) {
            lifecycleActions.push({
              label: pauseListingLabel(lang),
              onClick: () => void patchStatus(r.id, "paused"),
              disabled: busy,
              tone: "warning",
            });
          }
          if (
            isLiveCapability(capabilities.lifecycle.reactivate) &&
            // Exactly what `resolveEmpleosOwnerTransition` (the server policy) accepts: a paid-lane draft only goes live
            // through payment, a STAFF-held pause / archive is never owner-resumable, a never-live archive cannot be
            // reopened, and a Feria (free lane) draft may still be published.
            empleosTransitions.resume
          ) {
            lifecycleActions.push({
              label: resumeListingLabel(lang),
              onClick: () => void patchStatus(r.id, "published"),
              disabled: busy,
              tone: "positive",
            });
          }
          if (isLiveCapability(capabilities.lifecycle.archive) && empleosTransitions.archive) {
            // UX Completion Gate — same confirmation added to the Empleos detail page for
            // this identical Red/terminal action; keeps both surfaces consistent.
            lifecycleActions.push({
              label: archiveListingLabel(lang),
              onClick: () => {
                if (
                  !confirm(
                    lang === "es"
                      ? "¿Archivar esta vacante? Dejará de mostrarse al público."
                      : "Archive this job listing? It will stop showing publicly.",
                  )
                )
                  return;
                void patchStatus(r.id, "archived");
              },
              disabled: busy,
              tone: "danger",
            });
          }

          const specializedActions: ActionItem[] = supportsApplications
            ? [{ href: `/dashboard/empleos/${r.id}?${q}`, label: ownerApplicationsModuleTitle(lang), tone: "premium" }]
            : [];

          return (
            <OwnerEntityWorkspace
              key={r.id}
              lang={lang}
              header={{
                eyebrow: t.eyebrow,
                title: r.title,
                statusLabel: awaitingPayment ? dashboardAwaitingPaymentLabel(lang) : listingUiStatusLabel(uiStatus, lang),
                statusChipClass: awaitingPayment ? getStatusChipClass("pending_payment") : listingUiStatusChipClass(uiStatus),
                badges: [laneLabel(r.lane, lang)],
              }}
              note={
                rowPayError
                  ? { text: rowPayError, tone: "urgent" }
                  : rowActionError
                    ? { text: rowActionError, tone: "urgent" }
                    : awaitingPayment
                      ? { text: dashboardNotLiveNote(lang), tone: "warning" }
                      : reasonNote && empleosPlan.reason !== "live"
                        ? {
                            text: dashboardVisibleModerationReason(r.moderation_reason)
                              ? `${reasonNote} (${dashboardVisibleModerationReason(r.moderation_reason)})`
                              : reasonNote,
                            tone: "warning",
                          }
                        : null
              }
              detailItems={detailItems}
              primaryAction={{ href: editHref ?? `/dashboard/empleos/${r.id}?${q}`, label: editListingLabel(lang) }}
              quickActions={quickActions}
              lifecycleActions={lifecycleActions}
              specialized={specializedActions.length > 0 ? { title: ownerToolsTitle(lang), actions: specializedActions } : undefined}
              mobileSheetLabels={{ trigger: t.moreOptions, title: t.moreOptions, close: t.moreOptionsClose }}
            />
          );
        })}
      </OwnerProductPageFrame>
    </LeonixDashboardShell>
  );
}

export default function EmpleosEmployerDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
      <EmpleosEmployerDashboardPageContent />
    </Suspense>
  );
}
