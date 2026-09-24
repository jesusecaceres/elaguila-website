import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { resolveLeonixSiteOrigin } from "@/app/lib/siteOrigin";

/** Absolute site origin for SEO / JobPosting — always the canonical Leonix origin in production. */
export function empleosSiteOrigin(): string {
  return resolveLeonixSiteOrigin();
}

export function empleosJobPublicAbsoluteUrl(slug: string, lang: Lang): string {
  const base = empleosSiteOrigin();
  const q = lang === "en" ? "?lang=en" : "";
  return `${base}/clasificados/empleos/${slug}${q}`;
}
