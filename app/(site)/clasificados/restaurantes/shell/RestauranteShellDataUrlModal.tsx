"use client";

import { useEffect } from "react";

/**
 * In-context viewer for session data URLs (menu PDF/image from draft) — keeps preview context.
 */
export function RestauranteShellDataUrlModal({
  open,
  onClose,
  href,
  title,
}: {
  open: boolean;
  onClose: () => void;
  href: string;
  title: string;
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
            Cerrar
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-2 sm:p-4">
          {isImage ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={href} alt="" className="mx-auto max-h-[min(85vh,900px)] max-w-full object-contain" draggable={false} />
          ) : null}
          {isPdf ? (
            <iframe title={title} src={href} className="h-[min(85vh,880px)] w-full rounded-lg bg-white" />
          ) : null}
          {!isImage && !isPdf ? (
            <div className="p-6 text-center text-sm text-white/85">
              <p>Vista integrada no disponible para este tipo de archivo.</p>
              <a
                href={href}
                download={title.replace(/\s+/g, "-").slice(0, 48)}
                className="mt-4 inline-block font-semibold text-[color:var(--lx-gold-soft)] underline"
              >
                Descargar / abrir en otra pestaña
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
