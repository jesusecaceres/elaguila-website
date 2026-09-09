/**
 * EXEC-REPORTS-01 first-wave adapters — wrap canonical admin queries only.
 * Read-only. No source rewrite. No fake metrics. No message bodies.
 */
import "server-only";

import { ADMIN_DASHBOARD_ROUTES } from "@/app/admin/_lib/adminDashboardRoutes";
import {
  getAdminDashboardLeadsCounts,
  getAdminDashboardSnapshot,
  splitAdminDashboardExpiringQueue,
} from "@/app/admin/_lib/adminDashboardData";
import { fetchPaymentTrackerSnapshot } from "@/app/admin/_lib/paymentTrackerData";
import { listBusinessesForWorkspace } from "@/app/admin/_lib/businessWorkspaceData";
import { getWebsiteEditingSummary } from "@/app/admin/_lib/websiteEditingTruthMatrix";
import { getClasificadosCategoryRegistryMerged, summarizeRegistryForDashboard } from "@/app/lib/clasificados/clasificadosCategoryRegistry";
import { formatMoneyCents } from "@/app/lib/listingPlans/packagePricingRules";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { getSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import { dbListCommunityResources } from "@/app/lib/recursos/server/communityResourcesDb";
import { dbListCandidateReviews } from "@/app/lib/recursos/server/communityResourceCandidateReviewsDb";
import { dbCountActiveResourceIntakeJobs } from "@/app/lib/recursos/intake/server/resourceIntakeJobsDb";
import { dbCountPendingResourceChangeProposals } from "@/app/lib/recursos/intake/server/resourceChangeProposalsDb";
import { dbCountPendingPartnerUpdateRequests } from "@/app/lib/recursos/intake/server/partnerUpdateRequestsDb";
import { buildReverificationQueue } from "@/app/lib/recursos/intake/reverificationQueue";
import { isLeoGoogleWorkspaceConfigured } from "@/app/leo/_lib/leoGoogleWorkspaceConfig";
import { isWebPushConfigured } from "@/app/lib/digitalContact/humanConnection/webPushConfig";
import {
  buildLeoIntelligenceRuntimeExecutiveSignals,
} from "@/app/leo/_lib/leoIntelligenceRuntimeHealth";
import { leoAnalyticsReportingAdapter } from "@/app/leo/_lib/leoExecutiveReportingAnalyticsAdapter";
import {
  buildLeoExecutiveSignal,
  clampAdapterLimit,
  emptyAdapterResult,
} from "@/app/leo/_lib/leoExecutiveReportingAdapter";
import type {
  LeoExecutiveAdapterResult,
  LeoExecutiveReportingAdapter,
  LeoExecutiveReportingAdapterInput,
} from "@/app/leo/_lib/leoExecutiveReportingTypes";

function schemaMissing(msg: string): boolean {
  return /does not exist|schema cache|PGRST205|relation/i.test(msg);
}

export const leoLeadsReportingAdapter: LeoExecutiveReportingAdapter = {
  domain: "LEADS",
  async getExecutiveSignals(input) {
    const nowMs = input.nowMs;
    const limit = clampAdapterLimit(input);
    const counts = await getAdminDashboardLeadsCounts();
    if (counts.unavailable) {
      return emptyAdapterResult(
        "LEADS",
        "UNAVAILABLE",
        nowMs,
        counts.unavailableNote ?? "Lead capture tables are unavailable — not zero.",
      );
    }
    const signals = [
      buildLeoExecutiveSignal({
        domain: "LEADS",
        sourceKind: "leonix_leads",
        sourceRef: "needs_reply",
        nowMs,
        title: "Leads needing a reply",
        summary: `${counts.leadsNeedingReply} launch lead${counts.leadsNeedingReply === 1 ? "" : "s"} in new or needs_reply.`,
        signalType: "LEAD",
        severity: counts.leadsNeedingReply > 0 ? "HIGH" : "INFORMATIONAL",
        status: counts.leadsNeedingReply > 0 ? "NEEDS_ATTENTION" : "EMPTY",
        count: counts.leadsNeedingReply,
        ownerAttentionRequired: counts.leadsNeedingReply > 0,
        actionable: counts.leadsNeedingReply > 0,
        deepLink: ADMIN_DASHBOARD_ROUTES.launchLeads,
        evidenceRefs: ["leonix_leads:needs_reply"],
        availability: "AVAILABLE",
        priorityRank: 2,
      }),
      buildLeoExecutiveSignal({
        domain: "LEADS",
        sourceKind: "leonix_leads",
        sourceRef: "active",
        nowMs,
        title: "Active launch leads",
        summary: `${counts.launchLeadsActive} active launch lead${counts.launchLeadsActive === 1 ? "" : "s"} (not archived).`,
        signalType: "METRIC",
        severity: "INFORMATIONAL",
        status: counts.launchLeadsActive === 0 ? "EMPTY" : "INFORMATIONAL",
        count: counts.launchLeadsActive,
        metric: { value: counts.launchLeadsActive, unit: "leads" },
        ownerAttentionRequired: false,
        actionable: false,
        deepLink: ADMIN_DASHBOARD_ROUTES.launchLeads,
        evidenceRefs: ["leonix_leads:active"],
        availability: counts.launchLeadsActive === 0 ? "EMPTY" : "AVAILABLE",
        priorityRank: 7,
      }),
      buildLeoExecutiveSignal({
        domain: "LEADS",
        sourceKind: "leonix_media_kit_leads",
        sourceRef: "active",
        nowMs,
        title: "Media kit requests",
        summary: `${counts.mediaKitActive} active media kit request${counts.mediaKitActive === 1 ? "" : "s"}.`,
        signalType: "QUEUE",
        severity: counts.mediaKitActive > 0 ? "NORMAL" : "INFORMATIONAL",
        status: counts.mediaKitActive > 0 ? "OPEN" : "EMPTY",
        count: counts.mediaKitActive,
        ownerAttentionRequired: false,
        actionable: counts.mediaKitActive > 0,
        deepLink: ADMIN_DASHBOARD_ROUTES.mediaKit,
        evidenceRefs: ["leonix_media_kit_leads"],
        availability: "AVAILABLE",
        priorityRank: 6,
      }),
    ].slice(0, limit);
    return {
      domain: "LEADS",
      availability: "AVAILABLE",
      signals,
      limitations: ["Counts are current-state only — no conversion rates."],
      generatedAt: new Date(nowMs).toISOString(),
    };
  },
};

export const leoContactsReportingAdapter: LeoExecutiveReportingAdapter = {
  domain: "CONTACTS",
  async getExecutiveSignals(input) {
    const nowMs = input.nowMs;
    const limit = clampAdapterLimit(input);
    if (!isSupabaseAdminConfigured()) {
      return emptyAdapterResult("CONTACTS", "UNAVAILABLE", nowMs, "Supabase admin client is not configured.");
    }
    const supabase = getAdminSupabase();
    const signals = [];
    const limitations: string[] = ["Support subjects are omitted from executive signals."];

    const openStatuses = ["open", "new", "pending", "needs_reply", "in_progress"];
    const { count: openCount, error: openErr } = await supabase
      .from("support_tickets")
      .select("id", { count: "exact", head: true })
      .in("status", openStatuses);

    if (openErr) {
      if (schemaMissing(openErr.message ?? "")) {
        return emptyAdapterResult(
          "CONTACTS",
          "UNAVAILABLE",
          nowMs,
          "Support tickets table is unavailable — not zero tickets.",
        );
      }
      return emptyAdapterResult("CONTACTS", "UNAVAILABLE", nowMs, "Support ticket query failed.");
    }

    const open = typeof openCount === "number" ? openCount : 0;
    signals.push(
      buildLeoExecutiveSignal({
        domain: "CONTACTS",
        sourceKind: "support_tickets",
        sourceRef: "open",
        nowMs,
        title: "Open support tickets",
        summary: `${open} unresolved support ticket${open === 1 ? "" : "s"} (open/pending/in progress).`,
        signalType: "QUEUE",
        severity: open > 0 ? "HIGH" : "INFORMATIONAL",
        status: open > 0 ? "NEEDS_ATTENTION" : "EMPTY",
        count: open,
        ownerAttentionRequired: open > 0,
        actionable: open > 0,
        deepLink: ADMIN_DASHBOARD_ROUTES.support,
        evidenceRefs: ["support_tickets:open"],
        availability: open === 0 ? "EMPTY" : "AVAILABLE",
        priorityRank: 2,
      }),
    );

    const sevenDaysAgo = new Date(nowMs - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: recentCount, error: recentErr } = await supabase
      .from("support_tickets")
      .select("id", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo);

    if (!recentErr && typeof recentCount === "number") {
      signals.push(
        buildLeoExecutiveSignal({
          domain: "CONTACTS",
          sourceKind: "support_tickets",
          sourceRef: "recent_7d",
          nowMs,
          title: "New support in the last 7 days",
          summary: `${recentCount} ticket${recentCount === 1 ? "" : "s"} created in the last 7 days.`,
          signalType: "METRIC",
          severity: "INFORMATIONAL",
          status: "INFORMATIONAL",
          count: recentCount,
          metric: { value: recentCount, unit: "tickets", period: "7d" },
          ownerAttentionRequired: false,
          actionable: false,
          deepLink: ADMIN_DASHBOARD_ROUTES.support,
          evidenceRefs: ["support_tickets:recent_7d"],
          availability: "AVAILABLE",
          priorityRank: 7,
        }),
      );
    }

    const { count: dcCount, error: dcErr } = await supabase
      .from("digital_contact_leads")
      .select("id", { count: "exact", head: true });
    if (dcErr) {
      if (schemaMissing(dcErr.message ?? "")) {
        limitations.push("Digital Contact leads table is not available.");
      }
    } else if (typeof dcCount === "number") {
      signals.push(
        buildLeoExecutiveSignal({
          domain: "CONTACTS",
          sourceKind: "digital_contact_leads",
          sourceRef: "all",
          nowMs,
          title: "Digital Contact submissions",
          summary: `${dcCount} Digital Contact lead${dcCount === 1 ? "" : "s"} stored. No dedicated admin inbox exists yet.`,
          signalType: "CUSTOMER",
          severity: "INFORMATIONAL",
          status: dcCount > 0 ? "INFORMATIONAL" : "EMPTY",
          count: dcCount,
          ownerAttentionRequired: false,
          actionable: false,
          deepLink: ADMIN_DASHBOARD_ROUTES.customerOps,
          evidenceRefs: ["digital_contact_leads"],
          availability: "PARTIAL",
          metadataSummary: "Nearest truthful admin route: Customer Ops. Message bodies are not included.",
          priorityRank: 6,
        }),
      );
    }

    return {
      domain: "CONTACTS",
      availability: "AVAILABLE",
      signals: signals.slice(0, limit),
      limitations,
      generatedAt: new Date(nowMs).toISOString(),
    };
  },
};

export const leoNewsletterReportingAdapter: LeoExecutiveReportingAdapter = {
  domain: "NEWSLETTER",
  async getExecutiveSignals(input) {
    const nowMs = input.nowMs;
    const limit = clampAdapterLimit(input);
    if (!isSupabaseAdminConfigured()) {
      return emptyAdapterResult("NEWSLETTER", "UNAVAILABLE", nowMs, "Supabase admin client is not configured.");
    }
    const supabase = getAdminSupabase();
    const active = await supabase
      .from("leonix_newsletter_subscribers")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .is("archived_at", null)
      .eq("status", "subscribed");

    if (active.error) {
      return emptyAdapterResult(
        "NEWSLETTER",
        schemaMissing(active.error.message ?? "") ? "UNAVAILABLE" : "UNAVAILABLE",
        nowMs,
        schemaMissing(active.error.message ?? "")
          ? "Newsletter subscriber table is unavailable — not zero subscribers."
          : "Newsletter query failed.",
      );
    }

    const total = typeof active.count === "number" ? active.count : 0;
    const sevenDaysAgo = new Date(nowMs - 7 * 24 * 60 * 60 * 1000).toISOString();
    const recent = await supabase
      .from("leonix_newsletter_subscribers")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .gte("created_at", sevenDaysAgo);

    const recentCount = !recent.error && typeof recent.count === "number" ? recent.count : null;

    const archived = await supabase
      .from("leonix_newsletter_subscribers")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .not("archived_at", "is", null);

    const archivedCount = !archived.error && typeof archived.count === "number" ? archived.count : null;

    const signals = [
      buildLeoExecutiveSignal({
        domain: "NEWSLETTER",
        sourceKind: "leonix_newsletter_subscribers",
        sourceRef: "subscribed",
        nowMs,
        title: "Active newsletter subscribers",
        summary: `${total} subscribed (not archived/deleted). No growth percentage is claimed.`,
        signalType: "METRIC",
        severity: "INFORMATIONAL",
        status: total === 0 ? "EMPTY" : "INFORMATIONAL",
        count: total,
        metric: { value: total, unit: "subscribers" },
        ownerAttentionRequired: false,
        actionable: false,
        deepLink: ADMIN_DASHBOARD_ROUTES.newsletter,
        evidenceRefs: ["leonix_newsletter_subscribers:subscribed"],
        availability: total === 0 ? "EMPTY" : "AVAILABLE",
        priorityRank: 7,
      }),
    ];
    if (recentCount != null) {
      signals.push(
        buildLeoExecutiveSignal({
          domain: "NEWSLETTER",
          sourceKind: "leonix_newsletter_subscribers",
          sourceRef: "recent_7d",
          nowMs,
          title: "New subscribers in the last 7 days",
          summary: `${recentCount} signup${recentCount === 1 ? "" : "s"} in the last 7 days.`,
          signalType: "METRIC",
          severity: "INFORMATIONAL",
          status: "INFORMATIONAL",
          count: recentCount,
          metric: { value: recentCount, unit: "signups", period: "7d" },
          ownerAttentionRequired: false,
          actionable: false,
          deepLink: ADMIN_DASHBOARD_ROUTES.newsletter,
          evidenceRefs: ["leonix_newsletter_subscribers:recent_7d"],
          availability: "AVAILABLE",
          priorityRank: 7,
        }),
      );
    }
    if (archivedCount != null && archivedCount > 0) {
      signals.push(
        buildLeoExecutiveSignal({
          domain: "NEWSLETTER",
          sourceKind: "leonix_newsletter_subscribers",
          sourceRef: "archived",
          nowMs,
          title: "Archived subscribers",
          summary: `${archivedCount} archived subscriber${archivedCount === 1 ? "" : "s"}. This is not an unsubscribe rate.`,
          signalType: "METRIC",
          severity: "INFORMATIONAL",
          status: "INFORMATIONAL",
          count: archivedCount,
          ownerAttentionRequired: false,
          actionable: false,
          deepLink: ADMIN_DASHBOARD_ROUTES.newsletter,
          evidenceRefs: ["leonix_newsletter_subscribers:archived"],
          availability: "AVAILABLE",
          priorityRank: 8,
        }),
      );
    }

    return {
      domain: "NEWSLETTER",
      availability: total === 0 ? "EMPTY" : "AVAILABLE",
      signals: signals.slice(0, limit),
      limitations: ["No campaign send metrics. No invented conversion or growth %."],
      generatedAt: new Date(nowMs).toISOString(),
    };
  },
};

export const leoPaymentsReportingAdapter: LeoExecutiveReportingAdapter = {
  domain: "PAYMENTS",
  async getExecutiveSignals(input) {
    const nowMs = input.nowMs;
    const limit = clampAdapterLimit(input);
    const snap = await fetchPaymentTrackerSnapshot({ limit: 200 });
    if (snap.unavailable) {
      return emptyAdapterResult(
        "PAYMENTS",
        "UNAVAILABLE",
        nowMs,
        snap.note ?? "Payment records are unavailable — not zero revenue.",
      );
    }

    const stripePaid = snap.rows.filter((r) => {
      const src = (r.source ?? "").toLowerCase();
      const paid = r.payment_status === "paid" || r.payment_status === "succeeded";
      return paid && (src.includes("stripe") || src === "checkout" || src === "webhook");
    }).length;
    const manualPaid = snap.rows.filter((r) => {
      const src = (r.source ?? "").toLowerCase();
      const paid = r.payment_status === "paid" || r.payment_status === "succeeded";
      return paid && (src.includes("manual") || src.includes("admin") || src.includes("comp") || src.includes("print"));
    }).length;

    const signals = [
      buildLeoExecutiveSignal({
        domain: "PAYMENTS",
        sourceKind: "leonix_payment_records",
        sourceRef: "pending",
        nowMs,
        title: "Pending payments",
        summary: `${snap.pendingCount} pending/unpaid payment${snap.pendingCount === 1 ? "" : "s"} in the latest tracker sample.`,
        signalType: "PAYMENT",
        severity: snap.pendingCount > 0 ? "HIGH" : "INFORMATIONAL",
        status: snap.pendingCount > 0 ? "PENDING" : "EMPTY",
        count: snap.pendingCount,
        ownerAttentionRequired: snap.pendingCount > 0,
        actionable: snap.pendingCount > 0,
        deepLink: "/admin/workspace/payment-tracker?status=pending",
        evidenceRefs: ["leonix_payment_records:pending"],
        availability: "AVAILABLE",
        metadataSummary: "Bounded recent-record sample — not a global pending total.",
        priorityRank: 3,
      }),
      buildLeoExecutiveSignal({
        domain: "PAYMENTS",
        sourceKind: "leonix_payment_records",
        sourceRef: "failed",
        nowMs,
        title: "Failed / refunded / canceled payments",
        summary: `${snap.failedCanceledRefundedCount} failed, refunded, or canceled row${snap.failedCanceledRefundedCount === 1 ? "" : "s"} in the tracker sample.`,
        signalType: "FAILURE",
        severity: snap.failedCanceledRefundedCount > 0 ? "HIGH" : "INFORMATIONAL",
        status: snap.failedCanceledRefundedCount > 0 ? "NEEDS_ATTENTION" : "EMPTY",
        count: snap.failedCanceledRefundedCount,
        ownerAttentionRequired: snap.failedCanceledRefundedCount > 0,
        actionable: snap.failedCanceledRefundedCount > 0,
        deepLink: "/admin/workspace/payment-tracker",
        evidenceRefs: ["leonix_payment_records:failed"],
        availability: "AVAILABLE",
        priorityRank: 3,
      }),
      buildLeoExecutiveSignal({
        domain: "REVENUE",
        sourceKind: "leonix_payment_records",
        sourceRef: "paid_sample_cents",
        nowMs,
        title: "Captured paid amount (sample)",
        summary: `${formatMoneyCents(snap.estimatedPaidTotalCents)} from paid rows in the latest tracker sample. Stripe paid is counted separately from manual/comp/print.`,
        signalType: "REVENUE",
        severity: "INFORMATIONAL",
        status: "INFORMATIONAL",
        count: snap.paidCount,
        metric: { value: snap.estimatedPaidTotalCents, unit: "cents" },
        ownerAttentionRequired: false,
        actionable: false,
        deepLink: "/admin/workspace/payment-tracker",
        evidenceRefs: ["leonix_payment_records:paid_sample"],
        availability: "PARTIAL",
        metadataSummary: `Sample paid rows: ${snap.paidCount}. Stripe-like: ${stripePaid}. Manual/comp/print-like: ${manualPaid}. Not a P&L.`,
        priorityRank: 7,
      }),
    ];

    return {
      domain: "PAYMENTS",
      availability: "AVAILABLE",
      signals: signals.slice(0, limit),
      limitations: [
        "Payment counts come from a bounded tracker sample (latest records), not a full ledger export.",
        "Stripe paid, admin-manual, promo, and print-included grants stay labeled separately.",
      ],
      generatedAt: new Date(nowMs).toISOString(),
    };
  },
};

export const leoModerationReportingAdapter: LeoExecutiveReportingAdapter = {
  domain: "MODERATION",
  async getExecutiveSignals(input) {
    const nowMs = input.nowMs;
    const limit = clampAdapterLimit(input);
    const snap = await getAdminDashboardSnapshot();
    const { expiringSoon, expired } = splitAdminDashboardExpiringQueue(snap.expiringQueueItems);
    const flagged = snap.pendingReviewQueueItems.filter((r) =>
      /flag|changes_requested/i.test(r.status),
    ).length;

    const signals = [
      buildLeoExecutiveSignal({
        domain: "MODERATION",
        sourceKind: "listing_reports",
        sourceRef: "pending",
        nowMs,
        title: "Pending listing reports",
        summary: `${snap.pendingReports} pending abuse/report${snap.pendingReports === 1 ? "" : "s"}.`,
        signalType: "MODERATION",
        severity: snap.pendingReports > 0 ? "HIGH" : "INFORMATIONAL",
        status: snap.pendingReports > 0 ? "PENDING" : "EMPTY",
        count: snap.pendingReports,
        ownerAttentionRequired: snap.pendingReports > 0,
        actionable: snap.pendingReports > 0,
        deepLink: ADMIN_DASHBOARD_ROUTES.reports,
        evidenceRefs: ["listing_reports:pending"],
        availability: "AVAILABLE",
        priorityRank: 4,
      }),
      buildLeoExecutiveSignal({
        domain: "MODERATION",
        sourceKind: "listings_review",
        sourceRef: "pending_flagged",
        nowMs,
        title: "Listings in review",
        summary: `${snap.pendingListingsReview} pending/flagged listing${snap.pendingListingsReview === 1 ? "" : "s"}${snap.listingsQueryFallback ? " (partial query fallback)" : ""}.`,
        signalType: "APPROVAL",
        severity: snap.pendingListingsReview > 0 ? "HIGH" : "INFORMATIONAL",
        status: snap.pendingListingsReview > 0 ? "PENDING" : "EMPTY",
        count: snap.pendingListingsReview,
        ownerAttentionRequired: snap.pendingListingsReview > 0,
        actionable: snap.pendingListingsReview > 0,
        deepLink: ADMIN_DASHBOARD_ROUTES.classifiedsReviewQueue,
        evidenceRefs: ["listings:pending_review"],
        availability: snap.listingsQueryFallback ? "PARTIAL" : "AVAILABLE",
        metadataSummary: flagged > 0 ? `${flagged} flagged in preview sample.` : null,
        priorityRank: 4,
      }),
      buildLeoExecutiveSignal({
        domain: "LISTINGS",
        sourceKind: "listings_expiration",
        sourceRef: "expiring_soon",
        nowMs,
        title: "Ads expiring soon",
        summary: `${expiringSoon.length} listing${expiringSoon.length === 1 ? "" : "s"} expiring within the Command Center window.`,
        signalType: "QUEUE",
        severity: expiringSoon.length > 0 ? "NORMAL" : "INFORMATIONAL",
        status: expiringSoon.length > 0 ? "OPEN" : "EMPTY",
        count: expiringSoon.length,
        ownerAttentionRequired: expiringSoon.length > 0,
        actionable: expiringSoon.length > 0,
        deepLink: ADMIN_DASHBOARD_ROUTES.classifiedsQueue,
        evidenceRefs: ["listings:expiring_soon"],
        availability: "AVAILABLE",
        priorityRank: 5,
      }),
      buildLeoExecutiveSignal({
        domain: "LISTINGS",
        sourceKind: "listings_expiration",
        sourceRef: "expired",
        nowMs,
        title: "Expired ads in preview",
        summary: `${expired.length} expired listing${expired.length === 1 ? "" : "s"} in the Command Center sample.`,
        signalType: "QUEUE",
        severity: expired.length > 0 ? "NORMAL" : "INFORMATIONAL",
        status: expired.length > 0 ? "OPEN" : "EMPTY",
        count: expired.length,
        ownerAttentionRequired: expired.length > 0,
        actionable: expired.length > 0,
        deepLink: ADMIN_DASHBOARD_ROUTES.classifiedsQueue,
        evidenceRefs: ["listings:expired"],
        availability: "AVAILABLE",
        priorityRank: 5,
      }),
    ];

    return {
      domain: "MODERATION",
      availability: snap.listingsQueryFallback ? "PARTIAL" : "AVAILABLE",
      signals: signals.slice(0, limit),
      limitations: [
        snap.listingsQueryFallback ? "Pending listing count may be incomplete." : "",
        "Category-specific queues (Autos, Rentas, etc.) remain canonical inside classifieds workspaces.",
      ].filter(Boolean),
      generatedAt: new Date(nowMs).toISOString(),
    };
  },
};

export const leoIglesiasReportingAdapter: LeoExecutiveReportingAdapter = {
  domain: "IGLESIAS",
  async getExecutiveSignals(input) {
    const nowMs = input.nowMs;
    const limit = clampAdapterLimit(input);
    const limitations: string[] = [
      "Church directory review queues are not modeled in Postgres yet.",
      "No AI screening results — AI_RESULT support is reserved for a future worker.",
    ];
    try {
      const { updatedAt } = await getSiteSectionPayload("iglesias_page");
      const signals = [
        buildLeoExecutiveSignal({
          domain: "IGLESIAS",
          sourceKind: "site_section_content",
          sourceRef: "iglesias_page",
          nowMs,
          title: "Iglesias landing page",
          summary: updatedAt
            ? `Transitional /iglesias copy is editable. Last saved ${updatedAt}. Directory listings are not in the database yet.`
            : "Transitional /iglesias copy is editable. Directory listings are not in the database yet.",
          signalType: "CONTENT",
          severity: "INFORMATIONAL",
          status: "NOT_IMPLEMENTED",
          ownerAttentionRequired: false,
          actionable: true,
          deepLink: "/admin/workspace/iglesias",
          evidenceRefs: ["site_section_content:iglesias_page"],
          availability: "NOT_IMPLEMENTED",
          metadataSummary: "Pending church review / flagged church submissions: not queryable.",
          priorityRank: 8,
        }),
        buildLeoExecutiveSignal({
          domain: "PRAYER_WALL",
          sourceKind: "prayer_wall",
          sourceRef: "moderation",
          nowMs,
          title: "Prayer Wall moderation",
          summary: "No Prayer Wall table or admin workspace exists yet. Pending/flagged prayer items cannot be counted.",
          signalType: "MODERATION",
          severity: "INFORMATIONAL",
          status: "NOT_IMPLEMENTED",
          ownerAttentionRequired: false,
          actionable: false,
          deepLink: "/admin/workspace/iglesias",
          evidenceRefs: ["prayer_wall:not_implemented"],
          availability: "NOT_IMPLEMENTED",
          priorityRank: 8,
        }),
      ];
      return {
        domain: "IGLESIAS",
        availability: "NOT_IMPLEMENTED",
        signals: signals.slice(0, limit),
        limitations,
        generatedAt: new Date(nowMs).toISOString(),
      };
    } catch {
      return emptyAdapterResult(
        "IGLESIAS",
        "UNAVAILABLE",
        nowMs,
        "Iglesias site-section copy could not be loaded.",
      );
    }
  },
};

export const leoSystemReportingAdapter: LeoExecutiveReportingAdapter = {
  domain: "LEO",
  async getExecutiveSignals(input) {
    const nowMs = input.nowMs;
    const limit = clampAdapterLimit(input);
    const supabaseOk = isSupabaseAdminConfigured();
    const googleOk = isLeoGoogleWorkspaceConfigured();
    const pushOk = isWebPushConfigured();

    const signals = [
      buildLeoExecutiveSignal({
        domain: "LEO",
        sourceKind: "supabase",
        sourceRef: "admin_client",
        nowMs,
        title: supabaseOk ? "Leonix data storage configured" : "Leonix data storage not configured",
        summary: supabaseOk
          ? "Admin persistence client is configured."
          : "Admin persistence client is not configured — executive reports from Leonix data will be incomplete.",
        signalType: "SYSTEM_HEALTH",
        severity: supabaseOk ? "INFORMATIONAL" : "CRITICAL",
        status: supabaseOk ? "HEALTHY" : "UNAVAILABLE",
        ownerAttentionRequired: !supabaseOk,
        actionable: !supabaseOk,
        deepLink: "/admin/leo",
        evidenceRefs: ["leo:supabase"],
        availability: supabaseOk ? "AVAILABLE" : "NOT_IMPLEMENTED",
        priorityRank: supabaseOk ? 8 : 1,
      }),
      buildLeoExecutiveSignal({
        domain: "LEO",
        sourceKind: "google_workspace",
        sourceRef: "config",
        nowMs,
        title: googleOk ? "Gmail/Calendar credentials present" : "Gmail intelligence not configured",
        summary: googleOk
          ? "Google Workspace credentials are present. This is configuration truth, not a live inbox probe."
          : "Gmail/Calendar executive intelligence is not configured.",
        signalType: "SYSTEM_HEALTH",
        severity: googleOk ? "INFORMATIONAL" : "NORMAL",
        status: googleOk ? "HEALTHY" : "NOT_IMPLEMENTED",
        ownerAttentionRequired: false,
        actionable: false,
        deepLink: "/admin/leo",
        evidenceRefs: ["leo:google_workspace"],
        availability: googleOk ? "AVAILABLE" : "NOT_IMPLEMENTED",
        priorityRank: 6,
      }),
      buildLeoExecutiveSignal({
        domain: "LEO",
        sourceKind: "web_push",
        sourceRef: "vapid",
        nowMs,
        title: pushOk ? "Push alerts configured" : "Push alerts not configured",
        summary: pushOk
          ? "Web Push VAPID is configured. Owner still must opt in on /admin/leo."
          : "Web Push is not configured — scheduled watches can still record results without delivery.",
        signalType: "SYSTEM_HEALTH",
        severity: "INFORMATIONAL",
        status: pushOk ? "HEALTHY" : "NOT_IMPLEMENTED",
        ownerAttentionRequired: false,
        actionable: false,
        deepLink: "/admin/leo",
        evidenceRefs: ["leo:web_push"],
        availability: pushOk ? "AVAILABLE" : "NOT_IMPLEMENTED",
        priorityRank: 8,
      }),
      // LEO-19E — current-state intelligence worker config only (no success noise).
      ...buildLeoIntelligenceRuntimeExecutiveSignals({ nowMs }),
    ];

    // LEO-17A connected action persistence foundation — bounded proposal counts.
    // No payload or per-owner details are exposed through Executive Reports.
    if (supabaseOk) {
      try {
        const supabase = getAdminSupabase();

        const awaiting = await supabase
          .from("leo_action_proposals")
          .select("id", { count: "exact", head: true })
          .eq("proposal_state", "AWAITING_APPROVAL")
          .eq("approval_state", "PENDING");

        const failed = await supabase
          .from("leo_action_proposals")
          .select("id", { count: "exact", head: true })
          .eq("proposal_state", "FAILED");

        const expired = await supabase
          .from("leo_action_proposals")
          .select("id", { count: "exact", head: true })
          .eq("proposal_state", "EXPIRED");

        const awaitingCount = typeof awaiting.count === "number" ? awaiting.count : 0;
        const failedCount = typeof failed.count === "number" ? failed.count : 0;
        const expiredCount = typeof expired.count === "number" ? expired.count : 0;

        if (awaitingCount > 0) {
          signals.push(
            buildLeoExecutiveSignal({
              domain: "LEO",
              sourceKind: "leo_action_proposals",
              sourceRef: "awaiting_approval",
              nowMs,
              title: "Action proposals awaiting owner approval",
              summary: `${awaitingCount} governed proposal${awaitingCount === 1 ? "" : "s"} need your approval.`,
              signalType: "APPROVAL",
              severity: "HIGH",
              status: "NEEDS_ATTENTION",
              count: awaitingCount,
              ownerAttentionRequired: true,
              actionable: true,
              deepLink: "/admin/leo",
              evidenceRefs: ["leo_action_proposals:awaiting_approval"],
              availability: "AVAILABLE",
              priorityRank: 1,
            }),
          );
        }

        if (failedCount > 0) {
          signals.push(
            buildLeoExecutiveSignal({
              domain: "LEO",
              sourceKind: "leo_action_proposals",
              sourceRef: "failed",
              nowMs,
              title: "Action proposals failed (human attention required)",
              summary: `${failedCount} governed proposal${failedCount === 1 ? "" : "s"} failed before execution.`,
              signalType: "FAILURE",
              severity: "CRITICAL",
              status: "DEGRADED",
              count: failedCount,
              ownerAttentionRequired: true,
              actionable: true,
              deepLink: "/admin/leo",
              evidenceRefs: ["leo_action_proposals:failed"],
              availability: "AVAILABLE",
              priorityRank: 2,
            }),
          );
        }

        if (expiredCount > 0) {
          signals.push(
            buildLeoExecutiveSignal({
              domain: "LEO",
              sourceKind: "leo_action_proposals",
              sourceRef: "expired",
              nowMs,
              title: "Governed action proposals expired",
              summary: `${expiredCount} governed proposal${expiredCount === 1 ? "" : "s"} expired without approval/claim.`,
              signalType: "SYSTEM_HEALTH",
              severity: "INFORMATIONAL",
              status: "INFORMATIONAL",
              count: expiredCount,
              ownerAttentionRequired: false,
              actionable: false,
              deepLink: "/admin/leo",
              evidenceRefs: ["leo_action_proposals:expired"],
              availability: "AVAILABLE",
              priorityRank: 7,
            }),
          );
        }
      } catch (e) {
        // Fail-soft: missing migration/table must not break Executive Reports.
        const msg = (e as Error)?.message ?? String(e);
        // eslint-disable-next-line no-console
        console.warn("leo_action_proposals signals unavailable:", msg);
      }
    }

    return {
      domain: "LEO",
      availability: supabaseOk ? "AVAILABLE" : "PARTIAL",
      signals: signals.slice(0, limit),
      limitations: ["Live Gmail/Calendar probes stay in LEO communication intelligence — not duplicated here."],
      generatedAt: new Date(nowMs).toISOString(),
    };
  },
};

/**
 * LEO-ADMIN-OS-FINAL.2 item 1 — Business Concierge pipeline intelligence.
 * Reuses the canonical Staff Command Center source (businesses / business_follow_ups
 * via businessWorkspaceData.ts) — NOT leonix_leads/support_tickets, and no second
 * businesses table. listBusinessesForWorkspace() never returns raw contact values
 * (boolean has-* flags only), so it is safe to call from this read-only, owner-gated
 * adapter without a StrictSalesActor.
 */
export const leoBusinessPipelineReportingAdapter: LeoExecutiveReportingAdapter = {
  domain: "BUSINESS_PIPELINE",
  async getExecutiveSignals(input) {
    const nowMs = input.nowMs;
    const limit = clampAdapterLimit(input);
    if (!isSupabaseAdminConfigured()) {
      return emptyAdapterResult("BUSINESS_PIPELINE", "UNAVAILABLE", nowMs, "Supabase admin client is not configured.");
    }
    let items: Awaited<ReturnType<typeof listBusinessesForWorkspace>>["items"];
    try {
      ({ items } = await listBusinessesForWorkspace({ limit: 500 }));
    } catch {
      return emptyAdapterResult("BUSINESS_PIPELINE", "UNAVAILABLE", nowMs, "Business pipeline query failed.");
    }

    const needsFollowUp = items.filter((i) => i.nextFollowUpStatus !== null);
    const overdue = needsFollowUp.filter((i) => i.nextFollowUpStatus === "overdue");
    const total = items.length;

    const signals = [
      buildLeoExecutiveSignal({
        domain: "BUSINESS_PIPELINE",
        sourceKind: "businesses",
        sourceRef: "total",
        nowMs,
        title: "Businesses in the pipeline",
        summary: `${total} business${total === 1 ? "" : "es"} in the Staff Command Center (bounded to the most recent 500).`,
        signalType: "CUSTOMER",
        severity: "INFORMATIONAL",
        status: total === 0 ? "EMPTY" : "INFORMATIONAL",
        count: total,
        ownerAttentionRequired: false,
        actionable: false,
        deepLink: "/admin/businesses",
        evidenceRefs: ["businesses:total"],
        availability: total === 0 ? "EMPTY" : "AVAILABLE",
        priorityRank: 7,
      }),
      buildLeoExecutiveSignal({
        domain: "BUSINESS_PIPELINE",
        sourceKind: "business_follow_ups",
        sourceRef: "open",
        nowMs,
        title: "Businesses needing follow-up",
        summary: `${needsFollowUp.length} business${needsFollowUp.length === 1 ? "" : "es"} with an open follow-up${overdue.length ? `; ${overdue.length} overdue` : ""}.`,
        signalType: "QUEUE",
        severity: overdue.length > 0 ? "HIGH" : needsFollowUp.length > 0 ? "NORMAL" : "INFORMATIONAL",
        status: overdue.length > 0 ? "NEEDS_ATTENTION" : needsFollowUp.length > 0 ? "OPEN" : "EMPTY",
        count: needsFollowUp.length,
        ownerAttentionRequired: overdue.length > 0,
        actionable: needsFollowUp.length > 0,
        deepLink: "/admin/businesses",
        evidenceRefs: ["business_follow_ups:open"],
        availability: needsFollowUp.length === 0 ? "EMPTY" : "AVAILABLE",
        priorityRank: overdue.length > 0 ? 4 : 6,
      }),
    ].slice(0, limit);

    return {
      domain: "BUSINESS_PIPELINE",
      availability: "AVAILABLE",
      signals,
      limitations: [
        "Bounded to the most recent 500 businesses — not a full census beyond that.",
        "Sales notes and business_facts detail are not summarized here; open the business profile for full context.",
      ],
      generatedAt: new Date(nowMs).toISOString(),
    };
  },
};

/**
 * LEO-ADMIN-OS-FINAL.2 item 2 — Team intelligence.
 * admin_team_members has no existing lib-level read wrapper (confirmed by source
 * discovery); this queries the exact same table/columns/limit as
 * app/admin/(dashboard)/team/roster/page.tsx rather than inventing a new shape.
 */
export const leoTeamReportingAdapter: LeoExecutiveReportingAdapter = {
  domain: "TEAM",
  async getExecutiveSignals(input) {
    const nowMs = input.nowMs;
    const limit = clampAdapterLimit(input);
    if (!isSupabaseAdminConfigured()) {
      return emptyAdapterResult("TEAM", "UNAVAILABLE", nowMs, "Supabase admin client is not configured.");
    }
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("admin_team_members")
      .select("id, email, display_name, role, is_active, created_at")
      .order("created_at", { ascending: false })
      .limit(80);
    if (error) {
      return emptyAdapterResult("TEAM", "UNAVAILABLE", nowMs, "Team roster query failed.");
    }
    const rows = (data ?? []) as Array<{ is_active: boolean }>;
    const total = rows.length;
    const active = rows.filter((r) => r.is_active).length;
    const inactive = total - active;

    const signals = [
      buildLeoExecutiveSignal({
        domain: "TEAM",
        sourceKind: "admin_team_members",
        sourceRef: "active",
        nowMs,
        title: "Active team members",
        summary: `${active} active team member${active === 1 ? "" : "s"} of ${total} on the roster (bounded to the most recent 80).`,
        signalType: "METRIC",
        severity: "INFORMATIONAL",
        status: total === 0 ? "EMPTY" : "INFORMATIONAL",
        count: active,
        metric: { value: active, unit: "members" },
        ownerAttentionRequired: false,
        actionable: false,
        deepLink: "/admin/team/roster",
        evidenceRefs: ["admin_team_members:active"],
        availability: total === 0 ? "EMPTY" : "AVAILABLE",
        priorityRank: 7,
      }),
    ];
    if (inactive > 0) {
      signals.push(
        buildLeoExecutiveSignal({
          domain: "TEAM",
          sourceKind: "admin_team_members",
          sourceRef: "inactive",
          nowMs,
          title: "Inactive team members",
          summary: `${inactive} team member${inactive === 1 ? "" : "s"} marked inactive.`,
          signalType: "METRIC",
          severity: "INFORMATIONAL",
          status: "INFORMATIONAL",
          count: inactive,
          ownerAttentionRequired: false,
          actionable: false,
          deepLink: "/admin/team/roster",
          evidenceRefs: ["admin_team_members:inactive"],
          availability: "AVAILABLE",
          priorityRank: 8,
        }),
      );
    }

    return {
      domain: "TEAM",
      availability: total === 0 ? "EMPTY" : "AVAILABLE",
      signals: signals.slice(0, limit),
      limitations: ["Roster is bounded to the most recent 80 members — not scoped per-owner (single flat roster)."],
      generatedAt: new Date(nowMs).toISOString(),
    };
  },
};

/**
 * LEO-ADMIN-OS-FINAL.2 item 3 — Categories intelligence.
 * Reuses the canonical classifieds category registry + the Admin dashboard's
 * already-bounded pending review queue — no second category registry.
 */
export const leoCategoriesReportingAdapter: LeoExecutiveReportingAdapter = {
  domain: "CATEGORIES",
  async getExecutiveSignals(input) {
    const nowMs = input.nowMs;
    const limit = clampAdapterLimit(input);
    const [registry, snap] = await Promise.all([
      getClasificadosCategoryRegistryMerged(),
      getAdminDashboardSnapshot(),
    ]);
    const lifecycle = summarizeRegistryForDashboard(registry);
    const attentionCategories = [
      ...new Set(snap.pendingReviewQueueItems.map((r) => r.categorySource).filter(Boolean)),
    ];

    const signals = [
      buildLeoExecutiveSignal({
        domain: "CATEGORIES",
        sourceKind: "clasificados_category_registry",
        sourceRef: "live",
        nowMs,
        title: "Live categories",
        summary: `${lifecycle.live} live categor${lifecycle.live === 1 ? "y" : "ies"}, ${lifecycle.staged} staged, ${lifecycle.comingSoon} coming soon.`,
        signalType: "CONTENT",
        severity: "INFORMATIONAL",
        status: "INFORMATIONAL",
        count: lifecycle.live,
        ownerAttentionRequired: false,
        actionable: false,
        deepLink: ADMIN_DASHBOARD_ROUTES.categories,
        evidenceRefs: ["clasificados_category_registry:live"],
        availability: "AVAILABLE",
        priorityRank: 8,
      }),
      buildLeoExecutiveSignal({
        domain: "CATEGORIES",
        sourceKind: "pending_review_queue",
        sourceRef: "categories_with_pending_items",
        nowMs,
        title: "Categories with pending review items",
        summary:
          attentionCategories.length > 0
            ? `${attentionCategories.length} categor${attentionCategories.length === 1 ? "y" : "ies"} with pending/flagged items in the bounded preview sample: ${attentionCategories.slice(0, 5).join(", ")}.`
            : "No categories with pending/flagged items in the bounded preview sample.",
        signalType: "QUEUE",
        severity: attentionCategories.length > 0 ? "NORMAL" : "INFORMATIONAL",
        status: attentionCategories.length > 0 ? "OPEN" : "EMPTY",
        count: attentionCategories.length,
        ownerAttentionRequired: attentionCategories.length > 0,
        actionable: attentionCategories.length > 0,
        deepLink: ADMIN_DASHBOARD_ROUTES.classifiedsReviewQueue,
        evidenceRefs: ["pending_review_queue:by_category"],
        availability: "PARTIAL",
        metadataSummary: "Derived from a sitewide bounded preview (max 12 rows) — not an exhaustive per-category count.",
        priorityRank: attentionCategories.length > 0 ? 5 : 8,
      }),
    ].slice(0, limit);

    return {
      domain: "CATEGORIES",
      availability: "PARTIAL",
      signals,
      limitations: [
        "Category-level pending counts are derived from the sitewide bounded review-queue preview (≤12 rows), not an exhaustive per-category query.",
      ],
      generatedAt: new Date(nowMs).toISOString(),
    };
  },
};

/**
 * LEO-ADMIN-OS-FINAL.2 item 4 — Recursos intelligence.
 * Reuses the exact 5 canonical Recursos read functions the admin page itself calls
 * (app/lib/recursos/**) — no new table/query. Spanish reconciliation is intentionally
 * omitted here (page-only bucketing helper, not a bounded count primitive).
 */
export const leoRecursosReportingAdapter: LeoExecutiveReportingAdapter = {
  domain: "RECURSOS",
  async getExecutiveSignals(input) {
    const nowMs = input.nowMs;
    const limit = clampAdapterLimit(input);
    const [resources, candidates, intakeJobs, changeProposals, partnerUpdates] = await Promise.all([
      dbListCommunityResources(),
      dbListCandidateReviews(),
      dbCountActiveResourceIntakeJobs(),
      dbCountPendingResourceChangeProposals(),
      dbCountPendingPartnerUpdateRequests(),
    ]);

    if (resources.unavailable) {
      return emptyAdapterResult("RECURSOS", "UNAVAILABLE", nowMs, "Community resources table is unavailable — not zero resources.");
    }

    const all = resources.rows;
    const total = all.length;
    const active = all.filter((r) => r.verification.active).length;
    const helpNow = all.filter((r) => r.urgencyLevel === "help-now").length;
    const reverification = buildReverificationQueue(all, new Date(nowMs));
    const overdueReverification = reverification.overdue.length;
    const pendingCandidates = candidates.unavailable
      ? null
      : candidates.rows.filter((r) => r.disposition !== "promoted").length;

    const signals = [
      buildLeoExecutiveSignal({
        domain: "RECURSOS",
        sourceKind: "community_resources",
        sourceRef: "active",
        nowMs,
        title: "Active community resources",
        summary: `${active} active resource${active === 1 ? "" : "s"} of ${total} total. ${helpNow} flagged help-now urgency.`,
        signalType: "CONTENT",
        severity: "INFORMATIONAL",
        status: total === 0 ? "EMPTY" : "INFORMATIONAL",
        count: active,
        ownerAttentionRequired: false,
        actionable: false,
        deepLink: "/admin/recursos",
        evidenceRefs: ["community_resources:active"],
        availability: total === 0 ? "EMPTY" : "AVAILABLE",
        priorityRank: 7,
      }),
      buildLeoExecutiveSignal({
        domain: "RECURSOS",
        sourceKind: "community_resources",
        sourceRef: "overdue_reverification",
        nowMs,
        title: "Resources overdue for re-verification",
        summary: `${overdueReverification} resource${overdueReverification === 1 ? "" : "s"} overdue for re-verification.`,
        signalType: "QUEUE",
        severity: overdueReverification > 0 ? "NORMAL" : "INFORMATIONAL",
        status: overdueReverification > 0 ? "NEEDS_ATTENTION" : "EMPTY",
        count: overdueReverification,
        ownerAttentionRequired: overdueReverification > 0,
        actionable: overdueReverification > 0,
        deepLink: "/admin/recursos",
        evidenceRefs: ["community_resources:overdue_reverification"],
        availability: "AVAILABLE",
        priorityRank: overdueReverification > 0 ? 5 : 8,
      }),
      buildLeoExecutiveSignal({
        domain: "RECURSOS",
        sourceKind: "resource_intake_jobs",
        sourceRef: "active",
        nowMs,
        title: "Resource intake jobs in progress",
        summary: `${intakeJobs.count} intake job${intakeJobs.count === 1 ? "" : "s"} pending, processing, or needing review.`,
        signalType: "QUEUE",
        severity: intakeJobs.count > 0 ? "NORMAL" : "INFORMATIONAL",
        status: intakeJobs.count > 0 ? "OPEN" : "EMPTY",
        count: intakeJobs.count,
        ownerAttentionRequired: false,
        actionable: intakeJobs.count > 0,
        deepLink: "/admin/recursos",
        evidenceRefs: ["resource_intake_jobs:active"],
        availability: intakeJobs.unavailable ? "UNAVAILABLE" : "AVAILABLE",
        priorityRank: 7,
      }),
    ];

    if (pendingCandidates != null && pendingCandidates > 0) {
      signals.push(
        buildLeoExecutiveSignal({
          domain: "RECURSOS",
          sourceKind: "community_resource_candidate_reviews",
          sourceRef: "pending",
          nowMs,
          title: "Candidate resources awaiting review",
          summary: `${pendingCandidates} candidate resource${pendingCandidates === 1 ? "" : "s"} not yet promoted.`,
          signalType: "QUEUE",
          severity: "NORMAL",
          status: "OPEN",
          count: pendingCandidates,
          ownerAttentionRequired: false,
          actionable: true,
          deepLink: "/admin/recursos",
          evidenceRefs: ["community_resource_candidate_reviews:pending"],
          availability: "AVAILABLE",
          priorityRank: 6,
        }),
      );
    }
    if (!changeProposals.unavailable && changeProposals.count > 0) {
      signals.push(
        buildLeoExecutiveSignal({
          domain: "RECURSOS",
          sourceKind: "resource_change_proposals",
          sourceRef: "pending",
          nowMs,
          title: "Pending resource change proposals",
          summary: `${changeProposals.count} pending change proposal${changeProposals.count === 1 ? "" : "s"}.`,
          signalType: "APPROVAL",
          severity: "NORMAL",
          status: "PENDING",
          count: changeProposals.count,
          ownerAttentionRequired: true,
          actionable: true,
          deepLink: "/admin/recursos",
          evidenceRefs: ["resource_change_proposals:pending"],
          availability: "AVAILABLE",
          priorityRank: 5,
        }),
      );
    }
    if (!partnerUpdates.unavailable && partnerUpdates.count > 0) {
      signals.push(
        buildLeoExecutiveSignal({
          domain: "RECURSOS",
          sourceKind: "partner_update_requests",
          sourceRef: "pending",
          nowMs,
          title: "Pending partner update requests",
          summary: `${partnerUpdates.count} pending partner update request${partnerUpdates.count === 1 ? "" : "s"}.`,
          signalType: "APPROVAL",
          severity: "NORMAL",
          status: "PENDING",
          count: partnerUpdates.count,
          ownerAttentionRequired: true,
          actionable: true,
          deepLink: "/admin/recursos",
          evidenceRefs: ["partner_update_requests:pending"],
          availability: "AVAILABLE",
          priorityRank: 5,
        }),
      );
    }

    return {
      domain: "RECURSOS",
      availability: "AVAILABLE",
      signals: signals.slice(0, limit),
      limitations: [
        candidates.unavailable ? "Candidate review counts are unavailable — not zero." : "",
        "Spanish reconciliation queue status is not summarized here; open Recursos for that detail.",
      ].filter(Boolean),
      generatedAt: new Date(nowMs).toISOString(),
    };
  },
};

/**
 * LEO-ADMIN-OS-FINAL.2 item 5 — Website / Site Settings intelligence.
 * PARTIAL by design: WEBSITE_EDITING_TRUTH_ROWS is a real, already-computed,
 * code-authored truth table (the same one Admin's own workspace hub reads) rather
 * than a live per-request query, and site_section_content contributes exactly one
 * genuine live timestamp. No richer live metrics exist for this surface.
 */
export const leoWebsiteReportingAdapter: LeoExecutiveReportingAdapter = {
  domain: "WEBSITE",
  async getExecutiveSignals(input) {
    const nowMs = input.nowMs;
    const limit = clampAdapterLimit(input);
    const editingSummary = getWebsiteEditingSummary();

    const signals = [
      buildLeoExecutiveSignal({
        domain: "WEBSITE",
        sourceKind: "website_editing_truth_matrix",
        sourceRef: "editable_sections",
        nowMs,
        title: "Website sections fully editable",
        summary: `${editingSummary.TRUE} section${editingSummary.TRUE === 1 ? "" : "s"} fully editable, ${editingSummary.PARTIAL} partial, ${editingSummary.MISSING} missing, ${editingSummary.needsBuild} needing build.`,
        signalType: "CONTENT",
        severity: "INFORMATIONAL",
        status: "INFORMATIONAL",
        count: editingSummary.TRUE,
        ownerAttentionRequired: false,
        actionable: false,
        deepLink: "/admin/workspace",
        evidenceRefs: ["website_editing_truth_matrix:TRUE"],
        availability: "PARTIAL",
        metadataSummary: "Code-authored editability truth table, not a live per-request query.",
        priorityRank: 8,
      }),
    ];

    try {
      const { updatedAt } = await getSiteSectionPayload("global_site");
      signals.push(
        buildLeoExecutiveSignal({
          domain: "WEBSITE",
          sourceKind: "site_section_content",
          sourceRef: "global_site",
          nowMs,
          title: "Global site settings last updated",
          summary: updatedAt
            ? `Global site settings last saved ${updatedAt}.`
            : "Global site settings have no recorded save yet.",
          signalType: "CONTENT",
          severity: "INFORMATIONAL",
          status: "INFORMATIONAL",
          ownerAttentionRequired: false,
          actionable: false,
          deepLink: ADMIN_DASHBOARD_ROUTES.siteSettings,
          evidenceRefs: ["site_section_content:global_site"],
          availability: updatedAt ? "AVAILABLE" : "EMPTY",
          priorityRank: 8,
        }),
      );
    } catch {
      // Fail-soft: editing summary above still stands on its own.
    }

    return {
      domain: "WEBSITE",
      availability: "PARTIAL",
      signals: signals.slice(0, limit),
      limitations: [
        "Website editability is a static, code-authored truth table — not live database state.",
        "Beyond the last-saved timestamp, no richer live website metrics exist yet.",
      ],
      generatedAt: new Date(nowMs).toISOString(),
    };
  },
};

export const LEO_EXECUTIVE_LIVE_ADAPTERS: LeoExecutiveReportingAdapter[] = [
  leoLeadsReportingAdapter,
  leoContactsReportingAdapter,
  leoNewsletterReportingAdapter,
  leoPaymentsReportingAdapter,
  leoModerationReportingAdapter,
  leoIglesiasReportingAdapter,
  leoSystemReportingAdapter,
  leoAnalyticsReportingAdapter,
  leoBusinessPipelineReportingAdapter,
  leoTeamReportingAdapter,
  leoCategoriesReportingAdapter,
  leoRecursosReportingAdapter,
  leoWebsiteReportingAdapter,
];
