/**
 * Staff Operating System — the one role-aware wire map behind the Business Concierge staff home
 * (/admin/businesses). Pure composition, no I/O, no new permission: every href below is an
 * EXISTING route, and the role routing only reproduces what the dashboard layout already
 * enforces (app/admin/_lib/staffSalesAllowedAdminPath.ts) so a sales_rep is never handed a link
 * that the layout would bounce to /admin/team?access_denied=1.
 *
 * Source-backed routing truth (do not "fix" by broadening the allowlist):
 * - sales_rep may only reach /admin/team*, /admin/support*, /admin/businesses*, /admin/field*,
 *   /admin/guide*  →  promo codes / sales tracker / clients go through their /admin/team aliases
 *   (app/admin/(dashboard)/team/{promo-codes,sales-tracker,clients}), never /admin/workspace/*
 *   or /admin/ops.
 * - Payment Tracker is owner_admin OR the `can_view_payments` roster permission
 *   (adminAccessControl.hasPaymentTrackerAccess) — the caller resolves that with the existing
 *   legacy context and passes the boolean here; this file never re-derives it.
 * - Recording a manual (offline) payment is a revenue-protected write: raw `super_admin` roster
 *   role only, bootstrap rejected (requireRevenueProtectedWriteAccess). The link is shown only
 *   when the POST could succeed; everyone else sees it in the honest "restricted" list instead.
 * - Team roster / Create staff login / Executive Hub are owner_admin (= super_admin) only.
 * - Virtual Front Desk (doorbell) and Availability (presence) are outside the sales_rep path
 *   allowlist today → ROLE RESTRICTED for sales_rep, surfaced honestly rather than hidden.
 */
import { ADMIN_DASHBOARD_ROUTES } from "./adminDashboardRoutes";
import { buildConciergeInventoryHref } from "./conciergeIntent";
import type { SalesWorkspaceActorType } from "./businessWorkspaceAccess";
import type { SalesWorkspaceCapability, SalesWorkspaceRole } from "./salesWorkspaceCapabilities";

export type StaffOsLink = {
  key: string;
  href: string;
  label: string;
  hint?: string;
  /** Rendered with the primary button style. */
  primary?: boolean;
};

/** A tool this actor cannot use — listed truthfully so the home never silently hides a capability. */
export type StaffOsRestricted = {
  key: string;
  label: string;
  reason: string;
};

export type StaffOsGroupKey = "clientWork" | "commercial" | "customerCommunication" | "myLeonix";

export type StaffOperatingSystem = Record<StaffOsGroupKey, StaffOsLink[]> & {
  restricted: StaffOsRestricted[];
  /** Human label for the signed-in persona, derived only from the strict actor. */
  personaLabel: string;
};

export type StaffOsActorView = {
  role: SalesWorkspaceRole;
  actorType: SalesWorkspaceActorType;
  capabilities: ReadonlySet<SalesWorkspaceCapability>;
  /** adminAccessControl.hasPaymentTrackerAccess(legacyCtx) — resolved by the caller. */
  paymentTrackerAccess: boolean;
};

export const STAFF_OS_ROUTES = {
  staffHome: "/admin/businesses",
  createForClient: "/admin/businesses/create-for-client",
  createBusinessProfile: "/admin/businesses/canvass?intent=business_profile",
  addProspect: "/admin/businesses/canvass",
  fieldAgent: "/admin/field",
  leonixManaged: "/admin/businesses/managed",
  teamHome: ADMIN_DASHBOARD_ROUTES.team,
  teamClients: "/admin/team/clients",
  teamPromoCodes: "/admin/team/promo-codes",
  teamSalesTracker: "/admin/team/sales-tracker",
  workspaceSalesTracker: "/admin/workspace/sales-tracker",
  manualPayment: `${ADMIN_DASHBOARD_ROUTES.paymentTracker}/manual-payment`,
  myProfile: "/admin/team/my-profile",
  presence: "/admin/digital-contact/presence",
  doorbell: "/admin/digital-contact/doorbell",
  visitanos: "/visitanos",
  guide: "/admin/guide",
  support: ADMIN_DASHBOARD_ROUTES.support,
  commandCenter: "/admin",
  executiveHub: "/admin/team/executive-hub",
} as const;

export function staffOsPersonaLabel(view: Pick<StaffOsActorView, "role" | "actorType">): string {
  if (view.actorType === "owner_bootstrap") return "Dueño (acceso de emergencia) / Owner (bootstrap access)";
  switch (view.role) {
    case "super_admin":
      return "Dueño / Owner Admin";
    case "sales_manager":
      return "Gerente de Ventas / Sales Manager";
    case "sales_rep":
    default:
      return "Representante de Ventas / Sales Rep";
  }
}

export function composeStaffOperatingSystem(view: StaffOsActorView): StaffOperatingSystem {
  const isRep = view.role === "sales_rep";
  const isOwner = view.role === "super_admin";
  const isRealStaff = view.actorType === "staff";
  const has = (c: SalesWorkspaceCapability) => view.capabilities.has(c);
  const restricted: StaffOsRestricted[] = [];

  // ---------------------------------------------------------------- CLIENT WORK
  // P0 Sales Ad Creation Flow (Gate 2) — SELECT BUSINESS → CREATE AD → CHOOSE CATEGORY →
  // APPLICATION. Carries the create_listing intent through the inventory (existing mechanism,
  // conciergeIntent.ts) so tapping a business row lands directly on
  // create-for-client?businessId=X — WHO is already resolved, no second search step inside the
  // launcher itself. Reuses the exact same resolver every other Quick Action already uses.
  const clientWork: StaffOsLink[] = [
    {
      key: "create_for_client",
      href: buildConciergeInventoryHref("create_listing"),
      label: "Crear anuncio / Create Ad",
      hint: "Elige un negocio y abre la aplicación real de la categoría. / Pick a business and open the real category application.",
      primary: true,
    },
  ];
  if (has("manage_business_profile") && has("conduct_canvassing")) {
    clientWork.push({
      key: "create_business_profile",
      href: STAFF_OS_ROUTES.createBusinessProfile,
      label: "Crear Perfil de Negocio / Create Business Profile",
      hint: "Prospecto nuevo. Para uno existente, use Buscar negocio. / New prospect. For an existing one, use Find business.",
      primary: true,
    });
  }
  // "Find business" (#businesses-inventory), "Add prospect" (/admin/businesses/canvass) and
  // "Field Agent" (/admin/field) are rendered literally by the home itself: every Sales
  // Workspace role holds conduct_canvassing + view_field_discovery, and existing gates pin those
  // literal hrefs — so they are deliberately NOT composed here.
  if (has("view_field_discovery")) {
    clientWork.push({
      key: "research",
      href: buildConciergeInventoryHref("research"),
      label: "Investigar / Research",
      hint: has("run_ai_research")
        ? "Busque y luego investigue. / Search, then research."
        : "Busque; fuentes y archivos. La investigación IA la ejecuta un gerente. / Search; sources & files. A manager runs AI research.",
    });
  }
  if (has("view_creative_studio")) {
    clientWork.push({
      key: "creative_studio",
      href: buildConciergeInventoryHref("creative_studio"),
      label: "Estudio Creativo / Creative Studio",
      hint: has("create_creative_job") ? "Busque y luego cree. / Search, then create." : "Busque y suba activos. Crear un trabajo es de gerente. / Search, upload assets. Creating a job is manager+.",
    });
  }
  if (has("view_business_profile")) {
    clientWork.push({
      key: "leonix_managed",
      href: STAFF_OS_ROUTES.leonixManaged,
      label: "Gestionado por Leonix / Leonix Managed",
      hint: "Borradores, esperando pago, listo, publicado, reclamo pendiente. / Drafts, awaiting payment, ready, published, claim pending.",
    });
  }

  // ---------------------------------------------------------------- COMMERCIAL
  const commercial: StaffOsLink[] = [
    {
      key: "promo_codes",
      href: isRep ? STAFF_OS_ROUTES.teamPromoCodes : ADMIN_DASHBOARD_ROUTES.promoCodes,
      label: "Código promo / Promo code",
      hint: isRep ? "Códigos ligados a su ID de representante. / Codes tied to your sales rep ID." : undefined,
    },
    {
      key: "sales_tracker",
      href: isRep ? STAFF_OS_ROUTES.teamSalesTracker : STAFF_OS_ROUTES.workspaceSalesTracker,
      label: "Rastreador de ventas / Sales tracker",
    },
    { key: "my_clients", href: STAFF_OS_ROUTES.teamClients, label: "Mis clientes / My clients" },
  ];
  if (isRep) {
    restricted.push({
      key: "package_entitlements",
      label: "Paquetes / Package entitlements",
      reason: "Gerente o dueño. Pida a su gerente que registre el paquete. / Manager or owner. Ask your manager to record the package.",
    });
  } else {
    commercial.push({ key: "package_entitlements", href: ADMIN_DASHBOARD_ROUTES.packageEntitlements, label: "Paquetes / Package entitlements" });
  }
  if (!isRep && view.paymentTrackerAccess) {
    commercial.push({ key: "payment_tracker", href: ADMIN_DASHBOARD_ROUTES.paymentTracker, label: "Rastreador de pagos / Payment tracker" });
  } else {
    restricted.push({
      key: "payment_tracker",
      label: "Rastreador de pagos / Payment tracker",
      reason: isRep
        ? "Gerente o dueño. / Manager or owner."
        : "Requiere el permiso can_view_payments en su fila del roster. / Requires the can_view_payments roster permission.",
    });
  }
  if (isOwner && isRealStaff && view.paymentTrackerAccess) {
    commercial.push({
      key: "manual_payment",
      href: STAFF_OS_ROUTES.manualPayment,
      label: "Pago manual (efectivo/Zelle/cheque) / Manual payment (cash/Zelle/check)",
      hint: "Queda pendiente de verificación hasta que el dinero se confirme. / Stays pending verification until the money is confirmed.",
    });
  } else {
    restricted.push({
      key: "manual_payment",
      label: "Pago manual / Manual payment",
      reason: isOwner && !isRealStaff
        ? "Inicie sesión con su acceso de personal (no el de emergencia). / Sign in with your staff login (not bootstrap)."
        : "Solo el dueño (super_admin) registra pagos fuera de línea. / Only the owner (super_admin) records offline payments.",
    });
  }
  if (has("view_business_profile")) {
    commercial.push({
      key: "managed_awaiting_payment",
      href: `${STAFF_OS_ROUTES.leonixManaged}?filter=not_eligible`,
      label: "Perfiles esperando pago / Profiles awaiting payment",
    });
  }

  // ---------------------------------------------------------------- CUSTOMER COMMUNICATION
  const customerCommunication: StaffOsLink[] = [
    {
      key: "find_client",
      href: isRep ? STAFF_OS_ROUTES.teamClients : ADMIN_DASHBOARD_ROUTES.customerOps,
      label: "Buscar cliente / Find client",
      hint: isRep ? "Clientes ligados a sus códigos promo. / Clients linked to your promo codes." : "Búsqueda unificada de registros. / Unified record search.",
    },
  ];
  if (has("create_internal_note")) {
    customerCommunication.push({ key: "note", href: buildConciergeInventoryHref("note"), label: "Agregar nota / Add note", hint: "Busque y luego agregue una nota. / Search, then add a note." });
  }
  if (has("create_follow_up")) {
    customerCommunication.push({ key: "follow_up", href: buildConciergeInventoryHref("follow_up"), label: "Crear seguimiento / Create follow-up", hint: "Busque y luego programe. / Search, then schedule." });
  }
  if (has("view_meeting_studio")) {
    customerCommunication.push({ key: "meeting", href: buildConciergeInventoryHref("meeting"), label: "Iniciar reunión / Start meeting", hint: "Busque y luego inicie. / Search, then start." });
  }
  if (isRep) {
    restricted.push(
      { key: "doorbell", label: "Recepción Virtual / Virtual Front Desk", reason: "Fuera de las rutas permitidas para representantes hoy. / Outside the sales_rep allowed paths today." },
      { key: "presence", label: "Disponibilidad / Availability", reason: "Fuera de las rutas permitidas para representantes hoy. / Outside the sales_rep allowed paths today." },
    );
  } else {
    customerCommunication.push(
      { key: "doorbell", href: STAFF_OS_ROUTES.doorbell, label: "Recepción Virtual / Virtual Front Desk", hint: "Active avisos de visitantes en este dispositivo. / Enroll this device for visitor call alerts." },
      { key: "presence", href: STAFF_OS_ROUTES.presence, label: "Disponibilidad / Availability", hint: "DISPONIBLE / OCUPADO / AUSENTE con vencimiento. / AVAILABLE / BUSY / AWAY, always expiring." },
    );
  }
  customerCommunication.push({ key: "visitanos", href: STAFF_OS_ROUTES.visitanos, label: "Ver página de visitantes / View visitor page", hint: "Lo que ve un visitante en /visitanos. / What a visitor sees at /visitanos." });

  // ---------------------------------------------------------------- MY LEONIX
  const myLeonix: StaffOsLink[] = [
    { key: "my_profile", href: STAFF_OS_ROUTES.myProfile, label: "Mi perfil / My Profile", hint: "Su página pública de contacto (/contact/su-slug). / Your public contact page (/contact/your-slug)." },
    { key: "team_home", href: STAFF_OS_ROUTES.teamHome, label: "Inicio del personal / Staff Home" },
    { key: "guide", href: STAFF_OS_ROUTES.guide, label: "Ayuda / Help (Admin Guide)" },
    { key: "support", href: STAFF_OS_ROUTES.support, label: "Soporte / Support" },
  ];
  if (!isRep) {
    myLeonix.push({ key: "command_center", href: STAFF_OS_ROUTES.commandCenter, label: "Centro de Comando / Command Center" });
  }
  if (isOwner) {
    myLeonix.push(
      { key: "team_roster", href: ADMIN_DASHBOARD_ROUTES.teamRoster, label: "Roster del equipo / Team roster" },
      { key: "create_staff_login", href: ADMIN_DASHBOARD_ROUTES.createStaffUser, label: "Crear acceso de personal / Create staff login" },
      { key: "executive_hub", href: STAFF_OS_ROUTES.executiveHub, label: "Executive Hub" },
    );
  }

  return { clientWork, commercial, customerCommunication, myLeonix, restricted, personaLabel: staffOsPersonaLabel(view) };
}

/** Every href the composed home can emit for a role — used by the verifier to prove reachability. */
export function staffOperatingSystemHrefs(os: StaffOperatingSystem): string[] {
  return [...os.clientWork, ...os.commercial, ...os.customerCommunication, ...os.myLeonix].map((l) => l.href);
}
