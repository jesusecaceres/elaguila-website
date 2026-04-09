import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { requireAdminCookie } from "@/app/lib/supabase/server";
import { AdminPageHeader } from "../../_components/AdminPageHeader";
import { adminCardBase, adminTableWrap, adminBtnSecondary, adminCtaChipCompact } from "../../_components/adminTheme";
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
        subtitle="Una sola búsqueda agrupa cuenta, anuncios, pedidos Tienda y reportes. Los enlaces abren las pantallas ya existentes; aquí no hay suplantación ni CRM completo."
        helperText="UUID de cuenta, nombre, correo, teléfono, listing id (misma UUID pública en /clasificados/anuncio/[id]), id de reporte, order id, order_ref o email de pedido. Si solo cae un perfil, verás un resumen de contexto (conteos) debajo."
      />

      <form method="get" className={`${adminCardBase} space-y-3 p-5`} aria-describedby="ops-search-hint">
        <label htmlFor="ops-q" className="text-sm font-semibold text-[#5C5346]">
          Búsqueda unificada
        </label>
        <input
          id="ops-q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Email, phone, name, account id, listing id, order id, order ref…"
          className="w-full rounded-2xl border border-[#E8DFD0] bg-white px-4 py-3 text-base text-[#1E1810] placeholder:text-[#9A9084] focus:border-[#C9B46A] focus:outline-none focus:ring-2 focus:ring-[#D4BC6A]/50 sm:text-sm"
          aria-describedby="ops-search-hint"
          autoComplete="off"
        />
        <p id="ops-search-hint" className="text-[10px] leading-snug text-[#7A7164]">
          Misma búsqueda en perfiles, anuncios, pedidos Tienda y reportes (límite por sección). No es CRM ni suplantación.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            className="min-h-[44px] rounded-2xl bg-[#2A2620] px-4 py-2.5 text-sm font-semibold text-[#FAF7F2] sm:min-h-0"
            title="Ejecutar búsqueda y mostrar resultados en esta página"
          >
            Buscar
          </button>
          <Link
            href="/admin/ops"
            className={`${adminBtnSecondary} inline-flex min-h-[44px] items-center sm:min-h-0`}
            title="Quitar término y volver al estado inicial"
          >
            Limpiar
          </Link>
          <Link
            href="/admin/usuarios"
            className={`${adminBtnSecondary} inline-flex min-h-[44px] items-center sm:min-h-0`}
            title="Solo la lista de usuarios (misma cookie admin; no incluye pedidos ni reportes)"
          >
            Solo Users →
          </Link>
        </div>
      </form>

      {!q ? (
        <p className="text-sm text-[#5C5346]">Enter a term to search across accounts, ads, and print orders.</p>
      ) : bundle ? (
        <>
          <nav
            aria-label="Saltar a sección de resultados"
            className={`${adminCardBase} flex flex-col gap-2 p-3 sm:flex-row sm:flex-wrap sm:items-center`}
          >
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">En esta página</span>
            <div className="flex min-w-0 flex-wrap gap-2">
              <a href="#ops-profiles" className={adminCtaChipCompact}>
                Perfiles
              </a>
              <a href="#ops-context" className={adminCtaChipCompact}>
                Contexto
              </a>
              <a href="#ops-listings" className={adminCtaChipCompact}>
                Anuncios
              </a>
              <a href="#ops-orders" className={adminCtaChipCompact}>
                Tienda
              </a>
              <a href="#ops-reports" className={adminCtaChipCompact}>
                Reportes
              </a>
              <a href="#ops-support-tickets" className={adminCtaChipCompact}>
                Tickets
              </a>
              <a href="#ops-shortcuts" className={adminCtaChipCompact}>
                Atajos
              </a>
            </div>
          </nav>

          {(pErr || lErr || oErr || rErr) && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950">
              {pErr ? <p>Profiles: {pErr}</p> : null}
              {lErr ? <p>Listings: {lErr}</p> : null}
              {oErr ? <p>Tienda orders: {oErr}</p> : null}
              {rErr ? <p>Reports: {rErr}</p> : null}
            </div>
          )}

          <section id="ops-profiles" className={`${adminCardBase} scroll-mt-24 p-5`}>
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

          <section id="ops-context" className={`${adminCardBase} scroll-mt-24 p-5`}>
            <h2 className="text-base font-bold text-[#1E1810]">Customer context (solo lectura)</h2>
            <p className="mt-1 text-xs text-[#7A7164]">
              Aparece cuando hay exactamente un perfil en la búsqueda. Conteos en vivo; no es vista “como el usuario” ni
              impersonación.
            </p>
            {!bundle.supportContext ? (
              <p className="mt-3 text-sm text-[#5C5346]">
                {bundle.profiles.rows.length === 0
                  ? "Sin perfil único para resumir."
                  : bundle.profiles.rows.length > 1
                    ? "Varios perfiles coinciden — abre el detalle o acota la búsqueda."
                    : "Sin datos de contexto (error de lectura o perfil ausente)."}
              </p>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[#E8DFD0]/80 bg-[#FFFCF7]/90 p-3 text-sm">
                  <p className="font-semibold text-[#1E1810]">{bundle.supportContext.displayName}</p>
                  <p className="mt-1 text-xs text-[#7A7164] break-all">UUID: {bundle.supportContext.profileId}</p>
                  <p className="text-xs text-[#7A7164]">{bundle.supportContext.email ?? "—"}</p>
                  <p className="text-xs text-[#7A7164]">{bundle.supportContext.phone ?? "—"}</p>
                  <Link
                    href={`/admin/usuarios/${bundle.supportContext.profileId}`}
                    className="mt-2 inline-block text-xs font-bold text-[#6B5B2E] underline"
                  >
                    Ficha completa →
                  </Link>
                </div>
                <ul className="space-y-2 text-sm text-[#5C5346]">
                  <li>
                    Anuncios (owner):{" "}
                    <strong className="text-[#1E1810]">{bundle.supportContext.listingsTotal}</strong> · pending/flagged:{" "}
                    <strong className="text-[#1E1810]">{bundle.supportContext.listingsPendingOrFlagged}</strong>{" "}
                    <Link
                      href={`/admin/workspace/clasificados?q=${encodeURIComponent(bundle.supportContext.profileId)}`}
                      className="font-bold text-[#6B5B2E] underline"
                    >
                      Cola →
                    </Link>
                  </li>
                  <li>
                    Reportes como reporter:{" "}
                    <strong className="text-[#1E1810]">{bundle.supportContext.reportsAsReporter}</strong>{" "}
                    <Link
                      href={`/admin/reportes?q=${encodeURIComponent(bundle.supportContext.profileId)}`}
                      className="font-bold text-[#6B5B2E] underline"
                    >
                      Cola (como reporter) →
                    </Link>
                  </li>
                  <li>
                    Pedidos Tienda (email coincidente):{" "}
                    <strong className="text-[#1E1810]">{bundle.supportContext.tiendaOrdersMatchingEmail}</strong>
                    {bundle.supportContext.email?.trim() ? (
                      <>
                        {" "}
                        <Link
                          href={`/admin/tienda/orders?q=${encodeURIComponent(bundle.supportContext.email!.trim())}`}
                          className="font-bold text-[#6B5B2E] underline"
                        >
                          Inbox →
                        </Link>
                      </>
                    ) : (
                      <span className="text-xs text-[#9A9084]"> · sin email en perfil</span>
                    )}
                  </li>
                  <li id="ops-support-tickets" className="scroll-mt-24">
                    Tickets internos{" "}
                    <span className="font-mono text-[10px] text-[#7A7164]">(support_tickets.user_id)</span>:{" "}
                    {bundle.supportContext.supportTicketsUnavailable ? (
                      <span className="text-xs text-amber-900">
                        No disponible (tabla o columna <span className="font-mono">user_id</span>).
                      </span>
                    ) : (
                      <>
                        total <strong className="text-[#1E1810]">{bundle.supportContext.supportTicketsTotal}</strong>
                        {" · "}
                        abiertos / en curso{" "}
                        <strong className="text-[#1E1810]">{bundle.supportContext.supportTicketsOpen}</strong>
                        {" · "}
                        <Link
                          href={`/admin/support?profile=${encodeURIComponent(bundle.supportContext.profileId)}`}
                          className="font-bold text-[#6B5B2E] underline"
                        >
                          Support (filtrado) →
                        </Link>
                      </>
                    )}
                  </li>
                </ul>
              </div>
            )}
          </section>

          <section id="ops-listings" className={`${adminCardBase} scroll-mt-24 p-5`}>
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

          <section id="ops-orders" className={`${adminCardBase} scroll-mt-24 p-5`}>
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

          <section id="ops-reports" className={`${adminCardBase} scroll-mt-24 p-5`}>
            <h2 className="text-base font-bold text-[#1E1810]">Reportes de anuncios</h2>
            <p className="mt-1 text-xs text-[#7A7164]">
              Tabla <code className="rounded bg-[#FAF7F2] px-1">listing_reports</code>. Coincidencias por id de reporte, listing id o texto en el motivo.{" "}
              <Link
                href={q ? `/admin/reportes?q=${encodeURIComponent(q)}` : "/admin/reportes"}
                className="font-bold text-[#6B5B2E] underline"
              >
                {q ? "Abrir cola con esta búsqueda →" : "Cola completa →"}
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
                      {row.reporter_id ? (
                        <p className="mt-1 text-[10px] text-[#7A7164]">
                          Reporter:{" "}
                          <Link href={`/admin/usuarios/${row.reporter_id}`} className="font-bold text-[#6B5B2E] underline">
                            {row.reporter_id.slice(0, 8)}…
                          </Link>
                        </p>
                      ) : null}
                      <p className="text-[10px] text-[#9A9084]">
                        {row.status ?? "—"} · {row.created_at ? new Date(row.created_at).toLocaleString() : "—"}
                      </p>
                    </div>
                    <Link
                      href={`/admin/reportes?q=${encodeURIComponent(row.id)}`}
                      className="shrink-0 text-xs font-bold text-[#6B5B2E] underline"
                    >
                      Abrir en cola →
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section
            id="ops-shortcuts"
            className={`${adminCardBase} scroll-mt-24 border-dashed border-[#C9B46A]/50 bg-[#FFF8F0]/80 p-4 text-xs text-[#5C5346]`}
          >
            <p className="font-semibold text-[#1E1810]">Atajos</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Link href="/admin/usuarios" className={`${adminCtaChipCompact} w-full justify-center sm:w-auto`}>
                Usuarios
              </Link>
              <Link href="/admin/reportes" className={`${adminCtaChipCompact} w-full justify-center sm:w-auto`}>
                Reportes
              </Link>
              <Link href="/admin/workspace/clasificados" className={`${adminCtaChipCompact} w-full justify-center sm:w-auto`}>
                Clasificados
              </Link>
              <Link href="/admin/tienda/orders" className={`${adminCtaChipCompact} w-full justify-center sm:w-auto`}>
                Pedidos Tienda
              </Link>
              <Link href="/admin/support" className={`${adminCtaChipCompact} w-full justify-center sm:w-auto`}>
                Support / tickets
              </Link>
              <Link href="/admin/categories" className={`${adminCtaChipCompact} w-full justify-center sm:w-auto`}>
                Categorías
              </Link>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
