import Link from "next/link";
import { getAdminSupabase } from "@/app/lib/supabase/server";
import { adminCardBase, adminCtaChipSecondary } from "@/app/admin/_components/adminTheme";
import {
  isServiciosDevPublishPersistenceEnabled,
  listServiciosDevPublishRows,
} from "@/app/clasificados/servicios/lib/serviciosDevPublishPersistence";
import {
  setServiciosListingLeonixVerifiedAction,
  updateServiciosPublicListingStatusAction,
} from "./actions";

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
  owner_user_id?: string | null;
  profile_json?: { opsMeta?: { leonixVerifiedInterest?: boolean } } | null;
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
      .select(
        "id, slug, business_name, city, published_at, updated_at, leonix_verified, listing_status, internal_group, owner_user_id, profile_json",
      )
      .order("updated_at", { ascending: false })
      .limit(80);

    if (!full.error && full.data) {
      const rows = (full.data as ServiciosPublicAdminRow[]).map((r) => ({
        ...r,
        listing_status: r.listing_status ?? null,
        updated_at: r.updated_at ?? null,
        owner_user_id: r.owner_user_id ?? null,
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

function devFileRowsAsAdmin(): ServiciosPublicAdminRow[] {
  if (!isServiciosDevPublishPersistenceEnabled()) return [];
  return listServiciosDevPublishRows().map((r) => ({
    id: `dev-file:${r.slug}`,
    slug: r.slug,
    business_name: r.business_name,
    city: r.city,
    published_at: r.published_at,
    updated_at: r.published_at,
    leonix_verified: r.leonix_verified,
    listing_status: "published_dev_file",
    internal_group: r.internal_group,
  }));
}

export default async function AdminServiciosWorkspacePage() {
  const { rows, unavailable, fullSchema } = await fetchServiciosPublicForAdmin();
  const devAdminRows = devFileRowsAsAdmin();

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
            servicios_public_listings (operaciones)
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
                    <th className="p-3">Propietario</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3">Verif. Leonix</th>
                    <th className="p-3">Interés verif.</th>
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
                      <td className="p-3 font-mono text-[10px] text-[#7A7164]">{r.owner_user_id?.slice(0, 8) ?? "—"}…</td>
                      <td className="p-3 text-xs">
                        <form action={updateServiciosPublicListingStatusAction} className="flex flex-col gap-1">
                          <input type="hidden" name="listing_id" value={r.id} />
                          <select
                            name="listing_status"
                            defaultValue={r.listing_status ?? "published"}
                            className="max-w-[11rem] rounded border border-[#E8DFD0] bg-white px-1 py-1 text-[11px]"
                          >
                            <option value="pending_review">pending_review</option>
                            <option value="published">published</option>
                            <option value="paused_unpublished">paused_unpublished</option>
                            <option value="rejected">rejected</option>
                            <option value="suspended">suspended</option>
                            <option value="draft">draft</option>
                          </select>
                          <button
                            type="submit"
                            className="rounded border border-[#3B66AD]/40 bg-[#3B66AD]/10 px-2 py-0.5 text-[10px] font-bold text-[#2f5699]"
                          >
                            Guardar estado
                          </button>
                        </form>
                      </td>
                      <td className="p-3 text-xs">
                        <form action={setServiciosListingLeonixVerifiedAction} className="flex flex-col gap-1">
                          <input type="hidden" name="listing_id" value={r.id} />
                          <select
                            name="leonix_verified"
                            defaultValue={r.leonix_verified ? "1" : "0"}
                            className="max-w-[6rem] rounded border border-[#E8DFD0] bg-white px-1 py-1 text-[11px]"
                          >
                            <option value="0">no</option>
                            <option value="1">sí</option>
                          </select>
                          <button
                            type="submit"
                            className="rounded border border-[#E8DFD0] bg-white px-2 py-0.5 text-[10px] font-semibold"
                          >
                            Guardar verif.
                          </button>
                        </form>
                      </td>
                      <td className="p-3 text-xs">{r.profile_json?.opsMeta?.leonixVerifiedInterest ? "sí" : "—"}</td>
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

      {devAdminRows.length > 0 ? (
        <div className={`${adminCardBase} overflow-hidden border-sky-200 bg-sky-50/90 p-0`}>
          <div className="border-b border-sky-200/80 bg-sky-100/90 px-4 py-2 text-xs font-semibold text-sky-950">
            Publicaciones de prueba (archivo local <code className="rounded bg-white/80 px-1">.servicios-dev-publishes.json</code>)
            — solo desarrollo / <code className="rounded bg-white/80 px-1">SERVICIOS_DEV_PUBLISH=1</code>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-[#FBF7EF]/90 text-left text-xs font-bold uppercase text-[#7A7164]">
                <tr>
                  <th className="p-3">Negocio</th>
                  <th className="p-3">Ciudad</th>
                  <th className="p-3">Slug</th>
                  <th className="p-3"> </th>
                </tr>
              </thead>
              <tbody>
                {devAdminRows.map((r) => (
                  <tr key={r.id} className="border-t border-[#E8DFD0]/80">
                    <td className="p-3 font-semibold text-[#1E1810]">{r.business_name}</td>
                    <td className="p-3 text-xs text-[#5C5346]">{r.city}</td>
                    <td className="p-3 font-mono text-xs text-[#3D3428]">{r.slug}</td>
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
        </div>
      ) : null}

      <div className={`${adminCardBase} border-[#E8DFD0] bg-[#FFFCF7]/90 p-4 text-sm text-[#5C5346]`}>
        <p className="font-semibold text-[#1E1810]">Sandbox de tiers (localStorage)</p>
        <p className="mt-1 text-xs">
          Herramienta de diseño histórica — no escribe en Supabase. Para pruebas de boosts/tiers usa la pantalla aislada.
        </p>
        <Link
          href="/admin/workspace/clasificados/servicios/sandbox"
          className={`${adminCtaChipSecondary} mt-3 inline-flex justify-center text-xs`}
        >
          Abrir sandbox tiers →
        </Link>
      </div>
    </div>
  );
}
