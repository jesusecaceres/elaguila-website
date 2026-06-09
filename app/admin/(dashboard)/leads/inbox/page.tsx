import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { AdminLeonixLeadsInboxClient } from "@/app/admin/_components/leads/AdminLeonixLeadsInboxClient";
import { adminCardBase } from "@/app/admin/_components/adminTheme";
import { LEAD_INBOX_DISPLAY_LIMIT, listLeonixLeadsForAdmin } from "@/app/admin/_lib/leonixLeadsData";

export const dynamic = "force-dynamic";

export default async function AdminLeonixLeadsInboxPage() {
  const list = await listLeonixLeadsForAdmin(LEAD_INBOX_DISPLAY_LIMIT);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Lead inbox"
        subtitle="Contact, advertising, and business inquiries from public.leonix_leads."
        helperText="Check daily, update status, and add internal notes after follow-up. Newest first."
      />

      {list.dataUnavailable ? (
        <div className={`${adminCardBase} border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950`}>
          <strong>Data unavailable.</strong> {list.dataUnavailableNote}
        </div>
      ) : null}

      {list.error && !list.dataUnavailable ? (
        <div className={`${adminCardBase} border-rose-200 bg-rose-50/90 p-4 text-sm text-rose-950`}>
          <strong>Could not load leads.</strong> {list.error}
        </div>
      ) : null}

      <AdminLeonixLeadsInboxClient initialRows={list.rows} total={list.total} limit={LEAD_INBOX_DISPLAY_LIMIT} />
    </div>
  );
}
