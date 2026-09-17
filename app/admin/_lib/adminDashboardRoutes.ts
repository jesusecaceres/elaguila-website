/** Canonical dashboard CTA routes — used by command center + verify smoke matrix. */
export const ADMIN_DASHBOARD_ROUTES = {
  /** LEO-POLISH.1 — canonical owner executive console route (single alias, do not duplicate). */
  leo: "/admin/leo",
  launchLeads: "/admin/leads/inbox",
  promocionales: "/admin/leads/inbox?view=promo",
  newsletter: "/admin/leads/newsletter",
  /** ADMIN-OS-01 — was "/admin/leads/media-kit" (a dedicated page/table with zero
   * live callers; real media-kit interest lands in leonix_leads instead). See
   * docs/admin-os/ADMIN_OS_CABLE_MAP.md, REVENUE domain, "Media Kit requests". */
  mediaKit: "/admin/leads/inbox?view=media_kit",
  classifiedsQueue: "/admin/workspace/clasificados",
  /**
   * Filtered review queue — lands on queue table, not category hub (ADMIN-REVIEW-QUEUE-TRUTH-02).
   * CMD-004 (2026-09-14): `status=needs_review` is a synthetic filter value
   * (see LISTINGS_NEEDS_REVIEW_STATUS_TOKEN in listingsAdminSelect.ts) that
   * reproduces the exact pending+flagged+reported union the Command Center
   * counts — was `status=flagged`, which silently hid pending and reported
   * listings from the same CTA that claimed to represent all of them.
   */
  classifiedsReviewQueue: "/admin/workspace/clasificados?status=needs_review#queue",
  categories: "/admin/workspace/clasificados",
  team: "/admin/team",
  teamRoster: "/admin/team/roster",
  createStaffUser: "/admin/team/users/new",
  websiteSections: "/admin/site-sections",
  serviciosOps: "/admin/workspace/clasificados/servicios",
  autosOps: "/admin/workspace/clasificados/autos",
  restaurantesOps: "/admin/workspace/clasificados/restaurantes",
  viajesOps: "/admin/workspace/clasificados/travel",
  activityLog: "/admin/activity-log",
  languageAudit: "/admin/workspace/language-audit",
  globalSettings: "/admin/settings",
  siteSettings: "/admin/site-settings",
  tienda: "/admin/tienda",
  catalog: "/admin/tienda/catalog",
  viewSite: "/",
  reviewQueue: "/admin#review",
  /** Trust & Safety listing-reports queue — real page, actively consumed by
   * the Command Center CTAs and LEO's executive-reporting deep links below. */
  reports: "/admin/reportes",
  users: "/admin/usuarios",
  customerOps: "/admin/ops",
  /** LEO-ADMIN-OS-FINAL.2 — was "/admin/payments" (a retired, unlinked stub
   * with zero consumers repo-wide); corrected to the real payment tracker,
   * the same canonical route paymentTracker already points to below. */
  payments: "/admin/workspace/payment-tracker",
  paymentTracker: "/admin/workspace/payment-tracker",
  iglesias: "/admin/workspace/iglesias",
  support: "/admin/support",
  promoCodes: "/admin/workspace/promo-codes",
  packageEntitlements: "/admin/workspace/package-entitlements",
  systemHealth: "/admin/system-health",
} as const;

export type AdminDashboardRouteKey = keyof typeof ADMIN_DASHBOARD_ROUTES;
