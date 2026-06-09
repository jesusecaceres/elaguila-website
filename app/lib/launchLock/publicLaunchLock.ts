/**
 * Emergency public launch lock — allowlist for middleware.
 * When enabled, anonymous visitors may only reach Coming Soon V2 and approved CTA destinations.
 */

/** Server or public env — either enables the lock (Vercel Production). */
export function isPublicLaunchLockEnabled(): boolean {
  return (
    process.env.PUBLIC_LAUNCH_LOCK === "true" ||
    process.env.NEXT_PUBLIC_COMING_SOON_LOCK === "true"
  );
}

const ALLOWED_PUBLIC_PREFIXES = [
  "/coming-soon-v2",
  "/contacto",
  "/contact",
  "/newsletter",
  "/media-kit",
  "/magazine/2026/june/read",
  "/tienda/contacto",
] as const;

const ALLOWED_PUBLIC_EXACT = ["/auth/callback"] as const;

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

export function isStaticAssetPath(pathname: string): boolean {
  if (pathname === "/favicon.ico") return true;
  return /\.(?:avif|bmp|css|eot|gif|ico|jpeg|jpg|js|json|map|pdf|png|svg|ttf|txt|webp|woff|woff2|xml)$/i.test(
    pathname
  );
}

export function isAllowedPublicLaunchPath(pathname: string): boolean {
  const path = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

  if ((ALLOWED_PUBLIC_EXACT as readonly string[]).includes(path)) return true;

  for (const prefix of ALLOWED_PUBLIC_PREFIXES) {
    if (path === prefix || path.startsWith(`${prefix}/`)) return true;
  }

  return false;
}

export function resolveComingSoonLockLang(searchParams: URLSearchParams): "es" | "en" {
  return searchParams.get("lang") === "en" ? "en" : "es";
}
