"use client";

const FREE = {
  es: {
    title: "Plan Gratis — publicación ligera",
    bullets: [
      "Hasta 3 fotos; sin video en este plan.",
      "Ideal para ventas rápidas y particulares.",
      "Presentación de vendedor más simple; menos campos de negocio.",
    ],
  },
  en: {
    title: "Free plan — lighter listing",
    bullets: [
      "Up to 3 photos; no video on Free.",
      "Great for quick, casual sales.",
      "Simpler seller presentation with fewer business fields.",
    ],
  },
} as const;

const PRO = {
  es: {
    title: "Plan Pro — vitrina más completa",
    bullets: [
      "Hasta 12 fotos y 1 video corto para destacar el artículo.",
      "Más datos de negocio, contacto y confianza para compradores serios.",
      "Mejor presencia tipo tienda sin convertirse en otro vertical.",
    ],
  },
  en: {
    title: "Pro plan — richer storefront",
    bullets: [
      "Up to 12 photos plus 1 short video to showcase the item.",
      "More business, contact, and trust signals for serious buyers.",
      "Stronger shop-style presence without leaving En Venta.",
    ],
  },
} as const;

type Plan = "free" | "pro";

export default function EnVentaPlanIntakeCallout({ lang, plan }: { lang: "es" | "en"; plan: Plan }) {
  const pack = plan === "free" ? FREE[lang] : PRO[lang];
  const box =
    plan === "free"
      ? "rounded-2xl border border-black/10 bg-white p-4 shadow-sm"
      : "rounded-2xl border border-[#C9B46A]/35 bg-[#1a1a1a] p-4 shadow-sm";

  const titleClass = plan === "free" ? "text-sm font-bold text-[#111111]" : "text-sm font-bold text-[#C9B46A]";
  const liClass = plan === "free" ? "text-xs text-[#111111]/75" : "text-xs text-white/70";

  return (
    <div className={box} role="note">
      <p className={titleClass}>{pack.title}</p>
      <ul className="mt-2 list-inside list-disc space-y-1.5">
        {pack.bullets.map((line) => (
          <li key={line} className={liClass}>
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}
