import Link from "next/link";
import { AdminPageHeader } from "../../_components/AdminPageHeader";
import { AdminPagePurposeCard } from "../../_components/AdminPagePurposeCard";
import { adminCardBase, adminStubBadgeClass, adminCtaChipSecondary } from "../../_components/adminTheme";
import { adminMessages, getAdminLang } from "../../_lib/adminI18n";

export const dynamic = "force-dynamic";

/** Legacy route — not linked from admin nav; kept stable so bookmarks do not 404. */
export default async function AdminDrawPlaceholderPage() {
  const lang = await getAdminLang();
  const m = adminMessages(lang);
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <span className={adminStubBadgeClass}>{m("drawPage.stub")}</span>
      </div>
      <AdminPageHeader
        title="Draw"
        subtitle={m("drawPage.subtitle")}
        helperText={m("drawPage.helperText")}
      />
      <AdminPagePurposeCard
        title="Draw legacy placeholder"
        purpose="Keep the old bookmarked route honest while directing operators to real Admin OS surfaces."
        dataSource="No dedicated Supabase table or action surface; this page is a static admin placeholder."
        status="planned"
        safeActions={["Open Dashboard", "Open Website Control"]}
        nextGate="ADMIN-OS-NAV-ARCHITECTURE-01"
        warningNote="This route is not linked from the primary admin nav and should not be treated as a working tool."
      />
      <div className={`${adminCardBase} p-6`}>
        <p className="text-sm leading-relaxed text-[#5C5346]">
          {m("drawPage.bodyLead")}{" "}
          <strong className="text-[#1E1810]">{m("nav.dashboard")}</strong>,{" "}
          <strong className="text-[#1E1810]">{m("nav.users")}</strong>,{" "}
          <strong className="text-[#1E1810]">{m("nav.customerOps")}</strong> {m("common.and")}{" "}
          <strong className="text-[#1E1810]">{m("nav.siteSections")}</strong> {m("drawPage.bodyTail")}
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link href="/admin" className={`${adminCtaChipSecondary} justify-center`}>
            {m("drawPage.ctaDashboard")}
          </Link>
          <Link href="/admin/workspace" className={`${adminCtaChipSecondary} justify-center`}>
            {m("drawPage.ctaWorkspace")}
          </Link>
        </div>
      </div>
    </div>
  );
}
