import Link from "next/link";
import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import { adminCardBase, adminBtnSecondary } from "../../../_components/adminTheme";
import { getSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import { mergeHomeMarketing } from "@/app/lib/siteSectionContent/homeMarketingMerge";

export const dynamic = "force-dynamic";

function yn(v: boolean): string {
  return v ? "Yes" : "No";
}

/**
 * Home workspace hub — summary of persisted `home_marketing` (no form here; editor is `/content`).
 */
export default async function AdminWorkspaceHomePage() {
  const { payload, updatedAt } = await getSiteSectionPayload("home_marketing");
  const m = mergeHomeMarketing(payload as Parameters<typeof mergeHomeMarketing>[0]);

  const hasAnnouncementCopy = m.es.announcement.trim().length > 0 || m.en.announcement.trim().length > 0;

  // Home launch architecture is code-owned; legacy CMS fields retained for backward compatibility.
  // Only the announcement strip and the hero cover-column toggle are read by the public /home.
  const rows: { step: string; detail: string }[] = [
    {
      step: "1. Thin announcement above hero (CMS)",
      detail: `${yn(m.modules.showAnnouncement && hasAnnouncementCopy)} · “Show announcement strip” checkbox + copy in Content`,
    },
    {
      step: "2. Hero + current magazine edition (code-owned)",
      detail: `Cover column: ${yn(m.modules.showHeroImage)} · headline/copy/CTAs from homePageCopy.ts · cover, month and reader link from the shared magazine source`,
    },
    {
      step: "3–7. Discover Leonix · Featured businesses · Learn & Grow · Business visibility · Newsletter (code-owned)",
      detail: "Copy and routes live in app/(site)/home/homePageCopy.ts; not editable here",
    },
    {
      step: "Legacy fields (stored, not rendered)",
      detail: `title/identity/subtitle, CTA labels + URLs, cover image, promo strip, ${m.callouts.length} chip link(s) · kept read-only in Content for backward compatibility`,
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Home — main landing"
        subtitle="Public route is `/home` (magazine entry). The `/` screen is a separate experience (language picker) and is not edited here. Site-wide nav announcements live in Global settings."
        eyebrow="Workspace · Home"
        helperText="This page only summarizes what's saved in the database (home_marketing key). To change copy, links, and toggles, open Content."
      />

      <div className={`${adminCardBase} mb-6 border-[#7A9E6F]/35 bg-[#F8FCF6] p-4`}>
        <p className="text-sm text-[#2C4A22]">
          <strong>Persistent editor:</strong>{" "}
          <Link href="/admin/workspace/home/content" className="font-bold underline">
            Open `/home` content
          </Link>
          {" · "}
          <Link href="/admin/site-settings" className="font-bold underline">
            Global site settings
          </Link>{" "}
          (nav strips on all pages).
        </p>
      </div>

      <p className="mb-4 text-xs text-[#7A7164]">
        Last updated (DB): {updatedAt ? new Date(updatedAt).toLocaleString("en-US") : "—"}
      </p>

      <div className={`${adminCardBase} mb-8 p-6`}>
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Fixed order in `/home` template</h2>
        <p className="mt-1 text-xs text-[#7A7164]">
          Blocks follow this order in code. The launch Home is code-owned; Content edits only the announcement strip and the hero cover-column toggle.
        </p>
        <ul className="mt-4 space-y-3 text-sm text-[#3D3428]">
          {rows.map((r) => (
            <li key={r.step} className="rounded-2xl border border-[#E8DFD0]/80 bg-[#FFFCF7]/80 px-4 py-3">
              <p className="font-semibold text-[#1E1810]">{r.step}</p>
              <p className="mt-1 text-xs text-[#5C5346]/95">{r.detail}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className={`${adminCardBase} p-6`}>
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Visibility toggles (summary)</h2>
        <ul className="mt-3 grid gap-2 text-sm text-[#3D3428] sm:grid-cols-2">
          <li>Top announcement (live): {yn(m.modules.showAnnouncement)}</li>
          <li>Hero cover column (live): {yn(m.modules.showHeroImage)}</li>
          <li>Secondary line / promo (legacy, not rendered): {yn(m.modules.showSecondaryLine)}</li>
          <li>Featured links (legacy, not rendered): {yn(m.modules.showCallouts)}</li>
        </ul>
      </div>

      <div className="mt-8">
        <Link href="/admin/workspace/home/content" className={`${adminBtnSecondary} inline-flex`}>
          Edit `/home` content →
        </Link>
      </div>
    </div>
  );
}
