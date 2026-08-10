import Link from "next/link";
import { getCurrentAdminAccessContext, requireAdminTeamAccess } from "@/app/admin/_lib/adminAccessControl";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { AdminPagePurposeCard } from "@/app/admin/_components/AdminPagePurposeCard";
import { AdminEmptyState } from "@/app/admin/_components/AdminEmptyState";
import { AdminStatCard } from "@/app/admin/_components/AdminStatCard";
import { StaffTeamNav } from "@/app/admin/_components/StaffTeamNav";
import {
  adminBtnPrimary,
  adminCtaChip,
  adminCtaChipCompact,
  adminDesktopTableOnly,
  adminMobileCardList,
  adminTableWrap,
  adminTableZebraRow,
  adminActionProofOk,
  adminActionProofErr,
} from "@/app/admin/_components/adminTheme";
import { listExecutiveHubRecords } from "@/app/admin/_lib/executiveHubStore";
import { executiveHubStatusLabel, type ExecutiveHubRecord, type ExecutiveHubStatus } from "@/app/admin/_lib/executiveHubTypes";
import { setExecutiveHubStatusAction } from "@/app/admin/executiveHubActions";
import { EXECUTIVE_THEME_OPTIONS } from "@/app/lib/digitalContact/digitalContactExecutiveTheme";
import { ExecutiveHubFilterBar } from "@/app/admin/_components/executiveHub/ExecutiveHubFilterBar";
import { ExecutiveHubConfirmSubmitButton } from "@/app/admin/_components/executiveHub/ExecutiveHubConfirmSubmitButton";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<ExecutiveHubStatus, string> = {
  draft: "border border-[#E8DFD0] bg-[#FAF7F2] text-[#5C5346]",
  published: "border border-emerald-200 bg-emerald-50 text-emerald-950",
  suspended: "border border-amber-200 bg-amber-50 text-amber-950",
  archived: "border border-slate-300 bg-slate-50 text-slate-700",
};

function themeLabel(id: string): string {
  return EXECUTIVE_THEME_OPTIONS.find((t) => t.id === id)?.label ?? id;
}

function matchesQuery(exec: ExecutiveHubRecord, q: string): boolean {
  if (!q) return true;
  const haystack = [exec.fullName, exec.preferredName, exec.title, exec.company, exec.email, exec.phoneDisplay, exec.phoneDigits]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function StatusActionButton({
  slug,
  status,
  label,
  className,
  confirmMessage,
}: {
  slug: string;
  status: ExecutiveHubStatus;
  label: string;
  className: string;
  confirmMessage: string;
}) {
  return (
    <form action={setExecutiveHubStatusAction}>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="status" value={status} />
      <ExecutiveHubConfirmSubmitButton confirmMessage={confirmMessage} className={`${className} ${adminCtaChipCompact}`}>
        {label}
      </ExecutiveHubConfirmSubmitButton>
    </form>
  );
}

function QuickActions({ slug, fullName, status }: { slug: string; fullName: string; status: ExecutiveHubStatus }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link href={`/admin/team/executive-hub/${slug}/edit`} className={`${adminCtaChip} ${adminCtaChipCompact}`}>
        Edit
      </Link>
      <Link href={`/admin/team/executive-hub/${slug}/preview`} className={`${adminCtaChip} ${adminCtaChipCompact}`}>
        Preview
      </Link>
      {status !== "published" ? (
        <StatusActionButton
          slug={slug}
          status="published"
          label="Publish"
          className="border border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800"
          confirmMessage={`Publish ${fullName}? Their card at /contact/${slug} becomes visible to the public immediately.`}
        />
      ) : null}
      {status === "published" ? (
        <StatusActionButton
          slug={slug}
          status="suspended"
          label="Suspend"
          className="border border-[#C9782F] bg-[#E8943A] text-[#1E1810] hover:bg-[#D9852E]"
          confirmMessage={`Suspend ${fullName}? Their public card at /contact/${slug} stops being visible until republished.`}
        />
      ) : null}
      {status !== "archived" ? (
        <StatusActionButton
          slug={slug}
          status="archived"
          label="Delete"
          className="border border-rose-800 bg-rose-800 text-white hover:bg-rose-900"
          confirmMessage={`Delete ${fullName}? This is a soft delete (archive) — their public card is hidden immediately and the record can be restored later by an owner.`}
        />
      ) : null}
      {status !== "draft" ? (
        <StatusActionButton
          slug={slug}
          status="draft"
          label="Move to draft"
          className="border border-[color:var(--lx-border)] bg-[color:var(--lx-card)] text-[color:var(--lx-text)] hover:bg-[color:var(--lx-section)]"
          confirmMessage={`Move ${fullName} back to draft? Their public card at /contact/${slug} stops being visible.`}
        />
      ) : null}
    </div>
  );
}

export default async function ExecutiveHubListPage(props: {
  searchParams?: Promise<{ status_saved?: string; error?: string; q?: string; status?: string; theme?: string }>;
}) {
  const access = await getCurrentAdminAccessContext();
  requireAdminTeamAccess(access);

  const sp = props.searchParams ? await props.searchParams : {};
  const { records: allExecutives, unavailable } = await listExecutiveHubRecords();

  const q = (sp.q ?? "").trim().toLowerCase();
  const statusFilter = (sp.status ?? "").trim();
  const themeFilter = (sp.theme ?? "").trim();

  const executives = allExecutives.filter(
    (exec) =>
      matchesQuery(exec, q) &&
      (!statusFilter || exec.status === statusFilter) &&
      (!themeFilter || exec.theme === themeFilter)
  );

  const counts = {
    published: allExecutives.filter((e) => e.status === "published").length,
    draft: allExecutives.filter((e) => e.status === "draft").length,
    suspended: allExecutives.filter((e) => e.status === "suspended").length,
    archived: allExecutives.filter((e) => e.status === "archived").length,
  };

  const activeExecutives = allExecutives.filter((e) => e.status !== "archived");
  const connectedBusinesses = activeExecutives.filter((e) => Boolean(e.businessHubLink)).length;
  const unlinkedExecutives = activeExecutives.length - connectedBusinesses;
  const businessCoveragePct = activeExecutives.length > 0 ? Math.round((connectedBusinesses / activeExecutives.length) * 100) : 0;

  return (
    <div>
      <StaffTeamNav showRosterLink />
      <div className="mt-6">
        <AdminPageHeader
          eyebrow="Team · Executive Hub"
          title="Executive Hub"
          subtitle="Create and manage the executive profiles that power the Leonix Executive Contact Platform (/contact/[slug]) — photo, theme, publish status, and preview, without writing code."
          rightSlot={
            <Link href="/admin/team/executive-hub/new" className={adminBtnPrimary}>
              + New executive
            </Link>
          }
        />

        <AdminPagePurposeCard
          title="Executive Hub — Management Console"
          purpose="Manage Leonix executive contact profiles (and, in the future, client executives) without code changes: identity, photo, theme, working hours, Business Hub association, and publish status."
          dataSource="Supabase `public.executives` table (supabase/migrations/20260810120000_executive_hub_executives.sql). The public /contact/[slug] route reads this table first, falling back to the legacy app/lib/digitalContact/digitalContactRegistry.ts entries (Chuy, Isaías) only when no matching record exists here."
          status="real"
          safeActions={["Search / filter by status or theme", "Create/edit executive records", "Upload or remove headshot/logo/cover", "Search/select/clear a Business Hub reference", "Publish / Suspend / Delete (soft) / Move to draft", "Open live Preview"]}
          nextGate="Wire `businessHubAdapter.ts` to a real Business Hub service once one exists — every Executive Hub caller already expects its exact return shape."
          warningNote="Publishing, suspending, or deleting a record here immediately controls what /contact/{slug} shows to real visitors. Preview always reflects the same persisted record using the exact production rendering component. Views/QR downloads and Business Hub search are honest placeholders — Analytics and Business Hub are separately locked/not-yet-built systems, not wired into this console."
        />

        {unavailable ? (
          <p className={`${adminActionProofErr} mb-6`}>
            Supabase is not configured or unreachable in this environment — the Executive Hub list cannot load. Set
            NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, apply the `executives` migration, then reload.
          </p>
        ) : null}
        {sp.status_saved ? (
          <p className={`${adminActionProofOk} mb-6`}>Status updated.</p>
        ) : null}
        {sp.error ? (
          <p className={`${adminActionProofErr} mb-6`}>{sp.error}</p>
        ) : null}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <AdminStatCard title="Published" value={counts.published} hint="Live on /contact/[slug]" />
          <AdminStatCard title="Drafts" value={counts.draft} hint="Not yet public" />
          <AdminStatCard title="Suspended" value={counts.suspended} hint="Temporarily hidden" accent="amber" />
          <AdminStatCard title="Archived" value={counts.archived} hint="Soft-deleted" accent="rose" />
          <AdminStatCard title="Total views" value="—" hint="Not yet wired (Analytics is locked)" />
          <AdminStatCard title="QR downloads" value="—" hint="Not yet wired (Analytics is locked)" />
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <AdminStatCard
            title="Connected businesses"
            value={connectedBusinesses}
            hint="Active executives with a Business Hub reference link"
          />
          <AdminStatCard
            title="Unlinked executives"
            value={unlinkedExecutives}
            hint="Active executives with no Business Hub link yet"
            accent={unlinkedExecutives > 0 ? "amber" : "default"}
          />
          <AdminStatCard
            title="Business coverage"
            value={`${businessCoveragePct}%`}
            hint="Real (link-presence) coverage — not a directory match rate; Business Hub directory service doesn't exist yet"
          />
        </div>

        <ExecutiveHubFilterBar initialQuery={sp.q ?? ""} initialStatus={sp.status ?? ""} initialTheme={sp.theme ?? ""} />

        {allExecutives.length === 0 ? (
          <AdminEmptyState
            title="No executives yet"
            description="Create your first executive profile to get started."
            action={
              <Link href="/admin/team/executive-hub/new" className={adminBtnPrimary}>
                + New executive
              </Link>
            }
          />
        ) : executives.length === 0 ? (
          <AdminEmptyState title="No matches" description="No executives match this search and filter combination." />
        ) : (
          <>
            <div className={`${adminDesktopTableOnly} ${adminTableWrap}`}>
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[color:var(--lx-border)]/70 text-xs font-bold uppercase tracking-wide text-[#7A7164]">
                    <th className="px-4 py-3">Photo</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Title / Company</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Theme</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Business Hub</th>
                    <th className="px-4 py-3">Updated</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {executives.map((exec) => (
                    <tr key={exec.slug} className={adminTableZebraRow}>
                      <td className="px-4 py-3">
                        {exec.photoPath ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={exec.photoPath} alt={exec.fullName} className="h-10 w-10 rounded-full border border-[#E8DFD0] object-cover" />
                        ) : (
                          <div className="h-10 w-10 rounded-full border border-dashed border-[#E8DFD0]" />
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#1E1810]">{exec.fullName}</td>
                      <td className="px-4 py-3 text-[#5C5346]">
                        {exec.title}
                        <br />
                        <span className="text-xs text-[#7A7164]">{exec.company}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#5C5346]">{exec.phoneDisplay || "—"}</td>
                      <td className="px-4 py-3 text-xs text-[#5C5346]">{exec.email || "—"}</td>
                      <td className="px-4 py-3 text-[#5C5346]">{themeLabel(exec.theme)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_BADGE[exec.status]}`}>
                          {executiveHubStatusLabel(exec.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#5C5346]">{exec.businessHubLink ? "Linked" : "Not linked"}</td>
                      <td className="px-4 py-3 text-xs text-[#7A7164]">{new Date(exec.updatedAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <QuickActions slug={exec.slug} fullName={exec.fullName} status={exec.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={adminMobileCardList}>
              {executives.map((exec) => (
                <div key={exec.slug} className="rounded-2xl border border-[color:var(--lx-border)]/70 bg-[color:var(--lx-card)] p-4">
                  <div className="flex items-center gap-3">
                    {exec.photoPath ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={exec.photoPath} alt={exec.fullName} className="h-12 w-12 rounded-full border border-[#E8DFD0] object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-full border border-dashed border-[#E8DFD0]" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[#1E1810]">{exec.fullName}</p>
                      <p className="text-xs text-[#5C5346]">{exec.title} · {exec.company}</p>
                    </div>
                    <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_BADGE[exec.status]}`}>
                      {executiveHubStatusLabel(exec.status)}
                    </span>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#5C5346]">
                    <div>
                      <dt className="text-[#7A7164]">Phone</dt>
                      <dd>{exec.phoneDisplay || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-[#7A7164]">Email</dt>
                      <dd className="truncate">{exec.email || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-[#7A7164]">Theme</dt>
                      <dd>{themeLabel(exec.theme)}</dd>
                    </div>
                    <div>
                      <dt className="text-[#7A7164]">Business Hub</dt>
                      <dd>{exec.businessHubLink ? "Linked" : "Not linked"}</dd>
                    </div>
                    <div>
                      <dt className="text-[#7A7164]">Updated</dt>
                      <dd>{new Date(exec.updatedAt).toLocaleDateString()}</dd>
                    </div>
                  </dl>
                  <div className="mt-3">
                    <QuickActions slug={exec.slug} fullName={exec.fullName} status={exec.status} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
