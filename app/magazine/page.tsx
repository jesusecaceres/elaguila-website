"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useCallback } from "react";
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

function FullscreenFlipbookModal({
  open,
  onClose,
  src,
  title,
}: {
  open: boolean;
  onClose: () => void;
  src: string;
  title: string;
}) {
  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-4 md:px-6 border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="text-sm md:text-base text-gray-200 font-semibold truncate">
          {title}
        </div>

        <button
          onClick={onClose}
          className="px-4 py-2 rounded-full border border-yellow-400/60 text-yellow-300 font-semibold text-xs md:text-sm hover:bg-yellow-400/10 transition"
          aria-label="Close"
        >
          Close
        </button>
      </div>

      {/* Iframe */}
      <div className="absolute left-0 right-0 bottom-0 top-16">
        <iframe
          src={src}
          title={title}
          className="w-full h-full border-0"
          scrolling="no"
          allow="fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </div>
  );
}

export default function MagazineHubPage() {
  const params = useSearchParams();
  const lang = (params.get("lang") || "es") as Lang;

  // FlipHTML5 book link (constant)
  const FLIPBOOK_URL = "https://online.fliphtml5.com/LEONIXMedia/magazine/";

  const ui = useMemo(
    () => ({
      es: {
        title: "LEONIX Media — Revista",
        subtitle:
          "Revista de Comunidad, Cultura y Negocios. Una experiencia editorial — creada para elevar historias, familias y negocios locales con un estilo premium y limpio.",
        featuredLabel: "Edición destacada",
        loading: "Cargando ediciones…",
        openMagazine: "Leer la revista",
        openMagazineShort: "Abrir",
        pdfBackup: "PDF (respaldo)",
        downloadPdf: "Descargar PDF",
        years: "Ediciones por año",
        modalTitle: "LEONIX — Flipbook",
        close: "Cerrar",
      },
      en: {
        title: "LEONIX Media — Magazine",
        subtitle:
          "A magazine for Community, Culture, and Business. An editorial-first experience — built to elevate stories, families, and local businesses with a premium, clean standard.",
        featuredLabel: "Featured edition",
        loading: "Loading editions…",
        openMagazine: "Read magazine",
        openMagazineShort: "Open",
        pdfBackup: "PDF (backup)",
        downloadPdf: "Download PDF",
        years: "Editions by year",
        modalTitle: "LEONIX — Flipbook",
        close: "Close",
      },
    }),
    []
  );

  const t = ui[lang];

  const [data, setData] = useState<EditionsManifest>(FALLBACK);
  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const [flipOpen, setFlipOpen] = useState(false);

  const openFlipbook = useCallback(() => setFlipOpen(true), []);
  const closeFlipbook = useCallback(() => setFlipOpen(false), []);

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

  return (
    <div className="bg-black text-white min-h-screen pb-32">
      <Navbar />

      <FullscreenFlipbookModal
        open={flipOpen}
        onClose={closeFlipbook}
        src={FLIPBOOK_URL}
        title={t.modalTitle}
      />

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

        {/* Primary actions */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 px-6">
          <button
            onClick={openFlipbook}
            className="px-7 py-3 rounded-full bg-yellow-400 text-black font-semibold text-sm md:text-base shadow-lg hover:bg-yellow-300 transition"
          >
            {t.openMagazine}
          </button>

          <a
            href={`#${editionsAnchorId}`}
            className="px-7 py-3 rounded-full border border-white/15 text-gray-200 font-semibold text-sm md:text-base hover:border-white/30 transition"
          >
            {t.years}
          </a>
        </div>
      </div>

      {/* BODY */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        {status === "loading" && (
          <div className="text-center text-gray-300">{t.loading}</div>
        )}

        {status === "ready" && (
          <div className="flex flex-col gap-16">
            {/* FEATURED (CLEAN) */}
            <div className="bg-black/40 border border-yellow-600/25 rounded-2xl p-6 md:p-8 shadow-[0_0_35px_rgba(255,215,0,0.12)]">
              <p className="text-sm tracking-wide text-yellow-300/90 mb-6 text-center">
                {t.featuredLabel}
              </p>

              <div className="flex flex-col lg:flex-row items-start gap-10">
                {/* Cover */}
                <div className="w-full lg:w-[340px] flex-shrink-0">
                  <div className="w-60 md:w-72 mx-auto lg:mx-0 aspect-[2/3] rounded-xl overflow-hidden border border-yellow-400/50 bg-black shadow-[0_0_35px_rgba(255,215,0,0.35)]">
                    <img
                      src={featuredCoverSrc}
                      alt={featured.title[lang]}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Info + actions */}
                <div className="w-full">
                  <h2 className="text-3xl md:text-4xl font-bold text-yellow-400 text-center lg:text-left">
                    {featured.title[lang]}
                  </h2>

                  <p className="text-gray-300 mt-3 text-center lg:text-left">
                    {monthLabel(featured.month, lang)} {featured.year}
                  </p>

                  <div className="mt-8 flex flex-wrap gap-3 justify-center lg:justify-start">
                    {/* Open flipbook fullscreen */}
                    <button
                      onClick={openFlipbook}
                      className="px-6 py-3 rounded-full bg-yellow-400 text-black font-semibold text-sm md:text-base shadow-lg hover:bg-yellow-300 transition"
                    >
                      {t.openMagazine}
                    </button>

                    {/* Backup PDF */}
                    <span className="px-5 py-3 rounded-full border border-white/10 text-gray-300 text-xs md:text-sm">
                      {t.pdfBackup}
                    </span>

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

                                  <div className="mt-4 flex flex-wrap gap-2">
                                    {/* Backup PDF download */}
                                    <a
                                      href={pdfSrc}
                                      download
                                      className="px-4 py-2 rounded-full border border-yellow-400/70 text-yellow-300 font-semibold text-xs md:text-sm hover:bg-yellow-400/10 transition"
                                    >
                                      {t.downloadPdf}
                                    </a>

                                    {/* Open flipbook fullscreen (same flipbook for now) */}
                                    <button
                                      onClick={openFlipbook}
                                      className="px-4 py-2 rounded-full border border-white/15 text-gray-200 font-semibold text-xs md:text-sm hover:border-white/30 transition"
                                    >
                                      {t.openMagazine}
                                    </button>
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
