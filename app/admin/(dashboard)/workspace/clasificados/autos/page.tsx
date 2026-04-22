import Link from "next/link";
import {
  autosClassifiedsRowToDashboardRow,
  listAllAutosClassifiedsRowsForAdmin,
} from "@/app/lib/clasificados/autos/autosClassifiedsListingService";
import type { AutosClassifiedsListingRow } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";
import {
  autosListingAdminVisibilityBucket,
  autosListingStatusLabelEs,
} from "@/app/lib/clasificados/autos/autosClassifiedsVisibility";
import { autosLiveVehiclePath } from "@/app/clasificados/autos/filters/autosBrowseFilterContract";
import { AdminPageHeader } from "../../../../_components/AdminPageHeader";
import { adminCardBase, adminCtaChipSecondary } from "../../../../_components/adminTheme";

export const dynamic = "force-dynamic";

function autosStripeAdminHint(row: AutosClassifiedsListingRow): string {
  if (row.stripe_payment_intent_id?.trim()) {
    const id = row.stripe_payment_intent_id.trim();
    return `pi…${id.slice(-8)}`;
  }
  if (row.stripe_checkout_session_id?.trim()) {
    const id = row.stripe_checkout_session_id.trim();
    return `cs…${id.slice(-8)}`;
  }
  return "—";
}

export default async function AdminAutosClassifiedsPage() {
  const rows = await listAllAutosClassifiedsRowsForAdmin(400);

  return (
    <div className="mx-auto max-w-[110rem] px-4 py-8 sm:px-6">
      <AdminPageHeader
        title="Autos — anuncios de pago (autos_classifieds_listings)"
        subtitle="Estado del flujo Leonix Autos (privado / negocios). «Publicado» = status active y visible en API pública y vitrina /clasificados/autos."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <Link href="/admin/workspace/clasificados" className={adminCtaChipSecondary}>
          ← Cola genérica listings
        </Link>
        <Link href="/publicar/autos" className={adminCtaChipSecondary} target="_blank" rel="noreferrer">
          Flujo publicar Autos (sitio) ↗
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className={`${adminCardBase} p-6 text-sm text-[#5C5346]`}>
          No hay filas en <code className="rounded bg-[#FBF7EF] px-1 text-[11px]">autos_classifieds_listings</code> o la base no
          está configurada con service role.
        </div>
      ) : (
        <div className={`${adminCardBase} overflow-x-auto p-0`}>
          <table className="min-w-full border-collapse text-left text-xs text-[#2C2416]">
            <thead className="border-b border-[#E8DFD0] bg-[#FAF7F2] text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">
              <tr>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Título</th>
                <th className="px-3 py-2">Vía</th>
                <th className="px-3 py-2">Dest.</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Visibilidad</th>
                <th className="px-3 py-2">Publicado</th>
                <th className="px-3 py-2">Stripe</th>
                <th className="px-3 py-2">Actualizado</th>
                <th className="px-3 py-2">Owner</th>
                <th className="px-3 py-2">Img</th>
                <th className="px-3 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const dash = autosClassifiedsRowToDashboardRow(r);
                const bucket = autosListingAdminVisibilityBucket(r.status);
                const vis =
                  bucket === "public"
                    ? "Público (autos)"
                    : bucket === "pre_publish"
                      ? "Pre-publicación"
                      : "Inactivo / retirado";
                const pub = r.published_at ? new Date(r.published_at).toLocaleString("es-MX") : "—";
                const updated = r.updated_at ? new Date(r.updated_at).toLocaleString("es-MX") : "—";
                const stripeHint = autosStripeAdminHint(r);
                const liveHref =
                  r.status === "active"
                    ? `${autosLiveVehiclePath(r.id)}?lang=${r.lang === "en" ? "en" : "es"}`
                    : null;
                return (
                  <tr key={r.id} className="border-b border-[#E8DFD0]/80">
                    <td className="max-w-[7rem] truncate px-3 py-2 font-mono text-[10px]" title={r.id}>
                      {r.id.slice(0, 8)}…
                    </td>
                    <td className="max-w-[14rem] truncate px-3 py-2 font-semibold" title={dash.title}>
                      {dash.title}
                    </td>
                    <td className="px-3 py-2">{r.lane}</td>
                    <td className="px-3 py-2">{r.featured ? "sí" : "no"}</td>
                    <td className="px-3 py-2">{autosListingStatusLabelEs(r.status)}</td>
                    <td className="px-3 py-2">{vis}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-[10px] text-[#5C5346]">{pub}</td>
                    <td
                      className="max-w-[8rem] truncate px-3 py-2 font-mono text-[10px]"
                      title={[r.stripe_checkout_session_id, r.stripe_payment_intent_id].filter(Boolean).join(" · ") || undefined}
                    >
                      {stripeHint}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-[10px] text-[#5C5346]">{updated}</td>
                    <td className="max-w-[6rem] truncate px-3 py-2 font-mono text-[10px]" title={r.owner_user_id}>
                      {r.owner_user_id.slice(0, 8)}…
                    </td>
                    <td className="px-3 py-2">{dash.thumbUrl ? "sí" : "no"}</td>
                    <td className="px-3 py-2">
                      {liveHref ? (
                        <Link href={liveHref} className="font-bold text-[#6B5B2E] underline" target="_blank" rel="noreferrer">
                          Ver público
                        </Link>
                      ) : (
                        <span className="text-[#7A7164]">—</span>
                      )}
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
