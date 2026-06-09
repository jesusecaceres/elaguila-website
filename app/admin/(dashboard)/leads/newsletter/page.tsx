import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { AdminNewsletterSubscribersInboxClient } from "@/app/admin/_components/leads/AdminNewsletterSubscribersInboxClient";
import { adminCardBase } from "@/app/admin/_components/adminTheme";
import { LEAD_INBOX_DISPLAY_LIMIT, listNewsletterSubscribersForAdmin } from "@/app/admin/_lib/leonixLeadsData";

export const dynamic = "force-dynamic";

export default async function AdminNewsletterSubscribersPage() {
  const list = await listNewsletterSubscribersForAdmin(LEAD_INBOX_DISPLAY_LIMIT);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Launch subscribers"
        subtitle="Newsletter and launch signups from public.leonix_newsletter_subscribers."
        helperText="Copy or export for future campaigns. Bulk email sending is not included in this inbox."
      />

      {list.dataUnavailable ? (
        <div className={`${adminCardBase} border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950`}>
          <strong>Data unavailable.</strong> {list.dataUnavailableNote}
        </div>
      ) : null}

      {list.error && !list.dataUnavailable ? (
        <div className={`${adminCardBase} border-rose-200 bg-rose-50/90 p-4 text-sm text-rose-950`}>
          <strong>Could not load subscribers.</strong> {list.error}
        </div>
      ) : null}

      <AdminNewsletterSubscribersInboxClient
        initialRows={list.rows}
        total={list.total}
        limit={LEAD_INBOX_DISPLAY_LIMIT}
      />
    </div>
  );
}
