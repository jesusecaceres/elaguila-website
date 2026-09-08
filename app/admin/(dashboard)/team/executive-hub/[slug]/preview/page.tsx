import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentAdminAccessContext, requireAdminTeamAccess } from "@/app/admin/_lib/adminAccessControl";
import { DigitalContactPageClient } from "@/app/components/digitalContact/DigitalContactPageClient";
import { resolveDigitalContactLang } from "@/app/lib/digitalContact/digitalContactCopy";
import { getExecutiveHubRecord, executiveHubRecordToProfile } from "@/app/admin/_lib/executiveHubStore";
import { executiveHubStatusLabel } from "@/app/admin/_lib/executiveHubTypes";

export const dynamic = "force-dynamic";

/**
 * Executive Hub — Preview (Gate 7).
 * Renders the SAME `DigitalContactPageClient` component used by the live `/contact/[slug]`
 * route, fed with the admin's current saved draft. Full-viewport overlay so the preview
 * matches production pixel-for-pixel (no admin sidebar/chrome around it).
 */
export default async function PreviewExecutiveHubPage(props: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await getCurrentAdminAccessContext();
  requireAdminTeamAccess(access);

  const { slug } = await props.params;
  const sp = props.searchParams ? await props.searchParams : {};
  const record = await getExecutiveHubRecord(slug);
  if (!record) notFound();

  const profile = executiveHubRecordToProfile(record);
  const lang = resolveDigitalContactLang(sp);

  return (
    <div className="fixed inset-0 z-[999] overflow-y-auto bg-white">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-black/10 bg-[#1E1810] px-4 py-2.5 text-white">
        <p className="text-xs font-bold uppercase tracking-wide">
          Preview — {record.fullName} ({executiveHubStatusLabel(record.status)})
        </p>
        <Link
          href={`/admin/team/executive-hub/${record.slug}/edit`}
          className="rounded-lg border border-white/30 px-3 py-1.5 text-xs font-semibold hover:bg-white/10"
        >
          ← Back to editor
        </Link>
      </div>
      <DigitalContactPageClient profile={profile} initialLang={lang} />
    </div>
  );
}
