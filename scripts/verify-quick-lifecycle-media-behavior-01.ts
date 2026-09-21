/**
 * Gates QB-IDENTITY-01 / QB-LIFECYCLE-02 / QB-MEDIA-02 / QB-MEDIA-03 — BEHAVIORAL proof.
 * Run: npx tsx scripts/verify-quick-lifecycle-media-behavior-01.ts
 *
 * Imports the REAL pure modules and exercises their decision logic. No database, no network.
 * Where a claim can only be established about server code that cannot be imported (a route with
 * `server-only` transitively in its import graph), the check is explicitly labelled a WIRING
 * check and asserts on the call actually being present — never on a comment.
 *
 * SECTION A — lifecycle capability truth (schema-honest, no invented statuses)
 * SECTION B — media semantics (0 / 1-3 / 4 images, video, logo-only, headshot-only, ABSENT-role,
 *             the per-family attribution rule, the canonical server entry point, and WIRING proof
 *             that all four customer self-service seams and both staff-assisted seams call it)
 * SECTION C — identity: link-first resolution + ambiguity refusal wiring
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import {
  QUICK_BUSINESS_LIFECYCLE_CAPABILITIES,
  getLifecycleCapability,
  isLifecycleIntentSupported,
  isTransitionLegalFrom,
  resolveLifecycleEndpoint,
} from "../app/lib/quickBusiness/quickBusinessLifecycleCapabilities";
import {
  SUBJECT_ATTRIBUTION,
  buildQuickMediaLimits,
  buildQuickPublishMediaLimits,
  effectiveRole,
  enforceQuickBusinessPublishMedia,
  extractSemanticMediaItems,
  requiredSubjectRoleForCategory,
  validateQuickBusinessMediaForCategory,
  validateQuickBusinessMediaSemantics,
} from "../app/lib/quickBusiness/quickBusinessMediaSemantics";

const failures: string[] = [];
let checks = 0;
function check(name: string, fn: () => void) {
  checks += 1;
  try {
    fn();
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
  }
}
const read = (p: string) => readFileSync(p, "utf8");

// =============================================================================
// SECTION A — LIFECYCLE CAPABILITY TRUTH
// =============================================================================

check("A1: every declared target status is legal in that family's real schema vocabulary", () => {
  // These sets are the DB CHECK constraints, transcribed from the migrations.
  const SCHEMA_VOCABULARY: Record<string, readonly string[]> = {
    servicios: [
      "draft", "preview_ready", "publish_ready", "pending_payment",
      "pending_review", "published", "paused_unpublished", "rejected", "suspended",
    ],
    restaurantes: ["pending_payment", "published", "suspended", "archived"],
    "autos-dealer": ["draft", "pending_payment", "active", "payment_failed", "cancelled", "removed"],
    // `listings` has no DB CHECK; this is the vocabulary its RLS policy + service writes use.
    "bienes-negocio": ["active", "paused", "pending", "removed", "sold"],
  };
  for (const [category, caps] of Object.entries(QUICK_BUSINESS_LIFECYCLE_CAPABILITIES)) {
    const vocab = SCHEMA_VOCABULARY[category];
    assert.ok(vocab, `no schema vocabulary recorded for ${category}`);
    for (const [intent, cap] of Object.entries(caps)) {
      if (cap.state !== "supported") continue;
      assert.ok(
        cap.targetStatus && vocab.includes(cap.targetStatus),
        `${category}.${intent} targets "${cap.targetStatus}" which is NOT in that family's real status vocabulary — this is the "invented paused status" failure mode`,
      );
      for (const from of cap.fromStatuses ?? []) {
        assert.ok(vocab.includes(from), `${category}.${intent} expects from-status "${from}" not in vocabulary`);
      }
    }
  }
});

check("A2: Restaurantes has NO pause capability (its schema has no paused value)", () => {
  assert.equal(isLifecycleIntentSupported("restaurantes", "pause"), false);
  const cap = getLifecycleCapability("restaurantes", "pause")!;
  assert.equal(cap.state, "unsupported_by_schema");
  assert.ok(cap.reason && cap.reason.length > 20, "an unsupported capability must state why");
  assert.equal(cap.endpoint, undefined, "an unsupported capability must expose no endpoint");
});

check("A3: Servicios has NO end capability (its schema has no archived value)", () => {
  assert.equal(isLifecycleIntentSupported("servicios", "end"), false);
  assert.equal(getLifecycleCapability("servicios", "end")!.state, "unsupported_by_schema");
});

check("A4: Autos end is merged with unpublish, not a separate fake control", () => {
  assert.equal(getLifecycleCapability("autos-dealer", "end")!.state, "merged_with_pause");
  assert.equal(isLifecycleIntentSupported("autos-dealer", "end"), false);
  // But unpublish/restore genuinely work.
  assert.equal(isLifecycleIntentSupported("autos-dealer", "pause"), true);
  assert.equal(isLifecycleIntentSupported("autos-dealer", "resume"), true);
});

check("A5: an unsupported intent can never produce a request", () => {
  assert.equal(resolveLifecycleEndpoint("restaurantes", "pause", "abc"), null);
  assert.equal(resolveLifecycleEndpoint("servicios", "end", "abc"), null);
  assert.equal(resolveLifecycleEndpoint("autos-dealer", "end", "abc"), null);
  // Supported ones do, with the id substituted into the path where the route needs it.
  const autos = resolveLifecycleEndpoint("autos-dealer", "pause", "id 42")!;
  assert.ok(autos.endpoint.includes("id%2042"), "listing id must be URL-encoded into the path");
  assert.ok(!autos.endpoint.includes("{listingId}"), "the placeholder must be substituted");
});

check("A6: transitions are gated on the listing's real current status", () => {
  assert.equal(isTransitionLegalFrom("servicios", "pause", "published"), true);
  assert.equal(isTransitionLegalFrom("servicios", "pause", "paused_unpublished"), false, "cannot pause an already-paused listing");
  assert.equal(isTransitionLegalFrom("servicios", "resume", "paused_unpublished"), true);
  assert.equal(isTransitionLegalFrom("servicios", "resume", "published"), false);
  assert.equal(isTransitionLegalFrom("restaurantes", "end", "published"), true);
  assert.equal(isTransitionLegalFrom("restaurantes", "end", "archived"), false, "cannot archive twice");
  assert.equal(isTransitionLegalFrom("bienes-negocio", "end", "paused"), true, "a paused BR listing can still be ended");
});

check("A7: the authored migration is NOT silently assumed applied", () => {
  const caps = read("app/lib/quickBusiness/quickBusinessLifecycleCapabilities.ts");
  const migration = read("supabase/migrations/20260920120000_quick_business_lifecycle_capability_parity.sql");
  assert.ok(migration.includes("'paused'") && migration.includes("'archived'"), "migration adds the two missing values");
  assert.ok(migration.includes("NOT APPLIED"), "migration states it has not been applied");
  // While unapplied, the matrix MUST still report those two as unsupported.
  assert.equal(getLifecycleCapability("restaurantes", "pause")!.state, "unsupported_by_schema");
  assert.equal(getLifecycleCapability("servicios", "end")!.state, "unsupported_by_schema");
  assert.ok(caps.includes("unsupported_by_schema"), "matrix models the unapplied state");
});

// =============================================================================
// SECTION B — MEDIA SEMANTICS
// =============================================================================

const vehicle = { role: "vehicle", mime: "image/jpeg" };
const property = { role: "property", mime: "image/jpeg" };
const logo = { role: "logo", mime: "image/png" };
const headshot = { role: "headshot", mime: "image/jpeg" };
const video = { role: "vehicle", mime: "video/mp4" };

function codes(category: string, items: Array<{ role?: string | null; mime?: string | null }>): string[] {
  return (validateQuickBusinessMediaForCategory(category, items) ?? []).map((i) => i.code);
}

check("B1: ZERO images is rejected for every family", () => {
  for (const cat of ["servicios", "restaurantes", "autos-dealer", "bienes-negocio"]) {
    assert.ok(codes(cat, []).includes("too_few_subject_images"), `${cat} must reject zero images`);
  }
});

check("B2: 1, 2 and 3 subject images are accepted", () => {
  assert.deepEqual(codes("autos-dealer", [vehicle]), []);
  assert.deepEqual(codes("autos-dealer", [vehicle, vehicle]), []);
  assert.deepEqual(codes("autos-dealer", [vehicle, vehicle, vehicle]), []);
  assert.deepEqual(codes("bienes-negocio", [property]), []);
});

check("B3: FOUR images is rejected", () => {
  assert.ok(codes("autos-dealer", [vehicle, vehicle, vehicle, vehicle]).includes("too_many_images"));
  assert.ok(codes("bienes-negocio", [property, property, property, property]).includes("too_many_images"));
});

check("B4: VIDEO is rejected", () => {
  assert.ok(codes("autos-dealer", [video]).includes("video_not_allowed"));
  assert.ok(codes("bienes-negocio", [{ role: "property", mime: "video/quicktime" }]).includes("video_not_allowed"));
});

check("B5: LOGO-ONLY is rejected — a dealer logo is not a vehicle photo", () => {
  const issues = codes("autos-dealer", [logo]);
  assert.ok(issues.includes("missing_subject_role"), `expected missing_subject_role, got ${issues.join(",")}`);
  // And three logos still do not make a listing.
  assert.ok(codes("autos-dealer", [logo, logo, logo]).includes("missing_subject_role"));
});

check("B6: HEADSHOT-ONLY is rejected — an agent headshot is not a property photo", () => {
  assert.ok(codes("bienes-negocio", [headshot]).includes("missing_subject_role"));
  assert.ok(codes("bienes-negocio", [headshot, logo]).includes("missing_subject_role"));
});

check("B7: an identity asset alongside a real subject photo is fine, and is not counted", () => {
  assert.deepEqual(codes("autos-dealer", [vehicle, logo]), [], "a logo may accompany a vehicle photo");
  // Identity assets are excluded from the max count: 3 vehicles + a logo is still valid.
  assert.deepEqual(codes("autos-dealer", [vehicle, vehicle, vehicle, logo]), []);
});

check("B8: a WRONG-subject photo does not satisfy another family's requirement", () => {
  // A property photo cannot satisfy a vehicle listing.
  assert.ok(codes("autos-dealer", [property]).includes("missing_subject_role"));
  // A vehicle photo cannot satisfy a property listing.
  assert.ok(codes("bienes-negocio", [vehicle]).includes("missing_subject_role"));
});

check("B9: an unrecognized role is an error, never a silent subject", () => {
  assert.ok(codes("autos-dealer", [{ role: "vehcile", mime: "image/jpeg" }]).includes("invalid_role"));
});

check("B10: an ABSENT role can never satisfy a vehicle or property requirement", () => {
  // THE AUDIT FINDING THIS ENCODES: the first version of the contract UPGRADED a missing role to
  // the family's required subject role, so an unroled logo silently became a "vehicle photo" and
  // the whole rule was inert. There is no such upgrade now, at any layer.
  assert.equal(effectiveRole({ role: null }, "vehicle"), "unspecified", "no role means UNSPECIFIED, never 'vehicle'");
  assert.equal(effectiveRole({}, "property"), "unspecified", "no role means UNSPECIFIED, never 'property'");
  assert.equal(effectiveRole({ role: "   " }, "vehicle"), "unspecified", "whitespace is not a declaration");

  for (const cat of ["autos-dealer", "bienes-negocio"]) {
    const issues = codes(cat, [{ mime: "image/jpeg" }]);
    assert.ok(issues.length > 0, `${cat}: an unroled image must not satisfy the subject requirement`);
    assert.ok(
      issues.includes("role_declaration_required"),
      `${cat}: an existing unroled draft must FAIL SAFELY with a correction, got ${issues.join(",")}`,
    );
  }

  // The correction message must actually tell the customer what to do, per family.
  const dealerIssue = validateQuickBusinessMediaForCategory("autos-dealer", [{ mime: "image/jpeg" }])![0]!;
  assert.ok(/vehicle/i.test(dealerIssue.messageEn) && /veh/i.test(dealerIssue.messageEs), "dealer correction names the vehicle");
  const bienesIssue = validateQuickBusinessMediaForCategory("bienes-negocio", [{ mime: "image/jpeg" }])![0]!;
  assert.ok(/property/i.test(bienesIssue.messageEn) && /propiedad/i.test(bienesIssue.messageEs), "bienes correction names the property");

  // Three unroled photos are still not one declared vehicle photo.
  assert.ok(codes("autos-dealer", [{ mime: "image/jpeg" }, { mime: "image/jpeg" }, { mime: "image/jpeg" }]).length > 0);
  // And mixing an unroled image with a declared logo is still a refusal, not a pass.
  assert.ok(codes("autos-dealer", [{ mime: "image/jpeg" }, logo]).includes("missing_subject_role"));
});

check("B10b: the two BUSINESS families attribute their gallery structurally, and say so", () => {
  // Servicios and Restaurantes keep their logo in a separate, non-gallery field (both publish
  // routes pass `logoAllowed: false`), so their gallery is business media by construction. That
  // is an explicit per-family ATTRIBUTION, declared in SUBJECT_ATTRIBUTION — not a fallback
  // applied to unknown input, and not available to vehicle or property.
  assert.equal(SUBJECT_ATTRIBUTION.servicios, "structural");
  assert.equal(SUBJECT_ATTRIBUTION.restaurantes, "structural");
  assert.equal(SUBJECT_ATTRIBUTION["autos-dealer"], "declared");
  assert.equal(SUBJECT_ATTRIBUTION["bienes-negocio"], "declared");
  assert.equal(effectiveRole({ role: null }, "business", "structural"), "business");
  assert.deepEqual(codes("servicios", [{ mime: "image/jpeg" }]), [], "an unroled Servicios gallery photo is business media");
  assert.deepEqual(codes("restaurantes", [{ mime: "image/jpeg" }]), [], "an unroled Restaurantes gallery photo is restaurant media");
  // Even there, a DECLARED logo never satisfies the requirement.
  assert.ok(codes("servicios", [logo]).includes("missing_subject_role"), "a declared logo is not a business photo");
  assert.ok(codes("restaurantes", [logo]).includes("missing_subject_role"), "a declared logo is not a restaurant photo");
});

check("B10c: the PUBLISH limits keep the subject rule and drop Quick's count cap", () => {
  // The publish seams are shared with each category's FULL application, whose truthful gallery
  // caps are its own (Servicios/Restaurantes 24, Autos/Bienes uncapped). Imposing Quick's 1-3 cap
  // on a shared publish route would be a false requirement, so publish limits carry the semantic
  // rule only; each family's own count validator still runs beside it.
  for (const cat of ["servicios", "restaurantes", "autos-dealer", "bienes-negocio"]) {
    const limits = buildQuickPublishMediaLimits(cat)!;
    assert.equal(limits.minSubjectImages, 1, `${cat}: publish still demands one real subject photo`);
    assert.equal(limits.maxImages, null, `${cat}: publish does not impose Quick's intake cap`);
    assert.equal(limits.requiredSubjectRole, requiredSubjectRoleForCategory(cat), `${cat}: same subject role`);
    assert.equal(limits.subjectAttribution, SUBJECT_ATTRIBUTION[cat as keyof typeof SUBJECT_ATTRIBUTION]);
  }
  assert.equal(buildQuickPublishMediaLimits("not-a-family"), null);
  // Four vehicle photos are refused at INTAKE (Quick sells 1-3) but not by the publish seam.
  assert.ok(codes("autos-dealer", [vehicle, vehicle, vehicle, vehicle]).includes("too_many_images"));
  assert.deepEqual(
    enforceQuickBusinessPublishMedia({ category: "autos-dealer", items: [vehicle, vehicle, vehicle, vehicle] }),
    { ok: true, category: "autos-dealer" },
  );
});

check("B10d: the canonical entry point refuses with one shape, and passes real sets", () => {
  assert.equal(enforceQuickBusinessPublishMedia({ category: "not-a-family", items: [] }), null, "a non-Quick-Business category is not this contract's business");
  const dealerLogoOnly = enforceQuickBusinessPublishMedia({ category: "autos-dealer", items: [logo] })!;
  assert.equal(dealerLogoOnly.ok, false);
  if (!dealerLogoOnly.ok) {
    assert.equal(dealerLogoOnly.status, 422, "every seam refuses with 422");
    assert.equal(dealerLogoOnly.body.error, "media_contract_violation");
    assert.ok(dealerLogoOnly.body.issues.includes("missing_subject_role"));
    assert.ok(dealerLogoOnly.body.message.length > 0 && dealerLogoOnly.body.messageEs.length > 0, "bilingual refusal copy");
  }
  // A real vehicle photo passes, and a real property photo passes.
  assert.deepEqual(enforceQuickBusinessPublishMedia({ category: "autos-dealer", items: [vehicle] }), { ok: true, category: "autos-dealer" });
  assert.deepEqual(enforceQuickBusinessPublishMedia({ category: "bienes-negocio", items: [property] }), { ok: true, category: "bienes-negocio" });
  // It extracts from a raw payload too, so no seam re-implements extraction.
  const fromPayload = enforceQuickBusinessPublishMedia({ category: "autos-dealer", payload: { mediaImages: [{ role: "logo" }] } })!;
  assert.equal(fromPayload.ok, false, "a dealer payload whose only image is a logo is refused");
});

check("B11: required subject role per family is correct", () => {
  assert.equal(requiredSubjectRoleForCategory("autos-dealer"), "vehicle");
  assert.equal(requiredSubjectRoleForCategory("bienes-negocio"), "property");
  assert.equal(requiredSubjectRoleForCategory("servicios"), "business");
  assert.equal(requiredSubjectRoleForCategory("restaurantes"), "business");
  assert.equal(requiredSubjectRoleForCategory("not-a-family"), null);
  assert.equal(buildQuickMediaLimits("not-a-family"), null);
});

check("B12: limits match the Quick contract (1-3, no video)", () => {
  const limits = buildQuickMediaLimits("autos-dealer")!;
  assert.equal(limits.minSubjectImages, 1);
  assert.equal(limits.maxImages, 3);
  assert.equal(limits.videoAllowed, false);
  // Direct call on the raw validator too, so the wrapper is not the only tested path.
  assert.deepEqual(validateQuickBusinessMediaSemantics([vehicle], limits), []);
});

check("B13: the extractor finds media under each family's field name, and [] when absent", () => {
  assert.equal(extractSemanticMediaItems({ mediaImages: [{ role: "vehicle" }] }).length, 1);
  assert.equal(extractSemanticMediaItems({ fotosDataUrls: ["data:image/jpeg;base64,x"] }).length, 1);
  assert.equal(extractSemanticMediaItems({ galleryImages: ["a", "b"] }).length, 2);
  assert.deepEqual(extractSemanticMediaItems({}), [], "no media field at all yields zero items");
  assert.deepEqual(extractSemanticMediaItems(null), []);
  // A bare string entry carries NO role. What that means is decided per family by
  // SUBJECT_ATTRIBUTION (B10 / B10b) — the extractor never invents one.
  assert.equal(extractSemanticMediaItems({ images: ["https://x/y.jpg"] })[0]!.role, null);
  assert.equal(extractSemanticMediaItems({ mediaImages: [{ role: "logo", mime: "image/png" }] })[0]!.role, "logo");
  // Identity FIELDS are never read as gallery media, so a logo cannot enter through that door.
  assert.deepEqual(extractSemanticMediaItems({ logoUrl: "https://x/logo.png" }), [], "a logo field is not a gallery");
});

/** The one canonical server entry point every publish seam must call. */
const CANONICAL_VALIDATOR = "enforceQuickBusinessPublishMedia(";

check("B14 WIRING: ALL FOUR customer self-service publish paths invoke the canonical validator", () => {
  // THE AUDIT FINDING THIS ENCODES: only the two staff-assisted routes enforced the contract, so
  // every path a CUSTOMER could publish through was protected by browser code alone.
  //
  // Gate QB-BOUNDARY-02 UPDATE: the Bienes seam is no longer a standalone media gate the browser
  // could choose not to call before inserting anyway. It is the ATOMIC Quick Bienes publish
  // endpoint, which runs the same canonical validator and then writes the row itself. Strictly
  // stronger: the previous entry proved a question was asked, this one proves the same question
  // is asked by the only thing that can write.
  const SELF_SERVICE: Array<[string, string]> = [
    ["app/api/clasificados/servicios/publish/route.ts", '"servicios"'],
    ["app/api/clasificados/restaurantes/publish/route.ts", '"restaurantes"'],
    ["app/api/clasificados/autos/listings/route.ts", '"autos-dealer"'],
    ["app/api/clasificados/bienes-raices/negocio/quick-publish/route.ts", '"bienes-negocio"'],
  ];
  for (const [p, category] of SELF_SERVICE) {
    const src = read(p);
    assert.ok(src.includes(CANONICAL_VALIDATOR), `${p} must call the canonical validator`);
    assert.ok(src.includes(category), `${p} must enforce its own family's contract (${category})`);
  }
  // ROUND-3 CORRECTION. This used to require the older media-gate route to be DELETED, on the
  // reasoning that the atomic publish endpoint superseded it. An adversarial review showed what
  // deleting it cost: the atomic endpoint is reached only when the BROWSER declares the Quick
  // package key, so omitting that one field dropped the publish into the plain browser insert
  // with no media check at all — weaker than before either seam existed.
  //
  // Both seams now exist and are exhaustive. The gate is therefore required to be PRESENT, to
  // run the canonical validator, and to resolve the product from the bearer rather than the body.
  const gate = read("app/api/clasificados/bienes-raices/negocio/publish-media-gate/route.ts");
  assert.ok(gate.includes(CANONICAL_VALIDATOR), "the non-custody gate runs the canonical validator");
  assert.ok(gate.includes('"bienes-negocio"'), "against the Bienes family's own contract");
  assert.ok(gate.includes("getBearerUserId(request)"), "identity is the bearer, never the body");
  assert.ok(gate.includes("ownerUserId: userId"), "and the product resolution is owner-scoped");
});

check("B14b BOUNDARY: the two SHARED seams run the contract only for a VERIFIED QUICK product", () => {
  // THE BLOCKER THIS ENCODES: Quick and Full publish through the SAME dealer lane and the SAME
  // business seller type, so enforcing on `lane` or on `sellerType` held Full customers to a $99
  // product's rule. Both seams now resolve a product from server-owned records first.
  const autos = read("app/api/clasificados/autos/listings/route.ts");
  assert.ok(autos.includes("resolveQuickBusinessPublishIdentity("), "the dealer seam resolves a product");
  assert.ok(
    autos.includes("identity.enforceQuickContract\n      ? enforceQuickBusinessPublishMedia("),
    "and runs the Quick contract only when that product is Quick",
  );
  assert.ok(autos.includes("ownerUserId: userId"), "the owner is the bearer subject, never the body");

  const bienes = read("app/api/clasificados/bienes-raices/negocio/quick-publish/route.ts");
  assert.ok(bienes.includes("resolveQuickBusinessPublishIdentity("), "the Bienes seam resolves a product");
  assert.ok(bienes.includes("serverCustodyQuick: true"), "its custody leg is set by the route, not by a body");

  const core = read("app/(site)/clasificados/lib/leonixPublishRealEstateListingCore.ts");
  assert.ok(
    !/sellerType === "business"\s*\)\s*\{\s*const roles/.test(core),
    "no branch enforces the Quick contract on `sellerType === \"business\"` alone",
  );
});

check("B15 WIRING: a QUICK Bienes publish is written by the SERVER, and cannot fall back", () => {
  // WHAT THIS ASSERTION USED TO SAY, AND WHY IT IS NOW STRONGER: it used to prove the browser
  // asked a server gate BEFORE its own insert. That was true and still bypassable — the insert
  // did not depend on the answer in any way a server could observe. The claim now is that for a
  // verified Quick Bienes publish there is NO browser insert at all.
  const core = read("app/(site)/clasificados/lib/leonixPublishRealEstateListingCore.ts");
  assert.ok(
    core.includes("/api/clasificados/bienes-raices/negocio/quick-publish"),
    "the browser publish core hands the whole Quick publish to the server",
  );
  assert.ok(
    core.includes("publishQuickBienesThroughServerCustody"),
    "that call is a named, single-purpose seam, not an inline fetch",
  );
  // ROUND-3 CORRECTION, same reasoning as B14: the core must call BOTH seams, because the custody
  // branch is chosen by a client-held package key and cannot be the only thing standing between a
  // business publish and an unchecked insert.
  assert.ok(
    core.includes("/api/clasificados/bienes-raices/negocio/publish-media-gate"),
    "every NON-custody business publish is gated too",
  );
  const gateGuardAt = core.indexOf('category === "bienes-raices" && sellerType === "business" && !quickBienesPublish');
  const insertAt = core.indexOf("insertListingsRowResilient(supabase, insertPayload)");
  assert.ok(gateGuardAt > -1, "the non-custody gate is guarded to exactly that case");
  assert.ok(gateGuardAt < insertAt, "and it runs before the browser insert it protects");
  assert.ok(
    core.includes("if (!gate.ok) return { ok: false, error: gate.error };"),
    "a gate refusal aborts the publish, fail-closed",
  );
  assert.ok(
    core.includes("if (!custody.ok) return { ok: false, error: custody.error };"),
    "a refusal aborts the publish",
  );
  // Fail-closed: no session, a non-200 and a thrown fetch must all resolve to REFUSED.
  const fn = core.slice(core.indexOf("async function publishQuickBienesThroughServerCustody"));
  const body = fn.slice(0, fn.indexOf("\nexport async function publishLeonixRealEstateListingCore"));
  assert.ok(body.includes("if (!accessToken) return { ok: false, error: generic };"), "no session refuses");
  assert.ok(/catch \{\s*return \{ ok: false, error: generic \};/.test(body), "a network failure refuses");
  assert.ok(body.includes('payload?.ok !== true'), "only an explicit server OK passes");
  // And the browser insert is unreachable for this product: it is the ELSE of the custody branch.
  const custodyIdx = core.indexOf("if (quickBienesPublish) {");
  const insertIdx = core.indexOf("insertListingsRowResilient(supabase, insertPayload)");
  assert.ok(custodyIdx > -1 && insertIdx > custodyIdx, "the browser insert sits behind the Quick branch, not beside it");
});

check("B16 WIRING: both staff-assisted routes remain protected, through the same entry point", () => {
  for (const p of [
    "app/api/clasificados/autos/assisted-publish/route.ts",
    "app/api/clasificados/bienes-raices/negocio/assisted-publish/route.ts",
  ]) {
    const src = read(p);
    assert.ok(src.includes(CANONICAL_VALIDATOR), `${p} must call the canonical validator`);
    assert.ok(src.includes("extractSemanticMediaItems("), `${p} must extract the media set`);
    assert.ok(src.includes("semanticMedia.body"), `${p} must answer with the canonical refusal body`);
    assert.ok(src.includes("semanticMedia.status"), `${p} must answer with the canonical 422 status`);
  }
});

check("B17 PRODUCER: the Quick intake emits a role and never invents one", () => {
  const step = read("app/(site)/publicar/negocio-rapido/_components/QuickBusinessMediaStep.tsx");
  assert.ok(step.includes('SUBJECT_ATTRIBUTION[category] === "structural" ? subjectRole : null'),
    "a declared-attribution family starts every new photo UNMARKED — never pre-selected as vehicle/property");
  assert.ok(step.includes('accept="image/*"') && !/accept="video|video\/\*/.test(step), "no video affordance in Quick Business");
  assert.ok(step.includes("ROLE_OPTIONS"), "the customer is offered the family's own role vocabulary");

  const intake = read("app/(site)/publicar/negocio-rapido/_components/QuickBusinessIntakeClient.tsx");
  assert.ok(intake.includes("undeclaredRoleIssues(draft.media, lang)"), "the intake blocks on an undeclared photo");
  assert.ok(intake.includes("declaredMedia(draft.media)"), "only declared media reaches the adapter");

  const store = read("app/(site)/publicar/negocio-rapido/_components/quickBusinessDraftStore.ts");
  assert.ok(
    store.includes("isQuickMediaRole((m as { role?: unknown }).role) ? ((m as { role: QuickMediaRole }).role) : null"),
    "a pre-roles stored draft re-opens UNDECLARED rather than silently upgraded",
  );

  // Every adapter routes identity assets out of the canonical gallery.
  const A = "app/(site)/publicar/negocio-rapido/_adapters";
  for (const f of [
    `${A}/serviciosQuickBusinessAdapter.ts`,
    `${A}/restaurantesQuickBusinessAdapter.ts`,
    `${A}/autosDealerQuickBusinessAdapter.ts`,
    `${A}/bienesNegocioQuickBusinessAdapter.ts`,
  ]) {
    assert.ok(read(f).includes("galleryMediaOnly("), `${f}: identity assets never enter the canonical gallery`);
  }
  // …and the two DECLARED families carry the role all the way into the canonical shape.
  assert.ok(read(`${A}/autosDealerQuickBusinessAdapter.ts`).includes("role: m.role"), "Autos stamps the role onto MediaImageEntry");
  assert.ok(read(`${A}/bienesNegocioQuickBusinessAdapter.ts`).includes("declaredMediaRoleMap("), "Bienes carries a role map beside its string gallery");

  // The role type is REQUIRED on the Quick Business media item — the compiler, not a convention.
  assert.ok(
    read("app/lib/quickBusiness/quickBusinessTypes.ts").includes("QuickBusinessMediaItem = QuickMediaItem & { role: QuickMediaRole }"),
    "QuickBusinessMediaItem carries an explicit, non-optional semantic role",
  );
});

// =============================================================================
// SECTION C — CANONICAL IDENTITY
// =============================================================================

check("C1 WIRING: all four publish paths write the canonical link", () => {
  const sites: Array<[string, string]> = [
    ["app/api/clasificados/servicios/publish/route.ts", "linkSelfServiceListingToBusiness("],
    ["app/api/clasificados/restaurantes/publish/route.ts", "linkSelfServiceListingToBusiness("],
    ["app/api/clasificados/autos/listings/route.ts", "linkSelfServiceListingToBusiness("],
    // Bienes publishes from the browser, so it converges through the server seam instead.
    ["app/(site)/clasificados/lib/leonixPublishRealEstateListingCore.ts", "/api/business/listing-link"],
  ];
  for (const [file, needle] of sites) {
    assert.ok(read(file).includes(needle), `${file} must write the canonical business↔listing link`);
  }
});

check("C2: the link module proves ownership and never trusts a client claim", () => {
  const src = read("app/lib/business/canonicalListingLink.ts");
  assert.ok(src.includes("verifyListingOwnedByUser"), "ownership is verified server-side");
  assert.ok(src.includes("resolveListingSourceOwnershipContract"), "owner column comes from the canonical contract, not a hard-coded list");
  assert.ok(src.includes("23505"), "a concurrent duplicate insert is collapsed into success, not an error");
  assert.ok(src.includes("conflict_other_business"), "a listing already linked elsewhere is refused");
});

check("C3: resolution is link-first with a GUARDED fallback that refuses ambiguity", () => {
  const src = read("app/lib/business/canonicalListingLink.ts");
  const linkIdx = src.indexOf('.from("business_listing_links")');
  const fallbackIdx = src.indexOf("GUARDED FALLBACK");
  assert.ok(linkIdx > -1 && fallbackIdx > -1 && linkIdx < fallbackIdx, "the canonical link must be consulted BEFORE the owner scan");
  assert.ok(src.includes('reason: "ambiguous"'), "more than one candidate must refuse, not guess");
});

check("C4: my-listing no longer picks an arbitrary listing", () => {
  const src = read("app/api/clasificados/quick-business/my-listing/route.ts");
  assert.ok(src.includes("resolveCanonicalListingForUser("), "must resolve through the canonical resolver");
  assert.ok(src.includes("ambiguous_listing") && src.includes("409"), "ambiguity must surface as a 409, never a silent pick");
  // Strip comments first: the file legitimately DESCRIBES the removed pattern in its header.
  // The assertion is about executable code, so it must not be satisfied or broken by prose.
  const executable = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  assert.ok(
    !/\.order\([^)]*\)\s*\.limit\(1\)/.test(executable),
    "the arbitrary order+limit(1) owner scan must be gone from EXECUTABLE code — that is how the wrong listing got mutated",
  );
});

check("C5: the bienes status-column defect is fixed", () => {
  const src = read("app/api/clasificados/quick-business/my-listing/route.ts");
  // `listings` uses `status`; the previous version read `listing_status` and always got "".
  const bienesBlock = src.slice(src.indexOf('"bienes-negocio": {'), src.indexOf('"bienes-negocio": {') + 400);
  assert.ok(bienesBlock.includes('statusColumn: "status"'), "listings.status, not listing_status");
});

check("C6: the doorway sends a bearer token on every authenticated call", () => {
  const src = read("app/(site)/publicar/negocio-rapido/_components/QuickBusinessMyBusinessClient.tsx");
  const fetchCount = (src.match(/await fetch\(/g) ?? []).length;
  const authCount = (src.match(/Authorization: `Bearer \$\{token\}`/g) ?? []).length;
  assert.ok(fetchCount >= 3, `expected the doorway to make several authenticated calls, saw ${fetchCount}`);
  assert.equal(
    authCount,
    fetchCount,
    "EVERY fetch from the doorway must carry a bearer token — a call without one always 401s, which is a control that cannot perform its action",
  );
  assert.ok(src.includes("getAccessToken"), "token acquisition must be centralized");
});

check("C7: the doorway renders controls only for supported capabilities", () => {
  const src = read("app/(site)/publicar/negocio-rapido/_components/QuickBusinessMyBusinessClient.tsx");
  assert.ok(src.includes('state === "supported"'), "control rendering is gated on real capability");
  assert.ok(src.includes("isTransitionLegalFrom("), "and on the listing's real current status");
  assert.ok(src.includes("resolveLifecycleEndpoint("), "endpoints come from the capability matrix");
});

if (failures.length) {
  console.error(`verify-quick-lifecycle-media-behavior-01: ${failures.length}/${checks} FAILED`);
  for (const f of failures) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`verify-quick-lifecycle-media-behavior-01: OK (${checks} checks, no DB, no network)`);
