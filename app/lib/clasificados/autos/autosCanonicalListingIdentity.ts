/**
 * Autos — ONE APPLICATION = ONE CANONICAL LISTING UUID = ONE LEONIX AD ID (closeout 2 / edit-safety).
 *
 * ROOT CAUSE THIS MODULE CLOSES: the Autos confirm flow, the Privado preview save and the Negocios
 * preview save cached the canonical listing id ONLY in `sessionStorage["lx-autos-publish-listing-<lane>"]`.
 * Every failure branch (failed GET, non-editable status, failed PATCH, a brand-new tab) then erased the
 * key and fell through to `POST /api/clasificados/autos/listings`, which ALWAYS inserts — so a transient
 * error or a second tab minted a second row with a second Leonix Ad ID (and a second base charge).
 *
 * Contract now:
 *  - The identity is persisted BOUND TO THE DRAFT (session + local storage, scoped by lane and by the
 *    per-user draft namespace) and cleared only when the draft itself is reset / the user switches.
 *  - A save with a declared identity (explicit `listingId` from the URL, or the draft-bound identity)
 *    can only ever end in PATCH-the-same-row or a FAIL-CLOSED error. It NEVER falls through to POST.
 *  - Only a genuinely new application (no declared identity, or an identity whose row is confirmed
 *    absent for this owner) may POST.
 *
 * Pure + dependency-free (fetch / storage are injected) so it is unit-testable without a browser.
 */

export type AutosIdentityLane = "privado" | "negocios";
export type AutosLang = "es" | "en";

/** Minimal Storage surface (browser Storage, or a Map-backed fake in tests). */
export type AutosIdentityStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export type AutosIdentityStorages = {
  session?: AutosIdentityStorage | null;
  local?: AutosIdentityStorage | null;
};

export const AUTOS_DRAFT_LISTING_IDENTITY_KEY_PREFIX = "leonix.clasificados.autos.draftListingIdentity.v1.";

/** Legacy session key still read by Inventory Boost / Application (`lx-autos-publish-listing-<lane>`). */
export function autosLegacyListingSessionKey(lane: AutosIdentityLane): string {
  return `lx-autos-publish-listing-${lane}`;
}

/**
 * Identity scope. Inventory-add (a NEW child vehicle under a parent dealer row) is a different
 * application than the parent, so it gets its own scope and never reuses / overwrites the parent's id.
 */
export function autosIdentityScope(lane: AutosIdentityLane, inventoryParentListingId?: string | null): string {
  const parent = clean(inventoryParentListingId);
  return parent ? `${lane}:inv:${parent}` : lane;
}

export type AutosDraftListingIdentity = {
  listingId: string;
  leonixAdId: string | null;
  /** Per-user draft namespace the identity was created under (u:<userId>); null when unknown. */
  namespace: string | null;
};

function clean(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function identityKey(scope: string): string {
  return `${AUTOS_DRAFT_LISTING_IDENTITY_KEY_PREFIX}${scope}`;
}

function tryGet(s: AutosIdentityStorage | null | undefined, key: string): string | null {
  if (!s) return null;
  try {
    return s.getItem(key);
  } catch {
    return null;
  }
}
function trySet(s: AutosIdentityStorage | null | undefined, key: string, value: string): void {
  if (!s) return;
  try {
    s.setItem(key, value);
  } catch {
    /* quota / private mode — the other storage still carries identity */
  }
}
function tryRemove(s: AutosIdentityStorage | null | undefined, key: string): void {
  if (!s) return;
  try {
    s.removeItem(key);
  } catch {
    /* ignore */
  }
}

function parseIdentity(raw: string | null): AutosDraftListingIdentity | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Record<string, unknown> | null;
    const listingId = clean(v?.listingId);
    if (!listingId) return null;
    return { listingId, leonixAdId: clean(v?.leonixAdId), namespace: clean(v?.namespace) };
  } catch {
    return null;
  }
}

/**
 * Reads the draft-bound identity for a scope. An identity created under a DIFFERENT user namespace is
 * ignored (never applied to another account). The legacy session key is honoured as a last fallback
 * (older tabs / Inventory Boost wrote only that key) — for the plain lane scope only.
 */
export function readAutosDraftListingIdentity(
  storages: AutosIdentityStorages,
  scope: string,
  lane: AutosIdentityLane,
  namespace?: string | null,
): AutosDraftListingIdentity | null {
  const ns = clean(namespace);
  const key = identityKey(scope);
  let otherAccountIdentitySeen = false;
  for (const s of [storages.session, storages.local]) {
    const id = parseIdentity(tryGet(s, key));
    if (!id) continue;
    if (ns && id.namespace && id.namespace !== ns) {
      otherAccountIdentitySeen = true;
      continue;
    }
    return id;
  }
  // The legacy key carries no owner: never apply it when a namespaced identity proves it belongs to another account.
  if (scope === lane && !otherAccountIdentitySeen) {
    const legacy = clean(tryGet(storages.session, autosLegacyListingSessionKey(lane)));
    if (legacy) return { listingId: legacy, leonixAdId: null, namespace: null };
  }
  return null;
}

/** Records the canonical identity a save returned. A save that returned no id is a no-op. */
export function rememberAutosDraftListingIdentity(
  storages: AutosIdentityStorages,
  scope: string,
  lane: AutosIdentityLane,
  identity: { listingId?: string | null; leonixAdId?: string | null; namespace?: string | null },
): void {
  const listingId = clean(identity.listingId);
  if (!listingId) return;
  const json = JSON.stringify({
    listingId,
    leonixAdId: clean(identity.leonixAdId),
    namespace: clean(identity.namespace),
  });
  const key = identityKey(scope);
  trySet(storages.session, key, json);
  trySet(storages.local, key, json);
  if (scope === lane) trySet(storages.session, autosLegacyListingSessionKey(lane), listingId);
}

export function clearAutosDraftListingIdentity(
  storages: AutosIdentityStorages,
  scope: string,
  lane: AutosIdentityLane,
): void {
  const key = identityKey(scope);
  tryRemove(storages.session, key);
  tryRemove(storages.local, key);
  if (scope === lane) tryRemove(storages.session, autosLegacyListingSessionKey(lane));
}

/** Drops every identity for a lane (plain + inventory-add scopes are keyed by prefix, so callers clear the plain scope). */
export function clearAutosLaneListingIdentity(storages: AutosIdentityStorages, lane: AutosIdentityLane): void {
  clearAutosDraftListingIdentity(storages, lane, lane);
}

export function getBrowserAutosIdentityStorages(): AutosIdentityStorages {
  if (typeof window === "undefined") return {};
  let session: Storage | null = null;
  let local: Storage | null = null;
  try {
    session = window.sessionStorage;
  } catch {
    session = null;
  }
  try {
    local = window.localStorage;
  } catch {
    local = null;
  }
  return { session, local };
}

/**
 * Edit / dashboard context in the URL. A `listingId` query param declares the canonical row the
 * user is editing; it is honoured for every Autos save so a dashboard edit can never create a row.
 */
export function readAutosExplicitListingIdFromSearch(search: string | null | undefined): string | null {
  if (!search) return null;
  try {
    const q = new URLSearchParams(search);
    return clean(q.get("listingId"));
  } catch {
    return null;
  }
}

/** Which id a save should declare: explicit (URL / caller) → draft-bound identity → undefined (new application). */
export function resolveAutosDeclaredListingId(input: {
  explicit?: string | null;
  draftIdentity?: AutosDraftListingIdentity | null;
}): { listingId: string; source: "explicit" | "draft_identity" } | null {
  const explicit = clean(input.explicit);
  if (explicit) return { listingId: explicit, source: "explicit" };
  const bound = clean(input.draftIdentity?.listingId);
  if (bound) return { listingId: bound, source: "draft_identity" };
  return null;
}

/** Statuses a PATCH may write (mirrors the server: draft / pending_payment / payment_failed). */
export function isAutosPreLiveEditableStatus(status: unknown): boolean {
  const s = typeof status === "string" ? status.trim().toLowerCase() : "";
  return s === "draft" || s === "pending_payment" || s === "payment_failed";
}

export type AutosCanonicalSaveFailureCode =
  | "not_editable"
  | "not_found"
  | "wrong_lane"
  | "unverifiable"
  | "auth"
  | "save_failed"
  | "create_failed";

export type AutosCanonicalSaveResult =
  | {
      ok: true;
      listingId: string;
      leonixAdId: string | null;
      status: string | null;
      created: boolean;
      persistWarnings: string[];
    }
  | {
      ok: false;
      code: AutosCanonicalSaveFailureCode;
      message: string;
      /** Server-provided error code/message from the failing response, when present. */
      errorCode?: string | null;
    };

export function autosCanonicalSaveMessage(code: AutosCanonicalSaveFailureCode, lang: AutosLang): string {
  const es = lang === "es";
  switch (code) {
    case "not_editable":
      return es
        ? "Este anuncio ya no se puede editar desde este flujo (ya fue publicado, pausado o cancelado). Edítalo desde tu panel de anuncios; para publicar un anuncio nuevo, elimina primero esta solicitud."
        : "This listing can no longer be edited from this flow (it is already published, paused or cancelled). Edit it from your dashboard; to publish a new ad, delete this application first.";
    case "not_found":
      return es
        ? "No encontramos el anuncio que intentas editar en tu cuenta. Vuelve a tu panel de anuncios e inténtalo de nuevo."
        : "We could not find the listing you are trying to edit on your account. Go back to your dashboard and try again.";
    case "wrong_lane":
      return es
        ? "Este anuncio pertenece a otra categoría de Autos y no se puede guardar desde este formulario."
        : "This listing belongs to a different Autos lane and cannot be saved from this form.";
    case "unverifiable":
      return es
        ? "No pudimos verificar tu anuncio guardado. Para evitar duplicados no creamos uno nuevo; intenta de nuevo en unos segundos."
        : "We could not verify your saved listing. To avoid a duplicate we did not create a new one; please try again in a few seconds.";
    case "auth":
      return es ? "Inicia sesión para continuar." : "Sign in to continue.";
    case "save_failed":
      return es
        ? "No pudimos guardar los cambios de tu anuncio. Para evitar duplicados no creamos uno nuevo; intenta de nuevo."
        : "We could not save your listing changes. To avoid a duplicate we did not create a new one; please try again.";
    case "create_failed":
    default:
      return es ? "No pudimos guardar tu anuncio antes del pago." : "We could not save your listing before checkout.";
  }
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/**
 * Saves the application to its ONE canonical row.
 *  - declared identity  → GET (ownership / status / lane) → PATCH the same UUID, or FAIL CLOSED.
 *  - no identity        → POST (a genuinely new application) and bind the returned id to the draft.
 * A declared identity NEVER falls through to POST — except a draft-bound identity whose row is
 * confirmed absent (404 twice) for this owner, which is treated as "no identity" (nothing to duplicate).
 */
export async function saveAutosListingToCanonicalRow(input: {
  lane: AutosIdentityLane;
  lang: AutosLang;
  token: string;
  /** Already transport-prepared listing payload. */
  listingPayload: unknown;
  /** Extra POST body fields (parentListingId, dealerInventoryGroupId …). Never sent on PATCH. */
  createExtras?: Record<string, unknown>;
  /**
   * Extra PATCH body fields (golden-survivor port adaptation): the Negocios preview declares its
   * `basePackageKey` (Quick/Full declaration the listing routes read on BOTH POST and PATCH). Never
   * carries identity — the row is always the declared id.
   */
  patchExtras?: Record<string, unknown>;
  /** Explicit id from the URL / dashboard edit / caller. */
  explicitListingId?: string | null;
  inventoryParentListingId?: string | null;
  namespace?: string | null;
  fetchFn: FetchLike;
  storages: AutosIdentityStorages;
}): Promise<AutosCanonicalSaveResult> {
  const { lane, lang, token, fetchFn, storages } = input;
  const scope = autosIdentityScope(lane, input.inventoryParentListingId);
  const auth = { Authorization: `Bearer ${token}` };
  const fail = (code: AutosCanonicalSaveFailureCode, errorCode?: string | null): AutosCanonicalSaveResult => ({
    ok: false,
    code,
    message: autosCanonicalSaveMessage(code, lang),
    errorCode: errorCode ?? null,
  });

  const draftIdentity = readAutosDraftListingIdentity(storages, scope, lane, input.namespace);
  const declared = resolveAutosDeclaredListingId({ explicit: input.explicitListingId, draftIdentity });

  if (declared) {
    const url = `/api/clasificados/autos/listings/${encodeURIComponent(declared.listingId)}`;
    const readRow = async (): Promise<
      | { kind: "ok"; body: Record<string, unknown> }
      | { kind: "not_found" }
      | { kind: "auth" }
      | { kind: "error" }
    > => {
      try {
        const r = await fetchFn(url, { headers: auth });
        if (r.status === 404) return { kind: "not_found" };
        if (r.status === 401 || r.status === 403) return { kind: "auth" };
        if (!r.ok) return { kind: "error" };
        return { kind: "ok", body: ((await r.json().catch(() => ({}))) ?? {}) as Record<string, unknown> };
      } catch {
        return { kind: "error" };
      }
    };

    let row = await readRow();
    if (row.kind === "not_found" && declared.source === "draft_identity") {
      // 404 is also what the API returns for a transient read failure — confirm once before treating
      // the bound identity as gone (never POST on a single 404).
      row = await readRow();
    }

    if (row.kind === "auth") return fail("auth");
    if (row.kind === "error") return fail("unverifiable");
    if (row.kind === "not_found") {
      if (declared.source === "explicit") return fail("not_found");
      // Draft-bound id whose row is confirmed absent for this owner: nothing exists to duplicate.
      clearAutosDraftListingIdentity(storages, scope, lane);
    } else {
      const body = row.body;
      const rowLane = clean(body.lane);
      if (rowLane && rowLane !== lane) return fail("wrong_lane");
      const status = clean(body.status);
      if (!isAutosPreLiveEditableStatus(status)) return fail("not_editable");

      let sync: Response;
      try {
        sync = await fetchFn(url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...auth },
          body: JSON.stringify({ ...(input.patchExtras ?? {}), listing: input.listingPayload, lang }),
        });
      } catch {
        return fail("save_failed");
      }
      const syncJson = ((await sync.json().catch(() => ({}))) ?? {}) as {
        id?: string;
        leonixAdId?: string | null;
        leonix_ad_id?: string | null;
        status?: string | null;
        errorCode?: string;
        persistWarnings?: string[];
      };
      if (!sync.ok) {
        if (sync.status === 404) return fail("not_found", syncJson.errorCode);
        if (sync.status === 409) return fail("not_editable", syncJson.errorCode);
        return fail("save_failed", syncJson.errorCode);
      }
      const leonixAdId =
        clean(syncJson.leonixAdId) ?? clean(syncJson.leonix_ad_id) ?? clean(body.leonix_ad_id) ?? clean(body.leonixAdId);
      // Re-bind (also promotes an explicit URL id / legacy key into the draft-bound identity).
      rememberAutosDraftListingIdentity(storages, scope, lane, {
        listingId: declared.listingId,
        leonixAdId,
        namespace: input.namespace,
      });
      return {
        ok: true,
        listingId: declared.listingId,
        leonixAdId,
        status: clean(syncJson.status) ?? status,
        created: false,
        persistWarnings: Array.isArray(syncJson.persistWarnings) ? syncJson.persistWarnings : [],
      };
    }
  }

  // Genuinely new application: no declared identity (or a confirmed-absent bound one).
  let res: Response;
  try {
    res = await fetchFn("/api/clasificados/autos/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...auth },
      body: JSON.stringify({ listing: input.listingPayload, lane, lang, ...(input.createExtras ?? {}) }),
    });
  } catch {
    return fail("create_failed");
  }
  const created = ((await res.json().catch(() => ({}))) ?? {}) as {
    id?: string;
    leonixAdId?: string | null;
    leonix_ad_id?: string | null;
    status?: string | null;
    errorCode?: string;
    error?: string;
    message?: string;
    persistWarnings?: string[];
  };
  const id = clean(created.id);
  if (!res.ok || !id) {
    return {
      ok: false,
      code: "create_failed",
      message: clean(created.message) ?? autosCanonicalSaveMessage("create_failed", lang),
      errorCode: created.errorCode ?? created.error ?? null,
    };
  }
  const leonixAdId = clean(created.leonixAdId) ?? clean(created.leonix_ad_id);
  rememberAutosDraftListingIdentity(storages, scope, lane, { listingId: id, leonixAdId, namespace: input.namespace });
  return {
    ok: true,
    listingId: id,
    leonixAdId,
    status: clean(created.status),
    created: true,
    persistWarnings: Array.isArray(created.persistWarnings) ? created.persistWarnings : [],
  };
}
