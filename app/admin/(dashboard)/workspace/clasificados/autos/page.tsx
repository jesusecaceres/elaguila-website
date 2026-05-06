import Link from "next/link";
import { autosRowMatchesAdminQueueSearch } from "@/app/admin/_lib/adminAdSearch";
import {
  autosClassifiedsRowToDashboardRow,
  listAllAutosClassifiedsRowsForAdmin,
} from "@/app/lib/clasificados/autos/autosClassifiedsListingService";
import { fetchProfileIdsMatchingAdminQueueSearch } from "@/app/lib/supabase/adminQueueProfileSearch";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import type { AutosClassifiedsListingRow } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";
import {
  autosListingAdminVisibilityBucket,
  autosListingStatusLabelEs,
} from "@/app/lib/clasificados/autos/autosClassifiedsVisibility";
import { autosLiveVehiclePath } from "@/app/clasificados/autos/filters/autosBrowseFilterContract";
import { AdminPageHeader } from "../../../../_components/AdminPageHeader";
import { adminBtnSecondary, adminCardBase, adminCtaChipSecondary } from "../../../../_components/adminTheme";

export const dynamic = "force-dynamic";

type AutosAdminPageProps = {
  searchParams?: Promise<{ q?: string }>;
};

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

export default async function AdminAutosClassifiedsPage(props: AutosAdminPageProps) {
  const sp = props.searchParams ? await props.searchParams : {};
  const qRaw = typeof sp.q === "string" ? sp.q.trim() : "";
  let rows = await listAllAutosClassifiedsRowsForAdmin(400);
  if (qRaw) {
    const profileSet = new Set<string>();
    if (isSupabaseAdminConfigured() && qRaw.length >= 2) {
      const supabase = getAdminSupabase();
      const pids = await fetchProfileIdsMatchingAdminQueueSearch(supabase, qRaw);
      for (const id of pids) profileSet.add(id);
    }
    rows = rows.filter((r) => {
      const dash = autosClassifiedsRowToDashboardRow(r);
      const L = r.listing_payload;
      const blob = [
        L.year,
        L.make,
        L.model,
        L.trim,
        L.vin,
        L.stockNumber,
        L.state,
        L.zip,
        L.dealerName,
        (L.description ?? "").slice(0, 500),
      ]
        .filter((x) => x != null && String(x).trim() !== "")
        .join(" ")
        .toLowerCase();
      const lx = r.leonix_ad_id ?? null;
      return autosRowMatchesAdminQueueSearch(
        {
          id: r.id,
          owner_user_id: r.owner_user_id,
          title: dash.title,
          city: dash.city,
          leonix_ad_id: lx,
          vehicleTextBlob: blob,
        },
        qRaw,
        profileSet,
      );
    });
  }

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

      <div className={`${adminCardBase} mb-6 space-y-3 p-4 text-sm text-[#5C5346]`}>
        <p className="font-bold text-[#1E1810]">Buscar cola</p>
        <p className="text-[10px] leading-snug text-[#7A7164]">
          Leonix Ad ID (si existe columna), UUID de anuncio o de usuario, URL /clasificados/autos/vehiculo/…, texto del vehículo
          (marca, modelo, VIN, etc.), título, ciudad, y coincidencia por nombre / correo / teléfono del perfil propietario.
        </p>
        <form className="flex flex-col flex-wrap gap-2 sm:flex-row sm:items-end" method="get" action="/admin/workspace/clasificados/autos">
          <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-xs">
            <span className="font-semibold text-[#5C5346]">q</span>
            <input
              name="q"
              defaultValue={qRaw}
              className="rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 font-mono text-xs text-[#1E1810]"
              placeholder="UUID, URL, título, email del owner…"
              autoComplete="off"
            />
          </label>
          <button type="submit" className="rounded-xl bg-[#2A2620] px-4 py-2 text-xs font-bold text-[#FAF7F2]">
            Aplicar
          </button>
          <Link href="/admin/workspace/clasificados/autos" className={`${adminBtnSecondary} inline-flex items-center text-xs`}>
            Limpiar
          </Link>
        </form>
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
                <th className="px-3 py-2">Leonix Ad ID</th>
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
                    <td className="max-w-[9rem] truncate px-3 py-2 font-mono text-[10px]" title={r.leonix_ad_id ?? ""}>
                      {r.leonix_ad_id ?? "—"}
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
