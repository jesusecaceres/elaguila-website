import type { EmpleosAdminListingRowProjection } from "../types/empleosAdminListingCompatibility";
import type { EmpleosPublishEnvelope } from "./empleosPublishSnapshots";

/** Maps a staged publish envelope to the generic admin row shape (IDs null until persisted). */
export function empleosEnvelopeToAdminProjection(e: EmpleosPublishEnvelope): EmpleosAdminListingRowProjection {
  const lane = e.lane;
  let title = "";
  let description = "";
  let city = "";
  let state = "";
  let cta = "";

  if (e.payload.lane === "quick") {
    const d = e.payload.data;
    title = d.title;
    description = d.description;
    city = d.city;
    state = d.state;
    cta = [d.phone, d.whatsapp, d.email].filter(Boolean).join(" · ");
  } else if (e.payload.lane === "premium") {
    const d = e.payload.data;
    title = d.title;
    description = d.introduction;
    city = d.city;
    state = d.state;
    cta = [d.websiteUrl, d.phone, d.whatsapp, d.email].filter(Boolean).join(" · ");
  } else {
    const d = e.payload.data;
    title = d.title;
    description = [d.dateLine, d.venue].filter(Boolean).join(" — ");
    city = d.city;
    state = d.state;
    cta = [d.contactPhone, d.contactEmail, d.organizerUrl, d.contactLink].filter(Boolean).join(" · ");
  }

  return {
    id: e.listingId,
    owner_id: e.ownerId,
    category: "empleos",
    lane,
    status: e.listingStatus,
    title,
    description,
    city,
    state,
    primary_image_url: e.mediaReferences.primaryImageUrl,
    images: e.mediaReferences.imageUrls,
    detail_pairs: { lane, language: e.language },
    cta_summary: cta,
    payment_state: e.payment.paymentState,
    created_at: e.createdAt,
    updated_at: e.updatedAt,
    published_at: e.publishedAt,
    moderation_meta: { lane, language: e.language },
  };
}
