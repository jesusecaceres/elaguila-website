#!/usr/bin/env node
/**
 * Leonix Globalization Closeout Foundation 01, Zone B — community publisher data-integrity fix.
 *
 * Statically proves that Busco / Clases / Comunidad publish through the shared
 * `publishBuscoQuickToListings` / `publishCommunityQuickToListings` functions with a safe
 * create-vs-update contract keyed on a server-verified canonical listing identity:
 *   - no existing identity            -> INSERT a new row
 *   - a verified, owner-owned identity -> UPDATE that same row (never a second INSERT)
 *   - an unverifiable supplied identity -> fail closed (never falls back to INSERT)
 * and that no title/email/heuristic lookup is used to guess identity.
 *
 * This build found the safe contract already implemented (Work Package I.6B/I.6C,
 * Globalization Package A Gate 3) and intentionally made no functional changes to the two
 * publishers — this verifier locks the existing behavior in place.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const busco = read("app/(site)/publicar/busco/shared/publishBuscoQuickToListings.ts");
const community = read("app/(site)/publicar/community/shared/publish/publishCommunityQuickToListings.ts");
const identity = read("app/(site)/clasificados/lib/quickListingIdempotency.ts");
const buscoBar = read("app/(site)/publicar/busco/quick/BuscoQuickPreviewPublishBar.tsx");
const communityBar = read("app/(site)/publicar/community/shared/preview/CommunityQuickPreviewPublishBar.tsx");
const communityClient = read("app/(site)/publicar/community/shared/CommunityQuickApplicationClient.tsx");

// --- Canonical identity helper: verified, owner-scoped, category-scoped, fails closed --------
assert(
  identity.includes("export async function verifyQuickListingReusable"),
  "quickListingIdempotency.ts must export verifyQuickListingReusable",
);
assert(
  identity.includes('owner_id, category') || (identity.includes("owner_id") && identity.includes("category")),
  "verifyQuickListingReusable must select owner_id and category to prove identity",
);
assert(
  identity.includes('String(data.owner_id ?? "") !== input.ownerUserId'),
  "verifyQuickListingReusable must reject a candidate id that does not belong to the requesting owner",
);
assert(
  identity.includes('String(data.category ?? "") !== input.expectedCategory'),
  "verifyQuickListingReusable must reject a candidate id from a different category",
);
assert(
  identity.includes('return { safe: false, reason: "not-found"'),
  "verifyQuickListingReusable must fail closed when the candidate id does not exist",
);
assert(
  identity.includes('return { safe: false, reason: "query-error"'),
  "verifyQuickListingReusable must fail closed on a query error, never assume safe",
);

// --- No heuristic identity lookup (title/email/description/category+price) in either publisher
for (const [name, src] of [
  ["publishBuscoQuickToListings.ts", busco],
  ["publishCommunityQuickToListings.ts", community],
]) {
  assert(!/\.eq\(\s*["']title["']/.test(src), `${name} must not look up an existing listing by title`);
  assert(!/\.eq\(\s*["']description["']/.test(src), `${name} must not look up an existing listing by description`);
  assert(
    !/\.eq\(\s*["']contact_email["']/.test(src) && !/\.eq\(\s*["']email["']/.test(src),
    `${name} must not look up an existing listing by email alone`,
  );
}

for (const [name, src] of [
  ["publishBuscoQuickToListings.ts", busco],
  ["publishCommunityQuickToListings.ts", community],
]) {
  // --- Create path: still inserts for a new listing ------------------------------------------
  assert(src.includes("insertListingsRowResilient"), `${name} must still insert for a new listing`);

  // --- Update path: uses the shared, verified-identity helper before ever updating -----------
  assert(src.includes("verifyQuickListingReusable"), `${name} must verify identity via the shared helper`);
  assert(src.includes("updateListingsRowResilient"), `${name} must update (not insert) a reused listing`);
  assert(
    /reuseCheck\?\.\s*safe/.test(src),
    `${name} must gate the update path on the verified-safe result`,
  );

  // --- Update path never re-inserts a second row for a verified identity ---------------------
  const updateBranch = src.slice(src.indexOf("if (reuseCheck?.safe)"), src.indexOf("} else if (existingListingId)"));
  assert(
    !updateBranch.includes("insertListingsRowResilient"),
    `${name} update branch must never call insertListingsRowResilient`,
  );

  // --- Failed verification fails closed instead of silently falling back to INSERT -----------
  assert(
    src.includes("} else if (existingListingId) {"),
    `${name} must have a distinct fail-closed branch for an unverifiable supplied identity`,
  );
  const failClosedBranch = src.slice(
    src.indexOf("} else if (existingListingId) {"),
    src.indexOf("} else {", src.indexOf("} else if (existingListingId) {")),
  );
  assert(
    !failClosedBranch.includes("insertListingsRowResilient"),
    `${name} fail-closed branch must never fall back to INSERT`,
  );
  assert(
    failClosedBranch.includes("return { ok: false"),
    `${name} fail-closed branch must return an error, not proceed`,
  );

  // --- Canonical fields preserved on update: owner_id and category excluded from the patch ---
  assert(
    /const \{ category: _category, owner_id: _ownerId, \.\.\.updatablePayload \} = insertPayload;/.test(src),
    `${name} update payload must exclude owner_id and category so they can never be overwritten`,
  );
}

// --- Busco: create/update both wired through the same publisher for its one kind -------------
assert(busco.includes('category: "busco"'), "publishBuscoQuickToListings.ts must publish category 'busco'");

// --- Clases and Comunidad share the same publisher (`kind`) and both get the same protection --
assert(community.includes("kind: CommunityKind"), "publishCommunityQuickToListings.ts must be parameterized by kind");
assert(community.includes("category: kind"), "publishCommunityQuickToListings.ts must publish category = kind (clases | comunidad)");
assert(
  community.includes("expectedCategory: kind"),
  "publishCommunityQuickToListings.ts must verify reuse against the same kind (covers both Clases and Comunidad)",
);

// --- Callers supply the verified session-scoped in-flight identity, not a heuristic guess ----
assert(
  buscoBar.includes("BUSCO_QUICK_IN_FLIGHT_LISTING_ID_KEY") && buscoBar.includes("existingListingId: inFlightId"),
  "Busco preview publish bar must pass the session-tracked in-flight listing id as existingListingId",
);
assert(
  communityBar.includes("COMMUNITY_IN_FLIGHT_LISTING_ID_KEYS[kind]") &&
    communityBar.includes("existingListingId: inFlightId"),
  "Community preview publish bar must pass the session-tracked in-flight listing id as existingListingId (per kind)",
);
assert(
  communityClient.includes("COMMUNITY_IN_FLIGHT_LISTING_ID_KEYS.clases") &&
    communityClient.includes("COMMUNITY_IN_FLIGHT_LISTING_ID_KEYS.comunidad"),
  "Community application client must track in-flight identity separately for clases and comunidad",
);

console.log("OK: shared identity helper is owner-scoped, category-scoped, and fails closed");
console.log("OK: no title/email/description heuristic identity lookup in either publisher");
console.log("OK: Busco create path still inserts; update path never re-inserts a verified row");
console.log("OK: Community (Clases + Comunidad) create path still inserts; update path never re-inserts a verified row");
console.log("OK: unverifiable supplied identity fails closed instead of falling back to INSERT");
console.log("OK: owner_id / category excluded from the update payload on both publishers");
console.log("OK: Busco path uses safe create/update behavior");
console.log("OK: Clases path uses safe create/update behavior (shared community publisher)");
console.log("OK: Comunidad path uses safe create/update behavior (shared community publisher)");
console.log("verify-globalization-foundation-01-community-publish-integrity: PASS");
