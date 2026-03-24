"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import Navbar from "../../components/Navbar";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import newLogo from "../../../public/logo.png";
import { TravelTile } from "./components/TravelTile";
import { TRAVEL_LANDING_CATEGORY_PILLS, TRAVEL_QUICK_CHIPS } from "./shared/fields/travelTaxonomy";
import { buildTravelSectionHref, buildTravelTargetHref } from "./shared/utils/travelUrls";

type Lang = "es" | "en";

export default function TravelPage() {
  const sp = useSearchParams();
  const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";

  const baseHref = useMemo(() => buildTravelTargetHref(sp, lang), [sp, lang]);

  const t = useMemo(
    () =>
      lang === "en"
        ? {
            title: "Travel",
            subtitle:
              "Deals, agents, getaways and opportunities to explore more — with community trust.",
            trust:
              "Listings are moderated to reduce spam and suspicious offers. Always verify details before paying.",
            primary: "Browse Travel listings",
            secondary: "Post a Travel listing",
            sectionsTitle: "Explore Travel",
            noteTitle: "Good to know",
            noteBody:
              "If an offer looks too good to be true, it probably is. Prefer verified businesses and request clear details.",
            postHref: "/clasificados/publicar",
          }
        : {
            title: "Viajes",
            subtitle:
              "Ofertas, agentes, escapadas y oportunidades para descubrir más — con confianza comunitaria.",
            trust:
              "Los anuncios son moderados para reducir spam y ofertas sospechosas. Verifica detalles antes de pagar.",
            primary: "Ver anuncios de Viajes",
            secondary: "Publicar anuncio de Viajes",
            sectionsTitle: "Explorar Viajes",
            noteTitle: "Importante",
            noteBody:
              "Si una oferta parece demasiado buena para ser verdad, probablemente lo sea. Prefiere negocios verificados y pide detalles claros.",
            postHref: "/clasificados/publicar",
          },
    [lang]
  );

  const travelChips = TRAVEL_QUICK_CHIPS[lang];

  const postEntryHref = `/login?mode=post&lang=${lang}&redirect=${encodeURIComponent(`/clasificados/publicar?lang=${lang}&cat=travel`)}`;

  return (
    <main className="min-h-screen bg-[#D9D9D9] text-[#111111]">
      <Navbar />

      <div className="sticky top-14 z-30 border-b border-black/10 bg-[#D9D9D9]/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-2 px-4 py-2">
          <Link href={postEntryHref} className="rounded-full bg-[#111111] px-4 py-2 text-sm font-semibold text-[#F5F5F5] hover:opacity-95 transition">
            {t.secondary}
          </Link>
          <Link href={baseHref} className="rounded-full border border-[#C9B46A]/70 bg-[#F5F5F5] px-4 py-2 text-sm font-semibold text-[#111111] hover:bg-[#EFEFEF] transition">
            {t.primary}
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 pt-6 pb-4">
        <section className="rounded-2xl border border-[#111111]/10 bg-[#F5F5F5] px-4 py-3">
          <p className="text-xs font-semibold text-[#111111]/80">{lang === "en" ? "Browse by category" : "Explorar por categoría"}</p>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TRAVEL_LANDING_CATEGORY_PILLS.map(({ key, es, en }) => (
              <Link key={key} href={appendLangToPath(`/clasificados/${key}`, lang)} className="shrink-0 rounded-full border border-[#C9B46A]/40 bg-[#F8F6F0] px-3 py-1.5 text-xs font-medium text-[#111111] hover:bg-[#EFEFEF] transition">
                {lang === "es" ? es : en}
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-4 rounded-xl border border-[#C9B46A]/25 bg-[#F5F5F5] shadow-sm p-3 ring-1 ring-[#C9B46A]/10">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-stretch">
            <a href={baseHref} className="relative flex min-w-0 items-center rounded-lg border border-[#C9B46A]/30 bg-white py-2 pl-8 pr-3 text-sm text-[#111111]/70">
              <span className="pointer-events-none absolute left-2.5 text-[#111111]/50 text-sm" aria-hidden>⌕</span>
              {lang === "en" ? "Search: destination, deal, agent…" : "Buscar: destino, oferta, agente…"}
            </a>
            <Link href={baseHref} className="flex items-center rounded-lg border border-[#C9B46A]/30 bg-white px-3 py-2 text-sm text-[#111111]/80 hover:bg-[#EFEFEF] transition sm:w-36"><span className="truncate">{lang === "en" ? "City or ZIP" : "Ciudad o ZIP"}</span></Link>
          </div>
          <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {travelChips.map(({ label, t: tKey }) => (
              <Link
                key={label}
                href={tKey ? `${baseHref}&t=${tKey}` : baseHref}
                className="shrink-0 rounded-full border border-[#111111]/15 bg-white px-2.5 py-1.5 text-xs font-medium text-[#111111] hover:bg-[#EFEFEF] transition"
              >
                {label}
              </Link>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-[#111111]/70">{lang === "en" ? "Use the button below to see results with filters." : "Usa el botón para ver resultados con filtros."}</p>
        </section>
      </div>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0B0B0B] to-black" />
        <div className="absolute inset-0 opacity-50">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#F2EFE8] blur-3xl" />
          <div className="absolute -right-24 top-24 h-72 w-72 rounded-full bg-[#F2EFE8] blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-screen-2xl px-6 pt-28 pb-10 text-center">
          <div className="mx-auto w-fit">
            <Image
              src={newLogo}
              alt="LEONIX Media"
              priority
              className="h-16 w-auto md:h-20"
            />
          </div>

          <h1 className="mt-6 text-5xl font-extrabold tracking-tight text-yellow-400 md:text-6xl">
            {t.title}
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-base text-[#111111] md:text-lg">
            {t.subtitle}
          </p>

          <div className="mx-auto mt-6 max-w-4xl rounded-2xl border border-yellow-500/35 bg-black/35 px-5 py-4 text-left">
            <div className="text-sm font-semibold text-yellow-200">
              {lang === "en" ? "Trust" : "Confianza"}
            </div>
            <div className="mt-1 text-sm text-[#111111]">{t.trust}</div>
          </div>

          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <a
              href={baseHref}
              className="inline-flex items-center justify-center rounded-2xl border border-yellow-400/45 bg-[#F2EFE8] px-6 py-3 text-sm font-bold text-yellow-100 transition hover:bg-yellow-500/20"
            >
              {t.primary}
            </a>
            <a
              href={postEntryHref}
              className="inline-flex items-center justify-center rounded-2xl border border-black/10 bg-[#F5F5F5] px-6 py-3 text-sm font-bold text-[#111111] transition hover:bg-white/10"
            >
              {t.secondary}
            </a>
          </div>
        </div>
      </section>

      {/* SECTIONS */}
      <section className="mx-auto max-w-screen-2xl px-6 pb-16">
        <div className="mt-6 rounded-2xl border border-yellow-500/35 bg-black/30 p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <h2 className="text-2xl font-extrabold text-yellow-200 md:text-3xl">
              {t.sectionsTitle}
            </h2>
            <div className="text-sm text-[#111111]">
              {lang === "en"
                ? "Choose a lane — all routes open in the Travel listings engine."
                : "Elige una opción — todo abre dentro del buscador de Viajes."}
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <TravelTile
              title={lang === "en" ? "Packages & Deals" : "Paquetes y Ofertas"}
              desc={
                lang === "en"
                  ? "Featured offers, bundles, promos and seasonal deals."
                  : "Ofertas destacadas, paquetes, promociones y especiales de temporada."
              }
              href={buildTravelSectionHref(baseHref, "deals")}
              badge={lang === "en" ? "Offers" : "Ofertas"}
            />
            <TravelTile
              title={lang === "en" ? "Travel Agents" : "Agentes de Viajes"}
              desc={
                lang === "en"
                  ? "Book with professionals — appointments, planning and support."
                  : "Reserva con profesionales — citas, planificación y apoyo."
              }
              href={buildTravelSectionHref(baseHref, "agents")}
              badge={lang === "en" ? "Pro" : "Pro"}
            />
            <TravelTile
              title={lang === "en" ? "Resorts & Hotels" : "Resorts y Hoteles"}
              desc={
                lang === "en"
                  ? "Stay options for families, couples, and groups."
                  : "Opciones de hospedaje para familias, parejas y grupos."
              }
              href={buildTravelSectionHref(baseHref, "resorts")}
            />
            <TravelTile
              title={lang === "en" ? "Cruises" : "Cruceros"}
              desc={
                lang === "en"
                  ? "Departures, itineraries, and limited-time cruise promos."
                  : "Salidas, itinerarios y promociones por tiempo limitado."
              }
              href={buildTravelSectionHref(baseHref, "cruises")}
            />
            <TravelTile
              title={lang === "en" ? "Tours & Excursions" : "Tours y Excursiones"}
              desc={
                lang === "en"
                  ? "Local experiences, guided tours, and day trips."
                  : "Experiencias locales, tours guiados y excursiones de un día."
              }
              href={buildTravelSectionHref(baseHref, "tours")}
            />
            <TravelTile
              title={lang === "en" ? "Car Rentals" : "Renta de Autos"}
              desc={
                lang === "en"
                  ? "Partners and pricing soon — we’re opening this lane next."
                  : "Pronto: socios y precios — abrimos esta opción muy pronto."
              }
              href={buildTravelSectionHref(baseHref, "car-rentals")}
              comingSoon
            />
            <TravelTile
              title={lang === "en" ? "LEONIX Getaways" : "Escapadas LEONIX"}
              desc={
                lang === "en"
                  ? "Weekend escapes & short stays — curated, family-safe and trusted."
                  : "Escapadas de fin de semana y estancias cortas — curadas, familiares y confiables."
              }
              href={buildTravelSectionHref(baseHref, "escapadas")}
              comingSoon
            />
          </div>

          <div className="mt-6 rounded-2xl border border-black/10 bg-[#F5F5F5] p-5">
            <div className="text-sm font-bold text-[#111111]">{t.noteTitle}</div>
            <div className="mt-2 text-sm text-[#111111]">{t.noteBody}</div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href={baseHref}
              className="inline-flex flex-1 items-center justify-center rounded-2xl border border-yellow-400/45 bg-black/35 px-6 py-3 text-sm font-bold text-yellow-100 hover:bg-black/45"
            >
              {lang === "en" ? "Open Travel engine" : "Abrir buscador de Viajes"}
            </a>
            <a
              href="/clasificados"
              className="inline-flex flex-1 items-center justify-center rounded-2xl border border-black/10 bg-[#F5F5F5] px-6 py-3 text-sm font-bold text-[#111111] hover:bg-white/10"
            >
              {lang === "en" ? "Back to Classifieds" : "Volver a Clasificados"}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
