"use client";

import { useEffect } from "react";
import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";

function copy(lang: AutosNegociosLang) {
  return lang === "es"
    ? {
        title: "Publica el anuncio principal primero",
        body: "Primero publica el anuncio principal del dealer. Después podrás agregar vehículos adicionales al inventario sin volver a escribir la información del negocio.",
        close: "Entendido",
      }
    : {
        title: "Publish the main listing first",
        body: "Publish the dealer's main listing first. Then you can add more vehicles to the inventory without re-entering the business information.",
        close: "Got it",
      };
}

export function AutosNegociosPrePublishInventoryDrawer({
  open,
  onClose,
  lang,
}: {
  open: boolean;
  onClose: () => void;
  lang: AutosNegociosLang;
}) {
  const c = copy(lang);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-black/45" aria-label={c.close} onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] p-5 shadow-xl sm:p-6">
        <h3 className="text-lg font-bold text-[color:var(--lx-text)]">{c.title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-[color:var(--lx-text-2)]">{c.body}</p>
        <button
          type="button"
          className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-[color:var(--lx-cta-dark)] px-4 text-sm font-bold text-[#FFFCF7]"
          onClick={onClose}
        >
          {c.close}
        </button>
      </div>
    </div>
  );
}
