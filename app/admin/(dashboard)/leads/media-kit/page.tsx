import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { AdminMediaKitLeadsClient } from "@/app/admin/_components/leads/AdminMediaKitLeadsClient";
import { adminCardBase } from "@/app/admin/_components/adminTheme";
import { LEAD_LIST_DEFAULT_LIMIT, listMediaKitLeadsForAdmin } from "@/app/admin/_lib/leonixLeadsData";

export const dynamic = "force-dynamic";

export default async function AdminMediaKitLeadsPage() {
  const list = await listMediaKitLeadsForAdmin(LEAD_LIST_DEFAULT_LIMIT);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Media kit leads"
        subtitle="Media kit requests from /media-kit — reply with the Leonix media kit PDF."
        helperText={`Showing newest ${LEAD_LIST_DEFAULT_LIMIT} of ${list.total} lead(s). Use mailto or copy reply; no server email from admin.`}
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

      <AdminMediaKitLeadsClient initialRows={list.rows} total={list.total} limit={LEAD_LIST_DEFAULT_LIMIT} />
    </div>
  );
}
