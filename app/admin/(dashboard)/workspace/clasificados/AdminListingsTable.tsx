"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteListingAction, setListingPublishedAction } from "../../../actions";
import { useState } from "react";
import { adminTableWrap } from "../../../_components/adminTheme";
import { listingPlanFromDetailPairs } from "@/app/dashboard/lib/dashboardListingMeta";
import {
  computeEnVentaVisibilityRenewalVm,
  EN_VENTA_VISIBILITY_LAST_RENEWAL_LABEL,
  parseBoostExpiresMs,
  parseDetailPairValue,
} from "@/app/clasificados/en-venta/boosts/enVentaVisibilityRenewal";
import { parseLeonixListingContract, parseLeonixMachineFacetRead } from "@/app/clasificados/lib/leonixRealEstateListingContract";
import { parseRentasDetailMachineRead } from "@/app/clasificados/rentas/lib/rentasDetailPairRead";
import { rentasListingPublicPath } from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";

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
  is_published?: boolean | null;
};

function formatAdminDateTime(ms: number): string {
  try {
    const d = new Date(ms);
    return Number.isFinite(d.getTime())
      ? d.toLocaleString("es-MX", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";
  } catch {
    return "—";
  }
}

function leonixAdminLine(row: Row, detailPairsAvailable: boolean): string {
  if (!detailPairsAvailable) return "—";
  const lx = parseLeonixListingContract(row.detail_pairs);
  const parts: string[] = [];
  if (lx.branch) parts.push(lx.branch);
  if (lx.operation) parts.push(lx.operation);
  if (lx.categoriaPropiedad) parts.push(lx.categoriaPropiedad);
  const pub =
    row.is_published === false ? "is_published=false" : row.is_published === true ? "is_published=true" : "pub=?";
  if (!parts.length) return row.is_published === false ? pub : "—";
  return `${parts.join(" · ")} · ${pub}`;
}

function clasificadosLeonixAdminLine(row: Row, detailPairsAvailable: boolean): string {
  const base = leonixAdminLine(row, detailPairsAvailable);
  if (!detailPairsAvailable) return base;
  const cat = (row.category ?? "").toLowerCase();
  if (cat === "rentas") {
    const rx = parseRentasDetailMachineRead(row.detail_pairs);
    const bits: string[] = [];
  if (rx.leaseTermCode) bits.push(`lease:${rx.leaseTermCode}`);
  if (rx.depositUsdDigits) bits.push(`dep:${rx.depositUsdDigits}`);
  if (rx.listingStatus) bits.push(`avail:${rx.listingStatus}`);
  if (rx.mapUrl) bits.push("map");
  if (rx.videoUrl) bits.push("video");
  if (rx.halfBathsDigits) bits.push(`½:${rx.halfBathsDigits}`);
  if (rx.servicesIncluded) bits.push("services:…");
  if (rx.businessWebsite) bits.push("web");
  if (rx.businessSocial) bits.push("social");
  return bits.length ? `${base} · ${bits.join(" · ")}` : base;
  }
  if (cat === "bienes-raices") {
    const m = parseLeonixMachineFacetRead(row.detail_pairs);
    const bits: string[] = [];
    if (m.resultsPropertyKind) bits.push(`kind:${m.resultsPropertyKind}`);
    if (m.bedroomsCount != null) bits.push(`bd:${m.bedroomsCount}`);
    if (m.bathroomsCount != null) bits.push(`ba:${m.bathroomsCount}`);
    if (m.postalCode) bits.push(`zip:${m.postalCode}`);
    if (m.pool === true) bits.push("pool");
    if (m.petsAllowed === true) bits.push("pets");
    else if (m.petsAllowed === false) bits.push("pets:no");
    if (m.furnished === true) bits.push("furn");
    return bits.length ? `${base} · ${bits.join(" · ")}` : base;
  }
  return base;
}

function enVentaVisibilityAdminLine(
  row: Row,
  detailPairsAvailable: boolean,
  boostExpiresAvailable: boolean
): string {
  if ((row.category ?? "").toLowerCase() !== "en-venta") return "—";
  if (!detailPairsAvailable) return "N/D · falta columna detail_pairs en BD";
  const plan = listingPlanFromDetailPairs(row.detail_pairs);
  const now = Date.now();
  const boostPart = !boostExpiresAvailable
    ? "boost N/D (sin columna boost_expires)"
    : (() => {
        const boostEnd = parseBoostExpiresMs(row.boost_expires);
        return boostEnd != null && boostEnd > now
          ? `boost ${formatAdminDateTime(boostEnd)}`
          : "boost off";
      })();
  const lastIso = parseDetailPairValue(row.detail_pairs, EN_VENTA_VISIBILITY_LAST_RENEWAL_LABEL);
  const lastPart = lastIso ? `lastRenew ${formatAdminDateTime(new Date(lastIso).getTime())}` : "lastRenew —";

  if (plan === "free") return `free · ${boostPart} · ${lastPart}`;

  const renewPart = !boostExpiresAvailable
    ? "renew N/D"
    : (() => {
        const vm = computeEnVentaVisibilityRenewalVm({
          plan: "pro",
          boostExpires: row.boost_expires,
          detailPairs: row.detail_pairs,
          nowMs: now,
        });
        return vm?.canRenewNow
          ? "renew OK"
          : vm
            ? `renew≥ ${formatAdminDateTime(vm.nextRenewEligibleAt)}`
            : "renew —";
      })();

  return `pro · ${boostPart} · ${lastPart} · ${renewPart}`;
}

export default function AdminListingsTable({
  listings,
  detailPairsAvailable = true,
  boostExpiresAvailable = true,
}: {
  listings: Row[];
  /** When false, DB has no `listings.detail_pairs` — En Venta visibility column is degraded. */
  detailPairsAvailable?: boolean;
  /** When false, select omitted `listings.boost_expires` — boost/renew lines are degraded. */
  boostExpiresAvailable?: boolean;
}) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [publishBusyId, setPublishBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("¿Marcar este anuncio como eliminado (removed)?")) return;
    setDeletingId(id);
    setError(null);
    try {
      await deleteListingAction(id);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al eliminar");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSetPublished(id: string, published: boolean) {
    const msg = published
      ? "¿Volver a mostrar este anuncio en el sitio (is_published=true)?"
      : "¿Ocultar este anuncio del sitio público (is_published=false)? Sigue visible para staff.";
    if (!confirm(msg)) return;
    setPublishBusyId(id);
    setError(null);
    try {
      await setListingPublishedAction(id, published);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al actualizar publicación");
    } finally {
      setPublishBusyId(null);
    }
  }

  function formatDate(iso: string | null): string {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return Number.isFinite(d.getTime())
        ? d.toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
        : "—";
    } catch {
      return "—";
    }
  }

  if (listings.length === 0) {
    return (
      <div className="rounded-2xl border border-[#E8DFD0] bg-[#FAF7F2]/80 p-6 text-sm text-[#5C5346]">No hay anuncios.</div>
    );
  }

  const enVentaColumnDegraded = !detailPairsAvailable || !boostExpiresAvailable;

  return (
    <div className={adminTableWrap}>
      {error && <div className="border-b border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#E8DFD0] bg-[#FAF7F2]/90">
              <th className="p-3 font-semibold text-[#5C4E2E]">ID</th>
              <th className="min-w-[180px] p-3 font-semibold text-[#5C4E2E]">Título</th>
              <th className="p-3 font-semibold text-[#5C4E2E]">Categoría</th>
              <th className="p-3 font-semibold text-[#5C4E2E]">Ciudad</th>
              <th className="p-3 font-semibold text-[#5C4E2E]">Precio</th>
              <th className="p-3 font-semibold text-[#5C4E2E]">Estado</th>
              <th className="p-3 font-semibold text-[#5C4E2E]">Owner</th>
              <th className="p-3 font-semibold text-[#5C4E2E]">Fecha</th>
              <th
                className={
                  detailPairsAvailable
                    ? "min-w-[200px] p-3 font-semibold text-[#5C4E2E]"
                    : "min-w-[200px] bg-amber-50/90 p-3 font-semibold text-amber-950"
                }
                title="Leonix BR/Rentas: rama, operación, categoría, publicado"
              >
                Leonix
              </th>
              <th
                className={
                  enVentaColumnDegraded
                    ? "min-w-[220px] bg-amber-50/90 p-3 font-semibold text-amber-950"
                    : "min-w-[220px] p-3 font-semibold text-[#5C4E2E]"
                }
                title={
                  !detailPairsAvailable
                    ? "Columna detail_pairs no disponible en esta base — aplica migración listings.detail_pairs"
                    : !boostExpiresAvailable
                      ? "Columna boost_expires no disponible — aplica migración listings_engagement_boost"
                      : "Plan y visibilidad En Venta (detail_pairs + boost_expires)"
                }
              >
                En venta · vis.
              </th>
              <th className="p-3 font-semibold text-[#5C4E2E]">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((row) => (
              <tr key={row.id} className="border-b border-[#E8DFD0]/60">
                <td className="p-3 font-mono text-xs text-[#3D3428]">{row.id.slice(0, 8)}…</td>
                <td className="max-w-[200px] truncate p-3 text-[#1E1810]" title={row.title ?? ""}>
                  {row.title ?? "—"}
                </td>
                <td className="p-3">
                  <span className="rounded-full bg-[#FBF7EF] px-2 py-0.5 text-xs font-semibold text-[#5C4E2E]">
                    {row.category ?? "—"}
                  </span>
                </td>
                <td className="p-3 text-[#3D3428]">{row.city ?? "—"}</td>
                <td className="p-3">{row.is_free ? "Gratis" : row.price != null ? `$${row.price}` : "—"}</td>
                <td className="p-3">
                  <span
                    className={
                      row.status === "removed"
                        ? "text-red-700"
                        : row.status === "pending" || row.status === "flagged"
                          ? "font-bold text-amber-800"
                          : "text-[#5C5346]"
                    }
                  >
                    {row.status ?? "active"}
                  </span>
                </td>
                <td className="p-3">
                  {row.owner_id ? (
                    <Link
                      href={`/admin/usuarios/${row.owner_id}`}
                      className="inline-flex min-h-[44px] min-w-[44px] items-center text-xs font-semibold text-[#6B5B2E] underline sm:min-h-0 sm:min-w-0"
                      title="Abrir ficha del vendedor en Leonix admin"
                    >
                      Ficha vendedor
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="p-3 text-[#7A7164]">{formatDate(row.created_at)}</td>
                <td
                  className={
                    detailPairsAvailable
                      ? "max-w-[240px] p-3 align-top text-[11px] leading-snug text-[#5C5346]"
                      : "max-w-[240px] bg-amber-50/40 p-3 align-top text-[11px] leading-snug text-amber-950"
                  }
                  title={clasificadosLeonixAdminLine(row, detailPairsAvailable)}
                >
                  {clasificadosLeonixAdminLine(row, detailPairsAvailable)}
                </td>
                <td
                  className={
                    enVentaColumnDegraded
                      ? "max-w-[280px] bg-amber-50/40 p-3 align-top text-[11px] leading-snug text-amber-950"
                      : "max-w-[280px] p-3 align-top text-[11px] leading-snug text-[#5C5346]"
                  }
                  title={enVentaVisibilityAdminLine(row, detailPairsAvailable, boostExpiresAvailable)}
                >
                  {enVentaVisibilityAdminLine(row, detailPairsAvailable, boostExpiresAvailable)}
                </td>
                <td className="p-3">
                  <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-1">
                    {(row.category ?? "").toLowerCase() === "rentas" ? (
                      <Link
                        href={rentasListingPublicPath(row.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[44px] items-center font-semibold text-[#6B5B2E] underline sm:min-h-0"
                        title="Detalle público Rentas (ruta canónica)"
                      >
                        Ver público (Rentas)
                      </Link>
                    ) : (
                      <Link
                        href={`/clasificados/anuncio/${row.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[44px] items-center font-semibold text-[#6B5B2E] underline sm:min-h-0"
                        title="Abrir anuncio en el sitio público (nueva pestaña)"
                      >
                        Ver público
                      </Link>
                    )}
                    {(row.category ?? "").toLowerCase() === "rentas" ? (
                      <Link
                        href={`/admin/workspace/clasificados/rentas/${row.id}`}
                        className="inline-flex min-h-[44px] items-center font-semibold text-[#4A6680] underline sm:min-h-0"
                        title="Inspector completo Rentas (staff)"
                      >
                        Inspector Rentas
                      </Link>
                    ) : null}
                    {row.status !== "removed" && row.is_published !== false ? (
                      <button
                        type="button"
                        disabled={publishBusyId === row.id}
                        onClick={() => void handleSetPublished(row.id, false)}
                        className="min-h-[44px] text-left text-sm font-semibold text-amber-900 hover:underline disabled:opacity-50 sm:min-h-0"
                        title="Oculta del listado público (is_published=false). En Venta / resultados dejan de mostrarlo."
                      >
                        {publishBusyId === row.id ? "…" : "Ocultar del público"}
                      </button>
                    ) : null}
                    {row.status !== "removed" && row.is_published === false ? (
                      <button
                        type="button"
                        disabled={publishBusyId === row.id}
                        onClick={() => void handleSetPublished(row.id, true)}
                        className="min-h-[44px] text-left text-sm font-semibold text-emerald-900 hover:underline disabled:opacity-50 sm:min-h-0"
                        title="Vuelve a publicar en el sitio (is_published=true) si el estado sigue activo."
                      >
                        {publishBusyId === row.id ? "…" : "Republicar en sitio"}
                      </button>
                    ) : null}
                    {row.status !== "removed" && (
                      <button
                        type="button"
                        disabled={deletingId === row.id}
                        onClick={() => handleDelete(row.id)}
                        className="min-h-[44px] text-left text-sm font-semibold text-red-700 hover:underline disabled:opacity-50 sm:min-h-0"
                        title="Marca el anuncio como removed en base (acción de staff; aparece en auditoría)"
                        aria-label="Marcar anuncio como eliminado en base de datos"
                      >
                        {deletingId === row.id ? "…" : "Eliminar (staff)"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
