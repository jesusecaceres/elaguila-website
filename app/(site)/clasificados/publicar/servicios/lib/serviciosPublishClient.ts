"use client";

import type { ServiciosBusinessProfile } from "@/app/servicios/types/serviciosBusinessProfile";
import type { ClasificadosServiciosApplicationState } from "./clasificadosServiciosApplicationTypes";
import type { ServiciosLang } from "./clasificadosServiciosApplicationTypes";
import { buildServiciosPublishTransportBody } from "./buildServiciosPublishPayload";
import { resolveServiciosDraftMediaToRemoteUrls } from "./serviciosDraftPublishPrepare";

export type ServiciosPublishPersistence = "database" | "dev_workspace" | "none";

export type ServiciosPublishApiResponse = {
  ok?: boolean;
  slug?: string;
  /** Directory row status after publish (e.g. `pending_review` when moderation mode is on). */
  listingStatus?: string;
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

const SESSION_SLUG_KEY = "servicios_last_published_slug";

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
}): Promise<{ res: Response; data: ServiciosPublishApiResponse }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (args.accessToken) {
    headers.Authorization = `Bearer ${args.accessToken}`;
  }

  const existingPublicSlug =
    typeof window !== "undefined" ? sessionStorage.getItem(SESSION_SLUG_KEY) ?? undefined : undefined;

  let resolved: ClasificadosServiciosApplicationState;
  try {
    resolved = await resolveServiciosDraftMediaToRemoteUrls(args.state);
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

  const body = buildServiciosPublishTransportBody(resolved, args.lang, existingPublicSlug);
  const raw = JSON.stringify(body);
  const byteSize = new Blob([raw]).size;
  devLogTransport(body as unknown as Record<string, unknown>, byteSize);

  if (byteSize > MAX_TRANSPORT_BYTES) {
    const detail = `El cuerpo del anuncio supera 1 MB (${(byteSize / 1024).toFixed(0)} KB). Reduce imágenes o texto.`;
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

  if (typeof window !== "undefined" && data.ok && data.slug) {
    sessionStorage.setItem(SESSION_SLUG_KEY, data.slug);
  }

  return { res, data };
}
