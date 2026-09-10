/**
 * Leonix Admin Guide / Operations Manual — Master Operating Book V2 §0C.
 *
 * This is the "book." The registry below is the single source of truth for every guide entry.
 * `/admin/guide` (the reader) and Admin Guide Search (the index) both consume this array — no
 * page independently hardcodes its own disconnected help text. A page's "Help with this page"
 * affordance looks itself up here by route via `getAdminGuideEntryForRoute()`.
 *
 * This is NOT Company Search (`adminOpsUnifiedSearch.ts`/`adminExtendedGlobalSearch.ts`), which
 * finds company RECORDS (a business, a payment, a listing). This registry finds OPERATIONAL
 * KNOWLEDGE (which Admin area to use, what a status means, what to do when something fails).
 * The two are deliberately separate systems per §0C and must not be conflated.
 *
 * Every route below was confirmed to exist in the current repository before being added — this
 * registry does not invent routes. Do not add a route here without confirming `page.tsx` exists.
 *
 * ---------------------------------------------------------------------------------------------
 * HOW TO ADD A NEW ADMIN GUIDE ENTRY (Master Operating Book V2 §0I "paper + pen" pattern)
 * ---------------------------------------------------------------------------------------------
 * When Leonix adds or rediscovers an operational module, add ONE object to `ADMIN_GUIDE_ENTRIES`
 * below with these fields. This is the whole admission contract for the Guide — the structure
 * stays stable, only the array grows.
 *
 *   id                — stable, unique, kebab-case (used as the /admin/guide/[id] detail key)
 *   title             — plain-language module name an owner or staff member would recognize
 *   domain            — one of the six V2 operating domains (AdminGlobalNavGroup)
 *   route             — the real, canonical Admin route (verify page.tsx exists first)
 *   purpose           — one or two sentences: what this module is for
 *   useWhen           — "Use this when..." — the trigger/scenario for opening this page
 *   commonTasks       — short list of the everyday things done here
 *   howTo             — ordered, human steps for the single most common task (not exhaustive docs)
 *   statuses          — key status/label values shown here and what each one means (optional)
 *   permissionNote    — plain-language description of who can use this (not a permission DSL)
 *   relatedAdminRoutes — other Admin routes an operator commonly needs alongside this one
 *   relatedPublicRoutes — public-site routes this module controls or reflects, if any
 *   actionLevel       — governance level per §8: "green" (read/analyze), "yellow" (reversible
 *                       prep), "red" (protected, owner-impacting) — omit if mixed/not applicable
 *   failureGuidance   — what to do when this module's data looks wrong or a control is broken
 *   keywords          — search terms/synonyms/human phrases a person might actually type
 *   canonicalEntity   — the canonical entity/table this module is really about, when known
 *   audience          — "owner" | "staff" | "both" — who this entry is written for
 *   leoSafeReadSource — true if LEO may later read this same guide entry as its own knowledge
 *                       source (almost always true — false only for a page that is itself
 *                       LEO's own console, to avoid a circular "LEO explains LEO" reference)
 *
 * Do not remove an entry when a route is deprecated — mark it in `notes` and point to the
 * replacement route instead, the same way the Cable Map records legacy/compatibility routes.
 *
 * Deliberately NOT `server-only` — every field here is plain documentation text, nothing
 * sensitive, so this module is safe to import from the client-side `AdminPageHelpLink` component
 * (the shared page-level "Help with this page" affordance wired once into the dashboard shell).
 */
import type { AdminGlobalNavGroup } from "./adminGlobalNav";

export type AdminGuideStatusMeaning = { label: string; meaning: string };

export type AdminGuideActionLevel = "green" | "yellow" | "red";

export type AdminGuideAudience = "owner" | "staff" | "both";

export type AdminGuideEntry = {
  id: string;
  title: string;
  domain: AdminGlobalNavGroup;
  route: string;
  purpose: string;
  useWhen: string;
  commonTasks: string[];
  howTo: string[];
  statuses?: AdminGuideStatusMeaning[];
  permissionNote: string;
  relatedAdminRoutes?: string[];
  relatedPublicRoutes?: string[];
  actionLevel?: AdminGuideActionLevel;
  failureGuidance?: string;
  keywords: string[];
  canonicalEntity?: string;
  audience: AdminGuideAudience;
  leoSafeReadSource: boolean;
  /** Optional freeform note — used for legacy/compatibility route callouts, not shown as a field label. */
  notes?: string;
};

export const ADMIN_GUIDE_ENTRIES: AdminGuideEntry[] = [
  // ============================================================= COMMAND =============================================================
  {
    id: "leo",
    title: "LEO (Executive Console)",
    domain: "command",
    route: "/admin/leo",
    purpose: "LEO is an optional intelligent assistant that reads the same canonical Admin truth as every other page here — it is not a separate control plane and not required to operate Leonix.",
    useWhen: "You want a summarized, conversational briefing on top of the same real data every other Admin page already shows.",
    commonTasks: ["Ask for a company briefing", "Ask what needs attention today"],
    howTo: ["Open LEO", "Ask a question about the company", "Follow the link it gives you back to the real Admin page for the actual control"],
    permissionNote: "Owner only today (owner_admin).",
    relatedAdminRoutes: ["/admin"],
    actionLevel: "green",
    failureGuidance: "If LEO is unavailable, misconfigured, or wrong, every fact and control it references is also reachable directly from the Command Center and each domain's own Admin page — LEO is never the only path to a launch-critical fact or control (Master Operating Book V2 §0A).",
    keywords: ["leo", "ai assistant", "executive console", "briefing", "ask leo"],
    audience: "owner",
    leoSafeReadSource: false,
    notes: "This entry explains LEO for the Guide; it does not implement LEO. LEO integration is a separate, later gate.",
  },
  {
    id: "command-center",
    title: "Command Center (Dashboard)",
    domain: "command",
    route: "/admin",
    purpose: "The home screen — Today's Attention, priority signals across every domain, and quick links into the rest of Admin.",
    useWhen: "You're starting your day and want to know what needs you right now versus what can wait.",
    commonTasks: ["Review Today's Attention", "Check Payments at risk / Unresolved support / System issues", "Jump into a flagged listing or business"],
    howTo: ["Open Admin (the dashboard is the default landing page)", "Scan Today's Attention top to bottom — items are ordered by real urgency, not database order", "Click a card's action button to go straight to the real control"],
    statuses: [
      { label: "real", meaning: "Backed by a live query against real data right now." },
      { label: "needs proof", meaning: "The data source could not be confirmed live — do not treat the number as certain until it's investigated." },
      { label: "planned", meaning: "Not built yet — shown honestly as a placeholder, never as fake data." },
    ],
    permissionNote: "Every staff role sees this page; the cards shown depend on what that role is allowed to view.",
    relatedAdminRoutes: ["/admin/system-health", "/admin/workspace/payment-tracker", "/admin/support", "/admin/workspace/clasificados"],
    actionLevel: "green",
    failureGuidance: "If a card says 'needs proof' or 'unavailable', trust System Health and the module's own page over the dashboard summary until it's resolved.",
    keywords: ["dashboard", "home", "today's attention", "command center", "what needs attention", "priority"],
    audience: "both",
    leoSafeReadSource: true,
  },
  {
    id: "customer-ops-search",
    title: "Customer Ops / Company Search",
    domain: "command",
    route: "/admin/ops",
    purpose: "The company patch panel — search for a real record by name, email, phone, or ID across businesses, users, listings, payments, leads, staff, reports, and more.",
    useWhen: "You know WHAT you're looking for (a person, a business, a payment, a listing) but not which Admin page it lives on.",
    commonTasks: ["Look up a customer by email or phone", "Find a business by name", "Find a payment or lead by id"],
    howTo: ["Open Customer Ops", "Type a name, email, phone, or id into the search box", "Results are grouped by type — click Open to go to the real record"],
    permissionNote: "Available to every non-sales-rep role; sales reps use My Clients on the Team hub instead.",
    relatedAdminRoutes: ["/admin/businesses", "/admin/usuarios", "/admin/support"],
    actionLevel: "green",
    failureGuidance: "If a source shows an error banner in results, that one source failed independently — other sources still returned real results.",
    keywords: ["company search", "find a business", "find a customer", "search", "look up", "where are users", "find payment", "find lead"],
    canonicalEntity: "cross-entity (businesses, profiles, listings, leads, payments, reports, support tickets)",
    audience: "both",
    leoSafeReadSource: true,
    notes: "This is COMPANY SEARCH — it finds real records. It is a different system from Admin Guide Search, which finds operational knowledge like this entry itself.",
  },

  // ============================================================= REVENUE =============================================================
  {
    id: "launch-leads",
    title: "Launch Leads / Inbox",
    domain: "revenue",
    route: "/admin/leads/inbox",
    purpose: "The real inbox for advertising, promo/print-quote, and media-kit inquiries — one table, filtered by view.",
    useWhen: "A new lead came in and needs a reply, or you need to check whether anyone has followed up.",
    commonTasks: ["Reply to a new lead", "Filter to Promocionales or Media Kit view", "Mark a lead contacted or archive it"],
    howTo: ["Open Launch Leads", "Use the view filter (All / Promocionales / Media Kit) at the top", "Open a lead row to reply or update its status"],
    statuses: [{ label: "new", meaning: "Needs a first reply." }, { label: "contacted", meaning: "Someone already followed up." }],
    permissionNote: "Available to every non-sales-rep role.",
    relatedAdminRoutes: ["/admin/leads/newsletter"],
    actionLevel: "yellow",
    keywords: ["leads", "inbox", "promo leads", "media kit", "advertising inquiry", "new lead", "print quote"],
    canonicalEntity: "leonix_leads",
    audience: "both",
    leoSafeReadSource: true,
  },
  {
    id: "payment-tracker",
    title: "Payment Tracker",
    domain: "revenue",
    route: "/admin/workspace/payment-tracker",
    purpose: "The one real, canonical payment ledger — every Stripe-driven payment record, its status, and commission eligibility.",
    useWhen: "You need to know if a payment failed, is pending, or cleared — or which payments are commission-eligible.",
    commonTasks: ["Search a payment by business/customer name", "Check failed or refunded payments", "Filter by status, sales rep, category, or promo code"],
    howTo: ["Open Payment Tracker", "Type a name into the search box, or use the status/category filters", "Open a row for the full payment record"],
    statuses: [
      { label: "pending / unpaid / requires_action", meaning: "Not yet cleared — money has not come in." },
      { label: "paid / succeeded", meaning: "Payment cleared." },
      { label: "failed / canceled / refunded / disputed", meaning: "Money did not come through as expected — worth checking." },
    ],
    permissionNote: "owner_admin and sales_manager only — not billing/support roles' totals view.",
    relatedAdminRoutes: ["/admin/workspace/package-entitlements", "/admin/workspace/promo-codes", "/admin/payments"],
    actionLevel: "green",
    failureGuidance: "If Stripe itself is unavailable, System Health's 'Stripe (payments)' component will show DEGRADED with a reason — check there first before assuming the Payment Tracker's own data is wrong.",
    keywords: ["failed payment", "payments", "money at risk", "stripe", "refund", "commission", "payment tracker", "invoice"],
    canonicalEntity: "leonix_payment_records",
    audience: "both",
    leoSafeReadSource: true,
    notes: "/admin/payments is a legacy compatibility route for an unrelated Tienda order ledger — do not confuse the two. This page is the real, canonical payment tracker.",
  },
  {
    id: "package-entitlements",
    title: "Packages & Entitlements",
    domain: "revenue",
    route: "/admin/workspace/package-entitlements",
    purpose: "Real advertising package/placement entitlements — what a business is actually paying for and whether it's active.",
    useWhen: "You need to check or manually grant/clear a business's advertising entitlement.",
    commonTasks: ["Check whether a listing's package is active", "Manually grant an entitlement after a cleared payment"],
    howTo: ["Open Packages & Entitlements", "Search by business or listing", "Review the entitlement's grant source and active window"],
    permissionNote: "Full access for owner_admin/sales_manager; sales reps see only their own.",
    relatedAdminRoutes: ["/admin/workspace/payment-tracker"],
    actionLevel: "yellow",
    keywords: ["entitlements", "packages", "placement", "advertising package", "is this ad active"],
    canonicalEntity: "listing_package_entitlements",
    audience: "both",
    leoSafeReadSource: true,
  },
  {
    id: "promo-codes",
    title: "Promo Codes",
    domain: "revenue",
    route: "/admin/workspace/promo-codes",
    purpose: "Create and manage Stripe-checkout discount codes.",
    useWhen: "You need a new promo code, or need to check who redeemed one.",
    commonTasks: ["Create a promo code", "Check redemption count", "Deactivate a code"],
    howTo: ["Open Promo Codes", "Use the generator to create a new code with a discount and limits", "Save — the code is immediately usable at checkout"],
    permissionNote: "Full access for owner_admin/sales_manager; sales reps manage only their own codes.",
    actionLevel: "yellow",
    keywords: ["promo code", "discount code", "coupon code", "create promo"],
    canonicalEntity: "leonix_promo_codes",
    audience: "both",
    leoSafeReadSource: true,
    notes: "Not the same as Ofertas Locales coupon listings or the dead cupones_page CMS — three unrelated 'coupon'-adjacent systems, see Cable Map.",
  },
  {
    id: "sales-tracker",
    title: "Sales Tracker",
    domain: "revenue",
    route: "/admin/workspace/sales-tracker",
    purpose: "Sales-rep performance and pipeline view over the same canonical payment/lead data.",
    useWhen: "You want to see sales activity by rep.",
    commonTasks: ["Review a rep's recent sales", "Check pipeline totals"],
    howTo: ["Open Sales Tracker", "Filter by rep or date range"],
    permissionNote: "Full view for owner_admin/sales_manager; sales reps see their own numbers only.",
    actionLevel: "green",
    keywords: ["sales tracker", "sales performance", "pipeline", "rep sales"],
    audience: "both",
    leoSafeReadSource: true,
  },
  {
    id: "tienda-catalog",
    title: "Tienda (Store / Catalog)",
    domain: "marketplace-ops",
    route: "/admin/tienda",
    purpose: "The Leonix print/merch store — catalog, orders, and storefront management. Functions as both a marketplace catalog and a revenue channel.",
    useWhen: "You need to manage a product, check an order, or update the storefront.",
    commonTasks: ["Add or edit a catalog product", "Check a Tienda order", "Update storefront content"],
    howTo: ["Open Tienda", "Use the Catalog tab to manage products, or Orders to review purchases"],
    permissionNote: "Available to every non-sales-rep role.",
    relatedAdminRoutes: ["/admin/tienda/catalog", "/admin/workspace/tienda", "/admin/workspace/tienda/storefront"],
    actionLevel: "yellow",
    keywords: ["tienda", "store", "catalog", "merch", "print orders", "storefront"],
    audience: "both",
    leoSafeReadSource: true,
  },

  // ============================================================= MARKETPLACE OPS =============================================================
  {
    id: "categories-hub",
    title: "Categories / Classifieds Ops",
    domain: "marketplace-ops",
    route: "/admin/workspace/clasificados",
    purpose: "The hub for every marketplace category's operational controls — Servicios, Autos, Restaurantes, Empleos, Viajes, Comida Local, Ofertas Locales, and the shared-listings categories.",
    useWhen: "You need to review, suspend, feature, or manage a listing in any classified category.",
    commonTasks: ["Review the flagged/pending queue", "Open a specific category's dedicated ops page", "Search or filter listings"],
    howTo: ["Open Categories", "Pick the category card you need, or use the review queue filter", "Open a listing row for the full detail and available actions"],
    statuses: [{ label: "flagged / pending", meaning: "Needs staff review before or after publication." }],
    permissionNote: "Available to every non-sales-rep role.",
    relatedAdminRoutes: ["/admin/reportes", "/admin/categories"],
    actionLevel: "yellow",
    failureGuidance: "If a category's listing count looks wrong, check the Cable Map — several dedicated-table categories were historically undercounted; verify against that category's own dedicated ops page.",
    keywords: ["categories", "listings", "classifieds", "turn off listing", "suspend listing", "moderation queue", "edit restaurant", "servicios", "autos", "restaurantes"],
    audience: "both",
    leoSafeReadSource: true,
  },
  {
    id: "categories-registry",
    title: "Categories Registry (Advanced)",
    domain: "marketplace-ops",
    route: "/admin/categories",
    purpose: "The dense category-registry table and Supabase-backed configuration for every marketplace category.",
    useWhen: "You need to see or adjust category-level configuration rather than an individual listing.",
    commonTasks: ["Review category status (live / staged / coming soon)", "Check per-category listing counts"],
    howTo: ["Open Categories Registry"],
    permissionNote: "Available to every non-sales-rep role.",
    relatedAdminRoutes: ["/admin/workspace/clasificados"],
    actionLevel: "green",
    keywords: ["category registry", "category config", "category status"],
    audience: "staff",
    leoSafeReadSource: true,
  },
  {
    id: "servicios-ops",
    title: "Servicios Ops",
    domain: "marketplace-ops",
    route: "/admin/workspace/clasificados/servicios",
    purpose: "Dedicated operations page for the Servicios category (its own table, not the shared listings table).",
    useWhen: "You need to review or manage a Servicios listing specifically.",
    commonTasks: ["Review pending Servicios listings", "Suspend or republish a Servicios ad"],
    howTo: ["Open Servicios Ops from the Categories hub"],
    permissionNote: "Available to every non-sales-rep role.",
    actionLevel: "yellow",
    keywords: ["servicios", "services category", "edit service listing"],
    canonicalEntity: "servicios_public_listings",
    audience: "staff",
    leoSafeReadSource: true,
  },
  {
    id: "autos-ops",
    title: "Autos Ops",
    domain: "marketplace-ops",
    route: "/admin/workspace/clasificados/autos",
    purpose: "Dedicated operations page for the Autos category, including payment-blocked listing visibility.",
    useWhen: "You need to review an Autos listing or check ads stuck on a failed/pending payment.",
    commonTasks: ["Review pending or payment-blocked Autos listings", "Verify/feature a dealer or private listing"],
    howTo: ["Open Autos Ops from the Categories hub, or from the Command Center's 'Autos blocked by payment' card"],
    statuses: [{ label: "pending_payment / payment_failed", meaning: "Listing is not live until payment clears." }],
    permissionNote: "Available to every non-sales-rep role.",
    relatedAdminRoutes: ["/admin"],
    actionLevel: "yellow",
    keywords: ["autos", "cars", "vehicle listing", "edit car ad", "payment blocked autos"],
    canonicalEntity: "autos_public_listings",
    audience: "staff",
    leoSafeReadSource: true,
  },
  {
    id: "restaurantes-ops",
    title: "Restaurantes Ops",
    domain: "marketplace-ops",
    route: "/admin/workspace/clasificados/restaurantes",
    purpose: "Dedicated operations page for the Restaurantes category.",
    useWhen: "You need to review or manage a restaurant listing.",
    commonTasks: ["Review pending Restaurantes listings", "Suspend a restaurant listing"],
    howTo: ["Open Restaurantes Ops from the Categories hub"],
    permissionNote: "Available to every non-sales-rep role.",
    actionLevel: "yellow",
    keywords: ["restaurantes", "restaurant listing", "edit restaurant"],
    canonicalEntity: "restaurantes_public_listings",
    audience: "staff",
    leoSafeReadSource: true,
  },
  {
    id: "comida-local-ops",
    title: "Comida Local Ops",
    domain: "marketplace-ops",
    route: "/admin/workspace/clasificados/comida-local",
    purpose: "Dedicated operations page for the Comida Local (street food/pop-up vendor) category.",
    useWhen: "You need to review or manage a Comida Local vendor listing.",
    commonTasks: ["Review pending Comida Local listings", "Update a vendor's status"],
    howTo: ["Open Comida Local Ops from the Categories hub"],
    permissionNote: "Available to every non-sales-rep role.",
    actionLevel: "yellow",
    failureGuidance: "Payment for this category is not live yet (pre-Stripe stage) — a listing's payment_status will show a placeholder value, not a real payment signal.",
    keywords: ["comida local", "food vendor", "street food listing"],
    canonicalEntity: "comida_local_public_listings",
    audience: "staff",
    leoSafeReadSource: true,
  },
  {
    id: "ofertas-locales-ops",
    title: "Ofertas Locales Ops",
    domain: "marketplace-ops",
    route: "/admin/workspace/clasificados/ofertas-locales",
    purpose: "Dedicated operations page for Ofertas Locales — the AI-scanned flyer/offer intake system.",
    useWhen: "You need to review a scanned offer flyer before it publishes, or check a paid flyer's status.",
    commonTasks: ["Review an AI-scanned offer item", "Approve or reject a flyer item"],
    howTo: ["Open Ofertas Locales Ops from the Categories hub"],
    permissionNote: "Available to every non-sales-rep role.",
    actionLevel: "yellow",
    keywords: ["ofertas locales", "flyer", "offer scan", "coupon flyer"],
    canonicalEntity: "ofertas_locales",
    audience: "staff",
    leoSafeReadSource: true,
  },
  {
    id: "viajes-ops",
    title: "Viajes (Travel) Ops",
    domain: "marketplace-ops",
    route: "/admin/clasificados/viajes",
    purpose: "Operations for the Viajes/travel marketplace vertical — staged listings, business offers, and affiliate cards.",
    useWhen: "You need to review a travel listing or manage a travel business offer.",
    commonTasks: ["Review a staged Viajes listing", "Manage business offers or affiliate cards"],
    howTo: ["Open Viajes from the sidebar"],
    permissionNote: "Available to every non-sales-rep role.",
    relatedAdminRoutes: ["/admin/workspace/clasificados/travel"],
    actionLevel: "yellow",
    keywords: ["viajes", "travel listing", "travel business offer"],
    canonicalEntity: "viajes_staged_listings",
    audience: "staff",
    leoSafeReadSource: true,
    notes: "A second Viajes-adjacent page exists at /admin/workspace/clasificados/travel — confirmed a real, functioning staged-listings queue, not a broken duplicate; this is the primary-nav entry point.",
  },
  {
    id: "reports-moderation",
    title: "Reports & Complaints",
    domain: "marketplace-ops",
    route: "/admin/reportes",
    purpose: "User-submitted listing reports and complaint signals — evidence for moderation decisions, not a moderation action itself.",
    useWhen: "A listing was reported, or you're triaging trust & safety signals.",
    commonTasks: ["Search a report by listing or reporter", "Review pending reports"],
    howTo: ["Open Reports & Complaints", "Search or filter by status", "Open the related listing to act on the report"],
    statuses: [{ label: "pending", meaning: "Not yet reviewed." }, { label: "reviewed / dismissed", meaning: "A staff decision was recorded." }],
    permissionNote: "Available to every non-sales-rep role.",
    relatedAdminRoutes: ["/admin/workspace/clasificados"],
    actionLevel: "yellow",
    keywords: ["reports", "complaints", "flagged listing", "trust and safety", "moderation"],
    canonicalEntity: "listing_reports",
    audience: "staff",
    leoSafeReadSource: true,
  },
  {
    id: "recursos",
    title: "Recursos (Community Resources)",
    domain: "marketplace-ops",
    route: "/admin/recursos",
    purpose: "Recursos Data OS — community resource directory (organizations, programs) serving both marketplace-style discovery and website content.",
    useWhen: "You need to add, verify, or update a community resource listing.",
    commonTasks: ["Add a new resource", "Verify a resource's status", "Review AI-discovered candidate resources"],
    howTo: ["Open Recursos", "Search or filter existing resources, or use 'New' to add one"],
    permissionNote: "Available to every non-sales-rep role.",
    relatedAdminRoutes: ["/admin/recursos/candidatos", "/admin/recursos/solicitudes"],
    actionLevel: "yellow",
    keywords: ["recursos", "community resources", "resource directory"],
    canonicalEntity: "community_resources",
    audience: "staff",
    leoSafeReadSource: true,
  },

  // ============================================================= PEOPLE =============================================================
  {
    id: "business-360",
    title: "Businesses (Business Concierge / Business 360)",
    domain: "people",
    route: "/admin/businesses",
    purpose: "The canonical business identity list and the Business 360 detail page — one place to see a business's status, contacts, follow-ups, notes, and connected records.",
    useWhen: "You need the full picture on one client business, or want to see who needs follow-up.",
    commonTasks: ["Find a business and open its 360 view", "Check who's overdue or waiting on the owner", "Add a note or schedule a follow-up"],
    howTo: ["Open Businesses", "Search by name or use the follow-up filters", "Open a business row for the full 360 detail"],
    statuses: [{ label: "overdue / waiting_on_owner", meaning: "A real follow-up needs attention." }],
    permissionNote: "Available to every role, including sales reps (scoped to their own assigned businesses).",
    relatedAdminRoutes: ["/admin/ops"],
    actionLevel: "yellow",
    keywords: ["business concierge", "business 360", "client", "customer follow up", "who needs follow up"],
    canonicalEntity: "businesses",
    audience: "both",
    leoSafeReadSource: true,
  },
  {
    id: "team-hub",
    title: "Team (Staff Home)",
    domain: "people",
    route: "/admin/team",
    purpose: "The staff home hub — links to Team Roster (login/permissions), Executive Hub (public contact profiles), and staff self-service tools.",
    useWhen: "You're not sure which staff-related page you need — start here.",
    commonTasks: ["Navigate to Team Roster or Executive Hub", "Create a customer record", "Check the sales tracker"],
    howTo: ["Open Team from the sidebar's 'Team' link, then use the tab bar to reach Roster, Executive Hub, or other staff tools"],
    permissionNote: "Every staff member sees this hub; owner-only cards (Create staff login, Team Roster, Executive Hub) are additionally gated.",
    relatedAdminRoutes: ["/admin/team/roster", "/admin/team/executive-hub", "/admin/team/users/new"],
    actionLevel: "green",
    keywords: ["team", "staff home", "team hub"],
    audience: "both",
    leoSafeReadSource: true,
  },
  {
    id: "team-roster",
    title: "Team Roster (Staff Login & Permissions)",
    domain: "people",
    route: "/admin/team/roster",
    purpose: "Team Roster is staff LOGIN and AUTHORIZATION — who can sign into Admin, their role, and what they're permitted to do. It is not the same system as a staff member's public contact profile (see Executive Hub).",
    useWhen: "You need to create a staff login, change someone's role/permissions, or deactivate an account.",
    commonTasks: ["Create a new staff login", "Change a staff member's permissions", "Activate or deactivate a roster row"],
    howTo: ["Open Team Roster", "Use 'Create staff login' for a brand-new employee, or find an existing row to edit permissions", "Deactivating requires an explicit second confirmation if you're deactivating your own row"],
    permissionNote: "owner_admin only.",
    relatedAdminRoutes: ["/admin/team/users/new", "/admin/team/executive-hub", "/admin/team/my-profile"],
    actionLevel: "red",
    failureGuidance: "If a new hire also needs a public contact page (photo, title, QR code, vCard), creating their login here does NOT create that — open Executive Hub separately to add it, then link it to their roster account so they can self-edit their own profile.",
    keywords: ["create employee", "add staff", "staff login", "how do i add staff", "permissions", "deactivate staff", "roster"],
    canonicalEntity: "admin_team_members",
    audience: "owner",
    leoSafeReadSource: true,
  },
  {
    id: "executive-hub",
    title: "Executive Hub (Staff Contact Profile — Owner Management)",
    domain: "people",
    route: "/admin/team/executive-hub",
    purpose: "Executive Hub manages every staff member's PUBLIC CONTACT PROFILE — photo, title, theme, working hours, and publish status for their public contact page. It is a completely separate system from Team Roster (staff login/authorization): there is no automatic link, and creating a login does not create a profile.",
    useWhen: "A staff member needs a public contact page created (e.g. for a business card, QR code, or website listing), or an existing profile needs an owner-only change (publish state, company/legal details, business hub link, availability).",
    commonTasks: ["Create a new executive contact profile", "Edit photo, title, or working hours", "Publish, suspend, or preview a profile", "Link a profile to a staff roster account so that staff member can self-edit their own safe fields"],
    howTo: ["Open Executive Hub", "Use 'New' to create a profile, or open an existing one to edit", "Use Preview to see exactly what the public page will show before publishing", "In the Identity section, use 'Link to staff account' to authorize that staff member to edit their own name, title, bio, contact info, socials, theme, and photo from My Profile"],
    statuses: [{ label: "draft", meaning: "Not yet visible on the public site." }, { label: "published", meaning: "Live at the public contact page." }, { label: "suspended", meaning: "Temporarily hidden from the public." }],
    permissionNote: "owner_admin only. This is the full owner-management surface — every field, including publishing state and the staff-link assignment itself.",
    relatedAdminRoutes: ["/admin/team/roster", "/admin/team/my-profile"],
    relatedPublicRoutes: ["/contact/[slug]"],
    actionLevel: "red",
    failureGuidance: "Staff self-editing is now available (see 'My Profile') for a limited, safe field set once an owner links their account here — publishing, slug, company/legal details, and Business Hub links always remain owner-only, even for a linked staff member.",
    keywords: ["staff contact", "contact page", "vcard", "qr code", "business card page", "public profile", "contact slug", "update staff contact page", "link staff account", "find staff contact", "search staff profile"],
    canonicalEntity: "executives",
    audience: "owner",
    leoSafeReadSource: true,
    notes: "QR code, vCard download, and the public /contact/[slug] page are all real and already built (DigitalContactQrCode.tsx, the vcf API route, digitalContactVCard.ts). Staff↔profile linkage is a real FK (executives.linked_roster_id -> admin_team_members.id, 20260910120000, additive, not yet applied remotely) — see the Cable Map for the pre-migration fallback behavior. Company Search (Customer Ops, /admin/ops) can now find these profiles by name, title, email, slug, company, or phone — labeled distinctly as 'Staff contact profile,' never merged with a 'Staff' (Team Roster login) result. Do not confuse this with Admin Guide Search (this page): Company Search finds the real record, this entry teaches how to operate the system that owns it.",
  },
  {
    id: "my-profile",
    title: "My Profile (Staff Self-Service Contact Profile)",
    domain: "people",
    route: "/admin/team/my-profile",
    purpose: "Edit your OWN public contact profile — the same Executive Hub record an owner manages, scoped to only the safe personal fields you're allowed to change yourself. You must be signed in with the real Staff/Team login and have a profile an owner already linked to your account.",
    useWhen: "You want to update your own name shown, title, bio, phone, email, socials, theme, or photo on your public contact page.",
    commonTasks: ["Update your title or bio", "Update your phone/email/social links", "Change your profile photo", "Open your public contact page to see how it looks"],
    howTo: ["Open My Profile from the Team tab bar", "If nothing appears, either your account has no linked profile yet (ask an owner to link one in Executive Hub) or you signed in via owner bootstrap instead of Staff/Team login", "Edit the fields shown and save", "Use 'View my public page' to confirm it looks right"],
    permissionNote: "Any active staff member signed in via the real Staff / Team login (not owner bootstrap) whose profile an owner has linked in Executive Hub. Publishing, your slug, company/legal details, Business Hub links, and availability remain owner-only — they simply do not appear on this page.",
    relatedAdminRoutes: ["/admin/team/executive-hub", "/admin/team/roster"],
    relatedPublicRoutes: ["/contact/[slug]"],
    actionLevel: "yellow",
    failureGuidance: "\"No public contact profile is linked to your account yet\" means an owner needs to link one in Executive Hub first — this page cannot create a profile itself. \"We could not confirm your staff identity\" usually means you're signed in via owner bootstrap rather than the real Staff/Team email+password login.",
    keywords: ["my profile", "edit my contact", "update my contact page", "staff self service", "self edit profile", "change my photo", "change my bio"],
    canonicalEntity: "executives",
    audience: "staff",
    leoSafeReadSource: true,
  },
  {
    id: "users",
    title: "Users",
    domain: "people",
    route: "/admin/usuarios",
    purpose: "Customer/end-user accounts — profile, account type/tier, and their commercial context (ads, entitlements, payments, orders, reports, audit).",
    useWhen: "You need to look up a customer account, check their tier, or disable an account.",
    commonTasks: ["Search for a user", "Change a user's account type/tier", "Disable a problem account"],
    howTo: ["Open Users", "Search by name or email", "Open a user's detail page for the full commercial context"],
    permissionNote: "Available to every non-sales-rep role.",
    relatedAdminRoutes: ["/admin/ops"],
    actionLevel: "yellow",
    keywords: ["users", "customers", "where are users", "account tier", "disable account", "customer account"],
    canonicalEntity: "profiles",
    audience: "both",
    leoSafeReadSource: true,
  },
  {
    id: "support",
    title: "Support",
    domain: "people",
    route: "/admin/support",
    purpose: "A minimal internal support-ticket log linked to real accounts — not a public helpdesk.",
    useWhen: "A customer needs help and you need to log or check a support case.",
    commonTasks: ["Create a support ticket", "Check open tickets", "Update a ticket's follow-up status"],
    howTo: ["Open Support", "Search by account, or review the open-tickets list", "Create a new ticket if one doesn't already exist"],
    statuses: [{ label: "open / in_progress", meaning: "Unresolved — counted in the Command Center's Unresolved Support card." }, { label: "closed", meaning: "Resolved." }],
    permissionNote: "Available to every role, including sales reps.",
    relatedAdminRoutes: ["/admin/usuarios", "/admin/ops"],
    actionLevel: "yellow",
    keywords: ["support ticket", "support case", "customer support", "help desk", "unresolved support"],
    canonicalEntity: "support_tickets",
    audience: "both",
    leoSafeReadSource: true,
  },

  // ============================================================= WEBSITE CONTROL =============================================================
  {
    id: "site-sections",
    title: "Site Sections (Website Control Hub)",
    domain: "website-control",
    route: "/admin/workspace",
    purpose: "The hub for editing public-site content sections — Home, Nosotros, Contacto, Anúnciate, Revista, Noticias, Iglesias, and category landing content.",
    useWhen: "You need to change something on the public website's content pages.",
    commonTasks: ["Edit the homepage", "Update the Nosotros or Contacto page", "Manage Revista, Noticias, or Iglesias content"],
    howTo: ["Open Site Sections", "Pick the section card you need", "Edit and save — most sections have a live preview"],
    permissionNote: "Requires site-settings permission (owner_admin/content_admin roles).",
    relatedAdminRoutes: ["/admin/workspace/home", "/admin/workspace/nosotros", "/admin/workspace/contacto", "/admin/workspace/anunciate", "/admin/workspace/revista", "/admin/workspace/noticias", "/admin/workspace/iglesias"],
    actionLevel: "yellow",
    keywords: ["change website", "change homepage", "edit website content", "site sections", "website control"],
    audience: "both",
    leoSafeReadSource: true,
  },
  {
    id: "home-content",
    title: "Home Page Content",
    domain: "website-control",
    route: "/admin/workspace/home",
    purpose: "Editable content for the public homepage.",
    useWhen: "You need to change homepage copy, banners, or featured content.",
    commonTasks: ["Edit homepage sections"],
    howTo: ["Open Site Sections → Home"],
    permissionNote: "Requires site-settings permission.",
    actionLevel: "yellow",
    keywords: ["homepage", "change homepage", "home content"],
    audience: "staff",
    leoSafeReadSource: true,
  },
  {
    id: "revista",
    title: "Revista (Magazine)",
    domain: "website-control",
    route: "/admin/workspace/revista",
    purpose: "Magazine issue lifecycle — create, publish, feature, and archive issues.",
    useWhen: "A new magazine issue needs to be published, or an existing one needs updating.",
    commonTasks: ["Create a new issue", "Set the featured issue", "Publish or archive an issue"],
    howTo: ["Open Revista", "Use the issue create/edit form"],
    permissionNote: "Requires site-settings permission.",
    actionLevel: "yellow",
    keywords: ["revista", "magazine", "magazine issue"],
    canonicalEntity: "magazine_issues",
    audience: "staff",
    leoSafeReadSource: true,
  },
  {
    id: "noticias",
    title: "Noticias",
    domain: "website-control",
    route: "/admin/workspace/noticias",
    purpose: "Noticias is a curated news aggregator, not a full article CMS — this page manages shell copy and feed configuration, not individual articles.",
    useWhen: "You need to update the Noticias section's shell content or feed sources.",
    commonTasks: ["Update shell copy", "Review feed configuration"],
    howTo: ["Open Site Sections → Noticias"],
    permissionNote: "Requires site-settings permission.",
    actionLevel: "yellow",
    failureGuidance: "There is no per-article editor by design — Noticias aggregates from external sources rather than hosting original articles.",
    keywords: ["noticias", "news"],
    audience: "staff",
    leoSafeReadSource: true,
  },
  {
    id: "iglesias",
    title: "Iglesias",
    domain: "website-control",
    route: "/admin/workspace/iglesias",
    purpose: "Manage church/congregation directory listings and prayer-request content.",
    useWhen: "A church listing needs to be added or updated, or prayer content needs review.",
    commonTasks: ["Add or edit a church listing", "Review prayer requests"],
    howTo: ["Open Site Sections → Iglesias"],
    permissionNote: "Requires site-settings permission.",
    actionLevel: "yellow",
    keywords: ["iglesias", "church directory", "prayer requests"],
    audience: "staff",
    leoSafeReadSource: true,
  },
  {
    id: "nosotros",
    title: "Nosotros (About)",
    domain: "website-control",
    route: "/admin/workspace/nosotros",
    purpose: "Editable content for the public About/Nosotros page.",
    useWhen: "The About page's copy needs updating.",
    commonTasks: ["Edit About page content"],
    howTo: ["Open Site Sections → Nosotros"],
    permissionNote: "Requires site-settings permission.",
    actionLevel: "yellow",
    keywords: ["nosotros", "about page"],
    audience: "staff",
    leoSafeReadSource: true,
  },
  {
    id: "contacto",
    title: "Contacto",
    domain: "website-control",
    route: "/admin/workspace/contacto",
    purpose: "Editable content for the public Contact page (distinct from an individual staff member's contact profile — see Executive Hub).",
    useWhen: "The public Contact page's copy or form needs updating.",
    commonTasks: ["Edit Contact page content"],
    howTo: ["Open Site Sections → Contacto"],
    permissionNote: "Requires site-settings permission.",
    relatedAdminRoutes: ["/admin/team/executive-hub"],
    actionLevel: "yellow",
    keywords: ["contacto", "contact page", "contact form"],
    audience: "staff",
    leoSafeReadSource: true,
  },
  {
    id: "anunciate",
    title: "Anúnciate (Advertise With Us)",
    domain: "website-control",
    route: "/admin/workspace/anunciate",
    purpose: "Editable content for the public advertising-pitch page.",
    useWhen: "The advertising pitch page's copy needs updating.",
    commonTasks: ["Edit Anúnciate page content"],
    howTo: ["Open Site Sections → Anúnciate"],
    permissionNote: "Requires site-settings permission.",
    actionLevel: "yellow",
    keywords: ["anunciate", "advertise with us", "advertising page"],
    audience: "staff",
    leoSafeReadSource: true,
  },
  {
    id: "cupones",
    title: "Cupones (Legacy)",
    domain: "website-control",
    route: "/admin/workspace/cupones",
    purpose: "Legacy coupon content management. The public /cupones page actually renders live Ofertas Locales data, not this page's content — confirmed broken write path (see Cable Map).",
    useWhen: "Avoid using this to change what visitors see on /cupones — use Ofertas Locales Ops instead.",
    commonTasks: [],
    howTo: [],
    permissionNote: "Requires site-settings permission.",
    relatedAdminRoutes: ["/admin/workspace/clasificados/ofertas-locales"],
    actionLevel: "yellow",
    failureGuidance: "Content saved here is not rendered by the live public page — this is a known, documented split-truth issue, not something wrong with your edit.",
    keywords: ["cupones", "coupons page"],
    audience: "staff",
    leoSafeReadSource: true,
    notes: "Documented broken write path — Cable Map, WEBSITE domain.",
  },
  {
    id: "site-settings",
    title: "Site Settings",
    domain: "website-control",
    route: "/admin/site-settings",
    purpose: "Global site-wide configuration — the real settings writer.",
    useWhen: "You need to change a global setting that affects the whole public site.",
    commonTasks: ["Update a global site setting"],
    howTo: ["Open Site Settings"],
    permissionNote: "Requires site-settings permission (owner_admin/content_admin).",
    relatedAdminRoutes: ["/admin/settings"],
    actionLevel: "red",
    keywords: ["site settings", "global settings", "website configuration"],
    audience: "staff",
    leoSafeReadSource: true,
  },
  {
    id: "language-audit",
    title: "Language Audit",
    domain: "website-control",
    route: "/admin/workspace/language-audit",
    purpose: "A checklist-style page reviewing whether major Admin areas resolve through the shared bilingual (EN/ES) dictionary.",
    useWhen: "You want a status overview of bilingual coverage across Admin chrome.",
    commonTasks: ["Review the language coverage checklist"],
    howTo: ["Open Language Audit"],
    permissionNote: "Requires site-settings permission.",
    actionLevel: "green",
    failureGuidance: "This page cannot detect a real missing-translation gap by construction — it checks chrome resolution, not individual field-level blank EN/ES content.",
    keywords: ["language audit", "translation", "bilingual", "spanish english"],
    audience: "staff",
    leoSafeReadSource: true,
  },

  // ============================================================= SYSTEM =============================================================
  {
    id: "system-health",
    title: "System Health",
    domain: "system",
    route: "/admin/system-health",
    purpose: "Real, detectable health for Supabase, the audit pipeline, team roster data, and whether Stripe/email/SMS are configured and (for Stripe) actually working based on recent webhook history.",
    useWhen: "Something in Admin looks wrong, slow, or missing, and you want to know if it's a real outage versus your own data.",
    commonTasks: ["Check whether Stripe/email/SMS is configured", "Check whether Supabase/data access is healthy", "See what's degraded before assuming a page is broken"],
    howTo: ["Open System Health", "Review each component's state and owner message"],
    statuses: [
      { label: "HEALTHY", meaning: "Working normally." },
      { label: "DEGRADED", meaning: "A real, detected problem — read the owner message for what and why." },
      { label: "UNAVAILABLE", meaning: "Cannot reach this dependency at all right now." },
      { label: "NOT_CONFIGURED", meaning: "Not set up in this environment — often expected, not an error." },
    ],
    permissionNote: "Available to every non-sales-rep role.",
    relatedAdminRoutes: ["/admin"],
    actionLevel: "green",
    failureGuidance: "Never treat a NOT_CONFIGURED integration as broken — check the owner message; it explains whether that's expected for this deployment.",
    keywords: ["system health", "stripe unavailable", "twilio", "resend", "is the system down", "what's broken", "integration status", "provider status"],
    audience: "both",
    leoSafeReadSource: true,
  },
  {
    id: "activity-log",
    title: "Activity / Audit Log",
    domain: "system",
    route: "/admin/activity-log",
    purpose: "The append-only record of admin actions — what happened, and (when resolvable) who did it.",
    useWhen: "You need to know what changed recently, or who performed a specific action.",
    commonTasks: ["Filter by action or target", "Check recent activity on a specific record"],
    howTo: ["Open Activity Log", "Filter by action/target type/target id/date"],
    permissionNote: "owner_admin only.",
    actionLevel: "green",
    failureGuidance: "Actor attribution is best-effort — some rows may show 'server' when the acting operator could not be resolved (e.g. under bootstrap access); this is honest, not a bug.",
    keywords: ["audit log", "activity log", "who did this", "what changed", "history"],
    canonicalEntity: "admin_audit_log",
    audience: "owner",
    leoSafeReadSource: true,
  },
  {
    id: "settings",
    title: "Settings (Legacy)",
    domain: "system",
    route: "/admin/settings",
    purpose: "Legacy settings stub — the real settings writer is Site Settings.",
    useWhen: "Use Site Settings instead for real changes.",
    commonTasks: [],
    howTo: [],
    permissionNote: "Requires site-settings permission.",
    relatedAdminRoutes: ["/admin/site-settings"],
    actionLevel: "green",
    keywords: ["settings"],
    audience: "staff",
    leoSafeReadSource: true,
  },
];

/**
 * Page-level help lookup: exact match first, then longest-prefix match, so a detail route like
 * `/admin/businesses/abc123` still resolves to the `business-360` entry registered at
 * `/admin/businesses`. Returns null (never a guess) when no entry covers the route — the caller
 * must fail honestly rather than show incorrect help (Master Operating Book V2 §0C).
 */
export function getAdminGuideEntryForRoute(pathname: string): AdminGuideEntry | null {
  const exact = ADMIN_GUIDE_ENTRIES.find((e) => e.route === pathname);
  if (exact) return exact;
  const prefixMatches = ADMIN_GUIDE_ENTRIES.filter(
    (e) => e.route !== "/admin" && pathname.startsWith(`${e.route}/`),
  );
  if (prefixMatches.length === 0) return null;
  return prefixMatches.reduce((longest, e) => (e.route.length > longest.route.length ? e : longest));
}

export function getAdminGuideEntryById(id: string): AdminGuideEntry | null {
  return ADMIN_GUIDE_ENTRIES.find((e) => e.id === id) ?? null;
}

/**
 * Admin Guide Search — finds operational KNOWLEDGE (which page to use, what a status means),
 * never company RECORDS. That is Company Search's job (`adminOpsUnifiedSearch.ts`), a completely
 * separate system. Plain substring scoring over title/keywords/purpose/useWhen/tasks/statuses —
 * simple and maintainable, matching this registry's own "keep this simple" design goal. No
 * external search index; the registry is small enough that this runs instantly server-side.
 */
export type AdminGuideSearchResult = { entry: AdminGuideEntry; score: number };

export function searchAdminGuide(query: string, entries: AdminGuideEntry[] = ADMIN_GUIDE_ENTRIES): AdminGuideSearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);

  const results: AdminGuideSearchResult[] = [];
  for (const entry of entries) {
    let score = 0;
    const title = entry.title.toLowerCase();
    if (title === q) score += 100;
    else if (title.includes(q)) score += 40;

    for (const term of terms) {
      if (title.includes(term)) score += 10;
      if (entry.keywords.some((k) => k.toLowerCase().includes(term))) score += 12;
      if (entry.purpose.toLowerCase().includes(term)) score += 4;
      if (entry.useWhen.toLowerCase().includes(term)) score += 4;
      if (entry.commonTasks.some((t) => t.toLowerCase().includes(term))) score += 5;
      if (entry.howTo.some((s) => s.toLowerCase().includes(term))) score += 3;
      if (entry.statuses?.some((s) => s.label.toLowerCase().includes(term) || s.meaning.toLowerCase().includes(term))) score += 6;
      if (entry.canonicalEntity?.toLowerCase().includes(term)) score += 3;
    }
    if (score > 0) results.push({ entry, score });
  }
  return results.sort((a, b) => b.score - a.score);
}

/**
 * Role-aware annotation (Master Operating Book V2 §0E/§0C): a staff member may be allowed to
 * LEARN a capability exists without being allowed to OPERATE it. Reuses the same canonical
 * `allowedHrefs` list `AdminSidebar.tsx` already filters the real nav through
 * (`getAllowedGlobalNavHrefs()`), rather than re-implementing permission logic in the Guide —
 * one source of truth for "can this viewer actually reach this route." A workspace sub-page
 * (e.g. `/admin/workspace/noticias`) is treated as accessible whenever its parent
 * (`/admin/workspace`) is, since the parent route itself gates the whole sub-tree.
 */
export function isAdminGuideRouteAccessible(route: string, allowedHrefs: string[]): boolean {
  if (allowedHrefs.includes(route)) return true;
  return allowedHrefs.some((href) => href !== "/admin" && route.startsWith(`${href}/`));
}
