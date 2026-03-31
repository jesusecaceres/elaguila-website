"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { buildEnVentaResultsUrl } from "./shared/constants/enVentaResultsRoutes";
import type { EnVentaDepartmentKey } from "./taxonomy/categories";
import { EN_VENTA_DEPARTMENTS } from "./taxonomy/categories";
import newLogo from "../../../public/logo.png";

/** Emoji panels per department — visuals only; labels/hints come from taxonomy. */
const DEPT_VISUAL: Record<EnVentaDepartmentKey, { icon: string; panel: string }> = {
  electronicos: { icon: "📱", panel: "📲" },
  hogar: { icon: "🏠", panel: "🪴" },
  muebles: { icon: "🛋️", panel: "✨" },
  "ropa-accesorios": { icon: "👕", panel: "👜" },
  "bebes-ninos": { icon: "🧸", panel: "🍼" },
  "vehiculos-partes": { icon: "🚗", panel: "🔧" },
  deportes: { icon: "⚽", panel: "🚴" },
  herramientas: { icon: "🔧", panel: "⚙️" },
  "juguetes-juegos": { icon: "🎲", panel: "📦" },
  coleccionables: { icon: "✨", panel: "🏺" },
  "musica-foto-video": { icon: "🎸", panel: "📷" },
  otros: { icon: "📌", panel: "✨" },
};

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function EnVentaHubPage() {
  const sp = useSearchParams();
  const lang = sp?.get("lang") === "en" ? "en" : "es";

  const t = {
    es: {
      hero: "En Venta",
      sub: "Compra y vende artículos locales con claridad y confianza.",
      searchPh: "Buscar en En Venta…",
      search: "Buscar",
      publish: "Publicar artículo",
      lista: "Ver todos los anuncios",
      trust: "Comunidad Leonix · anuncios moderados · contacto directo",
    },
    en: {
      hero: "For Sale",
      sub: "Buy and sell local items with clarity and trust.",
      searchPh: "Search For Sale…",
      search: "Search",
      publish: "Post an item",
      lista: "Browse all listings",
      trust: "Leonix community · moderated listings · direct contact",
    },
  }[lang];

  const publishHref = `/clasificados/publicar/en-venta?lang=${lang}`;
  const allListingsHref = buildEnVentaResultsUrl(lang);

  /** Same order and copy as `CategorySelectionSection` / publish flow (`EN_VENTA_DEPARTMENTS`). */
  const departments = EN_VENTA_DEPARTMENTS;

  return (
    <div
      className="relative min-h-screen text-[#2C2416]"
      style={{
        backgroundColor: "#F3EBDD",
        backgroundImage: `
          radial-gradient(ellipse 120% 80% at 50% -20%, rgba(201, 180, 106, 0.2), transparent 55%),
          radial-gradient(ellipse 55% 40% at 100% 30%, rgba(255, 255, 255, 0.45), transparent 52%),
          radial-gradient(ellipse 45% 35% at 0% 75%, rgba(201, 164, 74, 0.1), transparent 50%)
        `,
      }}
    >
      {/* subtle paper grain */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />

      <main className="relative mx-auto max-w-6xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="flex flex-col items-center text-center">
          <div className="mb-8 flex justify-center">
            <Image
              src={newLogo}
              alt="Leonix"
              width={200}
              height={200}
              priority
              className="h-auto w-[min(200px,52vw)] drop-shadow-[0_8px_32px_rgba(42,36,22,0.12)]"
            />
          </div>

          <h1 className="text-[2.35rem] font-bold tracking-tight text-[#1E1810] sm:text-5xl md:text-[3.25rem]">
            {t.hero}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-[#3D3428]/90 sm:text-lg">{t.sub}</p>

          {/* Search — pill bar, icon left, dark CTA inside right */}
          <form
            className="mt-10 w-full max-w-2xl"
            action="/clasificados/en-venta/results"
            method="get"
            role="search"
          >
            <input type="hidden" name="lang" value={lang} />
            <div
              className={cx(
                "flex items-center gap-2 rounded-full border border-[#E8DFD0] bg-white/90 pl-4 pr-2 py-2 shadow-[0_12px_40px_-12px_rgba(42,36,22,0.15),inset_0_1px_0_rgba(255,255,255,0.85)]",
                "backdrop-blur-sm transition focus-within:border-[#C9B46A]/50 focus-within:shadow-[0_16px_48px_-12px_rgba(201,180,106,0.35)]"
              )}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center text-[#5C5346]/80" aria-hidden>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3-3" strokeLinecap="round" />
                </svg>
              </span>
              <input
                name="q"
                type="search"
                autoComplete="off"
                placeholder={t.searchPh}
                className="min-w-0 flex-1 bg-transparent py-2 text-[15px] text-[#1E1810] placeholder:text-[#8A8070] outline-none"
              />
              <button
                type="submit"
                className="shrink-0 rounded-full bg-[#2A2620] px-5 py-2.5 text-sm font-semibold text-[#FAF7F2] shadow-md transition hover:bg-[#1a1814] active:scale-[0.98]"
              >
                {t.search}
              </button>
            </div>
          </form>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center sm:gap-5">
            <Link
              href={publishHref}
              className={cx(
                "inline-flex min-h-[52px] items-center justify-center rounded-2xl px-8 text-[15px] font-semibold text-[#1E1810]",
                "bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A]",
                "shadow-[0_8px_32px_-4px_rgba(201,164,74,0.55),0_0_0_1px_rgba(255,255,255,0.35)_inset]",
                "transition hover:brightness-[1.03] hover:shadow-[0_12px_40px_-4px_rgba(201,164,74,0.6)] active:scale-[0.99]"
              )}
            >
              {t.publish}
            </Link>
            <Link
              href={allListingsHref}
              className={cx(
                "inline-flex min-h-[52px] items-center justify-center rounded-2xl border border-white/70 bg-[#FFFCF7] px-8 text-[15px] font-semibold text-[#2C2416]",
                "shadow-[0_6px_24px_-6px_rgba(42,36,22,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]",
                "transition hover:bg-white hover:shadow-[0_10px_28px_-6px_rgba(42,36,22,0.14)] active:scale-[0.99]"
              )}
            >
              {t.lista}
            </Link>
          </div>
        </section>

        {/* Category grid */}
        <section className="mt-20">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-6">
            {departments.map((d) => {
              const href = buildEnVentaResultsUrl(lang, { evDept: d.key });
              const title = d.label[lang];
              const hint = d.browseHint[lang];
              const vis = DEPT_VISUAL[d.key];

              return (
                <Link
                  key={d.key}
                  href={href}
                  className={cx(
                    "group flex min-h-[132px] flex-row overflow-hidden rounded-3xl border border-white/60 bg-white/85 p-5 shadow-[0_10px_40px_-12px_rgba(42,36,22,0.12)]",
                    "transition duration-300 hover:-translate-y-0.5 hover:border-[#E8D9B8] hover:shadow-[0_20px_48px_-12px_rgba(201,180,106,0.22)]"
                  )}
                >
                  <div className="flex min-w-0 flex-1 flex-col items-start justify-center text-left">
                    <span className="text-2xl leading-none" aria-hidden>
                      {vis.icon}
                    </span>
                    <span className="mt-2 text-[17px] font-bold tracking-tight text-[#1E1810]">{title}</span>
                    <span className="mt-1 line-clamp-2 text-[13px] leading-snug text-[#5C5346]/90">{hint}</span>
                  </div>
                  <div
                    className={cx(
                      "relative ml-3 flex h-[100px] w-[100px] shrink-0 items-center justify-center rounded-2xl",
                      "bg-gradient-to-br from-[#FAF4EA] to-[#EDE4D4]",
                      "border border-[#E8DFD0]/80 shadow-inner"
                    )}
                    aria-hidden
                  >
                    <span className="text-4xl opacity-95 transition group-hover:scale-105">{vis.panel}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <p className="mt-20 text-center text-[13px] font-medium tracking-wide text-[#7A7164]">{t.trust}</p>
      </main>
    </div>
  );
}
