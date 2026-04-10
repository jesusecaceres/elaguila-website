import imageCompression from "browser-image-compression";
import { readFileAsDataUrl } from "@/app/publicar/autos/negocios/lib/readFileAsDataUrl";

/** Balances draft size vs. preview/open-card quality (full data URLs still used downstream). */
const COMPRESSION_OPTS = { maxSizeMB: 1, maxWidthOrHeight: 1920 };

/** Shrink large photos so session draft saves succeed more often (Leonix-style). */
export async function compressRestauranteImageFile(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    return await imageCompression(file, COMPRESSION_OPTS);
  } catch {
    return file;
  }
}

export async function readRestauranteImageAsDataUrl(file: File): Promise<string> {
  const f = await compressRestauranteImageFile(file);
  return readFileAsDataUrl(f);
}
