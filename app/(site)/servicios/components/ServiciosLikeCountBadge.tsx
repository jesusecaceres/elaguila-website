import { FaHeart } from "react-icons/fa";
import type { ServiciosLang } from "../types/serviciosBusinessProfile";
import { LX_LIKE_BADGE } from "./serviciosLeonixBrand";

/** Public persisted like count — compact `N ♥` (non-interactive social proof). */
export function ServiciosLikeCountBadge({
  count,
  lang,
  className = "",
}: {
  count: number;
  lang: ServiciosLang;
  className?: string;
}) {
  const n = Math.max(0, Math.floor(count));
  if (n <= 0) return null;

  const ariaLabel = lang === "en" ? `${n} ${n === 1 ? "like" : "likes"}` : `${n} me gusta`;

  return (
    <span
      className={`${LX_LIKE_BADGE} inline-flex items-center gap-0.5 ${className}`.trim()}
      data-servicios-like-badge="1"
      data-servicios-like-compact="1"
      aria-label={ariaLabel}
    >
      <span className="tabular-nums">{n}</span>
      <FaHeart className="h-3 w-3 shrink-0 text-[#7A1E2C]" aria-hidden />
    </span>
  );
}
