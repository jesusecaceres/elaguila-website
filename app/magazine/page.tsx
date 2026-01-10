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
  month: string;
  title: TitleMap;
};

type EditionsManifest = {
  featured: {
    year: string;
    month: string;
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
      <div className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-6 border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="text-sm md:text-base text-gray-200 font-semibold truncate">
          {title}
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-full border border-yellow-400/60 text-yellow-300 font-semibold text-sm hover:bg-yellow-400/10 transition"
        >
          Close
        </button>
      </div>

      <div className="absolute left-0 right-0 bottom-0 top-16">
        <iframe
          src={src}
          title={title}
          className="w-full h-full border-0"
          scrolling="no"
          allow="fullscreen"
          allowFullScreen
        />
      </div>
    </div>
  );
}

export default function MagazineHubPage() {
  const params = useSearchParams();
  const lang = (params.get("lang") || "es") as Lang;

  const FLIPBOOK_URL = "https://online.fliphtml5.com/LEONIXMedia/magazine/";

  const ui = useMemo(
    () => ({
      es: {
        title: "LEONIX Media — Revista",
        subtitle:
          "Revista de Comunidad, Cultura y Negocios. Una experiencia editorial premium.",
        featuredLabel: "Edición destacada",
        loading: "Cargando ediciones…",
        openMagazine: "Leer la revista",
        downloadPdf: "Descargar PDF",
        years: "Ediciones por año",
        modalTitle: "LEONIX — Flipbook",
      },
      en: {
        title: "LEONIX Media — Magazine",
        subtitle:
          "A premium editorial experience for Community, Culture, and Business.",
        featuredLabel: "Featured edition",
        loading: "Loading editions…",
        openMagazine: "Read magazine",
        downloadPdf: "Download PDF",
        years: "Editions by year",
        modalTitle: "LEONIX — Flipbook",
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
        const res = await fetch("/magazine/editions.json", { cache: "no-store" });
        if (!res.ok) throw new Error();
        const json = (await res.json()) as EditionsManifest;
        if (alive) setData(json);
      } catch {
        if (alive) setData(FALLBACK);
      } finally {
        if (alive) setStatus("ready");
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

  return (
    <div className="bg-black min-h-screen text-white pb-32">
      <Navbar />

      <FullscreenFlipbookModal
        open={flipOpen}
        onClose={closeFlipbook}
        src={FLIPBOOK_URL}
        title={t.modalTitle}
      />

      <section className="max-w-6xl mx-auto px-6 pt-28">
        <div className="text-center mb-16">
          <Image src={newLogo} alt="LEONIX" width={320} className="mx-auto mb-6" />
          <h1 className="text-5xl font-bold text-yellow-400">{t.title}</h1>
          <p className="mt-4 text-gray-300">{t.subtitle}</p>
        </div>

        {status === "ready" && (
          <div className="flex flex-col gap-16">
            <div className="border border-yellow-600/25 rounded-2xl p-8 bg-black/40">
              <div className="flex flex-col lg:flex-row gap-10">
                <img
                  src={featuredCoverSrc}
                  className="w-64 rounded-xl border border-yellow-400/40"
                />

                <div>
                  <h2 className="text-4xl font-bold text-yellow-400">
                    {featured.title[lang]}
                  </h2>
                  <p className="text-gray-300 mt-2">
                    {monthLabel(featured.month, lang)} {featured.year}
                  </p>

                  <div className="mt-6 flex gap-4 flex-wrap">
                    <button
                      onClick={openFlipbook}
                      className="px-6 py-3 rounded-full bg-yellow-400 text-black font-semibold"
                    >
                      {t.openMagazine}
                    </button>

                    <a
                      href={featuredPdfSrc}
                      download
                      className="px-6 py-3 rounded-full border border-yellow-400 text-yellow-300 font-semibold"
                    >
                      {t.downloadPdf}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
