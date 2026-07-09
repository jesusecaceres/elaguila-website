import Image from "next/image";
import Link from "next/link";

export type LeonixLaunchCouponVariant = "public" | "dashboard" | "compact" | "mini" | "badge";

type Lang = "es" | "en";

/**
 * Single source of truth for all Launch 25 UI (LAUNCH-25-COUPON-DESIGN-SYSTEM-UNIFICATION-01).
 * Every Launch 25 placement — newsletter full card, dashboard/login/profile, eligible form
 * reminders (mini/compact), and eligible selector pills (badge) — renders from this component
 * so the campaign uses one design and one copy source. No image generation; uses /logo-clean.png.
 * No placement/ranking/verification claims. Excludes print/combo/free/renewals in fine print.
 */

const COPY = {
  es: {
    badge: "25% DE DESCUENTO",
    codeLabel: "LEONIX LAUNCH CODE",
    titlePublic: "Obtén tu código Leonix Launch 25",
    titleDashboard: "Beneficio de lanzamiento",
    mainPublic: "Recibe 25% de descuento en tu primer anuncio o paquete web elegible.",
    mainDashboard: "Obtén 25% de descuento en tu primer anuncio o paquete web elegible.",
    cta: "Obtener mi código",
    finePrintFull:
      "Válido solo para productos web elegibles en checkout. No aplica a paquetes impresos, combos de revista, publicaciones gratis ni renovaciones futuras. El código no garantiza ubicación, ranking ni verificación.",
    finePrintShort: "Válido solo para productos web elegibles en checkout.",
    eligibleBadge: "ACEPTA CÓDIGO LEONIX LAUNCH 25",
  },
  en: {
    badge: "25% OFF",
    codeLabel: "LEONIX LAUNCH CODE",
    titlePublic: "Get your Leonix Launch 25 code",
    titleDashboard: "Launch benefit",
    mainPublic: "Get 25% off your first eligible website ad or package.",
    mainDashboard: "Get 25% off your first eligible website ad or package.",
    cta: "Get my code",
    finePrintFull:
      "Valid only for eligible website checkout products. Not valid for printed magazine packages, magazine combo deals, free posts, or future renewals. The code does not guarantee placement, ranking, or verification.",
    finePrintShort: "Valid only for eligible website checkout products.",
    eligibleBadge: "LAUNCH 25 CODE ELIGIBLE",
  },
} as const;

export type LeonixLaunchCouponCardProps = {
  lang: Lang;
  variant?: LeonixLaunchCouponVariant;
  href?: string;
  ctaLabel?: string;
  className?: string;
  /** Hide CTA when the signup form is already on the same page (e.g. /newsletter). */
  showCta?: boolean;
  /** Fine print detail. Defaults per variant (full for public/dashboard/compact, short for mini). */
  finePrintMode?: "full" | "short" | "none";
  /** Show the official logo tile. Defaults on for public/dashboard/compact/mini. */
  showLogo?: boolean;
};

export function LeonixLaunchCouponCard({
  lang,
  variant = "public",
  href,
  ctaLabel,
  className = "",
  showCta = true,
  finePrintMode,
  showLogo,
}: LeonixLaunchCouponCardProps) {
  const t = COPY[lang];

  // Badge variant — a small official campaign pill for eligible selector cards.
  // Rendered as a span so it can live inside <Link> selector cards.
  if (variant === "badge") {
    return (
      <span
        className={[
          "inline-flex items-center gap-1.5 rounded-full border border-[#C9A84A]/70 bg-gradient-to-br from-[#FFF6E2] to-[#F3E6D2] px-2.5 py-1 shadow-[0_2px_8px_-4px_rgba(122,30,44,0.25)]",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <span className="inline-flex items-center rounded-full bg-[#7A1E2C] px-1.5 py-0.5 text-[9px] font-black tracking-wide text-white">
          25%
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wide text-[#7A1E2C]">
          {t.eligibleBadge}
        </span>
      </span>
    );
  }

  const isCompact = variant === "compact";
  const isMini = variant === "mini";
  const isDashboard = variant === "dashboard";
  const isSmall = isCompact || isMini;

  const title = isDashboard ? t.titleDashboard : t.titlePublic;
  const main = isDashboard ? t.mainDashboard : t.mainPublic;
  const cta = ctaLabel ?? t.cta;

  const resolvedFinePrintMode = finePrintMode ?? (isMini ? "short" : "full");
  const finePrint = resolvedFinePrintMode === "short" ? t.finePrintShort : t.finePrintFull;
  const resolvedShowLogo = showLogo ?? true;

  const shellClass = [
    "relative overflow-hidden rounded-2xl border-2 border-[#C9A84A]/70 bg-gradient-to-br from-[#FFFCF7] via-[#FBF7EF] to-[#F3E6D2] shadow-[0_12px_40px_-16px_rgba(122,30,44,0.18)]",
    isMini ? "p-3.5" : isCompact ? "p-4" : "p-5 sm:p-6",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const ctaClass =
    "inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-gradient-to-br from-[#7A1E2C] to-[#5e1721] px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:brightness-110 sm:w-auto";

  const logoSize = isMini ? "h-12 w-12" : isCompact ? "h-14 w-14" : "h-16 w-16 sm:h-20 sm:w-20";

  return (
    <div className={shellClass}>
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#C9A84A]/15 blur-2xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-8 -left-4 h-28 w-28 rounded-full bg-[#7A1E2C]/8 blur-2xl" aria-hidden />

      <div className={`flex ${isSmall ? "gap-3" : "gap-4 sm:gap-5"}`}>
        {resolvedShowLogo ? (
          <div className="shrink-0">
            <div
              className={`relative overflow-hidden rounded-xl border border-[#C9A84A]/40 bg-white/90 shadow-sm ${logoSize}`}
            >
              <Image
                src="/logo-clean.png"
                alt="Leonix Media"
                fill
                className="object-contain p-1.5"
                sizes={isMini ? "48px" : isCompact ? "56px" : "80px"}
              />
            </div>
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[#7A1E2C]/25 bg-[#7A1E2C]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#7A1E2C]">
              {t.badge}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[#8A6B1F]">
              {t.codeLabel}
            </span>
          </div>

          <h2
            className={`mt-2 font-bold leading-snug text-[#1E1810] ${
              isSmall ? "text-base" : "text-lg sm:text-xl"
            }`}
          >
            {title}
          </h2>
          <p className={`mt-1.5 leading-relaxed text-[#3D3428] ${isSmall ? "text-xs" : "text-sm"}`}>
            {main}
          </p>

          {showCta && href ? (
            <div className={isMini ? "mt-2.5" : "mt-4"}>
              <Link href={href} className={ctaClass}>
                {cta}
              </Link>
            </div>
          ) : null}

          {resolvedFinePrintMode !== "none" ? (
            <p className={`mt-3 leading-relaxed text-[#7A7164] ${isSmall ? "text-[10px]" : "text-[11px]"}`}>
              {finePrint}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
