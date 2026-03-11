"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateListingReportStatusAction, type ListingReportStatus } from "../actions";
import { useState } from "react";

type ReportRow = {
  id: string;
  listing_id: string;
  reporter_id: string | null;
  reason: string;
  created_at: string;
  status: string;
};

export default function AdminReportsTable({ reports }: { reports: ReportRow[] }) {
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
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
        No hay reportes.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
      {error && (
        <div className="p-3 bg-red-500/20 border-b border-red-500/30 text-red-200 text-sm">
          {error}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="p-3 font-semibold text-yellow-400">Fecha</th>
              <th className="p-3 font-semibold text-yellow-400">Anuncio</th>
              <th className="p-3 font-semibold text-yellow-400">Motivo</th>
              <th className="p-3 font-semibold text-yellow-400">Estado</th>
              <th className="p-3 font-semibold text-yellow-400">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((row) => (
              <tr key={row.id} className="border-b border-white/5">
                <td className="p-3 text-white/80">{formatDate(row.created_at)}</td>
                <td className="p-3">
                  <Link
                    href={`/clasificados/anuncio/${row.listing_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-yellow-400 hover:underline font-mono text-xs"
                  >
                    {row.listing_id.slice(0, 8)}…
                  </Link>
                </td>
                <td className="p-3 max-w-[280px] truncate text-white/90" title={row.reason}>
                  {row.reason || "—"}
                </td>
                <td className="p-3">
                  <span className={row.status === "pending" ? "text-yellow-400" : "text-white/60"}>
                    {row.status}
                  </span>
                </td>
                <td className="p-3">
                  {row.status === "pending" && (
                    <span className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="rounded-lg px-2 py-1 text-xs font-medium bg-green-600/80 text-white hover:bg-green-600 disabled:opacity-50"
                        onClick={() => handleStatus(row.id, "reviewed")}
                        disabled={updatingId === row.id}
                      >
                        Revisado
                      </button>
                      <button
                        type="button"
                        className="rounded-lg px-2 py-1 text-xs font-medium bg-white/10 text-white hover:bg-white/20 disabled:opacity-50"
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
