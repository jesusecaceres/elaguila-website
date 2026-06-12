/**
 * Emergency public launch lock — allowlist for middleware.
 * Anonymous visitors may only reach Coming Soon V2 and approved CTA destinations.
 */

/**
 * Lock is ON by default on Vercel Production so a missing env var cannot leak the site.
 * Opt out locally/staging: PUBLIC_LAUNCH_LOCK=false
 * Force on anywhere: PUBLIC_LAUNCH_LOCK=true or NEXT_PUBLIC_COMING_SOON_LOCK=true
 */
export function isPublicLaunchLockEnabled(): boolean {
  if (process.env.PUBLIC_LAUNCH_LOCK === "false") return false;
  if (process.env.NEXT_PUBLIC_COMING_SOON_LOCK === "false") return false;
  if (process.env.PUBLIC_LAUNCH_LOCK === "true") return true;
  if (process.env.NEXT_PUBLIC_COMING_SOON_LOCK === "true") return true;
  return process.env.VERCEL_ENV === "production";
}

const ALLOWED_PUBLIC_PREFIXES = [
  "/coming-soon-v2",
  "/contacto",
  "/contact",
  "/newsletter",
  "/media-kit",
  "/magazine/2026/june/read",
  "/productos-promocion",
  "/tienda/contacto",
  "/translate-site",
] as const;

const ALLOWED_PUBLIC_EXACT = ["/auth/callback"] as const;

/** Public static prefixes that must never redirect (Coming Soon / Media Kit assets). */
const STATIC_PREFIX_BYPASSES = ["/branding", "/images", "/assets", "/qr"] as const;

function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname;
}

export function isNextInternalPath(pathname: string): boolean {
  return pathname.startsWith("/_next");
}

export function isApiPath(pathname: string): boolean {
  return pathname.startsWith("/api");
}

export function isAdminPath(pathname: string): boolean {
  return pathname.startsWith("/admin");
}

export function isAuthPath(pathname: string): boolean {
  return pathname.startsWith("/auth");
}

export function isWellKnownStaticPath(pathname: string): boolean {
  const path = normalizePathname(pathname);
  return path === "/favicon.ico" || path === "/robots.txt" || path === "/sitemap.xml";
}

export function isStaticPrefixBypass(pathname: string): boolean {
  const path = normalizePathname(pathname);
  for (const prefix of STATIC_PREFIX_BYPASSES) {
    if (path === prefix || path.startsWith(`${prefix}/`)) return true;
  }
  return false;
}

export function isStaticAssetPath(pathname: string): boolean {
  if (isWellKnownStaticPath(pathname)) return true;
  return /\.(?:avif|bmp|css|eot|gif|ico|jpeg|jpg|js|json|map|pdf|png|svg|ttf|txt|webp|woff|woff2|xml)$/i.test(
    pathname
  );
}

export function isBypassPath(pathname: string): boolean {
  return (
    isNextInternalPath(pathname) ||
    isApiPath(pathname) ||
    isAdminPath(pathname) ||
    isAuthPath(pathname) ||
    isWellKnownStaticPath(pathname) ||
    isStaticPrefixBypass(pathname) ||
    isStaticAssetPath(pathname)
  );
}

export function isAllowedPublicLaunchPath(pathname: string): boolean {
  const path = normalizePathname(pathname);

  if ((ALLOWED_PUBLIC_EXACT as readonly string[]).includes(path)) return true;

  for (const prefix of ALLOWED_PUBLIC_PREFIXES) {
    if (path === prefix || path.startsWith(`${prefix}/`)) return true;
  }

  return false;
}

export function resolveComingSoonLockLang(searchParams: URLSearchParams): "es" | "en" {
  return searchParams.get("lang") === "en" ? "en" : "es";
}
