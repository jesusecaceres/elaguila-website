"use client";

type Plan = "free" | "pro" | "storefront";

type Lang = "es" | "en";

const COPY: Record<
  Lang,
  {
    title: string;
    subtitle: string;
    freeTitle: string;
    freeSub: string;
    freeBullets: string[];
    proTitle: string;
    proBadge: string;
    proSub: string;
    proBullets: string[];
    featuredHelp: string;
    analyticsHelp: string;
  }
> = {
  es: {
    title: "Compara tus opciones",
    subtitle: "Publica rápido con Gratis o vende con más fuerza usando Pro.",
    freeTitle: "Gratis",
    freeSub: "Ideal para publicar rápido",
    freeBullets: ["3 fotos", "30 días en línea", "Publicación estándar", "Sin analíticas"],
    proTitle: "Pro",
    proBadge: "Más popular",
    proSub: "Ideal para vender más rápido",
    proBullets: [
      "12 fotos + 1 video",
      "30 días en línea",
      "7 días en Destacados",
      "Analíticas básicas",
      "Mejor presentación y confianza",
    ],
    featuredHelp:
      "Destacados: tu anuncio aparece con prioridad visual dentro de los resultados que sí coinciden con la búsqueda y los filtros del comprador.",
    analyticsHelp:
      "Analíticas básicas: podrás ver señales simples del rendimiento de tu anuncio, como vistas e interés del comprador.",
  },
  en: {
    title: "Compare your options",
    subtitle: "Post quickly with Free or sell with more momentum using Pro.",
    freeTitle: "Free",
    freeSub: "Best for posting quickly",
    freeBullets: ["3 photos", "30 days live", "Standard listing", "No analytics"],
    proTitle: "Pro",
    proBadge: "Most popular",
    proSub: "Best for selling faster",
    proBullets: [
      "12 photos + 1 video",
      "30 days live",
      "7 days in Featured",
      "Basic analytics",
      "Better presentation and trust",
    ],
    featuredHelp:
      "Featured: your listing gets stronger visual priority within results that already match the buyer’s search and filters.",
    analyticsHelp:
      "Basic analytics: you can view simple performance signals like listing views and buyer interest.",
  },
};

function helperTextFor(line: string, lang: Lang, copy: (typeof COPY)[Lang]) {
  if (lang === "es" && line.includes("Destacados")) return copy.featuredHelp;
  if (lang === "es" && line.includes("Analíticas básicas")) return copy.analyticsHelp;
  if (lang === "en" && line.includes("Featured")) return copy.featuredHelp;
  if (lang === "en" && line.includes("Basic analytics")) return copy.analyticsHelp;
  return null;
}

export default function EnVentaPlanIntakeCallout({ lang, plan }: { lang: Lang; plan: Plan }) {
  const copy = COPY[lang];
  const activePlan = plan === "storefront" ? "pro" : plan;

  return (
    <div
      className="rounded-2xl border border-[#D8C79A]/70 bg-[#FFFDF7] p-4 shadow-[0_8px_20px_rgba(113,84,22,0.08)] sm:p-5"
      role="note"
    >
      <p className="text-sm font-semibold text-[#6E4E18]">{copy.title}</p>
      <p className="mt-1 text-xs text-[#5D4A25]/85">{copy.subtitle}</p>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <section
          className={`rounded-xl border p-3 ${
            activePlan === "free" ? "border-[#B28A2F]/55 bg-[#FFF7E8]" : "border-[#E5D6B0] bg-[#FFFEFC]"
          }`}
        >
          <p className="text-sm font-bold text-[#3D2C12]">{copy.freeTitle}</p>
          <p className="mt-0.5 text-xs text-[#5D4A25]/80">{copy.freeSub}</p>
          <ul className="mt-2.5 space-y-1.5">
            {copy.freeBullets.map((line) => (
              <li key={line} className="flex items-start gap-1.5 text-xs text-[#3D2C12]/85">
                <span className="mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#B28A2F]/80" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </section>

        <section
          className={`rounded-xl border p-3 ${
            activePlan === "pro" ? "border-[#B28A2F]/65 bg-[#FFF4DD]" : "border-[#E5D6B0] bg-[#FFFEFC]"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-[#3D2C12]">{copy.proTitle}</p>
            <span className="rounded-full border border-[#B28A2F]/45 bg-[#B28A2F]/12 px-2 py-0.5 text-[10px] font-semibold text-[#7A591A]">
              {copy.proBadge}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-[#5D4A25]/80">{copy.proSub}</p>
          <ul className="mt-2.5 space-y-1.5">
            {copy.proBullets.map((line) => {
              const helper = helperTextFor(line, lang, copy);
              return (
                <li key={line} className="text-xs text-[#3D2C12]/85">
                  <div className="flex items-start gap-1.5">
                    <span className="mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#B28A2F]/80" />
                    <span>{line}</span>
                  </div>
                  {helper ? (
                    <p className="mt-1 ml-3.5 rounded-md border border-[#D9C99D]/60 bg-[#FFF9EB] px-2 py-1 text-[11px] leading-relaxed text-[#5D4A25]/80">
                      <span className="mr-1 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-[#B28A2F]/55 text-[9px] font-bold text-[#7A591A]">
                        i
                      </span>
                      {helper}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
