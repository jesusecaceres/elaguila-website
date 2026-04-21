"use client";

import { useCallback, useState } from "react";

type Props = {
  listingId: string;
  status: string;
  promoted: boolean;
  verified: boolean;
};

export function RestauranteAdminRowActions({ listingId, status, promoted, verified }: Props) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const run = useCallback(
    async (action: string) => {
      setBusy(true);
      setMsg(null);
      try {
        const res = await fetch(`/api/admin/restaurantes/listings/${encodeURIComponent(listingId)}`, {
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
    [listingId],
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {status === "published" ? (
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
            Republicar (activo)
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
      </div>
      {msg ? <p className="text-[10px] font-semibold text-red-700">{msg}</p> : null}
    </div>
  );
}
