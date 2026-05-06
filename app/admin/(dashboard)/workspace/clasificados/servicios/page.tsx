import Link from "next/link";
import { getAdminSupabase } from "@/app/lib/supabase/server";
import { adminBtnSecondary, adminCardBase, adminCtaChipSecondary } from "@/app/admin/_components/adminTheme";
import {
  isServiciosDevPublishPersistenceEnabled,
  listServiciosDevPublishRows,
} from "@/app/clasificados/servicios/lib/serviciosDevPublishPersistence";
import { listServiciosPublicListingsAdminQueueFromDb } from "@/app/clasificados/servicios/lib/serviciosPublicListingsServer";
import { listPendingServiciosReviews } from "@/app/clasificados/servicios/lib/serviciosOpsTablesServer";
import {
  setServiciosListingLeonixVerifiedAction,
  setServiciosReviewModerationStatusAction,
  updateServiciosPublicListingStatusAction,
} from "./actions";

export const dynamic = "force-dynamic";

export type ServiciosPublicAdminRow = {
  id: string;
  slug: string;
  leonix_ad_id?: string | null;
  business_name: string;
  city: string;
  published_at: string;
  updated_at: string | null;
  leonix_verified: boolean;
  listing_status: string | null;
  internal_group: string | null;
  owner_user_id?: string | null;
  moderation_notes?: string | null;
  profile_json?: { opsMeta?: { leonixVerifiedInterest?: boolean } } | null;
};

type ServiciosLeadAdminRow = {
  id: string;
  listing_slug: string;
  sender_name: string;
  sender_email: string;
  message: string;
  request_kind: string;
  created_at: string;
};

async function fetchServiciosLeadsForAdmin(): Promise<ServiciosLeadAdminRow[]> {
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("servicios_public_leads")
      .select("id, listing_slug, sender_name, sender_email, message, request_kind, created_at")
      .order("created_at", { ascending: false })
      .limit(60);
    if (error || !data) return [];
    return data as ServiciosLeadAdminRow[];
  } catch {
    return [];
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

function firstParam(v: string | string[] | undefined): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && v.length > 0) return v[0];
  return undefined;
}

function filterDevServiciosRows(rows: ServiciosPublicAdminRow[], q: string | undefined): ServiciosPublicAdminRow[] {
  const n = (q ?? "").trim().toLowerCase();
  if (!n) return rows;
  return rows.filter(
    (r) =>
      r.slug.toLowerCase().includes(n) ||
      r.business_name.toLowerCase().includes(n) ||
      r.id.toLowerCase().includes(n),
  );
}

export default async function AdminServiciosWorkspacePage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = props.searchParams ? await props.searchParams : {};
  const queueFilters = {
    limit: 500,
    q: firstParam(sp.q),
    slug: firstParam(sp.slug),
    id: firstParam(sp.id),
    leonix_ad_id: firstParam(sp.leonix_ad_id),
    owner_user_id: firstParam(sp.owner_user_id),
  };
  const queueRes = await listServiciosPublicListingsAdminQueueFromDb(queueFilters);
  const rows: ServiciosPublicAdminRow[] = queueRes.rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    leonix_ad_id: r.leonix_ad_id ?? null,
    business_name: r.business_name,
    city: r.city,
    published_at: r.published_at,
    updated_at: r.updated_at,
    leonix_verified: r.leonix_verified,
    listing_status: r.listing_status,
    internal_group: r.internal_group,
    owner_user_id: r.owner_user_id,
    moderation_notes: (r.moderation_notes ?? null) as string | null,
    profile_json: r.profile_json as ServiciosPublicAdminRow["profile_json"],
  }));
  const { unavailable, fullSchema } = queueRes;
  const devAdminRows = filterDevServiciosRows(devFileRowsAsAdmin(), queueFilters.q);
  const pendingReviews = await listPendingServiciosReviews(80);
  const recentLeads = await fetchServiciosLeadsForAdmin();

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
        <div className={`${adminCardBase} mb-4 space-y-3 p-4 text-sm text-[#5C5346]`}>
          <p className="font-bold text-[#1E1810]">Buscar cola</p>
          <p className="text-[10px] text-[#7A7164]">
            Leonix Ad ID (si existe columna), UUID interno o de usuario, slug, URL pública /clasificados/servicios/…, nombre del
            negocio, y coincidencia por nombre / correo / teléfono del perfil propietario.
          </p>
          <form className="flex flex-col flex-wrap gap-2 sm:flex-row sm:items-end" method="get" action="/admin/workspace/clasificados/servicios">
            <label className="flex min-w-[10rem] flex-1 flex-col gap-1 text-xs">
              <span className="font-semibold text-[#5C5346]">q</span>
              <input
                name="q"
                defaultValue={queueFilters.q ?? ""}
                className="rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 font-mono text-xs text-[#1E1810]"
                placeholder="UUID, URL, negocio, email…"
                autoComplete="off"
              />
            </label>
            <label className="flex min-w-[8rem] flex-col gap-1 text-xs">
              <span className="font-semibold text-[#5C5346]">slug</span>
              <input
                name="slug"
                defaultValue={queueFilters.slug ?? ""}
                className="rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 font-mono text-xs"
                autoComplete="off"
              />
            </label>
            <label className="flex min-w-[8rem] flex-col gap-1 text-xs">
              <span className="font-semibold text-[#5C5346]">id</span>
              <input
                name="id"
                defaultValue={queueFilters.id ?? ""}
                className="rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 font-mono text-xs"
                autoComplete="off"
              />
            </label>
            <label className="flex min-w-[8rem] flex-col gap-1 text-xs">
              <span className="font-semibold text-[#5C5346]">leonix_ad_id</span>
              <input
                name="leonix_ad_id"
                defaultValue={queueFilters.leonix_ad_id ?? ""}
                className="rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 font-mono text-xs"
                autoComplete="off"
              />
            </label>
            <label className="flex min-w-[8rem] flex-col gap-1 text-xs">
              <span className="font-semibold text-[#5C5346]">owner_user_id</span>
              <input
                name="owner_user_id"
                defaultValue={queueFilters.owner_user_id ?? ""}
                className="rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 font-mono text-xs"
                autoComplete="off"
              />
            </label>
            <button type="submit" className="rounded-xl bg-[#2A2620] px-4 py-2 text-xs font-bold text-[#FAF7F2]">
              Aplicar
            </button>
            <Link href="/admin/workspace/clasificados/servicios" className={`${adminBtnSecondary} inline-flex items-center text-xs`}>
              Limpiar
            </Link>
          </form>
        </div>
      ) : null}

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
                    <th className="p-3">Leonix Ad ID</th>
                    <th className="p-3">Propietario</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3">Verif. Leonix</th>
                    <th className="p-3">Interés verif.</th>
                    <th className="p-3">Actualizado</th>
                    <th className="p-3" title="Vista pública. Estado y notas: moderación staff en esta fila (sin editor de perfil completo).">
                      &nbsp;
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t border-[#E8DFD0]/80">
                      <td className="p-3 font-semibold text-[#1E1810]">{r.business_name}</td>
                      <td className="p-3 text-xs text-[#5C5346]">{r.city}</td>
                      <td className="p-3 font-mono text-xs text-[#3D3428]">{r.slug}</td>
                      <td className="p-3 font-mono text-[10px] text-[#3D3428]">{r.leonix_ad_id ?? "—"}</td>
                      <td className="p-3 font-mono text-[10px] text-[#7A7164]">{r.owner_user_id?.slice(0, 8) ?? "—"}…</td>
                      <td className="p-3 text-xs">
                        <form action={updateServiciosPublicListingStatusAction} className="flex max-w-[14rem] flex-col gap-1">
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
                          <label className="text-[10px] font-semibold text-[#7A7164]">
                            Notas moderación
                            <textarea
                              name="moderation_notes"
                              rows={2}
                              defaultValue={r.moderation_notes ?? ""}
                              className="mt-0.5 w-full resize-y rounded border border-[#E8DFD0] bg-white px-1 py-0.5 text-[10px]"
                              placeholder="Interno"
                            />
                          </label>
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
                          title="Sitio público. Cambios de copy/imágenes: flujo del anunciante."
                        >
                          Ver público ↗
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
                  <th className="p-3" title="Solo vista pública de prueba">
                    &nbsp;
                  </th>
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
                        title="Vista pública (dev)"
                      >
                        Ver público ↗
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {!unavailable && pendingReviews.length > 0 ? (
        <div className={`${adminCardBase} overflow-hidden p-0`}>
          <div className="border-b border-[#E8DFD0]/80 bg-[#FAF7F2]/90 px-4 py-2 text-xs font-semibold text-[#5C5346]">
            Reseñas pendientes ({pendingReviews.length})
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-[#FBF7EF]/90 text-left text-xs font-bold uppercase text-[#7A7164]">
                <tr>
                  <th className="p-3">Slug</th>
                  <th className="p-3">Autor</th>
                  <th className="p-3">Estrellas</th>
                  <th className="p-3">Texto</th>
                  <th className="p-3"> </th>
                </tr>
              </thead>
              <tbody>
                {pendingReviews.map((rev) => (
                  <tr key={rev.id} className="border-t border-[#E8DFD0]/80">
                    <td className="p-3 font-mono text-xs">{rev.listing_slug}</td>
                    <td className="p-3 text-xs">{rev.author_name}</td>
                    <td className="p-3 text-xs tabular-nums">{rev.rating}</td>
                    <td className="max-w-xs p-3 text-xs text-[#5C5346]">
                      <span className="line-clamp-3">{rev.body}</span>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1">
                        <form action={setServiciosReviewModerationStatusAction}>
                          <input type="hidden" name="review_id" value={rev.id} />
                          <input type="hidden" name="listing_slug" value={rev.listing_slug} />
                          <input type="hidden" name="review_status" value="approved" />
                          <button
                            type="submit"
                            className="rounded border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-900"
                          >
                            Aprobar
                          </button>
                        </form>
                        <form action={setServiciosReviewModerationStatusAction}>
                          <input type="hidden" name="review_id" value={rev.id} />
                          <input type="hidden" name="listing_slug" value={rev.listing_slug} />
                          <input type="hidden" name="review_status" value="rejected" />
                          <button
                            type="submit"
                            className="rounded border border-rose-300 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-900"
                          >
                            Rechazar
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {!unavailable && recentLeads.length > 0 ? (
        <div className={`${adminCardBase} overflow-hidden p-0`}>
          <div className="border-b border-[#E8DFD0]/80 bg-[#FAF7F2]/90 px-4 py-2 text-xs font-semibold text-[#5C5346]">
            Solicitudes recientes (servicios_public_leads)
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-[#FBF7EF]/90 text-left text-xs font-bold uppercase text-[#7A7164]">
                <tr>
                  <th className="p-3">Slug</th>
                  <th className="p-3">Remitente</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Mensaje</th>
                  <th className="p-3">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((l) => (
                  <tr key={l.id} className="border-t border-[#E8DFD0]/80">
                    <td className="p-3 font-mono text-xs">{l.listing_slug}</td>
                    <td className="p-3 text-xs">
                      {l.sender_name}
                      <br />
                      <span className="text-[#5C5346]">{l.sender_email}</span>
                    </td>
                    <td className="p-3 text-xs">{l.request_kind}</td>
                    <td className="max-w-md p-3 text-xs text-[#5C5346]">
                      <span className="line-clamp-4 whitespace-pre-wrap">{l.message}</span>
                    </td>
                    <td className="p-3 text-xs text-[#7A7164]">{new Date(l.created_at).toLocaleString()}</td>
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
