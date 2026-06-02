import Link from "next/link";
import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import { AdminSectionOwnershipCallout } from "../../../_components/AdminSectionOwnershipCallout";
import { adminBtnSecondary, adminCardBase, adminPartialBadgeClass, adminStubBadgeClass } from "../../../_components/adminTheme";

export const dynamic = "force-dynamic";

export default function AdminWorkspaceIglesiasPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-900">
          Persisted copy
        </span>
        <span className={adminStubBadgeClass}>Directory · backlog</span>
        <span className={adminPartialBadgeClass}>No church rows yet</span>
      </div>
      <AdminPageHeader
        eyebrow="Workspace · Iglesias"
        title="Iglesias"
        subtitle="Public landing `/iglesias` with editable transitional message. When a directory exists, listings will come from the database + migrations."
        helperText="Public contact for early submissions remains on the site Contact page."
      />

      <AdminSectionOwnershipCallout
        sectionTitle="Iglesias"
        publicPath="/iglesias"
        sourceOfTruth="Transitional copy: `site_section_content.iglesias_page`. Directory: not modeled in Postgres yet."
        siteSectionKey="iglesias_page"
        adminEditors={[
          { label: "Copy editor", href: "/admin/workspace/iglesias/content" },
          { label: "Contact (public support details)", href: "/admin/workspace/contacto/content" },
          { label: "Customer ops", href: "/admin/ops" },
        ]}
        notYet={[
          "Congregations table, geodata, moderation, and submission flow.",
          "Admin search and filters linked to profiles or accounts.",
          "Suggested minimal migration: `churches` (id, name, city, slug, published_at, optional geom) + public read RLS + service-role write only.",
        ]}
      />

      <div className={`${adminCardBase} p-6`}>
        <Link href="/iglesias" className="font-bold text-[#6B5B2E] underline" target="_blank" rel="noreferrer">
          Open /iglesias
        </Link>
        <p className="mt-3 text-xs text-[#7A7164]">
          <Link href="/admin/workspace/iglesias/content" className="font-bold text-[#6B5B2E] underline">
            Go to editor →
          </Link>
        </p>
      </div>
      <Link href="/admin/workspace" className={`${adminBtnSecondary} inline-flex`} title="Back to section map">
        ← Workspace overview
      </Link>
    </div>
  );
}
