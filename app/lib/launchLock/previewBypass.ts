/**
 * Owner production preview bypass — server-side only.
 * Unlocked via /api/preview/unlock?token=… (LEONIX_PREVIEW_BYPASS_TOKEN in Vercel).
 */

export const LEONIX_PREVIEW_ACCESS_COOKIE = "leonix_preview_access";
export const LEONIX_PREVIEW_ACCESS_COOKIE_VALUE = "1";
export const LEONIX_PREVIEW_ACCESS_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function getPreviewBypassToken(): string | null {
  const token = process.env.LEONIX_PREVIEW_BYPASS_TOKEN?.trim();
  return token || null;
}

export function isValidPreviewBypassToken(candidate: string | null | undefined): boolean {
  const expected = getPreviewBypassToken();
  if (!expected) return false;
  if (!candidate?.trim()) return false;
  return candidate.trim() === expected;
}

export function hasPreviewBypassCookie(cookies: {
  get: (name: string) => { value?: string } | undefined;
}): boolean {
  return cookies.get(LEONIX_PREVIEW_ACCESS_COOKIE)?.value === LEONIX_PREVIEW_ACCESS_COOKIE_VALUE;
}

export function previewBypassCookieOptions(): {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
  maxAge: number;
} {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: LEONIX_PREVIEW_ACCESS_MAX_AGE_SECONDS,
  };
}

export function safeInternalNextPath(next: string | null | undefined): string {
  if (!next?.startsWith("/")) return "/";
  if (next.startsWith("//")) return "/";
  return next;
}
