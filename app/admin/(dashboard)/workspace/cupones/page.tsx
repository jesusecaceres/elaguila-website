import Link from "next/link";
import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import { AdminSectionOwnershipCallout } from "../../../_components/AdminSectionOwnershipCallout";
import { adminBtnSecondary, adminCardBase, adminStubBadgeClass } from "../../../_components/adminTheme";

export const dynamic = "force-dynamic";

export default function AdminWorkspaceCuponesPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className={adminStubBadgeClass}>Legacy CMS — not the real control surface</span>
      </div>
      <AdminPageHeader
        eyebrow="Workspace · Cupones"
        title="Cupones"
        subtitle="`/cupones` and `/coupons` are rebuilt on the real Ofertas Locales search system (Cupones V1). The old `cupones_page` payload/editor below is no longer rendered anywhere — control the live pages from the Ofertas Locales queue instead."
        helperText="ADMIN-OS-01: confirmed via app/lib/website-audit/CUPONES_V1_PUBLIC_LANDING_RESULTS_SPLIT_AUDIT.md and direct code trace — CuponesPageClient.tsx (the old consumer) has zero live imports."
      />

      <AdminSectionOwnershipCallout
        sectionTitle="Cupones"
        publicPath="/cupones · /coupons"
        sourceOfTruth="Live: ofertas_locales / oferta_local_items (coupon-lane offers), reviewed at /admin/workspace/clasificados/ofertas-locales. `site_section_content.cupones_page` is retained but inert."
        siteSectionKey="cupones_page"
        adminEditors={[
          { label: "Real control surface — Ofertas Locales review queue", href: "/admin/workspace/clasificados/ofertas-locales" },
          { label: "Legacy editor (honestly disabled)", href: "/admin/workspace/cupones/content" },
        ]}
        notYet={[
          "A dedicated coupon-lane filter/badge inside the Ofertas Locales queue (today it's reachable, not visually distinguished from flyer offers).",
          "`coupons` transactional table with real expiry, quotas, codes, and redemption tracking, if the business requires it.",
        ]}
      />

      <div className={`${adminCardBase} space-y-3 p-6`}>
        <p className="text-sm text-[#5C5346]">
          <Link href="/cupones" className="font-bold text-[#6B5B2E] underline" target="_blank" rel="noreferrer">
            /cupones
          </Link>
          {" · "}
          <Link href="/coupons" className="font-bold text-[#6B5B2E] underline" target="_blank" rel="noreferrer">
            /coupons
          </Link>
        </p>
        <p className="text-sm text-[#5C5346]">
          <Link
            href="/admin/workspace/clasificados/ofertas-locales"
            className="font-bold text-[#6B5B2E] underline"
          >
            Open the real Ofertas Locales review queue →
          </Link>
        </p>
        <p className="text-xs text-[#7A7164]">
          <Link href="/admin/workspace/cupones/content" className="underline">
            View the disabled legacy editor →
          </Link>
        </p>
      </div>
      <Link href="/admin/workspace" className={`${adminBtnSecondary} inline-flex`} title="Back to section map">
        ← Workspace overview
      </Link>
    </div>
  );
}
