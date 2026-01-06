import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { categoryConfig, CategoryKey } from "./config/categoryConfig";
import CategoryTabs from "./components/CategoryTabs";
import FilterBar from "./components/FilterBar";
import ListingsGrid from "./components/ListingsGrid";
import { classifieds } from "@/app/data/classifieds";

type SearchParams = {
  category?: string;
  lang?: string;
};

function getCopy(lang: "es" | "en") {
  return lang === "es"
    ? {
        brandLine: "El Águila • Orgullo Latino Sin Fronteras",
        subtitle:
          "El marketplace latino #1 — SEO fuerte, confianza total y experiencia móvil impecable. Gratis nunca se bloquea; lo premium solo agrega ventajas.",
        jumpToListings: "Ver anuncios",
        howTitle: "Cómo funciona",
        howIntro:
          "Clasificados es servicio a la comunidad y motor de ingresos — sin esconder anuncios gratis. Lo premium aumenta visibilidad, herramientas y confianza.",
        pricingTitle: "Precios claros",
        pricingBullets: [
          "Boost: $9.99 (1 vez) o $14.99/mes — sube tu visibilidad; nunca baja a otros.",
          "Membresías (à la carte): para quienes publican seguido y quieren ahorro + herramientas.",
          "Regla de conversión: si lo que pagas al mes por publicar supera una membresía, la membresía te conviene.",
        ],
        freeVsPaidTitle: "¿Qué es gratis y qué se cobra?",
        freeVsPaidNote:
          "La logística exacta se afina, pero el principio es permanente: gratis siempre visible; cobrar solo agrega ventajas.",
        freeBoxTitle: "Gratis (siempre visible)",
        freeBoxBody:
          "Base comunitaria y vendedores privados según reglas del sistema — sin bloqueo, sin castigo, siempre buscable.",
        paidBoxTitle: "De pago (agrega ventajas)",
        paidBoxBody:
          "Boost, membresías, verificación, mejor colocación, más fotos, perfil de negocio, herramientas y soporte.",
        examplesTitle: "Ejemplos (para que tenga sentido)",
        examples: [
          {
            title: "Rentas (usuario frecuente)",
            body:
              "Si publicas varias rentas al mes que normalmente serían de pago, una membresía puede salir más barata y te evita pagos sueltos.",
          },
          {
            title: "Negocio (inventario / repost constante)",
            body:
              "Si tu comportamiento es de negocio, el sistema sugiere plan Business por orden, ahorro y credibilidad — nunca como castigo.",
          },
          {
            title: "Urgencia",
            body:
              "¿Necesitas vender o rentar rápido? Boost aumenta exposición (más arriba / más destacado) sin tapar a nadie.",
          },
        ],
        rulesTitle: "Reglas justas (resumen)",
        rulesBullets: [
          "Anuncios gratis nunca se bloquean ni se esconden.",
          "Ventaja para miembros = mejor colocación y presentación, no castigo al gratuito.",
          "Si el comportamiento parece de negocio, se sugiere cuenta Business por ahorro y limpieza.",
          "Contenido debe ser familiar, real, local y confiable (moderación activa).",
        ],
        ctaMembership: "Ver membresías y beneficios",
        ctaBoost: "Impulsar con Boost",
        footerHint:
          "Meta: ser el #1 marketplace latino — especialmente en San José. No dejamos espacio para que nadie nos supere.",
      }
    : {
        brandLine: "El Águila • Latino Pride Without Borders",
        subtitle:
          "The #1 Latino marketplace — strong SEO, total trust, and flawless mobile UX. Free is never blocked; premium only adds advantages.",
        jumpToListings: "View listings",
        howTitle: "How it works",
        howIntro:
          "Classifieds is community service + revenue engine — without hiding free listings. Premium adds visibility, tools, and trust.",
        pricingTitle: "Clear pricing",
        pricingBullets: [
          "Boost: $9.99 one-time or $14.99/month — raises visibility; never pushes others down unfairly.",
          "Memberships (à la carte): for frequent posters who want savings + tools.",
          "Conversion rule: if your monthly posting spend exceeds a membership, membership wins.",
        ],
        freeVsPaidTitle: "What’s free vs paid?",
        freeVsPaidNote:
          "We’ll finalize exact logistics, but the permanent principle stands: free is always visible; charging only adds advantages.",
        freeBoxTitle: "Free (always visible)",
        freeBoxBody:
          "Community baseline + private seller rules — never blocked, never penalized, always searchable.",
        paidBoxTitle: "Paid (adds advantages)",
        paidBoxBody:
          "Boost, memberships, verification, better placement, more photos, business profile, tools, and support.",
        examplesTitle: "Examples (so it makes sense)",
        examples: [
          {
            title: "Rentals (frequent poster)",
            body:
              "If you post multiple rentals per month that would normally be paid, a membership can be cheaper and removes fragmented payments.",
          },
          {
            title: "Business (inventory / repeated reposting)",
            body:
              "If behavior looks like a business, the system suggests a Business plan for cleanliness, savings, and credibility — never as a penalty.",
          },
          {
            title: "Urgency",
            body:
              "Need it sold or rented fast? Boost increases exposure (higher / highlighted) without hiding anyone.",
          },
        ],
        rulesTitle: "Fair rules (summary)",
        rulesBullets: [
          "Free listings are never blocked or hidden.",
          "Member advantage = better placement + presentation, not penalizing free users.",
          "If behavior looks like a business, we suggest a Business plan for savings and cleanliness.",
          "Content must be family-safe, real, local, and trustworthy (active moderation).",
        ],
        ctaMembership: "See memberships & benefits",
        ctaBoost: "Boost a listing",
        footerHint:
          "Goal: become the #1 Latino marketplace — especially in San José. No room for anyone to top us.",
      };
}

export default async function ClasificadosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const lang: "es" | "en" = params.lang === "en" ? "en" : "es";

  const requestedCategory = params.category;
  const safeCategory: CategoryKey =
    requestedCategory && requestedCategory in categoryConfig
      ? (requestedCategory as CategoryKey)
      : "servicios";

  const title = categoryConfig[safeCategory].label[lang];
  const t = getCopy(lang);

  /**
   * IMPORTANT:
   * - classifieds.category is a STRING (by design)
   * - We safely compare strings here
   * - No forced casts, no data changes
   */
  const listings = classifieds.filter((item) => item.category === safeCategory);

  const langToggleHref =
    lang === "es"
      ? `/clasificados?category=${safeCategory}&lang=en`
      : `/clasificados?category=${safeCategory}&lang=es`;

  return (
    <main className="relative z-10 min-h-screen w-full bg-black text-white">
      {/* HERO — About page standard */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-[#7a5a12]/35 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.55)_55%,rgba(0,0,0,0.9)_100%)]" />

        <div className="relative mx-auto max-w-7xl px-6 pt-16 pb-10 md:pt-20 md:pb-14">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-white/70">
              <span className="font-semibold text-white/80">{t.brandLine}</span>
            </div>

            <Link
              href={langToggleHref}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/85 hover:bg-white/10"
            >
              {lang === "es" ? "EN" : "ES"}
            </Link>
          </div>

          <div className="mt-10 flex flex-col items-center text-center">
            <div className="relative h-20 w-20 md:h-24 md:w-24">
              <Image
                src="/logo.png"
                alt="El Águila"
                fill
                className="object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.65)]"
              />
            </div>

            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-[#FFD700] md:text-6xl">
              {title}
            </h1>

            <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/80 md:text-lg">
              {t.subtitle}
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
              <a
                href="#listings"
                className="rounded-full bg-gradient-to-r from-[#FFD700] via-[#FFC107] to-[#B8860B] px-6 py-3 text-sm font-semibold text-black shadow-[0_12px_30px_rgba(0,0,0,0.55)] hover:brightness-110"
              >
                {t.jumpToListings}
              </a>

              <Link
                href={lang === "es" ? "/clasificados/impulsar?lang=es" : "/clasificados/boost?lang=en"}
                className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white/90 hover:bg-white/10"
              >
                {lang === "es" ? "Boost" : "Boost"}
              </Link>

              <Link
                href={lang === "es" ? "/clasificados/membresias?lang=es" : "/clasificados/memberships?lang=en"}
                className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white/90 hover:bg-white/10"
              >
                {lang === "es" ? "Membresías" : "Memberships"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORY TABS (always visible) */}
      <section className="mt-8">
        <CategoryTabs />
      </section>

      {/* FILTER BAR (keep your awesome box) */}
      <section className="max-w-7xl mx-auto px-6 mt-6">
        <FilterBar category={safeCategory} lang={lang} />
      </section>

      {/* LISTINGS GRID */}
      <section id="listings" className="max-w-7xl mx-auto px-6 pb-20 mt-8">
        <Suspense>
          <ListingsGrid listings={listings} category={safeCategory} lang={lang} />
        </Suspense>
      </section>

      {/* HOW IT WORKS / PRICING / RULES (moved to bottom per your request) */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-semibold text-white/95">{t.howTitle}</h2>
          <p className="mt-2 max-w-4xl text-sm text-white/70">{t.howIntro}</p>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-base font-semibold text-white/90">{t.pricingTitle}</div>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-white/75">
                {t.pricingBullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-base font-semibold text-white/90">{t.freeVsPaidTitle}</div>
              <p className="mt-3 text-sm text-white/75">{t.freeVsPaidNote}</p>

              <div className="mt-4 grid gap-3">
                <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <div className="text-sm font-semibold text-white/90">{t.freeBoxTitle}</div>
                  <div className="mt-1 text-sm text-white/70">{t.freeBoxBody}</div>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <div className="text-sm font-semibold text-white/90">{t.paidBoxTitle}</div>
                  <div className="mt-1 text-sm text-white/70">{t.paidBoxBody}</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-base font-semibold text-white/90">{t.examplesTitle}</div>
              <div className="mt-3 space-y-3">
                {t.examples.map((ex) => (
                  <div key={ex.title} className="rounded-xl border border-white/10 bg-black/30 p-3">
                    <div className="text-sm font-semibold text-white/90">{ex.title}</div>
                    <div className="mt-1 text-sm text-white/70">{ex.body}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-5">
            <div className="font-semibold text-white/90">{t.rulesTitle}</div>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-white/75">
              {t.rulesBullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link
                href={lang === "es" ? "/clasificados/membresias?lang=es" : "/clasificados/memberships?lang=en"}
                className="rounded-full bg-gradient-to-r from-[#FFD700] via-[#FFC107] to-[#B8860B] px-6 py-3 text-sm font-semibold text-black hover:brightness-110"
              >
                {t.ctaMembership}
              </Link>

              <Link
                href={lang === "es" ? "/clasificados/impulsar?lang=es" : "/clasificados/boost?lang=en"}
                className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white/90 hover:bg-white/10"
              >
                {t.ctaBoost}
              </Link>
            </div>
          </div>

          <div className="mt-10 text-center text-sm text-white/55">{t.footerHint}</div>
        </div>
      </section>
    </main>
  );
}
