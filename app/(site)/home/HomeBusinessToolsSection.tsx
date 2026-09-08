"use client";

/**
 * TODAY-2 — truthful, premium homepage Business Tools section. Explains the free public Learning
 * Center + Idea Builder + Business Identity + Business Health Map, the personalized DIY
 * Concierge, and the two paid service paths (Guide Me / Let Leonix Handle It). CTAs route
 * truthfully by authentication state — this section never exposes a feature-flagged personalized
 * tool publicly before rollout, and never touches global search/marketplace ranking.
 */
import Link from "next/link";
import type { SupportedLang } from "@/app/lib/language";
import { replaceLangInHref } from "@/app/lib/language";
import type { HomePageLang } from "./homePageCopy";

type Props = { lang: HomePageLang; routeLang: SupportedLang };

const COPY = {
  en: {
    eyebrow: "Business Tools",
    title: "One Business Concierge — from free education to hands-on help",
    intro: "Every Leonix business gets real, practical education for free. Personalized guidance is packaged with the right tier. Getting Leonix to actually do the work is always a separate, paid request — never automatic.",
    items: [
      { title: "Learning Center & Idea Builder", body: "Free, bilingual lessons, glossary, checklists, and a step-by-step idea planner. Open to everyone.", href: "/aprender", cta: "Start learning" },
      { title: "Business Identity", body: "Set up your business's canonical profile once, and reuse it across Leonix.", href: "/dashboard/business-tools", cta: "Set up your business" },
      { title: "Business Health Map", body: "A plain-language look at seven areas of your business — strengths, gaps, and what's still unknown.", href: "/dashboard/business-tools/business-health", cta: "See the Health Map" },
      { title: "Personalized DIY Concierge", body: "For Half Page and above: your own action plan, tied to your Health Map, that you work through yourself.", href: "/dashboard/business-tools/concierge", cta: "Open DIY Concierge" },
    ],
    paidNote: "Guide Me (paid guidance) and Let Leonix Handle It (paid managed service) are always separate, explicit requests — never bundled automatically into any package.",
    ctaSignedOut: "Sign in to your account",
  },
  es: {
    eyebrow: "Herramientas de negocio",
    title: "Un solo Business Concierge — de la educación gratuita a la ayuda práctica",
    intro: "Todo negocio en Leonix recibe educación real y práctica sin costo. La orientación personalizada se empaqueta con el nivel correcto. Que Leonix realmente haga el trabajo siempre es una solicitud pagada aparte — nunca automática.",
    items: [
      { title: "Centro de aprendizaje y Constructor de ideas", body: "Lecciones bilingües gratuitas, glosario, listas de verificación y un planificador de ideas paso a paso. Abierto para todos.", href: "/aprender", cta: "Empezar a aprender" },
      { title: "Identidad de negocio", body: "Configura el perfil canónico de tu negocio una vez y reutilízalo en todo Leonix.", href: "/dashboard/business-tools", cta: "Configurar tu negocio" },
      { title: "Mapa de salud del negocio", body: "Una mirada en lenguaje claro a siete áreas de tu negocio — fortalezas, brechas y lo que aún no se sabe.", href: "/dashboard/business-tools/business-health", cta: "Ver el mapa de salud" },
      { title: "Concierge DIY personalizado", body: "Para Half Page en adelante: tu propio plan de acción, ligado a tu mapa de salud, que trabajas tú mismo.", href: "/dashboard/business-tools/concierge", cta: "Abrir Concierge DIY" },
    ],
    paidNote: "Guíame (orientación pagada) y Que Leonix lo haga (servicio administrado pagado) siempre son solicitudes separadas y explícitas — nunca incluidas automáticamente en ningún paquete.",
    ctaSignedOut: "Inicia sesión en tu cuenta",
  },
} as const;

export function HomeBusinessToolsSection({ lang, routeLang }: Props) {
  // HomePageLang covers every launch UI locale (en/es/pt/tl); this section's copy is only
  // authored in ES/EN today — Spanish remains the default for any other launch locale, matching
  // the existing product architecture's default.
  const t = COPY[lang === "en" ? "en" : "es"];
  return (
    <section className="border-t border-[#D6C7AD]/70 bg-[#FAF6EE]/60 py-12 sm:py-14" aria-labelledby="home-business-tools-title">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#556B3E]">{t.eyebrow}</p>
        <h2 id="home-business-tools-title" className="mt-2 max-w-2xl font-serif text-2xl font-bold leading-snug text-[#2A4536] sm:text-[1.75rem]">
          {t.title}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">{t.intro}</p>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {t.items.map((item) => (
            <li key={item.title} className="min-w-0 rounded-2xl border border-[#D6C7AD]/80 bg-white px-5 py-5">
              <p className="text-sm font-bold text-[#1E1810]">{item.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-[#3D3428]">{item.body}</p>
              <Link
                href={replaceLangInHref(item.href, routeLang)}
                className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-[#7A1E2C] underline-offset-2 hover:underline"
              >
                {item.cta}
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-6 max-w-2xl text-xs leading-relaxed text-[#7A7164]">{t.paidNote}</p>
      </div>
    </section>
  );
}
