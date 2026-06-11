import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { AdminNewsletterSubscribersInboxClient } from "@/app/admin/_components/leads/AdminNewsletterSubscribersInboxClient";
import { adminCardBase } from "@/app/admin/_components/adminTheme";
import { LEAD_INBOX_DISPLAY_LIMIT, listNewsletterSubscribersForAdmin } from "@/app/admin/_lib/leonixLeadsData";

export const dynamic = "force-dynamic";

export default async function AdminNewsletterSubscribersPage() {
  const [activeList, archivedList] = await Promise.all([
    listNewsletterSubscribersForAdmin(LEAD_INBOX_DISPLAY_LIMIT, "active"),
    listNewsletterSubscribersForAdmin(LEAD_INBOX_DISPLAY_LIMIT, "archived"),
  ]);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Launch subscribers"
        subtitle="Newsletter and launch signups — view, reply, archive, and manage subscribers."
        helperText="View opens full subscriber details. Reply/Email use mailto. Export CSV excludes soft-deleted records."
      />

      {activeList.dataUnavailable || archivedList.dataUnavailable ? (
        <div className={`${adminCardBase} border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950`}>
          <strong>Data unavailable.</strong> {activeList.dataUnavailableNote ?? archivedList.dataUnavailableNote}
          {" "}Apply migration <code className="rounded bg-white/80 px-1">20260611120000_newsletter_media_kit_lifecycle.sql</code> if columns are missing.
        </div>
      ) : null}

      {(activeList.error || archivedList.error) && !activeList.dataUnavailable ? (
        <div className={`${adminCardBase} border-rose-200 bg-rose-50/90 p-4 text-sm text-rose-950`}>
          <strong>Could not load subscribers.</strong> {activeList.error ?? archivedList.error}
        </div>
      ) : null}

      <AdminNewsletterSubscribersInboxClient
        initialActiveRows={activeList.rows}
        initialArchivedRows={archivedList.rows}
        activeTotal={activeList.total}
        archivedTotal={archivedList.total}
        limit={LEAD_INBOX_DISPLAY_LIMIT}
      />
    </div>
  );
}
