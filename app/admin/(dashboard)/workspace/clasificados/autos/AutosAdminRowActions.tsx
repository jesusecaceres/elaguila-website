"use client";

import { useCallback, useState } from "react";
import { useAdminT } from "@/app/admin/_components/AdminI18nProvider";

type Props = {
  listingId: string;
  status: string;
};

export function AutosAdminRowActions({ listingId, status }: Props) {
  const t = useAdminT();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const run = useCallback(
    async (action: "remove_public" | "restore_active") => {
      setBusy(true);
      setMsg(null);
      try {
        const res = await fetch(`/api/admin/autos/listings/${encodeURIComponent(listingId)}`, {
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
    <div className="space-y-1">
      <div className="flex flex-wrap gap-1">
        {status === "active" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void run("remove_public")}
            className="rounded-lg border border-red-300/90 bg-red-50 px-2 py-1 text-[10px] font-bold text-red-900 disabled:opacity-50"
            title={t("autosQueue.removePublicTitle")}
          >
            {t("autosQueue.removePublic")}
          </button>
        ) : status === "removed" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void run("restore_active")}
            className="rounded-lg border border-emerald-300/90 bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-900 disabled:opacity-50"
            title={t("autosQueue.restoreActiveTitle")}
          >
            {t("autosQueue.restoreActive")}
          </button>
        ) : null}
      </div>
      {msg ? <p className="text-[10px] text-rose-800">{msg}</p> : null}
    </div>
  );
}
