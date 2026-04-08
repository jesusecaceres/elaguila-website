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

  return (
    <div className="max-w-5xl space-y-8">
      <AdminPageHeader
        eyebrow="Operations"
        title="Customer & records search"
        subtitle="One query across profiles, Clasificados listings, and Tienda orders. Deep links open the existing admin surfaces — nothing here pretends to be a full CRM yet."
        helperText="Identifiers: account UUID, partial UUID, XXXX-YYYY-style ref (matched within recent profiles), name/email/phone fragments, listing id, order id, order_ref text, customer email on orders. Results are capped per section."
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
          {(pErr || lErr || oErr) && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950">
              {pErr ? <p>Profiles: {pErr}</p> : null}
              {lErr ? <p>Listings: {lErr}</p> : null}
              {oErr ? <p>Tienda orders: {oErr}</p> : null}
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
              <Link
                href={`/admin/workspace/clasificados?q=${encodeURIComponent(q)}`}
                className="font-bold text-[#6B5B2E] underline"
              >
                Open Clasificados workspace with same q →
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
                          <td className="max-w-[200px] truncate p-2 text-[#1E1810]" title={row.title ?? ""}>
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
                          <td className="p-2">
                            <Link
                              href={`/clasificados/anuncio/${row.id}`}
                              target="_blank"
                              className="text-xs font-bold text-[#6B5B2E] underline"
                            >
                              Live
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

          <section className={`${adminCardBase} border-dashed border-[#C9B46A]/50 bg-[#FFF8F0]/80 p-4 text-xs text-[#5C5346]`}>
            <p className="font-semibold text-[#1E1810]">Reports & moderation</p>
            <p className="mt-1">
              User-submitted reports live in <code className="rounded bg-white/80 px-1">listing_reports</code>.{" "}
              <Link href="/admin/reportes" className="font-bold text-[#6B5B2E] underline">
                Open reports queue →
              </Link>
            </p>
          </section>
        </>
      ) : null}
    </div>
  );
}
