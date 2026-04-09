"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateListingReportStatusAction, type ListingReportStatus } from "../../actions";
import { useState } from "react";
import { adminTableWrap } from "../../_components/adminTheme";

type ReportRow = {
  id: string;
  listing_id: string;
  reporter_id: string | null;
  reason: string;
  created_at: string;
  status: string;
};

export default function AdminReportsTable({
  reports,
  highlightReportId,
}: {
  reports: ReportRow[];
  /** When set (e.g. deep link from Ops), row gets a visible ring. */
  highlightReportId?: string | null;
}) {
  const router = useRouter();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleStatus(id: string, status: ListingReportStatus) {
    setUpdatingId(id);
    setError(null);
    try {
      await updateListingReportStatusAction(id, status);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al actualizar");
    } finally {
      setUpdatingId(null);
    }
  }

  function formatDate(iso: string): string {
    try {
      const d = new Date(iso);
      return Number.isFinite(d.getTime())
        ? d.toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
        : "—";
    } catch {
      return "—";
    }
  }

  if (reports.length === 0) {
    return (
      <div className="rounded-2xl border border-[#E8DFD0] bg-[#FAF7F2]/80 p-6 text-sm text-[#5C5346]">No hay reportes.</div>
    );
  }

  return (
    <div className={adminTableWrap}>
      {error && (
        <div className="border-b border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#E8DFD0] bg-[#FAF7F2]/90">
              <th className="p-3 font-semibold text-[#5C4E2E]">Fecha</th>
              <th className="p-3 font-semibold text-[#5C4E2E]">Anuncio</th>
              <th className="p-3 font-semibold text-[#5C4E2E]">Reporter</th>
              <th className="p-3 font-semibold text-[#5C4E2E]">Motivo</th>
              <th className="p-3 font-semibold text-[#5C4E2E]">Estado</th>
              <th className="p-3 font-semibold text-[#5C4E2E]">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((row) => (
              <tr
                key={row.id}
                className={`border-b border-[#E8DFD0]/60 ${
                  highlightReportId && row.id === highlightReportId ? "bg-amber-50/90 ring-2 ring-inset ring-amber-300/90" : ""
                }`}
              >
                <td className="p-3 text-[#3D3428]">{formatDate(row.created_at)}</td>
                <td className="p-3">
                  <Link
                    href={`/clasificados/anuncio/${row.listing_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs font-semibold text-[#6B5B2E] underline"
                  >
                    {row.listing_id.slice(0, 8)}…
                  </Link>
                </td>
                <td className="p-3">
                  {row.reporter_id ? (
                    <Link
                      href={`/admin/usuarios/${row.reporter_id}`}
                      className="font-mono text-xs font-semibold text-[#6B5B2E] underline"
                    >
                      {row.reporter_id.slice(0, 8)}…
                    </Link>
                  ) : (
                    <span className="text-xs text-[#9A9084]">—</span>
                  )}
                </td>
                <td className="max-w-[280px] truncate p-3 text-[#2C2416]" title={row.reason}>
                  {row.reason || "—"}
                </td>
                <td className="p-3">
                  <span className={row.status === "pending" ? "font-bold text-amber-800" : "text-[#5C5346]"}>{row.status}</span>
                </td>
                <td className="p-3">
                  {row.status === "pending" && (
                    <span className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="rounded-lg bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        onClick={() => handleStatus(row.id, "reviewed")}
                        disabled={updatingId === row.id}
                      >
                        Revisado
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-[#E8DFD0] bg-white px-2 py-1 text-xs font-semibold text-[#2C2416] hover:bg-[#FAF7F2] disabled:opacity-50"
                        onClick={() => handleStatus(row.id, "dismissed")}
                        disabled={updatingId === row.id}
                      >
                        Descartar
                      </button>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
