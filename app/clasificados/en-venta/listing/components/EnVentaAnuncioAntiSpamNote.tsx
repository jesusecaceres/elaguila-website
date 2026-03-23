"use client";

import type { EnVentaAnuncioLang } from "../types/enVentaAnuncioLiveTypes";

export function EnVentaAnuncioAntiSpamNote(props: { lang: EnVentaAnuncioLang }) {
  const { lang } = props;
  return (
    <p className="mt-3 text-xs text-[#111111]">
      {lang === "es"
        ? "Nota: Usamos detección anti‑spam y señales de verificación para mantener anuncios limpios y confiables."
        : "Note: We use anti-spam detection and verification signals to keep listings clean and trustworthy."}
    </p>
  );
}
