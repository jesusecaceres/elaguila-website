import Link from "next/link";
import type { Lang, TiendaProductFamily } from "../types/tienda";
import { withLang } from "../utils/tiendaRouting";

/**
 * Promo / catalog products — request & quote path only (no self-serve customizer).
 */
export function TiendaPromoCatalogPanel(props: { lang: Lang; product: TiendaProductFamily }) {
  const { lang, product } = props;
  const title = lang === "en" ? product.title.en : product.title.es;
  const longDesc = lang === "en" ? product.longDescription.en : product.longDescription.es;
  const contactHref = withLang(`/contacto`, lang);

  return (
    <section className="mt-10 rounded-2xl border border-[rgba(201,168,74,0.35)] bg-[linear-gradient(145deg,rgba(201,168,74,0.12),rgba(0,0,0,0.35))] p-6 sm:p-8 space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[rgba(201,168,74,0.2)] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[rgba(201,168,74,0.95)]">
          {lang === "en" ? "Catalog · request flow" : "Catálogo · flujo por solicitud"}
        </span>
        <span className="rounded-full border border-[rgba(255,255,255,0.12)] px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[rgba(255,247,226,0.75)]">
          {lang === "en" ? "No live personalization" : "Sin personalización en línea"}
        </span>
      </div>
      <h2 className="text-xl sm:text-2xl font-semibold text-[rgba(255,247,226,0.96)]">
        {lang === "en" ? `Request: ${title}` : `Solicitar: ${title}`}
      </h2>
      <p className="text-sm text-[rgba(255,255,255,0.72)] leading-relaxed  max-w-prose">{longDesc}</p>
      <ul className="space-y-2 text-sm text-[rgba(255,247,226,0.85)]">
        {(lang === "en"
          ? [
              "Leonix sources from trusted promo vendors — you get options, not a fake template editor.",
              "Share quantity, timeline, budget, and logo/format — we reply with a tailored proposal.",
              "Production follows your approved mockup; complex decoration stays with our team.",
            ]
          : [
              "Leonix cotiza con proveedores promo de confianza — opciones reales, no un editor falso.",
              "Indica cantidad, tiempo, presupuesto y logo/archivo — respondemos con propuesta a medida.",
              "La producción sigue tu mockup aprobado; lo complejo lo coordina nuestro equipo.",
            ]
        ).map((line) => (
          <li key={line} className="flex gap-2">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[rgba(201,168,74,0.85)]" aria-hidden />
            <span>{line}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Link
          href={contactHref}
          className="inline-flex items-center justify-center rounded-full bg-[color:var(--lx-gold)] px-6 py-3 text-sm font-semibold text-[color:var(--lx-text)] hover:brightness-95 transition shadow-[0_12px_34px_rgba(201,168,74,0.25)]"
        >
          {lang === "en" ? "Request this product" : "Solicitar este producto"}
        </Link>
        <p className="text-xs text-[rgba(255,255,255,0.55)] sm:self-center max-w-md">
          {lang === "en"
            ? `Mention “${title}” in your message so we route the quote quickly.`
            : `Menciona “${title}” en tu mensaje para dirigir la cotización.`}
        </p>
      </div>
    </section>
  );
}
