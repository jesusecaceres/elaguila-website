"use client";

import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  intro: string;
  checks: [string, string, string];
  confirmCta: string;
  cancelCta: string;
  blockedHint: string;
};

/**
 * Phase 6: standardized publish confirmation (no payment / no API yet).
 * All three boxes must be checked before confirm is enabled.
 */
export function EmpleosPublishConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  intro,
  checks,
  confirmCta,
  cancelCta,
  blockedHint,
}: Props) {
  const [c, setC] = useState([false, false, false]);
  useEffect(() => {
    if (open) setC([false, false, false]);
  }, [open]);
  if (!open) return null;
  const all = c.every(Boolean);
  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Cerrar" onClick={onClose} />
      <div className="relative z-[201] m-4 w-full max-w-lg rounded-2xl border border-black/10 bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold text-[color:var(--lx-text)]">{title}</h2>
        <p className="mt-2 text-sm text-[color:var(--lx-text-2)]">{intro}</p>
        <ul className="mt-4 space-y-3">
          {checks.map((label, i) => (
            <li key={label}>
              <label className="flex cursor-pointer gap-3 text-sm">
                <input type="checkbox" checked={c[i]} onChange={(e) => setC((prev) => prev.map((x, j) => (j === i ? e.target.checked : x)))} />
                <span>{label}</span>
              </label>
            </li>
          ))}
        </ul>
        {!all ? <p className="mt-3 text-xs text-[color:var(--lx-muted)]">{blockedHint}</p> : null}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="min-h-11 rounded-lg border px-4 text-sm font-semibold" onClick={onClose}>
            {cancelCta}
          </button>
          <button
            type="button"
            disabled={!all}
            className="min-h-11 rounded-lg bg-[color:var(--lx-cta-dark)] px-4 text-sm font-bold text-[#FFFCF7] disabled:opacity-40"
            onClick={() => {
              onConfirm();
              onClose();
              setC([false, false, false]);
            }}
          >
            {confirmCta}
          </button>
        </div>
      </div>
    </div>
  );
}
