"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import {
  CAT_STD_BTN_PRIMARY,
  CAT_STD_BTN_SECONDARY,
} from "./categoryStandardStyles";

type Props = {
  open: boolean;
  onClose: () => void;
  onApply: () => void;
  onClear: () => void;
  lang: Lang;
  title?: string;
  children: ReactNode;
  applyLabel?: string;
  clearLabel?: string;
  closeLabel?: string;
  testId?: string;
};

export function CategoryStandardFiltersDrawerShell({
  open,
  onClose,
  onApply,
  onClear,
  lang,
  title,
  children,
  applyLabel,
  clearLabel,
  closeLabel,
  testId = "category-filters-drawer",
}: Props) {
  const t = {
    filters: lang === "es" ? "Filtros" : "Filters",
    apply: applyLabel ?? (lang === "es" ? "Aplicar" : "Apply"),
    clear: clearLabel ?? (lang === "es" ? "Limpiar" : "Clear"),
    close: closeLabel ?? (lang === "es" ? "Cerrar" : "Close"),
  };

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[70] bg-black/40"
        aria-label={t.close}
        onClick={onClose}
      />
      <div
        className={
          "fixed z-[71] flex flex-col overflow-hidden border border-[#D6C7AD]/90 bg-[#FFFDF7] shadow-xl " +
          "inset-x-0 bottom-0 top-[10vh] rounded-t-2xl max-lg:max-h-[90vh] " +
          "lg:inset-y-0 lg:left-auto lg:right-0 lg:top-0 lg:w-full lg:max-w-[420px] lg:rounded-none lg:rounded-l-2xl"
        }
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-filters-drawer-title"
        data-testid={testId}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#D6C7AD]/60 px-4 py-3">
          <h2 id="category-filters-drawer-title" className="font-serif text-base font-bold text-[#2A4536]">
            {title ?? t.filters}
          </h2>
          <button
            type="button"
            className="rounded-lg border border-[#C9A84A]/45 px-3 py-1 text-xs font-semibold text-[#3D3428] hover:bg-[#FBF7EF]"
            onClick={onClose}
          >
            {t.close}
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">{children}</div>
        <div className="flex gap-2 border-t border-[#D6C7AD]/60 bg-[#FFFDF7] p-4">
          <button type="button" onClick={onClear} className={`${CAT_STD_BTN_SECONDARY} flex-1`}>
            {t.clear}
          </button>
          <button type="button" onClick={onApply} className={`${CAT_STD_BTN_PRIMARY} flex-[1.2]`}>
            {t.apply}
          </button>
        </div>
      </div>
    </>
  );
}

export function CategoryStandardFilterGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2 border-b border-[#D6C7AD]/40 pb-4 last:border-b-0 last:pb-0">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8A6B1F]">{label}</p>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
