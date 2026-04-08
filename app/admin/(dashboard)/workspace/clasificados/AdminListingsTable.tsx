"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteListingAction } from "../../../actions";
import { useState } from "react";
import { adminTableWrap } from "../../../_components/adminTheme";
import { listingPlanFromDetailPairs } from "@/app/dashboard/lib/dashboardListingMeta";
import {
  computeEnVentaVisibilityRenewalVm,
  EN_VENTA_VISIBILITY_LAST_RENEWAL_LABEL,
  parseBoostExpiresMs,
  parseDetailPairValue,
} from "@/app/clasificados/en-venta/boosts/enVentaVisibilityRenewal";

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

function enVentaVisibilityAdminLine(row: Row, detailPairsAvailable: boolean): string {
  if ((row.category ?? "").toLowerCase() !== "en-venta") return "—";
  if (!detailPairsAvailable) return "N/D · falta columna detail_pairs en BD";
  const plan = listingPlanFromDetailPairs(row.detail_pairs);
  const now = Date.now();
  const boostEnd = parseBoostExpiresMs(row.boost_expires);
  const boostPart =
    boostEnd != null && boostEnd > now
      ? `boost ${formatAdminDateTime(boostEnd)}`
      : "boost off";
  const lastIso = parseDetailPairValue(row.detail_pairs, EN_VENTA_VISIBILITY_LAST_RENEWAL_LABEL);
  const lastPart = lastIso ? `lastRenew ${formatAdminDateTime(new Date(lastIso).getTime())}` : "lastRenew —";

  if (plan === "free") return `free · ${boostPart} · ${lastPart}`;

  const vm = computeEnVentaVisibilityRenewalVm({
    plan: "pro",
    boostExpires: row.boost_expires,
    detailPairs: row.detail_pairs,
    nowMs: now,
  });
  const renewPart = vm?.canRenewNow
    ? "renew OK"
    : vm
      ? `renew≥ ${formatAdminDateTime(vm.nextRenewEligibleAt)}`
      : "renew —";

  return `pro · ${boostPart} · ${lastPart} · ${renewPart}`;
}

export default function AdminListingsTable({
  listings,
  detailPairsAvailable = true,
}: {
  listings: Row[];
  /** When false, DB has no `listings.detail_pairs` — En Venta visibility column is degraded. */
  detailPairsAvailable?: boolean;
}) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
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
                    ? "min-w-[220px] p-3 font-semibold text-[#5C4E2E]"
                    : "min-w-[220px] bg-amber-50/90 p-3 font-semibold text-amber-950"
                }
                title={
                  detailPairsAvailable
                    ? "Plan y visibilidad En Venta (detail_pairs + boost_expires)"
                    : "Columna detail_pairs no disponible en esta base — aplica migración listings.detail_pairs"
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
                    >
                      Ver
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="p-3 text-[#7A7164]">{formatDate(row.created_at)}</td>
                <td
                  className={
                    detailPairsAvailable
                      ? "max-w-[280px] p-3 align-top text-[11px] leading-snug text-[#5C5346]"
                      : "max-w-[280px] bg-amber-50/40 p-3 align-top text-[11px] leading-snug text-amber-950"
                  }
                  title={enVentaVisibilityAdminLine(row, detailPairsAvailable)}
                >
                  {enVentaVisibilityAdminLine(row, detailPairsAvailable)}
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <Link
                      href={`/clasificados/anuncio/${row.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[44px] items-center font-semibold text-[#6B5B2E] underline sm:min-h-0"
                    >
                      Ver
                    </Link>
                    {row.status !== "removed" && (
                      <button
                        type="button"
                        disabled={deletingId === row.id}
                        onClick={() => handleDelete(row.id)}
                        className="min-h-[44px] text-sm font-semibold text-red-700 hover:underline disabled:opacity-50 sm:min-h-0"
                      >
                        {deletingId === row.id ? "…" : "Eliminar"}
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
