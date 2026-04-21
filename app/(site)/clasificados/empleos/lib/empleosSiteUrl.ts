import type { Lang } from "@/app/clasificados/config/clasificadosHub";

/** Absolute site origin for SEO / JobPosting (set `NEXT_PUBLIC_SITE_URL` in production). */
export function empleosSiteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  return "https://leonix.com";
}

export function empleosJobPublicAbsoluteUrl(slug: string, lang: Lang): string {
  const base = empleosSiteOrigin();
  const q = lang === "en" ? "?lang=en" : "";
  return `${base}/clasificados/empleos/${slug}${q}`;
}
