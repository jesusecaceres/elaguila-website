/**
 * Globalization Build 03 — Business Hub + CTA Truth + Media + Leonix Community Trust verifier.
 * Run: npx tsx scripts/verify-globalization-business-hub-trust-03.ts
 *
 * A. Business Hub — shared contract, data-driven visibility, real CTA destinations, analytics reuse
 * B. Leonix Community Trust — no star score, lion UI, registry, server-derived user, DB dedupe,
 *    toggle truth, aggregate truth, no fake/owner-editable counts
 * C. Google/Yelp — external/provider separation, no owner-entered rating/count
 * D. Privacy — hidden address / private contact not exposed
 * E. Media — existing contract reused, no duplicate stacks
 * F. CTA dead-button fix
 */
import fs from "node:fs";
import path from "node:path";
import { strict as assert } from "node:assert";

const root = process.cwd();
const failures: string[] = [];

function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK: ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.error(`FAIL: ${name}`);
    console.error(`  ${e instanceof Error ? e.message : String(e)}`);
  }
}

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function stripJsComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

function stripSqlComments(sql: string): string {
  return sql
    .split(/\r?\n/)
    .map((line) => line.replace(/--.*$/, ""))
    .join("\n");
}

const REGISTRY_PATH = "app/lib/leonixCommunityTrust/leonixEndorsementRegistry.ts";
const SERVER_PATH = "app/lib/leonixCommunityTrust/leonixEndorsementServer.ts";
const CLIENT_PATH = "app/lib/leonixCommunityTrust/leonixEndorsementClient.ts";
const ANALYTICS_PATH = "app/lib/leonixCommunityTrust/leonixEndorsementAnalytics.ts";
const UI_PATH = "app/components/leonixCommunityTrust/LeonixCommunityTrust.tsx";
const API_ROUTE_PATH = "app/api/leonix-endorsements/route.ts";
const MIGRATION_PATH = "supabase/migrations/20260819210000_leonix_endorsement_votes.sql";
const ADMIN_ACTIONS_PATH = "app/admin/_lib/leonixEndorsementAdminActions.ts";
const RESTAURANT_HUB_PATH = "app/(site)/clasificados/restaurantes/shell/RestaurantContactHub.tsx";
const SERVICIOS_HUB_PATH = "app/(site)/servicios/components/ServiciosBusinessHubContactCard.tsx";
const ANUNCIO_PAGE_PATH = "app/(site)/clasificados/anuncio/[id]/page.tsx";
const EVENT_TYPES_PATH = "app/lib/listingAnalyticsEventTypes.ts";

const registrySrc = read(REGISTRY_PATH);
const serverSrc = read(SERVER_PATH);
const clientSrc = read(CLIENT_PATH);
const analyticsSrc = read(ANALYTICS_PATH);
const uiSrc = read(UI_PATH);
const uiCode = stripJsComments(uiSrc);
const apiRouteSrc = read(API_ROUTE_PATH);
const sql = read(MIGRATION_PATH);
const sqlNoComments = stripSqlComments(sql);
const sqlNorm = sql.replace(/\s+/g, " ").toLowerCase();
const adminActionsSrc = read(ADMIN_ACTIONS_PATH);
const restaurantHubSrc = read(RESTAURANT_HUB_PATH);
const serviciosHubSrc = read(SERVICIOS_HUB_PATH);
const anuncioPageSrc = read(ANUNCIO_PAGE_PATH);
const eventTypesSrc = read(EVENT_TYPES_PATH);

// =================================================================================
// A. Business Hub
// =================================================================================

check("shared Business Hub contract reused, not reinvented — Community Trust is a new section inside existing category cards", () => {
  assert.ok(restaurantHubSrc.includes('from "@/app/components/leonixCommunityTrust/LeonixCommunityTrust"'));
  assert.ok(serviciosHubSrc.includes('from "@/app/components/leonixCommunityTrust/LeonixCommunityTrust"'));
  // Confirms no competing "god component" renderer was built — this repo's own established
  // architecture (per prior Business Hub adoption work) is per-category cards + a shared contract
  // layer, not one shared renderer instantiated per category.
  assert.ok(!fs.existsSync(path.join(root, "app/components/businessHub/FullBusinessHubCard.tsx")));
});

check("Community Trust visibility is data-driven — only renders for a real, non-empty targetId", () => {
  assert.ok(restaurantHubSrc.includes("(listingSourceId ?? \"\").trim()"));
  assert.ok(serviciosHubSrc.includes("(listingSourceId ?? \"\").trim()"));
});

check("Community Trust component itself never renders with zero eligible endorsement definitions", () => {
  assert.ok(uiCode.includes("if (entries.length === 0) return null;"));
});

check("real CTA destination fix: generic anuncio/[id] Mark-Sold/Edit/Delete dead-button block removed, real owner-only manage link used instead", () => {
  assert.ok(!anuncioPageSrc.includes("v2 placeholder: wired later to real auth"));
  assert.ok(!anuncioPageSrc.includes("isAuthed"));
  assert.ok(!/\{t\.markSold\}/.test(anuncioPageSrc) || anuncioPageSrc.includes("isRealListingOwner"));
  assert.ok(anuncioPageSrc.includes("isRealListingOwner"));
  assert.ok(anuncioPageSrc.includes('/dashboard/mis-anuncios?lang=${lang}'));
});

check("dead-button fix reuses a REAL ownership comparison, not a hardcoded/fake boolean", () => {
  const idx = anuncioPageSrc.indexOf("const isRealListingOwner =");
  assert.ok(idx !== -1);
  const line = anuncioPageSrc.slice(idx, idx + 200);
  assert.ok(line.includes("viewerUserId") && line.includes("listing.owner_id"));
});

check("CTA analytics reuse: endorsement tracking calls the one real backend sink (recordAnalyticsEvent), no second analytics stack", () => {
  assert.ok(analyticsSrc.includes('from "@/app/lib/analytics/client/recordAnalyticsEvent"'));
  assert.ok(!/fetch\(["']\/api\/(?!analytics\/events)/.test(stripJsComments(analyticsSrc)));
});

check("new analytics event types are additive to the existing allowlist, not a silent rename of historical types", () => {
  assert.ok(eventTypesSrc.includes('"leonix_endorsement_add"'));
  assert.ok(eventTypesSrc.includes('"leonix_endorsement_remove"'));
  // every previously-existing literal must still be present
  for (const legacy of ["listing_view", "cta_click", "phone_click", "coupon_open", "message_click"]) {
    assert.ok(eventTypesSrc.includes(`"${legacy}"`), `must preserve historical event type "${legacy}"`);
  }
});

// =================================================================================
// B. Leonix Community Trust
// =================================================================================

check("no star-based native rating anywhere in the new endorsement code", () => {
  const all = [registrySrc, serverSrc, clientSrc, uiSrc, apiRouteSrc].join("\n");
  assert.ok(!/★|FaStar|StarIcon|\brating\b\s*:\s*number/i.test(all));
  assert.ok(!/\b[0-5]\.\d\s*stars?\b/i.test(all));
});

check("lion endorsement UI — 🦁 glyph used, no heart/star iconography, no fabricated logo asset", () => {
  assert.ok(uiSrc.includes("🦁"));
  assert.ok(!/❤️|FiHeart|FaHeart|★|FaStar/.test(uiCode));
  // uiCode (comment-stripped) — a doc-comment explaining the logo was deliberately NOT used is
  // fine; only functional code referencing the asset would be a real violation.
  assert.ok(!uiCode.includes("logo-clean.png"), "must not embed/resize the official crest as a tiny chip icon");
});

check("controlled endorsement registry exists with ES/EN labels, category scoping, active flag, and display order", () => {
  assert.ok(registrySrc.includes("LEONIX_ENDORSEMENT_REGISTRY"));
  assert.ok(registrySrc.includes("es:") && registrySrc.includes("en:"));
  assert.ok(registrySrc.includes("active:"));
  assert.ok(registrySrc.includes("order:"));
});

check("Restaurantes registry matches the exact required ES/EN taxonomy", () => {
  const pairs: [string, string][] = [
    ["clean", "Restaurante limpio"],
    ["friendly_staff", "Personal amable"],
    ["great_food", "Buena comida"],
    ["good_service", "Buen servicio"],
    ["great_atmosphere", "Buen ambiente"],
  ];
  for (const [key, es] of pairs) {
    assert.ok(registrySrc.includes(`key: "${key}"`), `missing restaurantes key ${key}`);
    assert.ok(registrySrc.includes(es), `missing ES label "${es}"`);
  }
});

check("Servicios registry matches the exact required ES/EN taxonomy", () => {
  const pairs: [string, string][] = [
    ["professional", "Profesional"],
    ["on_time", "Puntual"],
    ["friendly", "Trato amable"],
    ["good_communication", "Buena comunicación"],
    ["quality_work", "Trabajo de calidad"],
  ];
  for (const [key, es] of pairs) {
    assert.ok(registrySrc.includes(`key: "${key}"`), `missing servicios key ${key}`);
    assert.ok(registrySrc.includes(es), `missing ES label "${es}"`);
  }
});

check("labels are never stored on the vote row — registry is the single source of copy truth", () => {
  assert.ok(sqlNorm.includes("endorsement_key text not null"));
  assert.ok(!/label|copy_es|copy_en/i.test(sqlNoComments.toLowerCase().replace(/comment on[\s\S]*?;/g, "")));
});

check("vote user identity is always server-derived — never accepted from request body", () => {
  assert.ok(apiRouteSrc.includes("getBearerUserId(req)"));
  assert.ok(apiRouteSrc.includes("if (!userId)"));
  const postFn = apiRouteSrc.match(/export async function POST[\s\S]*$/)?.[0] ?? "";
  assert.ok(!/userId\s*=\s*(typeof\s+)?b\.userId/.test(postFn), "must never read a client-supplied userId field");
});

check("DB unique constraint guarantees at most one active vote per (user, target, endorsement key)", () => {
  assert.ok(sqlNorm.includes("create unique index if not exists leonix_endorsement_votes_dedupe_uidx"));
  assert.ok(sqlNorm.includes("on public.leonix_endorsement_votes (user_id, target_type, target_id, endorsement_key)"));
});

check("toggle is a single atomic RPC call — not a client-orchestrated read-then-write race", () => {
  assert.ok(serverSrc.includes('supabase.rpc("toggle_leonix_endorsement_vote"'));
  const fnBody = sqlNorm.match(/create or replace function public\.toggle_leonix_endorsement_vote[\s\S]*?\$\$;/)?.[0] ?? "";
  assert.ok(fnBody.includes("delete from public.leonix_endorsement_votes"));
  assert.ok(fnBody.includes("on conflict (user_id, target_type, target_id, endorsement_key) do nothing"));
});

check("toggle RPC is service-role only — no anon/authenticated execute grant", () => {
  assert.ok(sqlNorm.includes("revoke all on function public.toggle_leonix_endorsement_vote(text, uuid, text, text, uuid) from public"));
  assert.ok(sqlNorm.includes("revoke all on function public.toggle_leonix_endorsement_vote(text, uuid, text, text, uuid) from anon"));
  assert.ok(sqlNorm.includes("revoke all on function public.toggle_leonix_endorsement_vote(text, uuid, text, text, uuid) from authenticated"));
  assert.ok(sqlNorm.includes("grant execute on function public.toggle_leonix_endorsement_vote(text, uuid, text, text, uuid) to service_role"));
});

check("aggregate read RPC is genuinely bounded (one query for every key + the caller's own vote state)", () => {
  const fnBody = sqlNorm.match(/create or replace function public\.get_leonix_endorsement_summary[\s\S]*?\$\$;/)?.[0] ?? "";
  assert.ok(fnBody.includes("group by endorsement_key"));
});

check("Final Hardening Gate 7: aggregate read RPC is NOT directly callable by anon/authenticated via PostgREST — a browser cannot pass an arbitrary p_user_id to read another user's vote selections; only the server-side API route (via service_role) may call it", () => {
  assert.ok(
    !sqlNorm.includes("grant execute on function public.get_leonix_endorsement_summary(text, uuid, uuid) to anon"),
    "must NOT grant anon direct RPC access",
  );
  assert.ok(
    !sqlNorm.includes("grant execute on function public.get_leonix_endorsement_summary(text, uuid, uuid) to authenticated"),
    "must NOT grant authenticated direct RPC access",
  );
  assert.ok(
    sqlNorm.includes("grant execute on function public.get_leonix_endorsement_summary(text, uuid, uuid) to service_role"),
    "must grant service_role so the admin-mediated API route can still call it",
  );
});

check("Final Hardening Gate 6a: endorsement_key has a database-level format CHECK, not just an application-layer registry lookup", () => {
  assert.ok(
    /endorsement_key\s+text\s+not\s+null\s+check\s*\(endorsement_key\s*~/i.test(sqlNorm),
    "endorsement_key column must carry a CHECK constraint enforcing a safe key shape at the DB layer",
  );
});

check("Final Hardening Gate 6b: toggle RPC validates target_id against a real row in the target category's own table before any write — a random valid-shaped UUID cannot receive a vote", () => {
  const fnBody = sqlNorm.match(/create or replace function public\.toggle_leonix_endorsement_vote[\s\S]*?\$\$;/)?.[0] ?? "";
  assert.ok(fnBody.includes("v_target_exists"), "toggle RPC must compute target existence");
  assert.ok(fnBody.includes("servicios_public_listings"), "must check servicios targets against the real servicios table");
  assert.ok(fnBody.includes("restaurantes_public_listings"), "must check restaurantes targets against the real restaurantes table");
  assert.ok(fnBody.includes("leonix_endorsement_target_not_found"), "must fail closed with a distinguishable error when the target does not exist");
});

check("UI never sets a local optimistic count independent of the server response — updates only from the toggle result", () => {
  const fn = uiCode.match(/const handleTap = useCallback\([\s\S]*?\[category, targetId/)?.[0] ?? "";
  assert.ok(fn.includes("await toggleLeonixEndorsementVoteClient"));
  assert.ok(fn.includes("result.count") && fn.includes("result.active"));
  assert.ok(!/count:\s*\(?\s*entry\.count\s*\+\s*1/.test(fn), "must never locally increment before the server responds");
});

check("no fake seeded counts anywhere in the migration — the only INSERT is the toggle RPC's own parameterized runtime statement, never a literal seed row", () => {
  // Strip the RPC function bodies (their own real, parameterized INSERT is legitimate toggle
  // logic, not a seed) and confirm no INSERT with literal values remains anywhere else.
  const withoutFunctionBodies = sqlNoComments.replace(/CREATE OR REPLACE FUNCTION[\s\S]*?\$\$;/g, "");
  assert.ok(!/insert into public\.leonix_endorsement_votes/i.test(withoutFunctionBodies));
  // The RPC's own INSERT must use bound parameters (p_target_type etc.), never literal UUID/text
  // values that would constitute a real seeded vote.
  const rpcInsert = sqlNoComments.match(/INSERT INTO public\.leonix_endorsement_votes[\s\S]*?;/i)?.[0] ?? "";
  assert.ok(rpcInsert.includes("p_target_type") && rpcInsert.includes("p_user_id"));
  assert.ok(!/values\s*\(\s*'[0-9a-f-]{36}'/i.test(rpcInsert), "must never insert a literal hardcoded UUID");
});

check("no owner-editable/browser-writable aggregate count column exists — counts are always COUNT(*) over real rows", () => {
  const tableBlock = sql.match(/CREATE TABLE IF NOT EXISTS public\.leonix_endorsement_votes[\s\S]*?\);/)?.[0] ?? "";
  assert.ok(!/count\s+integer/i.test(tableBlock));
  assert.ok(!/\bendorsementCount\s*[:=]/.test(uiCode.replace(/entry\.count|result\.count|vote_count/g, "")));
});

check("admin has no path to type a count directly — only vote-row removal + read-only aggregate inspection, same audit convention as existing admin actions", () => {
  assert.ok(adminActionsSrc.includes("requireLeonixAdminPermission"));
  assert.ok(adminActionsSrc.includes("auditAdminWrite"));
  assert.ok(!/\.update\(\s*\{\s*count/i.test(adminActionsSrc));
  assert.ok(adminActionsSrc.includes(".delete()"));
});

check("self-vote is blocked wherever an already-trusted owner-identity value exists, documented as best-effort", () => {
  assert.ok(serverSrc.includes("isSelfVote"));
  assert.ok(serverSrc.includes("self_vote_blocked"));
});

check("no public free-text review system invented — endorsement_key is a closed, registry-validated enum, not arbitrary text", () => {
  assert.ok(serverSrc.includes("isValidLeonixEndorsementKey"));
  assert.ok(apiRouteSrc.includes("invalid_endorsement_key") || serverSrc.includes("invalid_endorsement_key"));
});

check("ES/EN supported throughout — Community Trust title, zero-vote helper text, login/error states", () => {
  assert.ok(uiSrc.includes("Comunidad en Leonix") && uiSrc.includes("Community on Leonix"));
  assert.ok(uiSrc.includes("Sé de los primeros") && uiSrc.includes("Be among the first"));
  assert.ok(uiSrc.includes("Inicia sesión") && uiSrc.includes("Sign in to endorse"));
});

check("accessibility: real button elements, aria-pressed, selected state not color-only (icon + border change together)", () => {
  assert.ok(uiCode.includes('<button'));
  assert.ok(uiCode.includes("aria-pressed={entry.userVoted}"));
  assert.ok(uiCode.includes("aria-label="));
  // selected state changes both the glyph (✓) and the border/background — not a bare color swap
  assert.ok(uiSrc.includes('entry.userVoted ? "✓" : ""'));
});

check("mobile-safe: chips wrap via flex-wrap, no fixed/overflow-prone width", () => {
  assert.ok(uiSrc.includes("flex flex-wrap"));
});

// =================================================================================
// C. Google/Yelp
// =================================================================================

check("Google/Yelp remain link-only, semantically separate from Leonix Community Trust — no new rating/count field introduced", () => {
  const newFiles = [registrySrc, serverSrc, clientSrc, uiSrc, apiRouteSrc, sqlNoComments].join("\n");
  assert.ok(!/google_rating|yelp_rating|googleReviewCount|yelpReviewCount/i.test(newFiles));
});

check("Community Trust UI and external-reviews UI are rendered as visually distinct sections in both category cards", () => {
  // Community Trust section is inserted BEFORE the existing reviews/social secondary row in both
  // cards — never merged into the same list/number.
  const rIdx = restaurantHubSrc.indexOf("LeonixCommunityTrust");
  const rReviewsIdx = restaurantHubSrc.indexOf("rest-hub-reviews-heading");
  assert.ok(rIdx !== -1 && rReviewsIdx !== -1 && rIdx < rReviewsIdx);

  const sIdx = serviciosHubSrc.indexOf("LeonixCommunityTrust");
  const sReviewsIdx = serviciosHubSrc.indexOf("hub-reviews-heading");
  assert.ok(sIdx !== -1 && sReviewsIdx !== -1 && sIdx < sReviewsIdx);
});

// =================================================================================
// D. Privacy
// =================================================================================

check("endorsement snapshot never includes any address/location field", () => {
  const tableBlock = sql.match(/CREATE TABLE IF NOT EXISTS public\.leonix_endorsement_votes[\s\S]*?\);/)?.[0] ?? "";
  assert.ok(!/address|location|lat|lng|latitude|longitude/i.test(tableBlock));
});

check("endorsement snapshot never includes a private contact field (phone/email)", () => {
  const tableBlock = sql.match(/CREATE TABLE IF NOT EXISTS public\.leonix_endorsement_votes[\s\S]*?\);/)?.[0] ?? "";
  assert.ok(!/phone|email|contact/i.test(tableBlock));
});

check("public aggregate read RPC never exposes another voter's identity", () => {
  const fnBody = sqlNorm.match(/create or replace function public\.get_leonix_endorsement_summary[\s\S]*?\$\$;/)?.[0] ?? "";
  assert.ok(!/select\s+user_id/.test(fnBody), "must never SELECT raw user_id into the public read result set");
});

// =================================================================================
// E. Media
// =================================================================================

check("no new/duplicate media or video stack introduced by this build", () => {
  assert.ok(!fs.existsSync(path.join(root, "app/lib/media/leonixCommunityTrustVideo.ts")));
  const allNew = [registrySrc, serverSrc, clientSrc, uiSrc, apiRouteSrc].join("\n");
  assert.ok(!/videoValidator|maxExternalVideos|VideoGallery/.test(allNew));
});

// =================================================================================
if (failures.length) {
  console.error(`\n${failures.length} check(s) FAILED`);
  process.exit(1);
}
console.log("\nverify-globalization-business-hub-trust-03: PASS");
