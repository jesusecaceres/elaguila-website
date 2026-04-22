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
import { createSupportTicketRecordAction, updateSupportTicketFollowupAction } from "../../supportTicketActions";

export const dynamic = "force-dynamic";

const PROFILE_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type TicketRow = {
  id: string;
  subject: string;
  body: string;
  status: string;
  created_at: string;
  updated_at: string | null;
  user_id: string | null;
  order_id: string | null;
  listing_id: string | null;
  staff_internal_notes: string | null;
  escalation_tag: string | null;
};

function schemaMissing(msg: string): boolean {
  return /column|does not exist|schema cache/i.test(msg.toLowerCase());
}

function profileFilter(raw: string | undefined): string | null {
  const t = (raw ?? "").trim();
  if (!t) return null;
  return PROFILE_UUID_RE.test(t) ? t : null;
}

async function fetchSupportTickets(profileId: string | null): Promise<{
  rows: TicketRow[];
  unavailable: boolean;
  /** False when FK columns from 20260408200000 are not applied — list still loads; optional form links need migration. */
  entityLinksAvailable: boolean;
  /** False until `20260408210000_support_tickets_staff_followup.sql` — status updates still work. */
  staffFollowupAvailable: boolean;
}> {
  try {
    const supabase = getAdminSupabase();
    const extendedSelect =
      "id, subject, body, status, created_at, updated_at, user_id, order_id, listing_id, staff_internal_notes, escalation_tag";

    let extQ = supabase.from("support_tickets").select(extendedSelect).order("created_at", { ascending: false }).limit(30);
    if (profileId) extQ = extQ.eq("user_id", profileId);
    const full = await extQ;

    if (!full.error && full.data) {
      return {
        rows: (full.data ?? []) as TicketRow[],
        unavailable: false,
        entityLinksAvailable: true,
        staffFollowupAvailable: true,
      };
    }

    const msg = full.error?.message ?? "";

    if (schemaMissing(msg)) {
      const entitySelect = "id, subject, body, status, created_at, updated_at, user_id, order_id, listing_id";
      let entQ = supabase.from("support_tickets").select(entitySelect).order("created_at", { ascending: false }).limit(30);
      if (profileId) entQ = entQ.eq("user_id", profileId);
      const ent = await entQ;

      if (!ent.error && ent.data) {
        const rows = (ent.data ?? []).map((r) => ({
          ...(r as Omit<TicketRow, "staff_internal_notes" | "escalation_tag">),
          staff_internal_notes: null,
          escalation_tag: null,
        }));
        return {
          rows,
          unavailable: false,
          entityLinksAvailable: true,
          staffFollowupAvailable: false,
        };
      }

      const entMsg = ent.error?.message ?? "";
      if (schemaMissing(entMsg)) {
        const legQ = supabase
          .from("support_tickets")
          .select("id, subject, body, status, created_at")
          .order("created_at", { ascending: false })
          .limit(30);
        const base = await legQ;
        if (base.error) {
          return { rows: [], unavailable: true, entityLinksAvailable: false, staffFollowupAvailable: false };
        }
        const rows = (base.data ?? []).map((r) => ({
          ...(r as { id: string; subject: string; body: string; status: string; created_at: string }),
          updated_at: null,
          user_id: null,
          order_id: null,
          listing_id: null,
          staff_internal_notes: null,
          escalation_tag: null,
        }));
        return { rows, unavailable: false, entityLinksAvailable: false, staffFollowupAvailable: false };
      }
    }

    return { rows: [], unavailable: true, entityLinksAvailable: false, staffFollowupAvailable: false };
  } catch {
    return { rows: [], unavailable: true, entityLinksAvailable: false, staffFollowupAvailable: false };
  }
}

async function SupportTicketsSection(props: {
  searchParams?: Promise<{
    ticket_saved?: string;
    ticket_created?: string;
    ticket_error?: string;
    followup_columns?: string;
    profile?: string;
  }>;
}) {
  const sp = props.searchParams ? await props.searchParams : {};
  const profileId = profileFilter(sp.profile);
  const profileQueryInvalid = !!(sp.profile && sp.profile.trim() && !profileId);
  const { rows: tickets, unavailable, entityLinksAvailable, staffFollowupAvailable } =
    await fetchSupportTickets(profileId);
  const authDashboardUrl = getSupabaseAuthUsersDashboardUrl();

  return (
    <>
      {profileQueryInvalid ? (
        <div className={`${adminCardBase} mb-4 border-amber-200 bg-amber-50/90 p-3 text-sm text-amber-950`}>
          Parámetro <code className="rounded bg-white/80 px-1">profile</code> no es un UUID válido — mostrando todos los tickets
          recientes.
        </div>
      ) : null}
      {profileId ? (
        <div className={`${adminCardBase} mb-4 border-sky-200 bg-sky-50/90 p-3 text-sm text-sky-950`}>
          Filtrado por usuario{" "}
          <Link href={`/admin/usuarios/${profileId}`} className="font-bold text-[#6B5B2E] underline">
            {profileId.slice(0, 8)}…
          </Link>
          .{" "}
          <Link href="/admin/support" className="font-bold text-[#6B5B2E] underline">
            Quitar filtro
          </Link>
        </div>
      ) : null}
      {!unavailable && !entityLinksAvailable ? (
        <div className={`${adminCardBase} mb-4 border-amber-200 bg-amber-50/90 p-3 text-sm text-amber-950`}>
          <strong>Enlaces de contexto no activos:</strong> la tabla existe, pero faltan columnas{" "}
          <code className="rounded bg-white/80 px-1">user_id</code> / <code className="rounded bg-white/80 px-1">order_id</code> /{" "}
          <code className="rounded bg-white/80 px-1">listing_id</code>. Aplica{" "}
          <code className="rounded bg-white/80 px-1">20260408200000_support_tickets_entity_links.sql</code> para enlaces y
          campos opcionales en el formulario.
        </div>
      ) : null}
      {!unavailable && entityLinksAvailable && !staffFollowupAvailable ? (
        <div className={`${adminCardBase} mb-4 border-amber-200 bg-amber-50/90 p-3 text-sm text-amber-950`}>
          <strong>Seguimiento parcial:</strong> puedes cambiar el <strong>estado</strong> del ticket. Las notas internas y la
          etiqueta de escalación requieren{" "}
          <code className="rounded bg-white/80 px-1">20260408210000_support_tickets_staff_followup.sql</code>.
        </div>
      ) : null}
      {sp.ticket_created === "1" ? (
        <div className={`${adminCardBase} mb-4 border-emerald-200 bg-emerald-50/90 p-3 text-sm text-emerald-950`}>
          Ticket interno creado en <code className="rounded bg-white/80 px-1">support_tickets</code>.
        </div>
      ) : null}
      {sp.ticket_saved === "1" ? (
        <div className={`${adminCardBase} mb-4 border-emerald-200 bg-emerald-50/90 p-3 text-sm text-emerald-950`}>
          {sp.followup_columns === "0" ? (
            <>
              Estado del ticket actualizado en base.{" "}
              <strong>Notas internas y etiqueta de escalación no se guardaron</strong> — aplica la migración{" "}
              <code className="rounded bg-white/80 px-1">20260408210000_support_tickets_staff_followup.sql</code>.
            </>
          ) : (
            <>Seguimiento del ticket guardado (estado / notas / escalación según migración).</>
          )}
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
        helperText="Seguimiento completo (estado + notas + escalación) requiere la migración 20260408210000_support_tickets_staff_followup.sql aplicada en Supabase; cada guardado va a admin_audit_log. Cuentas: Users → ficha; contraseña solo vía Auth."
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
          <input
            id="support-ops-q"
            name="q"
            className={`${adminInputClass} mt-1`}
            placeholder="UUID, email, listing id, order ref…"
            autoComplete="off"
            aria-describedby="support-ops-hint"
          />
          <p id="support-ops-hint" className="mt-1 text-[10px] text-[#7A7164]">
            Abre /admin/ops con tu texto en la URL; allí se cruzan perfiles, anuncios, pedidos y reportes.
          </p>
          <button
            type="submit"
            className={`${adminBtnSecondary} mt-3 w-full min-h-[44px] justify-center sm:min-h-0`}
            title="Ir a Customer ops con búsqueda unificada"
          >
            Abrir Customer ops →
          </button>
        </form>

        <form className={`${adminCardBase} p-6`} action="/admin/usuarios" method="get">
          <h2 className="text-sm font-bold text-[#1E1810]">Quick user lookup</h2>
          <p className="mt-1 text-xs text-[#7A7164]">Solo perfiles — lista y detalle existentes.</p>
          <label className="mt-4 block text-xs font-semibold text-[#5C5346]" htmlFor="support-user-q">
            Query
          </label>
          <input
            id="support-user-q"
            name="q"
            className={`${adminInputClass} mt-1`}
            placeholder="Email, ref, name…"
            autoComplete="off"
            aria-describedby="support-users-hint"
          />
          <p id="support-users-hint" className="mt-1 text-[10px] text-[#7A7164]">
            Solo la lista de perfiles; no abre Ops ni pedidos.
          </p>
          <button
            type="submit"
            className={`${adminBtnSecondary} mt-3 w-full min-h-[44px] justify-center sm:min-h-0`}
            title="Ir a /admin/usuarios con el texto de búsqueda"
          >
            Buscar en Users →
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
                <button
                  type="submit"
                  className={`${adminBtnPrimary} w-full justify-center sm:w-auto`}
                  title="Crea una fila en support_tickets (log interno; no es helpdesk público)"
                >
                  Crear ticket interno
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
                      <th className="p-3">Escalación</th>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Seguimiento</th>
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
                        <td className="p-3 align-top text-xs">
                          {t.escalation_tag ? (
                            <span className="inline-block rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-950">
                              {t.escalation_tag}
                            </span>
                          ) : (
                            <span className="text-[#9A9084]">—</span>
                          )}
                        </td>
                        <td className="p-3 text-xs text-[#7A7164]">
                          {t.created_at ? new Date(t.created_at).toLocaleString() : "—"}
                        </td>
                        <td className="max-w-[14rem] p-3 align-top">
                          <details className="text-xs">
                            <summary className="cursor-pointer select-none font-semibold text-[#8B4513] hover:underline">
                              Actualizar
                            </summary>
                            <form
                              action={updateSupportTicketFollowupAction}
                              className="mt-2 space-y-2 rounded-lg border border-[#E8DFD0]/90 bg-[#FFFCF7] p-2"
                            >
                              <input type="hidden" name="ticket_id" value={t.id} />
                              <div>
                                <label className="block text-[10px] font-semibold text-[#5C5346]" htmlFor={`st-${t.id}`}>
                                  Estado
                                </label>
                                <select
                                  id={`st-${t.id}`}
                                  name="status"
                                  defaultValue={t.status}
                                  className={`${adminInputClass} mt-0.5 text-xs`}
                                >
                                  <option value="open">open</option>
                                  <option value="in_progress">in_progress</option>
                                  <option value="closed">closed</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-[#5C5346]" htmlFor={`esc-${t.id}`}>
                                  Escalación
                                </label>
                                <select
                                  id={`esc-${t.id}`}
                                  name="escalation_tag"
                                  defaultValue={t.escalation_tag ?? ""}
                                  disabled={!staffFollowupAvailable}
                                  className={`${adminInputClass} mt-0.5 text-xs disabled:opacity-60`}
                                >
                                  <option value="">(ninguna)</option>
                                  <option value="Billing">Billing</option>
                                  <option value="Technical">Technical</option>
                                  <option value="Fraud">Fraud</option>
                                  <option value="Content">Content</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-[#5C5346]" htmlFor={`notes-${t.id}`}>
                                  Notas internas (staff)
                                </label>
                                <textarea
                                  id={`notes-${t.id}`}
                                  name="staff_internal_notes"
                                  rows={3}
                                  defaultValue={t.staff_internal_notes ?? ""}
                                  disabled={!staffFollowupAvailable}
                                  className={`${adminInputClass} mt-0.5 text-xs disabled:opacity-60`}
                                />
                              </div>
                              {!staffFollowupAvailable ? (
                                <p className="text-[10px] text-amber-900">
                                  Solo <strong>estado</strong> se persiste hasta aplicar la migración de seguimiento.
                                </p>
                              ) : null}
                              <button type="submit" className={`${adminBtnSecondary} w-full justify-center text-xs`}>
                                Guardar
                              </button>
                            </form>
                          </details>
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
          <h2 className="text-sm font-bold text-[#1E1810]">Escalación y notas internas</h2>
          <p className="mt-1 text-xs text-[#7A7164]">
            Valores de escalación permitidos en base: <strong className="text-[#1E1810]">Billing</strong>,{" "}
            <strong className="text-[#1E1810]">Technical</strong>, <strong className="text-[#1E1810]">Fraud</strong>,{" "}
            <strong className="text-[#1E1810]">Content</strong>. Se guardan por ticket en{" "}
            <code className="rounded bg-white/80 px-1">support_tickets</code> cuando la migración{" "}
            <code className="rounded bg-white/80 px-1">20260408210000_support_tickets_staff_followup.sql</code> está aplicada;
            cada guardado queda en <code className="rounded bg-white/80 px-1">admin_audit_log</code> vía{" "}
            <code className="rounded bg-white/80 px-1">auditAdminWrite</code>.
          </p>
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
        <p className="mt-4 text-xs text-[#7A7164]">
          Notas internas del caso: en cada fila de la tabla de tickets, abre <strong>Seguimiento → Actualizar</strong> (columna a
          la derecha). No hay bloc de notas global — todo va ligado al ticket y queda auditado.
        </p>
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
  searchParams?: Promise<{
    ticket_saved?: string;
    ticket_created?: string;
    ticket_error?: string;
    followup_columns?: string;
    profile?: string;
  }>;
}) {
  return (
    <div>
      <Suspense fallback={<div className="p-6 text-sm text-[#5C5346]">Cargando Support…</div>}>
        <SupportTicketsSection searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
