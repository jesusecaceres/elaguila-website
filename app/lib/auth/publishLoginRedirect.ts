export type PublishLang = "es" | "en";

/** Same-origin path only — used for post-login return to publish flows. */
export function safeInternalRedirect(raw: string | null | undefined): string {
  const v = (raw ?? "").trim();
  if (!v.startsWith("/")) return "";
  return v;
}

export function detectLangFromPath(path: string, fallback: PublishLang = "es"): PublishLang {
  try {
    const u = new URL(path, "https://example.com");
    const l = u.searchParams.get("lang");
    if (l === "en") return "en";
    if (l === "es") return "es";
  } catch {
    // ignore
  }
  return fallback;
}

/**
 * Customer login URL for publish flows (`mode=post` preserves profile gate when configured).
 */
export function buildPublishLoginHref(returnPath: string, lang?: PublishLang): string {
  const safe = safeInternalRedirect(returnPath);
  const resolvedLang = lang ?? detectLangFromPath(safe);
  const fallback = `/clasificados/publicar?lang=${resolvedLang}`;
  const redirect = encodeURIComponent(safe || fallback);
  return `/login?mode=post&lang=${resolvedLang}&redirect=${redirect}`;
}
