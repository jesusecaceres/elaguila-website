"use client";

type Props = {
  lang: "es" | "en";
  isSupporter?: boolean;
};

export default function SpecialsCard({ lang, isSupporter }: Props) {
  const title = lang === "es" ? "Ofertas" : "Specials";
  const subtitle =
    lang === "es"
      ? "Promociones rápidas para ayudar a cerrar el trato."
      : "Fast offers designed to help close the deal.";

  const items = isSupporter
    ? [
        {
          k: "supporter-1",
          t: lang === "es" ? "10% de descuento hoy" : "10% off today",
          d:
            lang === "es"
              ? "Muestra esta página en el mostrador. Válido solo hoy."
              : "Show this page at the counter. Valid today only.",
        },
        {
          k: "supporter-2",
          t: lang === "es" ? "Bebida gratis con combo" : "Free drink with combo",
          d:
            lang === "es"
              ? "Disponible en horas seleccionadas. Pregunta al llegar."
              : "Available during select hours. Ask when you arrive.",
        },
      ]
    : [
        {
          k: "basic-1",
          t: lang === "es" ? "Oferta de bienvenida" : "Welcome offer",
          d:
            lang === "es"
              ? "Pregúntale al negocio por su oferta de primera visita."
              : "Ask the business about their first-visit offer.",
        },
      ];

  return (
    <section className="mt-6 bg-black/30 border border-yellow-600/20 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-yellow-200">{title}</h2>
          <p className="mt-1 text-sm text-gray-300">{subtitle}</p>
        </div>
        {isSupporter ? (
          <span className="text-xs px-2 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-300">
            {lang === "es" ? "Destacado" : "Featured"}
          </span>
        ) : null}
      </div>

      <ul className="mt-4 space-y-3">
        {items.map((it) => (
          <li key={it.k} className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="text-sm font-semibold text-gray-100">{it.t}</div>
            <div className="mt-1 text-sm text-gray-300">{it.d}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}
