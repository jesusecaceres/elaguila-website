import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { requireAdminCookie, getAdminSupabase } from "@/app/lib/supabase/server";

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
};

const ALLOWED_ACCOUNT_TYPES = ["personal", "business"] as const;
const ALLOWED_MEMBERSHIP_TIERS = ["gratis", "pro", "business_lite", "business_premium"] as const;

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

function correo(row: ProfileRow): string {
  return (row.email ?? "").trim() || "(sin correo)";
}

function membershipTierLabel(tier: string | null): string {
  const t = (tier ?? "").trim().toLowerCase();
  if (t === "gratis") return "Gratis";
  if (t === "pro") return "Pro";
  if (t === "business_lite") return "Business Lite";
  if (t === "business_premium") return "Business Premium";
  return t || "Gratis";
}

function accountTypeLabel(accountType: string | null): string {
  const a = (accountType ?? "").trim().toLowerCase();
  if (a === "personal") return "Personal";
  if (a === "business") return "Business";
  return a || "—";
}

async function updateClientAccountAction(formData: FormData) {
  "use server";

  const cookieStore = await cookies();
  if (!requireAdminCookie(cookieStore)) {
    redirect("/admin/login");
  }

  const clientId = (formData.get("clientId") ?? "").toString().trim();
  if (!clientId) {
    redirect("/admin/usuarios");
  }

  const rawAccountType = (formData.get("account_type") ?? "").toString().trim().toLowerCase();
  const rawMembershipTier = (formData.get("membership_tier") ?? "").toString().trim().toLowerCase();

  if (!ALLOWED_ACCOUNT_TYPES.includes(rawAccountType as (typeof ALLOWED_ACCOUNT_TYPES)[number])) {
    redirect(`/admin/usuarios/${clientId}?error=invalid-account-type`);
  }
  if (!ALLOWED_MEMBERSHIP_TIERS.includes(rawMembershipTier as (typeof ALLOWED_MEMBERSHIP_TIERS)[number])) {
    redirect(`/admin/usuarios/${clientId}?error=invalid-membership`);
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

  if (!clientId) {
    notFound();
  }

  const searchParams = props.searchParams ? await props.searchParams : {};
  const updated = searchParams.updated;
  const errorParam = searchParams.error;
  const isUpdated = updated === "1" || (Array.isArray(updated) && updated.includes("1"));
  const errorValue = typeof errorParam === "string" ? errorParam : Array.isArray(errorParam) ? errorParam[0] : undefined;

  let row: ProfileRow | null = null;
  let queryError: string | null = null;

  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("profiles")
      .select("id,created_at,display_name,email,phone,account_type,membership_tier,home_city,owned_city_slug")
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
      <main className="min-h-screen bg-black text-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
            <p className="text-sm text-red-200">{queryError}</p>
          </div>
          <div className="mt-6">
            <Link
              href="/admin/usuarios"
              className="inline-flex items-center rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition"
            >
              ← Volver a clientes
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!row) {
    notFound();
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
  const selectedAccountType = ALLOWED_ACCOUNT_TYPES.includes(currentAccountType as (typeof ALLOWED_ACCOUNT_TYPES)[number])
    ? currentAccountType
    : "personal";
  const selectedMembershipTier = ALLOWED_MEMBERSHIP_TIERS.includes(currentMembershipTier as (typeof ALLOWED_MEMBERSHIP_TIERS)[number])
    ? currentMembershipTier
    : "gratis";

  const errorMessage =
    errorValue === "invalid-account-type"
      ? "Tipo de cuenta no válido."
      : errorValue === "invalid-membership"
        ? "Membresía no válida."
        : errorValue === "update-failed"
          ? "No se pudo guardar. Intenta de nuevo."
          : errorValue
            ? "Error al actualizar."
            : null;

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 py-6 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/admin/usuarios"
            className="inline-flex items-center text-sm text-white/60 hover:text-white/90 transition mb-4"
          >
            ← Volver a clientes
          </Link>
          <p className="text-sm text-yellow-400/90">Cliente</p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-yellow-400 mt-0.5">
            {name}
          </h1>
          <p className="mt-1 text-sm text-white/60">
            Vista administrativa de cuenta
          </p>
          <p className="mt-2 font-mono text-xs text-white/50 break-all">
            {row.id}
          </p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {isUpdated && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
            <p className="text-sm text-emerald-200">Cambios guardados correctamente.</p>
          </div>
        )}
        {errorMessage && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
            <p className="text-sm text-red-200">{errorMessage}</p>
          </div>
        )}

        <section className="rounded-2xl border border-yellow-600/20 bg-white/5 p-5 sm:p-6">
          <h2 className="text-base font-semibold text-yellow-400/90 mb-3">
            Estado actual
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/5 bg-black/20 px-4 py-3">
              <p className="text-xs text-white/50">Tipo de cuenta</p>
              <p className="text-sm font-medium text-white/90 mt-0.5">{accountTypeLabel(row.account_type)}</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-black/20 px-4 py-3">
              <p className="text-xs text-white/50">Membresía</p>
              <p className="text-sm font-medium text-white/90 mt-0.5">{membershipTierLabel(row.membership_tier)}</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-black/20 px-4 py-3">
              <p className="text-xs text-white/50">Ciudad</p>
              <p className="text-sm font-medium text-white/90 mt-0.5">{row.home_city ?? "—"}</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-black/20 px-4 py-3">
              <p className="text-xs text-white/50">Ciudad asignada</p>
              <p className="text-sm font-medium text-white/90 mt-0.5">{row.owned_city_slug?.trim() ?? "—"}</p>
            </div>
          </div>
          <div className="mt-3 rounded-xl border border-white/5 bg-black/20 px-4 py-3">
            <p className="text-xs text-white/50">Fecha de creación</p>
            <p className="text-sm font-medium text-white/90 mt-0.5">{formatDate(row.created_at)}</p>
          </div>
        </section>

        <section className="rounded-2xl border border-yellow-600/20 bg-white/5 p-5 sm:p-6">
          <h2 className="text-base font-semibold text-yellow-400/90 mb-3">
            Información principal
          </h2>
          <dl className="grid grid-cols-1 gap-4 text-sm">
            <div>
              <dt className="text-white/50">Nombre</dt>
              <dd className="text-white/90 mt-0.5">{name}</dd>
            </div>
            <div>
              <dt className="text-white/50">Correo</dt>
              <dd className="text-white/90 mt-0.5">
                {hasEmail ? (
                  <a
                    href={`mailto:${emailRaw}`}
                    className="text-yellow-400/90 hover:text-yellow-400 underline underline-offset-2"
                  >
                    {emailDisplay}
                  </a>
                ) : (
                  <span className="text-white/50">{emailDisplay}</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-white/50">Teléfono</dt>
              <dd className="text-white/90 mt-0.5">
                {hasPhone ? (
                  <a
                    href={`tel:${phoneRaw}`}
                    className="text-yellow-400/90 hover:text-yellow-400 underline underline-offset-2"
                  >
                    {phoneDisplay}
                  </a>
                ) : (
                  <span className="text-white/50">{phoneDisplay}</span>
                )}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-yellow-600/20 bg-white/5 p-5 sm:p-6">
          <h2 className="text-base font-semibold text-yellow-400/90 mb-3">
            Cuenta
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-white/50">Tipo de cuenta</dt>
              <dd className="text-white/90 mt-0.5">{accountTypeLabel(row.account_type)}</dd>
            </div>
            <div>
              <dt className="text-white/50">Membresía</dt>
              <dd className="text-white/90 mt-0.5">{membershipTierLabel(row.membership_tier)}</dd>
            </div>
            <div>
              <dt className="text-white/50">Ciudad</dt>
              <dd className="text-white/90 mt-0.5">{row.home_city ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-white/50">Ciudad asignada</dt>
              <dd className="text-white/90 mt-0.5">{row.owned_city_slug?.trim() ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-white/50">Fecha de creación</dt>
              <dd className="text-white/90 mt-0.5">{formatDate(row.created_at)}</dd>
            </div>
            <div>
              <dt className="text-white/50">ID</dt>
              <dd className="mt-0.5 font-mono text-xs text-white/50 break-all">{row.id}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-yellow-600/20 bg-white/5 p-5 sm:p-6">
          <h2 className="text-base font-semibold text-yellow-400/90 mb-1">
            Administrar cuenta
          </h2>
          <p className="text-sm text-white/60 mb-4">
            Actualiza el tipo de cuenta y la membresía manualmente.
          </p>
          <form action={updateClientAccountAction} className="space-y-4">
            <input type="hidden" name="clientId" value={row.id} />
            <div>
              <label htmlFor="account_type" className="block text-sm text-white/70 mb-1">
                Tipo de cuenta
              </label>
              <select
                id="account_type"
                name="account_type"
                defaultValue={selectedAccountType}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-white focus:border-yellow-500/60 focus:outline-none"
              >
                <option value="personal">Personal</option>
                <option value="business">Business</option>
              </select>
            </div>
            <div>
              <label htmlFor="membership_tier" className="block text-sm text-white/70 mb-1">
                Membresía
              </label>
              <select
                id="membership_tier"
                name="membership_tier"
                defaultValue={selectedMembershipTier}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-white focus:border-yellow-500/60 focus:outline-none"
              >
                <option value="gratis">Gratis</option>
                <option value="pro">Pro</option>
                <option value="business_lite">Business Lite</option>
                <option value="business_premium">Business Premium</option>
              </select>
            </div>
            <button
              type="submit"
              className="rounded-xl bg-yellow-500/90 hover:bg-yellow-500 text-black font-semibold px-4 py-2.5 text-sm transition"
            >
              Guardar cambios
            </button>
            <p className="text-xs text-white/50">
              Sobrescritura administrativa. Solo se actualizan tipo de cuenta y membresía.
            </p>
          </form>
        </section>

        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/admin/usuarios"
            className="inline-flex items-center rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition"
          >
            ← Volver a clientes
          </Link>
          <Link
            href="/admin"
            className="inline-flex items-center rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition"
          >
            Panel de administración
          </Link>
        </div>
      </div>
    </main>
  );
}
