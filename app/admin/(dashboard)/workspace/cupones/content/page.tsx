import Link from "next/link";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { adminBtnSecondary, adminCardBase, adminStubBadgeClass } from "@/app/admin/_components/adminTheme";
import { getSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";

export const dynamic = "force-dynamic";

/**
 * ADMIN-OS-01 — this editor previously saved a `cupones_page` payload that no
 * live page has rendered since the Cupones V1 rebuild (see
 * app/lib/website-audit/CUPONES_V1_PUBLIC_LANDING_RESULTS_SPLIT_AUDIT.md):
 * `/cupones` and `/coupons` now render OfertasLocalesPublicSearchClient,
 * sourced from the real ofertas_locales/oferta_local_items tables, not this
 * site_section_content row. Saving here silently did nothing on the live
 * site. The write path itself is left intact (no data loss for whatever was
 * previously saved), but the form is removed so no one can be misled into
 * thinking a save here changes what a visitor sees — see Master Operating
 * Book §6 (truth states) and §7 (no orphaned/misleading controls).
 */
export default async function AdminCuponesContentPage() {
  const { updatedAt } = await getSiteSectionPayload("cupones_page");

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className={adminStubBadgeClass}>Not connected to live output</span>
      </div>
      <AdminPageHeader
        eyebrow="Workspace · Cupones"
        title="`cupones_page` editor — honestly disabled"
        subtitle="This form used to save a page-title/intro/8-coupon-card payload, but `/cupones` and `/coupons` no longer read it."
        helperText="Editing here would have no visible effect on the live site."
        rightSlot={
          <Link href="/admin/workspace/cupones" className={adminBtnSecondary}>
            ← Workspace overview
          </Link>
        }
      />

      <div className={`${adminCardBase} space-y-3 p-6`}>
        <p className="text-sm text-[#5C5346]">
          <code className="rounded bg-white/80 px-1">/cupones</code> and{" "}
          <code className="rounded bg-white/80 px-1">/coupons</code> were rebuilt on top of the real Ofertas Locales
          search/results system (Cupones V1). They now render live{" "}
          <code className="rounded bg-white/80 px-1">ofertas_locales</code> /{" "}
          <code className="rounded bg-white/80 px-1">oferta_local_items</code> data, not the{" "}
          <code className="rounded bg-white/80 px-1">cupones_page</code> content this form used to save.
        </p>
        <p className="text-sm text-[#5C5346]">
          To control what actually appears on those public pages, review and approve coupon-lane offers in the real
          Ofertas Locales queue:
        </p>
        <Link
          href="/admin/workspace/clasificados/ofertas-locales"
          className="inline-flex min-h-[40px] items-center rounded-lg bg-[#2A2620] px-4 py-2 text-sm font-bold text-white"
        >
          Open Ofertas Locales review queue →
        </Link>
        <p className="text-xs text-[#7A7164]">
          A previously-saved payload (last updated: {updatedAt ? new Date(updatedAt).toLocaleString("en-US") : "—"})
          may still exist in <code className="rounded bg-white/70 px-1">site_section_content.cupones_page</code>, but
          it is inert — kept only so no historical data is silently deleted.
        </p>
      </div>
    </div>
  );
}
