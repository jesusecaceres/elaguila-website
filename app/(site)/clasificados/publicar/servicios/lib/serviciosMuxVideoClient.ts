"use client";

import type { ServiciosLang } from "./clasificadosServiciosApplicationTypes";

type MuxDirectUploadPayload = {
  ok?: boolean;
  error?: string;
  errorType?: string;
  uploadId?: string;
  uploadUrl?: string;
};

type MuxStatusPayload = {
  ok?: boolean;
  error?: string;
  errorType?: string;
  muxStatus?: string;
  assetId?: string;
  playbackId?: string;
  thumbnailUrl?: string;
  playbackUrl?: string;
  durationSeconds?: number | null;
};

function uploadFileToUrl(file: File, uploadUrl: string, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.timeout = 900_000;
    const contentType = file.type?.trim() || "application/octet-stream";
    try {
      xhr.setRequestHeader("Content-Type", contentType);
    } catch {
      /* ignore */
    }
    xhr.upload.onprogress = (ev) => {
      if (!ev.lengthComputable) return;
      onProgress(Math.max(0, Math.min(100, Math.round((ev.loaded / ev.total) * 100))));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`PUT_${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error("PUT_0"));
    xhr.ontimeout = () => reject(new Error("PUT_timeout"));
    xhr.send(file);
  });
}

function muxInitMessage(lang: ServiciosLang): string {
  return lang === "en"
    ? "Could not start video upload. Try a public link (YouTube, .mp4) or check Mux configuration."
    : "No se pudo iniciar la subida de video. Prueba un enlace público (YouTube, .mp4) o revisa la configuración de Mux.";
}

function muxDirectUploadInitUserMessage(lang: ServiciosLang, payload: MuxDirectUploadPayload): string {
  const et = (payload.errorType ?? "").trim();
  const err = (payload.error ?? "").trim();
  if (et === "missing_env" || et === "mux_auth_failure") {
    return lang === "en"
      ? "Video service is not configured or Mux credentials are invalid. Use a public video link or set MUX_TOKEN_ID / MUX_TOKEN_SECRET."
      : "El servicio de video no está configurado o las credenciales Mux no son válidas. Usa un enlace público o configura MUX_TOKEN_ID / MUX_TOKEN_SECRET.";
  }
  if (et === "mux_cors_origin_required") {
    return lang === "en"
      ? "Mux CORS origin could not be resolved. Set MUX_CORS_ORIGIN to your public site URL, or paste a video link."
      : "No se pudo resolver el origen CORS para Mux. Define MUX_CORS_ORIGIN con tu URL pública o pega un enlace de video.";
  }
  if (et === "mux_rate_limited") {
    return lang === "en" ? "Mux rate-limited uploads. Wait a minute or use a video link." : "Mux limitó la tasa de subidas. Espera un minuto o usa un enlace de video.";
  }
  if (et === "mux_account_billing") {
    return lang === "en"
      ? "Mux reported billing/plan issues. Use a public link or check the Mux dashboard."
      : "Mux reportó facturación o plan. Usa un enlace público o revisa el panel de Mux.";
  }
  if (et === "mux_bad_request" || et === "mux_upstream_error" || et === "mux_bad_response") {
    return err ? (lang === "en" ? `Mux rejected upload: ${err}` : `Mux rechazó la subida: ${err}`) : muxInitMessage(lang);
  }
  if (err) return lang === "en" ? `Upload could not start: ${err}` : `No pudimos iniciar la subida: ${err}`;
  return muxInitMessage(lang);
}

function muxStatusPollUserMessage(lang: ServiciosLang, payload: MuxStatusPayload): string {
  const et = (payload.errorType ?? "").trim();
  const err = (payload.error ?? "").trim();
  if (et === "missing_env" || et === "mux_status_upstream") {
    return err || (lang === "en" ? "Could not read Mux processing status. Use a link or retry." : "No pudimos consultar el estado en Mux. Usa un enlace o reintenta.");
  }
  if (err) return err;
  return lang === "en" ? "Video processing did not finish. Try again or use a link." : "No pudimos terminar de procesar el video. Prueba de nuevo o usa un enlace.";
}

function muxPutMessage(lang: ServiciosLang, code: number): string {
  if (!code || code === 0) return lang === "en" ? "Network error while uploading." : "Error de red al subir el archivo.";
  if (code >= 400 && code < 500) return muxInitMessage(lang);
  return lang === "en" ? "Upload could not complete. Check your connection." : "No se pudo completar la subida. Comprueba tu conexión.";
}

export type ServiciosMuxVideoUploadOk = {
  ok: true;
  playbackId: string;
  assetId: string;
  playbackUrl: string;
  thumbnailUrl: string;
  durationSeconds: number | null;
};

export type ServiciosMuxVideoUploadErr = {
  ok: false;
  error: string;
  errorType?: string;
};

/**
 * Browser → Mux direct upload + poll until ready (same flow as En Venta / Bienes Raíces).
 * Used when publishing Servicios so gallery videos are not limited to the small Blob draft cap.
 */
export async function uploadServiciosGalleryVideoFileToMux(
  file: File,
  slot: 0 | 1,
  lang: ServiciosLang,
  onProgress?: (pct: number) => void,
): Promise<ServiciosMuxVideoUploadOk | ServiciosMuxVideoUploadErr> {
  try {
    const req = await fetch("/api/mux/direct-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slot }),
      cache: "no-store",
    });
    const payload = (await req.json().catch(() => ({}))) as MuxDirectUploadPayload;

    if (!req.ok || !payload.ok || !payload.uploadId || !payload.uploadUrl) {
      return { ok: false, error: muxDirectUploadInitUserMessage(lang, payload), errorType: payload.errorType };
    }

    try {
      await uploadFileToUrl(file, payload.uploadUrl, (pct) => onProgress?.(pct));
    } catch (putErr: unknown) {
      const msg = putErr instanceof Error ? putErr.message : "";
      if (msg === "PUT_timeout") {
        return {
          ok: false,
          error:
            lang === "en"
              ? "Upload timed out. Try a smaller file or paste a YouTube / public link."
              : "La subida tardó demasiado. Prueba un archivo más pequeño o pega un enlace (YouTube, etc.).",
        };
      }
      const statusMatch = /^PUT_(\d+)$/.exec(msg);
      const code = statusMatch ? Number(statusMatch[1]) : 0;
      return { ok: false, error: muxPutMessage(lang, code) };
    }

    let tries = 0;
    while (tries < 40) {
      tries += 1;
      await new Promise((r) => setTimeout(r, 2500));
      const statusRes = await fetch(`/api/mux/upload-status?uploadId=${encodeURIComponent(payload.uploadId)}`, {
        cache: "no-store",
      });
      const statusPayload = (await statusRes.json().catch(() => ({}))) as MuxStatusPayload;

      if (!statusRes.ok || !statusPayload.ok) {
        return { ok: false, error: muxStatusPollUserMessage(lang, statusPayload), errorType: statusPayload.errorType };
      }

      const muxStatus = (statusPayload.muxStatus ?? "").toLowerCase();
      if (muxStatus === "ready") {
        const playbackId = String(statusPayload.playbackId ?? "").trim();
        const assetId = String(statusPayload.assetId ?? "").trim();
        const playbackUrl = String(statusPayload.playbackUrl ?? "").trim();
        const thumbnailUrl = String(statusPayload.thumbnailUrl ?? "").trim();
        if (!playbackId || !playbackUrl) {
          return {
            ok: false,
            error: lang === "en" ? "Mux did not return playback data." : "Mux no devolvió datos de reproducción.",
            errorType: "mux_missing_playback",
          };
        }
        return {
          ok: true,
          playbackId,
          assetId,
          playbackUrl,
          thumbnailUrl,
          durationSeconds: typeof statusPayload.durationSeconds === "number" ? statusPayload.durationSeconds : null,
        };
      }
    }

    return {
      ok: false,
      error: lang === "en" ? "Video processing took too long. Try a shorter file or a public link." : "El video tardó demasiado en procesarse. Prueba un archivo más corto o un enlace público.",
      errorType: "mux_processing_timeout",
    };
  } catch {
    return {
      ok: false,
      error: lang === "en" ? "Unexpected error during video upload." : "Error inesperado durante la subida del video.",
      errorType: "mux_client_exception",
    };
  }
}
