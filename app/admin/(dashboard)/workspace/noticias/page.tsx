import Link from "next/link";
import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import { AdminSectionOwnershipCallout } from "../../../_components/AdminSectionOwnershipCallout";
import { adminBtnSecondary, adminCardBase, adminPartialBadgeClass } from "../../../_components/adminTheme";

export const dynamic = "force-dynamic";

export default function AdminWorkspaceNoticiasPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-900">
          Persisted shell
        </span>
        <span className={adminPartialBadgeClass}>RSS feed · not a CMS</span>
      </div>
      <AdminPageHeader
        eyebrow="Workspace · Noticias"
        title="Noticias"
        subtitle="Owns `/noticias`. Frame (title, subtitle, breaking label) is stored in Supabase; articles still come from the RSS API and template categories."
        helperText="For chips linking to this section from the homepage, use Home → content."
      />

      <AdminSectionOwnershipCallout
        sectionTitle="Noticias"
        publicPath="/noticias"
        sourceOfTruth="Shell: `site_section_content.noticias_page`. Dynamic content: `/api/rss` + React template (categories and cards)."
        siteSectionKey="noticias_page"
        adminEditors={[
          { label: "Shell editor (title / subtitle / breaking)", href: "/admin/workspace/noticias/content" },
          { label: "Home — content (chips / manual links)", href: "/admin/workspace/home/content" },
          { label: "Global site settings", href: "/admin/site-settings" },
          { label: "Customer ops", href: "/admin/ops" },
        ]}
        notYet={[
          "Full editorial model: owned articles in Postgres, markdown in git, or external integration.",
          "Editing tab taxonomy (Latest, Sports…) without deploy.",
          "Next minimal step: `news_articles` table + slug/body/published_at + `/noticias` read with RSS fallback.",
        ]}
      />

      <div className={`${adminCardBase} p-6`}>
        <p className="text-sm text-[#5C5346]">
          <Link href="/noticias" className="font-bold text-[#6B5B2E] underline" target="_blank" rel="noreferrer" title="Public view">
            Open /noticias on site
          </Link>
        </p>
        <p className="mt-3 text-xs text-[#7A7164]">
          <Link href="/admin/workspace/noticias/content" className="font-bold text-[#6B5B2E] underline">
            Go to shell editor →
          </Link>
        </p>
      </div>
      <Link href="/admin/workspace" className={`${adminBtnSecondary} inline-flex`} title="Back to section map">
        ← Workspace overview
      </Link>
    </div>
  );
}
