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
import { formatMoneyCents } from "@/app/lib/listingPlans/packagePricingRules";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { getSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import { isLeoGoogleWorkspaceConfigured } from "@/app/leo/_lib/leoGoogleWorkspaceConfig";
import { isWebPushConfigured } from "@/app/lib/digitalContact/humanConnection/webPushConfig";
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

export const LEO_EXECUTIVE_LIVE_ADAPTERS: LeoExecutiveReportingAdapter[] = [
  leoLeadsReportingAdapter,
  leoContactsReportingAdapter,
  leoNewsletterReportingAdapter,
  leoPaymentsReportingAdapter,
  leoModerationReportingAdapter,
  leoIglesiasReportingAdapter,
  leoSystemReportingAdapter,
];
