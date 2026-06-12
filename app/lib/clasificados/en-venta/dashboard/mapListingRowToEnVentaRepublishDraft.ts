/**
 * Gate D2 — Map an owned inactive `listings` row into publish form state for republicar (new listing on publish).
 */
import { stripLeonixPublishedDescriptionBody } from "@/app/clasificados/lib/leonixListingGalleryMarker";
import { parseEnVentaDetailPairSignals } from "@/app/clasificados/en-venta/mapping/enVentaDetailPairSignals";
import { splitEnVentaDescriptionAndDelivery } from "@/app/clasificados/en-venta/shared/utils/buildEnVentaContentStackModel";
import { resolveEnVentaListingImageUrls } from "@/app/clasificados/en-venta/shared/utils/resolveEnVentaListingImageUrls";
import { resolveEnVentaVideoUrl } from "@/app/clasificados/en-venta/shared/utils/enVentaVideoEmbed";
import { parseEnVentaVideoUrlsFromDetailPairs } from "@/app/clasificados/en-venta/shared/utils/enVentaVideoUrls";
import { normalizeEnVentaFreeApplicationState } from "@/app/clasificados/en-venta/shared/utils/normalizeEnVentaApplicationState";
import { EN_VENTA_CONTENT_STACK_COPY } from "@/app/clasificados/en-venta/shared/types/enVentaContentStack.types";
import {
  createEmptyEnVentaFreeState,
  type EnVentaFreeApplicationState,
  type EnVentaMuxVideoSlotState,
} from "@/app/clasificados/publicar/en-venta/free/application/schema/enVentaFreeFormState";

function pairsFromRow(row: Record<string, unknown>): Array<{ label: string; value: string }> {
  const dp = row.detail_pairs;
  if (!Array.isArray(dp)) return [];
  return dp
    .map((p) => {
      if (!p || typeof p !== "object") return null;
      const o = p as Record<string, unknown>;
      const label = typeof o.label === "string" ? o.label : "";
      const value = typeof o.value === "string" ? o.value : "";
      if (!label || !value) return null;
      return { label, value };
    })
    .filter((x): x is { label: string; value: string } => x != null);
}

function pairValue(pairs: Array<{ label: string; value: string }>, label: string): string {
  return pairs.find((p) => p.label.trim() === label)?.value.trim() ?? "";
}

function stackFieldFromPairs(
  pairs: Array<{ label: string; value: string }>,
  fieldLabel: string,
): string {
  return pairValue(pairs, fieldLabel);
}

function httpImageUrls(row: Record<string, unknown>): string[] {
  return resolveEnVentaListingImageUrls(row).filter((u) => /^https?:\/\//i.test(u.trim()));
}

function buildVideoSlotFromRow(row: Record<string, unknown>, plan: "free" | "pro"): EnVentaMuxVideoSlotState {
  const base = createEmptyEnVentaFreeState().listingVideoSlots[0];
  if (plan !== "pro") return base;

  const playbackId = String(row.mux_playback_id ?? "").trim();
  const external = resolveEnVentaVideoUrl({
    muxPlaybackId: row.mux_playback_id != null ? String(row.mux_playback_id) : null,
    description: String(row.description ?? ""),
    detailPairs: pairsFromRow(row),
  });

  if (playbackId) {
    return {
      ...base,
      playbackId,
      playbackUrl: `https://stream.mux.com/${playbackId}.m3u8`,
      status: "ready",
    };
  }

  if (external && /^https?:\/\//i.test(external)) {
    return {
      ...base,
      playbackUrl: external,
      status: "ready",
    };
  }

  const fromPair = pairValue(pairsFromRow(row), "Leonix:videoUrl");
  if (fromPair) {
    return { ...base, playbackUrl: fromPair, status: "ready" };
  }

  return base;
}

function resolveContactFields(
  row: Record<string, unknown>,
  pairs: Array<{ label: string; value: string }>,
): Pick<EnVentaFreeApplicationState, "phone" | "email" | "whatsapp" | "contactMethod"> {
  const channel = (pairValue(pairs, "Leonix:contactChannel") || "phone").trim().toLowerCase();
  const phoneRaw = String(row.contact_phone ?? "").trim();
  const emailRaw = String(row.contact_email ?? "").trim();
  const waFromPair = pairValue(pairs, "Leonix:whatsapp").replace(/\D/g, "").slice(0, 15);

  let contactMethod: EnVentaFreeApplicationState["contactMethod"] = "phone";
  if (channel === "email" || channel === "whatsapp" || channel === "both" || channel === "phone") {
    contactMethod = channel as EnVentaFreeApplicationState["contactMethod"];
  }

  return {
    phone: phoneRaw,
    email: emailRaw,
    whatsapp: waFromPair || (contactMethod === "whatsapp" ? phoneRaw : ""),
    contactMethod,
  };
}

/** Build publish draft from a historical listing row (does not mutate the source row). */
export function mapListingRowToEnVentaRepublishDraft(
  row: Record<string, unknown>,
  plan: "free" | "pro",
): EnVentaFreeApplicationState {
  const pairs = pairsFromRow(row);
  const stackEs = EN_VENTA_CONTENT_STACK_COPY.es;
  const stackEn = EN_VENTA_CONTENT_STACK_COPY.en;
  const rawDesc = String(row.description ?? "");
  const stripped = stripLeonixPublishedDescriptionBody(rawDesc).trim() || rawDesc.trim();
  const { description } = splitEnVentaDescriptionAndDelivery(stripped, "es");

  const signals = parseEnVentaDetailPairSignals(pairs, {
    title: String(row.title ?? ""),
    description: stripped,
  });

  const rama = pairValue(pairs, "Leonix:evDept") || "";
  const evSub = pairValue(pairs, "Leonix:evSub") || "";
  const itemType = pairValue(pairs, "Leonix:itemType") || "";
  const condition =
    pairValue(pairs, stackEs.condition) ||
    pairValue(pairs, stackEn.condition) ||
    pairValue(pairs, "Condición") ||
    pairValue(pairs, "Condition") ||
    "";

  const priceRaw = row.price;
  const priceNum =
    typeof priceRaw === "number" ? priceRaw : Number(String(priceRaw ?? "").replace(/[^0-9.]/g, ""));
  const priceIsFree = Boolean(row.is_free) || (Number.isFinite(priceNum) && priceNum <= 0);

  const images = httpImageUrls(row);
  const contact = resolveContactFields(row, pairs);
  const videoSlot0 = buildVideoSlotFromRow(row, plan);
  const externalVideo = resolveEnVentaVideoUrl({
    muxPlaybackId: row.mux_playback_id != null ? String(row.mux_playback_id) : null,
    description: rawDesc,
    detailPairs: pairs,
  });

  const sellerKind = row.seller_type === "business" ? "business" : "individual";

  const merged: EnVentaFreeApplicationState = {
    ...createEmptyEnVentaFreeState(),
    rama,
    evSub,
    itemType,
    condition,
    title: String(row.title ?? "").trim(),
    priceIsFree,
    price: priceIsFree ? "" : Number.isFinite(priceNum) ? String(Math.round(priceNum)) : String(priceRaw ?? "").trim(),
    negotiable: signals.negotiable ? "yes" : "",
    description,
    quantity: signals.quantity ?? "",
    brand: signals.brand ?? pairValue(pairs, "Leonix:brand") ?? "",
    model: signals.model ?? pairValue(pairs, "Leonix:model") ?? "",
    images,
    primaryImageIndex: 0,
    city: String(row.city ?? "").trim(),
    zip: String(row.zip ?? "").trim(),
    pickup: signals.fulfillment.pickup,
    meetup: signals.fulfillment.meetup,
    localDelivery: signals.fulfillment.delivery,
    shipping: signals.fulfillment.shipping,
    shippingNotes: pairValue(pairs, "Leonix:shippingNotes"),
    pickupDetailNotes: pairValue(pairs, "Leonix:pickupDetailNotes"),
    meetupDetailNotes: pairValue(pairs, "Leonix:meetupDetailNotes"),
    localDeliveryDetailNotes: pairValue(pairs, "Leonix:localDeliveryDetailNotes"),
    seller_kind: sellerKind,
    displayName: String(row.business_name ?? "").trim(),
    ...contact,
    videoUrls: parseEnVentaVideoUrlsFromDetailPairs(pairs),
    listingVideoUrl: plan === "pro" && externalVideo && !videoSlot0.playbackId ? externalVideo : "",
    listingVideoSlots: [videoSlot0, createEmptyEnVentaFreeState().listingVideoSlots[1]],
    wearNotes:
      stackFieldFromPairs(pairs, stackEs.conditionUse) || stackFieldFromPairs(pairs, stackEn.conditionUse),
    accessoriesNotes:
      stackFieldFromPairs(pairs, stackEs.accessories) || stackFieldFromPairs(pairs, stackEn.accessories),
    itemExtraDetails:
      stackFieldFromPairs(pairs, stackEs.technical) || stackFieldFromPairs(pairs, stackEn.technical),
    confirmListingAccurate: false,
    confirmPhotosRepresentItem: false,
    confirmCommunityRules: false,
  };

  return normalizeEnVentaFreeApplicationState(merged);
}
