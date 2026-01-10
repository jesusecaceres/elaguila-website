"use client";

// app/magazine/2026/page.tsx
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../../components/Navbar";

type Lang = "es" | "en";

type EditionFromJson =
  | {
      year?: number;
      month?: string; // "january" | "february" | ...
      slug?: string; // optional, if you store slug separately
      title?: string;
      titleEs?: string;
      titleEn?: string;
      monthLabel?: string;
      monthLabelEs?: string;
      monthLabelEn?: string;
      coverSrc?: string;
      cover?: string;
      href?: string; // where to go when clicked
      readerHref?: string;
      pdfSrc?: string;
      pdf?: string;
      publishedAt?: string; // optional ISO date
    }
  | Record<string, any>;

type EditionsJson =
  | EditionFromJson[]
  | {
      editions?: EditionFromJson[];
      issues?: EditionFromJson[];
    };

const MONTH_ORDER: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

function normalizeMonth(m?: string) {
  if (!m) return "";
  return String(m).trim().toLowerCase();
}

function safeYear(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default function Editions2026Page() {
  const params = useSearchParams();
  const lang = (params.get("lang") || "es") as Lang;

  const copy = useMemo(() => {
    return {
      es: {
        kicker: "ARCHIVO DIGITAL",
        title: "Ediciones 2026",
        subtitle:
          "Explora todas las ediciones digitales de LEONIX Media para 2026. Haz clic en una portada para abrir la edición.",
        back: "← Volver al Hub de Revista",
        loading: "Cargando ediciones…",
        empty: "Aún no hay ediciones publicadas para 2026.",
        error: "No pudimos cargar las ediciones. Intenta de nuevo.",
      },
      en: {
        kicker: "DIGITAL ARCHIVE",
        title: "2026 Editions",
        subtitle:
          "Browse all LEONIX Media digital editions for 2026. Click any cover to open the issue.",
        back: "← Back to Magazine Hub",
        loading: "Loading editions…",
        empty: "No editions have been published for 2026 yet.",
        error: "We couldn’t load editions. Please try again.",
      },
    }[lang];
  }, [lang]);

  const [items, setItems] = useState<EditionFromJson[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "empty" | "error">(
    "idle"
  );

  useEffect(() => {
    let alive = true;

    async function load() {
      setStatus("loading");
      try {
        // IMPORTANT: editions.json lives in /public/magazine/editions.json
        const res = await fetch(`/magazine/editions.json`, { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to fetch editions.json: ${res.status}`);

        const data = (await res.json()) as EditionsJson;

        const list: EditionFromJson[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.editions)
          ? data.editions!
          : Array.isArray((data as any)?.issues)
          ? (data as any).issues
          : [];

        const filtered = list.filter((ed: any) => safeYear(ed?.year) === 2026);

        if (!alive) return;

        if (!filtered.length) {
          setItems([]);
          setStatus("empty");
          return;
        }

        setItems(filtered);
        setStatus("ready");
      } catch (e) {
        if (!alive) return;
        setItems([]);
        setStatus("error");
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  const sorted = useMemo(() => {
    const arr = [...items];

    arr.sort((a: any, b: any) => {
      const ma = normalizeMonth(a?.month || a?.slug || a?.monthLabel);
      const mb = normalizeMonth(b?.month || b?.slug || b?.monthLabel);

      const oa = MONTH_ORDER[ma] ?? 999;
      const ob = MONTH_ORDER[mb] ?? 999;

      if (oa !== ob) return oa - ob;

      // fallback: publishedAt if provided
      const da = a?.publishedAt ? Date.parse(a.publishedAt) : 0;
      const db = b?.publishedAt ? Date.parse(b.publishedAt) : 0;
      return da - db;
    });

    return arr;
  }, [items]);

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="px-6 md:px-10 pt-24 pb-20 max-w-6xl mx-auto">
        <div className="text-center">
          <div className="tracking-[0.35em] text-[11px] md:text-xs text-yellow-300/80">
            {copy.kicker}
          </div>

          <h1 className="mt-5 text-5xl md:text-7xl font-extrabold text-white drop-shadow-[0_0_25px_rgba(255,215,0,0.12)]">
            {copy.title}
          </h1>

          <p className="mt-6 text-base md:text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {copy.subtitle}
          </p>
        </div>

        {/* LIST */}
        <div className="mt-16">
          {status === "loading" && (
            <p className="text-center text-gray-300">{copy.loading}</p>
          )}

          {status === "error" && (
            <p className="text-center text-gray-300">{copy.error}</p>
          )}

          {status === "empty" && (
            <p className="text-center text-gray-300">{copy.empty}</p>
          )}

          {status === "ready" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 place-items-center">
              {sorted.map((ed: any, idx) => {
                const month = normalizeMonth(ed?.month || ed?.slug || ed?.monthLabel);

                const cover =
                  ed?.coverSrc || ed?.cover || `/magazine/2026/${month}/cover.png`;

                const defaultHref = month
                  ? `/magazine/2026/${month}/read`
                  : `/magazine`;

                const href = ed?.href || ed?.readerHref || defaultHref;

                const monthLabel =
                  (lang === "es" ? ed?.monthLabelEs : ed?.monthLabelEn) ||
                  ed?.monthLabel ||
                  (month ? month.charAt(0).toUpperCase() + month.slice(1) : "");

                const title =
                  (lang === "es" ? ed?.titleEs : ed?.titleEn) ||
                  ed?.title ||
                  `${monthLabel} 2026`;

                return (
                  <Link
                    key={`${month}-${idx}`}
                    href={`${href}?lang=${lang}`}
                    className="group w-full max-w-[320px]"
                  >
                    <div className="relative rounded-2xl overflow-hidden border border-yellow-600/25 bg-black/60 shadow-[0_0_35px_rgba(255,215,0,0.08)] transition-transform duration-300 group-hover:scale-[1.02]">
                      <div className="relative w-full aspect-[3/4]">
                        <Image
                          src={cover}
                          alt={title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 90vw, 320px"
                        />
                      </div>

                      <div className="p-6">
                        <div className="text-sm text-yellow-300/90 font-semibold">
                          {monthLabel} 2026
                        </div>
                        <div className="mt-2 text-base md:text-lg font-bold text-white leading-snug">
                          {title}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* BACK LINK */}
        <div className="mt-14 text-center">
          <Link
            href={`/magazine?lang=${lang}`}
            className="inline-flex items-center gap-2 text-sm md:text-base text-gray-300 hover:text-yellow-300"
          >
            {copy.back}
          </Link>
        </div>
      </section>
    </main>
  );
}
