import type { EnVentaFreeApplicationState } from "@/app/clasificados/publicar/en-venta/free/application/schema/enVentaFreeFormState";
import { formatPriceInputDisplay } from "@/app/clasificados/publicar/en-venta/free/application/helpers/priceInput";

/** Local labels when taxonomy module is unavailable at build time in some environments. */
const CONDITION_FALLBACK: Record<string, { es: string; en: string }> = {
  new: { es: "Nuevo", en: "New" },
  like_new: { es: "Como nuevo", en: "Like new" },
  excellent: { es: "Excelente estado", en: "Excellent" },
  good: { es: "Buen estado", en: "Good" },
  fair: { es: "Estado aceptable", en: "Fair" },
  poor: { es: "Para repuesto / reparar", en: "For parts / repair" },
  used: { es: "Usado", en: "Used" },
};

function resolveConditionLabel(value: string, lang: "es" | "en"): string {
  if (!value.trim()) return "";
  const fb = CONDITION_FALLBACK[value];
  if (fb) return lang === "es" ? fb.es : fb.en;
  return value;
}

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

export type EnVentaPreviewViewModel = {
  title: string;
  priceLine: string;
  priceIsFree: boolean;
  negotiable: boolean;
  previewBadge: string;
  chips: EnVentaPreviewChip[];
  locationLine: string;
  postedLine: string;
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
  viewProfileLabel: string;
  gallery: {
    orderedImages: string[];
    videoUrl: string | null;
    showVideo: boolean;
  };
};

const COPY = {
  es: {
    previewBadge: "Vista previa antes de publicar",
    posted: "Vista previa · datos de tu borrador",
    location: (city: string, zip: string) =>
      [city, zip].filter(Boolean).join(zip && city ? ", " : "") || "",
    negotiableChip: "Precio negociable",
    ship: "Envío disponible",
    pickup: "Recogida local",
    meetup: "Punto de encuentro",
    localDel: "Entrega local",
    deliveryH: "Entrega y pago",
    contact: "Contactar al vendedor",
    trust: "Compra con confianza: mantén la comunicación dentro de Leonix cuando sea posible.",
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
  },
  en: {
    previewBadge: "Preview before publishing",
    posted: "Preview · from your draft",
    location: (city: string, zip: string) =>
      [city, zip].filter(Boolean).join(zip && city ? ", " : "") || "",
    negotiableChip: "Negotiable price",
    ship: "Shipping available",
    pickup: "Local pickup",
    meetup: "Meetup",
    localDel: "Local delivery",
    deliveryH: "Delivery & payment",
    contact: "Contact seller",
    trust: "Shop with confidence — keep communication on Leonix when possible.",
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
  },
} as const;

/** Gallery order: primary (cover) first, then remaining images in stable array order. Matches publish + live listing hero/thumbnail order. */
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
  const condLabel = resolveConditionLabel(state.condition, lang);
  if (condLabel) {
    chips.push({ key: "condition", text: condLabel, tone: "success" });
  }
  if (state.shipping) {
    chips.push({ key: "ship", text: `🚚 ${t.ship}`, tone: "success" });
  }
  if (state.pickup) {
    chips.push({ key: "pickup", text: `📦 ${t.pickup}`, tone: "neutral" });
  }
  if (state.meetup) {
    chips.push({ key: "meetup", text: `📍 ${t.meetup}`, tone: "neutral" });
  }
  if (state.localDelivery) {
    chips.push({ key: "local", text: `🛵 ${t.localDel}`, tone: "neutral" });
  }
  if (negotiable) {
    chips.push({ key: "neg", text: t.negotiableChip, tone: "muted" });
  }

  const loc = t.location(state.city.trim(), state.zip.trim());
  const locationLine = loc ? `📍 ${loc}` : "";

  const specRows: Array<{ label: string; value: string }> = [];
  if (condLabel) {
    specRows.push({ label: t.condition, value: condLabel });
  }
  if (state.itemType.trim()) {
    specRows.push({ label: t.itemType, value: state.itemType.trim() });
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

  const deliveryLines: string[] = [];
  if (state.shipping && state.shippingNotes.trim()) {
    deliveryLines.push(`🚚 ${state.shippingNotes.trim()}`);
  }
  if (state.pickup && state.pickupDetailNotes.trim()) {
    deliveryLines.push(`📦 ${state.pickupDetailNotes.trim()}`);
  }
  if (state.meetup && state.meetupDetailNotes.trim()) {
    deliveryLines.push(`📍 ${state.meetupDetailNotes.trim()}`);
  }
  if (state.localDelivery && state.localDeliveryDetailNotes.trim()) {
    deliveryLines.push(`🛵 ${state.localDeliveryDetailNotes.trim()}`);
  }
  if (deliveryLines.length === 0 && (state.shipping || state.pickup || state.meetup || state.localDelivery)) {
    if (state.shipping) deliveryLines.push(t.ship);
    if (state.pickup) deliveryLines.push(t.pickup);
    if (state.meetup) deliveryLines.push(t.meetup);
    if (state.localDelivery) deliveryLines.push(t.localDel);
  }

  const sellerName = state.displayName.trim() || t.sellerFallback;

  let contactHref = "#";
  const method = state.contactMethod;
  if (method === "phone" && state.phone.trim()) {
    contactHref = `tel:${state.phone.replace(/\s/g, "")}`;
  } else if (method === "email" && state.email.trim()) {
    contactHref = `mailto:${state.email.trim()}`;
  } else if (method === "whatsapp" && state.whatsapp.trim()) {
    const n = state.whatsapp.replace(/\D/g, "");
    contactHref = n ? `https://wa.me/${n}` : "#";
  } else if (method === "both") {
    if (state.phone.trim()) contactHref = `tel:${state.phone.replace(/\s/g, "")}`;
    else if (state.email.trim()) contactHref = `mailto:${state.email.trim()}`;
  }

  const orderedImages = getOrderedEnVentaImageUrls(state);

  const videoUrl = state.listingVideoUrl.trim() || null;
  const showVideo = plan === "pro" && !!videoUrl;

  return {
    title,
    priceLine,
    priceIsFree,
    negotiable,
    previewBadge: t.previewBadge,
    chips,
    locationLine,
    postedLine: t.posted,
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
    sellerSubline:
      lang === "es"
        ? plan === "pro"
          ? "Anuncio Pro · borrador"
          : "Anuncio Gratis · borrador"
        : plan === "pro"
          ? "Pro listing · draft"
          : "Free listing · draft",
    viewProfileLabel: t.profile,
    gallery: {
      orderedImages,
      videoUrl,
      showVideo,
    },
  };
}
