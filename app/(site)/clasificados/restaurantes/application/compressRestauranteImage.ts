import imageCompression from "browser-image-compression";
import { readFileAsDataUrl } from "@/app/publicar/autos/negocios/lib/readFileAsDataUrl";

/** Grid / bucket thumbnails — smaller payload for faster preview + IDB offload. */
export const RESTAURANTE_GRID_IMAGE_COMPRESSION_OPTS = { maxSizeMB: 0.35, maxWidthOrHeight: 960 };

/** Hero / logo — slightly higher quality for cover placement. */
export const RESTAURANTE_HERO_IMAGE_COMPRESSION_OPTS = { maxSizeMB: 0.85, maxWidthOrHeight: 1600 };

/** Balances draft size vs. preview/open-card quality (full data URLs still used downstream). */
const COMPRESSION_OPTS = RESTAURANTE_GRID_IMAGE_COMPRESSION_OPTS;

/** Shrink large photos so session draft saves succeed more often (Leonix-style). */
export async function compressRestauranteImageFile(
  file: File,
  opts: { maxSizeMB: number; maxWidthOrHeight: number } = COMPRESSION_OPTS,
): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    return await imageCompression(file, opts);
  } catch {
    return file;
  }
}

export async function readRestauranteImageAsDataUrl(
  file: File,
  opts: { maxSizeMB: number; maxWidthOrHeight: number } = COMPRESSION_OPTS,
): Promise<string> {
  const f = await compressRestauranteImageFile(file, opts);
  return readFileAsDataUrl(f);
}

/** Instant blob preview while compression runs; revokes blob URL after onPreview returns. */
export async function readRestauranteImageAsDataUrlWithInstantPreview(
  file: File,
  onPreview: (blobUrl: string) => void,
  opts: { maxSizeMB: number; maxWidthOrHeight: number } = COMPRESSION_OPTS,
): Promise<string> {
  const blobUrl = URL.createObjectURL(file);
  onPreview(blobUrl);
  try {
    return await readRestauranteImageAsDataUrl(file, opts);
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}
