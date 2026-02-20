export type ProVideoInfo = {
  url: string;
  thumbUrl?: string;
};

/**
 * Extracts LEONIX Pro video metadata from a listing description.
 *
 * Preferred format (machine-readable):
 *   [LEONIX_PRO_VIDEO]
 *   url=https://...
 *   thumb=https://...
 *   [/LEONIX_PRO_VIDEO]
 *
 * Backward compatible with the older human-only block:
 *   — Video (Pro) —
 *   Video: https://...
 *   Thumbnail: https://...   (or Miniatura:)
 */
export function extractProVideoInfo(description?: string | null): ProVideoInfo | null {
  if (!description) return null;

  // 1) Machine-readable block
  const blockMatch = description.match(/\[LEONIX_PRO_VIDEO\]([\s\S]*?)\[\/LEONIX_PRO_VIDEO\]/);
  if (blockMatch?.[1]) {
    const body = blockMatch[1];
    const urlMatch = body.match(/^\s*url\s*=\s*(.+)\s*$/m);
    const thumbMatch = body.match(/^\s*thumb\s*=\s*(.+)\s*$/m);
    const url = urlMatch?.[1]?.trim();
    const thumbUrl = thumbMatch?.[1]?.trim();
    if (url) return { url, thumbUrl: thumbUrl || undefined };
  }

  // 2) Backward compatible: look for the human block
  // Try to isolate the "— Video (Pro) —" section
  const idx = description.indexOf("— Video (Pro) —");
  if (idx >= 0) {
    const tail = description.slice(idx);
    const urlLine = tail.match(/^\s*Video:\s*(.+)\s*$/m);
    const thumbLine =
      tail.match(/^\s*Thumbnail:\s*(.+)\s*$/m) || tail.match(/^\s*Miniatura:\s*(.+)\s*$/m);

    const url = urlLine?.[1]?.trim();
    const thumbUrl = thumbLine?.[1]?.trim();
    if (url) return { url, thumbUrl: thumbUrl || undefined };
  }

  return null;
}
