"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { ServiciosUseMyLocationButton } from "../ServiciosUseMyLocationButton";
import { normalizeServiciosDiscoveryLocationInput } from "../lib/serviciosLocationNormalize";
import { readServiciosDiscoveryPrefs, writeServiciosDiscoveryPrefs } from "../lib/serviciosLocalPreferences";

/** Skilled local service / trades — human, trustworthy work (not retail, travel, or marketplace). */
const HERO_BACKDROP =
  "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=2400&q=82";

type Lang = "es" | "en";

const copy: Record<
  Lang,
  {
    sub: string;
    phService: string;
    phLocation: string;
    search: string;
    continuity: string;
  }
> = {
  es: {
    sub: "Busca profesionales de confianza para cualquier necesidad.",
    phService: "¿Qué servicio buscas?",
    phLocation: "Ciudad o Código Postal",
    search: "Buscar",
    continuity:
      "Lo que escribas aquí llega a Resultados con los mismos campos: podrás afinar giro, tipo de anunciante y contacto.",
  },
  en: {
    sub: "Trusted professionals for home, family, and business — clear profiles and direct contact.",
    phService: "What service are you looking for?",
    phLocation: "City or ZIP",
    search: "Search",
    continuity:
      "Your keywords and area carry into Results unchanged — then you can refine trade, seller type, and contact options.",
  },
};

const FORM_ID = "servicios-hero-search-form";

export function ServiciosHeroSearch({ lang }: { lang: Lang }) {
  const t = copy[lang];
  const resultsAction = "/clasificados/servicios/resultados";
  const qRef = useRef<HTMLInputElement>(null);
  const cityRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const p = readServiciosDiscoveryPrefs();
    if (qRef.current && !qRef.current.value && p.lastQ?.trim()) qRef.current.value = p.lastQ;
    if (cityRef.current && !cityRef.current.value && p.lastCity?.trim()) cityRef.current.value = p.lastCity;
  }, []);

  return (
    <div className="relative min-h-[min(42vh,480px)] overflow-hidden sm:min-h-[min(48vh,560px)] md:min-h-[min(52vh,620px)] lg:min-h-[min(54vh,680px)]">
      <div className="absolute inset-0">
        <Image
          src={HERO_BACKDROP}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_40%] opacity-[0.52] saturate-[0.85] sm:object-[center_36%] sm:opacity-[0.54] md:object-[center_34%] lg:opacity-[0.5]"
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-[#FBF7F0]/[0.93] via-[#F8F3EA]/[0.84] to-[#F1E9DE]/[0.95]"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#E8EDF4]/[0.42] via-transparent to-[#F4E8D8]/[0.32]"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_85%_65%_at_50%_8%,rgba(255,255,255,0.52),transparent_56%)]"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_100%,rgba(20,42,66,0.12),transparent_50%)]"
          aria-hidden
        />
      </div>

      <div className="relative z-10 flex min-h-[inherit] flex-col justify-center px-4 py-10 sm:px-8 sm:py-12 md:px-10 md:py-14 lg:px-14 lg:py-16">
        <div className="mx-auto w-full max-w-[min(100%,880px)] text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#3d5a73]/75 sm:text-[11px] sm:tracking-[0.22em]">
            {lang === "en" ? "Services · Leonix" : "Servicios · Leonix"}
          </p>
          <h1 className="mt-2 text-balance font-serif text-[clamp(1.7rem,3.8vw+0.85rem,3.75rem)] font-bold leading-[1.08] tracking-tight text-[#142a42] sm:mt-2.5">
            {lang === "en" ? (
              <>
                Find local services <span className="text-[#C2410C]">near you</span>
              </>
            ) : (
              <>
                Encuentra servicios locales <span className="text-[#C2410C]">cerca de ti</span>
              </>
            )}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-pretty text-[15px] leading-relaxed text-[#3d4f62] sm:mt-4 sm:text-lg md:mt-5 md:text-xl">
            {t.sub}
          </p>
        </div>

        <form
          id={FORM_ID}
          action={resultsAction}
          method="get"
          role="search"
          aria-describedby="servicios-search-hint"
          className="mx-auto mt-8 w-full max-w-[min(100%,920px)] sm:mt-10 md:mt-12"
          onSubmit={() => {
            const q = qRef.current?.value?.trim() ?? "";
            const cityRaw = cityRef.current?.value?.trim() ?? "";
            const cityNorm = normalizeServiciosDiscoveryLocationInput(cityRaw);
            if (cityRef.current && cityNorm !== cityRaw) cityRef.current.value = cityNorm;
            writeServiciosDiscoveryPrefs({
              lastQ: q || undefined,
              lastCity: cityNorm || undefined,
            });
          }}
        >
          <p id="servicios-search-hint" className="sr-only">
            {lang === "en"
              ? "Submits your keywords and location to the Servicios results page where you can refine filters."
              : "Envía tu búsqueda y ubicación a la página de resultados de Servicios, donde podrás afinar filtros."}
          </p>
          <input type="hidden" name="lang" value={lang} />
          <div className="flex flex-col gap-0 overflow-hidden rounded-2xl border border-white/90 bg-white/[0.96] shadow-[0_16px_48px_-26px_rgba(25,45,70,0.26),inset_0_1px_0_rgba(255,255,255,0.96)] backdrop-blur-md md:flex-row md:items-stretch md:rounded-full">
            <label className="flex min-h-[58px] min-w-0 flex-1 cursor-text items-center gap-3 border-b border-[#E5DED4]/90 px-4 sm:min-h-[60px] md:border-b-0 md:border-r md:pl-7 md:pr-4">
              <span className="shrink-0 text-[#3d5a73]" aria-hidden>
                <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3-3" strokeLinecap="round" />
                </svg>
              </span>
              <input
                ref={qRef}
                name="q"
                type="search"
                autoComplete="off"
                placeholder={t.phService}
                className="min-w-0 flex-1 bg-transparent py-3.5 text-[16px] text-[#142a42] outline-none placeholder:text-[#6b7c8c] sm:text-[15px]"
              />
            </label>
            <label className="flex min-h-[58px] min-w-0 flex-1 cursor-text items-center gap-3 px-4 sm:min-h-[60px] md:px-4">
              <span className="shrink-0 text-[#3d5a73]" aria-hidden>
                <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path
                    d="M12 21s-6-4.35-6-10a6 6 0 1112 0c0 5.65-6 10-6 10z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="11" r="2.5" />
                </svg>
              </span>
              <input
                ref={cityRef}
                name="city"
                type="text"
                autoComplete="address-level2"
                placeholder={t.phLocation}
                className="min-w-0 flex-1 bg-transparent py-3.5 text-[16px] text-[#142a42] outline-none placeholder:text-[#6b7c8c] sm:text-[15px]"
              />
            </label>
            <div className="flex shrink-0 p-2.5 md:p-2 md:pr-3 md:pl-0">
              <button
                type="submit"
                className="flex min-h-[52px] w-full min-w-0 items-center justify-center rounded-[16px] bg-gradient-to-br from-[#EA580C] to-[#C2410C] px-7 text-[16px] font-bold tracking-wide text-white shadow-[0_12px_32px_-10px_rgba(194,65,12,0.55)] transition hover:brightness-[1.04] active:scale-[0.99] md:w-auto md:min-w-[132px] md:rounded-full md:text-[15px]"
              >
                {t.search}
              </button>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 px-1 sm:px-0">
            <ServiciosUseMyLocationButton lang={lang} formId={FORM_ID} />
          </div>
        </form>
        <p className="mx-auto mt-5 max-w-[min(100%,640px)] px-1 text-center text-[12px] leading-relaxed text-[#5a6b7c] sm:mt-6 sm:text-[13px]">
          {t.continuity}
        </p>
        <p className="mx-auto mt-2 max-w-[min(100%,640px)] px-1 text-center text-[11px] leading-relaxed text-[#64748b]">
          {lang === "en" ? (
            <>
              Optional last search/area can be saved only on this device — see{" "}
              <Link href={`/legal?lang=${lang}`} className="font-semibold text-[#3B66AD] underline-offset-2 hover:underline">
                privacy &amp; cookies
              </Link>
              .
            </>
          ) : (
            <>
              La última búsqueda o zona puede guardarse solo en este dispositivo — ver{" "}
              <Link href={`/legal?lang=${lang}`} className="font-semibold text-[#3B66AD] underline-offset-2 hover:underline">
                privacidad y cookies
              </Link>
              .
            </>
          )}
        </p>
      </div>
    </div>
  );
}
