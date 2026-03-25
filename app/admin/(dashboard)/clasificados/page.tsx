import Link from "next/link";
import { getAdminSupabase } from "@/app/lib/supabase/server";
import AdminListingsTable from "./AdminListingsTable";
import { EnVentaModerationFields } from "@/app/clasificados/en-venta/admin/EnVentaModerationFields";
import { AdminPageHeader } from "../../_components/AdminPageHeader";
import { AdminSectionCard } from "../../_components/AdminSectionCard";
import { adminCardBase } from "../../_components/adminTheme";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  title: string | null;
  description: string | null;
  city: string | null;
  category: string | null;
  price: number | null;
  is_free: boolean | null;
  status: string | null;
  owner_id: string | null;
  created_at: string | null;
  images?: unknown;
};

type PageProps = {
  searchParams?: Promise<{ q?: string; category?: string; status?: string }>;
};

export default async function AdminAdsPage(props: PageProps) {
  const supabase = getAdminSupabase();
  const sp = props.searchParams ? await props.searchParams : {};
  const qRaw = (sp.q ?? "").trim().toLowerCase();
  const catFilter = (sp.category ?? "").trim().toLowerCase();
  const statusFilter = (sp.status ?? "").trim().toLowerCase();

  const { data: listings, error } = await supabase
    .from("listings")
    .select("id, title, description, city, category, price, is_free, status, owner_id, created_at, images")
    .order("created_at", { ascending: false })
    .limit(300);

  let rows = (listings ?? []) as Row[];
  if (catFilter) rows = rows.filter((r) => (r.category ?? "").toLowerCase() === catFilter);
  if (statusFilter) rows = rows.filter((r) => (r.status ?? "").toLowerCase() === statusFilter);
  if (qRaw) {
    rows = rows.filter((r) => {
      const id = r.id.toLowerCase();
      const title = (r.title ?? "").toLowerCase();
      const city = (r.city ?? "").toLowerCase();
      return id.includes(qRaw) || title.includes(qRaw) || city.includes(qRaw);
    });
  }

  const cats = Array.from(new Set((listings ?? []).map((x) => (x as Row).category).filter(Boolean))) as string[];

  return (
    <>
      <AdminPageHeader
        title="Ads (Clasificados)"
        subtitle="Operational queue for all listing categories. En Venta is the primary live standard — use moderation tools below."
        eyebrow="Leonix +admin"
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <Link href="/admin/categories" className="rounded-2xl border border-[#C9B46A]/40 bg-[#FBF7EF] px-4 py-2 text-sm font-semibold text-[#5C4E2E]">
          Category registry →
        </Link>
        <Link href="/admin/reportes" className="rounded-2xl border border-[#E8DFD0] bg-white px-4 py-2 text-sm font-semibold text-[#2C2416]">
          Reports →
        </Link>
      </div>

      <div className={`${adminCardBase} mb-6 p-4`}>
        <form className="flex flex-wrap gap-3" method="get">
          <input
            name="q"
            defaultValue={qRaw}
            placeholder="Search title, city, or ID fragment…"
            className="min-w-[200px] flex-1 rounded-2xl border border-[#E8DFD0] bg-white px-4 py-2 text-sm"
          />
          <select name="category" defaultValue={catFilter} className="rounded-2xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm">
            <option value="">All categories</option>
            {cats.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select name="status" defaultValue={statusFilter} className="rounded-2xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm">
            <option value="">All statuses</option>
            <option value="active">active</option>
            <option value="pending">pending</option>
            <option value="flagged">flagged</option>
            <option value="sold">sold</option>
            <option value="removed">removed</option>
          </select>
          <button type="submit" className="rounded-2xl bg-[#2A2620] px-4 py-2 text-sm font-semibold text-[#FAF7F2]">
            Filter
          </button>
        </form>
        {/* Future: public_publish_id column — wire here for exact public ID lookup. */}
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error.message}</div>
      ) : (
        <AdminListingsTable listings={rows} />
      )}

      <AdminSectionCard
        title="En Venta — moderation contract"
        subtitle="Category-specific fields and copy for the live En Venta vertical."
      >
        <EnVentaModerationFields lang="es" />
      </AdminSectionCard>

      <div className="mt-8">
        <Link href="/admin" className="text-sm font-semibold text-[#2A2620] underline">
          ← Dashboard
        </Link>
      </div>
    </>
  );
}
