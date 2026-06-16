import Link from "next/link";
import { notFound } from "next/navigation";

import { updateListingCoreFieldsStaffAdminAction } from "@/app/admin/actions";
import { ClasificadosQueueHeader } from "@/app/admin/(dashboard)/workspace/clasificados/_components/ClasificadosQueueHeader";
import { AdminListingReviewSnapshot } from "@/app/admin/(dashboard)/workspace/clasificados/_components/AdminListingReviewSnapshot";
import { adminCardBase } from "@/app/admin/_components/adminTheme";
import { getAdminSupabase } from "@/app/lib/supabase/server";

export const dynamic = "force-dynamic";

const LISTING_EDIT_SELECT_FULL =
  "id, leonix_ad_id, title, description, city, category, price, is_free, status, is_published, owner_id, created_at, detail_pairs, images";
const LISTING_EDIT_SELECT_NO_IMAGES =
  "id, leonix_ad_id, title, description, city, category, price, is_free, status, is_published, owner_id, created_at, detail_pairs";
const LISTING_EDIT_SELECT_FALLBACK =
  "id, leonix_ad_id, title, description, city, category, price, is_free, status, is_published, owner_id, created_at";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminListingStaffEditPage(props: PageProps) {
  const { id } = await props.params;
  const supabase = getAdminSupabase();
  let row: Record<string, unknown> | null = null;
  for (const cols of [LISTING_EDIT_SELECT_FULL, LISTING_EDIT_SELECT_NO_IMAGES, LISTING_EDIT_SELECT_FALLBACK]) {
    const res = await supabase.from("listings").select(cols).eq("id", id).maybeSingle();
    if (!res.error && res.data) {
      row = res.data as unknown as Record<string, unknown>;
      break;
    }
  }
  if (!row) notFound();

  const ownerId = String(row.owner_id ?? "").trim();
  let ownerEmail: string | null = null;
  let ownerName: string | null = null;
  if (ownerId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, display_name")
      .eq("id", ownerId)
      .maybeSingle();
    ownerEmail = profile?.email?.trim() ?? null;
    ownerName = profile?.display_name?.trim() || null;
  }

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
  const detailPairsJson =
    r.detail_pairs != null ? JSON.stringify(r.detail_pairs, null, 2) : "[]";
  const queueBackHref = `/admin/workspace/clasificados?q=${encodeURIComponent(leonixAdId || id)}&status=${encodeURIComponent(status.toLowerCase())}#queue`;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <ClasificadosQueueHeader
        title="Edit listing (listings)"
        sourceTable="public.listings"
        subtitle={`Staff — category “${category}”. Core fields + detail_pairs (JSON). ID: ${id}`}
      />

      <AdminListingReviewSnapshot listing={r} ownerEmail={ownerEmail} ownerName={ownerName} />

      <form action={updateListingCoreFieldsStaffAdminAction} className={`${adminCardBase} space-y-4 p-5`}>
        <input type="hidden" name="listing_id" value={id} />
        <div className="grid gap-2 rounded-xl border border-[#E8DFD0] bg-[#FBF7EF]/80 p-3 text-xs text-[#3D3428]">
          <p>
            <span className="font-semibold">Leonix Ad ID</span>{" "}
            <span className="font-mono">{leonixAdId || "—"}</span> (read-only in DB; not editable here)
          </p>
          <p>
            <span className="font-semibold">Owner (owner_id)</span>{" "}
            <span className="break-all font-mono">{ownerId || "—"}</span> (read-only)
          </p>
        </div>
        <label className="block text-sm font-semibold text-[#1E1810]">
          Title
          <input name="title" defaultValue={title} className="mt-1 w-full rounded-xl border border-[#E8DFD0] px-3 py-2 text-sm" />
        </label>
        <label className="block text-sm font-semibold text-[#1E1810]">
          Description
          <textarea name="description" rows={6} defaultValue={description} className="mt-1 w-full rounded-xl border border-[#E8DFD0] px-3 py-2 text-sm" />
        </label>
        <label className="block text-sm font-semibold text-[#1E1810]">
          City
          <input name="city" defaultValue={city} className="mt-1 w-full rounded-xl border border-[#E8DFD0] px-3 py-2 text-sm" />
        </label>
        <label className="block text-sm font-semibold text-[#1E1810]">
          Category
          <input name="category" defaultValue={category} className="mt-1 w-full rounded-xl border border-[#E8DFD0] px-3 py-2 text-sm" />
        </label>
        <label className="block text-sm font-semibold text-[#1E1810]">
          Status
          <input name="status" defaultValue={status} className="mt-1 w-full rounded-xl border border-[#E8DFD0] px-3 py-2 text-sm" />
        </label>
        <label className="block text-sm font-semibold text-[#1E1810]">
          Price (USD, blank = null)
          <input name="price" defaultValue={price} className="mt-1 w-full rounded-xl border border-[#E8DFD0] px-3 py-2 text-sm" />
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-[#1E1810]">
          <input type="checkbox" name="is_free" defaultChecked={isFree} className="h-4 w-4" />
          Free / no featured price
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-[#1E1810]">
          <input type="checkbox" name="is_published" defaultChecked={isPublished} className="h-4 w-4" />
          Published (is_published)
        </label>
        <label className="block text-sm font-semibold text-[#1E1810]">
          detail_pairs (JSON — per-category application facts)
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
          <p className="text-xs text-amber-900">detail_pairs column is not available in this database — apply listings migrations.</p>
        )}
        <button type="submit" className="rounded-xl bg-[#2A2620] px-4 py-2 text-sm font-bold text-[#FAF7F2]">
          Save changes
        </button>
      </form>

      <div className="flex flex-wrap gap-4">
        <Link href={queueBackHref} className="text-sm font-semibold text-[#6B5B2E] underline">
          ← Back to review queue
        </Link>
        <Link href="/admin/workspace/clasificados" className="text-sm font-semibold text-[#6B5B2E] underline">
          Clasificados hub
        </Link>
      </div>
    </div>
  );
}
