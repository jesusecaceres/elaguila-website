/**
 * REQUIRED REPAIR 4 — same-row server authority, as PURE logic.
 *
 * THE DEFECT THIS EXISTS FOR
 * --------------------------
 * Every assisted save route used to decide which row to write from a value the BROWSER sent
 * (`existingListingId` / `existingMainListingId` / `draft.draftListingId`). The browser is the one
 * party in this transaction with no authority at all: it is the staff member's tab, a copied curl,
 * or whatever a stale React state happens to still be holding. When that value was absent the
 * routes did not fail — they created ANOTHER row, which is how a second "save" produced a second
 * canonical listing and a prospect ended up with two half-finished ads.
 *
 * WHAT REPLACES IT
 * ----------------
 * The server-issued assisted context carries the canonical listing id from the moment the row
 * exists. After that, a browser-supplied id is no longer an instruction — it is a CLAIM, and the
 * only thing it is allowed to do is agree. Disagreement fails closed rather than resolving to
 * either value, because a mismatch means one of the two parties is looking at the wrong ad and
 * writing to either one is a guess.
 *
 * This module is deliberately pure — no `server-only`, no Next.js, no database — so the verifier
 * can EXECUTE these decisions (bound id wins, mismatch refuses, wrong action refuses) against the
 * real code instead of matching strings in it.
 */

export type AssistedBindingRefusal = {
  ok: false;
  /** Stable machine code, safe to return to the caller. Never carries a secret or a raw token. */
  error: "assisted_action_not_authorized" | "assisted_listing_mismatch" | "assisted_business_mismatch" | "assisted_category_mismatch";
  status: number;
};

export type AssistedBindingResolution = {
  ok: true;
  /** The row every write in this request must target. "" only on the very first save. */
  listingId: string;
  /** True when the id came from the server-issued context rather than from the request body. */
  serverBound: boolean;
};

export type AssistedBindingResult = AssistedBindingResolution | AssistedBindingRefusal;

function trimmed(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Identity gate: the assisted context must be for the category being served and, when the caller
 * states a business, for that business. A mismatched category or business fails closed — it is
 * never "corrected" to the context's own values, because a request that names the wrong business
 * is a request whose payload is about a different customer.
 */
export function assertAssistedIdentity(input: {
  contextCategory: string;
  expectedCategory: string;
  contextBusinessId: string;
  /** Optional: only checked when the caller actually asserts a business. */
  requestBusinessId?: string | null;
}): AssistedBindingRefusal | null {
  if (trimmed(input.contextCategory) !== trimmed(input.expectedCategory)) {
    return { ok: false, error: "assisted_category_mismatch", status: 403 };
  }
  const claimed = trimmed(input.requestBusinessId);
  if (claimed && claimed !== trimmed(input.contextBusinessId)) {
    return { ok: false, error: "assisted_business_mismatch", status: 409 };
  }
  return null;
}

/**
 * Decide the ONE row this assisted request may write.
 *
 * - The context's action, when present, must be the action being attempted. A context minted to
 *   prepare a draft is not authority for anything else.
 * - A server-bound listing id always wins. A body id is accepted only as agreement.
 * - With no bound id (the first save, before the row exists) the body id is returned UNBOUND, and
 *   the caller must still prove it through the custody ledger before writing to it. Returning it
 *   here is not trust; it is passing the claim along to the check that can actually test it.
 */
export function resolveAssistedRowBinding(input: {
  contextListingId?: string | null;
  contextAssistedAction?: string | null;
  requestedAction: string;
  bodyListingId?: string | null;
}): AssistedBindingResult {
  const contextAction = trimmed(input.contextAssistedAction);
  const requested = trimmed(input.requestedAction);
  if (contextAction && contextAction !== requested) {
    return { ok: false, error: "assisted_action_not_authorized", status: 403 };
  }

  const bound = trimmed(input.contextListingId);
  const claimed = trimmed(input.bodyListingId);

  if (bound) {
    if (claimed && claimed !== bound) {
      return { ok: false, error: "assisted_listing_mismatch", status: 409 };
    }
    return { ok: true, listingId: bound, serverBound: true };
  }

  return { ok: true, listingId: claimed, serverBound: false };
}
