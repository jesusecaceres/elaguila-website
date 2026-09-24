"use client";

/**
 * Read-only Community Trust strip for result cards — same visual language as Servicios
 * (`data-servicios-card-trust-strip`). Never a second vote engine. Cards stay read-only;
 * the full ad uses interactive `LeonixCommunityTrust`.
 */

export function LeonixCommunityTrustCardStrip({
  lang,
  count = 0,
}: {
  lang: "es" | "en";
  count?: number;
}) {
  const n = typeof count === "number" && Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
  const label =
    n > 0
      ? lang === "en"
        ? `${n} recognition${n === 1 ? "" : "s"}`
        : `${n} reconocimiento${n === 1 ? "" : "s"}`
      : lang === "en"
        ? "New"
        : "Nuevo";
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border border-[#E8D7B8] bg-[#FFF9F2] px-2.5 py-1 text-[10px] font-bold text-[#7A1E2C] sm:text-[11px]"
      data-leonix-community-trust-card-strip="1"
    >
      🦁 {lang === "en" ? "Leonix Community" : "Comunidad Leonix"}
      {" · "}
      {label}
    </span>
  );
}
