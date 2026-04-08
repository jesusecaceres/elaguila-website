import { AdminPageHeader } from "../../_components/AdminPageHeader";
import {
  adminCardBase,
  adminBtnPrimary,
  adminInputClass,
  adminStubBadgeClass,
  adminCtaChipSecondary,
} from "../../_components/adminTheme";
import { AdminEmptyState } from "../../_components/AdminEmptyState";
import {
  getPlaceholderTeamMembers,
  ROLE_LABELS,
  type AdminTeamRole,
  type AdminPermissionKey,
} from "../../_lib/teamTypes";
import { getAdminSupabase } from "@/app/lib/supabase/server";
import { createTeamInviteIntentAction } from "../../adminTeamActions";

export const dynamic = "force-dynamic";

const PERM_SHORT: Record<AdminPermissionKey, string> = {
  can_view_users: "Users (view)",
  can_edit_users: "Users (edit)",
  can_reset_passwords: "Reset passwords",
  can_manage_ads: "Ads",
  can_manage_reports: "Reports",
  can_manage_categories: "Categories",
  can_manage_magazine: "Magazine",
  can_manage_website_content: "Site content",
  can_view_payments: "Payments (view)",
  can_manage_team: "Team",
  can_view_activity_logs: "Activity",
  can_use_replica_mode: "Replica mode",
};

type InviteRow = {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  note: string | null;
};

async function fetchTeamInvites(): Promise<{ rows: InviteRow[]; unavailable: boolean }> {
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("admin_team_invites")
      .select("id, email, role, status, created_at, note")
      .order("created_at", { ascending: false })
      .limit(40);
    if (error) return { rows: [], unavailable: true };
    return { rows: (data ?? []) as InviteRow[], unavailable: false };
  } catch {
    return { rows: [], unavailable: true };
  }
}

export default async function AdminTeamPage() {
  const members = getPlaceholderTeamMembers();
  const { rows: invites, unavailable: invitesUnavailable } = await fetchTeamInvites();

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <span className={adminStubBadgeClass}>Roster simulado</span>
        {invitesUnavailable ? (
          <span className={adminStubBadgeClass}>Invitaciones: tabla no disponible</span>
        ) : (
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-900">
            Invitaciones: Supabase
          </span>
        )}
      </div>
      <AdminPageHeader
        title="Team"
        subtitle="Roster de ejemplo en código hasta `admin_team_members`. Las filas en `admin_team_invites` son intenciones guardadas — no crean usuarios Auth ni envían correo solas."
        helperText="Para contraseñas y magic links usa el panel de Supabase Auth (enlace abajo). Este formulario solo registra la intención en base."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <a
          href="https://supabase.com/docs/guides/auth/auth-email-password"
          target="_blank"
          rel="noreferrer"
          className={`${adminCtaChipSecondary} inline-flex text-xs`}
        >
          Docs · Auth (email / invites) ↗
        </a>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#5C5346]/95">
          Root owner y personal invitado. La cookie `leonix_admin` no sustituye un modelo de roles en base.
        </p>
      </div>

      {!invitesUnavailable && invites.length > 0 ? (
        <div className={`${adminCardBase} mb-8 overflow-hidden`}>
          <div className="border-b border-[#E8DFD0]/80 bg-[#FFF8F0]/90 px-4 py-3 text-xs text-[#5C5346]">
            Invitaciones registradas (intención). Completar alta en Supabase Auth o tu IdP.
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-[#FBF7EF]/90 text-left text-xs font-bold uppercase tracking-wide text-[#7A7164]">
                <tr>
                  <th className="p-3">Email</th>
                  <th className="p-3">Rol</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {invites.map((inv) => (
                  <tr key={inv.id} className="border-t border-[#E8DFD0]/80">
                    <td className="p-3 font-mono text-xs">{inv.email}</td>
                    <td className="p-3 text-xs">{ROLE_LABELS[inv.role as AdminTeamRole] ?? inv.role}</td>
                    <td className="p-3 text-xs font-semibold">{inv.status}</td>
                    <td className="p-3 text-xs text-[#7A7164]">
                      {inv.created_at ? new Date(inv.created_at).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {members.length === 0 ? (
        <AdminEmptyState title="No team members" description="Seed or connect Supabase to populate this list." />
      ) : (
        <div className={`${adminCardBase} overflow-hidden`}>
          <div className="border-b border-[#E8DFD0]/80 bg-[#FAF7F2]/90 px-4 py-2 text-xs font-semibold text-[#5C5346]">
            Vista previa de permisos (datos de ejemplo en código, no filas Supabase)
          </div>
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-[#FBF7EF]/90 text-left text-xs font-bold uppercase tracking-wide text-[#7A7164]">
              <tr>
                <th className="p-4">Member</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4">Permissions</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-t border-[#E8DFD0]/80">
                  <td className="p-4">
                    <p className="font-semibold text-[#1E1810]">{m.displayName}</p>
                    <p className="text-xs text-[#7A7164]">{m.email}</p>
                  </td>
                  <td className="p-4">
                    <span className="rounded-full bg-[#FFF4E0] px-3 py-1 text-xs font-bold text-[#5C4E2E]">
                      {ROLE_LABELS[m.role]}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        m.isActive ? "bg-emerald-100 text-emerald-900" : "bg-neutral-200 text-neutral-700"
                      }`}
                    >
                      {m.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex max-w-md flex-wrap gap-1">
                      {m.permissions.slice(0, 6).map((p) => (
                        <span
                          key={p}
                          className="rounded-lg border border-[#E8DFD0]/90 bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-[#3D3428]"
                        >
                          {PERM_SHORT[p]}
                        </span>
                      ))}
                      {m.permissions.length > 6 ? (
                        <span className="text-[10px] text-[#7A7164]">+{m.permissions.length - 6} more</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      type="button"
                      disabled
                      className="mr-2 rounded-xl border border-[#E8DFD0] bg-white px-3 py-1.5 text-xs font-semibold text-[#5C5346]/70"
                      title="Requiere filas persistidas en admin_team_members + políticas"
                    >
                      Deactivate
                    </button>
                    <button
                      type="button"
                      disabled
                      className="rounded-xl border border-[#E8DFD0] bg-white px-3 py-1.5 text-xs font-semibold text-[#5C5346]/70"
                      title="Requiere filas persistidas en admin_team_members + políticas"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className={`${adminCardBase} mt-8 p-6`}>
        <h2 className="text-sm font-bold text-[#1E1810]">Registrar intención de invitación</h2>
        <p className="mt-1 text-xs text-[#7A7164]">
          Guarda email + rol en <code className="rounded bg-white/80 px-1">admin_team_invites</code>. No envía correo ni crea
          usuario en Auth. Usa el dashboard de Supabase para invitaciones reales.
        </p>
        {invitesUnavailable ? (
          <p className="mt-3 text-sm font-semibold text-amber-900">
            Tabla no disponible: aplica la migración <code className="rounded bg-white/80 px-1">20260410120000_admin_audit_log_and_team_invites.sql</code>.
          </p>
        ) : (
          <form action={createTeamInviteIntentAction} className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="team-invite-email" className="text-xs font-semibold text-[#5C5346]">
                Email
              </label>
              <input
                id="team-invite-email"
                name="email"
                type="email"
                required
                autoComplete="off"
                placeholder="colleague@company.com"
                className={`${adminInputClass} mt-1`}
              />
            </div>
            <div>
              <label htmlFor="team-invite-role" className="text-xs font-semibold text-[#5C5346]">
                Rol pretendido
              </label>
              <select id="team-invite-role" name="role" required className={`${adminInputClass} mt-1`} defaultValue="read_only">
                {(Object.keys(ROLE_LABELS) as AdminTeamRole[]).map((k) => (
                  <option key={k} value={k}>
                    {ROLE_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="team-invite-note" className="text-xs font-semibold text-[#5C5346]">
                Nota interna (opcional)
              </label>
              <input id="team-invite-note" name="note" className={`${adminInputClass} mt-1`} placeholder="Ticket / contexto" />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className={`${adminBtnPrimary} w-full justify-center sm:w-auto`}>
                Guardar intención en Supabase
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
