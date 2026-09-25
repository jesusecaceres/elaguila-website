/**
 * BROWSER-SIDE: turn the staff Bienes Negocio application's photos into durable https URLs before
 * "Save for Client" sends them.
 *
 * The application keeps its gallery as `data:` URLs (or, on an assisted reopen, already-hosted
 * https URLs). Neither `data:` nor `blob:` can ever be persisted (shared media contract), and the
 * staff actor usually has no customer Supabase session, so the customer path's own browser-to-Storage
 * upload is not available to them. The existing anonymous-capable Blob upload endpoint the Rentas
 * customer path already calls (`/api/clasificados/rentas/draft-media-upload`, slot `gallery`) is
 * reused as-is: no new endpoint, no staff-only gallery, no second storage. What comes back is the
 * hosted URL the assisted route then validates again and writes to `listings.images`.
 *
 * This module decides nothing about entitlement, roles or caps: it only uploads and maps each
 * photo's DECLARED role (keyed by its source string, exactly as `fotoMediaRoles` is keyed) to the new
 * URL. A photo with no declared role stays unroled.
 */
import {
  isRentasPublishableRemoteImageRef,
  rentasDraftImageRequiresBlobUpload,
} from "@/app/clasificados/rentas/shared/rentasPublishMediaTransport";

export const ASSISTED_BIENES_GALLERY_UPLOAD_PATH = "/api/clasificados/rentas/draft-media-upload";

export type AssistedBienesGallerySource = {
  /** Ordered gallery sources (cover first): data:image / blob: / https. */
  sources: readonly string[];
  /** Declared role per source string (`fotoMediaRoles`), if any. */
  roles?: Readonly<Record<string, string>> | null;
};

export type AssistedBienesGalleryEntry = { url: string; role?: string };

export type AssistedBienesGalleryUploadResult =
  | { ok: true; entries: AssistedBienesGalleryEntry[] }
  | { ok: false; error: "assisted_gallery_upload_failed" | "assisted_gallery_unsupported_ref"; message: string };

/** A source that was already uploaded in this page session keeps its URL (a re-save never re-uploads it). */
const uploadedBySource = new Map<string, string>();

async function uploadBlob(blob: Blob, index: number): Promise<string> {
  const form = new FormData();
  form.set("draftId", "assisted-bienes");
  form.set("slot", "gallery");
  form.set("index", String(index));
  form.set("file", blob, "image.jpg");
  const res = await fetch(ASSISTED_BIENES_GALLERY_UPLOAD_PATH, { method: "POST", body: form });
  const json = (await res.json().catch(() => ({}))) as { ok?: boolean; publicUrl?: string; error?: string };
  if (!res.ok || json.ok !== true || typeof json.publicUrl !== "string" || !json.publicUrl.trim()) {
    throw new Error(json.error || `upload_http_${res.status}`);
  }
  return json.publicUrl.trim();
}

export async function uploadAssistedBienesGallery(
  input: AssistedBienesGallerySource,
): Promise<AssistedBienesGalleryUploadResult> {
  const entries: AssistedBienesGalleryEntry[] = [];
  const seen = new Set<string>();
  let index = 0;
  for (const raw of input.sources) {
    const src = typeof raw === "string" ? raw.trim() : "";
    if (!src) continue;
    let url: string;
    if (isRentasPublishableRemoteImageRef(src)) {
      url = src;
    } else if (rentasDraftImageRequiresBlobUpload(src)) {
      const cached = uploadedBySource.get(src);
      if (cached) {
        url = cached;
      } else {
        try {
          const blob = await (await fetch(src)).blob();
          url = await uploadBlob(blob, index);
          uploadedBySource.set(src, url);
        } catch {
          return {
            ok: false,
            error: "assisted_gallery_upload_failed",
            message: "A photo could not be uploaded. Nothing was saved. Try again.",
          };
        }
      }
    } else {
      return {
        ok: false,
        error: "assisted_gallery_unsupported_ref",
        message: "A photo is not an uploadable image. Nothing was saved.",
      };
    }
    index += 1;
    if (seen.has(url)) continue;
    seen.add(url);
    const role = typeof input.roles?.[src] === "string" ? input.roles![src]!.trim() : "";
    entries.push(role ? { url, role } : { url });
  }
  return { ok: true, entries };
}
