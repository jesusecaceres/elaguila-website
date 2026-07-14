import Link from "next/link";
import type { ServiciosLang } from "../types/serviciosBusinessProfile";
import { LX_CHIP, LX_LINK_ACCENT } from "./serviciosLeonixBrand";

/** Normal cards show visible service chips; extreme lists link to profile instead of "+N". */
export const SERVICIOS_CARD_CHIP_DISPLAY_MAX = 8;
export const SERVICIOS_CARD_CHIP_EXTREME_THRESHOLD = 10;

export function ServiciosServiceChipsRow({
  chips,
  lang,
  profileHref,
  servicesLabel,
  className = "",
}: {
  chips: string[];
  lang: ServiciosLang;
  profileHref?: string;
  servicesLabel?: string;
  className?: string;
}) {
  const clean = chips.filter(Boolean);
  if (clean.length === 0) return null;

  const extreme = clean.length >= SERVICIOS_CARD_CHIP_EXTREME_THRESHOLD;
  const visible = extreme ? clean.slice(0, SERVICIOS_CARD_CHIP_DISPLAY_MAX) : clean;
  const href = (profileHref ?? "").trim();

  return (
    <div className={`flex min-w-0 flex-wrap gap-1 sm:gap-1.5 ${className}`.trim()}>
      {servicesLabel ? (
        <span className="sr-only">{servicesLabel}</span>
      ) : null}
      {visible.map((chip) => (
        <span key={chip} className={LX_CHIP}>
          {chip}
        </span>
      ))}
      {extreme && href ? (
        <Link href={href} className={`${LX_LINK_ACCENT} pointer-events-auto self-center text-[11px] sm:text-xs`}>
          {lang === "en" ? "View all services" : "Ver todos los servicios"}
        </Link>
      ) : null}
    </div>
  );
}
