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

function FlipbookEmbed({ src, title }: { src: string; title: string }) {
  // Responsive embed: width 100%, height controlled by aspect ratio.
  // Uses no extra scripts; stays fast + mobile-friendly.
  return (
    <div className="w-full">
      <div className="relative w-full h-0 pb-[max(60%,324px)]">
        <iframe
          src={src}
          title={title}
          className="absolute left-0 top-0 w-full h-full border-0"
          scrolling="no"
          allow="fullscreen"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </div>
  );
}

export default function MagazineHubPage() {
  const params = useSearchParams();
  const lang = (params.get("lang") || "es") as Lang;

  // Your FlipHTML5 book link (keep this constant month-to-month)
  const FLIPBOOK_URL = "https://online.fliphtml5.com/LEONIXMedia/magazine/";

  const ui = useMemo(
    () => ({
      es: {
        title: "LEONIX Media — Revista",
        subtitle:
          "Revista de Comunidad, Cultura y Negocios. Una experiencia editorial — creada para elevar historias, familias y negocios locales con un estilo premium y limpio.",
        featuredLabel: "Edición destacada",
        explore: "Leer la revista",
        openFlip: "Abrir flipbook",
        jumpToEditions: "Ver ediciones 2026",
        noteTop:
          "Tip: Cada edición vive en /public/magazine/AÑO/MES/ con cover.png y magazine.pdf",
        loading: "Cargando ediciones…",
        flipSectionTitle: "Edición Digital (Flipbook)",
        flipSectionNote:
          "Experiencia móvil premium. Toca enlaces dentro de la revista para abrir sitios, llamadas y CTAs.",
        pdfBackup: "PDF (respaldo)",
        downloadPdf: "Descargar PDF",
        years: "Ediciones por año",
        viewInHub: "Ver en el hub",
      },
      en: {
        title: "LEONIX Media — Magazine",
        subtitle:
          "A magazine for Community, Culture, and Business. An editorial-first experience — built to elevate stories, families, and local businesses with a premium, clean standard.",
        featuredLabel: "Featured edition",
        explore: "Read the magazine",
        openFlip: "Open flipbook",
        jumpToEditions: "View 2026 editions",
        noteTop:
          "Tip: Each edition lives in /public/magazine/YEAR/MONTH/ with cover.png and magazine.pdf",
        loading: "Loading editions…",
        flipSectionTitle: "Digital Edition (Flipbook)",
        flipSectionNote:
          "Premium mobile experience. Tap links inside the magazine to open websites, calls, and CTAs.",
        pdfBackup: "PDF (backup)",
        downloadPdf: "Download PDF",
        years: "Editions by year",
        viewInHub: "View in hub",
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
  const flipAnchorId = "flipbook";

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

        {/* Primary action now goes to flipbook section */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 px-6">
          <a
            href={`#${flipAnchorId}`}
            className="px-7 py-3 rounded-full bg-yellow-400 text-black font-semibold text-sm md:text-base shadow-lg hover:bg-yellow-300 transition"
          >
            {t.explore}
          </a>

          <a
            href={FLIPBOOK_URL}
            target="_blank"
            rel="noreferrer"
            className="px-7 py-3 rounded-full border border-yellow-400/70 text-yellow-300 font-semibold text-sm md:text-base hover:bg-yellow-400/10 transition"
          >
            {t.openFlip}
          </a>

          <a
            href={`#${editionsAnchorId}`}
            className="px-7 py-3 rounded-full border border-white/15 text-gray-200 font-semibold text-sm md:text-base hover:border-white/30 transition"
          >
            {t.jumpToEditions}
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
            {/* FEATURED / FLIPBOOK */}
            <div
              id={flipAnchorId}
              className="bg-black/40 border border-yellow-600/25 rounded-2xl p-6 md:p-8 shadow-[0_0_35px_rgba(255,215,0,0.12)]"
            >
              <p className="text-sm tracking-wide text-yellow-300/90 mb-4 text-center">
                {t.featuredLabel}
              </p>

              <div className="flex flex-col lg:flex-row items-start gap-8">
                {/* Left: cover + meta */}
                <div className="w-full lg:w-[320px] flex-shrink-0">
                  <div className="w-56 md:w-64 mx-auto lg:mx-0 aspect-[2/3] rounded-xl overflow-hidden border border-yellow-400/50 bg-black shadow-[0_0_35px_rgba(255,215,0,0.35)]">
                    <img
                      src={featuredCoverSrc}
                      alt={featured.title[lang]}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="mt-5 text-center lg:text-left">
                    <h2 className="text-2xl md:text-3xl font-bold text-yellow-400">
                      {featured.title[lang]}
                    </h2>
                    <p className="text-gray-300 mt-2">
                      {monthLabel(featured.month, lang)} {featured.year}
                    </p>

                    <p className="text-gray-400 text-sm mt-4 leading-relaxed">
                      {t.flipSectionNote}
                    </p>

                    {/* Optional backup PDF download only (not primary) */}
                    <div className="mt-5 flex flex-wrap gap-2 justify-center lg:justify-start">
                      <span className="px-4 py-2 rounded-full border border-white/10 text-gray-300 text-xs md:text-sm">
                        {t.pdfBackup}
                      </span>

                      <a
                        href={featuredPdfSrc}
                        download
                        className="px-4 py-2 rounded-full border border-yellow-400/70 text-yellow-300 font-semibold text-xs md:text-sm hover:bg-yellow-400/10 transition"
                      >
                        {t.downloadPdf}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Right: embedded flipbook */}
                <div className="w-full">
                  <div className="mb-4 text-center lg:text-left">
                    <h3 className="text-xl md:text-2xl font-bold text-yellow-300">
                      {t.flipSectionTitle}
                    </h3>
                  </div>

                  <div className="rounded-2xl overflow-hidden border border-yellow-500/15 bg-black/40">
                    <FlipbookEmbed src={FLIPBOOK_URL} title="LEONIX Magazine Flipbook" />
                  </div>

                  <p className="mt-3 text-xs text-gray-500">
                    Tip: For monthly updates, just re-upload/replace the PDF inside this same FlipHTML5 book — your website
                    embed stays unchanged.
                  </p>
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
                  const monthsSorted = [...months].reverse();

                  return (
                    <div
                      key={year}
                      className="bg-black/30 border border-yellow-600/15 rounded-2xl p-6 md:p-8"
                    >
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

                                  {/* Archive stays simple; PDF download is fine here.
                                      (We can add future flipbook-per-month later if you want.) */}
                                  <div className="mt-4 flex flex-wrap gap-2">
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
                                      {t.viewInHub}
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
