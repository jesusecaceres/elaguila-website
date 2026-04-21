import Link from "next/link";
import { listRestaurantesPublicListingsAdminFromDb } from "@/app/clasificados/restaurantes/lib/restaurantesPublicListingsServer";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { adminBtnSecondary, adminCardBase } from "@/app/admin/_components/adminTheme";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { RestauranteAdminRowActions } from "./RestauranteAdminRowActions";

export const dynamic = "force-dynamic";

function fmt(ts: string | null | undefined) {
  if (!ts) return "—";
  try {
    return new Date(ts).toISOString().slice(0, 19).replace("T", " ");
  } catch {
    return ts;
  }
}

export default async function AdminRestaurantesPublicListingsPage() {
  const configured = isSupabaseAdminConfigured();
  const rows = configured ? await listRestaurantesPublicListingsAdminFromDb(400) : [];

  return (
    <div className="max-w-[1200px] space-y-6">
      <AdminPageHeader
        eyebrow="Workspace · Clasificados"
        title="Restaurantes — listados públicos (operación)"
        subtitle="Tabla viva sobre `restaurantes_public_listings` con acciones reales (suspender, destacar, verificar). Requiere cookie de admin y Supabase con rol de servicio."
        helperText="Las acciones escriben en Postgres, invalidan rutas públicas vía revalidatePath y dejan rastro en `admin_audit_log` cuando la tabla existe."
        rightSlot={
          <Link href="/admin/workspace/clasificados" className={adminBtnSecondary}>
            ← Hub Clasificados
          </Link>
        }
      />

      {!configured ? (
        <p className={`${adminCardBase} p-4 text-sm text-[#5C5346]`}>
          Supabase admin no está configurado en este entorno (<code className="rounded bg-[#FBF7EF] px-1">SUPABASE_SERVICE_ROLE_KEY</code>
          ). No hay filas que mostrar.
        </p>
      ) : rows.length === 0 ? (
        <p className={`${adminCardBase} p-4 text-sm text-[#5C5346]`}>La tabla existe pero no hay filas todavía.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7] shadow-sm">
          <table className="min-w-full border-collapse text-left text-xs text-[#2C2416]">
            <thead className="bg-[#F3EBDD] text-[10px] font-bold uppercase tracking-wide text-[#5C5346]">
              <tr>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Negocio</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Slug</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Estado</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Dest.</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Verif.</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Owner</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Plan</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Ciudad</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Cocinas / tipo</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Publicado</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Actualizado</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Enlaces</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const cuisineBits = [r.primary_cuisine, r.secondary_cuisine].filter(Boolean).join(" · ");
                const summary = [cuisineBits || "—", r.business_type || ""].filter(Boolean).join(" · ");
                const resultsHref = `/clasificados/restaurantes/resultados?lang=es&q=${encodeURIComponent(r.business_name)}`;
                return (
                  <tr key={r.id} className="border-b border-[#F0E8DA] odd:bg-white/60">
                    <td className="max-w-[200px] px-3 py-2 font-semibold">{r.business_name}</td>
                    <td className="px-3 py-2 font-mono text-[10px]">{r.slug}</td>
                    <td className="px-3 py-2">{r.status}</td>
                    <td className="px-3 py-2">{r.promoted ? "sí" : "no"}</td>
                    <td className="px-3 py-2">{r.leonix_verified ? "sí" : "no"}</td>
                    <td className="max-w-[120px] truncate px-3 py-2 font-mono text-[10px]" title={r.owner_user_id ?? ""}>
                      {r.owner_user_id ?? "—"}
                    </td>
                    <td className="px-3 py-2">{r.package_tier ?? "—"}</td>
                    <td className="px-3 py-2">{r.city_canonical}</td>
                    <td className="max-w-[220px] px-3 py-2 text-[11px] text-[#5C5346]">{summary}</td>
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-[10px]">{fmt(r.published_at)}</td>
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-[10px]">{fmt(r.updated_at)}</td>
                    <td className="space-y-1 px-3 py-2">
                      <Link
                        href={`/clasificados/restaurantes/${encodeURIComponent(r.slug)}?lang=es`}
                        className="block font-semibold text-[#6B5B2E] underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Ficha pública
                      </Link>
                      <Link href={resultsHref} className="block text-[#6B5B2E] underline" target="_blank" rel="noreferrer">
                        Resultados
                      </Link>
                    </td>
                    <td className="min-w-[200px] px-3 py-2 align-top">
                      <RestauranteAdminRowActions
                        listingId={r.id}
                        status={r.status}
                        promoted={r.promoted}
                        verified={r.leonix_verified}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
