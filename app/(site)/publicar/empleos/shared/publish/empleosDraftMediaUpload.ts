"use client";

/**
 * Empleos — media wiring repair (Quick Tier-1 Gate 5).
 *
 * Root cause: `mapImagesForPublish` in buildEmpleosPublishEnvelope.ts drops every `data:`/`blob:` image
 * reference, and no Empleos code path ever uploaded a customer file anywhere, so a photo picked in the
 * existing application passed the preview gate but never reached the publish envelope; the public job page
 * then rendered the stock `FALLBACK_IMG`.
 *
 * Repair (narrowest safe): right before the envelope is built for checkout, upload the draft's local
 * `data:image/*` files with the customer's own Supabase session to the EXISTING public `listing-images`
 * bucket (same bucket every other classified publisher already uses; INSERT policy = any authenticated
 * user; own-folder SELECT/UPDATE/DELETE keyed by `auth.uid()`), under `${userId}/empleos/${batch}/…`, and
 * swap the draft's image URLs for the resulting https URLs. The unchanged envelope mapper then keeps them.
 * No schema, no new bucket, no change to the application UI, the envelope shape, or the public page.
 */

import type { EmpleosImageItem } from "../media/empleosMediaTypes";
import type { EmpleosQuickDraft } from "../types/empleosQuickDraft";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";

const BUCKET = "listing-images";
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export type EmpleosMediaUploadResult<T> = { ok: true; draft: T; uploaded: number } | { ok: false; message: string };

function isLocalRef(url: string): boolean {
  return /^data:image\//i.test(url) || url.startsWith("blob:");
}

function extFor(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

async function localRefToBlob(url: string): Promise<Blob> {
  const res = await fetch(url);
  return res.blob();
}

function randomBatchId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Uploads local image refs (gallery + logo) and returns a draft copy whose URLs are https. Already-hosted
 * URLs are untouched, so re-running is idempotent for edits. Fails closed with a bilingual message when a
 * file cannot be uploaded — nothing is silently dropped anymore.
 */
export async function resolveEmpleosQuickDraftMediaForPublish(
  draft: EmpleosQuickDraft,
  input: { userId: string; lang: "es" | "en" },
): Promise<EmpleosMediaUploadResult<EmpleosQuickDraft>> {
  const supabase = createSupabaseBrowserClient();
  const batch = randomBatchId();
  const base = `${input.userId}/empleos/${batch}`;
  const fail = (): EmpleosMediaUploadResult<EmpleosQuickDraft> => ({
    ok: false,
    message:
      input.lang === "es"
        ? "No se pudieron subir las fotos del empleo. Verifica tu conexión o usa JPG/PNG/WebP e inténtalo de nuevo."
        : "The job photos could not be uploaded. Check your connection or use JPG/PNG/WebP and try again.",
  });

  let uploaded = 0;
  const upload = async (url: string, name: string): Promise<string | null> => {
    const blob = await localRefToBlob(url);
    const mime = blob.type || "image/jpeg";
    if (!ALLOWED.has(mime)) return null;
    const path = `${base}/${name}.${extFor(mime)}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { upsert: true, contentType: mime });
    if (error) return null;
    uploaded += 1;
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  };

  const images: EmpleosImageItem[] = [];
  for (let i = 0; i < draft.images.length; i++) {
    const item = draft.images[i]!;
    const url = String(item.url ?? "").trim();
    if (!url || !isLocalRef(url)) {
      images.push(item);
      continue;
    }
    const hosted = await upload(url, `photo-${String(i + 1).padStart(2, "0")}`);
    if (!hosted) return fail();
    images.push({ ...item, url: hosted });
  }

  let logoUrl = String(draft.logoUrl ?? "").trim();
  if (logoUrl && isLocalRef(logoUrl)) {
    const hosted = await upload(logoUrl, "logo");
    if (!hosted) return fail();
    logoUrl = hosted;
  }

  return { ok: true, draft: { ...draft, images, logoUrl }, uploaded };
}
