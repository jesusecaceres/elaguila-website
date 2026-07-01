"use client";

import type { ReactNode } from "react";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";

const COPY = {
  es: {
    published: "Publicado en Leonix",
    adId: "Leonix Ad ID",
  },
  en: {
    published: "Published on Leonix",
    adId: "Leonix Ad ID",
  },
} as const;

export function LeonixTrustFooter({
  lang,
  leonixAdId,
  verifyNote,
  children,
}: {
  lang: Lang;
  leonixAdId?: string | null;
  /** Optional category-specific trust line (e.g. Empleos verify note). */
  verifyNote?: string;
  children?: ReactNode;
}) {
  const t = COPY[lang];
  const id = leonixAdId?.trim();

  return (
    <div
      className="flex flex-col items-center gap-3 border-t border-[#D6C7AD]/50 pt-4 text-center"
      data-testid="leonix-trust-footer"
    >
      {verifyNote?.trim() ? (
        <p className="max-w-lg text-[11px] leading-snug text-[#7A7164]/95">{verifyNote.trim()}</p>
      ) : null}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C9A84A]/45 bg-[#E8F3EA] px-3 py-1 text-[11px] font-semibold text-[#1B4332]">
          {t.published}
        </span>
        {id ? (
          <span
            className="select-all rounded-lg border border-[#D6C7AD]/60 bg-[#FBF7EF]/90 px-3 py-1 font-mono text-[11px] text-[#5C564E]"
            data-testid="leonix-ad-id"
          >
            <span className="font-sans text-[10px] font-semibold uppercase tracking-wide text-[#8A6B1F]">
              {t.adId}:{" "}
            </span>
            {id}
          </span>
        ) : null}
      </div>
      {children}
    </div>
  );
}
