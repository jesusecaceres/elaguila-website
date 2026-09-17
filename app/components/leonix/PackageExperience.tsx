"use client";

/**
 * TODAY-2 — truthful package explanation component, shared between the DIY Concierge Home and
 * the homepage Business Tools section. Uses the locked commercial-model boundaries exactly:
 * Quarter Page never gets personalized tools; Half/Full share the same self-service foundation;
 * Premium adds only explicitly defined benefits; Concierge/managed-service are always paid,
 * requested-only human work — never included automatically in any advertising package.
 */

export type PackageExperienceLang = "es" | "en";

const COPY = {
  en: {
    eyebrow: "Business Tools",
    title: "One Leonix Business Concierge, built around your package",
    intro: "Knowledge is shared generously. Personalized human guidance is packaged. Execution is paid.",
    packages: [
      { name: "Public", price: null, points: ["Public Learning Center", "Idea Builder", "General checklists & templates"] },
      { name: "Quarter Page", price: "$499", points: ["Everything in Public", "Business Tools preview where applicable"] },
      { name: "Half Page", price: "$799", points: ["Personalized Business Profile", "Explainable Health Map", "Personalized DIY actions", "Progress tracking"] },
      { name: "Full Page", price: "$1,199", points: ["Same complete Business Tools as Half Page", "Additional advertising visibility & placement"] },
      { name: "Premium", price: null, points: ["Everything in Full Page", "Explicitly defined premium benefits only"] },
    ],
    paidTitle: "Paid, on request — never automatic",
    guideMe: "Guide Me — a paid Concierge request for human guidance on one specific action.",
    handleIt: "Let Leonix Handle It — a paid managed-service request for Leonix to do the work.",
    note: "No advertising package automatically includes human labor. Every paid request is created explicitly by you, with no scheduling, price, or outcome fabricated in advance.",
  },
  es: {
    eyebrow: "Herramientas de negocio",
    title: "Un solo Leonix Business Concierge, construido alrededor de tu paquete",
    intro: "El conocimiento se comparte con generosidad. La guía humana personalizada se empaqueta. La ejecución se paga.",
    packages: [
      { name: "Público", price: null, points: ["Centro de aprendizaje público", "Constructor de ideas", "Listas de verificación y plantillas generales"] },
      { name: "Quarter Page", price: "$499", points: ["Todo lo de Público", "Vista previa de herramientas de negocio donde aplique"] },
      { name: "Half Page", price: "$799", points: ["Perfil de negocio personalizado", "Mapa de salud explicable", "Acciones DIY personalizadas", "Seguimiento de progreso"] },
      { name: "Full Page", price: "$1,199", points: ["Las mismas herramientas de negocio completas que Half Page", "Visibilidad y colocación publicitaria adicional"] },
      { name: "Premium", price: null, points: ["Todo lo de Full Page", "Solo beneficios premium explícitamente definidos"] },
    ],
    paidTitle: "Pagado, a solicitud — nunca automático",
    guideMe: "Guíame — una solicitud pagada de Concierge para orientación humana sobre una acción específica.",
    handleIt: "Que Leonix lo haga — una solicitud pagada de servicio administrado para que Leonix haga el trabajo.",
    note: "Ningún paquete de publicidad incluye automáticamente mano de obra humana. Cada solicitud pagada la creas tú explícitamente, sin fabricar por adelantado horario, precio o resultado.",
  },
} as const;

export function PackageExperience({ lang }: { lang: PackageExperienceLang }) {
  const t = COPY[lang];
  return (
    <div className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6 shadow-[0_12px_40px_-14px_rgba(42,36,22,0.12)] sm:p-8">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#556B3E]">{t.eyebrow}</p>
      <h2 className="mt-2 font-serif text-xl font-bold leading-snug text-[#2A4536] sm:text-2xl">{t.title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#5C5346]">{t.intro}</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {t.packages.map((pkg) => (
          <div key={pkg.name} className="min-w-0 rounded-2xl border border-[#E8DFD0] bg-white p-4">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-bold text-[#1E1810]">{pkg.name}</p>
              {pkg.price ? <p className="text-sm font-semibold text-[#7A1E2C]">{pkg.price}</p> : null}
            </div>
            <ul className="mt-2 space-y-1 text-sm text-[#5C5346]">
              {pkg.points.map((p) => (
                <li key={p} className="break-words">
                  <span className="mr-1.5 inline-block h-1 w-1 rounded-full bg-[#C9A84A]" aria-hidden />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-[#C9B46A]/40 bg-gradient-to-br from-[#FFFCF7] to-[#F3EBDD]/80 p-4">
        <p className="text-sm font-bold text-[#1E1810]">{t.paidTitle}</p>
        <p className="mt-2 text-sm text-[#5C5346]">{t.guideMe}</p>
        <p className="mt-1 text-sm text-[#5C5346]">{t.handleIt}</p>
        <p className="mt-3 text-xs text-[#7A7164]">{t.note}</p>
      </div>
    </div>
  );
}
