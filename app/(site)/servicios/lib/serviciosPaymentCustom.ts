import type { ServiciosApplicationDraft } from "../types/serviciosApplicationDraft";
import {
  CUSTOM_PAYMENT_LABEL_MAX,
  MAX_CUSTOM_PAYMENT_METHODS,
  collectStandardPaymentMethodDedupeKeys,
  normalizePaymentMethodDedupeKey,
} from "./serviciosPaymentMethodCatalog";

export type AddCustomPaymentOutcome =
  | { ok: true; label: string }
  | { ok: false; reason: "blank" | "duplicate" | "cap" | "standard_collision" };

/**
 * Shared rules for Clasificados state + Servicios application draft (accent/case-insensitive dedupe vs catalog labels).
 */
export function evaluateAddCustomPaymentLabel(params: {
  customPaymentMethods: string[] | undefined;
  raw: string;
}): AddCustomPaymentOutcome {
  const label = params.raw.trim().slice(0, CUSTOM_PAYMENT_LABEL_MAX);
  if (!label) return { ok: false, reason: "blank" };

  const customs = params.customPaymentMethods ?? [];
  if (customs.length >= MAX_CUSTOM_PAYMENT_METHODS) return { ok: false, reason: "cap" };

  const k = normalizePaymentMethodDedupeKey(label);
  const blocked = collectStandardPaymentMethodDedupeKeys();
  if (blocked.has(k)) return { ok: false, reason: "standard_collision" };

  if (customs.some((x) => normalizePaymentMethodDedupeKey(x) === k)) {
    return { ok: false, reason: "duplicate" };
  }

  return { ok: true, label };
}

/** Merge pending custom payment field into lists (preview / navigation flush). */
export function flushPendingCustomPaymentOnDraft(draft: ServiciosApplicationDraft): ServiciosApplicationDraft {
  const raw = draft.customPaymentMethodLabel?.trim() ?? "";
  if (!raw) return draft;
  const r = evaluateAddCustomPaymentLabel({
    customPaymentMethods: draft.customPaymentMethods,
    raw,
  });
  if (r.ok) {
    return {
      ...draft,
      customPaymentMethods: [...(draft.customPaymentMethods ?? []), r.label],
      customPaymentMethodLabel: "",
    };
  }
  return { ...draft, customPaymentMethodLabel: "" };
}
