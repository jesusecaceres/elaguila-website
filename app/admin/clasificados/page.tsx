import Link from "next/link";
import { getAdminSupabase } from "@/app/lib/supabase/server";
import AdminListingsTable from "./AdminListingsTable";

export default async function AdminClasificadosPage() {
  const supabase = getAdminSupabase();
  const { data: listings, error } = await supabase
    .from("listings")
    .select("id, title, description, city, category, price, is_free, status, owner_id, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#111111]">Listados (clasificados)</h1>
      <p className="mt-1 text-sm text-[#111111]/70">
        Ver y gestionar anuncios. Eliminar marca el anuncio como &quot;removed&quot;.
      </p>
      <div className="mt-6">
        {error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700">
            {error.message}
          </div>
        ) : (
          <AdminListingsTable listings={listings ?? []} />
        )}
      </div>
      <div className="mt-8">
        <Link
          href="/admin"
          className="inline-flex items-center rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-[#111111] hover:bg-[#F2EFE8] transition"
        >
          ← Volver al panel
        </Link>
      </div>
    </div>
  );
}
