import Link from "next/link";
import { redirect } from "next/navigation";
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

export default async function AdminUsuariosPage() {
  const cookieStore = await cookies();
  if (!requireAdminCookie(cookieStore)) {
    redirect("/admin/login");
  }

  let rows: ProfileRow[] = [];
  let queryError: string | null = null;

  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("profiles")
      .select("id,created_at,display_name,email,phone,account_type,membership_tier,home_city,owned_city_slug")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      queryError = error.message;
    } else if (data) {
      rows = data as ProfileRow[];
    }
  } catch (e) {
    queryError = e instanceof Error ? e.message : "Error al cargar clientes.";
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 py-6 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-semibold text-yellow-400">
            Lista de clientes
          </h1>
          <p className="mt-1 text-sm text-white/70">
            Cuentas creadas en LEONIX (solo administración).
          </p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {queryError ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
            <p className="text-sm text-red-200">{queryError}</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-yellow-600/20 bg-white/5 p-6">
            <p className="text-white/80">Aún no hay clientes.</p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto rounded-2xl border border-yellow-600/20 bg-white/5">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="p-3 font-semibold text-yellow-400/90">Nombre</th>
                    <th className="p-3 font-semibold text-yellow-400/90">Correo</th>
                    <th className="p-3 font-semibold text-yellow-400/90">Teléfono</th>
                    <th className="p-3 font-semibold text-yellow-400/90">Ciudad</th>
                    <th className="p-3 font-semibold text-yellow-400/90">Tipo de cuenta</th>
                    <th className="p-3 font-semibold text-yellow-400/90">Membresía</th>
                    <th className="p-3 font-semibold text-yellow-400/90">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b border-white/5">
                      <td className="p-3 text-white/90">
                        <Link
                          href={`/admin/usuarios/${row.id}`}
                          className="text-yellow-400/90 hover:text-yellow-400 underline underline-offset-2"
                        >
                          {displayName(row)}
                        </Link>
                        {row.owned_city_slug?.trim() && (
                          <span className="block text-xs text-white/50 mt-0.5">
                            {row.owned_city_slug.trim()}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-white/70">{correo(row)}</td>
                      <td className="p-3 text-white/70">{row.phone ?? "—"}</td>
                      <td className="p-3 text-white/70">{row.home_city ?? "—"}</td>
                      <td className="p-3 text-white/70">{row.account_type ?? "—"}</td>
                      <td className="p-3 text-white/70">{membresia(row.membership_tier)}</td>
                      <td className="p-3 text-white/60">{formatDate(row.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-4">
              {rows.map((row) => (
                <div
                  key={row.id}
                  className="rounded-2xl border border-yellow-600/20 bg-white/5 p-4"
                >
                  <div className="font-semibold text-yellow-400/90">
                    {displayName(row)}
                  </div>
                  {row.owned_city_slug?.trim() && (
                    <div className="text-xs text-white/50 mt-0.5">
                      {row.owned_city_slug.trim()}
                    </div>
                  )}
                  <div className="mt-2 grid grid-cols-1 gap-1 text-sm text-white/70">
                    <span>Correo: {correo(row)}</span>
                    <span>Teléfono: {row.phone ?? "—"}</span>
                    <span>Ciudad: {row.home_city ?? "—"}</span>
                    <span>Tipo de cuenta: {row.account_type ?? "—"}</span>
                    <span>Membresía: {membresia(row.membership_tier)}</span>
                    <span>Fecha: {formatDate(row.created_at)}</span>
                  </div>
                  <div className="mt-3">
                    <Link
                      href={`/admin/usuarios/${row.id}`}
                      className="inline-flex items-center rounded-xl border border-yellow-600/30 bg-yellow-500/10 px-4 py-2 text-sm font-medium text-yellow-400 hover:bg-yellow-500/20 transition"
                    >
                      Ver cliente
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <p className="mt-6 text-xs text-white/50">
          Próximo: buscar, ver detalles, editar y eliminar.
        </p>

        <div className="mt-8">
          <Link
            href="/admin"
            className="inline-flex items-center rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition"
          >
            ← Volver al panel
          </Link>
        </div>
      </div>
    </main>
  );
}
