import Link from "next/link";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { AdminMediaKitLeadsClient } from "@/app/admin/_components/leads/AdminMediaKitLeadsClient";
import { adminCardBase, adminStubBadgeClass } from "@/app/admin/_components/adminTheme";
import { LEAD_LIST_DEFAULT_LIMIT, listMediaKitLeadsForAdmin } from "@/app/admin/_lib/leonixLeadsData";
import { ADMIN_LEADS_MEDIA_KIT_INBOX_HREF } from "@/app/admin/_lib/adminNavOps";

export const dynamic = "force-dynamic";

export default async function AdminMediaKitLeadsPage() {
  const [activeList, archivedList] = await Promise.all([
    listMediaKitLeadsForAdmin(LEAD_LIST_DEFAULT_LIMIT, "active"),
    listMediaKitLeadsForAdmin(LEAD_LIST_DEFAULT_LIMIT, "archived"),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-2">
        <span className={adminStubBadgeClass}>Not the real destination — see below</span>
      </div>
      <AdminPageHeader
        title="Media kit leads (legacy table)"
        subtitle="This page reads the dedicated leonix_media_kit_leads table, but the public /media-kit page's real CTAs never write to it — they go to /contacto (inquiryType=mediaKit), which lands in the main Launch Leads table instead."
        helperText="Confirmed by direct code review. This page is kept live in case rows exist here already; new media-kit interest will not appear below."
      />

      <div className={`${adminCardBase} border-[#C9A84A]/50 bg-[#FBF3D9] p-4 text-sm text-[#5C4E1E]`}>
        Real, current media-kit interest is in the Launch Leads inbox:{" "}
        <Link href={ADMIN_LEADS_MEDIA_KIT_INBOX_HREF} className="font-bold underline">
          Open the Media Kit view →
        </Link>
      </div>

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
