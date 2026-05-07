import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { requireAdminCookie, getAdminSupabase } from "@/app/lib/supabase/server";
import { auditAdminWrite } from "@/app/admin/_lib/auditAdminWrite";
import { getSupabaseAuthUsersDashboardUrl } from "@/app/admin/_lib/supabaseDashboardLinks";
import AdminUserActions from "../AdminUserActions";
import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import { adminBtnDark, adminBtnSecondary, adminCardBase } from "../../../_components/adminTheme";
import { fetchAdminUserAdsForUser } from "../../../_lib/adminUserAds";
import { adminEditSupportStatusLabelEs, resolveAdminAdActions } from "../../../_lib/adminAdEditSupportMap";

type ProfileRow = {
  id: string;
  created_at: string | null;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  account_type: string | null;
  membership_tier: string | null;
  home_city: string | null;
  owned_city_slug: string | null;
  newsletter_opt_in: boolean | null;
  is_disabled: boolean | null;
};

type ReportMini = {
  id: string;
  listing_id: string;
  status: string;
  reason: string;
  created_at: string;
};

type TiendaOrderMini = {
  id: string;
  order_ref: string;
  status: string;
  created_at: string;
};

const ALLOWED_ACCOUNT_TYPES = ["personal", "business"] as const;
const PERSONAL_TIERS = ["gratis", "pro"] as const;
const BUSINESS_TIERS = ["business_lite", "business_premium"] as const;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(id: string): boolean {
  return typeof id === "string" && UUID_REGEX.test(id.trim());
}

function accountRefFromId(id: string): string {
  const s = (id ?? "").replace(/-/g, "").trim();
  if (s.length < 8) return "—";
  return `${s.slice(0, 4).toUpperCase()}-${s.slice(-4).toUpperCase()}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return Number.isFinite(d.getTime())
      ? d.toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" })
      : "—";
  } catch {
    return "—";
  }
}

function displayName(row: ProfileRow): string {
  return (row.display_name ?? "").trim() || "(sin nombre)";
}

function membershipTierLabel(tier: string | null): string {
  const t = (tier ?? "").trim().toLowerCase();
  if (t === "gratis") return "Gratis";
  if (t === "pro") return "Pro";
  if (t === "business_lite") return "Standard";
  if (t === "business_premium") return "Plus";
  return t || "Gratis";
}

function accountTypeLabel(accountType: string | null): string {
  const a = (accountType ?? "").trim().toLowerCase();
  if (a === "personal") return "Personal";
  if (a === "business") return "Business";
  return a || "—";
}

function newsletterStatus(optIn: boolean | null): string {
  return optIn === true ? "Suscrito" : "No suscrito";
}

function isPersonalTier(tier: string): boolean {
  return PERSONAL_TIERS.includes(tier as (typeof PERSONAL_TIERS)[number]);
}

function isBusinessTier(tier: string): boolean {
  return BUSINESS_TIERS.includes(tier as (typeof BUSINESS_TIERS)[number]);
}

async function updateClientAccountAction(formData: FormData) {
  "use server";

  const cookieStore = await cookies();
  if (!requireAdminCookie(cookieStore)) {
    redirect("/admin/login");
  }

  const clientId = (formData.get("clientId") ?? "").toString().trim();
  if (!clientId || !isValidUuid(clientId)) {
    redirect("/admin/usuarios");
  }

  const rawAccountType = (formData.get("account_type") ?? "").toString().trim().toLowerCase();
  const rawMembershipTier = (formData.get("membership_tier") ?? "").toString().trim().toLowerCase();

  if (!ALLOWED_ACCOUNT_TYPES.includes(rawAccountType as (typeof ALLOWED_ACCOUNT_TYPES)[number])) {
    redirect(`/admin/usuarios/${clientId}?error=invalid-account-type`);
  }

  if (rawAccountType === "personal") {
    if (!isPersonalTier(rawMembershipTier)) {
      redirect(`/admin/usuarios/${clientId}?error=membership-mismatch`);
    }
  } else if (rawAccountType === "business") {
    if (!isBusinessTier(rawMembershipTier)) {
      redirect(`/admin/usuarios/${clientId}?error=membership-mismatch`);
    }
  } else {
    redirect(`/admin/usuarios/${clientId}?error=invalid-account-type`);
  }

  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("profiles")
    .update({
      account_type: rawAccountType,
      membership_tier: rawMembershipTier,
    })
    .eq("id", clientId);

  if (error) {
    redirect(`/admin/usuarios/${clientId}?error=update-failed`);
  }

  auditAdminWrite("client_account_updated", "profiles", clientId, {
    account_type: rawAccountType,
    membership_tier: rawMembershipTier,
  });
  revalidatePath(`/admin/usuarios/${clientId}`);
  revalidatePath("/admin/usuarios");
  redirect(`/admin/usuarios/${clientId}?updated=1`);
}

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

// Language-aware labels
const labels = {
  en: {
    pageTitle: "Admin User Detail",
    pageSubtitle: "Administrative account view — Leonix operations.",
    eyebrow: "Account",
    backToUsers: "← Back to users",
    dashboard: "Dashboard",
    idLabel: "ID",
    changesSaved: "Changes saved successfully.",
    statusAndAccess: "Status & Access",
    accountActive: "Account active",
    accountDisabled: "Account disabled",
    summary: "Summary",
    type: "Type",
    membership: "Membership",
    newsletter: "Newsletter",
    city: "City",
    created: "Created",
    contact: "Contact",
    email: "Email",
    phone: "Phone",
    manageAccount: "Admin Account",
    accountOverride: "Administrative override. Account type and membership only.",
    saveHint: "Saves to profiles (type and membership). Does not change password or Auth.",
    accountType: "Account Type",
    membershipLabel: "Membership",
    saveTypeAndMembership: "Save type and membership",
    authAndPassword: "Auth & Password",
    enableDisableInfo: "Enable/disable account: use the button above in this card (real action in profiles).",
    passwordResetInfo: "Password reset or magic link: not generated from Leonix admin for security. Open Supabase Auth and locate the user by email.",
    openSupabaseAuth: "Open Supabase Auth (users) ↗",
    configureSupabase: "Configure NEXT_PUBLIC_SUPABASE_URL to link to project.",
    viewAsUser: "\"View as user\" replica: not available — no impersonation from this panel.",
    crossOperations: "Cross Operations",
    unifiedSearch: "Unified search (account + ads + print orders):",
    openCustomerOps: "Open Customer ops with this UUID →",
    searchByEmail: "By email:",
    searchByPhone: "By phone:",
    searchBy: "Search «{query}» →",
    adsCommandCenter: "Ads Command Center",
    allSourcesInfo: "All supported sources for this account (same owner in each table). Traceability IDs for support and moderation.",
    editOnBehalfInfo: "Edit on behalf of client: Leonix does not impersonate sessions. \"Manage\" opens staff queue (same row, no duplication). \"Edit as admin\" would only appear if TRUE_EDIT flow existed documented; the advertiser panel requires their login.",
    ownerUserId: "Owner user id:",
    noAds: "No ads in connected sources for this user.",
    totalAds: "Total: {count} ad(s)",
    noneInSource: "None in this source.",
    supportEdit: "Edit support:",
    publicView: "Public view",
    manageAdmin: "Manage (admin)",
    editAsAdmin: "Edit as admin",
    advertiserPanel: "Advertiser panel",
    tiendaOrders: "Tienda — Orders (customer_user_id)",
    tiendaOrdersInfo: "Count and preview from tienda_orders.",
    inboxFiltered: "Inbox filtered →",
    orders: "order(s)",
    noOrders: "No orders linked to this account.",
    viewOrder: "View order",
    reports: "Reports (moderation)",
    globalQueue: "Global queue:",
    reportsQueue: "/admin/reportes →",
    sentByUser: "Sent by this user",
    none: "None",
    reportListing: "Listing",
    openReportQueue: "Open in reports queue",
    viewAd: "View ad",
    pendingOnOwned: "Pending on owned ads",
    nonePending: "None pending.",
    viewReport: "View report",
    clasificadosQueue: "Clasificados Queue",
    report: "Report",
  },
  es: {
    pageTitle: "Detalle de Usuario Admin",
    pageSubtitle: "Vista administrativa de cuenta — operaciones Leonix.",
    eyebrow: "Cuenta",
    backToUsers: "← Volver a clientes",
    dashboard: "Dashboard",
    idLabel: "ID",
    changesSaved: "Cambios guardados correctamente.",
    statusAndAccess: "Estado y acceso",
    accountActive: "Cuenta activa",
    accountDisabled: "Cuenta deshabilitada",
    summary: "Resumen",
    type: "Tipo",
    membership: "Membresía",
    newsletter: "Newsletter",
    city: "Ciudad",
    created: "Creado",
    contact: "Contacto",
    email: "Correo",
    phone: "Teléfono",
    manageAccount: "Administrar cuenta",
    accountOverride: "Sobrescritura administrativa. Solo tipo de cuenta y membresía.",
    saveHint: "Guarda en profiles (tipo y membresía). No cambia contraseña ni Auth.",
    accountType: "Tipo de cuenta",
    membershipLabel: "Membresía",
    saveTypeAndMembership: "Guardar tipo y membresía",
    authAndPassword: "Auth y contraseña",
    enableDisableInfo: "Habilitar / deshabilitar la cuenta: usa el botón arriba en esta ficha (acción real en profiles).",
    passwordResetInfo: "Recuperación de contraseña o magic link: no se generan desde Leonix admin por seguridad. Abre Supabase Auth y localiza al usuario por email.",
    openSupabaseAuth: "Abrir Supabase Auth (usuarios) ↗",
    configureSupabase: "Configura NEXT_PUBLIC_SUPABASE_URL para enlazar al proyecto.",
    viewAsUser: "Réplica \"ver como el usuario\": no disponible — no hay suplantación desde este panel.",
    crossOperations: "Operaciones cruzadas",
    unifiedSearch: "Búsqueda unificada (cuenta + anuncios + pedidos impresión):",
    openCustomerOps: "Abrir Customer ops con este UUID →",
    searchByEmail: "Por correo:",
    searchByPhone: "Por teléfono:",
    searchBy: "Buscar «{query}» →",
    adsCommandCenter: "Anuncios — centro de comando",
    allSourcesInfo: "Todas las fuentes soportadas para esta cuenta (mismo owner en cada tabla). IDs de trazabilidad para soporte y moderación.",
    editOnBehalfInfo: "Edición en nombre del cliente: Leonix no suplanta sesión. «Gestionar» abre la cola staff (misma fila, sin duplicar). «Editar como admin» solo aparecería si existiera flujo TRUE_EDIT documentado; el panel del anunciante requiere su inicio de sesión.",
    ownerUserId: "Owner user id:",
    noAds: "Sin anuncios en fuentes conectadas para este usuario.",
    totalAds: "Total: {count} anuncio(s)",
    noneInSource: "Ninguno en esta fuente.",
    supportEdit: "Soporte edición:",
    publicView: "Ver público",
    manageAdmin: "Gestionar (admin)",
    editAsAdmin: "Editar como admin",
    advertiserPanel: "Panel del anunciante",
    tiendaOrders: "Tienda — pedidos (customer_user_id)",
    tiendaOrdersInfo: "Conteo y vista previa desde tienda_orders.",
    inboxFiltered: "Inbox filtrado →",
    orders: "pedido(s)",
    noOrders: "Sin pedidos ligados a esta cuenta.",
    viewOrder: "Ver pedido",
    reports: "Reportes (moderación)",
    globalQueue: "Cola global:",
    reportsQueue: "/admin/reportes →",
    sentByUser: "Enviados por este usuario",
    none: "Ninguno.",
    reportListing: "Listing",
    openReportQueue: "Abrir en cola de reportes",
    viewAd: "Ver anuncio",
    pendingOnOwned: "Pendientes sobre anuncios de su propiedad",
    nonePending: "Ninguno pendiente.",
    viewReport: "Ver reporte",
    clasificadosQueue: "Cola Clasificados",
    report: "Reporte",
  },
};

function getLabels(lang: 'en' | 'es' = 'en') {
  return labels[lang];
}

export default async function AdminUsuarioDetailPage(props: PageProps) {
  const cookieStore = await cookies();
  if (!requireAdminCookie(cookieStore)) {
    redirect("/admin/login");
  }

  const params = await props.params;
  const clientId = typeof params?.id === "string" ? params.id.trim() : "";

  if (!clientId || !isValidUuid(clientId)) {
    redirect("/admin/usuarios");
  }

  // Get language preference from search params, default to 'en'
  const searchParams = props.searchParams ? await props.searchParams : {};
  const langParam = typeof searchParams.lang === "string" && (searchParams.lang === "es" || searchParams.lang === "en") 
    ? searchParams.lang as "en" | "es" 
    : "en";
  const t = getLabels(langParam);

  const authUsersDashboardUrl = getSupabaseAuthUsersDashboardUrl();

  const updated = searchParams.updated;
  const errorParam = searchParams.error;
  const isUpdated = updated === "1" || (Array.isArray(updated) && updated.includes("1"));
  const errorValue =
    typeof errorParam === "string" ? errorParam : Array.isArray(errorParam) ? errorParam[0] : undefined;

  let row: ProfileRow | null = null;
  let queryError: string | null = null;

  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id,created_at,display_name,email,phone,account_type,membership_tier,home_city,owned_city_slug,newsletter_opt_in,is_disabled"
      )
      .eq("id", clientId)
      .maybeSingle();

    if (error) {
      queryError = error.message;
    } else if (data) {
      row = data as ProfileRow;
    }
  } catch (e) {
    queryError = e instanceof Error ? e.message : "Error al cargar cliente.";
  }

  if (queryError) {
    return (
      <div className="max-w-4xl">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">{queryError}</div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/admin/usuarios" className={adminBtnSecondary}>
            ← Volver a clientes
          </Link>
          <Link href="/admin" className={adminBtnDark}>
            Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!row) {
    notFound();
  }

  const ownerHints = {
    ownerUserId: clientId,
    ownerName: row.display_name,
    ownerEmail: row.email,
    ownerPhone: row.phone,
  };
  const adsBundle = await fetchAdminUserAdsForUser(clientId, ownerHints);
  const ownedIds =
    adsBundle.groups.find((g) => g.source === "generic")?.ads.map((a) => a.internalId).filter(Boolean) ?? [];

  let tiendaOrderCount: number | null = null;
  let tiendaOrdersPreview: TiendaOrderMini[] = [];
  let reportsByReporter: ReportMini[] = [];
  let reportsOnOwnedPending: ReportMini[] = [];
  let crossEntityError: string | null = null;

  try {
    const supabase = getAdminSupabase();
    const { count: toc } = await supabase
      .from("tienda_orders")
      .select("id", { count: "exact", head: true })
      .eq("customer_user_id", clientId);
    tiendaOrderCount = typeof toc === "number" ? toc : 0;

    const { data: trows, error: te } = await supabase
      .from("tienda_orders")
      .select("id,order_ref,status,created_at")
      .eq("customer_user_id", clientId)
      .order("created_at", { ascending: false })
      .limit(6);
    if (!te && trows) {
      tiendaOrdersPreview = trows as TiendaOrderMini[];
    }

    const { data: rRep, error: re1 } = await supabase
      .from("listing_reports")
      .select("id,listing_id,status,reason,created_at")
      .eq("reporter_id", clientId)
      .order("created_at", { ascending: false })
      .limit(12);
    if (!re1 && rRep) {
      reportsByReporter = rRep as ReportMini[];
    }

    if (ownedIds.length > 0) {
      const { data: rOwn, error: re2 } = await supabase
        .from("listing_reports")
        .select("id,listing_id,status,reason,created_at")
        .in("listing_id", ownedIds)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(12);
      if (!re2 && rOwn) {
        reportsOnOwnedPending = rOwn as ReportMini[];
      }
    }
  } catch {
    crossEntityError = "No se pudieron cargar pedidos Tienda o reportes.";
  }

  const name = displayName(row);
  const emailRaw = (row.email ?? "").trim();
  const emailDisplay = emailRaw || "(sin correo)";
  const hasEmail = emailRaw.length > 0;
  const phoneRaw = (row.phone ?? "").trim();
  const phoneDisplay = phoneRaw || "—";
  const hasPhone = phoneRaw.length > 0;

  const currentAccountType = (row.account_type ?? "").trim().toLowerCase();
  const currentMembershipTier = (row.membership_tier ?? "").trim().toLowerCase();
  const selectedAccountType = ALLOWED_ACCOUNT_TYPES.includes(
    currentAccountType as (typeof ALLOWED_ACCOUNT_TYPES)[number]
  )
    ? currentAccountType
    : "personal";

  const isPersonal = selectedAccountType === "personal";
  const allowedTiers: readonly string[] = isPersonal ? PERSONAL_TIERS : BUSINESS_TIERS;
  const selectedMembershipTier = allowedTiers.includes(currentMembershipTier)
    ? currentMembershipTier
    : (allowedTiers[0] as string);

  const errorMessage =
    errorValue === "invalid-account-type"
      ? "Tipo de cuenta no válido."
      : errorValue === "invalid-membership"
        ? "Membresía no válida."
        : errorValue === "membership-mismatch"
          ? "La membresía no corresponde al tipo de cuenta. Elige una opción válida para el tipo seleccionado."
          : errorValue === "update-failed"
            ? "No se pudo guardar. Intenta de nuevo."
            : errorValue
              ? "Error al actualizar."
              : null;

  const inputClass =
    "w-full rounded-xl border border-[#E8DFD0] bg-white px-4 py-2.5 text-[#1E1810] focus:border-[#C9B46A] focus:outline-none focus:ring-2 focus:ring-[#D4BC6A]/50";

  return (
    <>
      <AdminPageHeader
        title={name}
        subtitle={t.pageSubtitle}
        eyebrow={`${t.eyebrow} #${accountRefFromId(row.id)}`}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/admin/usuarios" className={adminBtnSecondary} title={t.backToUsers}>
          {t.backToUsers}
        </Link>
        <Link href="/admin" className={adminBtnDark} title={t.dashboard}>
          {t.dashboard}
        </Link>
        
        {/* Language Toggle */}
        <div className="ml-auto flex items-center gap-1 rounded-lg border border-[#E8DFD0] bg-[#FFFCF7] p-1">
          <Link
            href={`/admin/usuarios/${row.id}?lang=en`}
            className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
              langParam === "en" 
                ? "bg-[#C9B46A] text-white" 
                : "text-[#5C5346] hover:bg-[#E8DFD0]"
            }`}
          >
            EN
          </Link>
          <Link
            href={`/admin/usuarios/${row.id}?lang=es`}
            className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
              langParam === "es" 
                ? "bg-[#C9B46A] text-white" 
                : "text-[#5C5346] hover:bg-[#E8DFD0]"
            }`}
          >
            ES
          </Link>
        </div>
      </div>

      <p className="mb-6 font-mono text-xs text-[#7A7164] break-all">{t.idLabel}: {row.id}</p>

      {isUpdated && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {t.changesSaved}
        </div>
      )}
      {errorMessage && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>
      )}

      <div className={`${adminCardBase} mb-6 p-5`}>
        <h2 className="text-lg font-bold text-[#1E1810]">{t.statusAndAccess}</h2>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-[#FBF7EF] px-3 py-1 text-xs font-bold text-[#5C4E2E]">
            {row.is_disabled === true ? t.accountDisabled : t.accountActive}
          </span>
          <AdminUserActions userId={row.id} disabled={row.is_disabled} as="div" />
        </div>
      </div>

      <div className={`${adminCardBase} mb-6 p-5`}>
        <h2 className="text-lg font-bold text-[#1E1810]">{t.summary}</h2>
        <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-[#7A7164]">{t.type}</dt>
            <dd className="font-medium text-[#1E1810]">{accountTypeLabel(row.account_type)}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#7A7164]">{t.membership}</dt>
            <dd className="font-medium text-[#1E1810]">{membershipTierLabel(row.membership_tier)}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#7A7164]">{t.newsletter}</dt>
            <dd className="font-medium text-[#1E1810]">{newsletterStatus(row.newsletter_opt_in)}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#7A7164]">{t.city}</dt>
            <dd className="font-medium text-[#1E1810]">{row.home_city ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#7A7164]">{t.created}</dt>
            <dd className="font-medium text-[#1E1810]">{formatDate(row.created_at)}</dd>
          </div>
        </dl>
      </div>

      <div className={`${adminCardBase} mb-6 p-5`}>
        <h2 className="text-lg font-bold text-[#1E1810]">{t.contact}</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div>
            <dt className="text-xs text-[#7A7164]">{t.email}</dt>
            <dd>
              {hasEmail ? (
                <a href={`mailto:${emailRaw}`} className="font-semibold text-[#6B5B2E] underline">
                  {emailDisplay}
                </a>
              ) : (
                emailDisplay
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[#7A7164]">{t.phone}</dt>
            <dd>
              {hasPhone ? (
                <a href={`tel:${phoneRaw}`} className="font-semibold text-[#6B5B2E] underline">
                  {phoneDisplay}
                </a>
              ) : (
                phoneDisplay
              )}
            </dd>
          </div>
        </dl>
      </div>

      <div className={`${adminCardBase} mb-6 p-5`}>
        <h2 className="text-lg font-bold text-[#1E1810]">{t.manageAccount}</h2>
        <p className="mt-1 text-sm text-[#5C5346]/90">
          {t.accountOverride}
        </p>
        <form action={updateClientAccountAction} className="mt-4 space-y-4" aria-describedby="account-save-hint">
          <input type="hidden" name="clientId" value={row.id} />
          <p id="account-save-hint" className="text-[10px] text-[#7A7164]">
            {t.saveHint}
          </p>
          <div>
            <label htmlFor="account_type" className="mb-1 block text-sm text-[#5C5346]">
              {t.accountType}
            </label>
            <select id="account_type" name="account_type" defaultValue={selectedAccountType} className={inputClass}>
              <option value="personal">Personal</option>
              <option value="business">Business</option>
            </select>
          </div>
          <div>
            <label htmlFor="membership_tier" className="mb-1 block text-sm text-[#5C5346]">
              {t.membershipLabel}
            </label>
            <select id="membership_tier" name="membership_tier" defaultValue={selectedMembershipTier} className={inputClass}>
              {isPersonal ? (
                <>
                  <option value="gratis">Gratis</option>
                  <option value="pro">Pro</option>
                </>
              ) : (
                <>
                  <option value="business_lite">Standard</option>
                  <option value="business_premium">Plus</option>
                </>
              )}
            </select>
          </div>
          <button
            type="submit"
            className={`${adminBtnDark} w-full sm:w-auto`}
            title="Persist account type and membership in Supabase (with audit)"
          >
            {t.saveTypeAndMembership}
          </button>
        </form>
      </div>

      <div className={`${adminCardBase} mb-6 p-5`}>
        <h2 className="text-lg font-bold text-[#1E1810]">{t.authAndPassword}</h2>
        <p className="mt-1 text-sm text-[#5C5346]/90">
          <strong className="text-[#1E1810]">{t.enableDisableInfo}</strong>
        </p>
        <p className="mt-2 text-sm text-[#5C5346]/90">
          <strong className="text-[#1E1810]">{t.passwordResetInfo}</strong>
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {authUsersDashboardUrl ? (
            <a
              href={authUsersDashboardUrl}
              target="_blank"
              rel="noreferrer"
              className={`${adminBtnSecondary} inline-flex min-h-[44px] justify-center sm:min-h-0`}
            >
              {t.openSupabaseAuth}
            </a>
          ) : (
            <p className="text-xs text-[#9A9084]">{t.configureSupabase}</p>
          )}
        </div>
        <p className="mt-3 text-xs text-[#7A7164]">
          {t.viewAsUser}
        </p>
      </div>

      <div className={`${adminCardBase} mb-6 p-5`}>
        <h2 className="text-lg font-bold text-[#1E1810]">{t.crossOperations}</h2>
        <p className="mt-1 text-xs text-[#7A7164]">
          {t.unifiedSearch}{" "}
          <Link
            href={`/admin/ops?q=${encodeURIComponent(row.id)}`}
            className="font-bold text-[#6B5B2E] underline"
            title="Unified search: profile, ads, Tienda orders and reports with this identifier"
          >
            {t.openCustomerOps}
          </Link>
        </p>
        {hasEmail ? (
          <p className="mt-2 text-xs text-[#7A7164]">
            {t.searchByEmail}{" "}
            <Link href={`/admin/ops?q=${encodeURIComponent(emailRaw)}`} className="font-bold text-[#6B5B2E] underline">
              {t.searchBy.replace('{query}', emailRaw)}
            </Link>
          </p>
        ) : null}
        {hasPhone ? (
          <p className="mt-1 text-xs text-[#7A7164]">
            {t.searchByPhone}{" "}
            <Link href={`/admin/ops?q=${encodeURIComponent(phoneRaw)}`} className="font-bold text-[#6B5B2E] underline">
              {t.searchBy.replace('{query}', phoneRaw)}
            </Link>
          </p>
        ) : null}
      </div>

      <div className={`${adminCardBase} mb-6 p-5 border-2 border-[#C9B46A] bg-[#FFFCF7]`}>
        <h2 className="text-xl font-bold text-[#1E1810]">{t.adsCommandCenter}</h2>
        <p className="mt-1 text-xs text-[#7A7164]">
          {t.allSourcesInfo}
        </p>
        <p className="mt-2 text-[10px] leading-snug text-[#7A7164]">
          <span className="font-semibold text-[#5C5346]">{t.editOnBehalfInfo}</span>
        </p>
        <p className="mt-2 font-mono text-[10px] text-[#9A9084] break-all">{t.ownerUserId} {row.id}</p>
        {adsBundle.totalAds === 0 ? (
          <p className="mt-4 text-sm text-[#5C5346]">{t.noAds}</p>
        ) : (
          <p className="mt-2 text-sm font-semibold text-[#1E1810]">{t.totalAds.replace('{count}', adsBundle.totalAds.toString())}</p>
        )}
        <div className="mt-4 space-y-6">
          {adsBundle.groups.map((g) => (
            <div key={g.source}>
              <h3 className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">
                {g.labelEs} — {g.ads.length}
                {g.loadStatus === "error" ? (
                  <span className="ml-2 normal-case font-semibold text-red-700">(error al cargar)</span>
                ) : null}
              </h3>
              {g.loadStatus === "error" && g.errorMessage ? (
                <p className="mt-1 text-xs text-red-700">{g.errorMessage}</p>
              ) : null}
              {g.ads.length === 0 && g.loadStatus === "ok" ? (
                <p className="mt-1 text-sm text-[#5C5346]/90">{t.noneInSource}</p>
              ) : (
                <ul className="mt-2 space-y-3">
                  {g.ads.map((ad) => {
                    const actions = resolveAdminAdActions(ad);
                    return (
                      <li key={`${ad.source}-${ad.internalId}`} className="rounded-2xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/90 p-3 text-sm">
                        <p className="font-semibold text-[#1E1810]">{ad.title}</p>
                        <p className="mt-1 font-mono text-sm font-bold text-[#6B5B2E]">{ad.displayId}</p>
                        {ad.publishedId && ad.publishedId !== ad.displayId ? (
                          <p className="text-[11px] text-[#5C5346]">
                            ID público: <span className="font-mono">{ad.publishedId}</span>
                          </p>
                        ) : null}
                        <p className="text-[10px] text-[#9A9084] break-all">
                          Interno: <span className="font-mono">{ad.internalId}</span>
                        </p>
                        <p className="mt-1 text-[10px] text-[#7A7164]">
                          <span className="font-semibold text-[#5C5346]">{t.supportEdit}</span> {adminEditSupportStatusLabelEs(actions.editSupportStatus)} —{" "}
                          {actions.editSupportNote}
                        </p>
                        <p className="mt-1 text-xs text-[#5C5346]">
                          {(ad.status ?? "—") +
                            (ad.city ? ` · ${ad.city}` : "") +
                            (ad.updatedAt ? ` · Updated ${formatDate(ad.updatedAt)}` : ad.createdAt ? ` · ${formatDate(ad.createdAt)}` : "")}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-bold">
                          <Link
                            href={actions.publicUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#6B5B2E] underline"
                            title={t.publicView}
                          >
                            {t.publicView}
                          </Link>
                          <Link
                            href={actions.adminManageUrl}
                            className="text-[#6B5B2E] underline"
                            title="Leonix queue: moderation and status in same row (no impersonation)"
                          >
                            {t.manageAdmin}
                          </Link>
                          {actions.adminEditUrl ? (
                            <Link href={actions.adminEditUrl} className="text-[#6B5B2E] underline" title="Staff editing with owner and Leonix Ad ID guards">
                              {t.editAsAdmin}
                            </Link>
                          ) : null}
                          {actions.sellerSelfServiceUrl ? (
                            <Link
                              href={actions.sellerSelfServiceUrl}
                              className="text-[#9A9084] underline"
                              title="Requires ad owner login; not Leonix editing on their behalf"
                            >
                              {t.advertiserPanel}
                            </Link>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>

      {crossEntityError ? (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950">{crossEntityError}</div>
      ) : null}

      <div className={`${adminCardBase} mb-6 p-5`}>
        <h2 className="text-lg font-bold text-[#1E1810]">{t.tiendaOrders}</h2>
        <p className="mt-1 text-xs text-[#7A7164]">
          {t.tiendaOrdersInfo}{" "}
          <Link href={`/admin/tienda/orders?q=${encodeURIComponent(clientId)}`} className="font-bold text-[#6B5B2E] underline">
            {t.inboxFiltered}
          </Link>
        </p>
        <p className="mt-2 text-sm font-semibold text-[#1E1810]">{tiendaOrderCount ?? "—"} {t.orders}</p>
        {tiendaOrdersPreview.length === 0 ? (
          <p className="mt-2 text-sm text-[#5C5346]">{t.noOrders}</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {tiendaOrdersPreview.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#E8DFD0]/80 bg-white/80 px-3 py-2">
                <div>
                  <p className="font-mono text-xs font-semibold text-[#1E1810]">{o.order_ref}</p>
                  <p className="text-xs text-[#7A7164]">
                    {o.status} · {formatDate(o.created_at)}
                  </p>
                </div>
                <Link href={`/admin/tienda/orders/${o.id}`} className="text-xs font-bold text-[#6B5B2E] underline">
                  {t.viewOrder}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={`${adminCardBase} mb-6 p-5`}>
        <h2 className="text-lg font-bold text-[#1E1810]">{t.reports}</h2>
        <p className="mt-1 text-xs text-[#7A7164]">
          {t.globalQueue}{" "}
          <Link href="/admin/reportes" className="font-bold text-[#6B5B2E] underline">
            {t.reportsQueue}
          </Link>
        </p>
        <h3 className="mt-4 text-xs font-bold uppercase text-[#7A7164]">{t.sentByUser}</h3>
        {reportsByReporter.length === 0 ? (
          <p className="mt-1 text-sm text-[#5C5346]">{t.none}</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {reportsByReporter.map((r) => (
              <li key={r.id} className="rounded-xl border border-[#E8DFD0]/80 bg-[#FFFCF7]/90 px-3 py-2">
                <p className="text-xs font-mono text-[#6B5B2E]">
                  {t.report} <Link href={`/admin/reportes?q=${encodeURIComponent(r.id)}`} className="font-bold underline">{r.id.slice(0, 8)}…</Link> · {t.reportListing} {r.listing_id.slice(0, 8)}…
                </p>
                <p className="text-xs text-[#5C5346]">
                  {r.status} · {formatDate(r.created_at)}
                </p>
                <p className="text-xs text-[#3D3428]">{r.reason}</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  <Link href={`/admin/reportes?q=${encodeURIComponent(r.id)}`} className="inline-block text-xs font-bold text-[#6B5B2E] underline">
                    {t.openReportQueue}
                  </Link>
                  <Link href={`/clasificados/anuncio/${r.listing_id}`} target="_blank" className="inline-block text-xs font-bold text-[#6B5B2E] underline">
                    {t.viewAd}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
        <h3 className="mt-6 text-xs font-bold uppercase text-[#7A7164]">{t.pendingOnOwned}</h3>
        {reportsOnOwnedPending.length === 0 ? (
          <p className="mt-1 text-sm text-[#5C5346]">{t.nonePending}</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {reportsOnOwnedPending.map((r) => (
              <li key={r.id} className="rounded-xl border border-amber-200/80 bg-amber-50/60 px-3 py-2">
                <p className="text-xs font-mono text-[#6B5B2E]">{t.reportListing} {r.listing_id.slice(0, 8)}…</p>
                <p className="text-xs text-[#5C5346]">{r.reason}</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  <Link href={`/admin/reportes?q=${encodeURIComponent(r.id)}`} className="inline-block text-xs font-bold text-[#6B5B2E] underline">
                    {t.viewReport}
                  </Link>
                  <Link href={`/admin/workspace/clasificados?q=${encodeURIComponent(r.listing_id)}`} className="inline-block text-xs font-bold text-[#6B5B2E] underline">
                    {t.clasificadosQueue}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
