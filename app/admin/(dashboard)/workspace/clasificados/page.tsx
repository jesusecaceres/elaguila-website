import Link from "next/link";
import { getAdminSupabase } from "@/app/lib/supabase/server";
import { fetchListingsForAdminWorkspace } from "@/app/admin/_lib/listingsAdminSelect";
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

  const { data: listings, error, detailPairsAvailable } = await fetchListingsForAdminWorkspace(supabase);

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

      {!detailPairsAvailable ? (
        <div
          className={`${adminCardBase} mb-4 max-w-3xl border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950`}
          role="status"
        >
          <strong className="font-bold">Base sin columna listings.detail_pairs.</strong> La cola carga en modo reducido: la columna
          “En venta · vis.” no puede mostrar plan / renovación hasta migrar. Aplica en Supabase la migración{" "}
          <code className="rounded bg-white/80 px-1 text-[11px]">20250316200000_listings_detail_pairs.sql</code> o{" "}
          <code className="rounded bg-white/80 px-1 text-[11px]">20260407140000_ensure_listings_detail_pairs.sql</code> (idempotente)
          y vuelve a cargar.
        </div>
      ) : null}

      <div className={`${adminCardBase} mb-4 max-w-3xl p-4 text-xs text-[#5C5346]`}>
        <strong className="text-[#1E1810]">Destacados en la portada `/home`:</strong> no se generan solos desde esta cola. En{" "}
        <Link href="/admin/workspace/home/content" className="font-bold text-[#6B5B2E] underline">
          Home → contenido
        </Link>{" "}
        puedes enlazar manualmente a categorías o rutas públicas (chips). Aquí moderas anuncios en Supabase.
      </div>

      <div className={`${adminCardBase} mb-4 max-w-3xl p-4 text-xs text-[#5C5346]`}>
        <strong className="text-[#1E1810]">Ramas inmobiliarias (BR / Rentas):</strong> cuando los listados vivan en{" "}
        <code className="rounded bg-white/80 px-1 text-[11px]">listings</code>, usa{" "}
        <code className="rounded bg-white/80 px-1 text-[11px]">category</code> y{" "}
        <code className="rounded bg-white/80 px-1 text-[11px]">detail_pairs</code> para distinguir venta vs renta, Privado vs
        Negocio y tipo de propiedad. Vista previa de publicación no es listado público:{" "}
        <code className="rounded bg-white/80 px-1 text-[11px]">/clasificados/bienes-raices/preview/*</code>,{" "}
        <code className="rounded bg-white/80 px-1 text-[11px]">/clasificados/rentas/preview/*</code>.
      </div>

      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Link
          href="/admin/workspace/clasificados/servicios"
          className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-[#7A9E6F]/40 bg-[#F4FAF2] px-4 py-2 text-center text-sm font-semibold text-[#2C4A22] sm:min-h-0 sm:inline-flex"
          title="Simulación en navegador (localStorage), no es la cola real de Supabase"
        >
          Servicios (simulación local) →
        </Link>
        <Link
          href="/admin/categories"
          className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-[#C9B46A]/40 bg-[#FBF7EF] px-4 py-2 text-center text-sm font-semibold text-[#5C4E2E] sm:min-h-0"
        >
          Registro de categorías →
        </Link>
        <Link
          href="/admin/reportes"
          className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-[#E8DFD0] bg-white px-4 py-2 text-center text-sm font-semibold text-[#2C2416] sm:min-h-0"
        >
          Reportes →
        </Link>
      </div>

      <div className={`${adminCardBase} mb-6 p-4`}>
        <form className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end" method="get">
          <input
            name="q"
            defaultValue={qRaw}
            placeholder="Buscar título, ciudad o fragmento de ID…"
            className="w-full min-w-0 rounded-2xl border border-[#E8DFD0] bg-white px-4 py-3 text-base sm:min-w-[12rem] sm:flex-1 sm:py-2 sm:text-sm"
          />
          <select
            name="category"
            defaultValue={catFilter}
            className="w-full min-w-0 rounded-2xl border border-[#E8DFD0] bg-white px-3 py-3 text-base sm:w-auto sm:min-w-[10rem] sm:py-2 sm:text-sm"
          >
            <option value="">Todas las categorías</option>
            {cats.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            name="status"
            defaultValue={statusFilter}
            className="w-full min-w-0 rounded-2xl border border-[#E8DFD0] bg-white px-3 py-3 text-base sm:w-auto sm:min-w-[9rem] sm:py-2 sm:text-sm"
          >
            <option value="">Todos los estados</option>
            <option value="active">active</option>
            <option value="pending">pending</option>
            <option value="flagged">flagged</option>
            <option value="sold">sold</option>
            <option value="removed">removed</option>
          </select>
          <button
            type="submit"
            className="min-h-[44px] w-full rounded-2xl bg-[#2A2620] px-4 py-3 text-sm font-semibold text-[#FAF7F2] sm:min-h-0 sm:w-auto sm:py-2"
          >
            Filtrar
          </button>
        </form>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error.message}</div>
      ) : (
        <AdminListingsTable listings={rows} detailPairsAvailable={detailPairsAvailable} />
      )}

      <AdminSectionCard
        title="En Venta — contrato de moderación"
        subtitle="Solo referencia (lista de motivos). No envía cambios a la base — documentación para el equipo."
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
