import Link from "next/link";
import { Suspense } from "react";
import { AdminPageHeader } from "../../_components/AdminPageHeader";
import {
  adminCardBase,
  adminBtnSecondary,
  adminInputClass,
  adminReadOnlyBadgeClass,
  adminStubBadgeClass,
  adminCtaChipSecondary,
  adminBtnPrimary,
} from "../../_components/adminTheme";
import { getSupabaseAuthUsersDashboardUrl } from "../../_lib/supabaseDashboardLinks";
import { getAdminSupabase } from "@/app/lib/supabase/server";
import { createSupportTicketRecordAction } from "../../supportTicketActions";

export const dynamic = "force-dynamic";

type TicketRow = {
  id: string;
  subject: string;
  body: string;
  status: string;
  created_at: string;
  user_id: string | null;
  order_id: string | null;
  listing_id: string | null;
};

async function fetchSupportTickets(): Promise<{
  rows: TicketRow[];
  unavailable: boolean;
  /** False when FK columns from 20260408200000 are not applied — list still loads; optional form links need migration. */
  entityLinksAvailable: boolean;
}> {
  try {
    const supabase = getAdminSupabase();
    const full = await supabase
      .from("support_tickets")
      .select("id, subject, body, status, created_at, user_id, order_id, listing_id")
      .order("created_at", { ascending: false })
      .limit(30);

    if (!full.error && full.data) {
      return {
        rows: (full.data ?? []) as TicketRow[],
        unavailable: false,
        entityLinksAvailable: true,
      };
    }

    const msg = (full.error?.message ?? "").toLowerCase();
    const schemaMissing = /column|does not exist|schema cache/i.test(msg);

    if (schemaMissing) {
      const base = await supabase
        .from("support_tickets")
        .select("id, subject, body, status, created_at")
        .order("created_at", { ascending: false })
        .limit(30);
      if (base.error) {
        return { rows: [], unavailable: true, entityLinksAvailable: false };
      }
      const rows = (base.data ?? []).map((r) => ({
        ...(r as Omit<TicketRow, "user_id" | "order_id" | "listing_id">),
        user_id: null,
        order_id: null,
        listing_id: null,
      }));
      return { rows, unavailable: false, entityLinksAvailable: false };
    }

    return { rows: [], unavailable: true, entityLinksAvailable: false };
  } catch {
    return { rows: [], unavailable: true, entityLinksAvailable: false };
  }
}

async function SupportTicketsSection(props: {
  searchParams?: Promise<{ ticket_saved?: string; ticket_error?: string }>;
}) {
  const sp = props.searchParams ? await props.searchParams : {};
  const { rows: tickets, unavailable, entityLinksAvailable } = await fetchSupportTickets();
  const authDashboardUrl = getSupabaseAuthUsersDashboardUrl();

  return (
    <>
      {!unavailable && !entityLinksAvailable ? (
        <div className={`${adminCardBase} mb-4 border-amber-200 bg-amber-50/90 p-3 text-sm text-amber-950`}>
          <strong>Enlaces de contexto no activos:</strong> la tabla existe, pero faltan columnas{" "}
          <code className="rounded bg-white/80 px-1">user_id</code> / <code className="rounded bg-white/80 px-1">order_id</code> /{" "}
          <code className="rounded bg-white/80 px-1">listing_id</code>. Aplica{" "}
          <code className="rounded bg-white/80 px-1">20260408200000_support_tickets_entity_links.sql</code> para enlaces y
          campos opcionales en el formulario.
        </div>
      ) : null}
      {sp.ticket_saved === "1" ? (
        <div className={`${adminCardBase} mb-4 border-emerald-200 bg-emerald-50/90 p-3 text-sm text-emerald-950`}>
          Ticket interno guardado.
        </div>
      ) : null}
      {sp.ticket_error === "1" ? (
        <div className={`${adminCardBase} mb-4 border-amber-200 bg-amber-50/90 p-3 text-sm text-amber-950`}>
          No se pudo guardar — aplica migraciones de control center (p. ej.{" "}
          <code className="rounded bg-white/80 px-1">20260408183000_control_center_extensions.sql</code>,{" "}
          <code className="rounded bg-white/80 px-1">20260408200000_support_tickets_entity_links.sql</code>) o revisa Supabase.
        </div>
      ) : null}

      <div className="mb-3 flex flex-wrap gap-2">
        <span className={adminReadOnlyBadgeClass}>Operador</span>
        {unavailable ? (
          <span className={adminStubBadgeClass}>Tickets: tabla no disponible</span>
        ) : (
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-900">
            Tickets: support_tickets
          </span>
        )}
      </div>
      <AdminPageHeader
        title="Support"
        subtitle="Búsqueda de cuentas y colas reales: Users, Ops y Reportes. Los tickets aquí son un log interno mínimo — no sustituyen un helpdesk público."
        helperText="Habilitar/deshabilitar cuenta: Users → ficha. Contraseña: solo vía Supabase Auth o flujo seguro, no desde este panel."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <form className={`${adminCardBase} p-6`} action="/admin/ops" method="get">
          <h2 className="text-sm font-bold text-[#1E1810]">Unified records search</h2>
          <p className="mt-1 text-xs text-[#7A7164]">
            Cuenta + anuncios Clasificados + pedidos Tienda en una pasada (límite por sección).
          </p>
          <label className="mt-4 block text-xs font-semibold text-[#5C5346]" htmlFor="support-ops-q">
            Query
          </label>
          <input id="support-ops-q" name="q" className={`${adminInputClass} mt-1`} placeholder="UUID, email, listing id, order ref…" />
          <button type="submit" className={`${adminBtnSecondary} mt-3 w-full min-h-[44px] justify-center sm:min-h-0`}>
            Open Customer ops →
          </button>
        </form>

        <form className={`${adminCardBase} p-6`} action="/admin/usuarios" method="get">
          <h2 className="text-sm font-bold text-[#1E1810]">Quick user lookup</h2>
          <p className="mt-1 text-xs text-[#7A7164]">Solo perfiles — lista y detalle existentes.</p>
          <label className="mt-4 block text-xs font-semibold text-[#5C5346]" htmlFor="support-user-q">
            Query
          </label>
          <input id="support-user-q" name="q" className={`${adminInputClass} mt-1`} placeholder="Email, ref, name…" />
          <button type="submit" className={`${adminBtnSecondary} mt-3 w-full min-h-[44px] justify-center sm:min-h-0`}>
            Open in Users →
          </button>
        </form>

        <div className={`${adminCardBase} p-6 lg:col-span-2`}>
          <h2 className="text-sm font-bold text-[#1E1810]">Log interno de tickets</h2>
          <p className="mt-1 text-xs text-[#7A7164]">
            Registro mínimo en base para seguimiento del equipo — sin portal para usuarios finales.
          </p>
          {unavailable ? (
            <p className="mt-3 text-sm text-amber-900">
              Tabla <code className="rounded bg-white/80 px-1">support_tickets</code> no disponible.
            </p>
          ) : (
            <form action={createSupportTicketRecordAction} className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-[#5C5346]" htmlFor="ticket-subject">
                  Asunto
                </label>
                <input id="ticket-subject" name="subject" required className={`${adminInputClass} mt-1`} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-[#5C5346]" htmlFor="ticket-body">
                  Detalle
                </label>
                <textarea id="ticket-body" name="body" required rows={4} className={`${adminInputClass} mt-1`} />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#5C5346]" htmlFor="ticket-user-id">
                  Usuario (UUID, opcional)
                </label>
                <input
                  id="ticket-user-id"
                  name="user_id"
                  placeholder="profiles.id"
                  disabled={!entityLinksAvailable}
                  className={`${adminInputClass} mt-1 font-mono text-xs disabled:opacity-60`}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#5C5346]" htmlFor="ticket-order-id">
                  Pedido Tienda (UUID, opcional)
                </label>
                <input
                  id="ticket-order-id"
                  name="order_id"
                  placeholder="tienda_orders.id"
                  disabled={!entityLinksAvailable}
                  className={`${adminInputClass} mt-1 font-mono text-xs disabled:opacity-60`}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-[#5C5346]" htmlFor="ticket-listing-id">
                  Anuncio Clasificados (UUID, opcional)
                </label>
                <input
                  id="ticket-listing-id"
                  name="listing_id"
                  placeholder="listings.id"
                  disabled={!entityLinksAvailable}
                  className={`${adminInputClass} mt-1 font-mono text-xs disabled:opacity-60`}
                />
              </div>
              <div className="sm:col-span-2">
                <button type="submit" className={`${adminBtnPrimary} w-full justify-center sm:w-auto`}>
                  Guardar ticket interno
                </button>
              </div>
            </form>
          )}

          {!unavailable && tickets.length > 0 ? (
            <div className={`${adminCardBase} mt-6 overflow-hidden p-0`}>
              <div className="border-b border-[#E8DFD0]/80 bg-[#FAF7F2]/90 px-4 py-2 text-xs font-semibold text-[#5C5346]">
                Recientes
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead className="bg-[#FBF7EF]/90 text-left text-xs font-bold uppercase text-[#7A7164]">
                    <tr>
                      <th className="p-3">Asunto</th>
                      <th className="p-3">Contexto</th>
                      <th className="p-3">Estado</th>
                      <th className="p-3">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((t) => (
                      <tr key={t.id} className="border-t border-[#E8DFD0]/80">
                        <td className="p-3">
                          <p className="font-semibold text-[#1E1810]">{t.subject}</p>
                          <p className="mt-1 line-clamp-2 text-xs text-[#7A7164]">{t.body}</p>
                        </td>
                        <td className="p-3 align-top text-xs">
                          <div className="flex flex-col gap-1.5 text-[#5C5346]">
                            {t.user_id ? (
                              <Link href={`/admin/usuarios/${t.user_id}`} className="font-bold text-[#6B5B2E] underline">
                                Usuario
                              </Link>
                            ) : null}
                            {t.listing_id ? (
                              <>
                                <Link
                                  href={`/admin/workspace/clasificados?q=${encodeURIComponent(t.listing_id)}`}
                                  className="font-bold text-[#6B5B2E] underline"
                                >
                                  Anuncio (cola)
                                </Link>
                                <Link
                                  href={`/clasificados/anuncio/${t.listing_id}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[#6B5B2E] underline"
                                >
                                  Vista pública ↗
                                </Link>
                              </>
                            ) : null}
                            {t.order_id ? (
                              <Link href={`/admin/tienda/orders/${t.order_id}`} className="font-bold text-[#6B5B2E] underline">
                                Pedido Tienda
                              </Link>
                            ) : null}
                            {!t.user_id && !t.listing_id && !t.order_id ? (
                              <span className="text-[#9A9084]">—</span>
                            ) : null}
                          </div>
                        </td>
                        <td className="p-3 text-xs font-semibold">{t.status}</td>
                        <td className="p-3 text-xs text-[#7A7164]">
                          {t.created_at ? new Date(t.created_at).toLocaleString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : !unavailable ? (
            <p className="mt-4 text-xs text-[#7A7164]">Aún no hay tickets en la tabla.</p>
          ) : null}
        </div>

        <div className={`${adminCardBase} p-6 lg:col-span-2`}>
          <h2 className="text-sm font-bold text-[#1E1810]">Escalation tags</h2>
          <p className="mt-1 text-xs text-[#7A7164]">
            <span className="mr-2 inline-block rounded-full border border-[#E8DFD0] bg-[#FFFCF7] px-2 py-0.5 text-[10px] font-bold uppercase text-[#5C4E2E]">
              Solo UI
            </span>
            Para enrutamiento futuro — no se guardan.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {["Billing", "Technical", "Fraud", "Content"].map((t) => (
              <span
                key={t}
                className="rounded-full border border-[#E8DFD0] bg-[#FFFCF7] px-3 py-1 text-xs font-bold text-[#3D3428]"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className={`${adminCardBase} mt-8 p-6`}>
        <h2 className="text-sm font-bold text-[#1E1810]">Acciones de cuenta (sin atajos mágicos)</h2>
        <p className="mt-1 text-xs leading-relaxed text-[#7A7164]">
          <strong className="text-[#1E1810]">Desbloquear / bloquear:</strong> usa{" "}
          <Link href="/admin/usuarios" className="font-bold text-[#6B5B2E] underline">
            Users
          </Link>{" "}
          → ficha del cliente → <strong>Habilitar</strong> o <strong>Deshabilitar</strong> (acción real en base).
        </p>
        <p className="mt-3 text-xs leading-relaxed text-[#7A7164]">
          <strong className="text-[#1E1810]">Contraseña / magic link:</strong> no se generan enlaces en este navegador por seguridad.
          Usa el panel de Supabase Auth para enviar recuperación o invitación.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link href="/admin/usuarios" className={`${adminCtaChipSecondary} justify-center`}>
            Ir a Users →
          </Link>
          {authDashboardUrl ? (
            <a
              href={authDashboardUrl}
              target="_blank"
              rel="noreferrer"
              className={`${adminCtaChipSecondary} justify-center`}
              title="Abre el listado de usuarios Auth del proyecto (contraseña, email, etc.)"
            >
              Supabase Auth · Users ↗
            </a>
          ) : (
            <span className="text-xs text-[#9A9084]">Configura NEXT_PUBLIC_SUPABASE_URL para enlazar al dashboard.</span>
          )}
        </div>
        <p className="mt-4 text-xs font-semibold text-[#7A7164]">
          Réplica “como el usuario” / modo remoto:{" "}
          <span className="rounded-full border border-[#E8DFD0] bg-[#FAF7F2] px-2 py-0.5 text-[10px] font-bold uppercase text-[#5C4E2E]">
            No disponible
          </span>{" "}
          — fuera de alcance por seguridad y cookies.
        </p>
        <div className="mt-6">
          <label className="text-xs font-semibold text-[#5C5346]">Internal notes (local only — not saved)</label>
          <textarea
            className={`${adminInputClass} mt-1 min-h-[100px]`}
            disabled
            placeholder="Futuro: notas internas cifradas + audit trail."
          />
        </div>
      </div>

      <div className="mt-6">
        <Link href="/admin/reportes" className={`${adminCtaChipSecondary} inline-flex`}>
          Open reports queue →
        </Link>
      </div>
    </>
  );
}

export default function AdminSupportPage(props: {
  searchParams?: Promise<{ ticket_saved?: string; ticket_error?: string }>;
}) {
  return (
    <div>
      <Suspense fallback={<div className="p-6 text-sm text-[#5C5346]">Cargando Support…</div>}>
        <SupportTicketsSection searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
