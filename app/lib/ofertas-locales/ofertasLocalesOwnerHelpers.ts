/**
 * Ofertas Locales owner dashboard — safe projections (FINAL-3).
 * Never expose raw internal_notes to owner clients.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  mapOfertaLocalAdminRowToDetailVm,
  OFERTAS_LOCALES_ADMIN_SELECT,
  parseOfertaLocalAdminMetadataFromInternalNotes,
  type OfertaLocalAdminRow,
} from "./ofertasLocalesAdminHelpers";
import { isOfertaLocalExpired } from "./ofertasLocalesFormatting";
import type { OfertaLocalPublishStatus } from "./ofertasLocalesTypes";

const ADMIN_REVIEW_PREFIX = "[admin_review]";

export const OFERTAS_LOCALES_OWNER_EDITABLE_STATUSES: readonly OfertaLocalPublishStatus[] = [
  "draft",
  "submitted",
  "pending_review",
  "rejected",
] as const;

export type OfertaLocalOwnerListItem = {
  id: string;
  businessName: string;
  title: string;
  offerType: string;
  businessCategory: string;
  city: string;
  zipCode: string;
  status: OfertaLocalPublishStatus;
  displayStatus: string;
  validFrom: string;
  validUntil: string;
  submittedAt: string;
  assetCount: number;
  wantsAiSearchableSpecials: boolean;
  featuredRequested: boolean;
  featuredPlacementScope: string | null;
  rejectionNote: string | null;
  canEdit: boolean;
  publicResultsHref: string | null;
};

export type OfertaLocalOwnerDetail = Omit<
  ReturnType<typeof mapOfertaLocalAdminRowToDetailVm>,
  "internalNotes" | "ownerId"
> & {
  displayStatus: string;
  statusMessage: string;
  rejectionNote: string | null;
  canEdit: boolean;
  isExpired: boolean;
  publicResultsHref: string | null;
};

export function ofertaLocalOwnerStatusLabel(
  status: OfertaLocalPublishStatus,
  lang: "es" | "en",
  isExpired = false
): string {
  if (isExpired && status === "approved") {
    return lang === "es" ? "Expirada" : "Expired";
  }
  const es: Record<OfertaLocalPublishStatus, string> = {
    draft: "Borrador",
    submitted: "Enviada",
    pending_review: "Pendiente de revisión",
    approved: "Aprobada",
    rejected: "Rechazada",
    archived: "Archivada",
    expired: "Expirada",
  };
  const en: Record<OfertaLocalPublishStatus, string> = {
    draft: "Draft",
    submitted: "Submitted",
    pending_review: "Pending review",
    approved: "Approved",
    rejected: "Rejected",
    archived: "Archived",
    expired: "Expired",
  };
  return (lang === "es" ? es : en)[status] ?? status;
}

export function ofertaLocalOwnerStatusMessage(
  status: OfertaLocalPublishStatus,
  lang: "es" | "en",
  rejectionNote: string | null
): string {
  if (status === "pending_review" || status === "submitted" || status === "draft") {
    return lang === "es" ? "Tu oferta está en revisión." : "Your offer is under review.";
  }
  if (status === "approved") {
    return lang === "es" ? "Tu oferta fue aprobada." : "Your offer was approved.";
  }
  if (status === "rejected") {
    if (rejectionNote?.trim()) return rejectionNote.trim();
    return lang === "es"
      ? "Tu oferta fue rechazada. Contacta a Leonix para más detalles."
      : "Your offer was rejected. Contact Leonix for more details.";
  }
  if (status === "archived") {
    return lang === "es"
      ? "Esta oferta está archivada. Contacta a Leonix si necesitas reactivarla."
      : "This offer is archived. Contact Leonix if you need it restored.";
  }
  return "";
}

/** Owner-safe: only reject-action admin notes intended for the submitter. */
export function parseOfertaLocalOwnerSafeRejectionNote(
  internalNotes: string | null | undefined
): string | null {
  const text = String(internalNotes ?? "");
  const notes: string[] = [];
  let searchFrom = 0;
  while (true) {
    const idx = text.indexOf(ADMIN_REVIEW_PREFIX, searchFrom);
    if (idx < 0) break;
    const chunk = text.slice(idx + ADMIN_REVIEW_PREFIX.length).trim();
    const end = chunk.search(/\n\n|\[ofertas_locales_metadata\]|\[admin_review\]/);
    const jsonPart = end >= 0 ? chunk.slice(0, end).trim() : chunk;
    try {
      const parsed = JSON.parse(jsonPart) as { action?: string; note?: string };
      if (parsed.action === "reject" && typeof parsed.note === "string" && parsed.note.trim()) {
        notes.push(parsed.note.trim().slice(0, 2000));
      }
    } catch {
      /* ignore */
    }
    searchFrom = idx + ADMIN_REVIEW_PREFIX.length + jsonPart.length;
  }
  if (!notes.length) return null;
  return notes[notes.length - 1] ?? null;
}

function resolveDisplayStatus(
  row: OfertaLocalAdminRow,
  lang: "es" | "en"
): { displayStatus: string; isExpired: boolean } {
  const expired = isOfertaLocalExpired(row.valid_until);
  if (expired && row.status === "approved") {
    return { displayStatus: ofertaLocalOwnerStatusLabel("expired", lang, true), isExpired: true };
  }
  return {
    displayStatus: ofertaLocalOwnerStatusLabel(row.status, lang, expired),
    isExpired: expired,
  };
}

function publicResultsHrefForStatus(status: OfertaLocalPublishStatus, isExpired: boolean): string | null {
  if (status === "approved" && !isExpired) return "/clasificados/ofertas-locales";
  return null;
}

export function mapOfertaLocalRowToOwnerListItem(
  row: OfertaLocalAdminRow,
  lang: "es" | "en"
): OfertaLocalOwnerListItem {
  const detail = mapOfertaLocalAdminRowToDetailVm(row);
  const metadata = parseOfertaLocalAdminMetadataFromInternalNotes(row.internal_notes);
  const rejectionNote = parseOfertaLocalOwnerSafeRejectionNote(row.internal_notes);
  const { displayStatus, isExpired } = resolveDisplayStatus(row, lang);

  return {
    id: row.id,
    businessName: detail.businessName,
    title: detail.title,
    offerType: detail.offerType,
    businessCategory: detail.businessCategory,
    city: detail.city,
    zipCode: detail.zipCode,
    status: row.status,
    displayStatus,
    validFrom: detail.validFrom,
    validUntil: detail.validUntil,
    submittedAt: detail.submittedAt,
    assetCount: detail.flyerAssets.length + detail.couponAssets.length,
    wantsAiSearchableSpecials: metadata.wantsAiSearchableSpecials,
    featuredRequested: detail.featuredRequested,
    featuredPlacementScope: detail.featuredPlacementScope,
    rejectionNote,
    canEdit: OFERTAS_LOCALES_OWNER_EDITABLE_STATUSES.includes(row.status),
    publicResultsHref: publicResultsHrefForStatus(row.status, isExpired),
  };
}

export function mapOfertaLocalRowToOwnerDetail(
  row: OfertaLocalAdminRow,
  lang: "es" | "en"
): OfertaLocalOwnerDetail {
  const vm = mapOfertaLocalAdminRowToDetailVm(row);
  const rejectionNote = parseOfertaLocalOwnerSafeRejectionNote(row.internal_notes);
  const { displayStatus, isExpired } = resolveDisplayStatus(row, lang);
  const { internalNotes: _i, ownerId: _o, ...safe } = vm;

  return {
    ...safe,
    displayStatus,
    statusMessage: ofertaLocalOwnerStatusMessage(row.status, lang, rejectionNote),
    rejectionNote,
    canEdit: OFERTAS_LOCALES_OWNER_EDITABLE_STATUSES.includes(row.status),
    isExpired,
    publicResultsHref: publicResultsHrefForStatus(row.status, isExpired),
  };
}

export async function listOfertasLocalesForOwner(
  sb: SupabaseClient,
  ownerId: string,
  limit = 80
): Promise<OfertaLocalAdminRow[]> {
  const { data, error } = await sb
    .from("ofertas_locales")
    .select(OFERTAS_LOCALES_ADMIN_SELECT)
    .eq("owner_id", ownerId)
    .order("submitted_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 200));

  if (error || !data) return [];
  return data as OfertaLocalAdminRow[];
}

export async function getOfertaLocalForOwner(
  sb: SupabaseClient,
  ownerId: string,
  offerId: string
): Promise<OfertaLocalAdminRow | null> {
  const { data, error } = await sb
    .from("ofertas_locales")
    .select(OFERTAS_LOCALES_ADMIN_SELECT)
    .eq("id", offerId)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (error || !data) return null;
  return data as OfertaLocalAdminRow;
}
