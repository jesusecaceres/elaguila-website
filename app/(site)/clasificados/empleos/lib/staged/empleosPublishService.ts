import type { EmpleosPublishEnvelope } from "@/app/publicar/empleos/shared/publish/empleosPublishSnapshots";

import { getEmpleoJobBySlug } from "../../data/empleosSampleCatalog";
import type { EmpleosCanonicalListing, EmpleosStagedPublicStatus } from "./empleosCanonicalListing";
import { empleosEnvelopeToCanonical } from "./empleosEnvelopeToJobRecord";
import { buildEmpleosStagedSlug } from "./empleosSlugService";
import { getEmpleosStagedOwnerId } from "./empleosStagedIdentity";
import { readAllEmpleosCanonical, upsertEmpleosCanonical } from "./empleosStagedStorage";

function newListingId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `emp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

function titleFromEnvelope(e: EmpleosPublishEnvelope): string {
  if (e.payload.lane === "quick") return e.payload.data.title;
  if (e.payload.lane === "premium") return e.payload.data.title;
  return e.payload.data.title;
}

function ensureUniqueSlug(title: string, listingId: string): string {
  const short = listingId.replace(/[^a-zA-Z0-9]/g, "").slice(-10) || listingId.slice(0, 10);
  let slug = buildEmpleosStagedSlug(title, short);
  if (getEmpleoJobBySlug(slug)) slug = `${slug}-${short.slice(0, 4)}`;
  const all = readAllEmpleosCanonical();
  let n = 0;
  while (all.some((r) => r.slug === slug) || getEmpleoJobBySlug(slug)) {
    n += 1;
    slug = `${buildEmpleosStagedSlug(title, short)}-${n}`;
  }
  return slug;
}

function stampEnvelope(e: EmpleosPublishEnvelope, listingId: string, ownerId: string, now: string): EmpleosPublishEnvelope {
  return {
    ...e,
    listingId,
    ownerId,
    createdAt: e.createdAt ?? now,
    updatedAt: now,
    publishedAt: e.publishedAt ?? now,
    listingStatus: "published",
  };
}

/** Persists a publish-ready envelope as a published staged listing (browser store). */
export function persistEmpleosPublished(envelope: EmpleosPublishEnvelope): EmpleosCanonicalListing {
  const ownerId = getEmpleosStagedOwnerId();
  const listingId = envelope.listingId ?? newListingId();
  const now = new Date().toISOString();
  const slug = ensureUniqueSlug(titleFromEnvelope(envelope), listingId);
  const stamped = stampEnvelope(envelope, listingId, ownerId, now);
  const canonical = empleosEnvelopeToCanonical(stamped, {
    listingId,
    ownerId,
    slug,
    status: "published",
    publishedAt: now,
  });
  upsertEmpleosCanonical(canonical);
  return canonical;
}

/** Save as draft (not visible in public results). */
export function persistEmpleosDraft(envelope: EmpleosPublishEnvelope): EmpleosCanonicalListing {
  const ownerId = getEmpleosStagedOwnerId();
  const listingId = envelope.listingId ?? newListingId();
  const now = new Date().toISOString();
  const slug = ensureUniqueSlug(titleFromEnvelope(envelope), listingId);
  const stamped: EmpleosPublishEnvelope = {
    ...envelope,
    listingId,
    ownerId,
    createdAt: envelope.createdAt ?? now,
    updatedAt: now,
    publishedAt: null,
    listingStatus: "draft",
  };
  const canonical = empleosEnvelopeToCanonical(stamped, {
    listingId,
    ownerId,
    slug,
    status: "draft",
    publishedAt: null,
  });
  upsertEmpleosCanonical(canonical);
  return canonical;
}

export function updateEmpleosStagedStatus(listingId: string, status: EmpleosStagedPublicStatus): EmpleosCanonicalListing | null {
  const row = readAllEmpleosCanonical().find((r) => r.listingId === listingId);
  if (!row) return null;
  const now = new Date().toISOString();
  const publishedAt = status === "published" ? row.publishedAt ?? now : row.publishedAt;
  const next: EmpleosCanonicalListing = {
    ...row,
    status,
    updatedAt: now,
    publishedAt: status === "published" ? publishedAt : status === "draft" ? null : row.publishedAt,
    jobRecord: {
      ...row.jobRecord,
      publishedAt: status === "published" ? publishedAt ?? now : row.jobRecord.publishedAt,
    },
  };
  upsertEmpleosCanonical(next);
  return next;
}
