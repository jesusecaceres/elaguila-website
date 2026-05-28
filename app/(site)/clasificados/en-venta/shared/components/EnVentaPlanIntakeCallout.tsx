"use client";

type Plan = "free" | "pro" | "storefront";

type Lang = "es" | "en";

const COPY: Record<
  Lang,
  {
    title: string;
    subtitle: string;
    featureTitle: string;
    featureBadge: string;
    featureSub: string;
    featureBullets: string[];
    refreshHelp: string;
  }
> = {
  es: {
    title: "Anuncio incluido sin costo",
    subtitle: "Publica con fotos, video opcional y opciones de contacto. Sin pago. Sin comisión.",
    featureTitle: "Anuncio de Varios",
    featureBadge: "Incluido",
    featureSub: "La experiencia completa para vender mejor",
    featureBullets: [
      "Hasta 12 fotos",
      "1 video opcional",
      "30 días en línea",
      "Mejor presentación para compradores",
      "Refrescar anuncio para volver entre listados recientes",
    ],
    refreshHelp:
      "Refrescar anuncio: vuelve a subir tu anuncio entre los listados recientes (misma publicación, mismo ID Leonix).",
  },
  en: {
    title: "For Sale listing included at no cost",
    subtitle: "Post with photos, optional video, and contact options. No payment. No commission.",
    featureTitle: "For Sale listing",
    featureBadge: "Included",
    featureSub: "The full experience to sell with confidence",
    featureBullets: [
      "Up to 12 photos",
      "1 optional video",
      "30 days online",
      "Better presentation for buyers",
      "Refresh listing to return among recent listings",
    ],
    refreshHelp:
      "Refresh listing: moves your ad back among recent listings (same listing, same Leonix Ad ID).",
  },
};

export default function EnVentaPlanIntakeCallout({ lang, plan }: { lang: Lang; plan: Plan }) {
  const copy = COPY[lang];

  if (plan === "free") {
    return null;
  }

  return (
    <div
      className="rounded-2xl border border-[#D8C79A]/70 bg-[#FFFDF7] p-4 shadow-[0_8px_20px_rgba(113,84,22,0.08)] sm:p-5"
      role="note"
    >
      <p className="text-sm font-semibold text-[#6E4E18]">{copy.title}</p>
      <p className="mt-1 text-xs text-[#5D4A25]/85">{copy.subtitle}</p>

      <section className="mt-3 rounded-xl border border-[#B28A2F]/65 bg-[#FFF4DD] p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-[#3D2C12]">{copy.featureTitle}</p>
          <span className="rounded-full border border-[#B28A2F]/45 bg-[#B28A2F]/12 px-2 py-0.5 text-[10px] font-semibold text-[#7A591A]">
            {copy.featureBadge}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-[#5D4A25]/80">{copy.featureSub}</p>
        <ul className="mt-2.5 space-y-1.5">
          {copy.featureBullets.map((line) => (
            <li key={line} className="text-xs text-[#3D2C12]/85">
              <div className="flex items-start gap-1.5">
                <span className="mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#B28A2F]/80" />
                <span>{line}</span>
              </div>
              {line.includes("Refrescar") || line.includes("Refresh") ? (
                <p className="mt-1 ml-3.5 rounded-md border border-[#D9C99D]/60 bg-[#FFF9EB] px-2 py-1 text-[11px] leading-relaxed text-[#5D4A25]/80">
                  {copy.refreshHelp}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
