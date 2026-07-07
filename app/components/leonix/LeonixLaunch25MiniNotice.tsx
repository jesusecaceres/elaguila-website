import Link from "next/link";

/**
 * Compact Launch 25 reminder for eligible paid website checkout surfaces.
 * Gate LAUNCH-25-ELIGIBLE-CHECKOUT-UX-POLISH-01
 *
 * UX only. No discount math, no validation. The applied code is entered and
 * validated later at the real promo field / checkout. Copy never promises
 * placement / ranking / verification, and excludes free / dealer / print / combo.
 */

type Lang = "es" | "en";

export type LeonixLaunch25MiniNoticeVariant = "inline" | "banner" | "card";

const COPY = {
  es: {
    title: "Código Leonix Launch 25",
    body: "Si ya tienes tu código, podrás usarlo antes de pagar. Válido solo para productos web elegibles.",
    link: "Obtener mi código",
    finePrint: "No aplica a publicaciones gratis, dealer, paquetes impresos ni combos de revista.",
  },
  en: {
    title: "Leonix Launch 25 code",
    body: "If you already have your code, you can use it before checkout. Valid only for eligible website products.",
    link: "Get my code",
    finePrint: "Not valid for free posts, dealers, printed packages, or magazine combos.",
  },
} as const;

export type LeonixLaunch25MiniNoticeProps = {
  lang: Lang;
  variant?: LeonixLaunch25MiniNoticeVariant;
  className?: string;
  href?: string;
  showLink?: boolean;
};

export function LeonixLaunch25MiniNotice({
  lang,
  variant = "banner",
  className = "",
  href = "/newsletter",
  showLink = true,
}: LeonixLaunch25MiniNoticeProps) {
  const t = COPY[lang];
  const isInline = variant === "inline";

  const shellClass = [
    "rounded-xl border border-[#C9A84A]/60 bg-gradient-to-br from-[#FFFCF7] to-[#F6ECD8]",
    isInline ? "px-3 py-2" : "px-4 py-3",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={shellClass}>
      <div className="flex items-start gap-2.5">
        <span
          className="mt-0.5 inline-flex shrink-0 items-center rounded-full border border-[#7A1E2C]/25 bg-[#7A1E2C]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#7A1E2C]"
          aria-hidden
        >
          25%
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-snug text-[#1E1810]">{t.title}</p>
          <p className={`mt-1 leading-relaxed text-[#3D3428] ${isInline ? "text-xs" : "text-[13px]"}`}>
            {t.body}
          </p>
          {showLink && href ? (
            <Link
              href={href}
              className="mt-1.5 inline-flex text-xs font-bold text-[#7A1E2C] underline underline-offset-2 hover:brightness-110"
            >
              {t.link}
            </Link>
          ) : null}
          {!isInline ? (
            <p className="mt-1.5 text-[10px] leading-relaxed text-[#7A7164]">{t.finePrint}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
