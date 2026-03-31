import Link from "next/link";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { adminBtnPrimary, adminBtnSecondary, adminCardBase } from "@/app/admin/_components/adminTheme";
import {
  CatalogItemFormFields,
  catalogItemEmptyDefaults,
} from "@/app/admin/_components/tienda/CatalogItemFormFields";
import { createTiendaCatalogItemAction } from "@/app/admin/tiendaCatalogActions";

export default function AdminTiendaCatalogNewPage() {
  const d = catalogItemEmptyDefaults();

  return (
    <div className="space-y-8 max-w-4xl">
      <AdminPageHeader
        title="New catalog item"
        subtitle="Create an admin-managed Tienda product. Slug must be unique (lowercase, hyphens)."
        rightSlot={
          <Link href="/admin/tienda/catalog" className={adminBtnSecondary}>
            ← Back to list
          </Link>
        }
      />

      <form action={createTiendaCatalogItemAction} className={`${adminCardBase} p-6 space-y-6`}>
        <CatalogItemFormFields d={d} />

        <fieldset className="space-y-3 border-t border-[#E8DFD0] pt-6">
          <legend className="text-xs font-bold uppercase tracking-wide text-[#5C5346] mb-2">Primary image (optional)</legend>
          <p className="text-xs text-[#7A7164]">Paste a public image URL. You can add more images after save.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-[#5C5346] mb-1">Image URL</label>
              <input name="primary_image_url" className="w-full rounded-2xl border border-[#E8DFD0] bg-white/95 px-4 py-2.5 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-[#5C5346] mb-1">Alt ES</label>
                <input name="primary_image_alt_es" className="w-full rounded-2xl border border-[#E8DFD0] bg-white/95 px-4 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-[#5C5346] mb-1">Alt EN</label>
                <input name="primary_image_alt_en" className="w-full rounded-2xl border border-[#E8DFD0] bg-white/95 px-4 py-2.5 text-sm" />
              </div>
            </div>
          </div>
        </fieldset>

        <div className="flex flex-wrap gap-3">
          <button type="submit" className={adminBtnPrimary}>
            Create item
          </button>
          <Link href="/admin/tienda/catalog" className={adminBtnSecondary}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
