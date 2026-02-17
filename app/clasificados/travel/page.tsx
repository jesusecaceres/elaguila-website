"use client";

import Image from "next/image";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import Navbar from "../../components/Navbar";
import newLogo from "../../../public/logo.png";

type Lang = "es" | "en";

type SectionKey =
  | "deals"
  | "agents"
  | "resorts"
  | "cruises"
  | "tours"
  | "car-rentals"
  | "escapadas";

function buildTargetHref(sp: ReturnType<typeof useSearchParams>, lang: Lang) {
  const next = new URLSearchParams();

  // Preserve existing params (future-proof: location, radius, search, etc.)
  if (sp) {
    sp.forEach((value, key) => {
      if (typeof value === "string" && value.length > 0) next.set(key, value);
    });
  }

  next.set("lang", lang);
  next.set("cat", "travel");

  return `/clasificados/lista?${next.toString()}`;
}

function buildSectionHref(
  baseHref: string,
  section?: SectionKey,
  extra?: Record<string, string>
) {
  // baseHref already includes query string; we can safely extend it.
  const [path, qs] = baseHref.split("?");
  const next = new URLSearchParams(qs || "");

  if (section) next.set("t", section); // informational only; engine may ignore
  if (extra) {
    Object.entries(extra).forEach(([k, v]) => {
      if (v && v.trim().length > 0) next.set(k, v.trim());
    });
  }

  return `${path}?${next.toString()}`;
}

function Tile({
  title,
  desc,
  href,
  badge,
  comingSoon,
}: {
  title: string;
  desc: string;
  href: string;
  badge?: string;
  comingSoon?: boolean;
}) {
  return (
    <a
      href={href}
      className={`group relative overflow-hidden rounded-2xl border border-yellow-600/20 bg-black/35 p-5 text-left shadow-lg transition hover:bg-black/45 ${
        comingSoon ? "opacity-80" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="text-lg font-extrabold text-yellow-200">{title}</div>
            {badge ? (
              <span className="inline-flex items-center rounded-full border border-yellow-400/25 bg-yellow-500/10 px-2 py-0.5 text-[11px] font-semibold text-yellow-200">
                {badge}
              </span>
            ) : null}
            {comingSoon ? (
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-gray-200">
                Coming soon
              </span>
            ) : null}
          </div>
          <div className="mt-1 text-sm text-gray-300">{desc}</div>
        </div>
        <div className="mt-0.5 shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-gray-200 group-hover:bg-white/10">
          Ver
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100">
        <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-yellow-400/10 blur-3xl" />
      </div>
    </a>
  );
}

export default function TravelPage() {
  const sp = useSearchParams();
  const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";

  const baseHref = useMemo(() => buildTargetHref(sp, lang), [sp, lang]);

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

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0B0B0B] to-black" />
        <div className="absolute inset-0 opacity-50">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-yellow-500/10 blur-3xl" />
          <div className="absolute -right-24 top-24 h-72 w-72 rounded-full bg-yellow-400/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6 pt-28 pb-10 text-center">
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
          <p className="mx-auto mt-4 max-w-3xl text-base text-gray-300 md:text-lg">
            {t.subtitle}
          </p>

          <div className="mx-auto mt-6 max-w-4xl rounded-2xl border border-yellow-600/20 bg-black/35 px-5 py-4 text-left">
            <div className="text-sm font-semibold text-yellow-200">
              {lang === "en" ? "Trust" : "Confianza"}
            </div>
            <div className="mt-1 text-sm text-gray-300">{t.trust}</div>
          </div>

          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <a
              href={baseHref}
              className="inline-flex items-center justify-center rounded-2xl border border-yellow-400/30 bg-yellow-500/15 px-6 py-3 text-sm font-bold text-yellow-100 transition hover:bg-yellow-500/20"
            >
              {t.primary}
            </a>
            <a
              href={`${t.postHref}?lang=${lang}&cat=travel`}
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              {t.secondary}
            </a>
          </div>
        </div>
      </section>

      {/* SECTIONS */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="mt-6 rounded-2xl border border-yellow-600/20 bg-black/30 p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <h2 className="text-2xl font-extrabold text-yellow-200 md:text-3xl">
              {t.sectionsTitle}
            </h2>
            <div className="text-sm text-gray-400">
              {lang === "en"
                ? "Choose a lane — all routes open in the Travel listings engine."
                : "Elige una opción — todo abre dentro del buscador de Viajes."}
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Tile
              title={lang === "en" ? "Packages & Deals" : "Paquetes y Ofertas"}
              desc={
                lang === "en"
                  ? "Featured offers, bundles, promos and seasonal deals."
                  : "Ofertas destacadas, paquetes, promociones y especiales de temporada."
              }
              href={buildSectionHref(baseHref, "deals")}
              badge={lang === "en" ? "Offers" : "Ofertas"}
            />
            <Tile
              title={lang === "en" ? "Travel Agents" : "Agentes de Viajes"}
              desc={
                lang === "en"
                  ? "Book with professionals — appointments, planning and support."
                  : "Reserva con profesionales — citas, planificación y apoyo."
              }
              href={buildSectionHref(baseHref, "agents")}
              badge={lang === "en" ? "Pro" : "Pro"}
            />
            <Tile
              title={lang === "en" ? "Resorts & Hotels" : "Resorts y Hoteles"}
              desc={
                lang === "en"
                  ? "Stay options for families, couples, and groups."
                  : "Opciones de hospedaje para familias, parejas y grupos."
              }
              href={buildSectionHref(baseHref, "resorts")}
            />
            <Tile
              title={lang === "en" ? "Cruises" : "Cruceros"}
              desc={
                lang === "en"
                  ? "Departures, itineraries, and limited-time cruise promos."
                  : "Salidas, itinerarios y promociones por tiempo limitado."
              }
              href={buildSectionHref(baseHref, "cruises")}
            />
            <Tile
              title={lang === "en" ? "Tours & Excursions" : "Tours y Excursiones"}
              desc={
                lang === "en"
                  ? "Local experiences, guided tours, and day trips."
                  : "Experiencias locales, tours guiados y excursiones de un día."
              }
              href={buildSectionHref(baseHref, "tours")}
            />
            <Tile
              title={lang === "en" ? "Car Rentals" : "Renta de Autos"}
              desc={
                lang === "en"
                  ? "Partners and pricing soon — we’re opening this lane next."
                  : "Pronto: socios y precios — abrimos esta opción muy pronto."
              }
              href={buildSectionHref(baseHref, "car-rentals")}
              comingSoon
            />
            <Tile
              title={lang === "en" ? "LEONIX Getaways" : "Escapadas LEONIX"}
              desc={
                lang === "en"
                  ? "Weekend escapes & short stays — curated, family-safe and trusted."
                  : "Escapadas de fin de semana y estancias cortas — curadas, familiares y confiables."
              }
              href={buildSectionHref(baseHref, "escapadas")}
              comingSoon
            />
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm font-bold text-white">{t.noteTitle}</div>
            <div className="mt-2 text-sm text-gray-300">{t.noteBody}</div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href={baseHref}
              className="inline-flex flex-1 items-center justify-center rounded-2xl border border-yellow-400/30 bg-black/35 px-6 py-3 text-sm font-bold text-yellow-100 hover:bg-black/45"
            >
              {lang === "en" ? "Open Travel engine" : "Abrir buscador de Viajes"}
            </a>
            <a
              href="/clasificados"
              className="inline-flex flex-1 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-white hover:bg-white/10"
            >
              {lang === "en" ? "Back to Classifieds" : "Volver a Clasificados"}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
