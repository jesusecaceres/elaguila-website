import Link from "next/link";
import type { Lang, TiendaProductFamily } from "../types/tienda";
import { TIENDA_GLOBAL_FALLBACK_IMAGE } from "../data/tiendaVisualAssets";
import { tiendaPublicContactPath, withLang } from "../utils/tiendaRouting";
import { TiendaRemoteFillImage } from "./TiendaRemoteFillImage";

export type TiendaCatalogShowcaseTone = "promo" | "marketing";

/**
 * Quote-first / showroom products — strong visuals + office-led coordination.
 */
export function TiendaPromoCatalogPanel(props: {
  lang: Lang;
  product: TiendaProductFamily;
  coverImageUrl: string;
  /** Literal SVG / backup when primary remote fails */
  coverFallbackUrl?: string;
  tone?: TiendaCatalogShowcaseTone;
  secondaryCta?: { href: string; label: { es: string; en: string } } | null;
}) {
  const { lang, product, coverImageUrl, coverFallbackUrl, tone = "promo", secondaryCta } = props;
  const title = lang === "en" ? product.title.en : product.title.es;
  const longDesc = lang === "en" ? product.longDescription.en : product.longDescription.es;
  const contactHref = withLang(tiendaPublicContactPath(), lang);

  const isMarketing = tone === "marketing";

  const badgePrimary =
    lang === "en"
      ? isMarketing
        ? "Marketing catalog"
        : "Promo catalog"
      : isMarketing
        ? "Catálogo marketing"
        : "Catálogo promo";

  const badgeSecondary =
    lang === "en" ? "Quote & coordination" : "Cotización y coordinación";

  const bullets =
    lang === "en"
      ? isMarketing
        ? [
            "Leonix produces mailers, postcards, and campaign pieces with the same quality bar as your flyers and brochures.",
            "Share quantity, timeline, and files — call or visit the office first for fastest answers; email works as backup.",
            "Production follows your approved proof; multi-piece campaigns stay coordinated with our team.",
          ]
        : [
            "Leonix sources from trusted promo vendors — you get real options, not a fake template editor.",
            "Share quantity, timeline, budget, and logo format — call or visit the office first; email is secondary.",
            "Production follows your approved mockup; specialty decoration stays with our team.",
          ]
      : isMarketing
        ? [
            "Leonix produce postales, mailers y piezas de campaña con la misma calidad que tus volantes y brochures.",
            "Indica cantidad, tiempo y archivos — llama o visita la oficina primero para respuesta rápida; el correo es respaldo.",
            "La producción sigue tu prueba aprobada; campañas multi‑pieza las coordinamos con el equipo.",
          ]
        : [
            "Leonix cotiza con proveedores promo de confianza — opciones reales, no un editor de plantilla falso.",
            "Indica cantidad, tiempo, presupuesto y formato de logo — primero teléfono u oficina; el correo es secundario.",
            "La producción sigue tu mockup aprobado; lo complejo lo coordina nuestro equipo.",
          ];

  const lead =
    lang === "en"
      ? isMarketing
        ? "Built for teams that need consistent marketing print — online tools where it helps, Leonix when it matters."
        : "Built for branded merch and giveaways — Leonix can source it, quote it, and produce it with vendor-backed quality."
      : isMarketing
        ? "Para equipos que necesitan impresión de marketing coherente — herramientas en línea cuando ayudan, Leonix cuando importa."
        : "Para merch y regalos de marca — Leonix lo surte, lo cotiza y lo produce con calidad respaldada por proveedor.";

  return (
    <section className="mt-10 overflow-hidden rounded-2xl border border-[rgba(201,168,74,0.4)] bg-[linear-gradient(145deg,rgba(201,168,74,0.14),rgba(40,32,24,0.55),rgba(0,0,0,0.55))] shadow-[0_24px_80px_rgba(201,168,74,0.12)]">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(260px,400px)]">
        <div className="relative min-h-[220px] border-b border-[rgba(255,255,255,0.08)] lg:min-h-[300px] lg:border-b-0 lg:border-r">
          <TiendaRemoteFillImage
            primarySrc={coverImageUrl}
            fallbackSrc={coverFallbackUrl ?? TIENDA_GLOBAL_FALLBACK_IMAGE}
            alt={lang === "en" ? `${title} — catalog showcase` : `${title} — vitrina de catálogo`}
            className="object-cover object-center"
            sizes="(max-width: 1024px) 100vw, 400px"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/18 to-[rgba(201,168,74,0.08)] lg:bg-gradient-to-r" />
          <div className="absolute bottom-4 left-4 right-4 lg:hidden">
            <p className="text-sm font-medium text-white/95 drop-shadow-md">{lead}</p>
          </div>
        </div>
        <div className="space-y-5 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[rgba(201,168,74,0.2)] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[rgba(201,168,74,0.95)]">
              {badgePrimary}
            </span>
            <span className="rounded-full border border-[rgba(255,255,255,0.12)] px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[rgba(255,247,226,0.75)]">
              {badgeSecondary}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-[rgba(255,247,226,0.96)]">
            {lang === "en" ? `${title} — Leonix can deliver this` : `${title} — Leonix puede surtirlo`}
          </h2>
          <p className="hidden text-sm text-[rgba(255,247,226,0.78)] leading-relaxed lg:block">{lead}</p>
          <p className="text-sm text-[rgba(255,255,255,0.72)] leading-relaxed max-w-prose">{longDesc}</p>
          <ul className="space-y-2 text-sm text-[rgba(255,247,226,0.88)]">
            {bullets.map((line) => (
              <li key={line} className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[rgba(201,168,74,0.85)]" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap">
            <Link
              href={contactHref}
              className="inline-flex items-center justify-center rounded-full bg-[color:var(--lx-gold)] px-6 py-3 text-sm font-semibold text-[color:var(--lx-text)] hover:brightness-95 transition shadow-[0_12px_34px_rgba(201,168,74,0.25)]"
            >
              {lang === "en" ? "Call or visit — request a quote" : "Llama o visita — solicitar cotización"}
            </Link>
            {secondaryCta ? (
              <Link
                href={withLang(secondaryCta.href, lang)}
                className="inline-flex items-center justify-center rounded-full border border-[rgba(255,255,255,0.22)] bg-[rgba(255,255,255,0.06)] px-6 py-3 text-sm font-semibold text-[rgba(255,247,226,0.92)] hover:bg-[rgba(255,255,255,0.10)] transition"
              >
                {lang === "en" ? secondaryCta.label.en : secondaryCta.label.es}
              </Link>
            ) : null}
            <p className="text-xs text-[rgba(255,255,255,0.55)] sm:self-center max-w-md">
              {lang === "en"
                ? `Mention “${title}” when you reach out so we route your request quickly.`
                : `Menciona “${title}” al contactarnos para dirigir tu solicitud.`}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
