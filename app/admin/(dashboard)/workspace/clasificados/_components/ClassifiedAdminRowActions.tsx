"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import { republishActionLabel } from "@/app/admin/_lib/classifiedsRepublishCapability";

export type ClassifiedStaffOpsVariant =
  | "restaurante"
  | "listings"
  | "servicios"
  | "empleos"
  | "autos"
  | "viajes";

type Props = {
  variant: ClassifiedStaffOpsVariant;
  rowId: string;
  /** True when the listing is publicly live (published / active / approved+public, etc.). */
  publicLive: boolean;
  promoted: boolean;
  verified: boolean;
  /** When false, hide archive (e.g. row already archived). */
  canArchive?: boolean;
  /** Staff / owner edit surface for this row (dashboard, perfil, etc.). */
  staffEditBoardHref?: string;
  /** When set with `republishRow`, shows Move to top / Republish / No republish (listings + verticals). */
  republishCategory?: string;
  republishRow?: Record<string, unknown>;
};

function patchUrl(variant: ClassifiedStaffOpsVariant, rowId: string): string {
  const id = encodeURIComponent(rowId);
  switch (variant) {
    case "restaurante":
      return `/api/admin/restaurantes/listings/${id}`;
    case "listings":
      return `/api/admin/clasificados/listings/${id}`;
    case "servicios":
      return `/api/admin/servicios/listings/${id}`;
    case "empleos":
      return `/api/admin/empleos/listings/${id}`;
    case "autos":
      return `/api/admin/autos/listings/${id}`;
    case "viajes":
      return `/api/admin/viajes/listings/${id}`;
    default:
      return `/api/admin/clasificados/listings/${id}`;
  }
}

export function ClassifiedAdminRowActions({
  variant,
  rowId,
  publicLive,
  promoted,
  verified,
  canArchive = true,
  staffEditBoardHref,
  republishCategory,
  republishRow,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const run = useCallback(
    async (action: string) => {
      setBusy(true);
      setMsg(null);
      try {
        const res = await fetch(patchUrl(variant, rowId), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ action }),
        });
        const j = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok || !j.ok) {
          setMsg(j.error ?? `HTTP ${res.status}`);
          return;
        }
        window.location.reload();
      } catch {
        setMsg("network");
      } finally {
        setBusy(false);
      }
    },
    [rowId, variant],
  );

  const runArchive = useCallback(() => {
    if (!canArchive) return;
    const ok = window.confirm("¿Archivar este anuncio? Dejará de mostrarse al público.");
    if (!ok) return;
    void run("archive");
  }, [canArchive, run]);

  const republish =
    republishCategory && republishRow
      ? republishActionLabel(republishRow, republishCategory)
      : null;

  return (
    <div className="space-y-2">
      {staffEditBoardHref ? (
        <Link
          href={staffEditBoardHref}
          className="inline-flex rounded-lg border border-[#C9B46A]/60 bg-[#FFF7ED] px-2 py-1 text-[10px] font-bold text-[#92400E] underline-offset-2 hover:underline"
        >
          Editar
        </Link>
      ) : null}
      <div className="flex flex-wrap gap-1.5">
        {republish ? (
          <button
            type="button"
            disabled={busy || republish.disabled}
            title={republish.disabled ? republish.reason : undefined}
            onClick={() => {
              if (republish.disabled) return;
              void run("republish");
            }}
            className="rounded-lg border border-slate-300/90 bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-900 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {busy ? "…" : republish.label}
          </button>
        ) : null}
        {publicLive ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void run("suspend")}
            className="rounded-lg border border-red-300/90 bg-red-50 px-2 py-1 text-[10px] font-bold text-red-900 disabled:opacity-50"
          >
            Suspender
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => void run("unsuspend")}
            className="rounded-lg border border-emerald-300/90 bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-900 disabled:opacity-50"
          >
            Republicar
          </button>
        )}
        {promoted ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void run("promote_off")}
            className="rounded-lg border border-amber-300/80 bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-950 disabled:opacity-50"
          >
            Quitar destacado
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => void run("promote_on")}
            className="rounded-lg border border-amber-300/80 bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-950 disabled:opacity-50"
          >
            Destacar
          </button>
        )}
        {verified ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void run("verify_off")}
            className="rounded-lg border border-sky-300/80 bg-sky-50 px-2 py-1 text-[10px] font-bold text-sky-950 disabled:opacity-50"
          >
            Quitar verificado
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => void run("verify_on")}
            className="rounded-lg border border-sky-300/80 bg-sky-50 px-2 py-1 text-[10px] font-bold text-sky-950 disabled:opacity-50"
          >
            Verificar Leonix
          </button>
        )}
        {canArchive ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void runArchive()}
            className="rounded-lg border border-stone-400/80 bg-stone-100 px-2 py-1 text-[10px] font-bold text-stone-900 disabled:opacity-50"
          >
            Archivar
          </button>
        ) : null}
      </div>
      {msg ? <p className="text-[10px] font-semibold text-red-700">{msg}</p> : null}
    </div>
  );
}
