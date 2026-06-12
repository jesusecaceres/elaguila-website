import { isEmbeddableExternalVideoUrl } from "@/app/clasificados/en-venta/shared/utils/enVentaVideoEmbed";
import { isRestauranteLocalVideoDataUrl } from "@/app/clasificados/restaurantes/application/restauranteMediaDisplay";

export const RESTAURANTE_MAX_EXTERNAL_VIDEO_URLS = 4;

export function trimRestauranteVideoUrl(raw: string): string {
  return String(raw ?? "").trim();
}

/** External link validation for Restaurante publish (http/https, embeddable or known hosts). */
export function isValidRestauranteExternalVideoUrl(raw: string): boolean {
  const t = trimRestauranteVideoUrl(raw);
  if (!/^https?:\/\//i.test(t)) return false;
  return isEmbeddableExternalVideoUrl(t);
}

function dedupeUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of urls) {
    const u = trimRestauranteVideoUrl(raw);
    if (!u || !isValidRestauranteExternalVideoUrl(u)) continue;
    const key = u.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(u);
    if (out.length >= RESTAURANTE_MAX_EXTERNAL_VIDEO_URLS) break;
  }
  return out;
}

export function normalizeRestauranteVideoUrlsList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return dedupeUrls(raw.map((x) => String(x ?? "")));
}

export type RestauranteVideoDraftLike = {
  videoUrls?: string[] | undefined;
  videoUrl?: string | undefined;
  videoFile?: string | undefined;
};

/**
 * Canonical ordered external video URLs from draft state.
 * Migrates legacy single `videoUrl`; does not include local data:video files.
 */
export function collectRestauranteExternalVideoUrls(d: RestauranteVideoDraftLike): string[] {
  const fromField = normalizeRestauranteVideoUrlsList(d.videoUrls);
  if (fromField.length) return fromField;

  const legacyUrl = trimRestauranteVideoUrl(d.videoUrl ?? "");
  if (legacyUrl && isValidRestauranteExternalVideoUrl(legacyUrl)) {
    return [legacyUrl];
  }
  return [];
}

/** True when draft has displayable video (external URLs or legacy local file). */
export function restauranteDraftHasVideo(d: RestauranteVideoDraftLike): boolean {
  if (collectRestauranteExternalVideoUrls(d).length > 0) return true;
  const vf = d.videoFile?.trim();
  if (!vf) return false;
  if (isRestauranteLocalVideoDataUrl(vf)) return true;
  if (/^https?:\/\//i.test(vf) && isEmbeddableExternalVideoUrl(vf)) return true;
  return false;
}

export function shortenRestauranteVideoUrl(url: string): string {
  const t = url.trim();
  if (t.length <= 56) return t;
  return `${t.slice(0, 53)}…`;
}
