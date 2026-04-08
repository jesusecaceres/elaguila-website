"use client";

import Image from "next/image";
import type { PublicMagazineManifest } from "@/app/lib/magazine/magazineManifestTypes";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useCallback } from "react";
import newLogo from "../../../public/logo.png";

type Lang = "es" | "en";

const FALLBACK: PublicMagazineManifest = {
  source: "file",
  featured: {
    year: "2026",
    month: "february",
    title: {
      es: "Edición Digital — Febrero 2026",
      en: "Digital Edition — February 2026",
    },
    coverUrl: null,
    pdfUrl: null,
    flipbookUrl: null,
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
          coverUrl: null,
          pdfUrl: null,
          flipbookUrl: null,
        },
        {
          month: "january",
          title: {
            es: "Enero 2026 — Claridad",
            en: "January 2026 — Clarity",
          },
          coverUrl: null,
          pdfUrl: null,
          flipbookUrl: null,
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
  const params = useSearchParams()!;
  const lang = (params.get("lang") || "es") as Lang;

  const DEFAULT_FLIPBOOK = "https://online.fliphtml5.com/LEONIXMedia/magazine/";

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
  const [data, setData] = useState<PublicMagazineManifest>(FALLBACK);
  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const [flipOpen, setFlipOpen] = useState(false);
  const [flipSrc, setFlipSrc] = useState(DEFAULT_FLIPBOOK);

  const openFlipbook = useCallback(
    (url?: string | null) => {
      setFlipSrc((url && url.trim()) || DEFAULT_FLIPBOOK);
      setFlipOpen(true);
    },
    [DEFAULT_FLIPBOOK]
  );
  const closeFlipbook = useCallback(() => setFlipOpen(false), []);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch("/api/magazine/manifest", { cache: "no-store" });
        if (!res.ok) throw new Error();
        const json = (await res.json()) as PublicMagazineManifest;
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
  const featuredCoverSrc =
    (featured.coverUrl && featured.coverUrl.trim()) || `/magazine/${featured.year}/${featured.month}/cover.png`;
  const featuredPdfSrc =
    (featured.pdfUrl && featured.pdfUrl.trim()) || `/magazine/${featured.year}/${featured.month}/magazine.pdf`;

  // Years sorted newest → oldest (string years like "2026")
  const yearsSorted = useMemo(() => {
    return Object.keys(data.years || {}).sort((a, b) => Number(b) - Number(a));
  }, [data.years]);

  const isFeatured = (year: string, month: string) =>
    year === featured.year && month === featured.month;

  return (
    <div
      className="min-h-screen pb-32 text-[color:var(--lx-text)]"
      style={{
        backgroundColor: "var(--lx-page)",
        backgroundImage: `
          radial-gradient(ellipse 120% 80% at 50% -20%, rgba(201, 180, 106, 0.22), transparent 55%),
          radial-gradient(ellipse 55% 40% at 100% 30%, rgba(255, 255, 255, 0.55), transparent 52%),
          radial-gradient(ellipse 45% 35% at 0% 75%, rgba(201, 164, 74, 0.10), transparent 50%)
        `,
      }}
    >

      <FullscreenFlipbookModal open={flipOpen} onClose={closeFlipbook} src={flipSrc} title={t.modalTitle} />

      <section className="max-w-6xl mx-auto px-6 pt-28">
        <div className="text-center mb-16">
          <Image src={newLogo} alt="LEONIX" width={320} className="mx-auto mb-6" />
          <h1 className="text-5xl font-bold text-[color:var(--lx-text)]">{t.title}</h1>
          <p className="mt-4 text-[color:var(--lx-text-2)]/85">{t.subtitle}</p>
        </div>

        {status !== "ready" ? (
          <div className="text-[color:var(--lx-muted)]">{t.loading}</div>
        ) : (
          <div className="flex flex-col gap-16">
            {/* Featured */}
            <div className="border border-[color:var(--lx-nav-border)] rounded-2xl p-8 bg-[color:var(--lx-card)] shadow-[0_18px_48px_rgba(42,36,22,0.10)]">
              <div className="text-sm uppercase tracking-widest text-[color:var(--lx-muted)] mb-4">
                {t.featuredLabel}
              </div>

              <div className="flex flex-col lg:flex-row gap-10">
                <img
                  src={featuredCoverSrc}
                  className="w-64 rounded-xl border border-[color:var(--lx-nav-border)] bg-white"
                  alt={`${featured.title[lang]} cover`}
                />

                <div className="flex-1">
                  <h2 className="text-4xl font-bold text-[color:var(--lx-text)]">
                    {featured.title[lang]}
                  </h2>
                  <p className="text-[color:var(--lx-muted)] mt-2">
                    {monthLabel(featured.month, lang)} {featured.year}
                  </p>

                  {/* Buttons (NO "PDF (respaldo)" anywhere) */}
                  <div className="mt-6 flex gap-4 flex-wrap">
                    <button
                      type="button"
                      onClick={() => openFlipbook(featured.flipbookUrl)}
                      className="px-6 py-3 rounded-full bg-[color:var(--lx-cta-dark)] text-[color:var(--lx-cta-light)] font-semibold hover:bg-[color:var(--lx-cta-dark-hover)] transition"
                    >
                      {t.openMagazine}
                    </button>

                    <a
                      href={featuredPdfSrc}
                      download
                      className="px-6 py-3 rounded-full border border-[color:var(--lx-nav-border)] bg-white/70 text-[color:var(--lx-text)] font-semibold hover:bg-white transition"
                    >
                      {t.downloadPdf}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Previous Editions */}
            <div className="border border-[color:var(--lx-nav-border)] rounded-2xl p-8 bg-[color:var(--lx-card)]/70 backdrop-blur-sm shadow-[0_18px_48px_rgba(42,36,22,0.08)]">
              <h3 className="text-3xl font-bold text-[color:var(--lx-text)] mb-8">
                {t.years}
              </h3>

              <div className="flex flex-col gap-12">
                {yearsSorted.map((year) => {
                  const months = data.years?.[year]?.months || [];
                  return (
                    <div key={year}>
                      <div className="text-xl font-semibold text-[color:var(--lx-text)] mb-6">
                        {year}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {months
                          .filter((m) => !isFeatured(year, m.month))
                          .map((m) => {
                            const coverSrc =
                              (m.coverUrl && m.coverUrl.trim()) || `/magazine/${year}/${m.month}/cover.png`;
                            const pdfSrc =
                              (m.pdfUrl && m.pdfUrl.trim()) || `/magazine/${year}/${m.month}/magazine.pdf`;
                            const issueFlip = m.flipbookUrl;

                            return (
                              <div
                                key={`${year}-${m.month}`}
                                className="border border-[color:var(--lx-nav-border)] rounded-2xl p-6 bg-[color:var(--lx-card)] shadow-[0_14px_34px_rgba(42,36,22,0.10)]"
                              >
                                <img
                                  src={coverSrc}
                                  className="w-full max-w-[280px] mx-auto rounded-xl border border-[color:var(--lx-nav-border)] bg-white"
                                  alt={`${m.title[lang]} cover`}
                                />

                                <div className="mt-6">
                                  <div className="text-2xl font-bold text-[color:var(--lx-text)]">
                                    {monthLabel(m.month, lang)} {year}
                                  </div>
                                  <div className="text-[color:var(--lx-text-2)]/85 mt-1">
                                    {m.title[lang]}
                                  </div>

                                  {/* Buttons: Read (fullscreen flipbook) + Download PDF */}
                                  <div className="mt-6 flex gap-4 flex-wrap">
                                    <button
                                      type="button"
                                      onClick={() => openFlipbook(issueFlip)}
                                      className="px-6 py-3 rounded-full bg-[color:var(--lx-cta-dark)] text-[color:var(--lx-cta-light)] font-semibold hover:bg-[color:var(--lx-cta-dark-hover)] transition"
                                    >
                                      {t.openMagazine}
                                    </button>

                                    <a
                                      href={pdfSrc}
                                      download
                                      className="px-6 py-3 rounded-full border border-[color:var(--lx-nav-border)] bg-white/70 text-[color:var(--lx-text)] font-semibold hover:bg-white transition"
                                    >
                                      {t.downloadPdf}
                                    </a>
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
