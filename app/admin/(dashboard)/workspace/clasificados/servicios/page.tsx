import Link from "next/link";
import { getAdminSupabase } from "@/app/lib/supabase/server";
import { adminCardBase, adminCtaChipSecondary } from "@/app/admin/_components/adminTheme";
import ServiciosAdminClient from "./ServiciosAdminClient";

export const dynamic = "force-dynamic";

export type ServiciosPublicAdminRow = {
  id: string;
  slug: string;
  business_name: string;
  city: string;
  published_at: string;
  updated_at: string | null;
  leonix_verified: boolean;
  listing_status: string | null;
  internal_group: string | null;
};

function schemaMissing(msg: string): boolean {
  return /column|does not exist|schema cache/i.test(msg.toLowerCase());
}

async function fetchServiciosPublicForAdmin(): Promise<{
  rows: ServiciosPublicAdminRow[];
  unavailable: boolean;
  fullSchema: boolean;
}> {
  try {
    const supabase = getAdminSupabase();
    const full = await supabase
      .from("servicios_public_listings")
      .select("id, slug, business_name, city, published_at, updated_at, leonix_verified, listing_status, internal_group")
      .order("updated_at", { ascending: false })
      .limit(80);

    if (!full.error && full.data) {
      const rows = (full.data as ServiciosPublicAdminRow[]).map((r) => ({
        ...r,
        listing_status: r.listing_status ?? null,
        updated_at: r.updated_at ?? null,
      }));
      return { rows, unavailable: false, fullSchema: true };
    }

    const msg = full.error?.message ?? "";
    if (schemaMissing(msg)) {
      const leg = await supabase
        .from("servicios_public_listings")
        .select("id, slug, business_name, city, published_at, leonix_verified")
        .order("published_at", { ascending: false })
        .limit(80);
      if (leg.error) return { rows: [], unavailable: true, fullSchema: false };
      const rows = (leg.data ?? []).map((r) => ({
        ...(r as Omit<ServiciosPublicAdminRow, "updated_at" | "listing_status" | "internal_group">),
        updated_at: null,
        listing_status: null,
        internal_group: null,
      }));
      return { rows, unavailable: false, fullSchema: false };
    }

    return { rows: [], unavailable: true, fullSchema: false };
  } catch {
    return { rows: [], unavailable: true, fullSchema: false };
  }
}

export default async function AdminServiciosWorkspacePage() {
  const { rows, unavailable, fullSchema } = await fetchServiciosPublicForAdmin();

  return (
    <div className="space-y-8">
      <div className={`${adminCardBase} border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-950`}>
        <p className="font-semibold text-[#1E1810]">Cola real (Supabase)</p>
        <p className="mt-1 text-xs text-[#14532d]">
          Los anuncios publicados en el flujo Servicios viven en{" "}
          <code className="rounded bg-white/80 px-1">servicios_public_listings</code>. Moderación y borrado siguen modelados en
          producto; aquí ves el directorio público tal como lo sirve la API.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/admin/workspace/clasificados?category=servicios&limit=300"
            className={`${adminCtaChipSecondary} justify-center text-xs`}
          >
            Clasificados · servicios (listings) →
          </Link>
        </div>
      </div>

      {!unavailable ? (
        <div className={`${adminCardBase} overflow-hidden p-0`}>
          <div className="border-b border-[#E8DFD0]/80 bg-[#FAF7F2]/90 px-4 py-2 text-xs font-semibold text-[#5C5346]">
            servicios_public_listings (lectura)
            {!fullSchema ? (
              <span className="ml-2 text-amber-900">
                — modo reducido (faltan columnas recientes; aplica migraciones Servicios)
              </span>
            ) : null}
          </div>
          {rows.length === 0 ? (
            <p className="p-4 text-sm text-[#5C5346]">No hay filas en la tabla o el proyecto no tiene datos aún.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead className="bg-[#FBF7EF]/90 text-left text-xs font-bold uppercase text-[#7A7164]">
                  <tr>
                    <th className="p-3">Negocio</th>
                    <th className="p-3">Ciudad</th>
                    <th className="p-3">Slug</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3">Verif.</th>
                    <th className="p-3">Actualizado</th>
                    <th className="p-3"> </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t border-[#E8DFD0]/80">
                      <td className="p-3 font-semibold text-[#1E1810]">{r.business_name}</td>
                      <td className="p-3 text-xs text-[#5C5346]">{r.city}</td>
                      <td className="p-3 font-mono text-xs text-[#3D3428]">{r.slug}</td>
                      <td className="p-3 text-xs">{r.listing_status ?? "—"}</td>
                      <td className="p-3 text-xs">{r.leonix_verified ? "sí" : "no"}</td>
                      <td className="p-3 text-xs text-[#7A7164]">
                        {r.updated_at
                          ? new Date(r.updated_at).toLocaleString()
                          : r.published_at
                            ? new Date(r.published_at).toLocaleString()
                            : "—"}
                      </td>
                      <td className="p-3">
                        <Link
                          href={`/clasificados/servicios/${r.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-[#6B5B2E] underline"
                        >
                          Vista pública ↗
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className={`${adminCardBase} border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950`}>
          No se pudo leer <code className="rounded bg-white/80 px-1">servicios_public_listings</code> (revisa migraciones y
          credenciales).
        </div>
      )}

      <ServiciosAdminClient />
    </div>
  );
}
