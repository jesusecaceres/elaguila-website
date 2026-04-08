"use client";

import { useEffect, useId, useRef } from "react";
import { getLeonixMarketplaceRulesCopy, type LeonixMarketplaceRulesLang } from "../lib/leonixMarketplaceRulesCopy";

type Props = {
  open: boolean;
  onClose: () => void;
  lang: LeonixMarketplaceRulesLang;
  variant?: "light" | "dark";
};

const LABELS = {
  es: { close: "Cerrar reglas", backdrop: "Cerrar" },
  en: { close: "Close rules", backdrop: "Close" },
} as const;

export default function LeonixMarketplaceRulesDialog({ open, onClose, lang, variant = "light" }: Props) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const t = getLeonixMarketplaceRulesCopy(lang);
  const closeAria = LABELS[lang].close;
  const backdropAria = LABELS[lang].backdrop;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const panel =
    variant === "dark"
      ? "bg-[#141414] text-[#F5F5F5] shadow-2xl ring-1 ring-white/10"
      : "bg-white text-[#111111] shadow-2xl ring-1 ring-black/10";

  const muted = variant === "dark" ? "text-white/75" : "text-[#111111]/80";
  const list = variant === "dark" ? "text-white/90" : "text-[#111111]/90";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" aria-hidden={false}>
      <button
        type="button"
        className="absolute inset-0 z-0 bg-black/50"
        aria-label={backdropAria}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative z-10 max-h-[min(90vh,640px)] w-full max-w-lg overflow-y-auto rounded-2xl p-5 sm:p-6 ${panel}`}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className={
            variant === "dark"
              ? "absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-lg text-xl leading-none text-white/85 hover:bg-white/10"
              : "absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-lg text-xl leading-none text-[#111111] hover:bg-black/5"
          }
          aria-label={closeAria}
        >
          ×
        </button>
        <h2 id={titleId} className="pr-12 text-lg font-bold">
          {t.title}
        </h2>
        <p className={`mt-3 text-sm ${muted}`}>{t.intro}</p>
        <ul className={`mt-4 list-inside list-disc space-y-2 text-sm ${list}`}>
          {t.rules.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
