"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useAdminLang } from "@/app/admin/_components/AdminI18nProvider";
import { adminCardBase, adminInputClass } from "@/app/admin/_components/adminTheme";
import { adminMessages } from "@/app/admin/_lib/adminStrings";
import { appendLangToPath, type Lang } from "@/app/clasificados/lib/hubUrl";
import { ClassifiedAdminRowActions } from "../_components/ClassifiedAdminRowActions";
import { AdminListingMonetizationSummary } from "../_components/AdminListingMonetizationSummary";
import { ClasificadosQueueHeader } from "../_components/ClasificadosQueueHeader";
import { ClasificadosScopeNav } from "../_components/ClasificadosScopeNav";
import { clasificadosQueueSurfaceForSlug } from "../_lib/clasificadosQueueSurfaceMeta";
import { appendPreservedSearchParams, parseAdminScope } from "../_lib/clasificadosAdminScopeUrls";

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
  leonix_ad_id?: string | null;
  title: string;
  company_name: string;
  lifecycle_status: string;
  lane: string;
  owner_user_id: string | null;
  moderation_reason: string | null;
  leonix_verified?: boolean;
  admin_promoted?: boolean;
  apply_count: number;
  view_count: number;
  application_health: ApplicationHealth;
};

export default function AdminEmpleosListingsPage() {
  const sp = useSearchParams();
  const adminLang = useAdminLang();
  const m = adminMessages(adminLang);
  const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";

  const spRecord = useMemo(() => {
    const o: Record<string, string | string[] | undefined> = {};
    sp?.forEach((v, k) => {
      o[k] = v;
    });
    return o;
  }, [sp]);

  const scope = useMemo(() => parseAdminScope(spRecord), [spRecord]);
  const queueHref = useMemo(
    () => appendPreservedSearchParams("/admin/workspace/clasificados/empleos", spRecord, null),
    [spRecord],
  );
  const liveHref = useMemo(
    () => appendPreservedSearchParams("/admin/workspace/clasificados/empleos", spRecord, "live"),
    [spRecord],
  );

  const [needle, setNeedle] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const q = sp?.get("q")?.trim();
    if (q) setNeedle(q);
  }, [sp]);

  const load = useCallback(async (q: string, signal?: AbortSignal) => {
    setErr(null);
    const url = new URL("/api/admin/empleos/listings", window.location.origin);
    const qt = q.trim();
    if (qt) url.searchParams.set("q", qt);
    const res = await fetch(url.toString(), { credentials: "same-origin", signal });
    const json = (await res.json()) as { ok?: boolean; rows?: Row[]; error?: string };
    if (!res.ok || !json.ok) {
      setErr(json.error ?? "load_failed");
      setRows([]);
      return;
    }
    setRows(json.rows ?? []);
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    const t = window.setTimeout(() => {
      void load(needle, ac.signal);
    }, 300);
    return () => {
      window.clearTimeout(t);
      ac.abort();
    };
  }, [needle, load]);

  const displayRows = useMemo(() => {
    if (scope === "live") return rows.filter((r) => r.lifecycle_status === "published");
    return rows;
  }, [rows, scope]);

  async function moderate(id: string, lifecycle_status: string) {
    const res = await fetch("/api/admin/empleos/listings/moderate", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, lifecycle_status }),
    });
    const json = (await res.json()) as { ok?: boolean };
    if (json.ok) void load(needle);
  }

  const empleosSurface = clasificadosQueueSurfaceForSlug("empleos");

  return (
    <div className="max-w-6xl space-y-6 pb-12">
      <ClasificadosQueueHeader
        title={
          scope === "live" ? m("listingsCategoryOps.titleLive", { slug: "empleos" }) : m("listingsCategoryOps.titleQueue", { slug: "empleos" })
        }
        sourceTable={empleosSurface.sourceTable}
        subtitle={scope === "live" ? m("listingsCategoryOps.subLive") : m("listingsCategoryOps.subQueue")}
        publicHref={empleosSurface.publicHref}
        publishHref={empleosSurface.publishHref}
        rightSlot={
          <ClasificadosScopeNav lang={adminLang} queueHref={queueHref} liveHref={liveHref} active={scope === "live" ? "live" : "queue"} />
        }
      />

      {err ? (
        <div className={`${adminCardBase} p-4 text-sm text-red-900`}>
          {err === "supabase_not_configured" ? "Supabase no configurado en el entorno." : err}
        </div>
      ) : null}

      {!err && displayRows.length === 0 ? (
        <div className={`${adminCardBase} border-amber-200/80 bg-amber-50/90 p-4 text-sm text-amber-950`} role="status">
          <p className="font-semibold text-[#1E1810]">
            {scope === "live" ? "No hay listados en vivo (publicados) con los filtros actuales." : "No published listings found for this category."}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-[#5C5346]">
            {scope === "live" && rows.length > 0 ? (
              <>
                Hay {rows.length} fila(s) cargadas; ninguna está en estado <code className="rounded bg-white/80 px-1">published</code>. Cambia a
                la cola completa o revisa el estado en Staff.
              </>
            ) : (
              <>
                La API <span className="font-mono">/api/admin/empleos/listings</span> respondió sin filas desde{" "}
                <span className="font-mono">empleos_public_listings</span>
                {needle.trim() ? " para el término de búsqueda actual." : " (sin término de búsqueda)."}{" "}
                Si esperabas anuncios, confirma migraciones y datos en Supabase.
              </>
            )}
          </p>
        </div>
      ) : null}

      <div className={`${adminCardBase} p-4`}>
        <label className="text-xs font-bold uppercase text-[#7A7164]">Buscar</label>
        <p className="mt-1 max-w-3xl text-[10px] leading-snug text-[#7A7164]">
          Leonix Ad ID (si existe columna), UUID interno, slug o URL /clasificados/empleos/…, user ID del propietario, título o empresa,
          ciudad/estado, y coincidencia por nombre / correo / teléfono del perfil.
        </p>
        <input className={`${adminInputClass} mt-1 max-w-md`} value={needle} onChange={(e) => setNeedle(e.target.value)} />
      </div>

      {!err && displayRows.length > 0 ? (
      <div className={`${adminCardBase} overflow-x-auto p-0`}>
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[#E8DFD0] bg-[#FAF7F2] text-xs font-bold uppercase text-[#7A7164]">
            <tr>
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Leonix Ad ID</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Carril</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Apps / salud</th>
              <th className="px-4 py-3">Métricas</th>
              <th className="px-4 py-3">Acciones</th>
              <th className="px-4 py-3">Staff (Leonix)</th>
              <th className="px-4 py-3">Monetization</th>
              <th className="px-4 py-3">Enlaces</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((r) => (
              <tr key={r.id} className="border-b border-[#E8DFD0]/70 last:border-0">
                <td className="px-4 py-3">
                  <div className="max-w-[200px] truncate font-semibold">{r.title}</div>
                  <div className="text-xs text-[#7A7164]">{r.company_name}</div>
                  <code className="text-[11px] text-[#9A9084]">{r.slug}</code>
                  {r.moderation_reason ? (
                    <div className="mt-1 max-w-[220px] text-[11px] text-amber-900">Moderación: {r.moderation_reason}</div>
                  ) : null}
                </td>
                <td className="px-4 py-3 font-mono text-[10px] text-[#3D3428]">{r.leonix_ad_id ?? "—"}</td>
                <td className="px-4 py-3 capitalize">{r.lifecycle_status}</td>
                <td className="px-4 py-3 capitalize">{r.lane}</td>
                <td className="px-4 py-3">
                  <code className="break-all text-[10px] text-[#6B645C]">{r.owner_user_id ?? "—"}</code>
                  {r.owner_user_id ? (
                    <>
                      <br />
                      <Link href={`/admin/usuarios/${encodeURIComponent(r.owner_user_id)}`} className="text-[10px] font-semibold text-[#6B5B2E] underline">
                        Admin perfil
                      </Link>
                    </>
                  ) : null}
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
                <td className="px-4 py-3 align-top">
                  <ClassifiedAdminRowActions
                    variant="empleos"
                    rowId={r.id}
                    publicLive={r.lifecycle_status === "published"}
                    promoted={Boolean(r.admin_promoted)}
                    verified={Boolean(r.leonix_verified)}
                    canArchive={r.lifecycle_status !== "archived"}
                    staffEditBoardHref={`/admin/workspace/clasificados/empleos?q=${encodeURIComponent(r.leonix_ad_id ?? r.id)}`}
                    republishCategory="empleos"
                    republishRow={{
                      lifecycle_status: r.lifecycle_status,
                      republish_override: (r as { republish_override?: boolean | null }).republish_override,
                    }}
                  />
                </td>
                <td className="px-4 py-3 align-top">
                  <AdminListingMonetizationSummary
                    category="empleos"
                    source="empleos_public_listings"
                    listing={r as unknown as Record<string, unknown>}
                    lang={adminLang}
                  />
                </td>
                <td className="px-4 py-3 text-xs font-semibold">
                  <Link
                    href={appendLangToPath(`/clasificados/empleos/${r.slug}`, lang)}
                    className="text-[#6B5B2E] underline"
                    title="Vista pública del puesto"
                  >
                    Ver público
                  </Link>
                  <br />
                  <Link
                    href={`/dashboard/empleos/${r.id}?lang=${lang}`}
                    className="text-[#6B5B2E] underline"
                    title="Panel del anunciante: API valida propietario; sesión staff no edita en su nombre"
                  >
                    Panel anunciante (su sesión)
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      ) : null}
    </div>
  );
}
