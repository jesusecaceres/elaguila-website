"use client";

/**
 * TODAY-2 — durable QR destination for the Business Tools / DIY Concierge campaign. Reuses the
 * existing magazine QR gateway routing pattern (stable path + lang + tracking params) rather than
 * a parallel QR system. Renders a truthful "coming soon" state until the approved V2 experience
 * is wired to this route — never a broken destination, never fake QR analytics.
 */
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const COPY = {
  en: {
    eyebrow: "Leonix Business Concierge",
    title: "Business Tools — coming to this QR code soon",
    body: "This QR destination is reserved for the full Business Tools / DIY Concierge experience. It isn't active yet — nothing here is broken, and no data is collected from this scan beyond what's already public.",
    exploreNow: "Explore what's available today",
    homeCta: "Learning Center (free, public)",
    ideaCta: "Idea Builder",
  },
  es: {
    eyebrow: "Leonix Business Concierge",
    title: "Herramientas de negocio — próximamente en este código QR",
    body: "Este destino de QR está reservado para la experiencia completa de Herramientas de negocio / Concierge DIY. Todavía no está activo — nada aquí está roto, y no se recopilan datos de este escaneo más allá de lo que ya es público.",
    exploreNow: "Explora lo que ya está disponible",
    homeCta: "Centro de aprendizaje (gratuito y público)",
    ideaCta: "Constructor de ideas",
  },
} as const;

function BusinessToolsQrDestinationInner() {
  const searchParams = useSearchParams();
  const lang: "en" | "es" = searchParams?.get("lang") === "en" ? "en" : "es";
  const t = COPY[lang];

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-lg flex-col items-center justify-center px-4 py-12 text-center sm:px-6">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#556B3E]">{t.eyebrow}</p>
      <h1 className="mt-3 font-serif text-2xl font-bold leading-snug text-[#2A4536] sm:text-3xl">{t.title}</h1>
      <p className="mt-4 text-sm leading-relaxed text-[#3D3428] sm:text-base">{t.body}</p>

      <div className="mt-8 w-full rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7]/95 p-5 shadow-[0_12px_40px_-14px_rgba(42,36,22,0.12)]">
        <p className="text-sm font-semibold text-[#1E1810]">{t.exploreNow}</p>
        <div className="mt-4 flex flex-col gap-3">
          <Link
            href={`/aprender?lang=${lang}`}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#E8DFD0] bg-white px-5 text-sm font-semibold text-[#2C2416] shadow-sm hover:bg-[#FAF7F2]"
          >
            {t.homeCta}
          </Link>
          <Link
            href={`/dashboard/business-tools/idea-builder?lang=${lang}`}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A] px-5 text-sm font-semibold text-[#1E1810] shadow-md hover:brightness-[1.03]"
          >
            {t.ideaCta}
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function BusinessToolsQrDestinationPage() {
  return (
    <Suspense fallback={null}>
      <BusinessToolsQrDestinationInner />
    </Suspense>
  );
}
