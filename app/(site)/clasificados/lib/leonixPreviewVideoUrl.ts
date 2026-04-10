/**
 * Leonix real-estate preview: classify uploaded / linked video URLs for inline <video> vs stream vs external tab.
 * Draft uploads use FileReader → data URLs; some browsers emit `data:application/octet-stream;base64,...` for certain codecs.
 */

export function isInlineVideoDataUrl(playback: string): boolean {
  const p = String(playback ?? "").trim();
  if (!/^data:/i.test(p)) return false;
  if (/^data:image\//i.test(p)) return false;
  if (/^data:video\//i.test(p)) return true;
  if (/^data:application\/octet-stream/i.test(p)) return true;
  return false;
}

export function isHostedStreamOrBlobUrl(playback: string): boolean {
  return /\.m3u8|\.mp4|\.webm|\.ogg(\?|$)|blob:/i.test(String(playback ?? ""));
}

export function isHttpsDirectVideoUrl(playback: string): boolean {
  const p = String(playback ?? "").trim();
  if (!/^https?:\/\//i.test(p)) return false;
  if (/\s/.test(p)) return false;
  if (/youtube\.com|youtu\.be|vimeo\.com/i.test(p)) return false;
  return true;
}
