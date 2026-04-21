/**
 * Single parser for En Venta `detail_pairs` → browse/detail signals.
 * Publish writes `Leonix:*` machine rows (see `enVentaPublishFromDraft`); this module also
 * understands legacy human-readable "Entrega" / "Fulfillment" summary rows.
 */

export type EnVentaFulfillmentFlags = {
  pickup: boolean;
  shipping: boolean;
  delivery: boolean;
  /** Buyer–seller meetup (separate from storefront pickup). */
  meetup: boolean;
};

export type ParsedEnVentaListingSignals = {
  fulfillment: EnVentaFulfillmentFlags;
  negotiable: boolean;
  brand: string | null;
  model: string | null;
  quantity: string | null;
};

function truthyPairValue(raw: string): boolean {
  const v = raw.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "sí" || v === "si";
}

function hasAnyMachineFulfillmentPair(pairs: Array<{ label: string; value: string }>): boolean {
  return pairs.some((p) => {
    const k = p.label.trim();
    return k === "Leonix:pickup" || k === "Leonix:ship" || k === "Leonix:delivery" || k === "Leonix:meetup";
  });
}

/** Parse localized "Recogida · Envío · …" / "Pickup · Shipping · …" lines from `appendEnVentaDetailPairs`. */
function ingestHumanFulfillmentSummary(value: string, into: EnVentaFulfillmentFlags): void {
  const segments = value
    .split("·")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  for (const seg of segments.length ? segments : [value.trim().toLowerCase()]) {
    if (seg.includes("recogida") || seg.includes("pickup")) into.pickup = true;
    if (seg.includes("envío") || seg.includes("envio") || seg.includes("shipping")) into.shipping = true;
    if (seg === "entrega" || seg.includes("local delivery") || (seg.includes("delivery") && !seg.includes("shipping"))) {
      into.delivery = true;
    }
  }
}

/**
 * Derive negotiable / meetup / quantity from non-machine rows (localized publish history).
 */
function ingestLoosePairs(pairs: Array<{ label: string; value: string }>): {
  negotiable: boolean;
  meetup: boolean;
  quantity: string | null;
} {
  let negotiable = false;
  let meetup = false;
  let quantity: string | null = null;
  for (const p of pairs) {
    const lb = p.label.trim();
    const lk = lb.toLowerCase();
    const val = p.value.trim();
    if (!val) continue;
    if (lk.includes("negotiable") || lk.includes("negociable")) {
      negotiable = negotiable || truthyPairValue(val) || /^sí|^yes$/i.test(val.trim());
    }
    if (lk.includes("encuentro") || (lk.includes("meetup") && !lk.includes("pickup"))) {
      meetup = meetup || truthyPairValue(val) || /^sí|^yes$/i.test(val.trim());
    }
    if (!quantity && (lk.includes("cantidad") || (lk.includes("quantity") && !lk.includes("quality")))) {
      quantity = val;
    }
  }
  return { negotiable, meetup, quantity };
}

export function parseEnVentaDetailPairSignals(
  pairs: Array<{ label: string; value: string }>,
  context: { title?: string; description?: string }
): ParsedEnVentaListingSignals {
  const fulfillment: EnVentaFulfillmentFlags = {
    pickup: false,
    shipping: false,
    delivery: false,
    meetup: false,
  };
  let negotiable = false;
  let brand: string | null = null;
  let model: string | null = null;
  let quantity: string | null = null;

  for (const p of pairs) {
    const lb = p.label.trim();
    const val = p.value.trim();
    switch (lb) {
      case "Leonix:pickup":
        fulfillment.pickup = truthyPairValue(val);
        break;
      case "Leonix:ship":
        fulfillment.shipping = truthyPairValue(val);
        break;
      case "Leonix:delivery":
        fulfillment.delivery = truthyPairValue(val);
        break;
      case "Leonix:meetup":
        fulfillment.meetup = truthyPairValue(val);
        break;
      case "Leonix:negotiable":
        negotiable = negotiable || truthyPairValue(val);
        break;
      case "Leonix:brand":
        if (val) brand = val;
        break;
      case "Leonix:model":
        if (val) model = val;
        break;
      default:
        break;
    }
  }

  const loose = ingestLoosePairs(pairs);
  negotiable = negotiable || loose.negotiable;
  fulfillment.meetup = fulfillment.meetup || loose.meetup;
  quantity = quantity || loose.quantity;

  if (!hasAnyMachineFulfillmentPair(pairs)) {
    for (const p of pairs) {
      if (/entrega|fulfillment/i.test(p.label)) {
        ingestHumanFulfillmentSummary(p.value, fulfillment);
      }
    }
  }

  if (!negotiable) {
    const blob = `${context.title ?? ""} ${context.description ?? ""}`;
    negotiable = /negociable|negotiable|\bobo\b|o\.b\.o\./i.test(blob);
  }

  return { fulfillment, negotiable, brand, model, quantity };
}

/** Dev-only invariant checks; empty array = pass. */
export function runEnVentaDetailPairSignalsSelfCheck(): string[] {
  const errs: string[] = [];
  const humanOnly: Array<{ label: string; value: string }> = [
    { label: "Entrega", value: "Recogida · Envío · Entrega" },
  ];
  const h = parseEnVentaDetailPairSignals(humanOnly, {});
  if (!h.fulfillment.pickup || !h.fulfillment.shipping || !h.fulfillment.delivery) {
    errs.push("human_fulfillment_es");
  }

  const machine: Array<{ label: string; value: string }> = [
    { label: "Leonix:pickup", value: "1" },
    { label: "Leonix:ship", value: "0" },
    { label: "Leonix:delivery", value: "1" },
    { label: "Leonix:meetup", value: "1" },
    { label: "Leonix:negotiable", value: "1" },
    { label: "Leonix:brand", value: "Acme" },
    { label: "Leonix:model", value: "X1" },
  ];
  const m = parseEnVentaDetailPairSignals(machine, {});
  if (!m.fulfillment.pickup || m.fulfillment.shipping || !m.fulfillment.delivery || !m.fulfillment.meetup) {
    errs.push("machine_fulfillment");
  }
  if (!m.negotiable || m.brand !== "Acme" || m.model !== "X1") errs.push("machine_meta");

  const mixed = [...machine, { label: "Entrega", value: "Pickup" }];
  const m2 = parseEnVentaDetailPairSignals(mixed, {});
  if (!m2.fulfillment.pickup) errs.push("machine_wins_over_human");

  return errs;
}
