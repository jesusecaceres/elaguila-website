"use client";

import { useEffect } from "react";

/**
 * Shared flyer/coupon viewer modal — generalized from Restaurantes' working
 * `RestauranteShellDataUrlModal` (app/(site)/clasificados/restaurantes/shell/
 * RestauranteShellDataUrlModal.tsx), picked as the canonical source per the Worktree A
 * execution contract since it already handles both image and PDF sources with an always
 * visible, reachable close control. Logic is unchanged from the source component (verified by
 * direct read) — including its exact match rule: only `data:image/...` / `data:application/pdf`
 * URIs render inline; any other URL (including an already-resolved HTTPS flyer URL) falls
 * through to the "open in another tab" fallback below, exactly as the source component does
 * today. Only generalized (caller-supplied close/fallback copy) so any category can reuse it
 * without a dependency on the Restaurantes module — no behavior change proposed here.
 *
 * Worktree A builds this component only; Servicios/Restaurantes/Comida Local continue using
 * their own current flyer viewers in this gate — swapping onto this shared component is
 * category-adapter work for a later worktree.
 */
export function BusinessFlyerViewerModal({
  open,
  onClose,
  href,
  title,
  closeLabel = "Cerrar",
  unavailableLabel = "Vista integrada no disponible para este tipo de archivo.",
  downloadLabel = "Descargar / abrir en otra pestaña",
}: {
  open: boolean;
  onClose: () => void;
  href: string;
  title: string;
  closeLabel?: string;
  unavailableLabel?: string;
  downloadLabel?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !href) return null;

  const isPdf = /^data:application\/pdf/i.test(href);
  const isImage = /^data:image/i.test(href);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="flex max-h-[96vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#0f0d09] shadow-2xl">
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-3 py-2 sm:px-4">
          <p className="min-w-0 truncate text-xs font-semibold text-white/90">{title}</p>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/15"
          >
            {closeLabel}
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-2 sm:p-4">
          {isImage ? (
            <img src={href} alt="" className="mx-auto max-h-[min(85vh,900px)] max-w-full object-contain" draggable={false} />
          ) : null}
          {isPdf ? (
            <iframe title={title} src={href} className="h-[min(85vh,880px)] w-full rounded-lg bg-white" />
          ) : null}
          {!isImage && !isPdf ? (
            <div className="p-6 text-center text-sm text-white/85">
              <p>{unavailableLabel}</p>
              <a
                href={href}
                download={title.replace(/\s+/g, "-").slice(0, 48)}
                className="mt-4 inline-block font-semibold text-[color:var(--lx-gold-soft,#C9A84A)] underline"
              >
                {downloadLabel}
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
