"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, Suspense } from "react";

import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";

import { LeonixDashboardShell } from "../../components/LeonixDashboardShell";
import { OwnerEntityWorkspace } from "../../components/OwnerEntityWorkspace";
import type { OwnerEntityActivityItem } from "../../components/OwnerEntityActivity";
import type { ActionItem } from "../../components/DashboardListingActionBar";
import { getOwnerEntityCapabilities, isLiveCapability } from "../../lib/ownerEntityCapabilityRegistry";
import { resolveListingUiStatus, listingUiStatusLabel, listingUiStatusChipClass } from "../../lib/listingDisplayStatus";
import {
  editListingLabel,
  publicViewLabel,
  pauseListingLabel,
  resumeListingLabel,
  archiveListingLabel,
} from "../../lib/dashboardMisAnunciosCategoryTools";
import { ownerToolsTitle, ownerApplicationsModuleTitle } from "../../lib/dashboardI18n";
import { getStatusChipClass } from "@/app/lib/clasificados/listingLifecycleDomain";
import {
  dashboardAwaitingPaymentLabel,
  dashboardCompletePaymentLabel,
  dashboardNotLiveNote,
  dashboardStartingPaymentLabel,
  isEmpleosDraftAwaitingPayment,
} from "../../lib/dashboardPendingPayment";
import { startDashboardResumePayment } from "../../lib/dashboardResumePaymentClient";
import {
  dashboardEmpleosOwnerTransitions,
  dashboardEmpleosTransitionErrorMessage,
  dashboardOwnerActionPlan,
  dashboardOwnerReasonNote,
  dashboardVisibleModerationReason,
} from "../../lib/dashboardListingStateMachine";

export const dynamic = "force-dynamic";

type Lang = "es" | "en";

type ListingRow = {
  id: string;
  slug: string;
  title: string;
  company_name: string;
  lifecycle_status: string;
  lane: string;
  leonix_ad_id?: string | null;
  moderation_reason: string | null;
  apply_count?: number | null;
  view_count?: number | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

type AppRow = {
  id: string;
  applicant_name: string;
  applicant_email: string;
  message: string;
  answers_json: unknown;
  status: string;
  created_at: string;
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

function EmpleosEmployerManagePageContent() {
  const params = useParams();
  const listingId = String(params?.listingId ?? "");
  const router = useRouter();
  const sp = useSearchParams();
  const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";
  const q = `lang=${lang}`;
  const capabilities = getOwnerEntityCapabilities("empleos");

  const t = useMemo(
    () =>
      lang === "es"
        ? {
            loading: "Cargando…",
            notFound: "No encontramos este listado o no tienes acceso.",
            back: "Volver a mis vacantes",
            noApps: "Sin aplicaciones aún.",
            company: "Empresa",
            updated: "Actualizado",
            published: "Publicado",
            moderation: "Moderación",
            views: "Vistas",
            applications: "Aplicaciones",
            setViewed: "Marcar visto",
            setShort: "Preseleccionar",
            setReject: "Rechazar",
            moreOptions: "Más opciones",
            moreOptionsClose: "Cerrar",
            performanceTitle: "Rendimiento",
            feriaNote:
              "Esta publicación usa contacto del organizador en la página pública. Leonix no recopila aplicaciones internas para ferias.",
            eyebrow: "Empleos",
          }
        : {
            loading: "Loading…",
            notFound: "We could not find this listing or you do not have access.",
            back: "Back to my listings",
            noApps: "No applications yet.",
            company: "Company",
            updated: "Updated",
            published: "Published",
            moderation: "Moderation",
            views: "Views",
            applications: "Applications",
            setViewed: "Mark viewed",
            setShort: "Shortlist",
            setReject: "Reject",
            moreOptions: "More options",
            moreOptionsClose: "Close",
            performanceTitle: "Performance",
            feriaNote:
              "This post uses organizer contact on the public page. Leonix does not collect internal applications for job fairs.",
            eyebrow: "Jobs",
          },
    [lang],
  );

  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState<ListingRow | null>(null);
  const [apps, setApps] = useState<AppRow[]>([]);
  const [appsLoaded, setAppsLoaded] = useState(false);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  /** CLOSEOUT 2 — paid-lane draft "Completar pago": in-flight flag + last checkout-client message. */
  const [payBusy, setPayBusy] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  /** Gate 2: a failed READ is not "listing not found", and a refused lifecycle action is shown, never swallowed. */
  const [readFailed, setReadFailed] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const refreshListing = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.replace(`/login?redirect=${encodeURIComponent(`/dashboard/empleos/${listingId}`)}`);
        return;
      }
      setOwnerId(userData.user.id);
      const { data: listing, error } = await supabase.from("empleos_public_listings").select("*").eq("id", listingId).maybeSingle();
      if (error) {
        console.error("[dashboard/empleos/listing] read failed", error.message);
        setReadFailed(true);
        setRow(null);
        return;
      }
      setReadFailed(false);
      if (!listing) {
        setRow(null);
        return;
      }
      setRow(listing as ListingRow);
    } catch (err) {
      console.error("[dashboard/empleos/listing] refresh failed", err);
      setReadFailed(true);
      setRow(null);
    } finally {
      setLoading(false);
    }
  }, [listingId, router]);

  const refreshApplications = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) return;
      const res = await fetch(`/api/clasificados/empleos/listings/${listingId}/applications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = (await res.json()) as { ok?: boolean; rows?: AppRow[] };
      if (json.ok && json.rows) setApps(json.rows);
    } catch (err) {
      console.error("[dashboard/empleos/listing] applications load failed", err);
    } finally {
      setAppsLoaded(true);
    }
  }, [listingId]);

  useEffect(() => {
    void refreshListing();
  }, [refreshListing]);

  useEffect(() => {
    if (!row || row.lane === "feria") {
      setAppsLoaded(true);
      return;
    }
    void refreshApplications();
  }, [row, refreshApplications]);

  async function patchAppStatus(appId: string, status: "viewed" | "shortlisted" | "rejected") {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;
    const res = await fetch(`/api/clasificados/empleos/applications/${appId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    const json = (await res.json()) as { ok?: boolean };
    if (json.ok) void refreshApplications();
  }

  /** CLOSEOUT 2 — Revenue OS EMPLEOS_PAID_JOB_CHECKOUT for this owned `draft` row (server accepts only draft). */
  async function completePayment() {
    if (!row) return;
    setPayBusy(true);
    setPayError(null);
    try {
      const result = await startDashboardResumePayment({
        lane: "empleos",
        listingId: row.id,
        leonixAdId: row.leonix_ad_id ?? null,
        lang,
      });
      if (!result.ok) {
        setPayError(result.userMessage);
        setPayBusy(false);
      }
    } catch {
      setPayError(
        lang === "es"
          ? "No pudimos iniciar el pago seguro. Intenta de nuevo o contacta a Leonix."
          : "We could not start secure payment. Please try again or contact Leonix.",
      );
      setPayBusy(false);
    }
  }

  async function patchStatus(next: "published" | "paused" | "archived") {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;
    setBusy(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/clasificados/empleos/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ lifecycle_status: next }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (json.ok) void refreshListing();
      else setActionError(dashboardEmpleosTransitionErrorMessage(json.error, lang));
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <LeonixDashboardShell lang={lang} activeNav="listings" plan="free" userName={null} email={null} accountRef={null} ownerId={ownerId} contentLayout="workbench">
        <p className="text-sm text-[#5C5346]">{t.loading}</p>
      </LeonixDashboardShell>
    );
  }

  if (!row) {
    return (
      <LeonixDashboardShell lang={lang} activeNav="listings" plan="free" userName={null} email={null} accountRef={null} ownerId={ownerId} contentLayout="workbench">
        <p className="text-[#5C5346]">
          {readFailed
            ? lang === "es"
              ? "No pudimos cargar este listado. Actualiza la página e inténtalo de nuevo."
              : "We could not load this listing. Refresh the page and try again."
            : t.notFound}
        </p>
        <Link href={`/dashboard/empleos?${q}`} className="mt-4 inline-block font-semibold underline">
          {t.back}
        </Link>
      </LeonixDashboardShell>
    );
  }

  const uiStatus = resolveListingUiStatus({ status: row.lifecycle_status });
  // CLOSEOUT 2 — a paid-lane (quick / premium) draft is an UNPAID application, not a resumable draft.
  const awaitingPayment = isEmpleosDraftAwaitingPayment(row);
  // Gate 2: owner plan from the SAME truth as the server transition policy (see dashboardListingStateMachine).
  const empleosPlan = dashboardOwnerActionPlan("empleos", {
    status: row.lifecycle_status,
    lane: row.lane,
    published_at: row.published_at,
    moderation_reason: row.moderation_reason,
  });
  const empleosTransitions = dashboardEmpleosOwnerTransitions({
    lane: row.lane,
    lifecycle_status: row.lifecycle_status,
    published_at: row.published_at,
    moderation_reason: row.moderation_reason,
  });
  const reasonNote = dashboardOwnerReasonNote(empleosPlan.reason, lang);
  const visibleModeration = dashboardVisibleModerationReason(row.moderation_reason);
  const editHref = empleosEditHref(row.lane, row.id, q);
  const supportsApplications = row.lane !== "feria" && isLiveCapability(capabilities.specialized.applications);

  const detailItems = [
    row.company_name ? { label: t.company, value: row.company_name, wide: true } : null,
    row.published_at ? { label: t.published, value: new Date(row.published_at).toLocaleString(lang === "es" ? "es-US" : "en-US") } : null,
    row.updated_at ? { label: t.updated, value: new Date(row.updated_at).toLocaleString(lang === "es" ? "es-US" : "en-US") } : null,
  ].filter((x): x is { label: string; value: string; wide?: boolean } => x !== null);

  const performanceMetrics = [
    typeof row.view_count === "number" ? { key: "views", label: t.views, value: row.view_count } : null,
    supportsApplications && typeof row.apply_count === "number"
      ? { key: "applications", label: t.applications, value: row.apply_count }
      : null,
  ].filter((x): x is { key: string; label: string; value: number } => x !== null);

  const quickActions: ActionItem[] = [];
  if (awaitingPayment) {
    quickActions.push({
      label: payBusy ? dashboardStartingPaymentLabel(lang) : dashboardCompletePaymentLabel(lang),
      onClick: () => void completePayment(),
      disabled: payBusy,
      tone: "warning",
    });
  }
  if (empleosPlan.viewPublic && isLiveCapability(capabilities.identity.publicView)) {
    quickActions.push({
      href: appendLangToPath(`/clasificados/empleos/${row.slug}`, lang),
      label: publicViewLabel(lang),
      tone: "secondary",
    });
  }

  const lifecycleActions: ActionItem[] = [];
  if (isLiveCapability(capabilities.lifecycle.pause) && empleosTransitions.pause) {
    lifecycleActions.push({ label: pauseListingLabel(lang), onClick: () => void patchStatus("paused"), disabled: busy, tone: "warning" });
  }
  if (
    isLiveCapability(capabilities.lifecycle.reactivate) &&
    // Exactly what `resolveEmpleosOwnerTransition` (the server policy) accepts: paid-lane drafts only go live through
    // payment, a STAFF-held pause / archive is never owner-resumable, a never-live archive cannot be reopened, and a
    // Feria (free lane) draft may still be published - no dead "resume" button.
    empleosTransitions.resume
  ) {
    lifecycleActions.push({ label: resumeListingLabel(lang), onClick: () => void patchStatus("published"), disabled: busy, tone: "positive" });
  }
  if (isLiveCapability(capabilities.lifecycle.archive) && empleosTransitions.archive) {
    // UX Completion Gate — this Red/terminal action (Master Bible SS10) had no confirmation,
    // unlike the generic entity workspace's and BR's equivalent archive actions.
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
        void patchStatus("archived");
      },
      disabled: busy,
      tone: "danger",
    });
  }

  const activityItems: OwnerEntityActivityItem[] = supportsApplications
    ? apps.map((a) => {
        const extra =
          a.answers_json && typeof a.answers_json === "object" && Object.keys(a.answers_json as object).length
            ? `\n${JSON.stringify(a.answers_json, null, 2)}`
            : "";
        return {
          id: a.id,
          actor: a.applicant_name,
          date: a.created_at,
          contactHref: a.applicant_email ? `mailto:${a.applicant_email}` : null,
          contactLabel: a.applicant_email || null,
          message: `${a.message ?? ""}${extra}`.trim(),
          status: a.status,
          actions: [
            { label: t.setViewed, onClick: () => void patchAppStatus(a.id, "viewed"), tone: "secondary" },
            { label: t.setShort, onClick: () => void patchAppStatus(a.id, "shortlisted"), tone: "positive" },
            { label: t.setReject, onClick: () => void patchAppStatus(a.id, "rejected"), tone: "danger" },
          ],
        };
      })
    : [];

  return (
    <LeonixDashboardShell
      lang={lang}
      activeNav="listings"
      plan="free"
      userName={null}
      email={null}
      accountRef={null}
      ownerId={ownerId}
      contentLayout="workbench"
    >
      <OwnerEntityWorkspace
        lang={lang}
        header={{
          eyebrow: t.eyebrow,
          title: row.title,
          subtitle: row.company_name,
          statusLabel: awaitingPayment ? dashboardAwaitingPaymentLabel(lang) : listingUiStatusLabel(uiStatus, lang),
          statusChipClass: awaitingPayment ? getStatusChipClass("pending_payment") : listingUiStatusChipClass(uiStatus),
          badges: [laneLabel(row.lane, lang)],
        }}
        note={
          payError
            ? { text: payError, tone: "urgent" }
            : actionError
              ? { text: actionError, tone: "urgent" }
              : awaitingPayment
                ? { text: dashboardNotLiveNote(lang), tone: "warning" }
                : reasonNote && empleosPlan.reason !== "live"
                  ? { text: visibleModeration ? `${reasonNote} ${t.moderation}: ${visibleModeration}` : reasonNote, tone: "warning" }
                  : visibleModeration
                    ? { text: `${t.moderation}: ${visibleModeration}`, tone: "warning" }
                    : null
        }
        detailItems={detailItems}
        performance={performanceMetrics.length > 0 ? { title: t.performanceTitle, metrics: performanceMetrics } : undefined}
        primaryAction={{ href: editHref ?? `/dashboard/empleos/${row.id}?${q}`, label: editListingLabel(lang) }}
        quickActions={quickActions}
        lifecycleActions={lifecycleActions}
        specialized={{
          title: ownerToolsTitle(lang),
          actions: supportsApplications
            ? [{ href: `#empleos-applications`, label: ownerApplicationsModuleTitle(lang), tone: "premium" }]
            : [],
        }}
        activity={
          supportsApplications
            ? {
                title: ownerApplicationsModuleTitle(lang),
                items: activityItems,
                emptyLabel: appsLoaded ? t.noApps : t.loading,
                // Real scroll target for the "Aplicaciones" specialized-tools CTA above — was
                // previously an empty marker placed AFTER this whole card (so the anchor scrolled
                // past the actual applications list instead of to it); now the applications
                // section itself carries the id the CTA jumps to.
                id: "empleos-applications",
              }
            : undefined
        }
        mobileSheetLabels={{ trigger: t.moreOptions, title: t.moreOptions, close: t.moreOptionsClose }}
        footerHint={row.lane === "feria" ? t.feriaNote : null}
      />
      <Link href={`/dashboard/empleos?${q}`} className="mt-6 inline-flex text-sm font-semibold underline">
        ← {t.back}
      </Link>
    </LeonixDashboardShell>
  );
}

export default function EmpleosEmployerManagePage() {
  return (
    <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
      <EmpleosEmployerManagePageContent />
    </Suspense>
  );
}
