import type { EnVentaFreeApplicationState } from "@/app/clasificados/publicar/en-venta/free/application/schema/enVentaFreeFormState";
import { formatPriceInputDisplay } from "@/app/clasificados/publicar/en-venta/free/application/helpers/priceInput";
import {
  departmentLabel,
  EN_VENTA_PUBLISH_CONDITION_OPTIONS,
  findSubcategory,
} from "@/app/clasificados/en-venta/shared/fields/enVentaTaxonomy";

function resolveConditionLabel(value: string, lang: "es" | "en"): string {
  if (!value.trim()) return "";
  const opt = EN_VENTA_PUBLISH_CONDITION_OPTIONS.find((c) => c.value === value);
  if (opt) return lang === "es" ? opt.labelEs : opt.labelEn;
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

/** Buyer-facing contact / utility links built from application fields. */
export type EnVentaPreviewContactAction = {
  id: "call" | "sms" | "email" | "whatsapp" | "maps";
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
    shellFree: "Vista previa Gratis",
    shellPro: "Vista previa Pro",
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
    photoCount: (n: number, max: number) => `${n} / ${max} fotos`,
  },
  en: {
    shellFree: "Free preview",
    shellPro: "Pro preview",
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
    photoCount: (n: number, max: number) => `${n} / ${max} photos`,
  },
} as const;

const SMS_PREFILL_ES = "Hola, ¿sigue disponible este artículo?";
const SMS_PREFILL_EN = "Hi — is this item still available?";
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

function buildContactActions(state: EnVentaFreeApplicationState, lang: "es" | "en"): EnVentaPreviewContactAction[] {
  const actions: EnVentaPreviewContactAction[] = [];
  const phone = state.phone.replace(/\s/g, "");
  const email = state.email.trim();
  const wa = state.whatsapp.replace(/\D/g, "");
  const city = state.city.trim();
  const zip = state.zip.trim();
  const query = [city, zip].filter(Boolean).join(" ");

  if (phone) {
    actions.push({
      id: "call",
      label: lang === "es" ? "Llamar" : "Call",
      href: `tel:${phone}`,
    });
    const smsBody = encodeURIComponent(lang === "es" ? SMS_PREFILL_ES : SMS_PREFILL_EN);
    actions.push({
      id: "sms",
      label: "SMS",
      href: `sms:${phone}?body=${smsBody}`,
    });
  }

  if (email) {
    const sub = encodeURIComponent(lang === "es" ? EMAIL_SUBJ_ES : EMAIL_SUBJ_EN);
    const body = encodeURIComponent(lang === "es" ? SMS_PREFILL_ES : SMS_PREFILL_EN);
    actions.push({
      id: "email",
      label: lang === "es" ? "Correo" : "Email",
      href: `mailto:${email}?subject=${sub}&body=${body}`,
    });
  }

  if (wa) {
    const text = encodeURIComponent(lang === "es" ? SMS_PREFILL_ES : SMS_PREFILL_EN);
    actions.push({
      id: "whatsapp",
      label: "WhatsApp",
      href: `https://wa.me/${wa}?text=${text}`,
    });
  }

  if (query) {
    actions.push({
      id: "maps",
      label: lang === "es" ? "Mapa / zona" : "Map / area",
      href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
    });
  }

  const pref = state.contactMethod;
  const rank = (id: EnVentaPreviewContactAction["id"]): number => {
    const orderPhone = { call: 0, sms: 1, whatsapp: 2, email: 3, maps: 4 } as const;
    const orderEmail = { email: 0, call: 1, sms: 2, whatsapp: 3, maps: 4 } as const;
    const orderWa = { whatsapp: 0, call: 1, sms: 2, email: 3, maps: 4 } as const;
    const orderBoth = { call: 0, sms: 1, email: 2, whatsapp: 3, maps: 4 } as const;
    if (pref === "phone") return orderPhone[id];
    if (pref === "email") return orderEmail[id];
    if (pref === "whatsapp") return orderWa[id];
    return orderBoth[id];
  };

  actions.sort((a, b) => rank(a.id) - rank(b.id));

  return actions;
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
    chips.push({ key: "ship", text: t.ship, tone: "neutral" });
  }
  if (state.pickup) {
    chips.push({ key: "pickup", text: t.pickup, tone: "neutral" });
  }
  if (state.meetup) {
    chips.push({ key: "meetup", text: t.meetup, tone: "neutral" });
  }
  if (state.localDelivery) {
    chips.push({ key: "local", text: t.localDel, tone: "neutral" });
  }
  if (negotiable) {
    chips.push({ key: "neg", text: t.negotiableChip, tone: "muted" });
  }

  const dept = state.rama.trim();
  const sub = state.evSub.trim();
  let classificationLine = "";
  if (dept) {
    const deptLabel = departmentLabel(dept, lang);
    if (sub) {
      const row = findSubcategory(dept, sub);
      classificationLine = row ? `${deptLabel} · ${row.label[lang]}` : deptLabel;
    } else {
      classificationLine = deptLabel;
    }
  }

  const loc = t.location(state.city.trim(), state.zip.trim());
  const locationLine = loc ? loc : "";

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
    deliveryLines.push(`${t.ship} — ${state.shippingNotes.trim()}`);
  }
  if (state.pickup && state.pickupDetailNotes.trim()) {
    deliveryLines.push(`${t.pickup} — ${state.pickupDetailNotes.trim()}`);
  }
  if (state.meetup && state.meetupDetailNotes.trim()) {
    deliveryLines.push(`${t.meetup} — ${state.meetupDetailNotes.trim()}`);
  }
  if (state.localDelivery && state.localDeliveryDetailNotes.trim()) {
    deliveryLines.push(`${t.localDel} — ${state.localDeliveryDetailNotes.trim()}`);
  }
  if (deliveryLines.length === 0 && (state.shipping || state.pickup || state.meetup || state.localDelivery)) {
    if (state.shipping) deliveryLines.push(t.ship);
    if (state.pickup) deliveryLines.push(t.pickup);
    if (state.meetup) deliveryLines.push(t.meetup);
    if (state.localDelivery) deliveryLines.push(t.localDel);
  }

  const sellerName = state.displayName.trim() || t.sellerFallback;

  const sellerKindLabel =
    state.seller_kind === "business"
      ? t.kindBusiness
      : state.seller_kind === "individual"
        ? t.kindIndividual
        : "";

  const method = state.contactMethod;
  let contactHref = "#";
  if (method === "phone" && state.phone.trim()) {
    contactHref = `tel:${state.phone.replace(/\s/g, "")}`;
  } else if (method === "email" && state.email.trim()) {
    const sub = encodeURIComponent(lang === "es" ? EMAIL_SUBJ_ES : EMAIL_SUBJ_EN);
    const body = encodeURIComponent(lang === "es" ? SMS_PREFILL_ES : SMS_PREFILL_EN);
    contactHref = `mailto:${state.email.trim()}?subject=${sub}&body=${body}`;
  } else if (method === "whatsapp" && state.whatsapp.trim()) {
    const n = state.whatsapp.replace(/\D/g, "");
    const text = encodeURIComponent(lang === "es" ? SMS_PREFILL_ES : SMS_PREFILL_EN);
    contactHref = n ? `https://wa.me/${n}?text=${text}` : "#";
  } else if (method === "both") {
    if (state.phone.trim()) contactHref = `tel:${state.phone.replace(/\s/g, "")}`;
    else if (state.email.trim()) {
      const sub = encodeURIComponent(lang === "es" ? EMAIL_SUBJ_ES : EMAIL_SUBJ_EN);
      const body = encodeURIComponent(lang === "es" ? SMS_PREFILL_ES : SMS_PREFILL_EN);
      contactHref = `mailto:${state.email.trim()}?subject=${sub}&body=${body}`;
    }
  }

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

  const videoUrl = state.listingVideoSlots?.[0]?.playbackUrl?.trim() || state.listingVideoUrl.trim() || null;
  const showVideo = plan === "pro" && !!videoUrl;

  const contactActions = buildContactActions(state, lang);

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
    sellerSubline:
      lang === "es"
        ? plan === "pro"
          ? "Anuncio Pro · borrador"
          : "Anuncio Gratis · borrador"
        : plan === "pro"
          ? "Pro listing · draft"
          : "Free listing · draft",
    sellerKindLabel,
    viewProfileLabel: t.profile,
    contactActions,
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
