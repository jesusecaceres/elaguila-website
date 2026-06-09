import Link from "next/link";

import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import {
  adminCardBase,
  adminBtnPrimary,
  adminInputClass,
  adminStubBadgeClass,
  adminTableZebraRow,
  adminCtaChipSecondary,
  adminCtaChip,
} from "../../../_components/adminTheme";
import {
  ALL_ADMIN_PERMISSION_KEYS,
  ROLE_LABELS,
  type AdminTeamRole,
  type AdminPermissionKey,
} from "../../../_lib/teamTypes";
import { AdminEmptyState } from "../../../_components/AdminEmptyState";
import { getCurrentAdminAccessContext, requireAdminTeamAccess } from "@/app/admin/_lib/adminAccessControl";
import { getAdminSupabase } from "@/app/lib/supabase/server";
import {
  createTeamInviteIntentAction,
  createTeamMemberRecordAction,
  toggleTeamMemberActiveAction,
  updateTeamMemberPermissionsAction,
} from "../../../adminTeamActions";
import { StaffTeamNav } from "../../../_components/StaffTeamNav";

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

type MemberRow = {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
  is_active: boolean;
  permissions: unknown;
  created_at: string;
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

async function fetchTeamMembers(): Promise<{ rows: MemberRow[]; unavailable: boolean }> {
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("admin_team_members")
      .select("id, email, display_name, role, is_active, permissions, created_at")
      .order("created_at", { ascending: false })
      .limit(80);
    if (error) return { rows: [], unavailable: true };
    return { rows: (data ?? []) as MemberRow[], unavailable: false };
  } catch {
    return { rows: [], unavailable: true };
  }
}

const KNOWN_PERM = new Set<string>(ALL_ADMIN_PERMISSION_KEYS);

function parsePermissions(raw: unknown): AdminPermissionKey[] {
  if (!Array.isArray(raw)) return [];
  const out: AdminPermissionKey[] = [];
  for (const x of raw) {
    if (typeof x === "string" && KNOWN_PERM.has(x)) {
      out.push(x as AdminPermissionKey);
    }
  }
  return out;
}

export default async function AdminTeamPage(props: {
  searchParams?: Promise<{ invite_saved?: string; invite_error?: string; member_saved?: string; member_error?: string }>;
}) {
  const access = await getCurrentAdminAccessContext();
  requireAdminTeamAccess(access);

  const sp = props.searchParams ? await props.searchParams : {};
  const { rows: invites, unavailable: invitesUnavailable } = await fetchTeamInvites();
  const { rows: members, unavailable: membersUnavailable } = await fetchTeamMembers();

  return (
    <div>
      <StaffTeamNav showRosterLink={false} />
      <div className="mb-3 flex flex-wrap gap-2">
        {membersUnavailable ? (
          <span className={adminStubBadgeClass}>Roster: table unavailable</span>
        ) : (
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-900">
            Roster: admin_team_members
          </span>
        )}
        {invitesUnavailable ? (
          <span className={adminStubBadgeClass}>Invites: table unavailable</span>
        ) : (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase text-amber-900">
            Invites: admin_team_invites
          </span>
        )}
      </div>
      {sp.member_saved === "1" ? (
        <div className={`${adminCardBase} mb-4 border-emerald-200 bg-emerald-50/90 p-3 text-sm text-emerald-950`}>
          Member updated.
        </div>
      ) : null}
      {sp.member_error === "1" ? (
        <div className={`${adminCardBase} mb-4 border-amber-200 bg-amber-50/90 p-3 text-sm text-amber-950`}>
          Could not save member (check data or migration <code className="rounded bg-white/80 px-1">20260408183000_control_center_extensions.sql</code>).
        </div>
      ) : null}
      {sp.member_error === "duplicate" ? (
        <div className={`${adminCardBase} mb-4 border-amber-200 bg-amber-50/90 p-3 text-sm text-amber-950`}>
          That email is already in the roster.
        </div>
      ) : null}

      <AdminPageHeader
        title="Team roster"
        subtitle="View and manage admin_team_members. To onboard employees with login access, use Create staff login first."
        helperText="Staff sign in at /admin/login with Supabase Auth. Roster rows without Auth cannot access admin."
      />

      <div className={`${adminCardBase} mb-6 border-emerald-200 bg-emerald-50/80 p-5`}>
        <h2 className="text-base font-bold text-[#1E1810]">Create staff login</h2>
        <p className="mt-2 text-sm text-[#5C5346]">
          Creates Supabase Auth user + admin roster permission. Use this for employees and sales team only — not
          customer ad accounts.
        </p>
        <Link href="/admin/team/users/new" className={`${adminCtaChip} mt-4 inline-flex`}>
          Create staff login →
        </Link>
      </div>

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
          Active roster rows are required for `/admin` access. Supabase Auth alone does not grant admin.
        </p>
      </div>

      {!invitesUnavailable && invites.length > 0 ? (
        <div className={`${adminCardBase} mb-8 overflow-hidden`}>
          <div className="border-b border-[#E8DFD0]/80 bg-[#FFF8F0]/90 px-4 py-3 text-xs text-[#5C5346]">
            Registered invites (intent). Complete signup in Supabase Auth or your IdP.
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-[#FBF7EF]/90 text-left text-xs font-bold uppercase tracking-wide text-[#7A7164]">
                <tr>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {invites.map((inv, i) => (
                  <tr key={inv.id} className={`border-t border-[#E8DFD0]/80 ${adminTableZebraRow}`}>
                    <td className="p-3 font-mono text-xs">{inv.email}</td>
                    <td className="p-3 text-xs">{ROLE_LABELS[inv.role as AdminTeamRole] ?? inv.role}</td>
                    <td className="p-3 text-xs font-semibold">{inv.status}</td>
                    <td className="p-3 text-xs text-[#7A7164]">
                      {inv.created_at ? new Date(inv.created_at).toLocaleString("en-US") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {membersUnavailable ? (
        <div className={`${adminCardBase} mb-8 p-4 text-sm text-amber-950`}>
          <strong>admin_team_members</strong> unavailable — apply migration{" "}
          <code className="rounded bg-white/80 px-1 text-[11px]">20260408183000_control_center_extensions.sql</code>.
        </div>
      ) : members.length === 0 ? (
        <AdminEmptyState
          title="No members in roster"
          description="Use Create staff login to provision Supabase Auth + roster in one step."
        />
      ) : (
        <div className={`${adminCardBase} mb-8 overflow-hidden`}>
          <div className="border-b border-[#E8DFD0]/80 bg-[#FAF7F2]/90 px-4 py-2 text-xs font-semibold text-[#5C5346]">
            Roster (Supabase)
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
              {members.map((m, i) => {
                const perms = parsePermissions(m.permissions);
                return (
                  <tr key={m.id} className={`border-t border-[#E8DFD0]/80 ${adminTableZebraRow}`}>
                    <td className="p-4">
                      <p className="font-semibold text-[#1E1810]">{m.display_name?.trim() || m.email}</p>
                      <p className="text-xs text-[#7A7164]">{m.email}</p>
                    </td>
                    <td className="p-4">
                      <span className="rounded-full bg-[#FFF4E0] px-3 py-1 text-xs font-bold text-[#5C4E2E]">
                        {ROLE_LABELS[m.role as AdminTeamRole] ?? m.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          m.is_active ? "bg-emerald-100 text-emerald-900" : "bg-neutral-200 text-neutral-700"
                        }`}
                      >
                        {m.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-4 align-top">
                      {perms.length === 0 ? (
                        <span className="text-xs text-[#7A7164]">None (role only)</span>
                      ) : (
                        <div className="flex max-w-md flex-wrap gap-1">
                          {perms.slice(0, 6).map((p) => (
                            <span
                              key={p}
                              className="rounded-lg border border-[#E8DFD0]/90 bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-[#3D3428]"
                            >
                              {PERM_SHORT[p]}
                            </span>
                          ))}
                          {perms.length > 6 ? (
                            <span className="text-[10px] text-[#7A7164]">+{perms.length - 6}</span>
                          ) : null}
                        </div>
                      )}
                      <details className="mt-2 max-w-md">
                        <summary className="cursor-pointer select-none text-xs font-semibold text-[#8B4513] hover:underline">
                          Edit permissions (Supabase + audit)
                        </summary>
                        <form
                          action={updateTeamMemberPermissionsAction}
                          className="mt-2 space-y-2 rounded-lg border border-[#E8DFD0]/90 bg-[#FFFCF7] p-3"
                        >
                          <input type="hidden" name="member_id" value={m.id} />
                          <p className="text-[10px] leading-snug text-[#7A7164]">
                            Check Leonix capabilities for this roster row. Does not modify Supabase Auth.
                          </p>
                          <ul className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
                            {ALL_ADMIN_PERMISSION_KEYS.map((key) => (
                              <li key={key}>
                                <label className="flex cursor-pointer items-start gap-2 text-xs text-[#3D3428]">
                                  <input
                                    type="checkbox"
                                    name="permissions"
                                    value={key}
                                    defaultChecked={perms.includes(key)}
                                    className="mt-0.5"
                                  />
                                  <span>
                                    <span className="font-semibold">{PERM_SHORT[key]}</span>
                                    <span className="ml-1 font-mono text-[10px] text-[#7A7164]">{key}</span>
                                  </span>
                                </label>
                              </li>
                            ))}
                          </ul>
                          <button
                            type="submit"
                            className="min-h-[40px] w-full rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-xs font-semibold text-[#5C5346] hover:bg-white sm:min-h-0 sm:w-auto"
                          >
                            Save permissions
                          </button>
                        </form>
                      </details>
                    </td>
                    <td className="p-4 text-right">
                      <form action={toggleTeamMemberActiveAction} className="inline">
                        <input type="hidden" name="id" value={m.id} />
                        <input type="hidden" name="next_active" value={m.is_active ? "0" : "1"} />
                        <button
                          type="submit"
                          className="min-h-[40px] rounded-xl border border-[#E8DFD0] bg-white px-3 py-1.5 text-xs font-semibold text-[#5C5346] hover:bg-[#FFFCF7] sm:min-h-0"
                          title={
                            m.is_active
                              ? "Deactivate row in admin_team_members (does not delete Auth user)"
                              : "Reactivate row in operational roster"
                          }
                          aria-label={m.is_active ? "Deactivate member in roster" : "Activate member in roster"}
                        >
                          {m.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <details className={`${adminCardBase} mb-8 p-6`}>
        <summary className="cursor-pointer text-sm font-bold text-[#1E1810]">
          Advanced: roster row only (no Auth) — metadata / migration repair
        </summary>
        <p className="mt-3 text-xs text-[#7A7164]">
          Prefer{" "}
          <Link href="/admin/team/users/new" className="font-bold text-[#6B5B2E] underline">
            Create staff login
          </Link>
          . This form inserts a row in <code className="rounded bg-white/80 px-1">admin_team_members</code> without
          creating a Supabase Auth user.
        </p>
        {membersUnavailable ? (
          <p className="mt-3 text-sm text-amber-900">Table unavailable.</p>
        ) : (
          <form action={createTeamMemberRecordAction} className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="member-email" className="text-xs font-semibold text-[#5C5346]">
                Email
              </label>
              <input
                id="member-email"
                name="email"
                type="email"
                required
                autoComplete="off"
                className={`${adminInputClass} mt-1`}
              />
            </div>
            <div>
              <label htmlFor="member-name" className="text-xs font-semibold text-[#5C5346]">
                Display name
              </label>
              <input id="member-name" name="display_name" className={`${adminInputClass} mt-1`} placeholder="Optional" />
            </div>
            <div>
              <label htmlFor="member-role" className="text-xs font-semibold text-[#5C5346]">
                Role
              </label>
              <select id="member-role" name="role" required className={`${adminInputClass} mt-1`} defaultValue="read_only">
                {(Object.keys(ROLE_LABELS) as AdminTeamRole[]).map((k) => (
                  <option key={k} value={k}>
                    {ROLE_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="member-notes" className="text-xs font-semibold text-[#5C5346]">
                Internal note
              </label>
              <input id="member-notes" name="notes" className={`${adminInputClass} mt-1`} placeholder="Optional" />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className={`${adminBtnPrimary} w-full justify-center sm:w-auto`}
                title="Roster metadata only — does not create Supabase Auth user"
              >
                Save roster row only
              </button>
            </div>
          </form>
        )}
      </details>

      <details className={`${adminCardBase} p-6`}>
        <summary className="cursor-pointer text-sm font-bold text-[#1E1810]">
          Advanced: register invite intent (no email sent)
        </summary>
        <p className="mt-3 text-xs text-[#7A7164]">
          Saves email + role in <code className="rounded bg-white/80 px-1">admin_team_invites</code>. Does not send
          email or create Auth user. Use Create staff login for real onboarding.
        </p>
        {invitesUnavailable ? (
          <p className="mt-3 text-sm font-semibold text-amber-900">
            Table unavailable: apply migration <code className="rounded bg-white/80 px-1">20260410120000_admin_audit_log_and_team_invites.sql</code>.
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
                Intended role
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
                Internal note (optional)
              </label>
              <input id="team-invite-note" name="note" className={`${adminInputClass} mt-1`} placeholder="Ticket / context" />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className={`${adminBtnPrimary} w-full justify-center sm:w-auto`}
                title="Records intent only"
              >
                Save invite intent
              </button>
            </div>
          </form>
        )}
      </details>
    </div>
  );
}
