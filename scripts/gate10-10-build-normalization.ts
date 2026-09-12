/**
 * Gate 10.10 — builds the raw-canonical-item -> atomic-requirement normalization manifest.
 *
 * For every one of the 825 raw canonical items (824 from Gate 10.9's extraction + 1 newly-added
 * "Que ruja el leon" slogan line, found during this gate's deep §35-37 audit and now added to the
 * extractor's manual prose supplement), determines an explicit disposition and, where applicable,
 * the atomic reqId(s) it maps to. Matching strategy, in order:
 *
 *   1. Exact-count pairing: if a (section, subsection) group has the SAME number of raw items as
 *      manifest rows, pair them 1:1 in document order (both lists are built by walking the MD/ledger
 *      top-to-bottom, so order correspondence is a real signal, not a guess) -> ATOMIC_REQUIREMENT.
 *   2. Single-governing-row consolidation: if a (section, subsection) group has exactly ONE manifest
 *      row governing MANY raw items (a flat option-list/typical-example enumeration), every raw item
 *      -> EXAMPLE_OR_OPTION under that one reqId.
 *   3. Fuzzy content matching: for partially-consolidated groups (manifest count between 1 and raw
 *      count), each raw item's normalized text is checked for a real keyword match against every
 *      candidate manifest row's requirement text in the same group. A match -> that reqId (ATOMIC_
 *      REQUIREMENT if the row is otherwise 1:1, else CHILD_OF_ATOMIC_REQUIREMENT/EXAMPLE_OR_OPTION
 *      per the row's own multiplicity). NO MATCH -> left UNRESOLVED for explicit manual disposition
 *      below (this is the real adversarial check: a raw item content-absent from every candidate row
 *      is a genuine potential gap, not silently assumed covered).
 *   4. Explicit manual overrides for the structurally-narrative sections (§0, §1, §35, §37's 11-step
 *      restatement, §36) and for known extra "synthesized guard" rows (REQ-4.10, REQ-29.12) that have
 *      no single direct raw sentence but are justified by the WHOLE enumeration's raw items collectively.
 *
 * Run: npx tsx scripts/gate10-10-build-normalization.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..");
const extraction = JSON.parse(readFileSync(join(ROOT, "docs", "business-concierge", "GATE_10_9_CANONICAL_EXTRACTION.json"), "utf8"));
const manifest = JSON.parse(readFileSync(join(ROOT, "docs", "business-concierge", "BUSINESS_CONCIERGE_MASTER_MD_EVIDENCE_MANIFEST.json"), "utf8"));

interface RawBullet { lineNo: number; section: number; subsection: string | null; sectionTitle: string; text: string }
const bullets: RawBullet[] = extraction.bullets;
const reqs: any[] = manifest.requirements;

interface NormRow {
  rawId: string; section: string; subsection: string | null; rawText: string; sourceLocation: string;
  disposition: string; atomicReqIds: string[]; reason: string;
}
const out: NormRow[] = [];

function norm(s: string): string {
  return s.toLowerCase().replace(/[`*_"“”'.;,()[\]?]/g, "").replace(/[/\-<>]/g, " ").replace(/\s+/g, " ").trim();
}
// Real, non-generic keyword tokens (drop stopwords/connectors that would cause false-positive matches).
const STOP = new Set(["the", "a", "an", "of", "or", "and", "to", "for", "if", "is", "are", "on", "in", "at", "with", "no", "not", "be", "as", "it", "its", "vs", "e.g."]);
function tokens(s: string): string[] {
  return norm(s).split(" ").filter((t) => t.length > 2 && !STOP.has(t));
}
function fuzzyScore(rawText: string, candidateText: string): number {
  const rt = tokens(rawText.replace(/^\[(STATE|PROSE|SLOGAN|VISION)\]\s*/, ""));
  const ct = new Set(tokens(candidateText));
  if (rt.length === 0) return 0;
  const hits = rt.filter((t) => ct.has(t)).length;
  return hits / rt.length;
}
// Picks the BEST-scoring candidate above threshold, not merely the first one to clear it -- a first-
// match `.find()` previously mis-mapped "[STATE] CLIENT PREFERENCE" to REQ-4.1 CLIENT CONFIRMED
// (50% token overlap on "client") instead of the true 100%-match REQ-4.7 CLIENT PREFERENCE, because
// REQ-4.1 happened to appear earlier in array order. Found via this gate's own automated post-build
// coverage cross-check, fixed here.
function bestFuzzyMatch<T extends { requirement: string }>(rawText: string, candidates: T[]): { row: T; score: number } | null {
  let best: { row: T; score: number } | null = null;
  for (const c of candidates) {
    const score = fuzzyScore(rawText, c.requirement);
    if (score >= 0.5 && (!best || score > best.score)) best = { row: c, score };
  }
  return best;
}

function subsectionNum(subsection: string | null): string | null {
  if (!subsection) return null;
  const m = subsection.match(/^(\d+(?:\.\d+)?)/);
  return m ? m[1] : null;
}
function reqSubPrefix(reqId: string): string | null {
  const m = reqId.match(/^REQ-(\d+)\.(\d+)\.\d+$/);
  return m ? `${m[1]}.${m[2]}` : null;
}

// -------------------------------------------------------------------------------------------
// Group raw items by (section, subsectionNum) and manifest rows by (section, subPrefix).
// -------------------------------------------------------------------------------------------
type Key = string;
const rawGroups = new Map<Key, RawBullet[]>();
for (const b of bullets) {
  const sn = subsectionNum(b.subsection);
  // sn is already fully-qualified (e.g. "8.20") when the raw subsection text itself starts with a
  // section-number prefix ("8.20 Analytics / measurement") -- do NOT re-prepend b.section, or the
  // key becomes "8.8.20" and silently fails to match the manifest's "8.20" grouping.
  const key = sn ?? `${b.section}`;
  rawGroups.set(key, [...(rawGroups.get(key) ?? []), b]);
}
const manGroupsBySub = new Map<Key, any[]>();
const manGroupsBySection = new Map<number, any[]>();
for (const r of reqs) {
  manGroupsBySection.set(Number(r.mdSection), [...(manGroupsBySection.get(Number(r.mdSection)) ?? []), r]);
  const sp = reqSubPrefix(r.reqId);
  if (sp) manGroupsBySub.set(sp, [...(manGroupsBySub.get(sp) ?? []), r]);
}

const resolvedRawIds = new Set<number>(); // index into `bullets`
let rawSeq = 0;

function push(b: RawBullet, disposition: string, atomicReqIds: string[], reason: string) {
  rawSeq++;
  out.push({
    rawId: `RAW-${String(rawSeq).padStart(4, "0")}`,
    section: `§${b.section}`,
    subsection: b.subsection,
    rawText: b.text,
    sourceLocation: `line ${b.lineNo}`,
    disposition,
    atomicReqIds,
    reason,
  });
}

// -------------------------------------------------------------------------------------------
// EXPLICIT MANUAL HANDLING — sections/groups whose disposition requires real judgment, not
// mechanical order-pairing or fuzzy text matching (narrative synthesis, roadmap restatement,
// extra synthesized guard rows). Each entry is fully justified in the Gate 10.10 doc section.
// -------------------------------------------------------------------------------------------
const MANUAL: Record<string, (b: RawBullet) => { disposition: string; atomicReqIds: string[]; reason: string } | null> = {};

// §0: North Star. All 18 raw items are the narrative vision list proven once as REQ-0.1 (13-stage
// flow) / REQ-0.2 (anti-pattern guards). Gate 10.10 safe_gate_9 re-audited EVERY item individually
// (see doc) and confirmed each concrete noun already has its OWN independently-proven atomic home
// elsewhere -- so these are DUPLICATE_RESTATEMENT of that specific home, not a generic "narrative" dump.
const SEC0_MAP: Record<string, string[]> = {
  "leonix should not build from vague instructions": ["REQ-5.1"],
  "discover capture extract verify find gaps ask confirm architect generate project md build qa handoff follow through": ["REQ-0.1"],
  "then business concierge should generate the project blueprint": ["REQ-0.1"],
  "the md is the output of disciplined discovery": ["REQ-0.2", "REQ-5.1"],
  "who the client is": ["REQ-8.1.1"],
  "what they are trying to accomplish": ["REQ-8.2.1"],
  "who they serve": ["REQ-8.3.1"],
  "what they want": ["REQ-8.2.3"],
  "what they do not want": ["REQ-16.2"],
  "what already exists": ["REQ-2.3.6"],
  "what is missing": ["REQ-5.1", "REQ-17.1"],
  "what must be verified": ["REQ-4.5", "REQ-2.4"],
  "what assets are available": ["REQ-8.8.1"],
  "what platforms/infrastructure are appropriate": ["REQ-11.1", "REQ-12.1"],
  "who owns accounts and billing": ["REQ-13.1", "REQ-8.24.1"],
  "what leonix is responsible for": ["REQ-8.26.5"],
  "what the client is responsible for": ["REQ-8.26.4"],
  "what is in scope": ["REQ-8.26.1"],
  "what is out of scope": ["REQ-8.26.2"],
  "what success looks like": ["REQ-8.2.5"],
  "what must be tested": ["REQ-26.1"],
  "what must happen after launch": ["REQ-28.1", "REQ-8.25.1"],
};
MANUAL["0"] = (b) => {
  const key = norm(b.text.replace(/^\[STATE\]\s*/, ""));
  for (const [k, ids] of Object.entries(SEC0_MAP)) {
    if (key.includes(norm(k)) || norm(k).includes(key)) {
      return { disposition: "DUPLICATE_RESTATEMENT", atomicReqIds: ids, reason: `§0 vision-list item restates the specific obligation already independently proven at ${ids.join("/")}` };
    }
  }
  return null;
};

// §1: Core Business Rule. Same treatment -- every "must come from"/"must not come from" item is a
// restatement of a specific, already-proven guard (grep-verified in Gate 10.9/10.10 against the
// manifest's own evidence text, not assumed).
const SEC1_MAP: Record<string, string[]> = {
  "the goal is not to mass-produce identical projects": ["REQ-37.2"],
  "custom client solution repeatable discovery discipline fast execution": ["REQ-37.2"],
  "better discovery": ["REQ-2.1", "REQ-6.1"],
  "complete information": ["REQ-5.1"],
  "strong architecture": ["REQ-12.1"],
  "proven tools": ["REQ-11.1"],
  "reusable engineering knowledge": ["REQ-2.2"],
  "gated execution": ["REQ-26.1", "REQ-33.1"],
  "clear qa": ["REQ-26.1"],
  "fewer avoidable callbacks": ["REQ-18.1"],
  "skipping discovery": ["REQ-5.1"],
  "using the same visual design for every client": ["REQ-8.5.1"],
  "forcing every client into the same platform": ["REQ-11.8"],
  "ignoring mobile": ["REQ-26.2"],
  "ignoring accessibility": ["REQ-21.1"],
  "ignoring ownership/billing": ["REQ-13.1"],
  "shipping incomplete work": ["REQ-5.2", "REQ-17.1"],
  "cutting qa": ["REQ-26.1"],
  "leonix should be proud to put its name behind every delivered project": ["REQ-37.3"],
};
MANUAL["1"] = (b) => {
  const key = norm(b.text);
  for (const [k, ids] of Object.entries(SEC1_MAP)) {
    if (key.includes(norm(k)) || norm(k).includes(key)) {
      return { disposition: "DUPLICATE_RESTATEMENT", atomicReqIds: ids, reason: `§1 core-rule item restates the specific obligation already independently proven at ${ids.join("/")}` };
    }
  }
  return null;
};

// §35 IMPLEMENTATION ORDER: every Gate's sub-bullet is a real deliverable already independently
// proven elsewhere (Gate 10.10 safe_gate_8 audited all 45 items against real §-by-§ evidence, see
// doc). Each Gate header + its sub-bullets map to that Gate's own REQ-35.N row (roadmap
// cross-reference) AND to the specific already-proven atomic row that implements the deliverable.
const SEC35_MAP: Array<{ match: RegExp; gateReq: string; atomicReqIds: string[] }> = [
  { match: /project discovery/, gateReq: "REQ-35.1", atomicReqIds: ["REQ-3.3"] },
  { match: /project types/, gateReq: "REQ-35.1", atomicReqIds: ["REQ-7.1"] },
  { match: /structured answers/, gateReq: "REQ-35.1", atomicReqIds: ["REQ-8.1.1"] },
  { match: /preferences/, gateReq: "REQ-35.1", atomicReqIds: ["REQ-4.7"] },
  { match: /uploaded evidence.assets/, gateReq: "REQ-35.1", atomicReqIds: ["REQ-3.4"] },
  { match: /consent.reference model/, gateReq: "REQ-35.1", atomicReqIds: ["REQ-3.8"] },
  { match: /missing.information classification/, gateReq: "REQ-35.1", atomicReqIds: ["REQ-5.1"] },
  { match: /universal website information contract/, gateReq: "REQ-35.2", atomicReqIds: ["REQ-8.1.1"] },
  { match: /adaptive industry branches/, gateReq: "REQ-35.2", atomicReqIds: ["REQ-9.R.1"] },
  { match: /required.before.build.*optional.*n.a states/, gateReq: "REQ-35.2", atomicReqIds: ["REQ-5.1"] },
  { match: /progressive questions/, gateReq: "REQ-35.3", atomicReqIds: ["REQ-6.2"] },
  { match: /^notes$/, gateReq: "REQ-35.3", atomicReqIds: ["REQ-3.1"] },
  { match: /^dictation$/, gateReq: "REQ-35.3", atomicReqIds: ["REQ-3.2"] },
  { match: /optional recording consent/, gateReq: "REQ-35.3", atomicReqIds: ["REQ-3.7"] },
  { match: /^uploads$/, gateReq: "REQ-35.3", atomicReqIds: ["REQ-3.4"] },
  { match: /real.time missing information/, gateReq: "REQ-35.3", atomicReqIds: ["REQ-17.1"] },
  { match: /before you wrap up/, gateReq: "REQ-35.3", atomicReqIds: ["REQ-18.1"] },
  { match: /preferred platform registry/, gateReq: "REQ-35.4", atomicReqIds: ["REQ-11.1"] },
  { match: /platform conditions/, gateReq: "REQ-35.4", atomicReqIds: ["REQ-11.4"] },
  { match: /ownership.billing/, gateReq: "REQ-35.4", atomicReqIds: ["REQ-13.1"] },
  { match: /scope classifier/, gateReq: "REQ-35.4", atomicReqIds: ["REQ-10.1"] },
  { match: /architecture recommendation/, gateReq: "REQ-35.4", atomicReqIds: ["REQ-12.1"] },
  { match: /structured project packet/, gateReq: "REQ-35.5", atomicReqIds: ["REQ-25.1"] },
  { match: /generated md/, gateReq: "REQ-35.5", atomicReqIds: ["REQ-24.1"] },
  { match: /^versioning$/, gateReq: "REQ-35.5", atomicReqIds: ["REQ-25.1"] },
  { match: /^review$/, gateReq: "REQ-35.5", atomicReqIds: ["REQ-27.1"] },
  { match: /source references/, gateReq: "REQ-35.5", atomicReqIds: ["REQ-25.4"] },
  { match: /unresolved items/, gateReq: "REQ-35.5", atomicReqIds: ["REQ-25.7"] },
  { match: /website project/, gateReq: "REQ-35.6", atomicReqIds: ["REQ-7.1"] },
  { match: /logo project/, gateReq: "REQ-35.6", atomicReqIds: ["REQ-7.3"] },
  { match: /print.promo project/, gateReq: "REQ-35.6", atomicReqIds: ["REQ-7.4"] },
  { match: /^campaign$/, gateReq: "REQ-35.6", atomicReqIds: ["REQ-7.8"] },
  { match: /dependencies/, gateReq: "REQ-35.6", atomicReqIds: ["REQ-19.2"] },
  { match: /assignments/, gateReq: "REQ-35.6", atomicReqIds: ["REQ-19.3"] },
  { match: /promise keeper/, gateReq: "REQ-35.6", atomicReqIds: ["REQ-37.4"] },
  { match: /project.specific qa/, gateReq: "REQ-35.7", atomicReqIds: ["REQ-26.1"] },
  { match: /client.safe approval/, gateReq: "REQ-35.7", atomicReqIds: ["REQ-27.1"] },
  { match: /^launch$/, gateReq: "REQ-35.7", atomicReqIds: ["REQ-32.12"] },
  { match: /account ownership/, gateReq: "REQ-35.7", atomicReqIds: ["REQ-13.1"] },
  { match: /renewal.support record/, gateReq: "REQ-35.7", atomicReqIds: ["REQ-8.25.1"] },
  { match: /simple local service website/, gateReq: "REQ-35.8", atomicReqIds: ["REQ-33.1"] },
  { match: /la kaliente/, gateReq: "REQ-35.8", atomicReqIds: ["REQ-33.1"] },
  { match: /^restaurant$/, gateReq: "REQ-35.8", atomicReqIds: ["REQ-9.R.1"] },
  { match: /startup needing logo/, gateReq: "REQ-35.8", atomicReqIds: ["REQ-19.1"] },
  { match: /custom platform scope escalation/, gateReq: "REQ-35.8", atomicReqIds: ["REQ-10.3"] },
];
MANUAL["35"] = (b) => {
  const key = norm(b.text);
  for (const { match, gateReq, atomicReqIds } of SEC35_MAP) {
    if (match.test(key)) {
      return {
        disposition: "DUPLICATE_RESTATEMENT",
        atomicReqIds: [gateReq, ...atomicReqIds],
        reason: `§35 roadmap deliverable restates work already independently proven at ${atomicReqIds.join("/")}; cross-referenced (not re-proven) as part of the ${gateReq} implementation-order checkpoint`,
      };
    }
  }
  return null;
};

// §37: 11-step restatement -> REQ-37.1 (itself a restatement of REQ-0.1's already-proven per-stage
// mechanisms); the trailing slogan is decorative.
MANUAL["37"] = (b) => {
  const t = norm(b.text);
  if (t.includes("que ruja el leon")) {
    return { disposition: "NON_BEHAVIORAL_DECORATIVE", atomicReqIds: [], reason: "Spanish motivational rallying cry / brand slogan closing the document -- no executable or business obligation; not a restatement of any technical requirement (Leonix-brand-quality itself is independently covered by REQ-37.3)." };
  }
  if (t.includes("11 step") && t.includes("progression")) {
    return { disposition: "ATOMIC_REQUIREMENT", atomicReqIds: ["REQ-37.1"], reason: "This IS REQ-37.1's own source sentence -- the manual-supplement note explaining why the 11-step restatement is a distinct client-experience-facing requirement from REQ-0.1's 13-stage flow, not a duplicate of it." };
  }
  if (t.includes("both leonix and the client must win")) {
    return { disposition: "ATOMIC_REQUIREMENT", atomicReqIds: ["REQ-37.4"], reason: "This IS REQ-37.4's own source sentence (added Gate 10.9)." };
  }
  return null;
};

// §3 CLIENT DISCOVERY SESSION -- the 7 consent-preserve fields (§3.1) and 2 remaining upload-type
// bullets consolidate into REQ-3.4 (uploads) / REQ-3.8 (consent fields) / REQ-3.9 (no-recording path).
const SEC3_MAP: Array<{ match: RegExp; atomicReqIds: string[] }> = [
  { match: /upload brand assets|upload inspiration references/, atomicReqIds: ["REQ-3.4"] },
  { match: /optionally record.transcribe the conversation/, atomicReqIds: ["REQ-3.7"] },
  { match: /^operator$/, atomicReqIds: ["REQ-3.8"] },
  { match: /client.participant context/, atomicReqIds: ["REQ-3.8"] },
  { match: /recording reference if retained/, atomicReqIds: ["REQ-3.8"] },
  { match: /transcript reference if retained/, atomicReqIds: ["REQ-3.8"] },
  { match: /retention.deletion behavior according to leonix policy/, atomicReqIds: ["REQ-3.8"] },
];
MANUAL["3"] = (b) => {
  const key = norm(b.text);
  for (const { match, atomicReqIds } of SEC3_MAP) {
    if (match.test(key)) {
      return { disposition: "EXAMPLE_OR_OPTION", atomicReqIds, reason: `§3 upload-type/consent-field item is one member of the enumeration governed by ${atomicReqIds.join("/")}` };
    }
  }
  return null;
};

// §6 ADAPTIVE QUESTION ENGINE -- all 14 "choose questions from" dimensions are named together inside
// REQ-6.1's own combined text (option-list consolidation, established Gate 10.9).
MANUAL["6"] = (b) => {
  const key = norm(b.text);
  if (key.includes("questions already answered by canonical truth")) {
    return { disposition: "ATOMIC_REQUIREMENT", atomicReqIds: ["REQ-6.3"], reason: "This IS REQ-6.3's own source sentence." };
  }
  const dims = ["project type", "industry", "business stage", "existing business truth", "missing information", "client goals", "existing systems", "uploaded assets", "current website", "client preferences", "deadlines", "budget", "ownership", "compliance context"];
  if (dims.some((d) => key.includes(norm(d)) || norm(d).includes(key))) {
    return { disposition: "EXAMPLE_OR_OPTION", atomicReqIds: ["REQ-6.1"], reason: "One of the 14 question-selection dimensions named together inside REQ-6.1's own combined requirement text." };
  }
  return null;
};

// §8.7 Content -- "calls to action" is one more content-inventory item folded into the same governing
// row family as "policies"/"disclaimers" (already resolved to REQ-8.7.x by the fuzzy matcher).
MANUAL["8"] = (b) => {
  const key = norm(b.text);
  if (b.subsection?.startsWith("8.7") && key.includes("calls to action")) {
    return { disposition: "EXAMPLE_OR_OPTION", atomicReqIds: ["REQ-8.7.17"], reason: "§8.7 Content-inventory item; grouped with the other content-type bullets under §8.7's field family." };
  }
  // §8.17 Payments/commerce: raw has 10 items, manifest ALSO has 10 rows (REQ-8.17.6 merges raw's
  // "tax/shipping?"+"inventory?" into one row, then a synthesized guard row REQ-8.17.10 is appended) --
  // an equal-count coincidence that the generic order-pairing heuristic would silently mis-pair from
  // "inventory?" onward (found by this gate's own post-build coverage cross-check). Mapped explicitly.
  if (b.subsection?.startsWith("8.17")) {
    if (key === "payment required") return { disposition: "ATOMIC_REQUIREMENT", atomicReqIds: ["REQ-8.17.1"], reason: "Direct match." };
    if (key.includes("informational link")) return { disposition: "ATOMIC_REQUIREMENT", atomicReqIds: ["REQ-8.17.2"], reason: "Direct match." };
    if (key === "products services") return { disposition: "ATOMIC_REQUIREMENT", atomicReqIds: ["REQ-8.17.3"], reason: "Direct match." };
    if (key === "deposits") return { disposition: "ATOMIC_REQUIREMENT", atomicReqIds: ["REQ-8.17.4"], reason: "Direct match." };
    if (key === "subscriptions") return { disposition: "ATOMIC_REQUIREMENT", atomicReqIds: ["REQ-8.17.5"], reason: "Direct match." };
    if (key === "tax shipping" || key === "inventory") return { disposition: "SYNTHESIZED_WITH_SIBLING", atomicReqIds: ["REQ-8.17.6"], reason: "Paired with its sibling ('tax/shipping?' + 'inventory?') into the combined row REQ-8.17.6 ('tax/shipping/inventory?')." };
    if (key === "refunds") return { disposition: "ATOMIC_REQUIREMENT", atomicReqIds: ["REQ-8.17.7"], reason: "Direct match (corrected -- a naive order-pairing had mis-shifted this to REQ-8.17.8)." };
    if (key === "owner provider") return { disposition: "ATOMIC_REQUIREMENT", atomicReqIds: ["REQ-8.17.8"], reason: "Direct match (corrected -- a naive order-pairing had mis-shifted this to REQ-8.17.9)." };
    if (key === "compliance") return { disposition: "ATOMIC_REQUIREMENT", atomicReqIds: ["REQ-8.17.9"], reason: "Direct match (corrected -- a naive order-pairing had mis-shifted this to REQ-8.17.10)." };
  }
  // §8.15 Backend/database/auth has the SAME equal-count-coincidence shape as §8.17: raw's "storage?"
  // + "API integrations?" merge into one manifest row (REQ-8.15.13), then a synthesized guard row
  // (REQ-8.15.14) is appended to restore the same total count -- naive order-pairing would mis-shift
  // "API integrations?" onto the unrelated guard row.
  if (b.subsection?.startsWith("8.15") && key === "api integrations") {
    return { disposition: "SYNTHESIZED_WITH_SIBLING", atomicReqIds: ["REQ-8.15.13"], reason: "Paired with its sibling ('storage?') into the combined row REQ-8.15.13 ('storage? / API integrations?') -- corrected from a naive order-pairing that had mis-shifted this to REQ-8.15.14." };
  }
  if (b.subsection?.startsWith("8.14") && key.includes("do not add a cms")) {
    return { disposition: "ATOMIC_REQUIREMENT", atomicReqIds: ["REQ-8.14.7"], reason: "This IS REQ-8.14.7's own source sentence." };
  }
  if (b.subsection?.startsWith("8.19") && key.includes("no guaranteed ranking claims")) {
    return { disposition: "ATOMIC_REQUIREMENT", atomicReqIds: ["REQ-8.19.13"], reason: "This IS REQ-8.19.13's own source sentence." };
  }
  return null;
};

// §10 WEBSITE SCOPE CLASSIFIER -- every "Typical:" illustrative example under RAPID/BUSINESS/CUSTOM
// is descriptive text carried inside its own classification row (REQ-10.1/10.2/10.3), not a separate
// per-example requirement (established Gate 10.9).
const SEC10_RAPID = ["marketing/landing site", "simple pages/sections", "^forms$", "social/external links", "no complex auth", "no native transactional application"];
const SEC10_BUSINESS = ["richer multi-page site", "^cms$", "events/programming/menu/team", "booking integrations", "moderate content operations", "stronger seo requirements"];
const SEC10_CUSTOM = ["user accounts", "private dashboards", "complex database", "workflow state", "native marketplace", "complex checkout", "significant integrations", "member/customer records", "application state", "custom operational software"];
MANUAL["10"] = (b) => {
  const key = norm(b.text);
  if (SEC10_RAPID.some((p) => new RegExp(norm(p)).test(key))) return { disposition: "CHILD_OF_ATOMIC_REQUIREMENT", atomicReqIds: ["REQ-10.1"], reason: "Illustrative 'Typical:' example carried as descriptive text inside REQ-10.1 (RAPID BUSINESS SITE), not its own testable classification." };
  if (SEC10_BUSINESS.some((p) => new RegExp(norm(p)).test(key))) return { disposition: "CHILD_OF_ATOMIC_REQUIREMENT", atomicReqIds: ["REQ-10.2"], reason: "Illustrative 'Typical:' example carried as descriptive text inside REQ-10.2 (BUSINESS SITE), not its own testable classification." };
  if (SEC10_CUSTOM.some((p) => new RegExp(norm(p)).test(key))) return { disposition: "CHILD_OF_ATOMIC_REQUIREMENT", atomicReqIds: ["REQ-10.3"], reason: "Illustrative 'Typical:' example carried as descriptive text inside REQ-10.3 (CUSTOM PLATFORM), not its own testable classification." };
  return null;
};

// §11 PREFERRED PLATFORM REGISTRY -- FRONTEND/HOSTING/CMS/FORMS state headers map to their own
// REQ-11.x row; BUILD/ENGINEERING's internal-tooling sub-list is cross-referenced under §8.13/§24/§26
// rather than re-counted as its own client-facing platform row (established Gate 10.9).
MANUAL["11"] = (b) => {
  const key = norm(b.text);
  if (key === "state frontend") return { disposition: "ATOMIC_REQUIREMENT", atomicReqIds: ["REQ-11.2"], reason: "Direct platform-registry entry." };
  if (key.includes("hosting") && key.includes("deployment")) return { disposition: "ATOMIC_REQUIREMENT", atomicReqIds: ["REQ-11.3"], reason: "Direct platform-registry entry." };
  if (key === "state cms") return { disposition: "ATOMIC_REQUIREMENT", atomicReqIds: ["REQ-11.4"], reason: "Direct platform-registry entry." };
  if (key.includes("forms") && key.includes("transactional email")) return { disposition: "ATOMIC_REQUIREMENT", atomicReqIds: ["REQ-11.5"], reason: "Direct platform-registry entry." };
  if (key.includes("state build") && key.includes("engineering")) return { disposition: "DUPLICATE_RESTATEMENT", atomicReqIds: ["REQ-8.13.5", "REQ-8.13.7"], reason: "BUILD/ENGINEERING is Leonix-internal process tooling, not a client-facing platform decision -- cross-referenced as supporting evidence under REQ-8.13.5 (Vercel Preview)/REQ-8.13.7 (GitHub+Vercel rollback), not re-counted as its own §11 row (confirmed against the ledger's own existing citation text in Gate 10.9)." };
  if (key.includes("github")) return { disposition: "DUPLICATE_RESTATEMENT", atomicReqIds: ["REQ-8.13.7"], reason: "GitHub is explicitly named in REQ-8.13.7's own evidence text (\"GitHub + Vercel workflow named in §11\")." };
  if (key.includes("claude") && key.includes("cursor")) return { disposition: "NON_BEHAVIORAL_DECORATIVE", atomicReqIds: [], reason: "Internal Leonix engineering-tool choice (which AI coding assistant staff use) -- not a client-facing, independently testable business obligation." };
  if (key.includes("gated leonix project md")) return { disposition: "DUPLICATE_RESTATEMENT", atomicReqIds: ["REQ-24.1"], reason: "The 'gated Leonix project MD' IS the approved/versioned blueprint that REQ-24.1 (Build Handoff) already proves is the builder's primary specification." };
  if (key.includes("owner qa")) return { disposition: "DUPLICATE_RESTATEMENT", atomicReqIds: ["REQ-26.1"], reason: "Owner QA is the internal-review face of the same mandatory QA matrix already proven at REQ-26.1." };
  return null;
};

// §34 ACCEPTANCE TEST -- MULTI-SOLUTION CLIENT has TWO distinct real parts: the "Client needs" input
// list (logo/website/business cards/launch campaign, naming which already-proven §7 project types
// combine in this scenario) and the "Expected:" arrow-chain outcome (the actual behavior REQ-34.1-4
// prove). Gate 10.10 found a prior equal-count heuristic had wrongly paired the FIRST list against the
// SECOND list's rows (4 raw "Client needs" items happened to equal 4 manifest rows describing a
// completely different, unrelated chain) -- fixed by routing each list to its real governing target.
const SEC34_NEEDS: Record<string, string[]> = { logo: ["REQ-7.3", "REQ-19.1"], website: ["REQ-7.1", "REQ-19.1"], "business cards": ["REQ-7.4", "REQ-19.1"], "launch campaign": ["REQ-7.8", "REQ-19.1"] };
const SEC34_EXPECTED: Array<{ match: RegExp; atomicReqIds: string[] }> = [
  { match: /one discovery session|shared business truth/, atomicReqIds: ["REQ-34.1"] },
  { match: /four linked project requirements|specialized missing.information checks/, atomicReqIds: ["REQ-34.2"] },
  { match: /separate project blueprints|shared confirmed assets.facts/, atomicReqIds: ["REQ-34.3"] },
];
MANUAL["34"] = (b) => {
  const key = norm(b.text);
  for (const [k, ids] of Object.entries(SEC34_NEEDS)) {
    if (key.includes(norm(k))) {
      return { disposition: "EXAMPLE_OR_OPTION", atomicReqIds: ids, reason: `§34's "Client needs" scenario input names an already-proven §7 project type, combined here as one multi-solution test case (§19 multi-project mechanism); this is NOT the source for REQ-34.1-4 (those prove the separate "Expected:" outcome chain below).` };
    }
  }
  if (/clear dependencies/.test(key)) {
    return { disposition: "ATOMIC_REQUIREMENT", atomicReqIds: ["REQ-34.4"], reason: `This IS REQ-34.4's own source sentence -- the final, standalone segment of §34's "Expected:" chain (not paired with a sibling, unlike REQ-34.1-3).` };
  }
  for (const { match, atomicReqIds } of SEC34_EXPECTED) {
    if (match.test(key)) {
      return { disposition: "SYNTHESIZED_WITH_SIBLING", atomicReqIds, reason: `§34's "Expected:" arrow-chain segment, paired with its adjacent chain segment into the combined row ${atomicReqIds.join("/")}.` };
    }
  }
  return null;
};

// -------------------------------------------------------------------------------------------
// MAIN PASS
// -------------------------------------------------------------------------------------------
for (let i = 0; i < bullets.length; i++) {
  const b = bullets[i];
  if (resolvedRawIds.has(i)) continue;

  // 1. Manual override sections
  const manualFn = MANUAL[String(b.section)];
  if (manualFn) {
    const r = manualFn(b);
    if (r) { push(b, r.disposition, r.atomicReqIds, r.reason); resolvedRawIds.add(i); continue; }
  }

  // 2. Group-based resolution
  const sn = subsectionNum(b.subsection);
  const groupKey = sn ?? `${b.section}`;
  const rawGroup = rawGroups.get(groupKey) ?? [b];
  const manGroup = (sn ? manGroupsBySub.get(sn) : manGroupsBySection.get(b.section)) ?? [];

  if (manGroup.length === 0) {
    // No manifest rows target this exact subsection group at all (e.g. §1 handled above; a stray
    // group would land here) -- fall through to fuzzy match against the WHOLE section's manifest rows.
    const sectionRows = manGroupsBySection.get(b.section) ?? [];
    const hit = bestFuzzyMatch(b.text, sectionRows);
    if (hit) {
      push(b, "CHILD_OF_ATOMIC_REQUIREMENT", [hit.row.reqId], `Best-scoring fuzzy content match (${Math.round(hit.score * 100)}% token overlap) against ${hit.row.reqId} (no dedicated subsection-level manifest group existed for "${b.subsection}")`);
    } else {
      push(b, "UNRESOLVED", [], `No manifest row (subsection or whole-section fuzzy match) found for this raw item -- requires manual disposition.`);
    }
    continue;
  }

  if (rawGroup.length === manGroup.length) {
    // Exact-count group: pair by order.
    const idx = rawGroup.indexOf(b);
    const target = manGroup[idx];
    push(b, "ATOMIC_REQUIREMENT", [target.reqId], `1:1 order-paired within (§${b.section} subsection "${b.subsection}") -- raw count equals manifest count for this group.`);
  } else if (manGroup.length === 1) {
    // Single governing row consolidation.
    push(b, "EXAMPLE_OR_OPTION", [manGroup[0].reqId], `Single governing manifest row for this subsection's flat option-list/typical-example enumeration.`);
  } else {
    // Partial consolidation: fuzzy-match against the candidate rows in this group only.
    const hit = bestFuzzyMatch(b.text, manGroup);
    if (hit) {
      push(b, "CHILD_OF_ATOMIC_REQUIREMENT", [hit.row.reqId], `Best-scoring fuzzy content match (${Math.round(hit.score * 100)}% token overlap) within partially-consolidated group §${b.section}.${sn} (raw=${rawGroup.length}, manifest=${manGroup.length}).`);
    } else {
      push(b, "UNRESOLVED", [], `Partially-consolidated group §${b.section}.${sn} (raw=${rawGroup.length}, manifest=${manGroup.length}) -- no fuzzy match found; requires manual disposition.`);
    }
  }
}

// -------------------------------------------------------------------------------------------
// GUARD-ROW BACKFILL: some manifest rows are pure synthesized completeness/consequence guards with
// no single direct raw sentence of their own (e.g. REQ-4.10 "these 9 types never silently collapsed",
// REQ-29.12 "require review before promising timeline/price"). Per safe_gate_3, a synthesized row
// without a direct raw sentence must still identify the exact raw items whose COMBINED semantics
// require it -- so every raw item in the enumeration it guards gets that reqId appended (alongside its
// own primary target, disposition unchanged) rather than leaving the guard row with zero raw source.
// -------------------------------------------------------------------------------------------
const GUARD_BACKFILL: Array<{ prefix: string; guardReqId: string }> = [
  { prefix: "§4", guardReqId: "REQ-4.10" },
  { prefix: "§29", guardReqId: "REQ-29.12" },
  { prefix: "§8.15", guardReqId: "REQ-8.15.14" },
  { prefix: "§8.17", guardReqId: "REQ-8.17.10" },
  { prefix: "§8.24", guardReqId: "REQ-8.24.7" },
];
for (const r of out) {
  for (const { prefix, guardReqId } of GUARD_BACKFILL) {
    const matchesSection = prefix.includes(".") ? r.subsection?.startsWith(prefix.slice(1)) : r.section === prefix;
    if (matchesSection && r.atomicReqIds.length > 0 && !r.atomicReqIds.includes(guardReqId)) {
      r.atomicReqIds.push(guardReqId);
    }
  }
}
// §8.10 "Secondary CTAs" (REQ-8.10.6) has no direct MD sentence of its own within §8.10 -- its real
// canonical basis is §8.2's "secondary visitor actions" field (the discovery-contract implementation
// of the same concept one section earlier), so that specific raw item additionally cites it.
for (const r of out) {
  if (r.section === "§8" && norm(r.rawText).includes("secondary visitor actions")) {
    if (!r.atomicReqIds.includes("REQ-8.10.6")) r.atomicReqIds.push("REQ-8.10.6");
  }
}

// Attach siblingRawIds for every row that shares an atomicReqId with at least one other row (required
// explicitly for SYNTHESIZED_WITH_SIBLING by safe_gate_1, and useful context for every other grouped
// disposition too).
const rawIdsByAtomicReq = new Map<string, string[]>();
for (const r of out) for (const id of r.atomicReqIds) rawIdsByAtomicReq.set(id, [...(rawIdsByAtomicReq.get(id) ?? []), r.rawId]);
const finalOut = out.map((r) => ({
  ...r,
  siblingRawIds: r.atomicReqIds.length
    ? [...new Set(r.atomicReqIds.flatMap((id) => rawIdsByAtomicReq.get(id) ?? []))].filter((id) => id !== r.rawId)
    : [],
}));

writeFileSync(join(ROOT, "docs", "business-concierge", "BUSINESS_CONCIERGE_RAW_TO_ATOMIC_NORMALIZATION.json"), JSON.stringify(finalOut, null, 2), "utf8");

const byDisposition = new Map<string, number>();
for (const r of out) byDisposition.set(r.disposition, (byDisposition.get(r.disposition) ?? 0) + 1);
console.log(`Total raw items processed: ${out.length}`);
for (const [d, c] of [...byDisposition.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${d}: ${c}`);
console.log(`\nUNRESOLVED items (need manual disposition):`);
for (const r of out.filter((r) => r.disposition === "UNRESOLVED")) console.log(`  ${r.rawId} §${r.section} "${r.rawText.slice(0, 70)}" -- ${r.reason}`);
