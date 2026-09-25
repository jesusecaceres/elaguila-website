/**
 * Globalization Build 04 — Final Lifecycle Closure (Gate 2).
 *
 * Strict category-aware owner-edit field contract for the 5 categories this gate covers
 * (en-venta, busco, clases, comunidad, mascotas-y-perdidos), hosted by the ONE existing shared
 * owner edit shell (`editar/page.tsx`) — not five separate editor pages, and not a generic
 * "god switch" that reinvents storage logic per field. Each category gets a small adapter:
 * a field spec list (for rendering) + hydrate (row -> form values) + serialize (form values ->
 * a patch object the shell can pass straight to `applyOwnerListingPatch`).
 *
 * Every field here reads/writes the REAL `Leonix:*` detail_pairs keys and plain columns already
 * written by that category's own publish pipeline (verified directly against
 * enVentaPublishFromDraft.ts / publishBuscoQuickToListings.ts / publishCommunityQuickToListings.ts
 * / publishMascotasPerdidosQuickToListings.ts) — no new fields invented, no new schema.
 */

import * as buscoTaxonomy from "@/app/publicar/busco/shared/buscoTaxonomy";
import * as mascotasTaxonomy from "@/app/publicar/mascotas-y-perdidos/shared/mascotasPerdidosTaxonomy";

export type LifecycleFieldKind = "text" | "textarea" | "tel" | "email" | "select";

export type LifecycleFieldOption = { value: string; labelEs: string; labelEn: string };

export type LifecycleFieldSpec = {
  key: string;
  labelEs: string;
  labelEn: string;
  kind: LifecycleFieldKind;
  options?: LifecycleFieldOption[];
  placeholder?: string;
};

export type LifecycleFrozenField = {
  labelEs: string;
  labelEn: string;
  reasonEs: string;
  reasonEn: string;
};

export type CategoryLifecycleAdapter = {
  /** Matches the real `listings.category` value. */
  category: string;
  fields: LifecycleFieldSpec[];
  /** Owner-visible, documented reasons a real public field is NOT editable here (Gate 2 category C). */
  frozenFields: LifecycleFrozenField[];
  hydrate: (row: Record<string, unknown>) => Record<string, string>;
  /** Returns a patch object to merge into the generic save() payload — plain columns and/or a
   * replacement `detail_pairs` array. Never touches fields this adapter doesn't own. */
  serialize: (row: Record<string, unknown>, values: Record<string, string>) => Record<string, unknown>;
};

type DetailPair = { label?: string; value?: string };

function pairsOf(row: Record<string, unknown>): DetailPair[] {
  return Array.isArray(row.detail_pairs) ? (row.detail_pairs as DetailPair[]) : [];
}

function readPair(row: Record<string, unknown>, label: string): string {
  const pairs = pairsOf(row);
  for (const p of pairs) {
    if (p?.label === label) return (p.value ?? "").toString().trim();
  }
  return "";
}

/** Replaces (or removes, for a null/empty value) the given labels in the existing pairs array —
 * every other pair (including ones no adapter here knows about) is preserved untouched. */
function upsertDetailPairs(row: Record<string, unknown>, updates: Record<string, string | null>): DetailPair[] {
  const existing = pairsOf(row);
  const labelsTouched = new Set(Object.keys(updates));
  const kept = existing.filter((p) => !labelsTouched.has(p?.label ?? ""));
  const next = [...kept];
  for (const [label, value] of Object.entries(updates)) {
    if (value === null || value.trim() === "") continue;
    next.push({ label, value: value.trim() });
  }
  return next;
}

function readColumn(row: Record<string, unknown>, key: string): string {
  const v = row[key];
  return v === null || v === undefined ? "" : String(v);
}

// =====================================================================================
// EN VENTA
// =====================================================================================

const EN_VENTA_FIELDS: LifecycleFieldSpec[] = [
  { key: "brand", labelEs: "Marca", labelEn: "Brand", kind: "text" },
  { key: "model", labelEs: "Modelo", labelEn: "Model", kind: "text" },
  { key: "city", labelEs: "Ciudad", labelEn: "City", kind: "text" },
  { key: "state", labelEs: "Estado", labelEn: "State", kind: "text" },
  { key: "zip", labelEs: "Código postal", labelEn: "ZIP code", kind: "text" },
  { key: "phone", labelEs: "Teléfono", labelEn: "Phone", kind: "tel" },
  { key: "email", labelEs: "Correo", labelEn: "Email", kind: "email" },
];

const EN_VENTA_FROZEN: LifecycleFrozenField[] = [
  {
    labelEs: "Condición, Negociable, Cantidad, Punto de encuentro",
    labelEn: "Condition, Negotiable, Quantity, Meetup",
    reasonEs:
      "Estos campos se guardan dos veces (una fila legible + un valor interno). Editar solo uno los desincronizaría — se difiere para no crear un nuevo error de datos.",
    reasonEn:
      "These fields are dual-written (a human-readable row plus a separate internal value). Editing only one would desynchronize them — deferred to avoid introducing a new data bug.",
  },
  {
    labelEs: "Entrega (recoger, envío, entrega local)",
    labelEn: "Fulfillment (pickup, shipping, local delivery)",
    reasonEs: "Mismo motivo: fila legible combinada + banderas internas separadas.",
    reasonEn: "Same reason: a combined human-readable row plus separate internal flags.",
  },
];

function hydrateEnVenta(row: Record<string, unknown>): Record<string, string> {
  return {
    brand: readPair(row, "Leonix:brand"),
    model: readPair(row, "Leonix:model"),
    city: readColumn(row, "city"),
    state: readPair(row, "Leonix:state"),
    zip: readColumn(row, "zip"),
    phone: readColumn(row, "contact_phone"),
    email: readColumn(row, "contact_email"),
  };
}

function serializeEnVenta(row: Record<string, unknown>, values: Record<string, string>): Record<string, unknown> {
  const patch: Record<string, unknown> = {
    city: values.city.trim() || null,
    zip: values.zip.trim() || null,
    contact_phone: values.phone.trim() || null,
    contact_email: values.email.trim() || null,
    detail_pairs: upsertDetailPairs(row, {
      "Leonix:brand": values.brand,
      "Leonix:model": values.model,
      "Leonix:state": values.state,
    }),
  };
  return patch;
}

// =====================================================================================
// BUSCO
// =====================================================================================

const BUSCO_FIELDS: LifecycleFieldSpec[] = [
  { key: "city", labelEs: "Ciudad", labelEn: "City", kind: "text" },
  { key: "state", labelEs: "Estado", labelEn: "State", kind: "text" },
  { key: "zip", labelEs: "Código postal", labelEn: "ZIP code", kind: "text" },
  {
    key: "budgetMode",
    labelEs: "Presupuesto",
    labelEn: "Budget",
    kind: "select",
    options: buscoTaxonomy.BUSCO_BUDGET_MODE_OPTIONS.map((o) => ({ value: o.value, labelEs: o.labelEs, labelEn: o.labelEn })),
  },
  {
    key: "budgetAmount",
    labelEs: "Monto del presupuesto (solo con “Tengo presupuesto”)",
    labelEn: "Budget amount (only with “I have a budget”)",
    kind: "text",
  },
  {
    key: "urgency",
    labelEs: "Urgencia",
    labelEn: "Urgency",
    kind: "select",
    options: buscoTaxonomy.BUSCO_URGENCY_OPTIONS.map((o) => ({ value: o.value, labelEs: o.labelEs, labelEn: o.labelEn })),
  },
  { key: "phone", labelEs: "Teléfono", labelEn: "Phone", kind: "tel" },
  { key: "whatsapp", labelEs: "WhatsApp", labelEn: "WhatsApp", kind: "tel" },
  { key: "email", labelEs: "Correo", labelEn: "Email", kind: "email" },
  { key: "facebook", labelEs: "Facebook", labelEn: "Facebook", kind: "text" },
  { key: "instagram", labelEs: "Instagram", labelEn: "Instagram", kind: "text" },
];

const BUSCO_FROZEN: LifecycleFrozenField[] = [
  {
    labelEs: "Tipo de solicitud",
    labelEn: "Request type",
    reasonEs: "Determina la taxonomía/plantilla del anuncio; cambiarlo después de publicar puede desalinear el contenido ya guardado con la categoría.",
    reasonEn: "Drives the listing's taxonomy/template; changing it after publish could misalign already-saved content with the category.",
  },
];

/**
 * Recovery P0 (port of 245a70f1c) — the real Busco quick publisher
 * (publishBuscoQuickToListings.ts) writes a STRUCTURED budget (Leonix:buscoBudgetMode +
 * Leonix:buscoBudgetAmount, omitted for "no_aplica") and the 4-state urgency
 * normal / esta_semana / lo_antes_posible / urgente_hoy (omitted for "normal"). This editor used
 * to edit only the legacy free-text Leonix:buscoBudget (ignored by resolveBuscoBudgetDisplay
 * whenever a structured mode exists) and offered {normal, urgente}, so saving an "urgente_hoy"
 * listing silently downgraded it. Legacy Leonix:buscoBudget is left untouched (still the display
 * fallback for pre-structured rows); legacy urgency values are coerced like the public readers do.
 */
const BUSCO_BUDGET_MODE_VALUES = new Set<string>(buscoTaxonomy.BUSCO_BUDGET_MODE_OPTIONS.map((o) => o.value));
const BUSCO_URGENCY_VALUES = new Set<string>(buscoTaxonomy.BUSCO_URGENCY_OPTIONS.map((o) => o.value));

function coerceBuscoUrgency(raw: string): string {
  const s = raw.trim();
  if (s === "pronto") return "esta_semana";
  if (s === "urgente") return "urgente_hoy";
  return BUSCO_URGENCY_VALUES.has(s) ? s : "normal";
}

function coerceBuscoBudgetMode(raw: string): string {
  const s = raw.trim();
  return BUSCO_BUDGET_MODE_VALUES.has(s) ? s : "no_aplica";
}

function hydrateBusco(row: Record<string, unknown>): Record<string, string> {
  const budgetMode = coerceBuscoBudgetMode(readPair(row, "Leonix:buscoBudgetMode"));
  return {
    city: readColumn(row, "city"),
    state: readPair(row, "Leonix:state"),
    zip: readPair(row, "Leonix:zip"),
    budgetMode,
    budgetAmount: budgetMode === "tiene" ? readPair(row, "Leonix:buscoBudgetAmount") : "",
    urgency: coerceBuscoUrgency(readPair(row, "Leonix:buscoUrgency")),
    phone: readColumn(row, "contact_phone"),
    whatsapp: readPair(row, "Leonix:whatsappDigits"),
    email: readColumn(row, "contact_email"),
    facebook: readPair(row, "Leonix:buscoFacebook"),
    instagram: readPair(row, "Leonix:buscoInstagram"),
  };
}

function serializeBusco(row: Record<string, unknown>, values: Record<string, string>): Record<string, unknown> {
  const phoneDigits = values.phone.replace(/\D/g, "").slice(0, 15);
  const waDigits = values.whatsapp.replace(/\D/g, "").slice(0, 15);
  const budgetMode = coerceBuscoBudgetMode(values.budgetMode ?? "");
  const urgency = coerceBuscoUrgency(values.urgency ?? "");
  return {
    city: values.city.trim() || null,
    contact_phone: values.phone.trim() || null,
    contact_email: values.email.trim() || null,
    detail_pairs: upsertDetailPairs(row, {
      "Leonix:state": values.state,
      "Leonix:zip": values.zip,
      // Mirrors publishBuscoQuickToListings: mode omitted for "no_aplica", amount only for "tiene".
      "Leonix:buscoBudgetMode": budgetMode === "no_aplica" ? null : budgetMode,
      "Leonix:buscoBudgetAmount": budgetMode === "tiene" ? (values.budgetAmount ?? "") : null,
      "Leonix:buscoUrgency": urgency === "normal" ? null : urgency,
      "Leonix:phoneDigits": phoneDigits || null,
      "Leonix:buscoContactPhoneAvailable": phoneDigits ? "1" : null,
      "Leonix:whatsappDigits": waDigits || null,
      "Leonix:buscoContactEmailAvailable": values.email.trim() ? "1" : null,
      "Leonix:buscoFacebook": values.facebook,
      "Leonix:buscoInstagram": values.instagram,
    }),
  };
}

// =====================================================================================
// CLASES
// =====================================================================================

const CLASES_FIELDS: LifecycleFieldSpec[] = [
  { key: "organizer", labelEs: "Organizador", labelEn: "Organizer", kind: "text" },
  { key: "venue", labelEs: "Lugar", labelEn: "Venue", kind: "text" },
  { key: "addressLine1", labelEs: "Dirección", labelEn: "Address", kind: "text" },
  { key: "city", labelEs: "Ciudad", labelEn: "City", kind: "text" },
  { key: "state", labelEs: "Estado", labelEn: "State", kind: "text" },
  { key: "zip", labelEs: "Código postal", labelEn: "ZIP code", kind: "text" },
  { key: "bringNote", labelEs: "Qué llevar", labelEn: "What to bring", kind: "textarea" },
  { key: "phone", labelEs: "Teléfono", labelEn: "Phone", kind: "tel" },
  { key: "email", labelEs: "Correo", labelEn: "Email", kind: "email" },
  { key: "website", labelEs: "Sitio web", labelEn: "Website", kind: "text" },
];

const CLASES_FROZEN: LifecycleFrozenField[] = [
  {
    labelEs: "Costo de la clase (gratis/pagada)",
    labelEn: "Class cost type (free/paid)",
    reasonEs:
      "Este campo debe preservar la verdad real de monetización; cambiarlo requiere arquitectura de pago fuera del alcance de este cierre. Congelado intencionalmente.",
    reasonEn:
      "This field must preserve real monetization truth; changing it requires payment architecture outside this closure's scope. Intentionally locked.",
  },
  {
    labelEs: "Horario semanal",
    labelEn: "Weekly schedule",
    reasonEs: "Se guarda como estructura día/hora; editarlo como texto libre arriesgaría corromper el horario mostrado. Se difiere para un selector dedicado.",
    reasonEn: "Stored as a structured day/time schedule; editing it as free text would risk corrupting the displayed schedule. Deferred for a dedicated picker.",
  },
  {
    labelEs: "Enlaces de inscripción, pago y otros (lote de 16)",
    labelEn: "Registration/payment/other links (batch of 16)",
    reasonEs: "Lote grande de campos opcionales de enlaces; se difiere para mantener este cierre proporcionado — el contenido principal ya está cubierto.",
    reasonEn: "Large batch of optional link fields; deferred to keep this closure proportionate — the core content is already covered.",
  },
];

function hydrateClases(row: Record<string, unknown>): Record<string, string> {
  return {
    organizer: readPair(row, "Leonix:organizer"),
    venue: readPair(row, "Leonix:venue"),
    addressLine1: readPair(row, "Leonix:addressLine1"),
    city: readColumn(row, "city"),
    state: readPair(row, "Leonix:state"),
    zip: readPair(row, "Leonix:zip"),
    bringNote: readPair(row, "Leonix:bringNote"),
    phone: readColumn(row, "contact_phone"),
    email: readColumn(row, "contact_email"),
    website: readPair(row, "Leonix:website"),
  };
}

function serializeClases(row: Record<string, unknown>, values: Record<string, string>): Record<string, unknown> {
  const phoneDigits = values.phone.replace(/\D/g, "").slice(0, 15);
  return {
    city: values.city.trim() || null,
    contact_phone: values.phone.trim() || null,
    contact_email: values.email.trim() || null,
    detail_pairs: upsertDetailPairs(row, {
      "Leonix:organizer": values.organizer,
      "Leonix:venue": values.venue,
      "Leonix:addressLine1": values.addressLine1,
      "Leonix:state": values.state,
      "Leonix:zip": values.zip,
      "Leonix:bringNote": values.bringNote,
      "Leonix:phoneDigits": phoneDigits || null,
      "Leonix:website": values.website,
    }),
  };
}

// =====================================================================================
// COMUNIDAD
// =====================================================================================

const COMUNIDAD_FIELDS: LifecycleFieldSpec[] = [
  { key: "organizer", labelEs: "Organizador", labelEn: "Organizer", kind: "text" },
  { key: "venue", labelEs: "Lugar", labelEn: "Venue", kind: "text" },
  { key: "addressLine1", labelEs: "Dirección", labelEn: "Address", kind: "text" },
  { key: "city", labelEs: "Ciudad", labelEn: "City", kind: "text" },
  { key: "state", labelEs: "Estado", labelEn: "State", kind: "text" },
  { key: "zip", labelEs: "Código postal", labelEn: "ZIP code", kind: "text" },
  { key: "date", labelEs: "Fecha", labelEn: "Date", kind: "text" },
  { key: "admissionNote", labelEs: "Nota de admisión", labelEn: "Admission note", kind: "text" },
  { key: "bringNote", labelEs: "Qué llevar", labelEn: "What to bring", kind: "textarea" },
  { key: "phone", labelEs: "Teléfono", labelEn: "Phone", kind: "tel" },
  { key: "email", labelEs: "Correo", labelEn: "Email", kind: "email" },
  { key: "website", labelEs: "Sitio web", labelEn: "Website", kind: "text" },
];

const COMUNIDAD_FROZEN: LifecycleFrozenField[] = [
  {
    labelEs: "Horario semanal, hora de sesión única",
    labelEn: "Weekly schedule, one-time session hours",
    reasonEs: "Igual que Clases — estructura día/hora, se difiere para un selector dedicado.",
    reasonEn: "Same as Clases — structured day/time schedule, deferred for a dedicated picker.",
  },
  {
    labelEs: "Enlaces del evento y redes sociales (lote de 20)",
    labelEn: "Event links and social links (batch of 20)",
    reasonEs: "Lote grande de campos opcionales; se difiere para mantener este cierre proporcionado.",
    reasonEn: "Large batch of optional fields; deferred to keep this closure proportionate.",
  },
];

function hydrateComunidad(row: Record<string, unknown>): Record<string, string> {
  return {
    organizer: readPair(row, "Leonix:organizer"),
    venue: readPair(row, "Leonix:venue"),
    addressLine1: readPair(row, "Leonix:addressLine1"),
    city: readColumn(row, "city"),
    state: readPair(row, "Leonix:state"),
    zip: readPair(row, "Leonix:zip"),
    date: readPair(row, "Leonix:eventDate"),
    admissionNote: readPair(row, "Leonix:admissionNote"),
    bringNote: readPair(row, "Leonix:bringNote"),
    phone: readColumn(row, "contact_phone"),
    email: readColumn(row, "contact_email"),
    website: readPair(row, "Leonix:website"),
  };
}

function serializeComunidad(row: Record<string, unknown>, values: Record<string, string>): Record<string, unknown> {
  const phoneDigits = values.phone.replace(/\D/g, "").slice(0, 15);
  return {
    city: values.city.trim() || null,
    contact_phone: values.phone.trim() || null,
    contact_email: values.email.trim() || null,
    detail_pairs: upsertDetailPairs(row, {
      "Leonix:organizer": values.organizer,
      "Leonix:venue": values.venue,
      "Leonix:addressLine1": values.addressLine1,
      "Leonix:state": values.state,
      "Leonix:zip": values.zip,
      "Leonix:eventDate": values.date,
      "Leonix:admissionNote": values.admissionNote,
      "Leonix:bringNote": values.bringNote,
      "Leonix:phoneDigits": phoneDigits || null,
      "Leonix:website": values.website,
    }),
  };
}

// =====================================================================================
// MASCOTAS Y PERDIDOS
// =====================================================================================

const MASCOTAS_FIELDS: LifecycleFieldSpec[] = [
  {
    key: "noticeType",
    labelEs: "Tipo de aviso",
    labelEn: "Notice type",
    kind: "select",
    options: mascotasTaxonomy.MASCOTAS_PERDIDOS_NOTICE_OPTIONS.map((o) => ({ value: o.value, labelEs: o.labelEs, labelEn: o.labelEn })),
  },
  { key: "city", labelEs: "Ciudad", labelEn: "City", kind: "text" },
  { key: "lastSeenLocation", labelEs: "Última ubicación vista", labelEn: "Last seen location", kind: "text" },
  { key: "phone", labelEs: "Teléfono", labelEn: "Phone", kind: "tel" },
  { key: "email", labelEs: "Correo", labelEn: "Email", kind: "email" },
];

const MASCOTAS_FROZEN: LifecycleFrozenField[] = [];

/**
 * Recovery P0 (port of 245a70f1c) — publishMascotasPerdidosQuickToListings writes
 * Leonix:noticeType from the 5-slug taxonomy (mascota-perdida / mascota-encontrada /
 * adopcion-mascota / objeto-perdido / objeto-encontrado). This editor used to offer
 * {perdido, encontrado}, so any owner save rewrote the slug to a value no public reader,
 * results filter or badge recognizes. Rows already corrupted by that bug are mapped back.
 */
const MASCOTAS_NOTICE_VALUES = new Set<string>(mascotasTaxonomy.MASCOTAS_PERDIDOS_NOTICE_OPTIONS.map((o) => o.value));

function coerceMascotasNoticeType(raw: string): string {
  const s = raw.trim().toLowerCase();
  if (s === "perdido") return "mascota-perdida";
  if (s === "encontrado") return "mascota-encontrada";
  return MASCOTAS_NOTICE_VALUES.has(s) ? s : "mascota-perdida";
}

function hydrateMascotas(row: Record<string, unknown>): Record<string, string> {
  return {
    noticeType: coerceMascotasNoticeType(readPair(row, "Leonix:noticeType")),
    city: readColumn(row, "city"),
    lastSeenLocation: readPair(row, "Leonix:lastSeenLocation"),
    phone: readColumn(row, "contact_phone"),
    email: readColumn(row, "contact_email"),
  };
}

function serializeMascotas(row: Record<string, unknown>, values: Record<string, string>): Record<string, unknown> {
  const phoneDigits = values.phone.replace(/\D/g, "").slice(0, 15);
  const existingWa = readPair(row, "Leonix:whatsappDigits").replace(/\D/g, "").slice(0, 15);
  return {
    city: values.city.trim() || null,
    contact_phone: values.phone.trim() || null,
    contact_email: values.email.trim() || null,
    detail_pairs: upsertDetailPairs(row, {
      "Leonix:noticeType": coerceMascotasNoticeType(values.noticeType ?? ""),
      "Leonix:lastSeenLocation": values.lastSeenLocation,
      "Leonix:phoneDigits": phoneDigits || null,
      "Leonix:whatsappDigits": existingWa || null,
      "Leonix:contactEmailAvailable": values.email.trim() ? "1" : null,
    }),
  };
}

// =====================================================================================
// Registry
// =====================================================================================

const ADAPTERS: Record<string, CategoryLifecycleAdapter> = {
  "en-venta": {
    category: "en-venta",
    fields: EN_VENTA_FIELDS,
    frozenFields: EN_VENTA_FROZEN,
    hydrate: hydrateEnVenta,
    serialize: serializeEnVenta,
  },
  busco: {
    category: "busco",
    fields: BUSCO_FIELDS,
    frozenFields: BUSCO_FROZEN,
    hydrate: hydrateBusco,
    serialize: serializeBusco,
  },
  clases: {
    category: "clases",
    fields: CLASES_FIELDS,
    frozenFields: CLASES_FROZEN,
    hydrate: hydrateClases,
    serialize: serializeClases,
  },
  comunidad: {
    category: "comunidad",
    fields: COMUNIDAD_FIELDS,
    frozenFields: COMUNIDAD_FROZEN,
    hydrate: hydrateComunidad,
    serialize: serializeComunidad,
  },
  "mascotas-y-perdidos": {
    category: "mascotas-y-perdidos",
    fields: MASCOTAS_FIELDS,
    frozenFields: MASCOTAS_FROZEN,
    hydrate: hydrateMascotas,
    serialize: serializeMascotas,
  },
};

export function getCategoryLifecycleAdapter(category: string | null | undefined): CategoryLifecycleAdapter | null {
  const key = String(category ?? "").toLowerCase().trim();
  return ADAPTERS[key] ?? null;
}

/** Gate 6 — Clases/Comunidad both store a composite `listings.description` (user prose + several
 * auto-generated labeled lines) built at publish time by buildDescriptionClases/buildDescriptionComunidad.
 * The public canvas only ever displays the FIRST segment (the genuine user-typed text) via
 * `extractCommunityQuickUserDescriptionFromPublishedBlurb` — so that first segment is "the real
 * public detail representation" for this field, not the whole blob. On save, only that first
 * segment is replaced; every auto-generated line after it (organizer/date/venue/etc., already
 * covered as their own structured fields above) is preserved verbatim, so this can never
 * silently overwrite a structured field baked into the blob's tail. */
export function isCompositeDescriptionCategory(category: string | null | undefined): boolean {
  const key = String(category ?? "").toLowerCase().trim();
  return key === "clases" || key === "comunidad";
}

export function splitCompositeDescription(raw: string): { userText: string; tail: string } {
  const t = String(raw ?? "");
  const parts = t.split(/\n\n+/);
  const first = (parts[0] ?? "").trim();
  if (first.startsWith("Organizador:") || first.startsWith("Organizer:")) {
    return { userText: "", tail: t.trim() };
  }
  const tail = parts.slice(1).join("\n\n").trim();
  return { userText: first, tail };
}

export function rebuildCompositeDescription(userText: string, tail: string): string {
  const trimmedUser = userText.trim();
  const trimmedTail = tail.trim();
  if (!trimmedTail) return trimmedUser;
  if (!trimmedUser) return trimmedTail;
  return `${trimmedUser}\n\n${trimmedTail}`;
}
