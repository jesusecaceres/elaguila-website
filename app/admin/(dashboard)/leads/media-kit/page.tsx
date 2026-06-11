import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { AdminMediaKitLeadsClient } from "@/app/admin/_components/leads/AdminMediaKitLeadsClient";
import { adminCardBase } from "@/app/admin/_components/adminTheme";
import { LEAD_LIST_DEFAULT_LIMIT, listMediaKitLeadsForAdmin } from "@/app/admin/_lib/leonixLeadsData";

export const dynamic = "force-dynamic";

export default async function AdminMediaKitLeadsPage() {
  const [activeList, archivedList] = await Promise.all([
    listMediaKitLeadsForAdmin(LEAD_LIST_DEFAULT_LIMIT, "active"),
    listMediaKitLeadsForAdmin(LEAD_LIST_DEFAULT_LIMIT, "archived"),
  ]);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Media kit leads"
        subtitle="Media kit requests from /media-kit — view, reply, archive, and manage leads."
        helperText="View opens full request details. Reply includes media kit PDF link via mailto."
      />

      {activeList.dataUnavailable || archivedList.dataUnavailable ? (
        <div className={`${adminCardBase} border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950`}>
          <strong>Data unavailable.</strong> {activeList.dataUnavailableNote ?? archivedList.dataUnavailableNote}
        </div>
      ) : null}

      {(activeList.error || archivedList.error) && !activeList.dataUnavailable ? (
        <div className={`${adminCardBase} border-rose-200 bg-rose-50/90 p-4 text-sm text-rose-950`}>
          <strong>Could not load leads.</strong> {activeList.error ?? archivedList.error}
        </div>
      ) : null}

      <AdminMediaKitLeadsClient
        initialActiveRows={activeList.rows}
        initialArchivedRows={archivedList.rows}
        activeTotal={activeList.total}
        archivedTotal={archivedList.total}
        limit={LEAD_LIST_DEFAULT_LIMIT}
      />
    </div>
  );
}
