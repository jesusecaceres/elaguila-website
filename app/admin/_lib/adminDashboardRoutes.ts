/** Canonical dashboard CTA routes — used by command center + verify smoke matrix. */
export const ADMIN_DASHBOARD_ROUTES = {
  launchLeads: "/admin/leads/inbox",
  promocionales: "/admin/leads/inbox?view=promo",
  newsletter: "/admin/leads/newsletter",
  mediaKit: "/admin/leads/media-kit",
  classifiedsQueue: "/admin/workspace/clasificados",
  /** Filtered review queue — lands on queue table, not category hub (ADMIN-REVIEW-QUEUE-TRUTH-02). */
  classifiedsReviewQueue: "/admin/workspace/clasificados?status=flagged#queue",
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
  reports: "/admin/reportes",
  users: "/admin/usuarios",
  customerOps: "/admin/ops",
  payments: "/admin/payments",
  support: "/admin/support",
} as const;

export type AdminDashboardRouteKey = keyof typeof ADMIN_DASHBOARD_ROUTES;
