"use client";

import type { ServiciosBusinessProfile } from "@/app/servicios/types/serviciosBusinessProfile";
import type { ClasificadosServiciosApplicationState } from "./clasificadosServiciosApplicationTypes";
import type { ServiciosLang } from "./clasificadosServiciosApplicationTypes";
import { buildServiciosPublishTransportBody } from "./buildServiciosPublishPayload";
import { resolveServiciosDraftMediaToRemoteUrls } from "./serviciosDraftPublishPrepare";

export type ServiciosPublishPersistence = "database" | "dev_workspace" | "none";

export type ServiciosPublishApiResponse = {
  ok?: boolean;
  /** Client-only: set when oversized optional videos were omitted before publish (not returned by API). */
  skippedOversizedVideos?: boolean;
  /** Set on a pending-payment save (Revenue OS checkout handoff). */
  pendingPayment?: boolean;
  listingId?: string;
  leonixAdId?: string | null;
  slug?: string;
  /** Directory row status after publish (e.g. `pending_review` when moderation mode is on). */
  listingStatus?: string;
  /**
   * Gate SERVICIOS-1 — media refs the shared listing-media contract could not persist (local
   * `blob:` / `data:` / unuploaded picks) and therefore dropped from the saved listing. Present
   * (non-empty) means the publish SUCCEEDED but with fewer media items than the owner selected.
   */
  droppedUnpersistableMedia?: string[];
  persistence?: ServiciosPublishPersistence;
  persistedToDatabase?: boolean;
  persistedToDevWorkspace?: boolean;
  /** Legacy field — same as persistedToDatabase */
  persisted?: boolean;
  profile?: ServiciosBusinessProfile;
  missing?: { id?: string; label: string }[];
  error?: string;
  message?: string;
  detail?: string;
};

export const SERVICIOS_EXISTING_PUBLIC_SLUG_SESSION_KEY = "servicios_last_published_slug";

/**
 * Gate SERVICIOS-1 — canonical persistence identity carried alongside the public slug.
 *
 * The slug is public ROUTING/display identity and can change whenever the owner renames the
 * business; this row UUID never does. The publish API prefers it over the slug so an edit-save
 * always UPDATEs the real published row instead of allocating a new slug and INSERTing a duplicate.
 */
export const SERVICIOS_EXISTING_LISTING_ID_SESSION_KEY = "servicios_last_published_listing_id";

export function primeServiciosExistingPublicSlug(slug: string | null | undefined): void {
  if (typeof window === "undefined") return;
  const trimmed = slug?.trim();
  try {
    if (trimmed) window.sessionStorage.setItem(SERVICIOS_EXISTING_PUBLIC_SLUG_SESSION_KEY, trimmed);
    else window.sessionStorage.removeItem(SERVICIOS_EXISTING_PUBLIC_SLUG_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function primeServiciosExistingListingId(listingId: string | null | undefined): void {
  if (typeof window === "undefined") return;
  const trimmed = listingId?.trim();
  try {
    if (trimmed) window.sessionStorage.setItem(SERVICIOS_EXISTING_LISTING_ID_SESSION_KEY, trimmed);
    else window.sessionStorage.removeItem(SERVICIOS_EXISTING_LISTING_ID_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

const MAX_TRANSPORT_BYTES = 1024 * 1024;

function devLogTransport(body: Record<string, unknown>, byteSize: number) {
  if (process.env.NODE_ENV !== "development") return;
  const state = body.state as ClasificadosServiciosApplicationState | undefined;
  const mediaHints = {
    logoLen: state?.logoUrl?.length ?? 0,
    coverLen: state?.coverUrl?.length ?? 0,
    galleryCount: state?.gallery?.length ?? 0,
    galleryDataish: (state?.gallery ?? []).filter((g) => g.url?.startsWith("data:")).length,
  };
  console.log("[servicios publish] transport", {
    kb: (byteSize / 1024).toFixed(1),
    topLevelKeys: Object.keys(body),
    mediaHints,
  });
}

export async function postServiciosPublishApi(args: {
  state: ClasificadosServiciosApplicationState;
  lang: ServiciosLang;
  accessToken?: string | null;
  /** "pending_payment" saves hidden before Revenue OS checkout. */
  activationMode?: "pending_payment";
  /** Canonical row id to update. Overrides the primed session value when supplied directly. */
  existingListingId?: string | null;
}): Promise<{ res: Response; data: ServiciosPublishApiResponse }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (args.accessToken) {
    headers.Authorization = `Bearer ${args.accessToken}`;
  }

  const existingPublicSlug =
    typeof window !== "undefined"
      ? sessionStorage.getItem(SERVICIOS_EXISTING_PUBLIC_SLUG_SESSION_KEY) ?? undefined
      : undefined;

  const existingListingId =
    args.existingListingId?.trim() ||
    (typeof window !== "undefined"
      ? sessionStorage.getItem(SERVICIOS_EXISTING_LISTING_ID_SESSION_KEY) ?? undefined
      : undefined);

  let resolved: ClasificadosServiciosApplicationState;
  let skippedOversizedVideos = false;
  let videoPublishDiagnostics: { videoId: string; reason: string }[] | undefined;
  try {
    const r = await resolveServiciosDraftMediaToRemoteUrls(args.state, args.lang);
    resolved = r.state;
    skippedOversizedVideos = r.skippedOversizedVideos;
    videoPublishDiagnostics = r.videoPublishDiagnostics;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    let error: string = "media_upload_failed";
    if (message === "image_too_large_after_compression" || message.startsWith("image_too_large_after_compression")) {
      error = "image_too_large_after_compression";
    } else if (message === "file_too_large_for_upload" || message.startsWith("file_too_large_for_upload")) {
      error = "file_too_large_for_upload";
    } else if (message === "media_upload_payload_too_large" || message.includes("media_upload_payload_too_large")) {
      error = "media_upload_payload_too_large";
    }
    const res = new Response(JSON.stringify({ ok: false, error, message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
    return { res, data: { ok: false, error, message } };
  }

  const body = buildServiciosPublishTransportBody(
    resolved,
    args.lang,
    existingPublicSlug,
    videoPublishDiagnostics,
    args.activationMode,
    existingListingId,
  );
  const raw = JSON.stringify(body);
  const byteSize = new Blob([raw]).size;
  devLogTransport(body as unknown as Record<string, unknown>, byteSize);

  if (byteSize > MAX_TRANSPORT_BYTES) {
    const detail = `El envío del perfil supera 1 MB (${(byteSize / 1024).toFixed(0)} KB). Reduce imágenes o texto.`;
    const res = new Response(
      JSON.stringify({
        ok: false,
        error: "payload_too_large_client",
        message: detail,
        detail: `${(byteSize / 1024).toFixed(1)} KB`,
      }),
      { status: 413, headers: { "Content-Type": "application/json" } },
    );
    return { res, data: { ok: false, error: "payload_too_large_client", message: detail, detail: `${(byteSize / 1024).toFixed(1)} KB` } };
  }

  const res = await fetch("/api/clasificados/servicios/publish", {
    method: "POST",
    headers,
    body: raw,
  });
  const data = (await res.json()) as ServiciosPublishApiResponse;

  if (data.ok && skippedOversizedVideos) {
    data.skippedOversizedVideos = true;
  }

  if (typeof window !== "undefined" && data.ok && data.slug) {
    sessionStorage.setItem(SERVICIOS_EXISTING_PUBLIC_SLUG_SESSION_KEY, data.slug);
  }
  // Gate SERVICIOS-1 — carry the canonical row id forward so the next save in this session targets
  // the same row even if the owner renames the business (which changes the slug).
  if (data.ok && data.listingId) {
    primeServiciosExistingListingId(data.listingId);
  }

  return { res, data };
}
