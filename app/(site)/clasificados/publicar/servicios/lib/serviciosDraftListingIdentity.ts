/**
 * Servicios — ONE APPLICATION = ONE CANONICAL LISTING UUID = ONE LEONIX AD ID.
 *
 * ROOT CAUSE THIS MODULE CLOSES (production forensic, SERV-2026-000111…115): the canonical row id
 * returned by the first `pending_payment` save was kept ONLY under a "last published" session key,
 * and the Application form's non-edit mount effect unconditionally erased that key every time it
 * mounted — while restoring the DRAFT (which does not contain the id). "Back to edit" from Preview,
 * or returning to the form after a cancelled Stripe checkout, therefore made the next checkout send
 * no `existingListingId`; the publish route (correctly) treated it as a brand-new application and
 * INSERTed another row with a `name-2` / `name-3` slug.
 *
 * The identity now lives and dies WITH THE DRAFT: it is written when a save returns a canonical id,
 * restored (not wiped) when the Application form re-mounts, and removed only when the draft itself
 * is cleared (delete draft / start a dashboard edit / post-publish clear). Pure, storage-injectable
 * functions so the lifecycle is unit-testable without a browser.
 */

export const SERVICIOS_DRAFT_LISTING_IDENTITY_SESSION_KEY = "leonix.clasificados.servicios.draftListingIdentity.v1";

export type ServiciosDraftListingIdentity = {
  listingId: string;
  leonixAdId: string | null;
  slug: string | null;
};

/** Minimal Storage surface (sessionStorage in the browser, a Map-backed fake in tests). */
export type ServiciosIdentityStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function clean(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

export function readServiciosDraftListingIdentity(
  storage: ServiciosIdentityStorage | null | undefined,
): ServiciosDraftListingIdentity | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(SERVICIOS_DRAFT_LISTING_IDENTITY_SESSION_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Record<string, unknown> | null;
    const listingId = clean(v?.listingId);
    if (!listingId) return null;
    return { listingId, leonixAdId: clean(v?.leonixAdId), slug: clean(v?.slug) };
  } catch {
    return null;
  }
}

/** Records the canonical identity a save returned. A save that returned no listing id is a no-op. */
export function rememberServiciosDraftListingIdentity(
  storage: ServiciosIdentityStorage | null | undefined,
  identity: { listingId?: string | null; leonixAdId?: string | null; slug?: string | null },
): void {
  if (!storage) return;
  const listingId = clean(identity.listingId);
  if (!listingId) return;
  try {
    storage.setItem(
      SERVICIOS_DRAFT_LISTING_IDENTITY_SESSION_KEY,
      JSON.stringify({ listingId, leonixAdId: clean(identity.leonixAdId), slug: clean(identity.slug) }),
    );
  } catch {
    /* quota / private mode — the in-flight session key still carries identity for this tab */
  }
}

export function clearServiciosDraftListingIdentity(storage: ServiciosIdentityStorage | null | undefined): void {
  if (!storage) return;
  try {
    storage.removeItem(SERVICIOS_DRAFT_LISTING_IDENTITY_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Which canonical listing id a publish request should declare. Order (most specific first):
 * an id the caller passed explicitly → the id primed for this session (dashboard edit / last save)
 * → the identity bound to the current draft. Returns undefined ONLY when there is genuinely no known
 * canonical row — i.e. a first save for a brand-new application.
 */
export function resolveServiciosExistingListingId(input: {
  explicit?: string | null;
  sessionPrimed?: string | null;
  draftIdentity?: ServiciosDraftListingIdentity | null;
}): string | undefined {
  return clean(input.explicit) ?? clean(input.sessionPrimed) ?? clean(input.draftIdentity?.listingId) ?? undefined;
}

/**
 * What the Application form must do to the "primed" session keys when it (re)mounts in NON-edit
 * mode. Previously this was an unconditional wipe. Now: if the draft it is about to restore is bound
 * to a canonical listing, that identity is RESTORED into the primed keys; only a draft with no bound
 * identity (a genuinely new application) starts with cleared keys.
 */
export function reconcileServiciosPrimedIdentityOnApplicationMount(
  draftIdentity: ServiciosDraftListingIdentity | null,
): { listingId: string | null; slug: string | null } {
  return { listingId: draftIdentity?.listingId ?? null, slug: draftIdentity?.slug ?? null };
}
