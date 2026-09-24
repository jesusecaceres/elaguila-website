/**
 * ASSISTED REOPEN (Autos) — which `owner_user_id` an assisted UPDATE of an EXISTING row is scoped by.
 *
 * THE DEFECT THIS EXISTS FOR
 * --------------------------
 * `updateAutosClassifiedsListingDraft(id, ownerUserId, ...)` is owner-scoped: with an owner id it
 * only matches a row owned by that user, with `null` it only matches an owner-null row. Assisted
 * saves passed `clientUserId ?? null` from the request/cookie, so on REOPEN the two halves could
 * disagree with the stored row — an owner-null (organizational custody) row addressed with a
 * client id, or a client-owned row addressed with no client — and the save was refused as
 * "not found or forbidden" even though the staff session legitimately holds custody of that row.
 *
 * WHAT REPLACES IT
 * ----------------
 * Once the caller has proven custody of the row (business_listing_links, signed context, category
 * and lane), the STORED row decides the scope: an owner-null row is written on the owner-null path
 * (a client id is attribution only and is never written into the owner column); a client-owned row
 * is written as its own owner. A request that names a DIFFERENT client than the stored owner is a
 * refusal, never a re-assignment. Pure — the verifier executes it.
 */
export type AssistedAutosWriteOwner =
  | { ok: true; ownerUserId: string | null; source: "row_owner_null" | "row_owner" }
  | { ok: false; error: "assisted_client_mismatch"; status: 409 };

function trimmed(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function resolveAssistedAutosWriteOwner(input: {
  rowOwnerUserId: string | null | undefined;
  requestClientUserId?: string | null;
}): AssistedAutosWriteOwner {
  const rowOwner = trimmed(input.rowOwnerUserId);
  if (!rowOwner) return { ok: true, ownerUserId: null, source: "row_owner_null" };
  const requested = trimmed(input.requestClientUserId);
  if (requested && requested !== rowOwner) {
    return { ok: false, error: "assisted_client_mismatch", status: 409 };
  }
  return { ok: true, ownerUserId: rowOwner, source: "row_owner" };
}
