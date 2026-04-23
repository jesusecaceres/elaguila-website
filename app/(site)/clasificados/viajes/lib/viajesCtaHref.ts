/**
 * Detects CTA hrefs that look actionable but would not reach a real contact target.
 * Used by offer detail layout and publish→detail mappers.
 */

export function isPlaceholderViajesCtaHref(href: string): boolean {
  const h = href.trim();
  if (!h) return true;
  if (/^https:\/\/wa\.me\/?$/i.test(h)) return true;
  if (/^tel:\s*$/i.test(h)) return true;
  if (/^mailto:\s*$/i.test(h)) return true;
  if (h === "https://" || h === "http://") return true;
  return false;
}
