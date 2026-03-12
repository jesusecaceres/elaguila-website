"use client";

type Lang = "es" | "en";

type Props = {
  lang?: Lang;
  onUpgrade?: () => void;
  onContinueFree?: () => void;
};

export default function ProPreviewCard({ lang = "es", onUpgrade, onContinueFree }: Props) {
  const t =
    lang === "es"
      ? {
          title: "Mejora tu anuncio con LEONIX Pro",
          benefits: [
            "⭐ Hasta 12 fotos",
            "🎥 Video sobresaliente",
            "🚀 2 impulsos de visibilidad",
            "📅 Duración del anuncio: 30 días",
            "📈 Los anuncios con video reciben hasta 3× más visibilidad",
          ],
          upgrade: "Mejora ahora — $9.99",
          continueFree: "Continuar con anuncio gratis",
        }
      : {
          title: "Upgrade your listing with LEONIX Pro",
          benefits: [
            "⭐ Up to 12 photos",
            "🎥 Featured video",
            "🚀 2 visibility boosts",
            "📅 Listing duration: 30 days",
            "📈 Listings with video get up to 3× more visibility",
          ],
          upgrade: "Upgrade now — $9.99",
          continueFree: "Continue with free listing",
        };

  return (
    <div className="rounded-xl border border-[#C9B46A]/55 bg-[#F5F5F5] p-6">
      <h3 className="text-lg font-bold text-[#111111]">{t.title}</h3>
      <ul className="mt-3 space-y-2 text-sm text-[#111111]">
        {t.benefits.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
      <div className="mt-5 flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={onUpgrade}
          className="rounded-xl bg-[#111111] text-[#F5F5F5] font-semibold px-5 py-3 hover:opacity-95 transition"
        >
          {t.upgrade}
        </button>
        <button
          type="button"
          onClick={onContinueFree}
          className="rounded-xl border border-[#C9B46A]/55 bg-[#F5F5F5] text-[#111111] font-semibold px-5 py-3 hover:bg-[#E8E8E8] transition"
        >
          {t.continueFree}
        </button>
      </div>
    </div>
  );
}
