/**
 * Gate BIENES-NEGOCIO-1 verifier — behavioral proofs, not string matching.
 *
 * Run:  node node_modules/tsx/dist/cli.mjs scripts/verify-bienes-negocio-gate1-identity.ts
 *
 * Assertions execute the real shipped modules wherever the claim is behavioral. Where a claim can
 * only be made about source (a route's write boundary), the source is read with comments STRIPPED
 * first, so a sentence in a doc comment can never satisfy a claim about code.
 */

import { readFileSync } from "node:fs";
import path from "node:path";

import {
  parseBienesAgenteResidencialPublishedState,
} from "../app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/parseBienesAgenteResidencialPublishedState";
import { bienesPublishedRowToAgenteApplicationDraft } from "../app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/bienesPublishedToAgenteApplicationDraft";
import { createEmptyAgenteIndividualResidencialState } from "../app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteIndividualResidencialFormState";
import {
  BR_CHILD_IDENTITY_ERRORS,
  brChildListingIdFromDraftId,
  isBienesChildIdentitySubstitution,
  resolveBrChildIdentity,
  type BrChildIdentityRowLike,
} from "../app/lib/clasificados/bienes-raices/brChildIdentityGuard";
import {
  BR_CAPACITY_RPC_UNAVAILABLE,
  brCapacityOwnerFeedback,
} from "../app/lib/clasificados/bienes-raices/brCapacityOwnerFeedback";
import {
  BR_BASE_INCLUDED_PROPERTIES,
  BR_INVENTORY_PACK_MAX_CHILDREN,
  BR_TOTAL_ACTIVE_PROPERTY_LIMIT,
} from "../app/lib/listingPlans/publishCheckoutCheckpoint";
import { getRevenuePackagePriceCents } from "../app/lib/listingPlans/revenuePricingMatrix";
import { REVENUE_BASE_ENTITLEMENT_GUARD_PACKAGE_KEYS } from "../app/lib/listingPlans/revenueActiveEntitlementGuard";

const ROOT = path.resolve(__dirname, "..");

let passed = 0;
const failures: string[] = [];

function check(name: string, fn: () => void): void {
  try {
    fn();
    passed += 1;
    console.log(`  PASS  ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.log(`  FAIL  ${name} -> ${e instanceof Error ? e.message : String(e)}`);
  }
}

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

function eq(actual: unknown, expected: unknown, message: string): void {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) throw new Error(`${message} (got ${a}, expected ${b})`);
}

function readSrc(file: string): string {
  return readFileSync(path.join(ROOT, file), "utf8");
}

function stripComments(file: string): string {
  return readSrc(file)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

const EDIT_ROUTE = "app/api/clasificados/bienes-raices/listing-edit/route.ts";

/** A published parent row shaped exactly as the dashboard-edit SELECT returns it. */
function publishedParentRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    owner_id: "owner-1",
    title: "Casa en First Street",
    description: "Casa remodelada de tres recámaras.",
    city: "San Jose",
    price: 850000,
    zip: "95112",
    images: ["https://cdn.example.com/a.jpg", "https://cdn.example.com/b.jpg"],
    detail_pairs: [
      { label: "Leonix:branch", value: "bienes_raices_negocio" },
      { label: "Leonix:state", value: "CA" },
      { label: "Leonix:postal_code", value: "95112" },
      { label: "Leonix:br:show_exact_address", value: "true" },
      { label: "Leonix:br:listing_status", value: "bajo_contrato" },
      { label: "Leonix:bedrooms_count", value: "3" },
      { label: "Leonix:bathrooms_count", value: "2" },
      { label: "Leonix:parking_spots", value: "2" },
      { label: "Leonix:highlight_slugs", value: "piscina,comunidadcerrada,panelessolares" },
      { label: "Dirección", value: "123 First St" },
      { label: "Pies cuadrados", value: "1,850" },
      {
        label: "Leonix:br_gate12d_v1",
        value: JSON.stringify({
          neighborhood: "Zona Este",
          streetAddress: "123 First St",
          hasHoa: "yes",
          hoaFee: "250",
          hoaFrequency: "monthly",
          hoaIncludes: "Jardines y alberca",
          communityRules: "Sin ruido después de las 10pm",
          petRules: "Se permiten mascotas pequeñas",
          rentalRestrictions: "Renta mínima de 12 meses",
          shortTermRentalAllowed: "no",
          parkingRules: "Dos cajones techados",
          openHouseEnabled: true,
          openHouseDate: "2026-10-01",
          openHouseStartTime: "10:00",
          openHouseEndTime: "14:00",
        }),
      },
    ],
    business_name: "Correduría Del Valle",
    business_meta: JSON.stringify({
      negocioAgente: "María Ruiz",
      negocioCargo: "Agente principal",
      negocioLicencia: "DRE 01234567",
      negocioTelOficina: "4085551234",
      negocioEmail: "maria@delvalle.example",
      negocioSitioWeb: "https://delvalle.example",
      negocioNombreCorreduria: "Correduría Del Valle",
      negocioZonasServicio: "San Jose, Santa Clara",
      negocioIdiomas: "Español, English",
      negocioRedes: "https://instagram.com/delvalle\nhttps://facebook.com/delvalle",
      negocioGoogleReviewsUrl: "https://g.page/delvalle",
    }),
    contact_phone: "4085551234",
    contact_email: "maria@delvalle.example",
    leonix_ad_id: "BR-2026-000042",
    br_inventory_group_id: "11111111-1111-1111-1111-111111111111",
    br_inventory_parent_listing_id: null,
    inventory_role: "main",
    status: "active",
    is_published: true,
    ...overrides,
  };
}

console.log("\nGate BIENES-NEGOCIO-1 — Bienes Negocio identity / hydration / owner-truth\n");

/* ============================================================================================
 * 1. ONE PARSER — published -> editable form state
 * ==========================================================================================*/

console.log("PUBLISHED -> EDIT ROUND-TRIP");

check("there is exactly ONE published-row parser on disk", () => {
  const shell = stripComments("app/(site)/clasificados/bienes-raices/listing/BienesRaicesNegocioLiveDetailShell.tsx");
  assert(
    !shell.includes("function buildPublishedState("),
    "the live detail shell must no longer own its own interpretation",
  );
  assert(
    shell.includes("parseBienesAgenteResidencialPublishedState("),
    "the live detail shell must call the shared parser",
  );
  const mapper = stripComments(
    "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/bienesPublishedToAgenteApplicationDraft.ts",
  );
  assert(
    mapper.includes("parseBienesAgenteResidencialPublishedState("),
    "the dashboard-edit reverse mapper must call the same shared parser",
  );
});

check("dashboard-edit hydration restores the PARENT BUSINESS IDENTITY", () => {
  const draft = bienesPublishedRowToAgenteApplicationDraft({ row: publishedParentRow() });
  eq(draft.marcaNombre, "Correduría Del Valle", "brokerage name");
  eq(draft.agenteNombre, "María Ruiz", "agent name");
  eq(draft.agenteTitulo, "Agente principal", "agent title");
  eq(draft.agenteLicencia, "DRE 01234567", "licence");
  eq(draft.agenteTelefonoOficina, "4085551234", "office phone");
  eq(draft.correoPrincipal, "maria@delvalle.example", "email");
  eq(draft.agenteSitioWeb, "https://delvalle.example", "website");
  eq(draft.agenteAreaServicio, "San Jose, Santa Clara", "service areas");
  eq(draft.socialInstagram, "https://instagram.com/delvalle", "instagram");
  eq(draft.googleReviewsUrl, "https://g.page/delvalle", "google reviews");
});

check("dashboard-edit hydration restores ADDRESS + PRIVACY settings", () => {
  const draft = bienesPublishedRowToAgenteApplicationDraft({ row: publishedParentRow() });
  eq(draft.direccionLinea1, "123 First St", "street");
  eq(draft.direccionEstado, "CA", "state");
  eq(draft.direccionCodigoPostal, "95112", "postal code");
  eq(draft.areaCiudad, "Zona Este", "neighborhood");
  eq(draft.mostrarDireccionExacta, true, "exact-address privacy flag");
  eq(draft.estadoAnuncio, "bajo_contrato", "listing status");
});

check("dashboard-edit hydration restores HOA / community / pet / rental / parking rules", () => {
  const draft = bienesPublishedRowToAgenteApplicationDraft({ row: publishedParentRow() });
  eq(draft.hasHoa, "yes", "hasHoa");
  eq(draft.hoaFee, "250", "hoaFee");
  eq(draft.hoaFrequency, "monthly", "hoaFrequency");
  eq(draft.hoaIncludes, "Jardines y alberca", "hoaIncludes");
  eq(draft.communityRules, "Sin ruido después de las 10pm", "communityRules");
  eq(draft.petRules, "Se permiten mascotas pequeñas", "petRules");
  eq(draft.rentalRestrictions, "Renta mínima de 12 meses", "rentalRestrictions");
  eq(draft.shortTermRentalAllowed, "no", "shortTermRentalAllowed");
  eq(draft.parkingRules, "Dos cajones techados", "parkingRules");
});

check("dashboard-edit hydration restores HIGHLIGHTS from the persisted slug list", () => {
  const draft = bienesPublishedRowToAgenteApplicationDraft({ row: publishedParentRow() });
  eq(draft.destacados.piscina, true, "piscina");
  eq(draft.destacados.comunidad_cerrada, true, "comunidad_cerrada (slug comunidadcerrada)");
  eq(draft.destacados.paneles_solares, true, "paneles_solares (slug panelessolares)");
  eq(draft.destacados.chimenea, false, "an unset highlight stays false — never fabricated");
});

check("dashboard-edit hydration restores property facts, media and open house", () => {
  const draft = bienesPublishedRowToAgenteApplicationDraft({ row: publishedParentRow() });
  eq(draft.recamaras, "3", "bedrooms");
  eq(draft.banos, "2", "bathrooms");
  eq(draft.estacionamientos, "2", "parking spots");
  eq(draft.tamanoInteriorSqft, "1850", "interior sqft");
  eq(draft.fotosDataUrls.length, 2, "photos");
  eq(draft.extraOpenHouse, true, "open house enabled");
  eq(draft.openHouseSlots[0]?.fecha, "2026-10-01", "open house date");
});

check("A NO-OP EDIT CANNOT DESTROY PUBLISHED DATA", () => {
  // The real destructive mechanism: hydrate -> save. `negocioContactAndBusinessName` falls back to
  // `businessName: titulo, phone: null, email: null` when the identity block is empty, and
  // `buildEditablePatch` writes business_name/business_meta/contact_* unconditionally. So the
  // question that matters is whether hydration leaves the identity block populated.
  const row = publishedParentRow();
  const draft = bienesPublishedRowToAgenteApplicationDraft({ row });
  const empty = createEmptyAgenteIndividualResidencialState();

  const identityFields = [
    "marcaNombre",
    "agenteNombre",
    "agenteTitulo",
    "agenteLicencia",
    "agenteTelefonoOficina",
    "correoPrincipal",
    "agenteSitioWeb",
    "direccionLinea1",
    "direccionEstado",
    "direccionCodigoPostal",
    "hasHoa",
    "communityRules",
    "parkingRules",
  ] as const;

  const stillEmpty = identityFields.filter(
    (f) => JSON.stringify(draft[f]) === JSON.stringify(empty[f]),
  );
  assert(
    stillEmpty.length === 0,
    `these fields hydrated to their EMPTY-DRAFT default and would be written back as empty: ${stillEmpty.join(", ")}`,
  );
  // And the brokerage name must not silently become the property title.
  assert(draft.marcaNombre !== draft.titulo, "brokerage name must not collapse into the listing title");
});

check("the parser never invents data for a row that genuinely has none", () => {
  const bare = publishedParentRow({
    business_meta: null,
    business_name: null,
    contact_phone: null,
    contact_email: null,
    detail_pairs: [{ label: "Leonix:branch", value: "bienes_raices_negocio" }],
  });
  const draft = bienesPublishedRowToAgenteApplicationDraft({ row: bare });
  const empty = createEmptyAgenteIndividualResidencialState();
  eq(draft.agenteNombre, "", "no fabricated agent");
  eq(draft.agenteLicencia, "", "no fabricated licence");
  eq(draft.hasHoa, empty.hasHoa, "HOA falls back to the empty-draft default, not to a value");
  eq(draft.communityRules, "", "no fabricated community rules");
  eq(draft.destacados, empty.destacados, "no fabricated highlights");
  eq(draft.mostrarDireccionExacta, false, "privacy default stays closed");
});

check("the shared parser and the reverse mapper agree on the same row", () => {
  const row = publishedParentRow();
  const shared = parseBienesAgenteResidencialPublishedState({
    listing: {
      id: String(row.id),
      title: { es: String(row.title), en: String(row.title) },
      priceLabel: { es: String(row.price), en: String(row.price) },
      city: String(row.city),
      blurb: { es: String(row.description), en: String(row.description) },
      images: row.images as string[],
      business_name: row.business_name as string,
      business_meta: row.business_meta as string,
      contact_phone: row.contact_phone as string,
      contact_email: row.contact_email as string,
      detailPairs: row.detail_pairs,
      zip: row.zip as string,
    },
    lang: "es",
  });
  const mapped = bienesPublishedRowToAgenteApplicationDraft({ row });
  for (const f of ["marcaNombre", "agenteNombre", "direccionLinea1", "hasHoa", "parkingRules", "destacados"] as const) {
    eq(mapped[f], shared[f], `divergence on ${f}`);
  }
});

check("child property data survives hydration with its canonical draft id", () => {
  const draft = bienesPublishedRowToAgenteApplicationDraft({
    row: publishedParentRow(),
    childRows: [
      {
        id: "22222222-2222-2222-2222-222222222222",
        category: "bienes-raices",
        seller_type: "business",
        inventory_role: "inventory_property",
        title: "Condo en Alum Rock",
        city: "San Jose",
        price: 520000,
        images: ["https://cdn.example.com/c.jpg"],
        detail_pairs: [{ label: "Recámaras", value: "2" }],
      },
    ],
  });
  eq(draft.additionalInventoryProperties.length, 1, "one child");
  eq(
    draft.additionalInventoryProperties[0]?.id,
    "br-db-child-22222222-2222-2222-2222-222222222222",
    "canonical child draft id preserved",
  );
  eq(draft.additionalInventoryProperties[0]?.title, "Condo en Alum Rock", "child title");
  eq(draft.additionalInventoryProperties[0]?.photoUrls.length, 1, "child media independent");
});

/* ============================================================================================
 * 2. CHILD IDENTITY GUARD
 * ==========================================================================================*/

console.log("\nCHILD IDENTITY GUARD");

const CHILD_A = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const CHILD_B = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const PARENT = "11111111-1111-1111-1111-111111111111";

function childRow(overrides: Partial<BrChildIdentityRowLike> = {}): BrChildIdentityRowLike {
  return {
    id: CHILD_A,
    owner_id: "owner-1",
    category: "bienes-raices",
    br_inventory_parent_listing_id: PARENT,
    inventory_role: "inventory_property",
    leonix_ad_id: "BR-2026-000043",
    ...overrides,
  };
}

check("the canonical draft-id convention is the only way to reach a row", () => {
  eq(brChildListingIdFromDraftId(`br-db-child-${CHILD_A}`), CHILD_A, "prefixed id resolves");
  eq(brChildListingIdFromDraftId("local-new-1"), null, "a new draft resolves to no row");
  eq(brChildListingIdFromDraftId(""), null, "empty");
  eq(brChildListingIdFromDraftId("br-db-child-"), null, "prefix with no uuid");
});

check("a correctly-owned child under the right parent resolves", () => {
  const r = resolveBrChildIdentity({
    childListingId: CHILD_A,
    childrenById: new Map([[CHILD_A, childRow()]]),
    expectedParentListingId: PARENT,
    expectedOwnerId: "owner-1",
    alreadyClaimed: new Set(),
  });
  assert(r.ok, "should resolve");
  eq(r.ok && r.row.id, CHILD_A, "resolved row");
});

check("FAIL CLOSED on every identity mismatch", () => {
  const base = {
    childListingId: CHILD_A,
    expectedParentListingId: PARENT,
    expectedOwnerId: "owner-1",
    alreadyClaimed: new Set<string>(),
  };
  const cases: Array<[string, ReturnType<typeof resolveBrChildIdentity>, string]> = [
    [
      "unknown row",
      resolveBrChildIdentity({ ...base, childrenById: new Map() }),
      BR_CHILD_IDENTITY_ERRORS.UNRESOLVED,
    ],
    [
      "different owner",
      resolveBrChildIdentity({ ...base, childrenById: new Map([[CHILD_A, childRow({ owner_id: "owner-2" })]]) }),
      BR_CHILD_IDENTITY_ERRORS.OWNER_MISMATCH,
    ],
    [
      "different category",
      resolveBrChildIdentity({ ...base, childrenById: new Map([[CHILD_A, childRow({ category: "rentas" })]]) }),
      BR_CHILD_IDENTITY_ERRORS.CATEGORY_MISMATCH,
    ],
    [
      "different parent",
      resolveBrChildIdentity({
        ...base,
        childrenById: new Map([[CHILD_A, childRow({ br_inventory_parent_listing_id: CHILD_B })]]),
      }),
      BR_CHILD_IDENTITY_ERRORS.PARENT_MISMATCH,
    ],
    [
      "two drafts claiming one row",
      resolveBrChildIdentity({
        ...base,
        childrenById: new Map([[CHILD_A, childRow()]]),
        alreadyClaimed: new Set([CHILD_A]),
      }),
      BR_CHILD_IDENTITY_ERRORS.DUPLICATE_CLAIM,
    ],
  ];
  for (const [label, result, expected] of cases) {
    assert(!result.ok, `${label} must be rejected`);
    eq(!result.ok && result.error, expected, `${label} reason`);
  }
});

check("wholesale property substitution is blocked; a correction is allowed", () => {
  const stored = { city: "San Jose", state: "CA", zip: "95112" };
  assert(
    isBienesChildIdentitySubstitution(stored, { city: "Santa Clara", state: "CA", zip: "95050" }),
    "a different city AND zip is a different property",
  );
  assert(
    !isBienesChildIdentitySubstitution(stored, { city: "san  jose,", state: "ca", zip: "95112-1234" }),
    "formatting/ZIP+4 differences are not a substitution",
  );
  assert(
    !isBienesChildIdentitySubstitution(stored, { city: "San Jose", state: "CA", zip: "95113" }),
    "a single ZIP correction is allowed",
  );
  assert(
    !isBienesChildIdentitySubstitution(stored, { city: "", state: "", zip: "" }),
    "incomplete data is never proof of substitution — fails open toward allow",
  );
});

check("the edit route enforces the guard and FAILS CLOSED (no silent skip)", () => {
  const src = stripComments(EDIT_ROUTE);
  assert(src.includes("resolveBrChildIdentity("), "route must resolve child identity through the guard");
  assert(src.includes("isBienesChildIdentitySubstitution("), "route must run the substitution guard");
  assert(!/if \(!existingChild\) continue;/.test(src), "the silent-skip path must be gone");
  assert(src.includes("claimedChildIds"), "route must track already-claimed child rows");
  assert(
    /brChildListingIdFromDraftId\(childDraft\.id\)/.test(src),
    "route must use the shared draft-id parser",
  );
  // The substitution check must happen BEFORE the write.
  const childLoop = src.slice(src.indexOf("for (const childDraft"));
  const guardAt = childLoop.indexOf("isBienesChildIdentitySubstitution(");
  const writeAt = childLoop.indexOf("await updateOneListing(");
  assert(guardAt > 0 && writeAt > guardAt, "the substitution guard must run before the child write");
});

check("no second child-identity engine was created", () => {
  const src = stripComments(EDIT_ROUTE);
  assert(
    !src.includes('id.startsWith("br-db-child-")'),
    "the route must not keep its own copy of the draft-id convention",
  );
});

/* ============================================================================================
 * 3. SAME-ROW / NO-RECHARGE BOUNDARY (regression lock)
 * ==========================================================================================*/

console.log("\nSAME-ROW / NO-RECHARGE BOUNDARY");

check("the edit patch writes CONTENT COLUMNS ONLY", () => {
  const src = stripComments(EDIT_ROUTE);
  const patch = src.slice(src.indexOf("function buildEditablePatch"), src.indexOf("async function updateOneListing"));
  const forbidden = [
    "status:",
    "is_published:",
    "published_at:",
    "expires_at:",
    "owner_id:",
    "leonix_ad_id:",
    "br_inventory_group_id:",
    "br_inventory_parent_listing_id:",
    "inventory_role:",
  ];
  const leaked = forbidden.filter((f) => patch.includes(f));
  assert(leaked.length === 0, `these must never be writable by an owner edit: ${leaked.join(", ")}`);
  for (const required of ["title:", "description:", "city:", "price:", "detail_pairs:", "images:"]) {
    assert(patch.includes(required), `content column ${required} should still be written`);
  }
});

check("the update is scoped to one row, one owner, one category (and one parent for a child)", () => {
  const src = stripComments(EDIT_ROUTE);
  const upd = src.slice(src.indexOf("async function updateOneListing"), src.indexOf("export async function POST"));
  assert(/\.eq\("id", input\.existing\.id\)/.test(upd), "scoped by row id");
  assert(/\.eq\("owner_id", input\.ownerId\)/.test(upd), "scoped by owner");
  assert(/\.eq\("category", "bienes-raices"\)/.test(upd), "scoped by category");
  assert(/\.eq\("br_inventory_parent_listing_id", input\.parentListingId\)/.test(upd), "child scoped by parent");
});

check("the edit route never starts a Stripe checkout", () => {
  const src = stripComments(EDIT_ROUTE);
  for (const banned of ["stripe", "checkout", "revenue-os", "startRevenue"]) {
    assert(!src.toLowerCase().includes(banned), `an ordinary edit must never reference ${banned}`);
  }
});

check("siblings absent from the draft are never touched", () => {
  const src = stripComments(EDIT_ROUTE);
  const loop = src.slice(src.indexOf("for (const childDraft"), src.indexOf("const { data: proof }"));
  for (const [token, label] of [[".delete(", "delete"], [".upsert(", "upsert"], [".insert(", "insert"]] as const) {
    assert(!loop.includes(token), `the child loop must never ${label}`);
  }
});

check("commercial truth is unchanged by this gate", () => {
  eq(getRevenuePackagePriceCents({ category: "bienes-raices", packageKey: "br_agent_monthly" }).priceCents, 39900, "$399 base");
  eq(getRevenuePackagePriceCents({ category: "bienes-raices", packageKey: "br_inventory_pack_monthly" }).priceCents, 9900, "+$99 pack");
  eq(BR_BASE_INCLUDED_PROPERTIES, 1, "base capacity");
  eq(BR_INVENTORY_PACK_MAX_CHILDREN, 3, "pack adds 3");
  eq(BR_TOTAL_ACTIVE_PROPERTY_LIMIT, 4, "max 4 (derived)");
  assert(
    REVENUE_BASE_ENTITLEMENT_GUARD_PACKAGE_KEYS.has("br_agent_monthly"),
    "base package stays no-recharge guarded",
  );
  assert(
    !REVENUE_BASE_ENTITLEMENT_GUARD_PACKAGE_KEYS.has("br_inventory_pack_monthly"),
    "the add-on must stay independently billable",
  );
});

/* ============================================================================================
 * 4. MEDIA WARNING
 * ==========================================================================================*/

console.log("\nMEDIA WARNING");

check("the edit route warns through the SHARED helper and returns the dropped list", () => {
  const src = stripComments(EDIT_ROUTE);
  assert(src.includes('warnDroppedUnpersistableMedia("bienes-negocio-listing-edit"'), "shared warn helper");
  assert(src.includes("buildProposedFinalMediaSet("), "shared media builder");
  assert(!src.includes("function buildProposedFinalMediaSet"), "no local media engine");
  // Parent + every updated child contribute, deduped, and the key is present only when non-empty.
  assert(
    /const droppedMedia: string\[\] = \[\.\.\.parentUpdate\.droppedUnpersistableMedia\]/.test(src),
    "the parent's dropped media must be collected",
  );
  assert(
    /droppedMedia\.push\(\.\.\.childUpdate\.droppedUnpersistableMedia\)/.test(src),
    "each updated child's dropped media must be collected",
  );
  assert(
    /droppedMedia\.length \? \{ droppedUnpersistableMedia: \[\.\.\.new Set\(droppedMedia\)\] \}/.test(src),
    "the deduped dropped list must reach the owner-facing response, only when non-empty",
  );
});

check("the owner-facing client renders the media notice", () => {
  const client = stripComments(
    "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/AgenteIndividualResidencialApplication.tsx",
  );
  assert(client.includes("droppedUnpersistableMedia"), "client reads it");
  assert(/droppedCount > 0/.test(client), "client renders a note when non-empty");
});

/* ============================================================================================
 * 5. OWNER EDIT TRUTH
 * ==========================================================================================*/

console.log("\nOWNER EDIT TRUTH");

check("skippedNewChildren is returned AND surfaced with the canonical next action", () => {
  const src = stripComments(EDIT_ROUTE);
  assert(src.includes("skippedNewChildren"), "route returns it");
  const client = stripComments(
    "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/AgenteIndividualResidencialApplication.tsx",
  );
  assert(/skippedCount > 0/.test(client), "client branches on it");
  assert(
    client.includes("Add property") && client.includes("Agregar propiedad"),
    "the owner is pointed at the canonical Add Property action, bilingually",
  );
});

check("a capacity block explains itself with SERVER numbers only", () => {
  const withNumbers = brCapacityOwnerFeedback({
    reason: "capacity_reached",
    lang: "en",
    activeCount: 1,
    effectiveLimit: 1,
  });
  assert(withNumbers.detail.includes("1"), "renders the server's real limit");
  assert(withNumbers.nextAction.length > 0, "gives a legitimate next action");
  eq(withNumbers.offerInventoryBoost, false, "no boost upsell without proven entitlement");

  const withoutNumbers = brCapacityOwnerFeedback({ reason: "capacity_reached", lang: "en" });
  assert(
    !/\d/.test(withoutNumbers.detail),
    "when the server sent no counts, no number may be invented",
  );
});

check("the inventory boost is offered ONLY when entitlement truth says so", () => {
  const off = brCapacityOwnerFeedback({ reason: "capacity_reached", lang: "es", activeCount: 4, effectiveLimit: 4 });
  eq(off.offerInventoryBoost, false, "default is no upsell");
  const on = brCapacityOwnerFeedback({
    reason: "capacity_reached",
    lang: "es",
    activeCount: 1,
    effectiveLimit: 1,
    boostAvailable: true,
  });
  eq(on.offerInventoryBoost, true, "offered only when proven");
  assert(on.nextAction.includes("+3"), "names the real pack size");
});

check("every real RPC reason produces distinct, non-generic owner language", () => {
  const reasons = [
    "capacity_reached",
    "grace_blocks_new_capacity",
    "subscription_suspended",
    "subscription_canceled",
    "no_parent_link",
    "parent_not_found_or_owner_mismatch",
    "not_found_or_owner_mismatch",
    "status_mismatch",
    BR_CAPACITY_RPC_UNAVAILABLE,
  ] as const;
  const titles = new Set<string>();
  for (const r of reasons) {
    const f = brCapacityOwnerFeedback({ reason: r, lang: "en" });
    assert(f.title && f.detail && f.nextAction, `${r} must answer what/why/next`);
    assert(!f.detail.toLowerCase().includes("rpc"), `${r} must not leak internals`);
    titles.add(f.title);
  }
  assert(titles.size >= 5, `expected distinct owner language per reason class, saw ${titles.size}`);
});

check("the unavailable-authority case is honest and never guesses capacity", () => {
  const f = brCapacityOwnerFeedback({ reason: BR_CAPACITY_RPC_UNAVAILABLE, lang: "en" });
  assert(f.detail.includes("unavailable"), "says the check could not run");
  assert(/weren't charged|nothing was lost/i.test(f.detail), "reassures about money and data");
  eq(f.offerInventoryBoost, false, "never upsells on an unknown state");
});

check("the lifecycle route surfaces the real reason and counts", () => {
  const route = stripComments("app/api/clasificados/bienes-raices/listing-lifecycle/route.ts");
  assert(route.includes("brCapacityOwnerFeedback("), "route renders owner-safe copy");
  assert(route.includes("capacityReason"), "route forwards the server reason");
  assert(route.includes("effectiveLimit"), "route forwards the server limit");
  const svc = stripComments("app/lib/clasificados/bienes-raices/brListingLifecycleService.ts");
  assert(svc.includes("capacityReason: rpcResult.blockedReason"), "service carries the RPC reason");
  assert(svc.includes("activeCount: rpcResult.activeCount"), "service carries the count");
});

/* ============================================================================================
 * 6. ATOMIC CAPACITY AUTHORITY PRESERVED
 * ==========================================================================================*/

console.log("\nATOMIC CAPACITY AUTHORITY");

check("the RPC remains the ONLY capacity authority — no route/client fallback was added", () => {
  const svc = stripComments("app/lib/clasificados/bienes-raices/brListingLifecycleService.ts");
  assert(svc.includes("activateBrNegocioListingAtomic("), "still routes through the RPC");
  assert(
    /if \(!rpcResult\.ok\) \{[\s\S]{0,400}?ok: false/.test(svc),
    "an unreachable RPC must still FAIL CLOSED",
  );
  const feedback = stripComments("app/lib/clasificados/bienes-raices/brCapacityOwnerFeedback.ts");
  for (const banned of ["supabase", "from(", "count(", "BR_TOTAL_ACTIVE_PROPERTY_LIMIT"]) {
    assert(!feedback.includes(banned), `the feedback module must never derive capacity (${banned})`);
  }
});

check("the authored migration and its dependents still match the source contract", () => {
  const sql = readSrc("supabase/migrations/20260810120000_autos_br_negocio_capacity_activation_rpc.sql");
  assert(sql.includes("create or replace function public.br_negocio_activate_listing"), "function name");
  assert(sql.includes("AUTHORED ONLY. NOT APPLIED"), "still authored-not-applied");
  const wrapper = stripComments("app/lib/listingPlans/capacityActivationRpc.ts");
  assert(wrapper.includes('supabase.rpc("br_negocio_activate_listing"'), "wrapper calls the same function");
  for (const reason of ["capacity_reached", "grace_blocks_new_capacity", "subscription_suspended", "subscription_canceled"]) {
    assert(sql.includes(`'${reason}'`), `migration still returns ${reason}`);
    assert(
      stripComments("app/lib/clasificados/bienes-raices/brCapacityOwnerFeedback.ts").includes(`"${reason}"`),
      `owner feedback still handles ${reason}`,
    );
  }
});

/* ============================================================================================
 * 7. PARENT IDENTITY / BUSINESS HUB — unchanged by this gate
 * ==========================================================================================*/

console.log("\nPARENT IDENTITY / BUSINESS HUB");

check("no public.businesses linkage was invented", () => {
  for (const f of [
    EDIT_ROUTE,
    "app/lib/clasificados/bienes-raices/brChildIdentityGuard.ts",
    "app/lib/clasificados/bienes-raices/brCapacityOwnerFeedback.ts",
    "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/parseBienesAgenteResidencialPublishedState.ts",
  ]) {
    const src = stripComments(f);
    assert(!/from\("businesses"\)/.test(src), `${f} must not query public.businesses`);
    assert(!src.includes("businessId"), `${f} must not invent a canonical business id`);
  }
});

check("the live Connection Hub behavior is untouched", () => {
  const sidebar = readSrc(
    "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/BrAgenteResContactSidebar.tsx",
  );
  assert(sidebar.includes("connectionHub"), "Connection Hub still mounted on the preview sidebar");
  const detail = readSrc("app/(site)/clasificados/anuncio/[id]/page.tsx");
  assert(detail.includes("connectionHub"), "Connection Hub still mounted on the canonical detail page");
});

/* ==========================================================================================*/

console.log(
  `\n${failures.length === 0 ? "ALL CHECKS PASSED" : "FAILURES"} — ${passed} passed, ${failures.length} failed\n`,
);
if (failures.length > 0) {
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
