import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { requireAdminCookie, getAdminSupabase } from "@/app/lib/supabase/server";
import AdminUserActions from "../AdminUserActions";
import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import { adminBtnDark, adminBtnSecondary, adminCardBase } from "../../../_components/adminTheme";

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

type ListingRow = {
  id: string;
  title: string | null;
  price: number | string | null;
  city: string | null;
  zip: string | null;
  status: string | null;
  created_at: string | null;
  category: string | null;
  images?: unknown | null;
};

const LISTINGS_LIMIT = 12;
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

function formatMoney(price: number | string | null): string {
  if (price === null || price === undefined) return "—";
  const n = typeof price === "number" ? price : Number(price);
  if (!Number.isFinite(n)) return "—";
  if (n === 0) return "Gratis";
  try {
    return new Intl.NumberFormat("es-MX", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
  } catch {
    return "—";
  }
}

function getListingImage(row: ListingRow): string | null {
  try {
    const images = row.images;
    if (images == null) return null;
    if (typeof images === "string" && images.trim()) return images.trim();
    if (!Array.isArray(images) || images.length === 0) return null;
    const first = images[0];
    if (typeof first === "string" && first.trim()) return first.trim();
    if (first && typeof first === "object") {
      const obj = first as Record<string, unknown>;
      const url = (obj.url ?? obj.src ?? obj.path) as string | undefined;
      if (typeof url === "string" && url.trim()) return url.trim();
    }
  } catch {
    /* ignore */
  }
  return null;
}

function humanStatus(status: string | null): string {
  const s = (status ?? "").trim().toLowerCase();
  if (s === "active") return "Activo";
  if (s === "draft") return "Borrador";
  if (s === "sold") return "Vendido";
  if (s === "expired") return "Expirado";
  return s || "—";
}

function humanCategory(cat: string | null): string {
  const c = (cat ?? "").trim();
  if (!c) return "—";
  const map: Record<string, string> = {
    "en-venta": "En venta",
    rentas: "Rentas",
    autos: "Autos",
    empleos: "Empleos",
    servicios: "Servicios",
    restaurantes: "Restaurantes",
    travel: "Viajes",
    viajes: "Viajes",
  };
  return map[c] ?? c;
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

  let listings: ListingRow[] = [];
  let listingsError: string | null = null;

  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("listings")
      .select("id,title,price,city,zip,status,created_at,category,images")
      .eq("owner_id", clientId)
      .order("created_at", { ascending: false })
      .limit(LISTINGS_LIMIT);

    if (error) {
      listingsError = error.message;
    } else if (data && Array.isArray(data)) {
      listings = data as ListingRow[];
    }
  } catch {
    listingsError = "No se pudieron cargar los anuncios.";
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
        <Link href="/admin/usuarios" className={adminBtnSecondary}>
          ← Volver a clientes
        </Link>
        <Link href="/admin" className={adminBtnDark}>
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
        <form action={updateClientAccountAction} className="mt-4 space-y-4">
          <input type="hidden" name="clientId" value={row.id} />
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
          <button type="submit" className={`${adminBtnDark} w-full sm:w-auto`}>
            Guardar cambios
          </button>
        </form>
      </div>

      <div className={`${adminCardBase} mb-6 p-5`}>
        <h2 className="text-base font-bold text-[#1E1810]">Soporte y réplica (stubs)</h2>
        <p className="mt-1 text-sm text-[#5C5346]/90">
          Reset password, réplica modo usuario y notas internas requieren integración Auth Admin / Supabase — no
          expuestos aquí como “listos”.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" disabled className={`${adminBtnSecondary} cursor-not-allowed opacity-60`}>
            Reset password (stub)
          </button>
          <button type="button" disabled className={`${adminBtnSecondary} cursor-not-allowed opacity-60`}>
            Réplica modo (stub)
          </button>
        </div>
      </div>

      <div className={`${adminCardBase} mb-6 p-5`}>
        <h2 className="text-base font-bold text-[#1E1810]">Clasificados del cliente</h2>
        {listingsError ? (
          <p className="mt-2 text-sm text-red-700">{listingsError}</p>
        ) : listings.length === 0 ? (
          <p className="mt-2 text-sm text-[#5C5346]">Sin anuncios.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {listings.map((listing) => {
              const imgUrl = getListingImage(listing);
              const title = (listing.title ?? "").trim() || "(sin título)";
              return (
                <li key={listing.id} className="flex flex-wrap gap-4 rounded-2xl border border-[#E8DFD0] bg-white/80 p-4">
                  {imgUrl ? (
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[#EDE6DC]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imgUrl} alt="" className="h-full w-full object-cover" />
                    </div>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#1E1810]">{title}</p>
                    <p className="mt-1 text-xs text-[#7A7164]">
                      {humanCategory(listing.category)} · {formatMoney(listing.price)} · {listing.city ?? "—"} ·{" "}
                      {humanStatus(listing.status)} · {formatDate(listing.created_at)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Link
                        href={`/clasificados/anuncio/${listing.id}`}
                        className="text-xs font-bold text-[#6B5B2E] underline"
                      >
                        Ver anuncio
                      </Link>
                      <Link
                        href={`/dashboard/mis-anuncios/${listing.id}/editar`}
                        className="text-xs font-semibold text-[#5C5346] underline"
                      >
                        Editar
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
