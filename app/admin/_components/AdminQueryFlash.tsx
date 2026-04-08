"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Short-lived toast-style feedback for real server redirects (?saved=1, ?error=1, etc.).
 * Not for passive help text — only action outcomes.
 */
export function AdminQueryFlash() {
  const sp = useSearchParams();
  const [open, setOpen] = useState<{ tone: "ok" | "err"; message: string } | null>(null);

  const saved = sp?.get("saved");
  const registrySaved = sp?.get("registry_saved");
  const registryError = sp?.get("registry_error");
  const err = sp?.get("error");

  useEffect(() => {
    if (saved === "1") {
      setOpen({ tone: "ok", message: "Guardado correctamente." });
    } else if (registrySaved === "1") {
      setOpen({ tone: "ok", message: "Registro de revista actualizado." });
    } else if (registryError === "1") {
      setOpen({ tone: "err", message: "No se pudo guardar el borrador (falta título o error de servidor)." });
    } else if (err === "1") {
      setOpen({ tone: "err", message: "La acción falló. Revisa permisos o vuelve a intentar." });
    } else {
      setOpen(null);
      return;
    }
    const t = window.setTimeout(() => setOpen(null), 5200);
    return () => window.clearTimeout(t);
  }, [saved, registrySaved, registryError, err]);

  if (!open) return null;

  const bg =
    open.tone === "ok"
      ? "border-emerald-200 bg-emerald-950 text-emerald-50"
      : "border-rose-300 bg-rose-950 text-rose-50";

  return (
    <div
      className={`pointer-events-none fixed bottom-4 left-1/2 z-[200] w-[min(100%,22rem)] -translate-x-1/2 px-3 sm:left-auto sm:right-6 sm:translate-x-0`}
      role="status"
    >
      <div className={`pointer-events-auto rounded-2xl border px-4 py-3 text-sm font-semibold shadow-lg ${bg}`}>
        <div className="flex items-start justify-between gap-3">
          <span>{open.message}</span>
          <button
            type="button"
            onClick={() => setOpen(null)}
            className="shrink-0 rounded-lg px-2 py-0.5 text-xs font-bold opacity-80 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
