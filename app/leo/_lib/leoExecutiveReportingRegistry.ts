/**
 * EXEC-REPORTS-01 — stable executive reporting domains.
 *
 * Reserved domains without a live adapter stay documented so future admin
 * workspaces cannot remain siloed.
 */
import type { LeoExecutiveDomain } from "@/app/leo/_lib/leoExecutiveReportingTypes";
import { ADMIN_DASHBOARD_ROUTES } from "@/app/admin/_lib/adminDashboardRoutes";

export type LeoExecutiveAdapterStatus = "LIVE" | "PARTIAL" | "RESERVED" | "NOT_IMPLEMENTED";

export type LeoExecutiveDomainRegistryEntry = {
  domain: LeoExecutiveDomain;
  label: string;
  canonicalAdminRoute: string;
  adapterStatus: LeoExecutiveAdapterStatus;
  supportsAttention: boolean;
  supportsMetrics: boolean;
  supportsWatch: boolean;
  notes: string;
};

export const LEO_EXECUTIVE_DOMAIN_REGISTRY: readonly LeoExecutiveDomainRegistryEntry[] = [
  {
    domain: "LEADS",
    label: "Leads",
    canonicalAdminRoute: ADMIN_DASHBOARD_ROUTES.launchLeads,
    adapterStatus: "LIVE",
    supportsAttention: true,
    supportsMetrics: true,
    supportsWatch: true,
    notes: "Launch leads + reply queue from leonix_leads counts.",
  },
  {
    domain: "CLIENTS",
    label: "Client care",
    canonicalAdminRoute: ADMIN_DASHBOARD_ROUTES.launchLeads,
    adapterStatus: "LIVE",
    supportsAttention: true,
    supportsMetrics: false,
    supportsWatch: true,
    notes: "Client Care signals already have a dedicated LEO watcher; this adapter rolls queue counts upward.",
  },
  {
    domain: "CONTACTS",
    label: "Contact & support",
    canonicalAdminRoute: ADMIN_DASHBOARD_ROUTES.support,
    adapterStatus: "LIVE",
    supportsAttention: true,
    supportsMetrics: true,
    supportsWatch: true,
    notes: "Support tickets are canonical. Digital Contact leads have no dedicated inbox — counted only.",
  },
  {
    domain: "NEWSLETTER",
    label: "Newsletter",
    canonicalAdminRoute: ADMIN_DASHBOARD_ROUTES.newsletter,
    adapterStatus: "LIVE",
    supportsAttention: false,
    supportsMetrics: true,
    supportsWatch: true,
    notes: "Active subscriber counts only — no invented growth %.",
  },
  {
    domain: "PAYMENTS",
    label: "Payments",
    canonicalAdminRoute: "/admin/workspace/payment-tracker",
    adapterStatus: "LIVE",
    supportsAttention: true,
    supportsMetrics: true,
    supportsWatch: true,
    notes: "Bounded payment-tracker sample. Stripe paid is not mixed with promo/comp/print.",
  },
  {
    domain: "REVENUE",
    label: "Revenue",
    canonicalAdminRoute: "/admin/workspace/payment-tracker",
    adapterStatus: "PARTIAL",
    supportsAttention: true,
    supportsMetrics: true,
    supportsWatch: true,
    notes: "Captured cents from paid rows in the tracker sample — not a global P&L.",
  },
  {
    domain: "SALES",
    label: "Sales pipeline",
    canonicalAdminRoute: "/admin/workspace/payment-tracker",
    adapterStatus: "PARTIAL",
    supportsAttention: false,
    supportsMetrics: true,
    supportsWatch: false,
    notes: "Pending payment rows in tracker sample. Sales-rep CRM is not a separate warehouse.",
  },
  {
    domain: "MODERATION",
    label: "Moderation & reports",
    canonicalAdminRoute: ADMIN_DASHBOARD_ROUTES.reports,
    adapterStatus: "LIVE",
    supportsAttention: true,
    supportsMetrics: true,
    supportsWatch: true,
    notes: "listing_reports pending + flagged/pending listings review queue.",
  },
  {
    domain: "LISTINGS",
    label: "Listings",
    canonicalAdminRoute: ADMIN_DASHBOARD_ROUTES.classifiedsQueue,
    adapterStatus: "PARTIAL",
    supportsAttention: true,
    supportsMetrics: true,
    supportsWatch: true,
    notes: "Expiring/expired classifieds from Command Center snapshot. Category workspaces remain source of truth.",
  },
  {
    domain: "IGLESIAS",
    label: "Iglesias",
    canonicalAdminRoute: "/admin/workspace/iglesias",
    adapterStatus: "NOT_IMPLEMENTED",
    supportsAttention: false,
    supportsMetrics: false,
    supportsWatch: true,
    notes: "Landing copy exists. Church directory / review queues are not modeled. Future AI_RESULT support reserved.",
  },
  {
    domain: "PRAYER_WALL",
    label: "Prayer Wall",
    canonicalAdminRoute: "/admin/workspace/iglesias",
    adapterStatus: "NOT_IMPLEMENTED",
    supportsAttention: false,
    supportsMetrics: false,
    supportsWatch: false,
    notes: "No Prayer Wall admin workspace or table exists yet. Future AI_RESULT support reserved.",
  },
  {
    domain: "LEO",
    label: "LEO / system",
    canonicalAdminRoute: "/admin/leo",
    adapterStatus: "LIVE",
    supportsAttention: true,
    supportsMetrics: false,
    supportsWatch: true,
    notes: "LEO dependency probes (persistence, Gmail, push) — not a second health dashboard.",
  },
  {
    domain: "SYSTEM",
    label: "System",
    canonicalAdminRoute: ADMIN_DASHBOARD_ROUTES.activityLog,
    adapterStatus: "PARTIAL",
    supportsAttention: true,
    supportsMetrics: false,
    supportsWatch: true,
    notes: "Adapter health rollup. Planned Bug Finder remains out of scope.",
  },
  {
    domain: "OFFERS",
    label: "Offers / coupons",
    canonicalAdminRoute: ADMIN_DASHBOARD_ROUTES.promoCodes,
    adapterStatus: "RESERVED",
    supportsAttention: false,
    supportsMetrics: true,
    supportsWatch: false,
    notes: "Promo-code admin exists; first-wave adapter not required beyond payment source truth.",
  },
  {
    domain: "JOBS",
    label: "Empleos",
    canonicalAdminRoute: ADMIN_DASHBOARD_ROUTES.classifiedsQueue,
    adapterStatus: "RESERVED",
    supportsAttention: true,
    supportsMetrics: false,
    supportsWatch: false,
    notes: "Category workspace remains canonical. Moderation rolls up via LISTINGS/MODERATION.",
  },
  {
    domain: "COMMUNITY",
    label: "Community",
    canonicalAdminRoute: ADMIN_DASHBOARD_ROUTES.classifiedsQueue,
    adapterStatus: "RESERVED",
    supportsAttention: false,
    supportsMetrics: false,
    supportsWatch: false,
    notes: "No separate executive adapter until a dedicated admin queue exists.",
  },
  {
    domain: "BUSINESS_TOOLS",
    label: "Business tools",
    canonicalAdminRoute: "/dashboard/business-tools",
    adapterStatus: "RESERVED",
    supportsAttention: false,
    supportsMetrics: false,
    supportsWatch: false,
    notes: "Concierge catalog is coming soon — no fake execution metrics.",
  },
  {
    domain: "ANALYTICS",
    label: "Analytics",
    canonicalAdminRoute: "/admin/leo",
    adapterStatus: "PARTIAL",
    supportsAttention: false,
    supportsMetrics: true,
    supportsWatch: false,
    notes:
      "LEO-20D: bounded buyer-engagement listing_analytics counts only. No warehouse. No CTR/conversion rates. Category analytics remain at source for sellers.",
  },
  {
    domain: "AUTOMATION",
    label: "Automation / AI workers",
    canonicalAdminRoute: "/admin/leo",
    adapterStatus: "RESERVED",
    supportsAttention: true,
    supportsMetrics: false,
    supportsWatch: true,
    notes: "Contract only (LeoExecutiveAiWorkerReportInput). No category AI worker in this gate.",
  },
  {
    domain: "PROJECTS",
    label: "Projects",
    canonicalAdminRoute: "/admin/leo",
    adapterStatus: "RESERVED",
    supportsAttention: true,
    supportsMetrics: false,
    supportsWatch: true,
    notes: "Project intelligence already has a LEO service; not duplicated here.",
  },
];

export function leoExecutiveDomainEntry(
  domain: LeoExecutiveDomain,
): LeoExecutiveDomainRegistryEntry | undefined {
  return LEO_EXECUTIVE_DOMAIN_REGISTRY.find((e) => e.domain === domain);
}
