import Link from "next/link";
import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import { AdminSectionOwnershipCallout } from "../../../_components/AdminSectionOwnershipCallout";
import { adminBtnSecondary, adminCardBase, adminPartialBadgeClass } from "../../../_components/adminTheme";

export const dynamic = "force-dynamic";

export default function AdminWorkspaceCuponesPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-900">
          Persisted cards
        </span>
        <span className={adminPartialBadgeClass}>No quotas / scans yet</span>
      </div>
      <AdminPageHeader
        eyebrow="Workspace · Cupones"
        title="Cupones"
        subtitle="A single payload (`cupones_page`) feeds `/cupones` and `/coupons` with bilingual copy and up to 8 cards. No redemption, QR, or per-user limits yet."
        helperText="Images must exist under /public (e.g. /coupons/…)."
      />

      <AdminSectionOwnershipCallout
        sectionTitle="Cupones"
        publicPath="/cupones · /coupons"
        sourceOfTruth="Coupon marketing: `site_section_content.cupones_page`. No transactional table yet."
        siteSectionKey="cupones_page"
        adminEditors={[
          { label: "Page & card editor", href: "/admin/workspace/cupones/content" },
          { label: "Tienda — storefront", href: "/admin/workspace/tienda/storefront" },
          { label: "Home — content", href: "/admin/workspace/home/content" },
          { label: "Global settings", href: "/admin/site-settings" },
        ]}
        notYet={[
          "`coupons` table with real expiry, quotas, codes, and audit if the business requires it.",
          "Redemption flow or POS integration.",
          "Minimal viable schema: unique code, max_redemptions, valid_from/until, revocation, and `coupon_redemptions` (optional user_id, timestamp).",
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
        <p className="text-xs text-[#7A7164]">
          <Link href="/admin/workspace/cupones/content" className="font-bold text-[#6B5B2E] underline">
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
