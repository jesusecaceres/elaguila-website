/**
 * Bienes Raíces — additional business links (title + URL) normalization and mapping.
 */

export type BienesAdditionalBusinessLink = {
  title: string;
  url: string;
};

export const BIENES_MAX_ADDITIONAL_BUSINESS_LINKS = 2;

function trim(s: unknown): string {
  if (s == null) return "";
  return typeof s === "string" ? s.trim() : String(s).trim();
}

export function emptyBusinessExtraLink(): BienesAdditionalBusinessLink {
  return { title: "", url: "" };
}

export function hrefFromBusinessLinkUrl(raw: string): string | null {
  const s = trim(raw);
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  if (/^www\./i.test(s)) return `https://${s}`;
  if (/^[a-z0-9][a-z0-9-]*\.[a-z]{2,}([/?#].*)?$/i.test(s)) return `https://${s}`;
  return null;
}

export function businessLinkHref(link: BienesAdditionalBusinessLink): string | null {
  return hrefFromBusinessLinkUrl(link.url);
}

export function businessLinkPublicLabel(
  link: BienesAdditionalBusinessLink,
  locale: "es" | "en",
): string {
  const title = trim(link.title);
  if (title) return title;
  return locale === "en" ? "Visit link" : "Visitar enlace";
}

/** Normalize legacy string / URL-only object / titled object arrays. */
export function normalizeBusinessExtraLinks(raw: unknown, max = BIENES_MAX_ADDITIONAL_BUSINESS_LINKS): BienesAdditionalBusinessLink[] {
  const source = Array.isArray(raw) ? raw : typeof raw === "string" && raw.trim() ? [raw] : [];
  const out: BienesAdditionalBusinessLink[] = [];

  for (const item of source) {
    if (out.length >= max) break;

    if (typeof item === "string") {
      const url = trim(item);
      if (!url) continue;
      if (out.some((x) => trim(x.url) === url)) continue;
      out.push({ title: "", url });
      continue;
    }

    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const url = trim(o.url ?? o.href ?? o.link ?? "");
    const title = trim(o.title ?? o.label ?? o.name ?? "");
    if (!url && !title) continue;
    if (url && out.some((x) => trim(x.url) === url)) continue;
    out.push({ title, url });
  }

  return out;
}

/**
 * Draft storage — keep in-progress pairs without live trim.
 * Trimming mid-typing destroys trailing spaces (Spacebar) between multi-word titles.
 * Emptiness is judged with trim, but stored values preserve typed whitespace.
 */
export function sanitizeBusinessExtraLinksForDraft(
  raw: readonly BienesAdditionalBusinessLink[] | undefined,
  max = BIENES_MAX_ADDITIONAL_BUSINESS_LINKS,
): BienesAdditionalBusinessLink[] {
  const out: BienesAdditionalBusinessLink[] = [];
  for (const item of raw ?? []) {
    if (out.length >= max) break;
    const title = typeof item?.title === "string" ? item.title : item?.title != null ? String(item.title) : "";
    const url = typeof item?.url === "string" ? item.url : item?.url != null ? String(item.url) : "";
    if (!title.trim() && !url.trim()) continue;
    out.push({ title, url });
  }
  return out;
}

/**
 * Visible editor slots. Prefer raw draft values (no re-normalize/trim) so Space while typing survives.
 */
export function paddedBusinessExtraLinks(
  raw: readonly BienesAdditionalBusinessLink[] | undefined,
  visibleCount: number,
  max = BIENES_MAX_ADDITIONAL_BUSINESS_LINKS,
): BienesAdditionalBusinessLink[] {
  const source = Array.isArray(raw) ? raw : [];
  const kept: BienesAdditionalBusinessLink[] = [];
  for (const item of source) {
    if (kept.length >= max) break;
    const title = typeof item?.title === "string" ? item.title : "";
    const url = typeof item?.url === "string" ? item.url : "";
    if (!title.trim() && !url.trim() && kept.length > 0) continue;
    kept.push({ title, url });
  }
  const slots = Math.min(max, Math.max(1, visibleCount));
  return Array.from({ length: slots }, (_, i) => kept[i] ?? emptyBusinessExtraLink());
}

/** Publish / preview — only links with durable http(s) URLs; titles preserved. */
export function durableBusinessExtraLinks(
  raw: unknown,
  max = BIENES_MAX_ADDITIONAL_BUSINESS_LINKS,
): BienesAdditionalBusinessLink[] {
  const out: BienesAdditionalBusinessLink[] = [];
  for (const item of normalizeBusinessExtraLinks(raw, max)) {
    const href = businessLinkHref(item);
    if (!href || out.some((x) => businessLinkHref(x) === href)) continue;
    out.push({ title: trim(item.title), url: href });
    if (out.length >= max) break;
  }
  return out;
}

/** Published listing meta JSON → titled links (legacy string arrays supported). */
export function parsePublishedBusinessExtraLinks(raw: unknown, max = BIENES_MAX_ADDITIONAL_BUSINESS_LINKS): BienesAdditionalBusinessLink[] {
  const source =
    Array.isArray(raw)
      ? raw
      : typeof raw === "string"
        ? (() => {
            try {
              const parsed = JSON.parse(raw);
              return Array.isArray(parsed) ? parsed : [raw];
            } catch {
              return [raw];
            }
          })()
        : [];
  return durableBusinessExtraLinks(source, max);
}

export function businessExtraLinksToPreviewCtas(
  raw: unknown,
  locale: "es" | "en",
  max = BIENES_MAX_ADDITIONAL_BUSINESS_LINKS,
): Array<{ label: string; href: string }> {
  return durableBusinessExtraLinks(raw, max).map((link) => ({
    label: businessLinkPublicLabel(link, locale),
    href: businessLinkHref(link)!,
  }));
}
