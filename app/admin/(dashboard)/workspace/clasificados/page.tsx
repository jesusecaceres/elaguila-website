import Link from "next/link";
import { getAdminSupabase } from "@/app/lib/supabase/server";
import AdminListingsTable from "./AdminListingsTable";
import { EnVentaModerationFields } from "@/app/clasificados/en-venta/admin/EnVentaModerationFields";
import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import { AdminSectionCard } from "../../../_components/AdminSectionCard";
import { adminCardBase } from "../../../_components/adminTheme";

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
  detail_pairs?: unknown;
  boost_expires?: unknown;
};

type PageProps = {
  searchParams?: Promise<{ q?: string; category?: string; status?: string }>;
};

export default async function AdminClasificadosWorkspacePage(props: PageProps) {
  const supabase = getAdminSupabase();
  const sp = props.searchParams ? await props.searchParams : {};
  const qRaw = (sp.q ?? "").trim().toLowerCase();
  const catFilter = (sp.category ?? "").trim().toLowerCase();
  const statusFilter = (sp.status ?? "").trim().toLowerCase();

  const { data: listings, error } = await supabase
    .from("listings")
    .select(
      "id, title, description, city, category, price, is_free, status, owner_id, created_at, images, detail_pairs, boost_expires"
    )
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
        title="Clasificados — anuncios"
        subtitle="Cola operativa para todas las categorías. En Venta es el estándar vivo — usa las herramientas de moderación abajo. El registro de categorías y reportes siguen enlazados aquí."
        eyebrow="Workspace · Clasificados"
        helperText="Moderación y listados de anuncios viven aquí. Tienda (productos impresos/self-serve) es otro workspace: no mezclar flujos."
      />

      <div className={`${adminCardBase} mb-4 max-w-3xl p-4 text-xs text-[#5C5346]`}>
        <strong className="text-[#1E1810]">Destacados en la portada `/home`:</strong> no se generan solos desde esta cola. En{" "}
        <Link href="/admin/workspace/home/content" className="font-bold text-[#6B5B2E] underline">
          Home → contenido
        </Link>{" "}
        puedes enlazar manualmente a categorías o rutas públicas (chips). Aquí moderas anuncios en Supabase.
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/admin/workspace/clasificados/servicios"
          className="rounded-2xl border border-[#7A9E6F]/40 bg-[#F4FAF2] px-4 py-2 text-sm font-semibold text-[#2C4A22]"
        >
          Servicios (admin local) →
        </Link>
        <Link href="/admin/categories" className="rounded-2xl border border-[#C9B46A]/40 bg-[#FBF7EF] px-4 py-2 text-sm font-semibold text-[#5C4E2E]">
          Registro de categorías →
        </Link>
        <Link href="/admin/reportes" className="rounded-2xl border border-[#E8DFD0] bg-white px-4 py-2 text-sm font-semibold text-[#2C2416]">
          Reportes →
        </Link>
      </div>

      <div className={`${adminCardBase} mb-6 p-4`}>
        <form className="flex flex-wrap gap-3" method="get">
          <input
            name="q"
            defaultValue={qRaw}
            placeholder="Buscar título, ciudad o fragmento de ID…"
            className="min-w-[200px] flex-1 rounded-2xl border border-[#E8DFD0] bg-white px-4 py-2 text-sm"
          />
          <select name="category" defaultValue={catFilter} className="rounded-2xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm">
            <option value="">Todas las categorías</option>
            {cats.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select name="status" defaultValue={statusFilter} className="rounded-2xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm">
            <option value="">Todos los estados</option>
            <option value="active">active</option>
            <option value="pending">pending</option>
            <option value="flagged">flagged</option>
            <option value="sold">sold</option>
            <option value="removed">removed</option>
          </select>
          <button type="submit" className="rounded-2xl bg-[#2A2620] px-4 py-2 text-sm font-semibold text-[#FAF7F2]">
            Filtrar
          </button>
        </form>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error.message}</div>
      ) : (
        <AdminListingsTable listings={rows} />
      )}

      <AdminSectionCard
        title="En Venta — contrato de moderación"
        subtitle="Campos y copy específicos de la vertical En Venta en vivo."
      >
        <EnVentaModerationFields lang="es" />
      </AdminSectionCard>

      <div className="mt-8">
        <Link href="/admin/workspace" className="text-sm font-semibold text-[#2A2620] underline">
          ← Resumen de secciones del sitio
        </Link>
      </div>
    </>
  );
}
