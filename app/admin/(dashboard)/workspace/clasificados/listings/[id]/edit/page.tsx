import Link from "next/link";
import { notFound } from "next/navigation";

import { updateListingCoreFieldsStaffAdminAction } from "@/app/admin/actions";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { adminBtnSecondary, adminCardBase } from "@/app/admin/_components/adminTheme";
import { getAdminSupabase } from "@/app/lib/supabase/server";

export const dynamic = "force-dynamic";

const LISTING_EDIT_SELECT =
  "id, title, description, city, category, price, is_free, status, is_published, owner_id, created_at";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminListingStaffEditPage(props: PageProps) {
  const { id } = await props.params;
  const supabase = getAdminSupabase();
  const { data: row, error } = await supabase.from("listings").select(LISTING_EDIT_SELECT).eq("id", id).maybeSingle();
  if (error || !row) notFound();

  const r = row as Record<string, unknown>;
  const title = String(r.title ?? "");
  const description = String(r.description ?? "");
  const city = String(r.city ?? "");
  const category = String(r.category ?? "");
  const status = String(r.status ?? "active");
  const price = r.price != null && typeof r.price === "number" ? String(r.price) : "";
  const isFree = Boolean(r.is_free);
  const isPublished = Boolean(r.is_published);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <AdminPageHeader
        eyebrow="Workspace · Clasificados"
        title="Editar anuncio (listings)"
        subtitle={`Staff — solo columnas reales de public.listings. ID: ${id}`}
        rightSlot={
          <Link href="/admin/workspace/clasificados" className={adminBtnSecondary}>
            ← Hub
          </Link>
        }
      />

      <form action={updateListingCoreFieldsStaffAdminAction} className={`${adminCardBase} space-y-4 p-5`}>
        <input type="hidden" name="listing_id" value={id} />
        <label className="block text-sm font-semibold text-[#1E1810]">
          Título
          <input name="title" defaultValue={title} className="mt-1 w-full rounded-xl border border-[#E8DFD0] px-3 py-2 text-sm" />
        </label>
        <label className="block text-sm font-semibold text-[#1E1810]">
          Descripción
          <textarea name="description" rows={6} defaultValue={description} className="mt-1 w-full rounded-xl border border-[#E8DFD0] px-3 py-2 text-sm" />
        </label>
        <label className="block text-sm font-semibold text-[#1E1810]">
          Ciudad
          <input name="city" defaultValue={city} className="mt-1 w-full rounded-xl border border-[#E8DFD0] px-3 py-2 text-sm" />
        </label>
        <label className="block text-sm font-semibold text-[#1E1810]">
          Categoría
          <input name="category" defaultValue={category} className="mt-1 w-full rounded-xl border border-[#E8DFD0] px-3 py-2 text-sm" />
        </label>
        <label className="block text-sm font-semibold text-[#1E1810]">
          Estado (status)
          <input name="status" defaultValue={status} className="mt-1 w-full rounded-xl border border-[#E8DFD0] px-3 py-2 text-sm" />
        </label>
        <label className="block text-sm font-semibold text-[#1E1810]">
          Precio (USD, vacío = null)
          <input name="price" defaultValue={price} className="mt-1 w-full rounded-xl border border-[#E8DFD0] px-3 py-2 text-sm" />
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-[#1E1810]">
          <input type="checkbox" name="is_free" defaultChecked={isFree} className="h-4 w-4" />
          Gratis / sin precio destacado
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-[#1E1810]">
          <input type="checkbox" name="is_published" defaultChecked={isPublished} className="h-4 w-4" />
          Publicado (is_published)
        </label>
        <button type="submit" className="rounded-xl bg-[#2A2620] px-4 py-2 text-sm font-bold text-[#FAF7F2]">
          Guardar cambios
        </button>
      </form>
    </div>
  );
}
