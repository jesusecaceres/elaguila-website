import type { AutosClassifiedsLane, AutosClassifiedsListingStatus } from "./autosClassifiedsTypes";
import { autosLiveVehiclePath } from "@/app/clasificados/autos/filters/autosBrowseFilterContract";

/** Max JSON body for Autos listing create/update (matches Servicios publish guard). */
export const AUTOS_LISTING_API_MAX_BODY_BYTES = 1024 * 1024;

export type AutosPublishApiErrorCode =
  | "AUTH_REQUIRED"
  | "INVALID_JSON"
  | "INVALID_AUTOS_PAYLOAD"
  | "PAYLOAD_TOO_LARGE"
  | "HEAVY_MEDIA_DETECTED"
  | "LOCAL_VIDEO_URL_REQUIRED"
  | "PHOTO_UPLOAD_REQUIRED"
  | "DB_NOT_CONFIGURED"
  | "AUTOS_SUPABASE_INSERT_FAILED"
  | "AUTOS_SUPABASE_UPDATE_FAILED"
  | "CREATE_FAILED"
  | "UPDATE_FAILED"
  | "NOT_FOUND"
  | "REQUEST_TIMEOUT"
  | "AUTOS_NEGOCIOS_QA_ALLOWLIST_MISSING";

export type AutosListingApiSuccessListing = {
  id: string;
  leonixAdId: string | null;
  lane: AutosClassifiedsLane;
  status: AutosClassifiedsListingStatus;
  publicUrl: string;
};

export function buildAutosListingApiSuccessPayload(input: {
  id: string;
  leonixAdId: string | null;
  lane: AutosClassifiedsLane;
  status: AutosClassifiedsListingStatus;
  persistWarnings?: string[];
}): {
  ok: true;
  id: string;
  listing: AutosListingApiSuccessListing;
  status: AutosClassifiedsListingStatus;
  persistWarnings?: string[];
} {
  return {
    ok: true,
    id: input.id,
    listing: {
      id: input.id,
      leonixAdId: input.leonixAdId,
      lane: input.lane,
      status: input.status,
      publicUrl: autosLiveVehiclePath(input.id),
    },
    status: input.status,
    ...(input.persistWarnings?.length ? { persistWarnings: input.persistWarnings } : {}),
  };
}

export function buildAutosListingApiErrorPayload(input: {
  errorCode: AutosPublishApiErrorCode;
  message: string;
  details?: string;
  legacyError?: string;
}): {
  ok: false;
  errorCode: AutosPublishApiErrorCode;
  message: string;
  details?: string;
  error?: string;
} {
  return {
    ok: false,
    errorCode: input.errorCode,
    message: input.message,
    ...(input.details ? { details: input.details } : {}),
    ...(input.legacyError ? { error: input.legacyError } : {}),
  };
}

export function autosConfirmErrorMessage(
  lang: "es" | "en",
  errorCode: string | undefined,
  fallbackMessage?: string,
): string {
  const es = lang === "es";
  switch (errorCode) {
    case "AUTH_REQUIRED":
    case "unauthorized":
      return es
        ? "Inicia sesión para guardar y publicar tu anuncio."
        : "Sign in to save and publish your listing.";
    case "INVALID_AUTOS_PAYLOAD":
    case "invalid_body":
      return es
        ? "Faltan datos del anuncio o el borrador no es válido. Vuelve a editar y completa los campos requeridos."
        : "Listing data is missing or invalid. Go back to edit and complete required fields.";
    case "PAYLOAD_TOO_LARGE":
    case "payload_too_large":
      return es
        ? "El borrador es demasiado pesado para guardarlo. Quita fotos locales muy grandes o usa enlaces de imagen."
        : "The draft is too large to save. Remove oversized local photos or use image URLs.";
    case "HEAVY_MEDIA_DETECTED":
    case "heavy_media_detected":
      return es
        ? "Algunas fotos no se prepararon correctamente. Vuelve a intentar o elimina las fotos problemáticas."
        : "Some photos were not prepared correctly. Try again or remove problematic photos.";
    case "LOCAL_VIDEO_URL_REQUIRED":
    case "local_video_url_required":
      return es
        ? "Los videos deben ser enlaces externos. Agrega un enlace de YouTube, TikTok, Facebook, Instagram o sitio web."
        : "Videos must be external links. Add a YouTube, TikTok, Facebook, Instagram, or website video link.";
    case "PHOTO_UPLOAD_REQUIRED":
    case "photo_upload_required":
      return es
        ? "No pudimos preparar tus fotos. Inténtalo de nuevo o elimina las fotos que no se puedan subir."
        : "We could not prepare your photos. Try again or remove photos that cannot be uploaded.";
    case "AUTOS_SUPABASE_INSERT_FAILED":
    case "AUTOS_SUPABASE_UPDATE_FAILED":
    case "create_failed":
    case "update_failed":
      return es
        ? "No pudimos guardar tu anuncio en Leonix. Intenta de nuevo en un momento."
        : "We could not save your listing on Leonix. Try again in a moment.";
    case "DB_NOT_CONFIGURED":
    case "db_not_configured":
      return es
        ? "El sistema de Autos no está configurado todavía. Avísanos si el problema continúa."
        : "Autos storage is not configured yet. Contact us if this continues.";
    case "REQUEST_TIMEOUT":
      return es
        ? "La solicitud tardó demasiado. Revisa tu conexión e intenta de nuevo."
        : "The request took too long. Check your connection and try again.";
    case "AUTOS_NEGOCIOS_QA_ALLOWLIST_MISSING":
      return es
        ? "Tu cuenta todavía no está habilitada para publicar este anuncio de prueba. Revisa la configuración de QA de Autos Negocios."
        : "Your account is not enabled for this QA publish yet. Check Autos Negocios QA configuration.";
    default:
      return fallbackMessage ?? (es ? "No pudimos preparar tu anuncio." : "We could not prepare your ad.");
  }
}

/** Server safety net: local/blob video refs that must never reach persistence. */
export function detectAutosLocalVideoTransport(value: unknown, path = ""): string[] {
  const out: string[] = [];
  if (typeof value === "string") {
    const t = value;
    if (t.startsWith("data:video/") || /^data:application\/.*video/i.test(t)) {
      out.push(`data_video_url:${path}`);
    }
    if (t.startsWith("blob:") && /video|blob:/i.test(path)) {
      out.push(`blob_video_url:${path}`);
    }
    if (
      t.startsWith("blob:") &&
      (path.includes("videoUrl") || path.includes("videoUrls") || path.includes("videoFileDataUrl"))
    ) {
      out.push(`blob_video_url:${path}`);
    }
    return out;
  }
  if (Array.isArray(value)) {
    const cap = Math.min(value.length, 120);
    for (let i = 0; i < cap; i++) {
      out.push(...detectAutosLocalVideoTransport(value[i], `${path}[${i}]`));
    }
    return out;
  }
  if (typeof value === "object" && value !== null) {
    const keys = Object.keys(value as object);
    const cap = Math.min(keys.length, 180);
    for (let i = 0; i < cap; i++) {
      const k = keys[i]!;
      out.push(...detectAutosLocalVideoTransport((value as Record<string, unknown>)[k], path ? `${path}.${k}` : k));
    }
  }
  return out;
}

/** Detect transport payloads that will hang or exceed serverless limits (Servicios-style). */
export function detectAutosHeavyTransport(value: unknown, path = ""): string[] {
  const out: string[] = [];
  if (typeof value === "string") {
    const t = value;
    if (t.startsWith("data:image/") || t.startsWith("data:video/") || /^data:application\//i.test(t)) {
      out.push(`data_url:${path}`);
    }
    if (t.startsWith("blob:")) out.push(`blob_url:${path}`);
    if (t.length > 600_000) out.push(`string_too_large:${path}:${t.length}`);
    return out;
  }
  if (Array.isArray(value)) {
    const cap = Math.min(value.length, 120);
    for (let i = 0; i < cap; i++) {
      out.push(...detectAutosHeavyTransport(value[i], `${path}[${i}]`));
    }
    return out;
  }
  if (typeof value === "object" && value !== null) {
    const keys = Object.keys(value as object);
    const cap = Math.min(keys.length, 180);
    for (let i = 0; i < cap; i++) {
      const k = keys[i]!;
      out.push(...detectAutosHeavyTransport((value as Record<string, unknown>)[k], path ? `${path}.${k}` : k));
    }
  }
  return out;
}
