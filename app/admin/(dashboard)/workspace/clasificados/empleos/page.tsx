"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { adminBtnSecondary, adminCardBase, adminInputClass } from "@/app/admin/_components/adminTheme";
import { appendLangToPath, type Lang } from "@/app/clasificados/lib/hubUrl";

type ApplicationHealth = {
  total: number;
  submitted: number;
  viewed: number;
  shortlisted: number;
  rejected: number;
  hired: number;
};

type Row = {
  id: string;
  slug: string;
  title: string;
  company_name: string;
  lifecycle_status: string;
  lane: string;
  owner_user_id: string | null;
  moderation_reason: string | null;
  apply_count: number;
  view_count: number;
  application_health: ApplicationHealth;
};

export default function AdminEmpleosListingsPage() {
  const sp = useSearchParams();
  const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";

  const [needle, setNeedle] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    const res = await fetch("/api/admin/empleos/listings", { credentials: "same-origin" });
    const json = (await res.json()) as { ok?: boolean; rows?: Row[]; error?: string };
    if (!res.ok || !json.ok) {
      setErr(json.error ?? "load_failed");
      setRows([]);
      return;
    }
    setRows(json.rows ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const n = needle.trim().toLowerCase();
    if (!n) return rows;
    return rows.filter(
      (r) =>
        r.title.toLowerCase().includes(n) ||
        r.company_name.toLowerCase().includes(n) ||
        r.slug.toLowerCase().includes(n) ||
        r.id.toLowerCase().includes(n),
    );
  }, [rows, needle]);

  async function moderate(id: string, lifecycle_status: string) {
    const res = await fetch("/api/admin/empleos/listings/moderate", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, lifecycle_status }),
    });
    const json = (await res.json()) as { ok?: boolean };
    if (json.ok) void load();
  }

  return (
    <div className="max-w-6xl space-y-6 pb-12">
      <AdminPageHeader
        eyebrow="Workspace · Clasificados"
        title="Empleos — listados (Supabase)"
        subtitle="Fuente: tabla public.empleos_public_listings. Acciones usan rol de servicio en API; requiere cookie admin."
        rightSlot={
          <Link href="/admin/workspace/clasificados" className={adminBtnSecondary}>
            ← Hub Clasificados
          </Link>
        }
      />

      {err ? (
        <div className={`${adminCardBase} p-4 text-sm text-red-900`}>
          {err === "supabase_not_configured" ? "Supabase no configurado en el entorno." : err}
        </div>
      ) : null}

      <div className={`${adminCardBase} p-4`}>
        <label className="text-xs font-bold uppercase text-[#7A7164]">Buscar</label>
        <input className={`${adminInputClass} mt-1 max-w-md`} value={needle} onChange={(e) => setNeedle(e.target.value)} />
      </div>

      <div className={`${adminCardBase} overflow-x-auto p-0`}>
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[#E8DFD0] bg-[#FAF7F2] text-xs font-bold uppercase text-[#7A7164]">
            <tr>
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Carril</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Apps / salud</th>
              <th className="px-4 py-3">Métricas</th>
              <th className="px-4 py-3">Acciones</th>
              <th className="px-4 py-3">Enlaces</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-[#E8DFD0]/70 last:border-0">
                <td className="px-4 py-3">
                  <div className="max-w-[200px] truncate font-semibold">{r.title}</div>
                  <div className="text-xs text-[#7A7164]">{r.company_name}</div>
                  <code className="text-[11px] text-[#9A9084]">{r.slug}</code>
                  {r.moderation_reason ? (
                    <div className="mt-1 max-w-[220px] text-[11px] text-amber-900">Moderación: {r.moderation_reason}</div>
                  ) : null}
                </td>
                <td className="px-4 py-3 capitalize">{r.lifecycle_status}</td>
                <td className="px-4 py-3 capitalize">{r.lane}</td>
                <td className="px-4 py-3">
                  <code className="break-all text-[10px] text-[#6B645C]">{r.owner_user_id ?? "—"}</code>
                </td>
                <td className="px-4 py-3 text-[11px] leading-snug text-[#4A4744]">
                  <div>Total: {r.application_health?.total ?? 0}</div>
                  <div className="text-[#7A7164]">
                    Nuevo {r.application_health?.submitted ?? 0} · Visto {r.application_health?.viewed ?? 0} · Corta{" "}
                    {r.application_health?.shortlisted ?? 0} · Rech {r.application_health?.rejected ?? 0}
                    {typeof r.application_health?.hired === "number" && r.application_health.hired > 0 ? (
                      <> · Contratados {r.application_health.hired}</>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3 text-[11px]">
                  <div>Aplicaciones (col): {r.apply_count ?? 0}</div>
                  <div>Vistas: {r.view_count ?? 0}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex max-w-[240px] flex-wrap gap-1">
                    <button type="button" className="rounded border px-2 py-1 text-[11px] font-bold" onClick={() => void moderate(r.id, "published")}>
                      Pub
                    </button>
                    <button type="button" className="rounded border px-2 py-1 text-[11px] font-bold" onClick={() => void moderate(r.id, "pending_review")}>
                      Review
                    </button>
                    <button type="button" className="rounded border px-2 py-1 text-[11px] font-bold" onClick={() => void moderate(r.id, "paused")}>
                      Pause
                    </button>
                    <button type="button" className="rounded border px-2 py-1 text-[11px] font-bold" onClick={() => void moderate(r.id, "archived")}>
                      Arch
                    </button>
                    <button type="button" className="rounded border px-2 py-1 text-[11px] font-bold" onClick={() => void moderate(r.id, "rejected")}>
                      Reject
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs font-semibold">
                  <Link href={appendLangToPath(`/clasificados/empleos/${r.slug}`, lang)} className="text-[#6B5B2E] underline">
                    Detalle
                  </Link>
                  <br />
                  <Link href={`/dashboard/empleos/${r.id}?lang=${lang}`} className="text-[#6B5B2E] underline">
                    Panel empleador
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
