import { pickTranslatableAdFields } from "@/app/lib/translation/helpers";
import type { TranslatableAdFields } from "@/app/lib/translation/types";
import type { ComidaLocalPreviewVm } from "./comidaLocalPreviewTypes";

/**
 * Comida Local human-facing prose only — `queVendes`/`locationNote`/`availabilityNote` are the
 * only free-text fields on this profile (Globalization Build 04, Gate 12). Everything else
 * (phone/whatsapp/social URLs, food type, price level, service/payment/language chips, images)
 * is enum/contact/structured data, never sent to translation.
 */
export function buildComidaLocalTranslatableContent(vm: ComidaLocalPreviewVm): TranslatableAdFields {
  return {
    description: vm.queVendes?.trim() || undefined,
    details: vm.locationNote?.trim() || undefined,
    highlights: vm.availabilityNote?.trim() || undefined,
  };
}

export function hasComidaLocalTranslatableProse(content: unknown): boolean {
  return Object.keys(pickTranslatableAdFields(content)).length > 0;
}

export function applyComidaLocalTranslation<T extends ComidaLocalPreviewVm>(
  vm: T,
  translated: Partial<TranslatableAdFields>,
): T {
  let next: T = vm;

  if (translated.description?.trim()) {
    next = { ...next, queVendes: translated.description.trim() };
  }
  if (translated.details?.trim()) {
    next = { ...next, locationNote: translated.details.trim() };
  }
  if (translated.highlights?.trim()) {
    next = { ...next, availabilityNote: translated.highlights.trim() };
  }

  return next;
}

/** Client-only: POST masked fields to the server translate route (no API keys). */
export { requestAdTranslation as requestComidaLocalAdTranslation } from "@/app/lib/translation/requestAdTranslation";
