/**
 * Gate QB-BOUNDARY-02 — THE ATOMIC QUICK BIENES PUBLISH OPERATION, as behaviour.
 *
 * The HTTP route is a shell: it turns a request into this call and this call's answer into a
 * response. Everything that decides anything lives here, behind explicit PORTS, for one reason —
 * so the operation's real security claims can be PROVEN by running it, rather than asserted by
 * reading its source. The behavioral verifier drives this exact function with in-memory ports and
 * exercises a forged identity, a missing bearer, a Full customer, a headshot-only gallery and a
 * duplicate retry against the same code the route runs in production.
 *
 * ORDER IS PART OF THE CONTRACT. Identity, then product, then media, then fields, then — and only
 * then — the write. Every step before the write is a refusal that leaves no row behind, and the
 * verifier asserts the write port was never called on each one.
 */

import {
  buildQuickBienesListingRow,
  buildQuickBienesReuseKey,
  quickBienesRefusal,
  validateQuickBienesListingFields,
  type QuickBienesRefusalBody,
  type QuickBienesReuseKey,
} from "./quickBienesPublishContract";

export type QuickBienesPublishRequest = {
  listingRow: unknown;
  /** Declared semantic role per gallery image, in gallery order. Never bytes, never a URL. */
  mediaRoles: readonly (string | null)[];
  /** The caller's word about its base package. Authority belongs to `ports.resolveProduct`. */
  declaredPackageKey?: string | null;
  lang?: "es" | "en";
};

export type QuickBienesProductAnswer = {
  product: "quick" | "full" | "unverified";
  source: string;
};

export type QuickBienesReuseLookup =
  | { ok: true; row: { id: string; listingJson: Record<string, unknown> | null } | null }
  | { ok: false };

/**
 * Everything this operation is allowed to touch. Narrow on purpose: there is no generic "run SQL"
 * port, so the operation cannot reach a table, a column or an owner that is not named here.
 */
export type QuickBienesPublishPorts = {
  /** The bearer subject. `null` means no verifiable identity — the operation refuses. */
  resolveOwnerUserId: () => Promise<string | null>;
  /** Whether the service-role client is configured at all. */
  isDatabaseConfigured: () => boolean;
  /** Server-owned product truth. The operation never second-guesses this answer. */
  resolveProduct: (input: {
    ownerUserId: string;
    declaredPackageKey: string | null;
  }) => Promise<QuickBienesProductAnswer>;
  /** The Quick semantic media contract. Returns a refusal body, or null when the media is fine. */
  validateMedia: (items: readonly { role: string | null; mime: string | null }[]) =>
    | { message: string; messageEs: string; issues: string[] }
    | null;
  /** The caller's OWN pending Quick-shaped row, if any. `{ok:false}` is a hard stop, never an insert. */
  findReusablePendingListing: (key: QuickBienesReuseKey) => Promise<QuickBienesReuseLookup>;
  insertListing: (row: Record<string, unknown>) => Promise<{ ok: true; listingId: string } | { ok: false }>;
  /** Scoped by BOTH id and owner, so an update can never reach another owner's row. */
  updateListing: (input: {
    listingId: string;
    ownerUserId: string;
    patch: Record<string, unknown>;
  }) => Promise<{ ok: boolean }>;
  /** A freshly inserted main row groups itself. */
  groupMainListing: (listingId: string) => Promise<void>;
  /** The canonical `business_listing_links` write. Idempotent and never fatal. */
  linkListingToBusiness: (input: {
    ownerUserId: string;
    listingId: string;
  }) => Promise<{ ok: boolean; businessId: string | null }>;
  /** Wall clock, injected so a row's `updated_at` is assertable. */
  nowIso: () => string;
};

export type QuickBienesPublishSuccess = {
  ok: true;
  status: 200;
  listingId: string;
  reused: boolean;
  product: "quick";
  productSource: string;
  basePackageKey: string;
  businessLinked: boolean;
  businessId: string | null;
};

export type QuickBienesPublishFailure = { ok: false; status: number; body: QuickBienesRefusalBody };

export type QuickBienesPublishResult = QuickBienesPublishSuccess | QuickBienesPublishFailure;

/** Hard cap so a malformed caller cannot turn the role descriptor into an unbounded loop. */
export const QUICK_BIENES_MAX_MEDIA_ROLES = 64;

function fail(status: number, body: QuickBienesRefusalBody): QuickBienesPublishFailure {
  return { ok: false, status, body };
}

export async function executeQuickBienesPublish(
  request: QuickBienesPublishRequest,
  ports: QuickBienesPublishPorts,
  options: { quickPackageKey: string },
): Promise<QuickBienesPublishResult> {
  // 1. IDENTITY. The owner is the bearer subject; nothing in the request can name an owner.
  const ownerUserId = (await ports.resolveOwnerUserId())?.trim() ?? "";
  if (!ownerUserId) {
    return fail(
      401,
      quickBienesRefusal("auth_required", {
        en: "Sign in to publish.",
        es: "Inicia sesión para publicar.",
      }),
    );
  }

  if (!ports.isDatabaseConfigured()) {
    return fail(
      503,
      quickBienesRefusal("db_not_configured", {
        en: "Publishing is not configured yet.",
        es: "La publicación no está configurada todavía.",
      }),
    );
  }

  if (!Array.isArray(request.mediaRoles) || request.mediaRoles.length > QUICK_BIENES_MAX_MEDIA_ROLES) {
    return fail(
      400,
      quickBienesRefusal("invalid_body", { en: "Invalid request.", es: "Solicitud inválida." }),
    );
  }

  // 2. PRODUCT. A customer whose own entitlement or checkout ledger says FULL is refused, so this
  //    operation can never convert a Full listing into a Quick one — and a forged "I am Full"
  //    cannot get a Quick customer out of the Quick contract either, because the answer is the
  //    server's, not the caller's.
  const decided = await ports.resolveProduct({
    ownerUserId,
    declaredPackageKey: request.declaredPackageKey ?? null,
  });
  if (decided.product !== "quick") {
    return fail(
      409,
      quickBienesRefusal("quick_product_mismatch", {
        en: "This account is on the full real-estate package, so it cannot publish through the Quick path.",
        es: "Esta cuenta tiene el paquete completo de bienes raíces, así que no puede publicar por la vía rápida.",
      }),
    );
  }

  // 3. SEMANTIC MEDIA — the canonical Quick contract, on the descriptor that actually arrived.
  const items = request.mediaRoles.map((r) => ({ role: typeof r === "string" ? r : null, mime: null }));
  const mediaRefusal = ports.validateMedia(items);
  if (mediaRefusal) {
    return fail(
      422,
      quickBienesRefusal(
        "media_contract_violation",
        { en: mediaRefusal.message, es: mediaRefusal.messageEs },
        mediaRefusal.issues,
      ),
    );
  }

  // 4. CANONICAL FIELDS.
  const fieldIssues = validateQuickBienesListingFields({
    listingRow: request.listingRow,
    mediaCount: items.length,
  });
  if (fieldIssues.length) {
    return fail(
      422,
      quickBienesRefusal(
        "invalid_listing_fields",
        { en: fieldIssues[0]!.messageEn, es: fieldIssues[0]!.messageEs },
        fieldIssues.map((i) => i.code),
      ),
    );
  }

  // 5. IDEMPOTENCY. A retry collapses onto the caller's own pending row. A FAILED lookup is a hard
  //    stop: never an insert, so a transient error cannot leave a duplicate property behind.
  const reuseKey = buildQuickBienesReuseKey({
    ownerUserId,
    title: (request.listingRow as Record<string, unknown>).title,
  });
  const lookup = await ports.findReusablePendingListing(reuseKey);
  if (!lookup.ok) {
    return fail(
      503,
      quickBienesRefusal("reuse_lookup_failed", {
        en: "Could not verify your pending listing. Please try again — no duplicate listing was created.",
        es: "No se pudo verificar tu anuncio pendiente. Inténtalo de nuevo — no se creó un anuncio duplicado.",
      }),
    );
  }

  const reusable = lookup.row;
  const row = buildQuickBienesListingRow({
    listingRow: request.listingRow,
    ownerUserId,
    quickPackageKey: options.quickPackageKey,
    nowIso: ports.nowIso(),
    listingJsonBase: reusable?.listingJson ?? null,
  });

  // 6. WRITE — only now.
  let listingId: string;
  if (reusable) {
    const patch = { ...row };
    delete patch.owner_id;
    const updated = await ports.updateListing({ listingId: reusable.id, ownerUserId, patch });
    if (!updated.ok) {
      return fail(
        500,
        quickBienesRefusal("listing_write_failed", {
          en: "Could not save the listing. Please try again.",
          es: "No se pudo guardar el anuncio. Inténtalo de nuevo.",
        }),
      );
    }
    listingId = reusable.id;
  } else {
    const inserted = await ports.insertListing(row);
    if (!inserted.ok) {
      return fail(
        500,
        quickBienesRefusal("listing_write_failed", {
          en: "Could not save the listing. Please try again.",
          es: "No se pudo guardar el anuncio. Inténtalo de nuevo.",
        }),
      );
    }
    listingId = inserted.listingId;
    await ports.groupMainListing(listingId);
  }

  // 7. CANONICAL LINK — the same relationship the three server-published Quick families write.
  const link = await ports.linkListingToBusiness({ ownerUserId, listingId });

  return {
    ok: true,
    status: 200,
    listingId,
    reused: Boolean(reusable),
    product: "quick",
    productSource: decided.source,
    basePackageKey: options.quickPackageKey,
    businessLinked: link.ok,
    businessId: link.businessId,
  };
}
