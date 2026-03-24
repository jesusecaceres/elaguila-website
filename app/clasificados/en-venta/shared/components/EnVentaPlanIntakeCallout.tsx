"use client";

const FREE = {
  es: {
    title: "Plan Gratis — publicación básica",
    bullets: [
      "Hasta 3 fotos; sin video en este plan.",
      "Flujo corto para ventas ocasionales y particulares.",
      "Ideal cuando quieres publicar rápido sin extras.",
    ],
  },
  en: {
    title: "Free plan — basic listing",
    bullets: [
      "Up to 3 photos; no video on Free.",
      "Short flow for occasional, casual sales.",
      "Best when you want to post fast without extras.",
    ],
  },
} as const;

const PRO = {
  es: {
    title: "Plan Pro — anuncio premium",
    bullets: [
      "Hasta 12 fotos y 1 video corto para destacar el artículo.",
      "Presentación y contacto más sólidos para generar confianza.",
      "Mejor visibilidad y pulido del anuncio — sin perfil de tienda.",
    ],
  },
  en: {
    title: "Pro plan — premium listing",
    bullets: [
      "Up to 12 photos plus 1 short video to showcase the item.",
      "Stronger presentation and contact polish to build trust.",
      "Better listing visibility — not a store profile product.",
    ],
  },
} as const;

const STOREFRONT = {
  es: {
    title: "Storefront — perfil de vendedor (futuro)",
    bullets: [
      "Identidad de tienda, enlaces y profundidad de negocio.",
      "Para vendedores frecuentes y presencia tipo eBay/tienda.",
      "Producto separado del anuncio Pro; lanzamiento próximo.",
    ],
  },
  en: {
    title: "Storefront — seller profile (future)",
    bullets: [
      "Store identity, links, and deeper business fields.",
      "For frequent sellers and eBay-style presence.",
      "Separate from Pro listings; launching later.",
    ],
  },
} as const;

type Plan = "free" | "pro" | "storefront";

export default function EnVentaPlanIntakeCallout({ lang, plan }: { lang: "es" | "en"; plan: Plan }) {
  const pack = plan === "free" ? FREE[lang] : plan === "pro" ? PRO[lang] : STOREFRONT[lang];
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
