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

  const authUsersDashboardUrl = getSupabaseAuthUsersDashboardUrl();

  const searchParams = props.searchParams ? await props.searchParams : {};
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
        subtitle="Vista administrativa de cuenta — operaciones Leonix."
        eyebrow={`Cuenta #${accountRefFromId(row.id)}`}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/admin/usuarios" className={adminBtnSecondary} title="Volver a la lista de usuarios">
          ← Volver a clientes
        </Link>
        <Link href="/admin" className={adminBtnDark} title="Panel principal Leonix">
          Dashboard
        </Link>
      </div>

      <p className="mb-6 font-mono text-xs text-[#7A7164] break-all">ID: {row.id}</p>

      {isUpdated && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Cambios guardados correctamente.
        </div>
      )}
      {errorMessage && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>
      )}

      <div className={`${adminCardBase} mb-6 p-5`}>
        <h2 className="text-base font-bold text-[#1E1810]">Estado y acceso</h2>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-[#FBF7EF] px-3 py-1 text-xs font-bold text-[#5C4E2E]">
            {row.is_disabled === true ? "Cuenta deshabilitada" : "Cuenta activa"}
          </span>
          <AdminUserActions userId={row.id} disabled={row.is_disabled} as="div" />
        </div>
      </div>

      <div className={`${adminCardBase} mb-6 p-5`}>
        <h2 className="text-base font-bold text-[#1E1810]">Resumen</h2>
        <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-[#7A7164]">Tipo</dt>
            <dd className="font-medium text-[#1E1810]">{accountTypeLabel(row.account_type)}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#7A7164]">Membresía</dt>
            <dd className="font-medium text-[#1E1810]">{membershipTierLabel(row.membership_tier)}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#7A7164]">Newsletter</dt>
            <dd className="font-medium text-[#1E1810]">{newsletterStatus(row.newsletter_opt_in)}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#7A7164]">Ciudad</dt>
            <dd className="font-medium text-[#1E1810]">{row.home_city ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#7A7164]">Creado</dt>
            <dd className="font-medium text-[#1E1810]">{formatDate(row.created_at)}</dd>
          </div>
        </dl>
      </div>

      <div className={`${adminCardBase} mb-6 p-5`}>
        <h2 className="text-base font-bold text-[#1E1810]">Contacto</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div>
            <dt className="text-xs text-[#7A7164]">Correo</dt>
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
            <dt className="text-xs text-[#7A7164]">Teléfono</dt>
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
        <h2 className="text-base font-bold text-[#1E1810]">Administrar cuenta</h2>
        <p className="mt-1 text-sm text-[#5C5346]/90">
          Sobrescritura administrativa. Solo tipo de cuenta y membresía.
        </p>
        <form action={updateClientAccountAction} className="mt-4 space-y-4" aria-describedby="account-save-hint">
          <input type="hidden" name="clientId" value={row.id} />
          <p id="account-save-hint" className="text-[10px] text-[#7A7164]">
            Guarda en <span className="font-mono">profiles</span> (tipo y membresía). No cambia contraseña ni Auth.
          </p>
          <div>
            <label htmlFor="account_type" className="mb-1 block text-sm text-[#5C5346]">
              Tipo de cuenta
            </label>
            <select id="account_type" name="account_type" defaultValue={selectedAccountType} className={inputClass}>
              <option value="personal">Personal</option>
              <option value="business">Business</option>
            </select>
          </div>
          <div>
            <label htmlFor="membership_tier" className="mb-1 block text-sm text-[#5C5346]">
              Membresía
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
            title="Persistir tipo de cuenta y membresía en Supabase (auditoría)"
          >
            Guardar tipo y membresía
          </button>
        </form>
      </div>

      <div className={`${adminCardBase} mb-6 p-5`}>
        <h2 className="text-base font-bold text-[#1E1810]">Auth y contraseña</h2>
        <p className="mt-1 text-sm text-[#5C5346]/90">
          <strong className="text-[#1E1810]">Habilitar / deshabilitar</strong> la cuenta: usa el botón arriba en esta ficha (acción
          real en <code className="rounded bg-white/80 px-1">profiles</code>).
        </p>
        <p className="mt-2 text-sm text-[#5C5346]/90">
          <strong className="text-[#1E1810]">Recuperación de contraseña o magic link:</strong> no se generan desde Leonix admin por
          seguridad. Abre Supabase Auth y localiza al usuario por email.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {authUsersDashboardUrl ? (
            <a
              href={authUsersDashboardUrl}
              target="_blank"
              rel="noreferrer"
              className={`${adminBtnSecondary} inline-flex min-h-[44px] justify-center sm:min-h-0`}
            >
              Abrir Supabase Auth (usuarios) ↗
            </a>
          ) : (
            <p className="text-xs text-[#9A9084]">Configura NEXT_PUBLIC_SUPABASE_URL para enlazar al proyecto.</p>
          )}
        </div>
        <p className="mt-3 text-xs text-[#7A7164]">
          Réplica “ver como el usuario”:{" "}
          <span className="font-semibold text-[#5C5346]">no disponible</span> — no hay suplantación desde este panel.
        </p>
      </div>

      <div className={`${adminCardBase} mb-6 p-5`}>
        <h2 className="text-base font-bold text-[#1E1810]">Operaciones cruzadas</h2>
        <p className="mt-1 text-xs text-[#7A7164]">
          Búsqueda unificada (cuenta + anuncios + pedidos impresión):{" "}
          <Link
            href={`/admin/ops?q=${encodeURIComponent(row.id)}`}
            className="font-bold text-[#6B5B2E] underline"
            title="Búsqueda unificada: perfil, anuncios, pedidos Tienda y reportes con este identificador"
          >
            Abrir Customer ops con este UUID →
          </Link>
        </p>
        {hasEmail ? (
          <p className="mt-2 text-xs text-[#7A7164]">
            Por correo:{" "}
            <Link href={`/admin/ops?q=${encodeURIComponent(emailRaw)}`} className="font-bold text-[#6B5B2E] underline">
              Buscar «{emailRaw}» →
            </Link>
          </p>
        ) : null}
        {hasPhone ? (
          <p className="mt-1 text-xs text-[#7A7164]">
            Por teléfono:{" "}
            <Link href={`/admin/ops?q=${encodeURIComponent(phoneRaw)}`} className="font-bold text-[#6B5B2E] underline">
              Buscar «{phoneRaw}» →
            </Link>
          </p>
        ) : null}
      </div>

      <div className={`${adminCardBase} mb-6 p-5`}>
        <h2 className="text-base font-bold text-[#1E1810]">Anuncios — centro de comando</h2>
        <p className="mt-1 text-xs text-[#7A7164]">
          Todas las fuentes soportadas para esta cuenta (mismo <span className="font-mono">owner</span> en cada tabla). IDs de trazabilidad
          para soporte y moderación.
        </p>
        <p className="mt-2 font-mono text-[10px] text-[#9A9084] break-all">Owner user id: {row.id}</p>
        {adsBundle.totalAds === 0 ? (
          <p className="mt-4 text-sm text-[#5C5346]">Sin anuncios en fuentes conectadas para este usuario.</p>
        ) : (
          <p className="mt-2 text-sm font-semibold text-[#1E1810]">Total: {adsBundle.totalAds} anuncio(s)</p>
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
                <p className="mt-1 text-sm text-[#5C5346]/90">Ninguno en esta fuente.</p>
              ) : (
                <ul className="mt-2 space-y-3">
                  {g.ads.map((ad) => (
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
                        {ad.ownerUserId ? (
                          <>
                            {" "}
                            · Owner: <span className="font-mono">{ad.ownerUserId}</span>
                          </>
                        ) : null}
                      </p>
                      <p className="mt-1 text-xs text-[#5C5346]">
                        {(ad.status ?? "—") +
                          (ad.city ? ` · ${ad.city}` : "") +
                          (ad.updatedAt ? ` · Actualizado ${formatDate(ad.updatedAt)}` : ad.createdAt ? ` · ${formatDate(ad.createdAt)}` : "")}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-bold">
                        <Link
                          href={ad.publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#6B5B2E] underline"
                          title="Vista pública del anuncio"
                        >
                          Ver público
                        </Link>
                        <Link href={ad.adminUrl} className="text-[#6B5B2E] underline" title="Cola o vista admin para este anuncio">
                          Admin / cola
                        </Link>
                        {ad.editUrl ? (
                          <Link href={ad.editUrl} className="text-[#6B5B2E] underline" title="Flujo de edición del anunciante cuando existe">
                            Editar (cuenta)
                          </Link>
                        ) : null}
                      </div>
                    </li>
                  ))}
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
        <h2 className="text-base font-bold text-[#1E1810]">Tienda — pedidos (customer_user_id)</h2>
        <p className="mt-1 text-xs text-[#7A7164]">
          Conteo y vista previa desde <code className="rounded bg-white/80 px-1">tienda_orders</code>.{" "}
          <Link href={`/admin/tienda/orders?q=${encodeURIComponent(clientId)}`} className="font-bold text-[#6B5B2E] underline">
            Inbox filtrado →
          </Link>
        </p>
        <p className="mt-2 text-sm font-semibold text-[#1E1810]">{tiendaOrderCount ?? "—"} pedido(s)</p>
        {tiendaOrdersPreview.length === 0 ? (
          <p className="mt-2 text-sm text-[#5C5346]">Sin pedidos ligados a esta cuenta.</p>
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
                  Ver pedido
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={`${adminCardBase} mb-6 p-5`}>
        <h2 className="text-base font-bold text-[#1E1810]">Reportes (moderación)</h2>
        <p className="mt-1 text-xs text-[#7A7164]">
          Cola global:{" "}
          <Link href="/admin/reportes" className="font-bold text-[#6B5B2E] underline">
            /admin/reportes →
          </Link>
        </p>
        <h3 className="mt-4 text-xs font-bold uppercase text-[#7A7164]">Enviados por este usuario</h3>
        {reportsByReporter.length === 0 ? (
          <p className="mt-1 text-sm text-[#5C5346]">Ninguno.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {reportsByReporter.map((r) => (
              <li key={r.id} className="rounded-xl border border-[#E8DFD0]/80 bg-[#FFFCF7]/90 px-3 py-2">
                <p className="text-xs font-mono text-[#6B5B2E]">
                  Reporte <Link href={`/admin/reportes?q=${encodeURIComponent(r.id)}`} className="font-bold underline">{r.id.slice(0, 8)}…</Link> · Listing {r.listing_id.slice(0, 8)}…
                </p>
                <p className="text-xs text-[#5C5346]">
                  {r.status} · {formatDate(r.created_at)}
                </p>
                <p className="text-xs text-[#3D3428]">{r.reason}</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  <Link href={`/admin/reportes?q=${encodeURIComponent(r.id)}`} className="inline-block text-xs font-bold text-[#6B5B2E] underline">
                    Abrir en cola de reportes
                  </Link>
                  <Link href={`/clasificados/anuncio/${r.listing_id}`} target="_blank" className="inline-block text-xs font-bold text-[#6B5B2E] underline">
                    Ver anuncio
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
        <h3 className="mt-6 text-xs font-bold uppercase text-[#7A7164]">Pendientes sobre anuncios de su propiedad</h3>
        {reportsOnOwnedPending.length === 0 ? (
          <p className="mt-1 text-sm text-[#5C5346]">Ninguno pendiente.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {reportsOnOwnedPending.map((r) => (
              <li key={r.id} className="rounded-xl border border-amber-200/80 bg-amber-50/60 px-3 py-2">
                <p className="text-xs font-mono text-[#6B5B2E]">Listing {r.listing_id.slice(0, 8)}…</p>
                <p className="text-xs text-[#5C5346]">{r.reason}</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  <Link href={`/admin/reportes?q=${encodeURIComponent(r.id)}`} className="inline-block text-xs font-bold text-[#6B5B2E] underline">
                    Ver reporte
                  </Link>
                  <Link href={`/admin/workspace/clasificados?q=${encodeURIComponent(r.listing_id)}`} className="inline-block text-xs font-bold text-[#6B5B2E] underline">
                    Cola Clasificados
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
