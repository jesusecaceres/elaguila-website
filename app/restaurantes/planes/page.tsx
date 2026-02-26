"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import PageHero from "../../components/PageHero";

type PlanKey = "lite" | "premium";

function getCopy(lang: string) {
  const isEs = lang === "es";
  return {
    heroTitleEn: "Restaurant Plans",
    heroTitleEs: "Planes para Restaurantes",
    subtitle: isEs
      ? "Elige un plan para destacar tu negocio y cerrar más clientes."
      : "Choose a plan to stand out and close more customers.",
    lite: {
      name: isEs ? "Business Lite" : "Business Lite",
      price: isEs ? "$89/mes" : "$89/mo",
      bullets: isEs
        ? [
            "Insignia de negocio",
            "Mejor visibilidad que perfiles personales",
            "Perfil básico (teléfono, ubicación, horarios)",
            "Fotos y categoría",
          ]
        : [
            "Business badge",
            "Higher visibility than personal profiles",
            "Basic profile (phone, location, hours)",
            "Photos and category",
          ],
    },
    premium: {
      name: isEs ? "Business Premium" : "Business Premium",
      price: isEs ? "$149/mes" : "$149/mo",
      bullets: isEs
        ? [
            "Todo lo de Lite",
            "Prioridad de visibilidad",
            "Perfil mejorado (botones de contacto)",
            "Herramientas de conversión (llamar, mensaje, reservar)",
          ]
        : [
            "Everything in Lite",
            "Priority visibility",
            "Enhanced profile (contact buttons)",
            "Conversion tools (call, message, book)",
          ],
    },
    ctaPrimary: isEs ? "Activar plan" : "Activate plan",
    ctaSecondary: isEs ? "Publicar mi restaurante" : "Publish my restaurant",
    backToRestaurants: isEs ? "Volver a Restaurantes" : "Back to Restaurants",
  };
}

function buildMailto(plan: PlanKey, lang: string) {
  const isEs = lang === "es";
  const subject = encodeURIComponent(
    isEs ? "Activar plan de Restaurantes" : "Activate Restaurant Plan"
  );

  const planLabel = plan === "premium" ? "Business Premium" : "Business Lite";

  const bodyLines = isEs
    ? [
        "Hola LEONIX,",
        "",
        `Quiero activar: ${planLabel}`,
        "",
        "Nombre del negocio:",
        "Ciudad:",
        "Teléfono:",
        "Enlace/Redes (opcional):",
        "",
        "Gracias.",
      ]
    : [
        "Hi LEONIX,",
        "",
        `I want to activate: ${planLabel}`,
        "",
        "Business name:",
        "City:",
        "Phone:",
        "Link/Social (optional):",
        "",
        "Thanks.",
      ];

  const body = encodeURIComponent(bodyLines.join("\n"));
  return `mailto:ventas@leonixmedia.com?subject=${subject}&body=${body}`;
}

export default function RestaurantPlansPage() {
  const sp = useSearchParams();
  const lang = (sp?.get("lang") === "en") ? "en" : "es";

  const copy = useMemo(() => getCopy(lang), [lang]);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-6 pt-28 pb-16">
        <PageHero title={copy.heroTitleEn} titleEs={copy.heroTitleEs} />

        <p className="mt-6 text-center text-gray-300 max-w-2xl mx-auto">
          {copy.subtitle}
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {/* Lite */}
          <div className="rounded-2xl border border-yellow-600/20 bg-black/40 p-6">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-xl font-semibold text-yellow-400">
                {copy.lite.name}
              </h2>
              <div className="text-gray-200 font-medium">{copy.lite.price}</div>
            </div>
            <ul className="mt-4 space-y-2 text-gray-200">
              {copy.lite.bullets.map((b) => (
                <li key={b} className="flex gap-2">
                  <span className="text-yellow-400">•</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-col gap-3">
              <a
                href={buildMailto("lite", lang)}
                className="inline-flex items-center justify-center rounded-xl bg-yellow-500 px-4 py-3 font-semibold text-black hover:bg-yellow-400 transition"
              >
                {copy.ctaPrimary}
              </a>
              <Link
                href={`/restaurantes/negocio?lang=${lang}`}
                className="inline-flex items-center justify-center rounded-xl border border-yellow-600/30 bg-black/30 px-4 py-3 font-semibold text-yellow-300 hover:bg-black/50 transition"
              >
                {copy.ctaSecondary}
              </Link>
            </div>
          </div>

          {/* Premium */}
          <div className="rounded-2xl border border-yellow-600/30 bg-black/40 p-6">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-xl font-semibold text-yellow-400">
                {copy.premium.name}
              </h2>
              <div className="text-gray-200 font-medium">{copy.premium.price}</div>
            </div>
            <ul className="mt-4 space-y-2 text-gray-200">
              {copy.premium.bullets.map((b) => (
                <li key={b} className="flex gap-2">
                  <span className="text-yellow-400">•</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-col gap-3">
              <a
                href={buildMailto("premium", lang)}
                className="inline-flex items-center justify-center rounded-xl bg-yellow-500 px-4 py-3 font-semibold text-black hover:bg-yellow-400 transition"
              >
                {copy.ctaPrimary}
              </a>
              <Link
                href={`/restaurantes/negocio?lang=${lang}`}
                className="inline-flex items-center justify-center rounded-xl border border-yellow-600/30 bg-black/30 px-4 py-3 font-semibold text-yellow-300 hover:bg-black/50 transition"
              >
                {copy.ctaSecondary}
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 text-center">
          <Link
            href={`/restaurantes?lang=${lang}`}
            className="text-yellow-300 hover:text-yellow-200 underline underline-offset-4"
          >
            {copy.backToRestaurants}
          </Link>
        </div>
      </div>
    </main>
  );
}
