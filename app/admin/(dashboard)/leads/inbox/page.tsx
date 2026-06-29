import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { AdminPagePurposeCard } from "@/app/admin/_components/AdminPagePurposeCard";
import { AdminLeonixLeadsInboxClient } from "@/app/admin/_components/leads/AdminLeonixLeadsInboxClient";
import { adminCardBase, adminWarningCallout } from "@/app/admin/_components/adminTheme";
import { parseAdminLeadsInboxViewParam } from "@/app/admin/_lib/adminNavOps";
import { LEAD_INBOX_DISPLAY_LIMIT, listLeonixLeadsForAdmin } from "@/app/admin/_lib/leonixLeadsData";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{ view?: string }>;
};

export default async function AdminLeonixLeadsInboxPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const initialOpsView = parseAdminLeadsInboxViewParam(searchParams?.view);

  const [activeList, archivedList] = await Promise.all([
    listLeonixLeadsForAdmin(LEAD_INBOX_DISPLAY_LIMIT, "active"),
    listLeonixLeadsForAdmin(LEAD_INBOX_DISPLAY_LIMIT, "archived"),
  ]);

  return (
    <div className="w-full max-w-none space-y-8">
      <AdminPageHeader
        title="Launch Leads command center"
        subtitle="Track, reply to, and follow up on advertising, promo, media kit, and contact inquiries."
        helperText="Use mailto and copy-reply helpers — emails are not sent from the server. Archive when done. Export CSV includes all non-deleted leads."
      />
      <AdminPagePurposeCard
        title="Launch Leads command center"
        purpose="Triage business, advertising, promo, and launch inquiries so Chuy/staff know who needs response next."
        dataSource="public.leonix_leads with lifecycle columns for active, archived, deleted, follow-up, and CRM status."
        status={activeList.dataUnavailable || archivedList.dataUnavailable ? "needs live proof" : "real"}
        safeActions={["Reply via mailto", "Copy reply", "Archive", "Restore", "Export CSV"]}
        nextGate="ADMIN-ACTION-QA-AND-LIVE-SCHEMA-PROOF-01"
        warningNote="This page does not send email server-side; it prepares safe operator follow-up."
      />

      {activeList.dataUnavailable || archivedList.dataUnavailable ? (
        <div className={adminWarningCallout}>
          <strong>Data unavailable.</strong>{" "}
          {activeList.dataUnavailableNote ?? archivedList.dataUnavailableNote}
          {" "}Apply migration <code className="rounded bg-white/80 px-1">20260609120000_leonix_leads_lifecycle.sql</code> if
          the table is missing.
        </div>
      ) : null}

      {(activeList.error || archivedList.error) && !activeList.dataUnavailable ? (
        <div className={`${adminCardBase} border-rose-200 bg-rose-50/90 p-4 text-sm text-rose-950`}>
          <strong>Could not load leads.</strong> {activeList.error ?? archivedList.error}
        </div>
      ) : null}

      <AdminLeonixLeadsInboxClient
        initialActiveRows={activeList.rows}
        initialArchivedRows={archivedList.rows}
        activeTotal={activeList.total}
        archivedTotal={archivedList.total}
        limit={LEAD_INBOX_DISPLAY_LIMIT}
        initialOpsView={initialOpsView}
      />
    </div>
  );
}
