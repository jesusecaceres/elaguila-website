/**
 * Program 4, Gate 4A — controlled value sets for Field Discovery. Mirrors the CHECK constraints
 * in supabase/migrations/20260810120000_field_discovery_canvassing_foundation.sql exactly.
 */
import type {
  ConsentMethod,
  ConsentType,
  SourceCollectionMethod,
  SourceFileKind,
  SourceFileUploadStatus,
  SourceLinkStatus,
  SourceType,
} from "./types";

type LabeledOption<T extends string> = { value: T; es: string; en: string };

export const FIELD_DISCOVERY_CANVASSING_FLAG_KEY = "field_discovery_canvassing";
export const FIELD_DISCOVERY_AI_RESEARCH_FLAG_KEY = "field_discovery_ai_research";

export const SOURCE_TYPES: readonly LabeledOption<SourceType>[] = [
  { value: "website", es: "Sitio web", en: "Website" },
  { value: "google_business", es: "Perfil de Google Business", en: "Google Business Profile" },
  { value: "facebook", es: "Facebook", en: "Facebook" },
  { value: "instagram", es: "Instagram", en: "Instagram" },
  { value: "tiktok", es: "TikTok", en: "TikTok" },
  { value: "youtube", es: "YouTube", en: "YouTube" },
  { value: "linkedin", es: "LinkedIn", en: "LinkedIn" },
  { value: "yelp", es: "Yelp", en: "Yelp" },
  { value: "whatsapp", es: "WhatsApp", en: "WhatsApp" },
  { value: "other", es: "Otro", en: "Other" },
];
export const SOURCE_TYPE_VALUES: readonly SourceType[] = SOURCE_TYPES.map((o) => o.value);

export const SOURCE_COLLECTION_METHODS: readonly SourceCollectionMethod[] = [
  "canvassing",
  "owner_provided",
  "staff_entered",
  "manual_import",
];

export const SOURCE_LINK_STATUSES: readonly SourceLinkStatus[] = ["pending", "reachable", "unreachable", "researched", "archived"];

export const SOURCE_FILE_KINDS: readonly LabeledOption<SourceFileKind>[] = [
  { value: "business_card", es: "Tarjeta de presentación", en: "Business card" },
  { value: "menu", es: "Menú", en: "Menu" },
  { value: "flyer", es: "Volante", en: "Flyer" },
  { value: "logo", es: "Logo", en: "Logo" },
  { value: "photo", es: "Foto", en: "Photo" },
  { value: "screenshot", es: "Captura de pantalla", en: "Screenshot" },
  { value: "pdf", es: "PDF", en: "PDF" },
  { value: "price_list", es: "Lista de precios", en: "Price list" },
  { value: "service_list", es: "Lista de servicios", en: "Service list" },
  { value: "other", es: "Otro", en: "Other" },
];
export const SOURCE_FILE_KIND_VALUES: readonly SourceFileKind[] = SOURCE_FILE_KINDS.map((o) => o.value);

export const SOURCE_FILE_UPLOAD_STATUSES: readonly SourceFileUploadStatus[] = [
  "pending",
  "uploaded",
  "linked_to_evidence",
  "deleted",
  "failed",
];

export const CONSENT_TYPES: readonly LabeledOption<ConsentType>[] = [
  { value: "photo_capture", es: "Captura de fotos", en: "Photo capture" },
  { value: "file_upload", es: "Subida de archivos", en: "File upload" },
  { value: "source_research", es: "Investigación de fuentes", en: "Source research" },
  { value: "ai_research", es: "Investigación con IA", en: "AI research" },
  { value: "followup_contact", es: "Contacto de seguimiento", en: "Follow-up contact" },
];
export const CONSENT_TYPE_VALUES: readonly ConsentType[] = CONSENT_TYPES.map((o) => o.value);

export const CONSENT_METHODS: readonly ConsentMethod[] = ["verbal_at_visit", "written", "digital_form", "owner_dashboard"];

/** Minimum allowed MIME types for canvassing/discovery uploads (Bible §4A lock). */
export const FIELD_DISCOVERY_UPLOAD_MIME_TYPES: readonly string[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

/** Server-form upload path handles files at or below this size; larger files use client-direct Vercel Blob upload. */
export const FIELD_DISCOVERY_SERVER_UPLOAD_MAX_BYTES = 4 * 1024 * 1024;

/** Truthful Program 4 maximum — no unlimited upload. */
export const FIELD_DISCOVERY_UPLOAD_MAX_BYTES = 25 * 1024 * 1024;

export const FIELD_DISCOVERY_BLOB_PATH_PREFIX = "field-discovery";

export const MAX_BUSINESS_NAME_LENGTH = 200;
export const MAX_NOTE_LENGTH = 4000;
