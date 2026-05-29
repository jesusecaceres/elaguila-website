import type { EnVentaFreeApplicationState } from "@/app/clasificados/publicar/en-venta/free/application/schema/enVentaFreeFormState";
import {
  enVentaCategoryLine,
  enVentaConditionDisplay,
  enVentaFulfillmentLabels,
} from "@/app/clasificados/en-venta/mapping/appendEnVentaDetailPairs";
import { parseEnVentaDetailPairSignals } from "@/app/clasificados/en-venta/mapping/enVentaDetailPairSignals";
import { getArticuloLabel } from "@/app/clasificados/en-venta/shared/fields/enVentaTaxonomy";
import {
  EN_VENTA_CONTENT_STACK_COPY,
  type EnVentaContentStackModel,
  type EnVentaDeliveryItem,
} from "../types/enVentaContentStack.types";

type Lang = "es" | "en";

function machinePairValue(rows: Array<{ label: string; value: string }>, key: string): string {
  return rows.find((r) => r.label.trim() === key)?.value.trim() ?? "";
}

function pairValueByLabelMatch(
  rows: Array<{ label: string; value: string }>,
  pattern: RegExp
): string {
  for (const r of rows) {
    if (pattern.test(r.label) && r.value.trim()) return r.value.trim();
  }
  return "";
}

/** Split published description body from delivery appendix when present. */
export function splitEnVentaDescriptionAndDelivery(
  raw: string,
  lang: Lang
): { description: string; deliveryNotes: string[] } {
  const text = raw.trim();
  if (!text) return { description: "", deliveryNotes: [] };
  const header = EN_VENTA_CONTENT_STACK_COPY[lang].deliveryHeader;
  const idx = text.indexOf(header);
  if (idx < 0) return { description: text, deliveryNotes: [] };
  const before = text.slice(0, idx).trim();
  const after = text.slice(idx + header.length).replace(/^:\s*/, "").trim();
  const deliveryNotes = after
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  return { description: before, deliveryNotes };
}

function buildDeliveryItemsFromState(state: EnVentaFreeApplicationState, lang: Lang): EnVentaDeliveryItem[] {
  const t =
    lang === "es"
      ? {
          shipping: "Envío disponible",
          pickup: "Recogida local",
          meetup: "Punto de encuentro",
          delivery: "Entrega local",
        }
      : {
          shipping: "Shipping available",
          pickup: "Local pickup",
          meetup: "Meetup",
          delivery: "Local delivery",
        };
  const items: EnVentaDeliveryItem[] = [];
  if (state.shipping) {
    items.push({ label: t.shipping, note: state.shippingNotes.trim() || null });
  }
  if (state.pickup) {
    items.push({ label: t.pickup, note: state.pickupDetailNotes.trim() || null });
  }
  if (state.meetup) {
    items.push({ label: t.meetup, note: state.meetupDetailNotes.trim() || null });
  }
  if (state.localDelivery) {
    items.push({ label: t.delivery, note: state.localDeliveryDetailNotes.trim() || null });
  }
  return items;
}

function assignDeliveryNotesToItems(items: EnVentaDeliveryItem[], notes: string[]): EnVentaDeliveryItem[] {
  if (!notes.length) return items;
  return items.map((item, i) => ({
    ...item,
    note: item.note || notes[i]?.trim() || null,
  }));
}

export function buildEnVentaContentStackFromDraftState(
  state: EnVentaFreeApplicationState,
  lang: Lang
): EnVentaContentStackModel {
  const t = EN_VENTA_CONTENT_STACK_COPY[lang];
  const condLabel = enVentaConditionDisplay(state.condition, lang) ?? "";
  const dept = state.rama.trim();
  const sub = state.evSub.trim();
  const itemType = state.itemType.trim();
  const categoryLine =
    enVentaCategoryLine({ departmentKey: dept, subKey: sub, articleKey: itemType }, lang) ?? "";

  const itemFacts: EnVentaContentStackModel["itemFacts"] = [];
  if (condLabel) itemFacts.push({ label: t.condition, value: condLabel });
  if (itemType) {
    itemFacts.push({
      label: t.itemType,
      value: dept ? getArticuloLabel(dept, itemType, lang) : itemType,
    });
  }
  if (categoryLine) itemFacts.push({ label: t.category, value: categoryLine });
  if (state.brand.trim()) itemFacts.push({ label: t.brand, value: state.brand.trim() });
  if (state.model.trim()) itemFacts.push({ label: t.model, value: state.model.trim() });
  if (state.quantity.trim()) itemFacts.push({ label: t.quantity, value: state.quantity.trim() });

  const deliveryItems = buildDeliveryItemsFromState(state, lang);

  return {
    description: state.description.trim(),
    itemFacts,
    conditionAndUse: state.wearNotes.trim() || null,
    accessories: state.accessoriesNotes.trim() || null,
    technicalDetails: state.itemExtraDetails.trim() || null,
    deliveryItems,
    deliveryChipLabels: deliveryItems.map((d) => d.label),
  };
}

export function buildEnVentaContentStackFromLiveListing(input: {
  rows: Array<{ label: string; value: string }>;
  description: string;
  lang: Lang;
}): EnVentaContentStackModel {
  const { rows, description, lang } = input;
  const t = EN_VENTA_CONTENT_STACK_COPY[lang];

  const dept = machinePairValue(rows, "Leonix:evDept");
  const sub = machinePairValue(rows, "Leonix:evSub");
  const article = machinePairValue(rows, "Leonix:itemType");
  const categoryLine = enVentaCategoryLine({ departmentKey: dept, subKey: sub, articleKey: article }, lang) ?? "";

  const condRaw =
    pairValueByLabelMatch(rows, /condición|condicion|condition/i) ||
    machinePairValue(rows, "Leonix:condition");
  const condLabel = enVentaConditionDisplay(condRaw, lang) ?? condRaw;

  const brand = machinePairValue(rows, "Leonix:brand") || pairValueByLabelMatch(rows, /^marca$|^brand$/i);
  const model = machinePairValue(rows, "Leonix:model") || pairValueByLabelMatch(rows, /^modelo$|^model$/i);
  const quantity =
    pairValueByLabelMatch(rows, /cantidad|quantity/i) ||
    parseEnVentaDetailPairSignals(rows, { title: "", description }).quantity ||
    "";

  const itemFacts: EnVentaContentStackModel["itemFacts"] = [];
  if (condLabel) itemFacts.push({ label: t.condition, value: condLabel });
  if (article) {
    itemFacts.push({
      label: t.itemType,
      value: dept ? getArticuloLabel(dept, article, lang) : article,
    });
  }
  if (categoryLine) itemFacts.push({ label: t.category, value: categoryLine });
  if (brand) itemFacts.push({ label: t.brand, value: brand });
  if (model) itemFacts.push({ label: t.model, value: model });
  if (quantity) itemFacts.push({ label: t.quantity, value: quantity });

  const { description: mainDescription, deliveryNotes } = splitEnVentaDescriptionAndDelivery(description, lang);
  const signals = parseEnVentaDetailPairSignals(rows, { title: "", description });
  const deliveryChipLabels = enVentaFulfillmentLabels(signals.fulfillment, lang);

  let deliveryItems: EnVentaDeliveryItem[] = deliveryChipLabels.map((label) => ({ label, note: null }));
  deliveryItems = assignDeliveryNotesToItems(deliveryItems, deliveryNotes);

  const conditionAndUse = pairValueByLabelMatch(rows, /condición y uso|condition and use|condition & wear/i) || null;
  const accessories = pairValueByLabelMatch(rows, /accesorios|accessories/i) || null;
  const technical =
    pairValueByLabelMatch(rows, /detalles técnicos|detalles \/ especificaciones|technical details|details \/ specifications/i) ||
    null;

  return {
    description: mainDescription,
    itemFacts,
    conditionAndUse,
    accessories,
    technicalDetails: technical,
    deliveryItems,
    deliveryChipLabels,
  };
}
