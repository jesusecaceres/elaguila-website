import Link from "next/link";
import { ADMIN_CATEGORIES_ADVANCED_REGISTRY_HREF } from "@/app/admin/_lib/adminGlobalNav";
import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import { AdminSectionOwnershipCallout } from "../../../_components/AdminSectionOwnershipCallout";
import { adminBtnSecondary, adminCardBase, adminReadOnlyBadgeClass, adminStubBadgeClass } from "../../../_components/adminTheme";

export const dynamic = "force-dynamic";

export default function AdminWorkspaceAnunciatePage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className={adminReadOnlyBadgeClass}>Read-only</span>
        <span className={adminStubBadgeClass}>No CRM</span>
      </div>
      <AdminPageHeader
        eyebrow="Workspace · Anúnciate"
        title="Anúnciate / publish"
        subtitle='The public “Anúnciate” menu sends users to login and publish flows (e.g. En venta). No form is saved here — operations live in Clasificados + auth.'
        helperText="Use this page as a map: quick links to the public hub and the admin ad queue. Leads/CRM are not modeled."
      />

      <AdminSectionOwnershipCallout
        sectionTitle="Anúnciate / publish"
        publicPath="/clasificados/publicar (+ branches)"
        sourceOfTruth="Auth + `listings` tables (Clasificados) and vertical-specific flows — no `anunciate_page` entity in DB."
        siteSectionKey={null}
        adminEditors={[
          { label: "Clasificados hub (queue, listings, cards)", href: "/admin/workspace/clasificados" },
          { label: "Customer ops (owner, email, listing id)", href: "/admin/ops" },
          { label: "Advanced registry (counts + Supabase)", href: ADMIN_CATEGORIES_ADVANCED_REGISTRY_HREF },
          { label: "Reports", href: "/admin/reportes" },
        ]}
        notYet={[
          "CRM / leads pipeline if product requires it.",
          "Unify publish → active listing funnel metrics.",
        ]}
      />

      <div className={`${adminCardBase} space-y-4 p-6`}>
        <h2 className="text-sm font-bold text-[#1E1810]">Public flow</h2>
        <ul className="list-inside list-disc space-y-2 text-sm text-[#5C5346]">
          <li>
            <Link
              href="/clasificados/publicar"
              className="font-bold text-[#6B5B2E] underline"
              target="_blank"
              rel="noreferrer"
              title="Clasificados publish hub"
            >
              /clasificados/publicar
            </Link>
          </li>
          <li>
            <Link
              href="/clasificados/publicar/en-venta"
              className="font-bold text-[#6B5B2E] underline"
              target="_blank"
              rel="noreferrer"
            >
              /clasificados/publicar/en-venta
            </Link>
          </li>
          <li>
            <Link href="/publicar/autos" className="font-bold text-[#6B5B2E] underline" target="_blank" rel="noreferrer">
              /publicar/autos
            </Link>{" "}
            (and business/private branches)
          </li>
        </ul>
      </div>

      <div className={`${adminCardBase} space-y-3 p-6`}>
        <h2 className="text-sm font-bold text-[#1E1810]">Admin operations</h2>
        <p className="text-xs text-[#7A7164]">Moderation and database-backed ads:</p>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/workspace/clasificados"
            className="rounded-lg border border-[#C9B46A]/40 bg-[#FBF7EF] px-4 py-2 text-sm font-semibold text-[#5C4E2E]"
            title="Supabase listings queue"
          >
            Clasificados workspace
          </Link>
          <Link
            href={ADMIN_CATEGORIES_ADVANCED_REGISTRY_HREF}
            className="rounded-lg border border-[#E8DFD0] bg-white px-4 py-2 text-sm font-semibold text-[#2C2416]"
            title="Dense table: site_category_config and counts"
          >
            Advanced registry
          </Link>
          <Link href="/admin/reportes" className="rounded-lg border border-[#E8DFD0] bg-white px-4 py-2 text-sm font-semibold text-[#2C2416]">
            Reports
          </Link>
        </div>
      </div>

      <Link href="/admin/workspace" className={`${adminBtnSecondary} inline-flex`} title="Back to section map">
        ← Workspace overview
      </Link>
    </div>
  );
}
