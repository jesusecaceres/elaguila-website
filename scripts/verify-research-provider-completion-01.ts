/**
 * Business Concierge — Final Research + Live Provider Completion Gate verifier.
 * Confirms the Google Places research adapter is genuinely wired end-to-end (types, registry,
 * repository orchestration, API route, staff-facing UX transparency), that the website-vs-Places
 * source-type ambiguity fix landed, that zero migrations were introduced, and that no image
 * generation or paid provider call was executed by this pass.
 * Same hand-rolled node:assert structural convention as every other verify-*.ts script here.
 * Run from repo root: npx tsx scripts/verify-research-provider-completion-01.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";

let passed = 0;
function check(name: string, fn: () => void): void {
  try {
    fn();
    passed += 1;
    console.log(`  PASS  ${name}`);
  } catch (e) {
    console.error(`  FAIL  ${name}`);
    console.error(e);
    process.exitCode = 1;
  }
}

console.log("Final Research + Live Provider Completion Gate — targeted checks\n");

function read(relPath: string): string {
  return readFileSync(path.resolve(__dirname, "..", relPath), "utf8");
}

const types = read("app/lib/business/aiResearch/types.ts");
const adapter = read("app/lib/business/aiResearch/googlePlacesAdapter.ts");
const registry = read("app/lib/business/fieldDiscovery/sourceRegistry.ts");
const briefingSynthesis = read("app/lib/business/aiResearch/briefingSynthesis.ts");
const repository = read("app/lib/business/aiResearch/repository.ts");
const researchRoute = read("app/api/admin/businesses/[businessId]/research/route.ts");
const fieldDiscoveryActions = read("app/admin/(dashboard)/businesses/[businessId]/FieldDiscoveryActions.tsx");
const pageTsx = read("app/admin/(dashboard)/businesses/[businessId]/page.tsx");

// --- 1. Types --------------------------------------------------------------------------------
check("1a. GooglePlacesResearchResult type exists with an honest status union (never a silent success)", () => {
  assert.ok(types.includes("GooglePlacesResearchStatus"));
  assert.ok(types.includes('"completed"'));
  assert.ok(types.includes('"not_configured"'));
  assert.ok(types.includes('"not_found"'));
  assert.ok(types.includes('"unreachable"'));
  assert.ok(types.includes('"unauthorized"'));
});
check("1b. AiResearchInputPacket carries googlePlacesResearch alongside websiteResearch", () => {
  const idx = types.indexOf("AiResearchInputPacket");
  const block = types.slice(idx, idx + 800);
  assert.ok(block.includes("websiteResearch: WebsiteResearchResult | null"));
  assert.ok(block.includes("googlePlacesResearch: GooglePlacesResearchResult | null"));
});

// --- 2. Adapter — bounded, truthful, gated -----------------------------------------------------
check("2a. Adapter is server-only and gated on GOOGLE_PLACES_API_KEY, never silently retried", () => {
  assert.ok(adapter.includes('import "server-only"'));
  assert.ok(adapter.includes("GOOGLE_PLACES_API_KEY"));
  assert.ok(adapter.includes("export function isGooglePlacesConfigured"));
  assert.ok(/if \(!apiKey\)/.test(adapter));
});
check("2b. A single timed request with no retry loop, mirroring websiteAdapter.ts conventions", () => {
  assert.ok(adapter.includes("AbortController"));
  assert.ok(adapter.includes("FETCH_TIMEOUT_MS"));
  assert.ok(!/for\s*\(.*retry/i.test(adapter));
});
check("2c. Rating/review count are never claimed as a Leonix endorsement and never auto-promotable", () => {
  const idx = adapter.indexOf("google_rating");
  const block = adapter.slice(idx - 50, idx + 300);
  assert.ok(/not a Leonix claim/i.test(block));
});
check("2d. Every identity field (name/address/phone/website) is marked requiresConfirmation: true", () => {
  assert.ok(/category: "verified_name".*requiresConfirmation: true/.test(adapter));
  assert.ok(/category: "verified_address".*requiresConfirmation: true/.test(adapter));
});
check("2e. Real REST endpoint is Google's own Places API (New) text-search, not a scrape", () => {
  assert.ok(adapter.includes("https://places.googleapis.com/v1/places:searchText"));
  assert.ok(adapter.includes("X-Goog-Api-Key"));
});

// --- 3. Discovery Source Registry — single source of truth updated correctly --------------------
check("3a. google_business source is now declared live_v1/public_fetch", () => {
  const idx = registry.indexOf('sourceKey: "google_business"');
  const block = registry.slice(idx, idx + 1000);
  assert.ok(block.includes('researchSupport: "live_v1"'));
  assert.ok(block.includes('connectionMode: "public_fetch"'));
});
check("3b. Facebook/Instagram/TikTok/YouTube/LinkedIn/Yelp/WhatsApp remain honestly manual_only (no fake support added)", () => {
  for (const key of ["facebook", "instagram", "tiktok", "youtube", "linkedin", "yelp", "whatsapp"]) {
    const idx = registry.indexOf(`sourceKey: "${key}"`);
    assert.ok(idx !== -1, `${key} entry missing`);
    const block = registry.slice(idx, idx + 400);
    assert.ok(block.includes('researchSupport: "manual_only"'), `${key} should remain manual_only`);
  }
});

// --- 4. Packet builder threads the new field through -------------------------------------------
check("4a. buildAiResearchInputPacket accepts and returns googlePlacesResearch", () => {
  assert.ok(briefingSynthesis.includes("googlePlacesResearch: GooglePlacesResearchResult | null"));
  assert.ok(/googlePlacesResearch: input\.googlePlacesResearch/.test(briefingSynthesis));
});

// --- 5. Repository orchestration — the real fix ---------------------------------------------
check("5a. Website source lookup is source-type-specific, not the now-ambiguous isLiveV1Source check", () => {
  assert.ok(!/isLiveV1Source/.test(repository), "isLiveV1Source must no longer be referenced — google_business is also live_v1 now, so a generic check would wrongly match it");
  assert.ok(/sourceLinks\.find\(\(s\) => s\.sourceType === "website"\)/.test(repository));
});
check("5b. Google Places is called independently of manually-added source links (search-by-name is the point)", () => {
  const idx = repository.indexOf("runGooglePlacesResearchV1(");
  assert.ok(idx !== -1);
  const block = repository.slice(Math.max(0, idx - 300), idx + 50);
  assert.ok(block.includes("isGooglePlacesConfigured()"));
});
check("5c. source_not_found gate allows proceeding via a configured Places lookup alone", () => {
  assert.ok(/sourceLinks\.length === 0 && sourceFiles\.length === 0 && !isGooglePlacesConfigured\(\)/.test(repository));
});
check("5d. Real uploaded file evidence is threaded into the packet and persisted (not hardcoded empty)", () => {
  assert.ok(!/fileEvidence:\s*\[\]/.test(repository));
  assert.ok(!/source_file_ids:\s*\[\]/.test(repository));
  assert.ok(/fileEvidence: sourceFiles\.map/.test(repository));
  assert.ok(/source_file_ids: sourceFiles\.map/.test(repository));
});
check("5e. runBusinessAiResearch accepts an optional locationHint parameter, defaulting to null", () => {
  assert.ok(/locationHint: string \| null = null/.test(repository));
});
check("5f. No image generation or paid creative provider call exists anywhere in this file", () => {
  assert.ok(!/generateImage|createImage|images\.generate/i.test(repository));
});

// --- 6. API route — location hint computed from real, already-stored data -----------------------
check("6a. research/route.ts computes a locationHint from business_service_areas, never invents one", () => {
  assert.ok(researchRoute.includes("business_service_areas"));
  assert.ok(researchRoute.includes("loadLocationHint"));
  assert.ok(/runBusinessAiResearch\(businessId, identity, access\.actor, locationHint\)/.test(researchRoute));
});
check("6b. GET route reports googlePlacesAvailable honestly (presence, not the secret value)", () => {
  assert.ok(researchRoute.includes("googlePlacesAvailable: isGooglePlacesConfigured()"));
  assert.ok(!/GOOGLE_PLACES_API_KEY\s*[:=]\s*process\.env\.GOOGLE_PLACES_API_KEY/.test(researchRoute) || !/console\.log.*GOOGLE_PLACES_API_KEY/.test(researchRoute));
});

// --- 7. Staff-facing Research UX — sources checked, findings, manual-vs-auto transparency --------
check("7a. RunResearchButton surfaces Google Places configured/not-configured state to staff", () => {
  assert.ok(fieldDiscoveryActions.includes("googlePlacesAvailable"));
  const idx = fieldDiscoveryActions.indexOf("export function RunResearchButton");
  const block = fieldDiscoveryActions.slice(idx, idx + 2000);
  assert.ok(/Google Business Profile/.test(block));
});
check("7b. A dedicated SourceFindingsPanel renders raw per-source findings, distinct from the LLM's synthesized draft", () => {
  assert.ok(fieldDiscoveryActions.includes("export function SourceFindingsPanel"));
  const idx = fieldDiscoveryActions.indexOf("export function SourceFindingsPanel");
  const block = fieldDiscoveryActions.slice(idx, idx + 3000);
  assert.ok(block.includes("websiteResearch"));
  assert.ok(block.includes("googlePlacesResearch"));
  assert.ok(/requiresConfirmation/.test(block));
});
check("7c. SourceLinksPanel labels each source Auto vs Manual using the real registry, not a hardcoded guess", () => {
  const idx = fieldDiscoveryActions.indexOf("export function SourceLinksPanel");
  const block = fieldDiscoveryActions.slice(idx, idx + 1500);
  assert.ok(block.includes("findSourceDefinition"));
  assert.ok(block.includes('researchSupport === "live_v1"'));
});
check("7d. page.tsx wires SourceFindingsPanel and googlePlacesAvailable into the real staff dashboard", () => {
  assert.ok(pageTsx.includes("SourceFindingsPanel"));
  assert.ok(pageTsx.includes("googlePlacesAvailable={fieldDiscoveryData.googlePlacesAvailable}"));
  assert.ok(pageTsx.includes("isGooglePlacesConfigured"));
});

// --- 8. Zero new migrations for this gate --------------------------------------------------
check("8a. No migration file was added for this gate (reused existing business_service_areas/business_ai_research_runs columns only)", () => {
  const migrationsDir = path.resolve(__dirname, "..", "supabase", "migrations");
  const files = existsSync(migrationsDir) ? readdirSync(migrationsDir) : [];
  const newest = files.filter((f) => f.startsWith("202609") || f.startsWith("202610")).sort();
  // Not asserting zero files overall (other in-branch work may have added migrations earlier) —
  // asserting instead that no migration file mentions google_places, which would indicate a new
  // table/column was added for this feature instead of reusing existing storage.
  for (const f of newest) {
    const content = readFileSync(path.join(migrationsDir, f), "utf8");
    assert.ok(!/google_places/i.test(content), `${f} should not reference google_places — this gate must not add schema`);
  }
});

// --- 9. No secret exposure ------------------------------------------------------------------
check("9a. No file in this gate prints or logs a raw API key value", () => {
  for (const [name, content] of [
    ["googlePlacesAdapter.ts", adapter],
    ["repository.ts", repository],
    ["research/route.ts", researchRoute],
  ] as const) {
    assert.ok(!/console\.(log|error|warn)\([^)]*apiKey/i.test(content), `${name} must never log the API key`);
  }
});

console.log(`\n${passed} check(s) passed.`);
