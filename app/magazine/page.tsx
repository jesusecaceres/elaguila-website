"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import newLogo from "../../public/logo.png";

type Lang = "es" | "en";

type TitleMap = {
  es: string;
  en: string;
};

type MonthEntry = {
  month: string; // "january", "february", etc.
  title: TitleMap;
};

type EditionsManifest = {
  featured: {
    year: string; // "2026"
    month: string; // "february"
    title: TitleMap;
  };
  years: Record<
    string,
    {
      months: MonthEntry[];
    }
  >;
};

const FALLBACK: EditionsManifest = {
  featured: {
    year: "2026",
    month: "february",
    title: {
      es: "Edición Digital — Febrero 2026",
      en: "Digital Edition — February 2026",
    },
  },
  years: {
    "2026": {
      months: [
        {
          month: "february",
          title: {
            es: "Febrero 2026 — Conexión",
            en: "February 2026 — Connection",
          },
        },
        {
          month: "january",
          title: {
            es: "Enero 2026 — Claridad",
            en: "January 2026 — Clarity",
          },
        },
      ],
    },
  },
};

function monthLabel(month: string, lang: Lang) {
  const m = month.toLowerCase();
  const es: Record<string, string> = {
    january: "Enero",
    february: "Febrero",
    march: "Marzo",
    april: "Abril",
    may: "Mayo",
    june: "Junio",
    july: "Julio",
    august: "Agosto",
    september: "Septiembre",
    october: "Octubre",
    november: "Noviembre",
    december: "Diciembre",
  };
  const en: Record<string, string> = {
    january: "January",
    february: "February",
    march: "March",
    april: "April",
    may: "May",
    june: "June",
    july: "July",
    august: "August",
    september: "September",
    october: "October",
    november: "November",
    december: "December",
  };
  return lang === "es" ? es[m] || month : en[m] || month;
}

export default function MagazineHubPage() {
  const params = useSearchParams();
  const lang = (params.get("lang") || "es") as Lang;

  const ui = useMemo(
    () => ({
      es: {
        title: "LEONIX Media — Revista",
        subtitle:
          "Revista de Comunidad, Cultura y Negocios. Una experiencia editorial — creada para elevar historias, familias y negocios locales con un estilo premium y limpio.",
        featuredLabel: "Edición destacada",
        explore: "Explorar la revista",
        openPdf: "Abrir PDF",
        downloadPdf: "Descargar PDF",
        years: "Ediciones por año",
        viewEditions: "Ver ediciones 2026",
        noteTop:
          "Tip: Cada edición vive en /public/magazine/AÑO/MES/ con cover.png y magazine.pdf",
        loading: "Cargando ediciones…",
      },
      en: {
        title: "LEONIX Media — Magazine",
        subtitle:
          "A magazine for Community, Culture, and Business. An editorial-first experience — built to elevate stories, families, and local businesses with a premium, clean standard.",
        featuredLabel: "Featured edition",
        explore: "Explore magazine",
        openPdf: "Open PDF",
        downloadPdf: "Download PDF",
        years: "Editions by year",
        viewEditions: "View 2026 editions",
        noteTop:
          "Tip: Each edition lives in /public/magazine/YEAR/MONTH/ with cover.png and magazine.pdf",
        loading: "Loading editions…",
      },
    }),
    []
  );

  const t = ui[lang];

  const [data, setData] = useState<EditionsManifest>(FALLBACK);
  const [status, setStatus] = useState<"loading" | "ready">("loading");

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setStatus("loading");
        const res = await fetch("/magazine/editions.json", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as EditionsManifest;
        if (!alive) return;

        // basic safety fallback if file is empty/bad
        if (!json?.featured?.year || !json?.featured?.month || !json?.years) {
          setData(FALLBACK);
        } else {
          setData(json);
        }

        setStatus("ready");
      } catch {
        if (!alive) return;
        setData(FALLBACK);
        setStatus("ready");
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  const featured = data.featured;
  const featuredCoverSrc = `/magazine/${featured.year}/${featured.month}/cover.png`;
  const featuredPdfSrc = `/magazine/${featured.year}/${featured.month}/magazine.pdf`;

  const yearsSorted = useMemo(() => {
    return Object.keys(data.years).sort((a, b) => Number(b) - Number(a));
  }, [data]);

  const editionsAnchorId = "ediciones";

  return (
    <div className="bg-black text-white min-h-screen pb-32">
      <Navbar />

      {/* HERO — About page style */}
      <div className="w-full text-center pt-28 pb-16 bg-gradient-to-b from-black via-[#2b210c] to-[#3a2c0f]">
        <Image
          src={newLogo}
          alt="LEONIX Media"
          width={320}
          className="mx-auto mb-6 drop-shadow-[0_0_18px_rgba(255,215,0,0.55)]"
          priority
        />

        <h1 className="text-5xl font-bold text-yellow-400 px-4">{t.title}</h1>

        <p className="mt-6 text-lg md:text-xl text-gray-200/90 max-w-4xl mx-auto px-6">
          {t.subtitle}
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 px-6">
          <a
            href={featuredPdfSrc}
            target="_blank"
            rel="noreferrer"
            className="px-7 py-3 rounded-full bg-yellow-400 text-black font-semibold text-sm md:text-base shadow-lg hover:bg-yellow-300 transition"
          >
            {t.explore}
          </a>

          <a
            href={`#${editionsAnchorId}`}
            className="px-7 py-3 rounded-full border border-yellow-400/70 text-yellow-300 font-semibold text-sm md:text-base hover:bg-yellow-400/10 transition"
          >
            {t.viewEditions}
          </a>
        </div>

        <p className="mt-6 text-xs md:text-sm text-gray-400 px-6">{t.noteTop}</p>
      </div>

      {/* BODY */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        {status === "loading" && (
          <div className="text-center text-gray-300">{t.loading}</div>
        )}

        {status === "ready" && (
          <div className="flex flex-col gap-16">
            {/* FEATURED */}
            <div className="bg-black/40 border border-yellow-600/25 rounded-2xl p-8 md:p-10 shadow-[0_0_35px_rgba(255,215,0,0.12)]">
              <p className="text-sm tracking-wide text-yellow-300/90 mb-6 text-center">
                {t.featuredLabel}
              </p>

              <div className="flex flex-col md:flex-row items-center gap-10">
                <div className="w-56 md:w-64 aspect-[2/3] rounded-xl overflow-hidden border border-yellow-400/50 bg-black shadow-[0_0_35px_rgba(255,215,0,0.35)]">
                  <img
                    src={featuredCoverSrc}
                    alt={featured.title[lang]}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="text-left max-w-2xl">
                  <h2 className="text-3xl md:text-4xl font-bold text-yellow-400 mb-3">
                    {featured.title[lang]}
                  </h2>

                  <p className="text-gray-300 mb-6">
                    {monthLabel(featured.month, lang)} {featured.year}
                  </p>

                  <div className="flex flex-wrap gap-3">
                    <a
                      href={featuredPdfSrc}
                      target="_blank"
                      rel="noreferrer"
                      className="px-6 py-3 rounded-full bg-yellow-400 text-black font-semibold text-sm md:text-base shadow-lg hover:bg-yellow-300 transition"
                    >
                      {t.openPdf}
                    </a>

                    <a
                      href={featuredPdfSrc}
                      download
                      className="px-6 py-3 rounded-full border border-yellow-400/70 text-yellow-300 font-semibold text-sm md:text-base hover:bg-yellow-400/10 transition"
                    >
                      {t.downloadPdf}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* ARCHIVES */}
            <div id={editionsAnchorId} className="border-t border-yellow-700/20 pt-12">
              <h3 className="text-3xl font-bold text-yellow-400 text-center mb-10">
                {t.years}
              </h3>

              <div className="flex flex-col gap-12">
                {yearsSorted.map((year) => {
                  const months = data.years[year]?.months || [];

                  // newest-first by common sense order (works fine for jan/feb; later we can sort properly)
                  const monthsSorted = [...months].reverse();

                  return (
                    <div key={year} className="bg-black/30 border border-yellow-600/15 rounded-2xl p-6 md:p-8">
                      <h4 className="text-2xl font-bold text-yellow-300 mb-6 text-center">
                        {year}
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
                        {monthsSorted.map((m) => {
                          const coverSrc = `/magazine/${year}/${m.month}/cover.png`;
                          const pdfSrc = `/magazine/${year}/${m.month}/magazine.pdf`;

                          return (
                            <div
                              key={`${year}-${m.month}`}
                              className="rounded-2xl overflow-hidden border border-yellow-500/15 bg-black/40 hover:border-yellow-400/35 transition"
                            >
                              <div className="p-5">
                                <div className="w-full aspect-[2/3] rounded-xl overflow-hidden border border-yellow-400/20 bg-black shadow-[0_0_25px_rgba(255,215,0,0.10)]">
                                  <img
                                    src={coverSrc}
                                    alt={m.title[lang]}
                                    className="w-full h-full object-cover"
                                  />
                                </div>

                                <div className="mt-5">
                                  <p className="text-yellow-300 font-semibold text-lg leading-tight">
                                    {m.title[lang]}
                                  </p>
                                  <p className="text-gray-400 text-sm mt-2">
                                    {monthLabel(m.month, lang)} {year}
                                  </p>

                                  <div className="mt-4 flex flex-wrap gap-2">
                                    <a
                                      href={pdfSrc}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="px-4 py-2 rounded-full bg-yellow-400 text-black font-semibold text-xs md:text-sm hover:bg-yellow-300 transition"
                                    >
                                      {t.openPdf}
                                    </a>

                                    <a
                                      href={pdfSrc}
                                      download
                                      className="px-4 py-2 rounded-full border border-yellow-400/70 text-yellow-300 font-semibold text-xs md:text-sm hover:bg-yellow-400/10 transition"
                                    >
                                      {t.downloadPdf}
                                    </a>

                                    <Link
                                      href={`/magazine?lang=${lang}`}
                                      className="px-4 py-2 rounded-full border border-white/15 text-gray-200 font-semibold text-xs md:text-sm hover:border-white/30 transition"
                                    >
                                      {lang === "es" ? "Ver en el hub" : "View in hub"}
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
