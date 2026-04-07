"use client";

import React, { useMemo } from "react";
import type { Lang, ListingLike } from "./aiInsights";
import { detectLanguageCompleteness, findPotentialDuplicates, qualityGateHints } from "./aiInsights";

type Props = {
  lang: Lang;
  listing: ListingLike | null;
  allListings: ListingLike[];
};

export default function AiInsightsPanel({ lang, listing, allListings }: Props) {
  const insights = useMemo(() => {
    if (!listing) return null;

    const langCheck = detectLanguageCompleteness(listing);
    const dupes = findPotentialDuplicates(listing, allListings);
    const hints = qualityGateHints(listing, lang);

    return { langCheck, dupes, hints };
  }, [listing, allListings, lang]);

  if (!listing || !insights) return null;

  const title = lang === "es" ? "LEONIX AI Insights" : "LEONIX AI Insights";
  const subtitle =
    lang === "es"
      ? "Sugerencias automáticas para mejorar calidad y conversiones."
      : "Automatic suggestions to improve quality and conversions.";

  return (
    <div className="rounded-2xl border border-yellow-400/35 bg-neutral-800/60 backdrop-blur ring-1 ring-yellow-400/20 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.85)] p-6">
      <div className="text-lg font-bold text-white">{title}</div>
      <div className="mt-1 text-sm text-gray-200">{subtitle}</div>

      <div className="mt-4 space-y-3 text-sm text-white">
        <div className="rounded-xl border border-white/10 bg-black/35 p-4">
          <div className="font-semibold">
            {lang === "es" ? "Idioma" : "Language"}
          </div>
          <div className="mt-1 text-gray-200">
            {insights.langCheck.ok ? (
              lang === "es" ? "ES + EN completos." : "ES + EN complete."
            ) : (
              <>
                {lang === "es" ? "Falta contenido en:" : "Missing content in:"}{" "}
                <span className="font-semibold text-white">
                  {insights.langCheck.missing.join(", ").toUpperCase()}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/35 p-4">
          <div className="font-semibold">
            {lang === "es" ? "Duplicados" : "Duplicates"}
          </div>
          <div className="mt-1 text-gray-200">
            {insights.dupes.length === 0
              ? lang === "es"
                ? "No se detectaron duplicados obvios."
                : "No obvious duplicates detected."
              : lang === "es"
                ? "Posible duplicado: revisa título/ciudad para evitar spam."
                : "Possible duplicate: review title/city to avoid spam."}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/35 p-4">
          <div className="font-semibold">
            {lang === "es" ? "Quality Gate" : "Quality Gate"}
          </div>
          <ul className="mt-2 space-y-1 text-gray-200">
            {insights.hints.slice(0, 5).map((h, i) => (
              <li key={i}>• {h}</li>
            ))}
          </ul>
        </div>

        <div className="text-xs text-gray-300">
          {lang === "es"
            ? "Nota: estos checks son locales (MVP). No reemplazan moderación."
            : "Note: these checks are local (MVP). They don’t replace moderation."}
        </div>
      </div>
    </div>
  );
}
