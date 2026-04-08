import { AdminPageHeader } from "../../_components/AdminPageHeader";
import { adminCardBase, adminBtnPrimary, adminInputClass, adminStubBadgeClass } from "../../_components/adminTheme";
import { AdminEmptyState } from "../../_components/AdminEmptyState";
import { getPlaceholderTeamMembers, ROLE_LABELS, type AdminPermissionKey } from "../../_lib/teamTypes";

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

export default function AdminTeamPage() {
  const members = getPlaceholderTeamMembers();

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <span className={adminStubBadgeClass}>Simulación</span>
        <span className={adminStubBadgeClass}>No persistido</span>
      </div>
      <AdminPageHeader
        title="Team"
        subtitle="Internal workforce roles and permissions. Persistence requires Supabase `admin_team_members` (see teamTypes.ts)."
        helperText="La tabla y los botones de ejemplo no guardan en base; el roster viene de datos placeholder en código."
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#5C5346]/95">
          Root owner and invited staff. Browser auth stays cookie-based — this roster is operational metadata only.
        </p>
        <button
          type="button"
          disabled
          className={`${adminBtnPrimary} opacity-60`}
          title="Invite flow not persisted yet — wire after admin_team_members table"
        >
          + Invite member
        </button>
      </div>

      {members.length === 0 ? (
        <AdminEmptyState title="No team members" description="Seed or connect Supabase to populate this list." />
      ) : (
        <div className={`${adminCardBase} overflow-hidden`}>
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
                      title="Requires persisted team rows + RLS"
                    >
                      Deactivate
                    </button>
                    <button
                      type="button"
                      disabled
                      className="rounded-xl border border-[#E8DFD0] bg-white px-3 py-1.5 text-xs font-semibold text-[#5C5346]/70"
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
        <h2 className="text-sm font-bold text-[#1E1810]">Add team member (stub)</h2>
        <p className="mt-1 text-xs text-[#7A7164]">
          Form is disabled until invites are backed by Supabase. Do not perform auth changes from the browser alone.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-[#5C5346]">Email</label>
            <input className={adminInputClass} disabled placeholder="colleague@company" />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#5C5346]">Role</label>
            <select className={adminInputClass} disabled defaultValue="read_only">
              <option value="read_only">Read only</option>
              <option value="ads_moderator">Ads moderator</option>
              <option value="super_admin">Super admin</option>
            </select>
          </div>
        </div>
        <button type="button" disabled className={`${adminBtnPrimary} mt-4 opacity-60`}>
          Send invite (not wired)
        </button>
      </div>
    </div>
  );
}
