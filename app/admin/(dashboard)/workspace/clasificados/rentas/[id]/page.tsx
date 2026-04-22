import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminSupabase } from "@/app/lib/supabase/server";
import { parseLeonixListingContract } from "@/app/clasificados/lib/leonixRealEstateListingContract";
import { mapListingRowToRentasPublicListing } from "@/app/clasificados/rentas/data/mapListingRowToRentasPublicListing";
import { parseRentasDetailMachineRead } from "@/app/clasificados/rentas/lib/rentasDetailPairRead";
import { rentasListingPublicPath } from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { adminCardBase } from "@/app/admin/_components/adminTheme";

export const dynamic = "force-dynamic";

const INSPECTOR_COLS =
  "id, title, description, city, zip, category, price, is_free, status, owner_id, created_at, images, detail_pairs, boost_expires, is_published, seller_type, business_name, business_meta, contact_phone, contact_email";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminRentasListingInspectorPage(props: PageProps) {
  const { id } = await props.params;
  const supabase = getAdminSupabase();
  const { data, error } = await supabase.from("listings").select(INSPECTOR_COLS).eq("id", id).maybeSingle();

  if (error || !data) notFound();

  const row = data as Record<string, unknown>;
  if (String(row.category ?? "").toLowerCase() !== "rentas") notFound();

  const lx = parseLeonixListingContract(row.detail_pairs);
  const rx = parseRentasDetailMachineRead(row.detail_pairs);
  const publicProjectionEs = mapListingRowToRentasPublicListing(row, "es");

  return (
    <>
      <AdminPageHeader
        title={`Rentas — inspector · ${String(row.id).slice(0, 8)}…`}
        subtitle="Carga completa de la fila + pares Leonix/Rentas + proyección pública (mapListingRowToRentasPublicListing). Staff only."
        eyebrow="Workspace · Clasificados · Rentas"
        helperText="Usa esta vista para moderar contenido antes de aprobar; el detalle público solo muestra lo que esta proyección marca como visible en catálogo."
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <Link
          href="/admin/workspace/clasificados"
          className="text-sm font-semibold text-[#6B5B2E] underline"
        >
          ← Volver a cola Clasificados
        </Link>
        <Link
          href={rentasListingPublicPath(String(row.id))}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-[#6B5B2E] underline"
        >
          Abrir detalle público Rentas
        </Link>
      </div>

      <div className={`${adminCardBase} mb-4 space-y-3 p-4 text-sm`}>
        <h2 className="text-base font-bold text-[#1E1810]">Leonix contract (detail_pairs)</h2>
        <pre className="max-h-[14rem] overflow-auto rounded-lg bg-[#FAF7F2] p-3 text-xs leading-snug text-[#3D3428]">
          {JSON.stringify(lx, null, 2)}
        </pre>
      </div>

      <div className={`${adminCardBase} mb-4 space-y-3 p-4 text-sm`}>
        <h2 className="text-base font-bold text-[#1E1810]">Rentas machine read (Leonix:rent:* + negocio pairs)</h2>
        <pre className="max-h-[14rem] overflow-auto rounded-lg bg-[#FAF7F2] p-3 text-xs leading-snug text-[#3D3428]">
          {JSON.stringify(rx, null, 2)}
        </pre>
      </div>

      <div className={`${adminCardBase} mb-4 space-y-3 p-4 text-sm`}>
        <h2 className="text-base font-bold text-[#1E1810]">Public listing projection (es)</h2>
        <pre className="max-h-[20rem] overflow-auto rounded-lg bg-[#F4FAF2] p-3 text-xs leading-snug text-[#1E3D1F]">
          {JSON.stringify(publicProjectionEs, null, 2)}
        </pre>
      </div>

      <div className={`${adminCardBase} space-y-3 p-4 text-sm`}>
        <h2 className="text-base font-bold text-[#1E1810]">Raw row (JSON)</h2>
        <p className="text-xs text-[#5C5346]">
          Campos sensibles (contacto) solo para staff; no repliques en superficies públicas.
        </p>
        <pre className="max-h-[28rem] overflow-auto rounded-lg bg-[#FAF7F2] p-3 text-xs leading-snug text-[#3D3428]">
          {JSON.stringify(row, null, 2)}
        </pre>
      </div>
    </>
  );
}
