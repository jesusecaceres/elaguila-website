import Link from "next/link";

import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import { StaffTeamNav } from "../../../_components/StaffTeamNav";
import { adminCardBase, adminCtaChipSecondary } from "../../../_components/adminTheme";
import {
  STAFF_PREVIEW_LINKS,
  staffPreviewStatusLabel,
} from "@/app/admin/_lib/staffAdminAccess";
import { getCurrentAdminAccessContext } from "@/app/admin/_lib/adminAccessControl";
import { canAccessFullAdmin } from "@/app/admin/_lib/staffAdminAccess";

export const dynamic = "force-dynamic";

function statusBadgeClass(status: string): string {
  switch (status) {
    case "ready_for_partners":
      return "bg-emerald-100 text-emerald-900";
    case "internal_review":
      return "bg-amber-100 text-amber-900";
    case "in_progress":
      return "bg-sky-100 text-sky-900";
    case "needs_qa":
      return "bg-rose-100 text-rose-950";
    default:
      return "bg-[#F4F0E8] text-[#5C5346]";
  }
}

export default async function StaffWebsitePreviewPage() {
  const access = await getCurrentAdminAccessContext();
  const showRosterLink = canAccessFullAdmin(access);

  return (
    <div className="max-w-4xl space-y-6">
      <StaffTeamNav showRosterLink={showRosterLink} />

      <AdminPageHeader
        title="Website Preview"
        subtitle="This area lets authorized Leonix team members preview website pages while the public site remains locked. Use these links for internal review, partner walkthroughs, and sales preparation."
        helperText="Links open in a new tab. You must stay signed in to admin (leonix_admin cookie) when NEXT_PUBLIC_COMING_SOON_LOCK is enabled."
      />

      <div className={`${adminCardBase} border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950`}>
        <strong className="font-bold">Internal preview only.</strong> Use this while presenting to approved clients.
        Do not share unfinished pages publicly.
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
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${statusBadgeClass(link.status)}`}
                >
                  {staffPreviewStatusLabel(link.status)}
                </span>
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
