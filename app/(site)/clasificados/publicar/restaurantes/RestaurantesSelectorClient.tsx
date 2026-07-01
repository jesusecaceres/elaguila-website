"use client";

import Link from "next/link";
import { useState } from "react";

type CopyType = {
  title: string;
  body: string;
  card1Kicker: string;
  card1Title: string;
  card1Price: string;
  card1Body: string;
  card1Cta: string;
  card1More: string;
  card1MoreTitle: string;
  card1MoreDetails: string;
  card1MoreBullets: readonly string[];
  card2Kicker: string;
  card2Title: string;
  card2Price: string;
  card2Body: string;
  card2Cta: string;
  card2More: string;
  card2MoreTitle: string;
  card2MoreDetails: string;
  card2MoreBullets: readonly string[];
};

type Lang = "es" | "en";

export function RestaurantesSelectorClient({
  t,
  lang,
  withLang,
  restPublicarEstablecido,
  comidaLocalPublicar,
}: {
  t: CopyType;
  lang: Lang;
  withLang: (path: string) => string;
  restPublicarEstablecido: string;
  comidaLocalPublicar: string;
}) {
  const [moreDrawer, setMoreDrawer] = useState<"card1" | "card2" | null>(null);

  return (
    <main className="min-h-screen bg-[#F6F0E2] px-4 pb-20 pt-28 text-[#2C2416]">
      <div className="mx-auto max-w-lg">
        <h1 className="text-3xl font-extrabold text-[#1E1810]">{t.title}</h1>
        <p className="mt-2 text-sm text-[#5C5346]/88">{t.body}</p>
        <div className="mt-8 space-y-4">
          <Link
            href={withLang(restPublicarEstablecido)}
            className="block rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7] p-5 shadow-sm transition hover:border-[#C9B46A]/50"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-wide text-[#B8954A]">{t.card1Kicker}</p>
                <p className="mt-1 text-lg font-bold text-[#1E1810]">{t.card1Title}</p>
                <p className="mt-1 text-sm font-semibold text-[#7A1E2C]">{t.card1Price}</p>
                <p className="mt-2 text-sm text-[#5C5346]/85">{t.card1Body}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <p className="text-sm font-bold text-[#7A1E2C]">{t.card1Cta}</p>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setMoreDrawer("card1"); }}
                className="text-sm font-semibold text-[#5C5346] underline underline-offset-2 hover:text-[#1E1810]"
              >
                {t.card1More}
              </button>
            </div>
          </Link>
          <Link
            href={withLang(comidaLocalPublicar)}
            className="block rounded-2xl border border-[#C9B46A]/45 bg-gradient-to-br from-[#FFF6E7] to-[#FFFCF7] p-5 shadow-md transition hover:border-[#B8954A]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-wide text-[#B8954A]">{t.card2Kicker}</p>
                <p className="mt-1 text-lg font-bold text-[#1E1810]">{t.card2Title}</p>
                <p className="mt-1 text-sm font-semibold text-[#7A1E2C]">{t.card2Price}</p>
                <p className="mt-2 text-sm text-[#5C5346]/85">{t.card2Body}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <p className="text-sm font-bold text-[#7A1E2C]">{t.card2Cta}</p>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setMoreDrawer("card2"); }}
                className="text-sm font-semibold text-[#5C5346] underline underline-offset-2 hover:text-[#1E1810]"
              >
                {t.card2More}
              </button>
            </div>
          </Link>
        </div>
      </div>
      {moreDrawer === "card1" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setMoreDrawer(null)}>
          <div className="max-w-lg rounded-2xl bg-[#FFFCF7] p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-[#1E1810]">{t.card1MoreTitle}</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#5C5346]">{t.card1MoreDetails}</p>
            <ul className="mt-4 space-y-2">
              {t.card1MoreBullets.map((bullet, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#5C5346]">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#B8954A]" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setMoreDrawer(null)}
              className="mt-6 min-h-[44px] w-full rounded-full bg-[#1E1810] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3D2C12]"
            >
              {lang === "en" ? "Close" : "Cerrar"}
            </button>
          </div>
        </div>
      )}
      {moreDrawer === "card2" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setMoreDrawer(null)}>
          <div className="max-w-lg rounded-2xl bg-[#FFFCF7] p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-[#1E1810]">{t.card2MoreTitle}</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#5C5346]">{t.card2MoreDetails}</p>
            <ul className="mt-4 space-y-2">
              {t.card2MoreBullets.map((bullet, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#5C5346]">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#B8954A]" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setMoreDrawer(null)}
              className="mt-6 min-h-[44px] w-full rounded-full bg-[#1E1810] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3D2C12]"
            >
              {lang === "en" ? "Close" : "Cerrar"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
