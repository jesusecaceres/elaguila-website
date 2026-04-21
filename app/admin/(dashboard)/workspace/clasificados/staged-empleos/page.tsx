"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { adminBtnSecondary, adminCardBase, adminInputClass } from "@/app/admin/_components/adminTheme";
import { appendLangToPath, type Lang } from "@/app/clasificados/lib/hubUrl";
import type { EmpleosCanonicalListing, EmpleosStagedPublicStatus } from "@/app/clasificados/empleos/lib/staged/empleosCanonicalListing";
import { empleosStagedListingUrls } from "@/app/clasificados/empleos/lib/staged/empleosCanonicalListing";
import { updateEmpleosStagedStatus } from "@/app/clasificados/empleos/lib/staged/empleosPublishService";
import { EMPLEOS_STAGED_REGISTRY_EVENT, readAllEmpleosCanonical } from "@/app/clasificados/empleos/lib/staged/empleosStagedStorage";

const MINI =
  "rounded-lg border border-[#E8DFD0] bg-white px-2 py-1 text-[11px] font-bold text-[#2C2416] hover:bg-[#FAF7F2]";

export default function StagedEmpleosAdminPage() {
  const sp = useSearchParams();
  const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";

  const [needle, setNeedle] = useState("");
  const [rows, setRows] = useState<EmpleosCanonicalListing[]>([]);

  const refresh = () => {
    setRows(
      [...readAllEmpleosCanonical()].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    );
  };

  useEffect(() => {
    refresh();
    const on = () => refresh();
    window.addEventListener(EMPLEOS_STAGED_REGISTRY_EVENT, on);
    return () => window.removeEventListener(EMPLEOS_STAGED_REGISTRY_EVENT, on);
  }, []);

  const filtered = useMemo(() => {
    const n = needle.trim().toLowerCase();
    if (!n) return rows;
    return rows.filter(
      (r) =>
        r.title.toLowerCase().includes(n) ||
        r.company.toLowerCase().includes(n) ||
        r.slug.toLowerCase().includes(n) ||
        r.listingId.toLowerCase().includes(n),
    );
  }, [rows, needle]);

  function setStatus(id: string, status: EmpleosStagedPublicStatus) {
    updateEmpleosStagedStatus(id, status);
    refresh();
  }

  return (
    <div className="max-w-6xl space-y-6 pb-12">
      <AdminPageHeader
        eyebrow="Workspace · Clasificados · Demo"
        title="Empleos — capa local (navegador)"
        subtitle="Listados persistidos en localStorage del visitante. Útil para QA del flujo publicar → resultados → detalle → panel → admin sin Supabase de Empleos."
        rightSlot={
          <Link href="/admin/workspace/clasificados" className={adminBtnSecondary}>
            ← Hub Clasificados
          </Link>
        }
      />

      <div className={`${adminCardBase} p-4`}>
        <p className="text-sm text-[#5C5346]">
          Etiqueta: <strong>staged / demo</strong>. No uses esta vista como fuente de verdad operativa; no hay pagos ni moderación real.
        </p>
        <label className="mt-3 block text-xs font-bold uppercase text-[#7A7164]">Buscar</label>
        <input
          className={`${adminInputClass} mt-1 max-w-md`}
          value={needle}
          onChange={(e) => setNeedle(e.target.value)}
          placeholder="título, empresa, slug, id…"
        />
      </div>

      <div className={`${adminCardBase} overflow-x-auto p-0`}>
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[#E8DFD0] bg-[#FAF7F2] text-xs font-bold uppercase tracking-wide text-[#7A7164]">
            <tr>
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Carril</th>
              <th className="px-4 py-3">Owner (demo)</th>
              <th className="px-4 py-3">Acciones</th>
              <th className="px-4 py-3">Enlaces</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[#5C5346]">
                  Sin filas locales. Publica desde{" "}
                  <Link
                    href={appendLangToPath("/clasificados/publicar/empleos", lang)}
                    className="font-semibold text-[#6B5B2E] underline"
                  >
                    /clasificados/publicar/empleos
                  </Link>
                  .
                </td>
              </tr>
            ) : (
              filtered.map((r) => {
                const urls = empleosStagedListingUrls(r.listingId, r.slug);
                return (
                  <tr key={r.listingId} className="border-b border-[#E8DFD0]/70 last:border-0">
                    <td className="px-4 py-3">
                      <div className="max-w-[200px] truncate font-semibold text-[#1E1810]">{r.title}</div>
                      <div className="text-xs text-[#7A7164]">{r.company}</div>
                      <code className="mt-1 block truncate text-[11px] text-[#9A9084]">{r.slug}</code>
                    </td>
                    <td className="px-4 py-3 capitalize">{r.status}</td>
                    <td className="px-4 py-3 capitalize">{r.lane}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-[#5C5346]">{r.ownerId.slice(0, 12)}…</td>
                    <td className="px-4 py-3">
                      <div className="flex max-w-[220px] flex-wrap gap-1">
                        <button type="button" className={MINI} onClick={() => setStatus(r.listingId, "published")}>
                          Pub
                        </button>
                        <button type="button" className={MINI} onClick={() => setStatus(r.listingId, "paused")}>
                          Pause
                        </button>
                        <button type="button" className={MINI} onClick={() => setStatus(r.listingId, "archived")}>
                          Arch
                        </button>
                        <button type="button" className={MINI} onClick={() => setStatus(r.listingId, "rejected")}>
                          Rej
                        </button>
                        <button type="button" className={MINI} onClick={() => setStatus(r.listingId, "draft")}>
                          Draft
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1 text-xs font-semibold">
                        <Link href={appendLangToPath(urls.anuncioUrl, lang)} className="text-[#6B5B2E] underline">
                          Detalle
                        </Link>
                        <Link href={appendLangToPath(urls.dashboardUrl, lang)} className="text-[#6B5B2E] underline">
                          Panel
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
