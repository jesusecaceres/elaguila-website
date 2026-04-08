import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { requireAdminCookie } from "@/app/lib/supabase/server";
import { AdminPageHeader } from "../../_components/AdminPageHeader";
import { adminCardBase, adminTableWrap, adminBtnSecondary } from "../../_components/adminTheme";
import { runAdminUnifiedSearch } from "../../_lib/adminOpsUnifiedSearch";

export const dynamic = "force-dynamic";

function accountRefFromId(id: string): string {
  const s = (id ?? "").replace(/-/g, "").trim();
  if (s.length < 8) return "—";
  return `${s.slice(0, 4).toUpperCase()}-${s.slice(-4).toUpperCase()}`;
}

type PageProps = {
  searchParams?: Promise<{ q?: string | string[] }>;
};

export default async function AdminCustomerOpsPage(props: PageProps) {
  const cookieStore = await cookies();
  if (!requireAdminCookie(cookieStore)) {
    redirect("/admin/login");
  }

  const sp = props.searchParams ? await props.searchParams : {};
  const qRaw = typeof sp.q === "string" ? sp.q : Array.isArray(sp.q) ? (sp.q[0] ?? "") : "";
  const q = qRaw.trim();

  const bundle = q ? await runAdminUnifiedSearch(q) : null;

  const pErr = bundle?.profiles.error ?? null;
  const lErr = bundle?.listings.error ?? null;
  const oErr = bundle?.orders.error ?? null;
  const rErr = bundle?.reports.error ?? null;

  return (
    <div className="max-w-5xl space-y-8">
      <AdminPageHeader
        eyebrow="Operations"
        title="Customer & records search"
        subtitle="One query across profiles, Clasificados listings, and Tienda orders. Deep links open the existing admin surfaces — nothing here pretends to be a full CRM yet."
        helperText="Busca por UUID de cuenta, fragmento de UUID, nombre, correo, teléfono, listing id (UUID público de /clasificados/anuncio/[id]), id de reporte, order id, order_ref o email del pedido Tienda. Los anuncios no usan otro slug numérico hoy: el id de Supabase es la referencia estable."
      />

      <form method="get" className={`${adminCardBase} space-y-3 p-5`}>
        <label htmlFor="ops-q" className="text-sm font-semibold text-[#5C5346]">
          Search
        </label>
        <input
          id="ops-q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Email, phone, name, account id, listing id, order id, order ref…"
          className="w-full rounded-2xl border border-[#E8DFD0] bg-white px-4 py-3 text-base text-[#1E1810] placeholder:text-[#9A9084] focus:border-[#C9B46A] focus:outline-none focus:ring-2 focus:ring-[#D4BC6A]/50 sm:text-sm"
        />
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="rounded-2xl bg-[#2A2620] px-4 py-2.5 text-sm font-semibold text-[#FAF7F2]">
            Search
          </button>
          <Link href="/admin/ops" className={`${adminBtnSecondary} inline-flex items-center`}>
            Clear
          </Link>
          <Link href="/admin/usuarios" className={`${adminBtnSecondary} inline-flex items-center`}>
            Users list only →
          </Link>
        </div>
      </form>

      {!q ? (
        <p className="text-sm text-[#5C5346]">Enter a term to search across accounts, ads, and print orders.</p>
      ) : bundle ? (
        <>
          {(pErr || lErr || oErr || rErr) && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950">
              {pErr ? <p>Profiles: {pErr}</p> : null}
              {lErr ? <p>Listings: {lErr}</p> : null}
              {oErr ? <p>Tienda orders: {oErr}</p> : null}
              {rErr ? <p>Reports: {rErr}</p> : null}
            </div>
          )}

          <section className={`${adminCardBase} p-5`}>
            <h2 className="text-base font-bold text-[#1E1810]">Profiles</h2>
            <p className="mt-1 text-xs text-[#7A7164]">
              Strategy: {bundle.profiles.strategy === "server_search" ? "Postgres match" : "—"} ·{" "}
              <Link href={`/admin/usuarios?q=${encodeURIComponent(q)}`} className="font-bold text-[#6B5B2E] underline">
                Open in Users table →
              </Link>
            </p>
            {bundle.profiles.rows.length === 0 ? (
              <p className="mt-3 text-sm text-[#5C5346]">No profile rows matched.</p>
            ) : (
              <ul className="mt-4 space-y-2 text-sm">
                {bundle.profiles.rows.map((row) => {
                  const id = String(row.id ?? "");
                  const name = String(row.display_name ?? "").trim() || "(sin nombre)";
                  const email = String(row.email ?? "").trim() || "—";
                  return (
                    <li key={id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#E8DFD0]/80 bg-[#FFFCF7]/90 px-3 py-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-[#1E1810]">{name}</p>
                        <p className="text-xs text-[#7A7164]">
                          {email} · {String(row.phone ?? "—")} · #{accountRefFromId(id)}
                        </p>
                      </div>
                      <Link href={`/admin/usuarios/${id}`} className="shrink-0 text-xs font-bold text-[#6B5B2E] underline">
                        Profile →
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className={`${adminCardBase} p-5`}>
            <h2 className="text-base font-bold text-[#1E1810]">Clasificados listings</h2>
            <p className="mt-1 text-xs text-[#7A7164]">
              Referencia pública estable hoy: <code className="rounded bg-[#FAF7F2] px-1">listings.id</code> (UUID en URL).{" "}
              <Link
                href={`/admin/workspace/clasificados?q=${encodeURIComponent(q)}`}
                className="font-bold text-[#6B5B2E] underline"
              >
                Abrir cola Clasificados con la misma búsqueda →
              </Link>
            </p>
            {bundle.listings.rows.length === 0 ? (
              <p className="mt-3 text-sm text-[#5C5346]">No listing rows matched.</p>
            ) : (
              <div className={`mt-4 ${adminTableWrap}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-[#E8DFD0] bg-[#FAF7F2]/90">
                        <th className="p-2 font-semibold text-[#5C4E2E]">Listing id</th>
                        <th className="p-2 font-semibold text-[#5C4E2E]">Title</th>
                        <th className="p-2 font-semibold text-[#5C4E2E]">Category</th>
                        <th className="p-2 font-semibold text-[#5C4E2E]">Status</th>
                        <th className="p-2 font-semibold text-[#5C4E2E]">Owner</th>
                        <th className="p-2 font-semibold text-[#5C4E2E]"> </th>
                      </tr>
                    </thead>
                    <tbody>
                      {bundle.listings.rows.map((row) => (
                        <tr key={row.id} className="border-b border-[#E8DFD0]/60">
                          <td className="max-w-[120px] p-2 font-mono text-[10px] text-[#3D3428]" title={row.id}>
                            <span className="break-all">{row.id}</span>
                          </td>
                          <td className="max-w-[160px] truncate p-2 text-[#1E1810]" title={row.title ?? ""}>
                            {row.title ?? "—"}
                          </td>
                          <td className="p-2 text-xs">{row.category ?? "—"}</td>
                          <td className="p-2 text-xs">{row.status ?? "—"}</td>
                          <td className="p-2 font-mono text-xs">
                            {row.owner_id ? (
                              <Link href={`/admin/usuarios/${row.owner_id}`} className="text-[#6B5B2E] underline">
                                {row.owner_id.slice(0, 8)}…
                              </Link>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="space-y-1 p-2">
                            <Link
                              href={`/clasificados/anuncio/${row.id}`}
                              target="_blank"
                              className="block text-xs font-bold text-[#6B5B2E] underline"
                            >
                              Vista pública
                            </Link>
                            <Link
                              href={`/admin/workspace/clasificados?q=${encodeURIComponent(row.id)}`}
                              className="block text-xs font-bold text-[#6B5B2E] underline"
                            >
                              Cola admin
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          <section className={`${adminCardBase} p-5`}>
            <h2 className="text-base font-bold text-[#1E1810]">Tienda orders</h2>
            <p className="mt-1 text-xs text-[#7A7164]">
              <Link href={`/admin/tienda/orders?q=${encodeURIComponent(q)}`} className="font-bold text-[#6B5B2E] underline">
                Open full Tienda inbox with same q →
              </Link>
            </p>
            {bundle.orders.rows.length === 0 ? (
              <p className="mt-3 text-sm text-[#5C5346]">No order rows matched.</p>
            ) : (
              <ul className="mt-4 space-y-2 text-sm">
                {bundle.orders.rows.map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#E8DFD0]/80 bg-[#FFFCF7]/90 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-semibold text-[#1E1810]">{row.order_ref}</p>
                      <p className="text-xs text-[#7A7164]">
                        {row.customer_name} · {row.customer_email} · {row.product_slug}
                      </p>
                    </div>
                    <Link href={`/admin/tienda/orders/${row.id}`} className="shrink-0 text-xs font-bold text-[#6B5B2E] underline">
                      Order →
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={`${adminCardBase} p-5`}>
            <h2 className="text-base font-bold text-[#1E1810]">Reportes de anuncios</h2>
            <p className="mt-1 text-xs text-[#7A7164]">
              Tabla <code className="rounded bg-[#FAF7F2] px-1">listing_reports</code>. Coincidencias por id de reporte, listing id o texto en el motivo.{" "}
              <Link href="/admin/reportes" className="font-bold text-[#6B5B2E] underline">
                Cola completa →
              </Link>
            </p>
            {bundle.reports.rows.length === 0 ? (
              <p className="mt-3 text-sm text-[#5C5346]">No report rows matched.</p>
            ) : (
              <ul className="mt-4 space-y-2 text-sm">
                {bundle.reports.rows.map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-col gap-1 rounded-xl border border-[#E8DFD0]/80 bg-[#FFFCF7]/90 px-3 py-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-mono text-[#5C5346]">
                        Report <span className="font-semibold text-[#1E1810]">{row.id}</span> · listing{" "}
                        <Link
                          href={`/admin/workspace/clasificados?q=${encodeURIComponent(row.listing_id)}`}
                          className="font-bold text-[#6B5B2E] underline"
                        >
                          {row.listing_id}
                        </Link>
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-[#5C5346]">{row.reason}</p>
                      <p className="text-[10px] text-[#9A9084]">
                        {row.status ?? "—"} · {row.created_at ? new Date(row.created_at).toLocaleString() : "—"}
                      </p>
                    </div>
                    <Link href="/admin/reportes" className="shrink-0 text-xs font-bold text-[#6B5B2E] underline">
                      Moderar →
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={`${adminCardBase} border-dashed border-[#C9B46A]/50 bg-[#FFF8F0]/80 p-4 text-xs text-[#5C5346]`}>
            <p className="font-semibold text-[#1E1810]">Atajos</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-bold">
              <Link href="/admin/usuarios" className="text-[#6B5B2E] underline">
                Usuarios
              </Link>
              <Link href="/admin/reportes" className="text-[#6B5B2E] underline">
                Reportes
              </Link>
              <Link href="/admin/workspace/clasificados" className="text-[#6B5B2E] underline">
                Clasificados
              </Link>
              <Link href="/admin/tienda/orders" className="text-[#6B5B2E] underline">
                Pedidos Tienda
              </Link>
              <Link href="/admin/categories" className="text-[#6B5B2E] underline">
                Categorías
              </Link>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
