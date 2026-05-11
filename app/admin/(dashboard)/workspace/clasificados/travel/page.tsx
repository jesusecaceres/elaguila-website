import Link from "next/link";

import { ClassifiedAdminRowActions } from "../_components/ClassifiedAdminRowActions";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { adminBtnSecondary, adminCardBase } from "@/app/admin/_components/adminTheme";
import { fetchAllViajesStagedForAdmin } from "@/app/(site)/clasificados/viajes/lib/viajesStagedListingsDbServer";
import type { ViajesStagedListingRow } from "@/app/(site)/clasificados/viajes/lib/viajesStagedListingTypes";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const dynamic = "force-dynamic";

function fmt(ts: string | null | undefined) {
  if (!ts) return "—";
  try {
    return new Date(ts).toISOString().slice(0, 19).replace("T", " ");
  } catch {
    return ts;
  }
}

export default async function AdminTravelViajesQueuePage() {
  const configured = isSupabaseAdminConfigured();
  const rows: ViajesStagedListingRow[] = configured ? await fetchAllViajesStagedForAdmin() : [];

  return (
    <div className="max-w-[1200px] space-y-6">
      <AdminPageHeader
        eyebrow="Workspace · Clasificados"
        title="Viajes / Travel — ofertas (viajes_staged_listings)"
        subtitle="Todas las filas del pipeline Viajes. Las acciones staff aplican a la tabla public.viajes_staged_listings."
        rightSlot={
          <Link href="/admin/workspace/clasificados" className={adminBtnSecondary}>
            ← Hub Clasificados
          </Link>
        }
      />

      {!configured ? (
        <p className={`${adminCardBase} p-4 text-sm text-[#5C5346]`}>Supabase admin no configurado.</p>
      ) : rows.length === 0 ? (
        <p className={`${adminCardBase} p-4 text-sm text-[#5C5346]`}>Sin filas en viajes_staged_listings.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7] shadow-sm">
          <table className="min-w-full border-collapse text-left text-xs text-[#2C2416]">
            <thead className="bg-[#F3EBDD] text-[10px] font-bold uppercase tracking-wide text-[#5C5346]">
              <tr>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Leonix Ad ID</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Título</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Slug</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Estado</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Público</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Dest.</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Verif.</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Owner</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Publicado</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Enlaces</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const lx = r.leonix_ad_id ?? null;
                const promoted = Boolean(r.admin_promoted);
                const verified = Boolean(r.leonix_verified);
                const lifecycle = r.lifecycle_status;
                const isPublic = r.is_public;
                const publicLive = lifecycle === "approved" && isPublic;
                return (
                  <tr key={r.id} className="border-b border-[#F0E8DA] odd:bg-white/60">
                    <td className="px-3 py-2 font-mono text-[10px]">{lx ?? "—"}</td>
                    <td className="max-w-[200px] px-3 py-2 font-semibold">{r.title ?? "—"}</td>
                    <td className="px-3 py-2 font-mono text-[10px]">{r.slug}</td>
                    <td className="px-3 py-2">{lifecycle}</td>
                    <td className="px-3 py-2">{isPublic ? "sí" : "no"}</td>
                    <td className="px-3 py-2">{promoted ? "sí" : "no"}</td>
                    <td className="px-3 py-2">{verified ? "sí" : "no"}</td>
                    <td className="max-w-[120px] truncate px-3 py-2 font-mono text-[10px]" title={r.owner_user_id ?? ""}>
                      {r.owner_user_id?.slice(0, 8) ?? "—"}…
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-[10px]">{fmt(r.published_at)}</td>
                    <td className="space-y-1 px-3 py-2">
                      {publicLive ? (
                        <Link
                          href={`/clasificados/viajes/oferta/${encodeURIComponent(r.slug)}`}
                          className="block font-semibold text-[#6B5B2E] underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Ver público
                        </Link>
                      ) : (
                        <span className="text-[#7A7164]">—</span>
                      )}
                    </td>
                    <td className="min-w-[200px] px-3 py-2 align-top">
                      <ClassifiedAdminRowActions
                        variant="viajes"
                        rowId={r.id}
                        publicLive={publicLive}
                        promoted={promoted}
                        verified={verified}
                        canArchive={lifecycle !== "unpublished" && lifecycle !== "rejected"}
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
