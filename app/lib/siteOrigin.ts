import { LEONIX_SITE_ORIGIN } from "@/app/lib/leonixBrand";

/**
 * ONE resolver for the absolute origin used in customer-visible URLs (SEO canonical, JobPosting,
 * checkout return links, invite/saved-search emails).
 *
 * - An explicit `NEXT_PUBLIC_SITE_URL` wins, unless it points at a `*.vercel.app` deployment host.
 * - `VERCEL_URL` is only honored on Vercel PREVIEW deployments (owner QA); production never derives
 *   a public URL from the deployment hostname.
 * - Local development (non-production, not on Vercel) keeps `http://localhost:3000`.
 * - Everything else resolves to the canonical Leonix origin.
 */
function stripTrailingSlash(s: string): string {
  return s.replace(/\/+$/, "");
}

function hostOf(origin: string): string {
  try {
    return new URL(origin).host.toLowerCase();
  } catch {
    return "";
  }
}

function isVercelDeploymentHost(origin: string): boolean {
  return hostOf(origin).endsWith(".vercel.app");
}

export function resolveLeonixSiteOrigin(): string {
  const explicitRaw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicitRaw) {
    const explicit = stripTrailingSlash(/^https?:\/\//i.test(explicitRaw) ? explicitRaw : `https://${explicitRaw}`);
    if (hostOf(explicit) && !isVercelDeploymentHost(explicit)) return explicit;
  }
  const vercelEnv = process.env.VERCEL_ENV?.trim();
  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelEnv === "preview" && vercelUrl) {
    return `https://${vercelUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;
  }
  if (process.env.NODE_ENV !== "production" && !vercelEnv) return "http://localhost:3000";
  return LEONIX_SITE_ORIGIN;
}
