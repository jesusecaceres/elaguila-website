/**
 * Persisted gallery URLs historically lived in `listings.description` during Leonix publish.
 * New publishes keep `description` as user prose only; gallery lives in `listings.images`.
 * `stripLeonixPublishedDescriptionBody` still removes legacy appendix for public display.
 */

const MARK_OPEN = "[LEONIX_IMAGES]";
const MARK_CLOSE = "[/LEONIX_IMAGES]";

/**
 * Removes Leonix publish appendix from `listings.description` for public display:
 * machine marker block and the human-readable "— Fotos —" / "— Photos —" URL tail.
 */
export function stripLeonixPublishedDescriptionBody(raw: unknown): string {
  let d = typeof raw === "string" ? raw : "";
  d = d.replace(/\s*\[LEONIX_IMAGES\][\s\S]*?\[\/LEONIX_IMAGES\]\s*/gi, "\n");
  d = d.replace(/\n{2,}—\s*Fotos\s*—[\s\S]*$/i, "\n");
  d = d.replace(/\n{2,}—\s*Photos\s*—[\s\S]*$/i, "\n");
  return d.replace(/\n{3,}/g, "\n\n").trim();
}

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
