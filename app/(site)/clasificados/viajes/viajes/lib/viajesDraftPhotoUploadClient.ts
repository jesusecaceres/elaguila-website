import { isViajesDurableHttpsUrl } from "./v2/viajesMediaDurableGuards";

export const VIAJES_DRAFT_PHOTO_UPLOAD_PATH = "/api/clasificados/viajes/media/draft-photo-upload";

export type ViajesDraftPhotoUploadSlot = "hero" | "gallery" | "logo" | "module";

export type ViajesDraftPhotoUploadOk = {
  ok: true;
  publicUrl: string;
  pathname?: string;
  mimeType?: string;
  byteSize?: number;
};

export type ViajesDraftPhotoUploadErr = {
  ok: false;
  error: string;
  detail?: string;
  status?: number;
};

export type ViajesDraftPhotoUploadResult = ViajesDraftPhotoUploadOk | ViajesDraftPhotoUploadErr;

export async function uploadViajesDraftPhoto(opts: {
  file: Blob;
  draftId: string;
  slot: ViajesDraftPhotoUploadSlot;
  index?: number;
  bearerToken: string;
  signal?: AbortSignal;
  onProgress?: (pct: number) => void;
  fileName?: string;
}): Promise<ViajesDraftPhotoUploadResult> {
  if (!opts.bearerToken.trim()) {
    return { ok: false, error: "auth_required", status: 401 };
  }

  const form = new FormData();
  form.set("draftId", opts.draftId);
  form.set("slot", opts.slot);
  if (opts.index !== undefined) form.set("index", String(opts.index));
  form.set("file", opts.file, opts.fileName || "image.jpg");

  return await new Promise<ViajesDraftPhotoUploadResult>((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", VIAJES_DRAFT_PHOTO_UPLOAD_PATH);
    xhr.setRequestHeader("Authorization", `Bearer ${opts.bearerToken}`);

    xhr.upload.onprogress = (ev) => {
      if (!ev.lengthComputable) return;
      const pct = Math.max(0, Math.min(100, Math.round((ev.loaded / ev.total) * 100)));
      opts.onProgress?.(pct);
    };

    const onAbort = () => {
      try {
        xhr.abort();
      } catch {
        /* ignore */
      }
      resolve({ ok: false, error: "aborted", status: 0 });
    };
    if (opts.signal) {
      if (opts.signal.aborted) {
        onAbort();
        return;
      }
      opts.signal.addEventListener("abort", onAbort, { once: true });
    }

    xhr.onload = () => {
      let json: Record<string, unknown> = {};
      try {
        json = JSON.parse(xhr.responseText) as Record<string, unknown>;
      } catch {
        json = {};
      }
      if (xhr.status >= 200 && xhr.status < 300 && json.ok === true && typeof json.publicUrl === "string") {
        const publicUrl = String(json.publicUrl);
        if (!isViajesDurableHttpsUrl(publicUrl)) {
          resolve({ ok: false, error: "invalid_public_url", status: xhr.status });
          return;
        }
        resolve({
          ok: true,
          publicUrl,
          pathname: typeof json.pathname === "string" ? json.pathname : undefined,
          mimeType: typeof json.mimeType === "string" ? json.mimeType : undefined,
          byteSize: typeof json.byteSize === "number" ? json.byteSize : undefined,
        });
        return;
      }
      resolve({
        ok: false,
        error: typeof json.error === "string" ? json.error : `upload_http_${xhr.status}`,
        detail: typeof json.detail === "string" ? json.detail : undefined,
        status: xhr.status,
      });
    };
    xhr.onerror = () => resolve({ ok: false, error: "network_error", status: 0 });
    xhr.send(form);
  });
}

/** Up to 2 retries on network/5xx only. */
export async function uploadViajesDraftPhotoWithRetry(
  opts: Parameters<typeof uploadViajesDraftPhoto>[0],
  retries = 2
): Promise<ViajesDraftPhotoUploadResult> {
  let last: ViajesDraftPhotoUploadResult = { ok: false, error: "upload_failed" };
  for (let attempt = 0; attempt <= retries; attempt++) {
    last = await uploadViajesDraftPhoto(opts);
    if (last.ok) return last;
    if (last.error === "aborted" || last.error === "auth_required") return last;
    if (last.status && last.status >= 400 && last.status < 500 && last.status !== 503) return last;
    if (attempt < retries) {
      await new Promise((r) => setTimeout(r, 350 * (attempt + 1)));
    }
  }
  return last;
}
