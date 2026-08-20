/**
 * LEO-15: central receipt-evidence sanitization boundary (fixture-safe, no I/O,
 * deliberately NOT server-only so it is directly unit-testable). Every call
 * site that writes into leo_tool_receipts (create or transition) must route
 * free-text/evidence fields through here first, via leoToolReceiptRepository.ts.
 * Reuses the existing secret-pattern detector rather than adding a second one.
 */
import { leoGoogleDiagnosticContainsForbiddenSecretMaterial } from "@/app/leo/_lib/leoGoogleConnectionDiagnostic";
import type { LeoConversationEntityRef } from "@/app/leo/_lib/leoTypes";

export const LEO_SOURCE_REFS_MAX = 50;
export const LEO_SOURCE_REF_FIELD_MAX = 200;

export function sanitizeLeoReceiptText(
  text: string | null | undefined,
): { ok: true } | { ok: false; error: string } {
  if (text && leoGoogleDiagnosticContainsForbiddenSecretMaterial(text)) {
    return { ok: false, error: "payload_contains_forbidden_material" };
  }
  return { ok: true };
}

export function sanitizeLeoReceiptSourceRefs(
  refs: LeoConversationEntityRef[] | undefined,
): { ok: true; refs: LeoConversationEntityRef[] } | { ok: false; error: string } {
  const input = refs ?? [];
  if (input.length > LEO_SOURCE_REFS_MAX) return { ok: false, error: "source_refs_too_many" };
  for (const ref of input) {
    if (
      ref.id.length > LEO_SOURCE_REF_FIELD_MAX ||
      (ref.label != null && ref.label.length > LEO_SOURCE_REF_FIELD_MAX)
    ) {
      return { ok: false, error: "source_ref_field_too_long" };
    }
    if (
      leoGoogleDiagnosticContainsForbiddenSecretMaterial(ref.id) ||
      (ref.label != null && leoGoogleDiagnosticContainsForbiddenSecretMaterial(ref.label))
    ) {
      return { ok: false, error: "payload_contains_forbidden_material" };
    }
  }
  return { ok: true, refs: input };
}
