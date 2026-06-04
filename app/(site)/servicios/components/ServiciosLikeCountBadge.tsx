import type { ServiciosLang } from "../types/serviciosBusinessProfile";
import { LX_LIKE_BADGE } from "./serviciosLeonixBrand";

/** Public persisted like count — shown only when count &gt; 0 (no fake zeros). */
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

  const label =
    lang === "en" ? `${n} ${n === 1 ? "like" : "likes"}` : `${n} me gusta`;

  return (
    <span className={`${LX_LIKE_BADGE} ${className}`.trim()} data-servicios-like-badge="1">
      <span aria-hidden>♥</span>
      <span>{label}</span>
    </span>
  );
}
