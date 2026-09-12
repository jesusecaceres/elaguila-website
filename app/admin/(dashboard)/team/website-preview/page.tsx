import Link from "next/link";

import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import { StaffTeamNav } from "../../../_components/StaffTeamNav";
import { adminCardBase, adminCtaChipSecondary } from "../../../_components/adminTheme";
import { STAFF_PREVIEW_LINKS } from "@/app/admin/_lib/staffAdminAccess";
import { getCurrentAdminAccessContext } from "@/app/admin/_lib/adminAccessControl";
import { canAccessFullAdmin } from "@/app/admin/_lib/staffAdminAccess";

export const dynamic = "force-dynamic";

export default async function StaffWebsitePreviewPage() {
  const access = await getCurrentAdminAccessContext();
  const showRosterLink = canAccessFullAdmin(access);

  return (
    <div className="max-w-4xl space-y-6">
      <StaffTeamNav showRosterLink={showRosterLink} />

      <AdminPageHeader
        title="Website Preview"
        subtitle="This area lets authorized Leonix team members preview website pages while the public site remains locked. Use these links for internal review, partner walkthroughs, and sales preparation."
        helperText="Links open in a new tab. If the public site is currently locked, staying signed in to Admin lets you see these real pages anyway."
      />

      <div className={`${adminCardBase} border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950`}>
        <strong className="font-bold">Internal preview only.</strong> Use this while presenting to approved clients.
        Do not share these links publicly while the public site is locked.
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {STAFF_PREVIEW_LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`${adminCardBase} flex flex-col gap-2 p-4 transition hover:bg-[#FFFCF7]`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold text-[#1E1810]">{link.label}</span>
              </div>
              <code className="break-all text-[11px] text-[#5C5346]">{link.href}</code>
              <span className={`${adminCtaChipSecondary} mt-1 inline-flex w-fit text-xs`}>Open preview →</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
