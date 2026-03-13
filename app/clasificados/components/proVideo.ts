export type ProVideoInfo = {
  url: string;
  thumbUrl?: string;
};

function parseOneBlock(description: string, tag: "LEONIX_PRO_VIDEO" | "LEONIX_PRO_VIDEO_2"): ProVideoInfo | null {
  const blockMatch = description.match(
    new RegExp(`\\[${tag}\\]([\\s\\S]*?)\\[\\/${tag}\\]`)
  );
  if (!blockMatch?.[1]) return null;
  const body = blockMatch[1];
  const urlMatch = body.match(/^\s*url\s*=\s*(.+)\s*$/m);
  const thumbMatch = body.match(/^\s*thumb\s*=\s*(.+)\s*$/m);
  const url = urlMatch?.[1]?.trim();
  const thumbUrl = thumbMatch?.[1]?.trim();
  if (url) return { url, thumbUrl: thumbUrl || undefined };
  return null;
}

/**
 * Extracts LEONIX Pro video metadata from a listing description.
 * Supports up to 2 videos: [LEONIX_PRO_VIDEO] and [LEONIX_PRO_VIDEO_2].
 * Returns array of 0, 1, or 2 items in order.
 */
export function extractProVideoInfos(description?: string | null): ProVideoInfo[] {
  if (!description) return [];
  const out: ProVideoInfo[] = [];
  const first = parseOneBlock(description, "LEONIX_PRO_VIDEO");
  if (first) out.push(first);
  const second = parseOneBlock(description, "LEONIX_PRO_VIDEO_2");
  if (second) out.push(second);
  if (out.length > 0) return out;
  // Backward compatible: human-only block "— Video (Pro) —"
  const idx = description.indexOf("— Video (Pro) —");
  if (idx >= 0) {
    const tail = description.slice(idx);
    const urlLine = tail.match(/^\s*Video:\s*(.+)\s*$/m);
    const thumbLine =
      tail.match(/^\s*Thumbnail:\s*(.+)\s*$/m) || tail.match(/^\s*Miniatura:\s*(.+)\s*$/m);
    const url = urlLine?.[1]?.trim();
    const thumbUrl = thumbLine?.[1]?.trim();
    if (url) out.push({ url, thumbUrl: thumbUrl || undefined });
  }
  return out;
}

/**
 * Extracts first LEONIX Pro video only (backward compatible).
 */
export function extractProVideoInfo(description?: string | null): ProVideoInfo | null {
  return extractProVideoInfos(description)[0] ?? null;
}
