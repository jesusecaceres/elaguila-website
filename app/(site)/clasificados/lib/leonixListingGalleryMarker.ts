/**
 * Persisted gallery URLs are appended to `listings.description` during Leonix publish
 * (`leonixPublishRealEstateListingCore`). Public read can fall back to this block when
 * `listings.images` is empty (e.g. legacy rows or failed DB update).
 */

const MARK_OPEN = "[LEONIX_IMAGES]";
const MARK_CLOSE = "[/LEONIX_IMAGES]";

/** Extract `url=…` lines from a published listing description (same format as publish appendix). */
export function parseLeonixImageUrlsFromDescription(description: unknown): string[] {
  const d = typeof description === "string" ? description : "";
  const open = d.indexOf(MARK_OPEN);
  const close = d.indexOf(MARK_CLOSE);
  if (open === -1 || close === -1 || close <= open) return [];
  const block = d.slice(open + MARK_OPEN.length, close).trim();
  const out: string[] = [];
  for (const line of block.split(/\r?\n/)) {
    const m = /^url=(.+)$/i.exec(line.trim());
    if (m?.[1]) {
      const u = m[1].trim();
      if (u) out.push(u);
    }
  }
  return out;
}
