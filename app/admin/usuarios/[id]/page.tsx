import Link from "next/link";
import { redirect, notFound } from "next/navigation";
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

function membresia(tier: string | null): string {
  const t = (tier ?? "").trim();
  return t || "Gratis";
}

type PageProps = { params: Promise<{ id: string }> };

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
  const email = correo(row);
  const tier = membresia(row.membership_tier);

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 py-6 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-sm text-yellow-400/90">Cliente</p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-yellow-400 mt-0.5">
            {name}
          </h1>
          <p className="mt-1 text-sm text-white/60">
            Vista administrativa de cuenta
          </p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <section className="rounded-2xl border border-yellow-600/20 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-yellow-400/90 mb-4">
            Información principal
          </h2>
          <dl className="grid grid-cols-1 gap-3 text-sm">
            <div>
              <dt className="text-white/50">Nombre</dt>
              <dd className="text-white/90 mt-0.5">{name}</dd>
            </div>
            <div>
              <dt className="text-white/50">Correo</dt>
              <dd className="text-white/90 mt-0.5">{email}</dd>
            </div>
            <div>
              <dt className="text-white/50">Teléfono</dt>
              <dd className="text-white/90 mt-0.5">{row.phone ?? "—"}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-yellow-600/20 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-yellow-400/90 mb-4">
            Cuenta
          </h2>
          <dl className="grid grid-cols-1 gap-3 text-sm">
            <div>
              <dt className="text-white/50">Tipo de cuenta</dt>
              <dd className="text-white/90 mt-0.5">{row.account_type ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-white/50">Membresía</dt>
              <dd className="text-white/90 mt-0.5">{tier}</dd>
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

        <div className="flex flex-wrap gap-3">
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
