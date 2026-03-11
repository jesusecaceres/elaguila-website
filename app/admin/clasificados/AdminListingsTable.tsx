"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteListingAction } from "../actions";
import { useState } from "react";

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
};

export default function AdminListingsTable({ listings }: { listings: Row[] }) {
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
      <div className="rounded-2xl border border-black/10 bg-white p-6 text-[#111111]/70">
        No hay anuncios.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-black/10 bg-white overflow-hidden">
      {error && (
        <div className="p-3 bg-red-50 border-b border-red-200 text-red-800 text-sm">
          {error}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 bg-[#F5F5F5]">
              <th className="p-3 font-semibold text-[#111111]">ID</th>
              <th className="p-3 font-semibold text-[#111111] min-w-[180px]">Título</th>
              <th className="p-3 font-semibold text-[#111111]">Categoría</th>
              <th className="p-3 font-semibold text-[#111111]">Ciudad</th>
              <th className="p-3 font-semibold text-[#111111]">Precio</th>
              <th className="p-3 font-semibold text-[#111111]">Estado</th>
              <th className="p-3 font-semibold text-[#111111]">Fecha</th>
              <th className="p-3 font-semibold text-[#111111]">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((row) => (
              <tr key={row.id} className="border-b border-black/5">
                <td className="p-3 font-mono text-xs text-[#111111]/80">{row.id.slice(0, 8)}…</td>
                <td className="p-3 max-w-[200px] truncate" title={row.title ?? ""}>{row.title ?? "—"}</td>
                <td className="p-3">{row.category ?? "—"}</td>
                <td className="p-3">{row.city ?? "—"}</td>
                <td className="p-3">
                  {row.is_free ? "Gratis" : row.price != null ? `$${row.price}` : "—"}
                </td>
                <td className="p-3">
                  <span className={row.status === "removed" ? "text-red-600" : ""}>
                    {row.status ?? "active"}
                  </span>
                </td>
                <td className="p-3 text-[#111111]/70">{formatDate(row.created_at)}</td>
                <td className="p-3">
                  <Link
                    href={`/clasificados/anuncio/${row.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#A98C2A] hover:underline mr-2"
                  >
                    Ver
                  </Link>
                  {row.status !== "removed" && (
                    <button
                      type="button"
                      disabled={deletingId === row.id}
                      onClick={() => handleDelete(row.id)}
                      className="text-red-600 hover:underline disabled:opacity-50"
                    >
                      {deletingId === row.id ? "…" : "Eliminar"}
                    </button>
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
