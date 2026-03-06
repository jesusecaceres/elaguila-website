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

/** First 4 + last 4 meaningful chars of UUID (no hyphens), uppercase, e.g. CDCC-3790 */
function accountRefFromId(id: string): string {
  const s = (id ?? "").replace(/-/g, "").trim();
  if (s.length < 8) return "—";
  const first = s.slice(0, 4).toUpperCase();
  const last = s.slice(-4).toUpperCase();
  return `${first}-${last}`;
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

function correo(row: ProfileRow): string {
  return (row.email ?? "").trim() || "(sin correo)";
}

function membresia(tier: string | null): string {
  const t = (tier ?? "").trim();
  return t || "Gratis";
}

function matchesSearch(row: ProfileRow, q: string): boolean {
  if (!q) return true;
  const ref = accountRefFromId(row.id).toLowerCase().replace(/-/g, "");
  const rawId = (row.id ?? "").toLowerCase().replace(/-/g, "");
  const name = (row.display_name ?? "").toLowerCase();
  const email = (row.email ?? "").toLowerCase();
  const phone = (row.phone ?? "").toLowerCase();
  const qNorm = q.replace(/-/g, "");
  return (
    ref.includes(qNorm) ||
    rawId.includes(qNorm) ||
    name.includes(q) ||
    email.includes(q) ||
    phone.includes(q)
  );
}

type PageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AdminUsuariosPage(props: PageProps) {
  const cookieStore = await cookies();
  if (!requireAdminCookie(cookieStore)) {
    redirect("/admin/login");
  }

  const searchParams = props.searchParams ? await props.searchParams : {};
  const qParam = searchParams.q;
  const searchQuery = typeof qParam === "string" ? qParam.trim().toLowerCase() : Array.isArray(qParam) ? (qParam[0] ?? "").trim().toLowerCase() : "";

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

  const filteredRows = searchQuery ? rows.filter((r) => matchesSearch(r, searchQuery)) : rows;

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
        <div className="mb-6 flex flex-wrap gap-3">
          <Link
            href="/admin"
            className="inline-flex items-center rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition"
          >
            ← Volver al panel
          </Link>
        </div>
        {queryError ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
            <p className="text-sm text-red-200">{queryError}</p>
          </div>
        ) : (
          <>
            <form method="get" action="/admin/usuarios" className="mb-4">
              <label htmlFor="admin-user-search" className="sr-only">
                Buscar clientes
              </label>
              <input
                id="admin-user-search"
                type="search"
                name="q"
                defaultValue={searchQuery}
                placeholder="Buscar por nombre, correo, teléfono o referencia…"
                className="w-full rounded-xl border border-yellow-600/30 bg-black/40 px-4 py-2.5 text-white placeholder:text-white/50 focus:border-yellow-500/60 focus:outline-none text-sm"
              />
              <p className="mt-1.5 text-xs text-white/50">
                Busca por nombre, correo, teléfono o referencia.
              </p>
              {!queryError && (
                <p className="mt-1 text-xs text-white/40">
                  Mostrando {filteredRows.length} cuenta{filteredRows.length !== 1 ? "s" : ""}.
                </p>
              )}
            </form>

            {filteredRows.length === 0 ? (
              <div className="rounded-2xl border border-yellow-600/20 bg-white/5 p-6">
                <p className="text-white/80">
                  {searchQuery ? "Ningún cliente coincide con la búsqueda." : "Aún no hay clientes."}
                </p>
              </div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto rounded-2xl border border-yellow-600/20 bg-white/5">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="p-2.5 pr-3 font-semibold text-yellow-400/90 whitespace-nowrap">Cuenta #</th>
                        <th className="p-2.5 font-semibold text-yellow-400/90 min-w-[120px]">Nombre</th>
                        <th className="p-2.5 font-semibold text-yellow-400/90 min-w-[140px]">Correo</th>
                        <th className="p-2.5 font-semibold text-yellow-400/90 whitespace-nowrap">Teléfono</th>
                        <th className="p-2.5 font-semibold text-yellow-400/90">Ciudad</th>
                        <th className="p-2.5 font-semibold text-yellow-400/90 whitespace-nowrap">Tipo</th>
                        <th className="p-2.5 font-semibold text-yellow-400/90 whitespace-nowrap">Membresía</th>
                        <th className="p-2.5 font-semibold text-yellow-400/90 whitespace-nowrap">Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.map((row) => (
                        <tr key={row.id} className="border-b border-white/5">
                          <td className="p-2.5 pr-3 font-mono text-xs text-yellow-400/90 whitespace-nowrap">
                            {accountRefFromId(row.id)}
                          </td>
                          <td className="p-2.5 min-w-0 max-w-[200px]">
                            <Link
                              href={`/admin/usuarios/${row.id}`}
                              className="text-yellow-400/90 hover:text-yellow-400 underline underline-offset-2 truncate block"
                            >
                              {displayName(row)}
                            </Link>
                            {row.owned_city_slug?.trim() && (
                              <span className="block text-xs text-white/50 mt-0.5 truncate">
                                {row.owned_city_slug.trim()}
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 text-white/70 min-w-0 max-w-[180px] truncate" title={correo(row)}>
                            {correo(row)}
                          </td>
                          <td className="p-2.5 text-white/70 whitespace-nowrap">{row.phone ?? "—"}</td>
                          <td className="p-2.5 text-white/70 whitespace-nowrap">{row.home_city ?? "—"}</td>
                          <td className="p-2.5 text-white/70 whitespace-nowrap">{row.account_type ?? "—"}</td>
                          <td className="p-2.5 text-white/70 whitespace-nowrap">{membresia(row.membership_tier)}</td>
                          <td className="p-2.5 text-white/60 whitespace-nowrap">{formatDate(row.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden space-y-3">
                  {filteredRows.map((row) => (
                    <div
                      key={row.id}
                      className="rounded-2xl border border-yellow-600/20 bg-white/5 p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold text-yellow-400/90 min-w-0 truncate">
                          {displayName(row)}
                        </div>
                        <span className="font-mono text-xs text-yellow-400/90 flex-shrink-0">
                          Cuenta #{accountRefFromId(row.id)}
                        </span>
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
          </>
        )}

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
