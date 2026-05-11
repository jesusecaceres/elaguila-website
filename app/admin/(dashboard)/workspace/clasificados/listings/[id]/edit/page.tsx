import Link from "next/link";
import { notFound } from "next/navigation";

import { updateListingCoreFieldsStaffAdminAction } from "@/app/admin/actions";
import { ClasificadosQueueHeader } from "@/app/admin/(dashboard)/workspace/clasificados/_components/ClasificadosQueueHeader";
import { adminCardBase } from "@/app/admin/_components/adminTheme";
import { getAdminSupabase } from "@/app/lib/supabase/server";

export const dynamic = "force-dynamic";

const LISTING_EDIT_SELECT_FULL =
  "id, leonix_ad_id, title, description, city, category, price, is_free, status, is_published, owner_id, created_at, detail_pairs";
const LISTING_EDIT_SELECT_FALLBACK =
  "id, leonix_ad_id, title, description, city, category, price, is_free, status, is_published, owner_id, created_at";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminListingStaffEditPage(props: PageProps) {
  const { id } = await props.params;
  const supabase = getAdminSupabase();
  let row: Record<string, unknown> | null = null;
  for (const cols of [LISTING_EDIT_SELECT_FULL, LISTING_EDIT_SELECT_FALLBACK]) {
    const res = await supabase.from("listings").select(cols).eq("id", id).maybeSingle();
    if (!res.error && res.data) {
      row = res.data as unknown as Record<string, unknown>;
      break;
    }
  }
  if (!row) notFound();
  const r = row;
  const title = String(r.title ?? "");
  const description = String(r.description ?? "");
  const city = String(r.city ?? "");
  const category = String(r.category ?? "");
  const status = String(r.status ?? "active");
  const price = r.price != null && typeof r.price === "number" ? String(r.price) : "";
  const isFree = Boolean(r.is_free);
  const isPublished = Boolean(r.is_published);
  const leonixAdId = String(r.leonix_ad_id ?? "").trim();
  const ownerId = String(r.owner_id ?? "").trim();
  const detailPairsJson =
    r.detail_pairs != null ? JSON.stringify(r.detail_pairs, null, 2) : "[]";

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <ClasificadosQueueHeader
        title="Editar anuncio (listings)"
        sourceTable="public.listings"
        subtitle={`Staff — categoría “${category}”. Campos núcleo + detail_pairs (JSON). ID: ${id}`}
      />

      <form action={updateListingCoreFieldsStaffAdminAction} className={`${adminCardBase} space-y-4 p-5`}>
        <input type="hidden" name="listing_id" value={id} />
        <div className="grid gap-2 rounded-xl border border-[#E8DFD0] bg-[#FBF7EF]/80 p-3 text-xs text-[#3D3428]">
          <p>
            <span className="font-semibold">Leonix Ad ID</span>{" "}
            <span className="font-mono">{leonixAdId || "—"}</span> (solo lectura en BD; no editable aquí)
          </p>
          <p>
            <span className="font-semibold">Propietario (owner_id)</span>{" "}
            <span className="break-all font-mono">{ownerId || "—"}</span> (solo lectura)
          </p>
        </div>
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
        <label className="block text-sm font-semibold text-[#1E1810]">
          detail_pairs (JSON — hechos de aplicación por categoría)
          <textarea
            name="detail_pairs_json"
            rows={12}
            defaultValue={detailPairsJson}
            disabled={!("detail_pairs" in r)}
            className="mt-1 w-full rounded-xl border border-[#E8DFD0] px-3 py-2 font-mono text-xs disabled:cursor-not-allowed disabled:bg-[#F4EFE4]"
            spellCheck={false}
          />
        </label>
        {"detail_pairs" in r ? null : (
          <p className="text-xs text-amber-900">La columna detail_pairs no está disponible en esta base — aplica migraciones listings.</p>
        )}
        <button type="submit" className="rounded-xl bg-[#2A2620] px-4 py-2 text-sm font-bold text-[#FAF7F2]">
          Guardar cambios
        </button>
      </form>

      <Link href="/admin/workspace/clasificados" className="text-sm font-semibold text-[#6B5B2E] underline">
        ← Hub Clasificados
      </Link>
    </div>
  );
}
