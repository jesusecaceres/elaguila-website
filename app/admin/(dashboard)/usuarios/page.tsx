import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { requireAdminCookie } from "@/app/lib/supabase/server";
import { fetchProfilesForAdminList } from "../../_lib/adminProfilesQuery";
import AdminUserActions from "./AdminUserActions";
import { AdminPageHeader } from "../../_components/AdminPageHeader";
import { adminCardBase, adminTableWrap } from "../../_components/adminTheme";

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

function newsletterLabel(optIn: boolean | null): string {
  return optIn === true ? "Sí" : "No";
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

function isPaidTier(tier: string | null): boolean {
  const t = (tier ?? "").trim().toLowerCase();
  return t === "pro" || t === "business_lite" || t === "business_premium";
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
  const searchQuery =
    typeof qParam === "string"
      ? qParam.trim().toLowerCase()
      : Array.isArray(qParam)
        ? (qParam[0] ?? "").trim().toLowerCase()
        : "";

  let rows: ProfileRow[] = [];
  let queryError: string | null = null;
  let searchNote: string | null = null;

  try {
    const res = await fetchProfilesForAdminList({ q: searchQuery, recentLimit: 200, searchLimit: 80 });
    queryError = res.error;
    rows = res.rows as ProfileRow[];

    if (searchQuery) {
      if (queryError) {
        const fb = await fetchProfilesForAdminList({ q: "", recentLimit: 400 });
        if (fb.error) {
          queryError = fb.error;
        } else {
          queryError = null;
          rows = (fb.rows as ProfileRow[]).filter((r) => matchesSearch(r, searchQuery));
          searchNote = "La búsqueda en base falló; se filtraron las ~400 cuentas más recientes en memoria.";
        }
      } else if (res.strategy === "server_search") {
        const seen = new Set(rows.map((r) => r.id));
        const recent = await fetchProfilesForAdminList({ q: "", recentLimit: 400 });
        if (!recent.error) {
          for (const r of recent.rows as ProfileRow[]) {
            if (!seen.has(r.id) && matchesSearch(r, searchQuery)) {
              rows.push(r);
              seen.add(r.id);
            }
          }
        }
        searchNote =
          "Búsqueda en Postgres + referencias cortas contra las ~400 cuentas más recientes (p. ej. XXXX-YYYY).";
      }
    }
  } catch (e) {
    queryError = e instanceof Error ? e.message : "Error al cargar clientes.";
  }

  const filteredRows = rows;
  const disabledCount = filteredRows.filter((r) => r.is_disabled === true).length;
  const newsletterCount = filteredRows.filter((r) => r.newsletter_opt_in === true).length;
  const paidCount = filteredRows.filter((r) => isPaidTier(r.membership_tier)).length;

  return (
    <>
      <AdminPageHeader
        title="Users"
        subtitle="Profiles (service role). Search uses Postgres when you type a query — not limited to the newest 200 rows. Ref-style IDs still merge matches from recent accounts."
        eyebrow="Accounts"
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Shown", value: filteredRows.length },
          { label: "Disabled", value: disabledCount },
          { label: "Newsletter opt-in", value: newsletterCount },
          { label: "Pro / paid", value: paidCount },
        ].map((x) => (
          <div key={x.label} className={`${adminCardBase} p-4`}>
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{x.label}</p>
            <p className="mt-2 text-2xl font-bold text-[#1E1810]">{x.value}</p>
          </div>
        ))}
      </div>

      {queryError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">{queryError}</div>
      ) : (
        <>
          {searchNote ? (
            <div className="mb-4 rounded-2xl border border-[#E8DFD0] bg-[#FAF7F2]/90 p-3 text-xs text-[#5C5346]">{searchNote}</div>
          ) : null}
          <p className="mb-3 text-xs text-[#7A7164]">
            Cross-entity lookup:{" "}
            <Link href="/admin/ops" className="font-bold text-[#6B5B2E] underline">
              Customer ops search →
            </Link>{" "}
            (listings + Tienda orders in one pass).
          </p>
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
              className="w-full rounded-2xl border border-[#E8DFD0] bg-white px-4 py-2.5 text-sm text-[#1E1810] placeholder:text-[#9A9084] focus:border-[#C9B46A] focus:outline-none focus:ring-2 focus:ring-[#D4BC6A]/50"
            />
            <p className="mt-1.5 text-xs text-[#7A7164]">
              Mostrando {filteredRows.length} cuenta{filteredRows.length !== 1 ? "s" : ""}.
            </p>
          </form>

          {filteredRows.length === 0 ? (
            <div className="rounded-2xl border border-[#E8DFD0] bg-[#FAF7F2]/80 p-6 text-sm text-[#5C5346]">
              {searchQuery ? "Ningún cliente coincide con la búsqueda." : "Aún no hay clientes."}
            </div>
          ) : (
            <>
              <div className={`hidden md:block ${adminTableWrap}`}>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#E8DFD0] bg-[#FAF7F2]/90">
                      <th className="p-2.5 pr-3 font-semibold text-[#5C4E2E] whitespace-nowrap">Cuenta #</th>
                      <th className="p-2.5 font-semibold text-[#5C4E2E] min-w-[120px]">Nombre</th>
                      <th className="p-2.5 font-semibold text-[#5C4E2E] min-w-[140px]">Correo</th>
                      <th className="p-2.5 font-semibold text-[#5C4E2E] whitespace-nowrap">Teléfono</th>
                      <th className="p-2.5 font-semibold text-[#5C4E2E]">Ciudad</th>
                      <th className="p-2.5 font-semibold text-[#5C4E2E] whitespace-nowrap">Tipo</th>
                      <th className="p-2.5 font-semibold text-[#5C4E2E] whitespace-nowrap">Membresía</th>
                      <th className="p-2.5 font-semibold text-[#5C4E2E] whitespace-nowrap">Newsletter</th>
                      <th className="p-2.5 font-semibold text-[#5C4E2E] whitespace-nowrap">Fecha</th>
                      <th className="p-2.5 font-semibold text-[#5C4E2E] whitespace-nowrap">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row) => (
                      <tr key={row.id} className={`border-b border-[#E8DFD0]/50 ${row.is_disabled ? "opacity-60" : ""}`}>
                        <td className="p-2.5 pr-3 font-mono text-xs text-[#6B5B2E] whitespace-nowrap">
                          {accountRefFromId(row.id)}
                        </td>
                        <td className="p-2.5 min-w-0 max-w-[200px]">
                          <Link
                            href={`/admin/usuarios/${row.id}`}
                            className="truncate block font-semibold text-[#2A2620] underline decoration-[#C9B46A]/50"
                          >
                            {displayName(row)}
                          </Link>
                          {row.owned_city_slug?.trim() && (
                            <span className="block text-xs text-[#7A7164] mt-0.5 truncate">{row.owned_city_slug.trim()}</span>
                          )}
                        </td>
                        <td className="p-2.5 text-[#3D3428] min-w-0 max-w-[180px] truncate" title={correo(row)}>
                          {correo(row)}
                        </td>
                        <td className="p-2.5 text-[#3D3428] whitespace-nowrap">{row.phone ?? "—"}</td>
                        <td className="p-2.5 text-[#3D3428] whitespace-nowrap">{row.home_city ?? "—"}</td>
                        <td className="p-2.5 text-[#3D3428] whitespace-nowrap">{row.account_type ?? "—"}</td>
                        <td className="p-2.5 text-[#3D3428] whitespace-nowrap">{membresia(row.membership_tier)}</td>
                        <td className="p-2.5 text-[#3D3428] whitespace-nowrap">{newsletterLabel(row.newsletter_opt_in)}</td>
                        <td className="p-2.5 text-[#7A7164] whitespace-nowrap">{formatDate(row.created_at)}</td>
                        <AdminUserActions userId={row.id} disabled={row.is_disabled} />
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {filteredRows.map((row) => (
                  <div key={row.id} className={`${adminCardBase} p-4`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-[#1E1810] min-w-0 truncate">{displayName(row)}</div>
                      <span className="font-mono text-xs text-[#6B5B2E] flex-shrink-0">#{accountRefFromId(row.id)}</span>
                    </div>
                    <div className="mt-2 grid grid-cols-1 gap-1 text-sm text-[#5C5346]">
                      <span>Correo: {correo(row)}</span>
                      <span>Teléfono: {row.phone ?? "—"}</span>
                      <span>Ciudad: {row.home_city ?? "—"}</span>
                      <span>Membresía: {membresia(row.membership_tier)}</span>
                    </div>
                    <div className="mt-3">
                      <Link
                        href={`/admin/usuarios/${row.id}`}
                        className="inline-flex rounded-xl border border-[#C9B46A]/40 bg-[#FBF7EF] px-4 py-2 text-sm font-semibold text-[#5C4E2E]"
                      >
                        Ver cliente
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      <div className="mt-8">
        <Link href="/admin" className="text-sm font-semibold text-[#2A2620] underline">
          ← Dashboard
        </Link>
      </div>
    </>
  );
}
