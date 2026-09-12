/**
 * Gate SERVICIOS-3 verifier — source readiness before owner runtime certification.
 *
 * The centrepiece is behavioral: the open-now defect (D-1) is proven closed by evaluating the SAME
 * hours against two different zones at a wall-clock instant where they genuinely disagree, and by
 * proving the badge and the filter return the same answer because they are the same function.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-gate3-source-readiness.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  resolveServiciosBusinessTimeZone,
  serviciosZonedNow,
} from "../app/(site)/servicios/lib/serviciosBusinessTimeZone";
import {
  buildServiciosHeroHoursPill,
  formatHoursLineDisplay12h,
  serviciosHoursSummaryIsOpenNow,
} from "../app/(site)/servicios/components/serviciosHeroHoursStatus";

const ROOT = join(__dirname, "..");
let passed = 0;
const failures: string[] = [];

function assert(cond: unknown, label: string): void {
  if (cond) {
    passed += 1;
    return;
  }
  failures.push(label);
}

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

const HOURS = "app/(site)/servicios/components/serviciosHeroHoursStatus.ts";
const TZ = "app/(site)/servicios/lib/serviciosBusinessTimeZone.ts";
const FILTER = "app/(site)/clasificados/servicios/lib/serviciosResultsFilter.ts";
const HERO = "app/(site)/servicios/components/ServiciosHero.tsx";
const HOURS_UI = "app/(site)/servicios/components/ServiciosHours.tsx";
const PROFILE = "app/(site)/servicios/lib/resolveServiciosProfile.ts";
const OPS = "app/admin/_lib/serviciosCommercialOps.ts";
const ADMIN_PAGE = "app/admin/(dashboard)/workspace/clasificados/servicios/page.tsx";
const ADMIN_CARD = "app/admin/(dashboard)/workspace/clasificados/servicios/_components/ServiciosAdminOpsListingCard.tsx";
const SWEEP = "app/api/revenue-os/admin/subscription-sweep/route.ts";

/* ════════════ 1. D-1 — TIMEZONE RESOLUTION ══════════════════════════════════════════════ */

assert(
  resolveServiciosBusinessTimeZone({ physicalRegion: "CA", physicalCountry: "United States" }) === "America/Los_Angeles",
  "a Bay Area listing resolves Pacific",
);
assert(
  resolveServiciosBusinessTimeZone({ physicalRegion: "California", physicalCountry: "" }) === "America/Los_Angeles",
  "a full state name resolves, and a blank country is treated as US",
);
assert(
  resolveServiciosBusinessTimeZone({ physicalRegion: "ca", physicalCountry: "USA" }) === "America/Los_Angeles",
  "case-insensitive",
);
assert(resolveServiciosBusinessTimeZone({ physicalRegion: "NY", physicalCountry: "US" }) === "America/New_York", "NY resolves Eastern");
assert(resolveServiciosBusinessTimeZone({ physicalRegion: "AZ", physicalCountry: "US" }) === "America/Phoenix", "AZ resolves a no-DST zone");
assert(resolveServiciosBusinessTimeZone({ physicalRegion: "HI", physicalCountry: "US" }) === "Pacific/Honolulu", "HI resolves a no-DST zone");
// Honest failure — never a guess.
assert(resolveServiciosBusinessTimeZone({ physicalRegion: "CA", physicalCountry: "Mexico" }) === null, "a non-US country is UNKNOWN, not guessed");
assert(resolveServiciosBusinessTimeZone({ physicalCountry: "US" }) === null, "no state means UNKNOWN");
assert(resolveServiciosBusinessTimeZone({ physicalRegion: "ZZ", physicalCountry: "US" }) === null, "an unknown state code means UNKNOWN");
assert(resolveServiciosBusinessTimeZone(null) === null, "a missing location means UNKNOWN");

/* ════════════ 2. D-1 — THE CLOCK IS READ IN THE BUSINESS ZONE ═══════════════════════════ */
{
  // 2026-09-10T23:00Z is 16:00 in Los Angeles (PDT) — the two zones DISAGREE about 9–5.
  const at = new Date("2026-09-10T23:00:00Z");
  const la = serviciosZonedNow("America/Los_Angeles", at);
  assert(la?.minutesFromMidnight === 16 * 60, "Intl reads 16:00 local in Los Angeles");
  assert(la?.jsDay === 4, "and the local weekday (Thursday)");
  const utc = serviciosZonedNow("UTC", at);
  assert(utc?.minutesFromMidnight === 23 * 60, "UTC reads 23:00 — genuinely different");
  assert(serviciosZonedNow(null, at) === null, "no zone yields null, never a default");
  assert(serviciosZonedNow("Not/AZone", at) === null, "an invalid IANA id yields null, never a throw");
  assert(serviciosZonedNow("", at) === null, "an empty zone yields null");
}

/* ════════════ 3. D-1 — THE DEFECT ITSELF, PROVEN CLOSED ═════════════════════════════════ */
{
  const at = new Date("2026-09-10T23:00:00Z");
  const hours = {
    openNowLabel: "Hoy",
    todayHoursLine: "9:00 AM - 5:00 PM",
    weeklyRows: [{ dayLabel: "Jueves", line: "9:00 AM - 5:00 PM" }],
  };

  // THE regression: the business is open at 16:00 Pacific; the old host-clock behavior (UTC on
  // Vercel) said closed.
  assert(
    serviciosHoursSummaryIsOpenNow(hours, "es", { timeZone: "America/Los_Angeles", at }) === true,
    "a Pacific business open 9–5 reads OPEN at 16:00 local",
  );
  assert(
    serviciosHoursSummaryIsOpenNow(hours, "es", { timeZone: "UTC", at }) === false,
    "the same instant judged in UTC reads CLOSED — the two genuinely differ, so this test discriminates",
  );

  // Honest failure: no zone => no claim, in BOTH directions.
  assert(
    serviciosHoursSummaryIsOpenNow(hours, "es", { timeZone: null, at }) === false,
    "with no resolvable zone the open_now filter fails CLOSED",
  );
  const noTzPill = buildServiciosHeroHoursPill(hours, "es", { timeZone: null, at });
  assert(noTzPill?.variant === "neutral", "and the badge states the hours WITHOUT claiming open or closed");
  assert(!/Abierto ahora|Open now|Cerrado|Closed/.test(noTzPill?.text ?? ""), "the neutral text makes no status claim");
  assert((noTzPill?.text ?? "").includes("9:00 AM"), "but it still tells the owner the real hours");

  // ES/EN presentation unchanged apart from correctness.
  const es = buildServiciosHeroHoursPill(hours, "es", { timeZone: "America/Los_Angeles", at });
  const en = buildServiciosHeroHoursPill(hours, "en", { timeZone: "America/Los_Angeles", at });
  assert(es?.text.startsWith("Abierto ahora · "), "ES copy unchanged");
  assert(en?.text.startsWith("Open now · "), "EN copy unchanged");
  assert(es?.variant === "open" && en?.variant === "open", "both languages agree on the variant");

  // Closed-before-open and closed-after-close still work, in business time.
  const early = new Date("2026-09-10T14:00:00Z"); // 07:00 PDT — before opening
  const earlyPill = buildServiciosHeroHoursPill(hours, "es", { timeZone: "America/Los_Angeles", at: early });
  assert(earlyPill?.variant === "closed", "before opening reads closed");
  assert((earlyPill?.text ?? "").includes("abre hoy"), "and says it opens today");
  const late = new Date("2026-09-11T04:00:00Z"); // 21:00 PDT Thursday — after closing
  const latePill = buildServiciosHeroHoursPill(hours, "es", { timeZone: "America/Los_Angeles", at: late });
  assert(latePill?.variant === "closed", "after closing reads closed");
}

/* ════════════ 4. D-1 — BADGE AND FILTER ARE THE SAME RULE ═══════════════════════════════ */
{
  const at = new Date("2026-09-10T23:00:00Z");
  const hours = { openNowLabel: "Hoy", todayHoursLine: "9:00 AM - 5:00 PM", weeklyRows: [] };
  for (const zone of ["America/Los_Angeles", "America/New_York", "UTC", null]) {
    const pill = buildServiciosHeroHoursPill(hours, "es", { timeZone: zone, at });
    const filter = serviciosHoursSummaryIsOpenNow(hours, "es", { timeZone: zone, at });
    assert(filter === (pill?.variant === "open"), `badge and filter agree for zone ${String(zone)}`);
  }
  // Structural: the predicate delegates rather than re-deriving.
  const src = stripComments(read(HOURS));
  assert(src.includes("const pill = buildServiciosHeroHoursPill(hours, lang, ctx);"), "the filter predicate delegates to the badge builder");
  assert(!/getHours\(\)/.test(src), "no host-clock read survives in the hours engine");
  assert(!/new Date\(from\./.test(src), "no host date arithmetic survives");
  assert(src.includes("serviciosZonedNow("), "the engine reads the clock through the shared zone reader");
}

/* ════════════ 5. D-1 — ONE RESOLUTION POINT, CONSUMED EVERYWHERE ════════════════════════ */
{
  const profile = stripComments(read(PROFILE));
  assert(profile.includes("resolveServiciosBusinessTimeZone({"), "the timezone is resolved in resolveServiciosProfile");
  assert(profile.includes("businessTimeZone: businessTimeZone ?? undefined,"), "and carried on the resolved contact");

  for (const [rel, label] of [
    [FILTER, "results open_now filter"],
    [HERO, "public hero badge"],
    [HOURS_UI, "public hours badge"],
  ] as const) {
    const src = stripComments(read(rel));
    assert(src.includes("businessTimeZone"), `${label} consumes the resolved business timezone`);
    assert(!src.includes("resolveServiciosBusinessTimeZone("), `${label} does not re-resolve it (one resolution point)`);
  }
  // The stored publish-time label can no longer be re-interpreted into a status colour.
  const hoursUi = stripComments(read(HOURS_UI));
  assert(!hoursUi.includes('openNowLabel ?? "").toLowerCase().includes("cerrado")'), "the stale-label colour heuristic is gone");
}

/* ════════════ 6. Pre-existing display bug that this gate's change would have amplified ═══ */
assert(formatHoursLineDisplay12h("9:00 AM - 5:00 PM") === "9:00 AM - 5:00 PM", "an already-12h line is left alone (was '9:00 AM AM')");
assert(formatHoursLineDisplay12h("09:00 - 17:00") === "9:00 AM - 5:00 PM", "a 24h line is still converted");
assert(formatHoursLineDisplay12h("8:30 - 20:00") === "8:30 AM - 8:00 PM", "and so is a mixed one");

/* ════════════ 7. D-4 — ADMIN COMMERCIAL TRUTH, READ-ONLY ════════════════════════════════ */
{
  const src = stripComments(read(OPS));
  // Never writes.
  for (const w of [".update(", ".insert(", ".upsert(", ".delete("]) {
    assert(!src.includes(w), `the Admin commercial projection never calls ${w}`);
  }
  // Canonical sources, not re-derivation.
  assert(src.includes("fetchAddonEntitlementsForListings("), "entitlement comes from the canonical shared reader");
  assert(src.includes('.from("leonix_subscription_records")'), "subscription comes from the canonical table");
  assert(src.includes('.eq("listing_source", SERVICIOS_BASE_CHECKOUT.category)'), "keyed by the real Servicios listing_source");
  assert(src.includes("SERVICIOS_BASE_CHECKOUT.packageKey"), "and the real base package key — not a literal");
  // Truth semantics.
  for (const t of ["REAL", "PARTIAL", "NEEDS_PROOF", "UNAVAILABLE"]) {
    assert(src.includes(`"${t}"`), `the Admin OS §6 truth state ${t} is used`);
  }
  assert(!src.includes("|| 0"), "no unreadable value is collapsed into zero");
  // Payment is never inferred from listing status.
  assert(
    !/listing_status[\s\S]{0,120}(paid|unpaid)/i.test(src),
    "payment is never derived from listing status",
  );
  assert(
    src.includes("This is not a claim that the listing is unpaid."),
    "an absent record is explicitly NOT reported as unpaid",
  );

  const card = stripComments(read(ADMIN_CARD));
  assert(card.includes("ServiciosOpsTruthRow"), "the card renders truth states, not bare values");
  assert(card.includes('const showValue = truth === "REAL"'), "a value is printed only when the truth state is REAL");
  assert(card.includes("commercial?: ServiciosCommercialOpsRow;"), "the commercial projection is optional and honest when absent");

  const page = stripComments(read(ADMIN_PAGE));
  assert(page.includes("loadServiciosCommercialOps(rows.map((r) => r.id))"), "the projection is bounded to the rows on this page");
  assert(page.includes("commercial={commercialOps.get(r.id)}"), "and threaded into the existing card — no second Admin surface");
}

/* ════════════ 8. D-3 — the sandbox is ALREADY safely scoped (audit finding corrected) ════ */
{
  const sandbox = read("app/admin/(dashboard)/workspace/clasificados/servicios/sandbox/page.tsx");
  assert(sandbox.includes("Local sandbox (localStorage)"), "the sandbox page labels itself a local sandbox");
  assert(sandbox.includes("not part of the public Servicios flow"), "and states it is not part of the public flow");
  assert(sandbox.includes("servicios_public_listings"), "and names the canonical table it does NOT write");
  const client = read("app/admin/(dashboard)/workspace/clasificados/servicios/ServiciosAdminClient.tsx");
  assert(client.includes("adminLocalSimBadgeClass"), "the simulator renders a Local simulation badge");
  assert(client.includes("leonix_admin_servicios_listings_v2"), "and genuinely persists to localStorage only");
  assert(!client.includes("servicios_public_listings"), "it never touches the canonical table");
  assert(read("app/admin/layout.tsx").includes("robots: { index: false, follow: false }"), "the whole admin tree is noindex");
  const canonical = read(ADMIN_PAGE);
  assert(canonical.includes("Tier sandbox (localStorage)"), "the canonical queue labels the link to it");
  // It was already correct — this gate changed nothing about it.
  assert(!client.includes("SERVICIOS-3"), "the sandbox was NOT modified by this gate");
}

/* ════════════ 9. D-2 — the sweep is sound; only scheduling is missing ═══════════════════ */
{
  const src = stripComments(read(SWEEP));
  assert(src.includes("machineKeyAuthorized(request)"), "the sweep authorizes a machine key");
  assert(src.includes("timingSafeEqual("), "compared in constant time");
  assert(src.includes('requireLeonixAdminPermission("can_view_payments")'), "or an authenticated admin with the payments permission");
  assert(src.includes('code: "unauthorized" }, { status: 401 }'), "and rejects everything else 401");
  assert(src.includes("dryRun"), "dryRun is supported");
  const lifecycle = stripComments(read("app/lib/listingPlans/subscriptionLifecycle.ts"));
  assert(lifecycle.includes('.eq("status", "grace")'), "the sweep only touches grace rows");
  assert(lifecycle.includes('.lt("grace_ends_at", new Date().toISOString())'), "and only those whose grace has actually expired");
  assert(lifecycle.includes("Math.min(Math.max(Number(opts?.limit ?? 100), 1), 500)"), "bounded — never an unbounded sweep");
  assert(lifecycle.includes("if (opts?.dryRun) return { due: rows.length, suspended: 0, dryRun: true };"), "dryRun writes nothing");
  // Webhook stays primary; the write-time guard also reconciles.
  assert(
    stripComments(read("app/lib/listingPlans/commercialWriteGuard.ts")).includes("await reconcileSubscriptionRow(row)"),
    "grace expiry is also reconciled at write time, so the sweep is a backstop and not the only crank",
  );
  // No scheduler was created by this gate.
  let hasVercelJson = true;
  try {
    read("vercel.json");
  } catch {
    hasVercelJson = false;
  }
  assert(!hasVercelJson, "no vercel.json cron was added — scheduling stays integration/ops work");
}

/* ════════════ 10. SCOPE — protected surfaces untouched ══════════════════════════════════ */
{
  const app = read("app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx");
  assert(!app.includes("SERVICIOS-3"), "the protected Application was not modified by this gate");
  const preview = read("app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx");
  assert(!preview.includes("SERVICIOS-3"), "the protected Preview client was not modified by this gate");
  for (const rel of [TZ, HOURS, OPS]) {
    const src = stripComments(read(rel));
    assert(!/CREATE TABLE|ALTER TABLE|ADD COLUMN/i.test(src), `no schema change in ${rel}`);
    assert(!/cron|setInterval\(/i.test(src), `no scheduler in ${rel}`);
  }
  assert(!stripComments(read(TZ)).includes("import "), "the timezone resolver is pure — zero imports");
}

/* ─────────────────────────────────── report ────────────────────────────────────────────── */

if (failures.length > 0) {
  console.error(`\nverify-servicios-gate3-source-readiness: ${passed} passed, ${failures.length} FAILED\n`);
  for (const f of failures) console.error(`  FAIL  ${f}`);
  process.exit(1);
}
console.log(`verify-servicios-gate3-source-readiness: ${passed}/${passed} PASS`);
