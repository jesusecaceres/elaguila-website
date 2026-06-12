import type { EnVentaFreeApplicationState } from "@/app/clasificados/publicar/en-venta/free/application/schema/enVentaFreeFormState";
import { isEmbeddableExternalVideoUrl, muxPlaybackUrlFromId } from "./enVentaVideoEmbed";

export const EN_VENTA_MAX_EXTERNAL_VIDEO_URLS = 4;
export const LEONIX_EN_VENTA_VIDEO_URLS_PAIR = "Leonix:videoUrls";

export function trimEnVentaVideoUrl(raw: string): string {
  return String(raw ?? "").trim();
}

/** External link validation for En Venta publish (http/https, embeddable or known hosts). */
export function isValidEnVentaExternalVideoUrl(raw: string): boolean {
  const t = trimEnVentaVideoUrl(raw);
  if (!/^https?:\/\//i.test(t)) return false;
  return isEmbeddableExternalVideoUrl(t);
}

function dedupeUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of urls) {
    const u = trimEnVentaVideoUrl(raw);
    if (!u || !isValidEnVentaExternalVideoUrl(u)) continue;
    const key = u.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(u);
    if (out.length >= EN_VENTA_MAX_EXTERNAL_VIDEO_URLS) break;
  }
  return out;
}

export function normalizeEnVentaVideoUrlsList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return dedupeUrls(raw.map((x) => String(x ?? "")));
}

export function parseEnVentaVideoUrlsFromDetailPairs(
  pairs: Array<{ label: string; value: string }> | null | undefined
): string[] {
  if (!pairs?.length) return [];
  for (const p of pairs) {
    if (p.label.trim() !== LEONIX_EN_VENTA_VIDEO_URLS_PAIR) continue;
    const raw = p.value.trim();
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) return normalizeEnVentaVideoUrlsList(parsed);
    } catch {
      /* legacy non-JSON */
    }
  }
  for (const p of pairs) {
    if (p.label.trim() === "Leonix:videoUrl") {
      const v = trimEnVentaVideoUrl(p.value);
      if (v && isValidEnVentaExternalVideoUrl(v)) return [v];
    }
  }
  return [];
}

/** Published row + legacy fields → ordered embeddable URLs. */
export function resolveEnVentaVideoUrlsFromSources(args: {
  muxPlaybackId?: string | null;
  muxPlaybackUrl?: string | null;
  description?: string | null;
  detailPairs?: Array<{ label: string; value: string }> | null;
}): string[] {
  const fromPairs = parseEnVentaVideoUrlsFromDetailPairs(args.detailPairs);
  if (fromPairs.length) return fromPairs;
  const mux = muxPlaybackUrlFromId(args.muxPlaybackId);
  if (mux) return [mux];
  const muxDirect = String(args.muxPlaybackUrl ?? "").trim();
  if (muxDirect && isEmbeddableExternalVideoUrl(muxDirect)) return [muxDirect];
  const d = String(args.description ?? "");
  const m = d.match(/\bVideo:\s*(https?:\/\/[^\s]+)/i);
  if (m?.[1] && isEmbeddableExternalVideoUrl(m[1])) return [m[1].trim()];
  return [];
}

export function serializeEnVentaVideoUrlsForDetailPair(urls: string[]): string {
  return JSON.stringify(normalizeEnVentaVideoUrlsList(urls));
}

/** Canonical video URL list from form state (migrates legacy single URL / Mux stream). */
export function collectEnVentaVideoUrlsFromState(state: EnVentaFreeApplicationState): string[] {
  const fromField = normalizeEnVentaVideoUrlsList(state.videoUrls);
  if (fromField.length) return fromField;

  const legacy: string[] = [];
  const legacyUrl = trimEnVentaVideoUrl(state.listingVideoUrl);
  if (legacyUrl && isValidEnVentaExternalVideoUrl(legacyUrl)) legacy.push(legacyUrl);

  const slot = state.listingVideoSlots?.[0];
  if (slot) {
    const playbackUrl = trimEnVentaVideoUrl(slot.playbackUrl);
    if (playbackUrl && isValidEnVentaExternalVideoUrl(playbackUrl)) legacy.push(playbackUrl);
    const mux = muxPlaybackUrlFromId(slot.playbackId);
    if (mux) legacy.push(mux);
  }

  return dedupeUrls(legacy);
}

export function enVentaStateHasExternalVideoUrls(state: EnVentaFreeApplicationState): boolean {
  return collectEnVentaVideoUrlsFromState(state).length > 0;
}
