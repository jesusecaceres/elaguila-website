import type { EnVentaFreeApplicationState } from "@/app/clasificados/publicar/en-venta/free/application/schema/enVentaFreeFormState";
import { formatPriceInputDisplay } from "@/app/clasificados/publicar/en-venta/free/application/helpers/priceInput";
import { getArticuloLabel } from "@/app/clasificados/en-venta/shared/fields/enVentaTaxonomy";
import {
  enVentaCategoryLine,
  enVentaConditionDisplay,
  enVentaFulfillmentLabels,
} from "@/app/clasificados/en-venta/mapping/appendEnVentaDetailPairs";
import {
  buildEnVentaContactActions,
  buildEnVentaPrimaryContactHref,
} from "@/app/clasificados/en-venta/shared/utils/enVentaContactActions";
import { resolveEnVentaVideoUrl } from "@/app/clasificados/en-venta/shared/utils/enVentaVideoEmbed";

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export type EnVentaPreviewChip = {
  key: string;
  text: string;
  tone: "success" | "neutral" | "muted";
};

/** Buyer-facing contact / utility links built from application fields. */
export type EnVentaPreviewContactAction = {
  id: "call" | "sms" | "email" | "whatsapp";
  label: string;
  href: string;
};

export type EnVentaPreviewViewModel = {
  title: string;
  priceLine: string;
  priceIsFree: boolean;
  negotiable: boolean;
  /** Shell-only: plan label for seller wrapper. */
  shellPlanLabel: string;
  /** Shell-only: short line (draft). */
  shellStatusLine: string;
  chips: EnVentaPreviewChip[];
  classificationLine: string;
  /** Hero metadata: condition, category, city/ZIP. */
  metadataParts: string[];
  locationLine: string;
  /** Buyer-facing note — approximate area, not exact address unless seller chose. */
  locationApproximateNote: string;
  description: string;
  extraParagraphs: Array<{ title: string; body: string }>;
  specRows: Array<{ label: string; value: string }>;
  deliveryHeading: string;
  deliveryLines: string[];
  primaryCtaLabel: string;
  primaryCtaHref: string;
  trustNote: string;
  sellerName: string;
  sellerInitials: string;
  sellerSubline: string;
  sellerKindLabel: string;
  viewProfileLabel: string;
  contactActions: EnVentaPreviewContactAction[];
  locationMapHref: string | null;
  /** Price-drop UI: only when draft carries both prices (optional future fields). Not in current schema. */
  priceDrop: null | { previousLine: string; currentLine: string };
  /** Buyer mailto when negotiable + email — “hacer oferta” style (no server workflow). */
  offerMailtoHref: string | null;
  gallery: {
    orderedImages: string[];
    videoUrl: string | null;
    showVideo: boolean;
    photoCountLabel: string;
  };
};

const COPY = {
  es: {
    shellFree: "Vista previa del anuncio",
    shellPro: "Vista previa del anuncio",
    posted: "Borrador · no publicado aún",
    location: (city: string, zip: string) =>
      [city, zip].filter(Boolean).join(zip && city ? ", " : "") || "",
    approxLoc:
      "Ubicación general indicada por el vendedor; el punto exacto se acuerda al contactar.",
    negotiableChip: "Precio negociable",
    makeOfferHint: "Puedes contactar al vendedor para acordar.",
    ship: "Envío disponible",
    pickup: "Recogida local",
    meetup: "Punto de encuentro",
    localDel: "Entrega local",
    kindIndividual: "Particular",
    kindBusiness: "Comercial",
    deliveryH: "Entrega y pago",
    contact: "Contactar al vendedor",
    trust: "Compra con cuidado. Verifica el artículo antes de pagar.",
    profile: "Ver perfil del vendedor",
    free: "Gratis",
    qty: "Cantidad",
    brand: "Marca",
    model: "Modelo",
    itemType: "Tipo de artículo",
    condition: "Estado",
    storage: "Detalles / especificaciones",
    wear: "Condición y uso",
    acc: "Accesorios incluidos",
    noTitle: "Sin título",
    sellerFallback: "Vendedor",
    photoCount: (n: number, max: number) => `${n} / ${max} fotos`,
  },
  en: {
    shellFree: "Listing preview",
    shellPro: "Listing preview",
    posted: "Draft · not published yet",
    location: (city: string, zip: string) =>
      [city, zip].filter(Boolean).join(zip && city ? ", " : "") || "",
    approxLoc: "General area from the seller; exact meeting point is arranged when you contact them.",
    negotiableChip: "Negotiable price",
    makeOfferHint: "Message the seller to make an offer.",
    ship: "Shipping available",
    pickup: "Local pickup",
    meetup: "Meetup",
    localDel: "Local delivery",
    kindIndividual: "Individual",
    kindBusiness: "Business",
    deliveryH: "Delivery & payment",
    contact: "Contact seller",
    trust: "Buy with care. Verify the item before paying.",
    profile: "View seller profile",
    free: "Free",
    qty: "Quantity",
    brand: "Brand",
    model: "Model",
    itemType: "Item type",
    condition: "Condition",
    storage: "Details / specifications",
    wear: "Condition & wear",
    acc: "Included accessories",
    noTitle: "Untitled listing",
    sellerFallback: "Seller",
    photoCount: (n: number, max: number) => `${n} / ${max} photos`,
  },
} as const;

const EMAIL_SUBJ_ES = "Interés en tu anuncio Leonix";
const EMAIL_SUBJ_EN = "Question about your Leonix listing";

/** Gallery caps align with publish product copy: Free 3 photos, Pro 12 (+ video). */
export const EN_VENTA_PREVIEW_MAX_PHOTOS = { free: 3, pro: 12 } as const;

export function getOrderedEnVentaImageUrls(state: EnVentaFreeApplicationState): string[] {
  const n = state.images.length;
  if (n === 0) return [];
  const pi = Math.min(Math.max(0, state.primaryImageIndex), n - 1);
  return [state.images[pi], ...state.images.filter((_, i) => i !== pi)];
}

export function buildEnVentaPreviewModel(
  state: EnVentaFreeApplicationState,
  lang: "es" | "en",
  plan: "free" | "pro"
): EnVentaPreviewViewModel {
  const t = COPY[lang];

  const title = state.title.trim() || t.noTitle;

  const priceIsFree = state.priceIsFree;
  let priceLine = "";
  if (priceIsFree) {
    priceLine = t.free;
  } else if (state.price.trim()) {
    priceLine = `$${formatPriceInputDisplay(state.price)} USD`;
  } else {
    priceLine = lang === "es" ? "Precio por definir" : "Price TBD";
  }

  const negotiable = state.negotiable === "yes" && !priceIsFree;

  const chips: EnVentaPreviewChip[] = [];
  const condLabel = enVentaConditionDisplay(state.condition, lang) ?? "";
  if (condLabel) {
    chips.push({ key: "condition", text: condLabel, tone: "success" });
  }

  const dept = state.rama.trim();
  const sub = state.evSub.trim();
  const itemType = state.itemType.trim();
  const classificationLine =
    enVentaCategoryLine({ departmentKey: dept, subKey: sub, articleKey: itemType }, lang) ?? "";

  const loc = t.location(state.city.trim(), state.zip.trim());
  const locationLine = loc ? loc : "";
  const locationMapHref = locationLine
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        [state.city.trim(), state.zip.trim()].filter(Boolean).join(" ")
      )}`
    : null;

  const specRows: Array<{ label: string; value: string }> = [];
  if (condLabel) {
    specRows.push({ label: t.condition, value: condLabel });
  }
  if (itemType) {
    specRows.push({ label: t.itemType, value: dept ? getArticuloLabel(dept, itemType, lang) : itemType });
  }
  if (state.brand.trim()) {
    specRows.push({ label: t.brand, value: state.brand.trim() });
  }
  if (state.model.trim()) {
    specRows.push({ label: t.model, value: state.model.trim() });
  }
  if (state.quantity.trim()) {
    specRows.push({ label: t.qty, value: state.quantity.trim() });
  }
  if (state.itemExtraDetails.trim()) {
    specRows.push({ label: t.storage, value: state.itemExtraDetails.trim() });
  }

  const extraParagraphs: Array<{ title: string; body: string }> = [];
  if (state.wearNotes.trim()) {
    extraParagraphs.push({ title: t.wear, body: state.wearNotes.trim() });
  }
  if (state.accessoriesNotes.trim()) {
    extraParagraphs.push({ title: t.acc, body: state.accessoriesNotes.trim() });
  }

  const deliveryLabels = enVentaFulfillmentLabels(
    {
      shipping: state.shipping,
      pickup: state.pickup,
      meetup: state.meetup,
      delivery: state.localDelivery,
    },
    lang
  );
  const notesByLabel = new Map<string, string>();
  if (state.shippingNotes.trim()) notesByLabel.set(lang === "es" ? "Envío disponible" : "Shipping available", state.shippingNotes.trim());
  if (state.pickupDetailNotes.trim()) notesByLabel.set(lang === "es" ? "Recogida local" : "Local pickup", state.pickupDetailNotes.trim());
  if (state.meetupDetailNotes.trim()) notesByLabel.set(lang === "es" ? "Punto de encuentro" : "Meetup", state.meetupDetailNotes.trim());
  if (state.localDeliveryDetailNotes.trim()) notesByLabel.set(lang === "es" ? "Entrega local" : "Local delivery", state.localDeliveryDetailNotes.trim());
  const deliveryLines = deliveryLabels.map((label) => {
    const note = notesByLabel.get(label);
    return note ? `${label} — ${note}` : label;
  });

  const sellerName = state.displayName.trim() || t.sellerFallback;

  const sellerKindLabel =
    state.seller_kind === "business"
      ? t.kindBusiness
      : state.seller_kind === "individual"
        ? t.kindIndividual
        : "";

  const contactHref = buildEnVentaPrimaryContactHref(state, lang);

  let offerMailtoHref: string | null = null;
  if (negotiable && state.email.trim()) {
    const sub = encodeURIComponent(lang === "es" ? "Oferta por tu artículo Leonix" : "Offer on your Leonix listing");
    const body = encodeURIComponent(
      lang === "es"
        ? "Hola, me gustaría hacer una oferta por tu artículo."
        : "Hi — I'd like to make an offer on your item."
    );
    offerMailtoHref = `mailto:${state.email.trim()}?subject=${sub}&body=${body}`;
  }

  const orderedFull = getOrderedEnVentaImageUrls(state);
  const maxPhotos = plan === "pro" ? EN_VENTA_PREVIEW_MAX_PHOTOS.pro : EN_VENTA_PREVIEW_MAX_PHOTOS.free;
  const orderedImages = orderedFull.slice(0, maxPhotos);

  const slot = state.listingVideoSlots?.[0];
  const videoUrl = resolveEnVentaVideoUrl({
    muxPlaybackId: slot?.playbackId ?? null,
    muxPlaybackUrl: slot?.playbackUrl ?? null,
    externalUrl: state.listingVideoUrl.trim() || null,
  });
  const showVideo = plan === "pro" && Boolean(videoUrl);

  const contactActions = buildEnVentaContactActions(state, lang);

  const metadataParts: string[] = [];
  if (condLabel) metadataParts.push(condLabel);
  if (classificationLine) metadataParts.push(classificationLine);
  if (locationLine) metadataParts.push(locationLine);

  const shellPlanLabel = plan === "pro" ? t.shellPro : t.shellFree;
  const shellStatusLine = t.posted;

  return {
    title,
    priceLine,
    priceIsFree,
    negotiable,
    shellPlanLabel,
    shellStatusLine,
    chips,
    classificationLine,
    metadataParts,
    locationLine,
    locationApproximateNote: t.approxLoc,
    description: state.description.trim(),
    extraParagraphs,
    specRows,
    deliveryHeading: t.deliveryH,
    deliveryLines,
    primaryCtaLabel: t.contact,
    primaryCtaHref: contactHref,
    trustNote: t.trust,
    sellerName,
    sellerInitials: initialsFromName(sellerName),
    sellerSubline: lang === "es" ? "Anuncio de Varios · borrador" : "For Sale listing · draft",
    sellerKindLabel,
    viewProfileLabel: t.profile,
    contactActions,
    locationMapHref,
    priceDrop: null,
    offerMailtoHref,
    gallery: {
      orderedImages,
      videoUrl,
      showVideo,
      photoCountLabel: t.photoCount(orderedImages.length, maxPhotos),
    },
  };
}
