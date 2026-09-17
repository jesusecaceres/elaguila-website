/**
 * Gate SERVICIOS-RUNTIME-CONFIG-PROBE-DEPLOY-1 — safety proof for the TEMPORARY
 * /api/internal/servicios-runtime-readiness diagnostic route.
 *
 * The whole point of this verifier is that a diagnostic endpoint which reads every sensitive
 * environment variable must be proven incapable of emitting any of them. It therefore feeds
 * FABRICATED, obviously-fake secret values through the real classifier and asserts that not one
 * of them appears anywhere in the serialized output.
 *
 * No real environment value is read. No network, database or SDK call is made.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-runtime-readiness-probe.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import {
  buildServiciosRuntimeReadinessReport,
  classifyStripeMode,
  classifyVercelEnv,
  parseSupabaseProjectRef,
  type ReadinessEnvSource,
} from "../app/api/internal/servicios-runtime-readiness/readinessReport";

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

function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}
function readSrc(rel: string): string {
  return stripComments(readFileSync(new URL(`../${rel}`, import.meta.url), "utf8"));
}

const ROUTE_SRC = readSrc("app/api/internal/servicios-runtime-readiness/route.ts");
const REPORT_SRC = readSrc("app/api/internal/servicios-runtime-readiness/readinessReport.ts");

// =================================================================================
// 1. NO SECRET DISCLOSURE — the central guarantee
// =================================================================================

/** Every value here is fabricated. None is, or resembles, a real credential. */
const FAKE = {
  url: "https://xuieateniufcrsfdomwl.supabase.co",
  anon: "FAKE-ANON-JWT-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  serviceRole: "FAKE-SERVICE-ROLE-bbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  identityHash: "FAKE-IDENTITY-HASH-KEY-cccccccccccccccccccc",
  twilioSid: "ACfakefakefakefakefakefakefakefake00",
  twilioToken: "FAKE-TWILIO-AUTH-TOKEN-dddddddddddddddddddd",
  twilioVerify: "VAfakefakefakefakefakefakefakefake00",
  stripeSecret: "sk_test_FAKEFAKEFAKEFAKEeeeeeeeeeeeeeeeeeeee",
  stripeWebhook: "whsec_FAKEFAKEFAKEffffffffffffffffffffffff",
  googleKey: "FAKE-GOOGLE-MAPS-KEY-gggggggggggggggggggg",
  blobToken: "vercel_blob_rw_FAKEFAKEhhhhhhhhhhhhhhhhhhhh",
} as const;

const fullyPopulatedEnv: ReadinessEnvSource = {
  VERCEL_ENV: "preview",
  VERCEL_GIT_COMMIT_SHA: "a8d92e75de787a2986d1be5e5c7137b92d0bbde8",
  NEXT_PUBLIC_SUPABASE_URL: FAKE.url,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: FAKE.anon,
  SUPABASE_SERVICE_ROLE_KEY: FAKE.serviceRole,
  SERVICIOS_STRICT_PUBLISH: "1",
  LEONIX_IDENTITY_HASH_KEY: FAKE.identityHash,
  TWILIO_ACCOUNT_SID: FAKE.twilioSid,
  TWILIO_AUTH_TOKEN: FAKE.twilioToken,
  TWILIO_VERIFY_SERVICE_SID: FAKE.twilioVerify,
  STRIPE_SECRET_KEY: FAKE.stripeSecret,
  STRIPE_WEBHOOK_SECRET: FAKE.stripeWebhook,
  GOOGLE_MAPS_API_KEY: FAKE.googleKey,
  BLOB_READ_WRITE_TOKEN: FAKE.blobToken,
};

check("NO SECRET DISCLOSURE: not one fabricated secret appears in the serialized report", () => {
  const serialized = JSON.stringify(buildServiciosRuntimeReadinessReport(fullyPopulatedEnv));
  for (const [name, value] of Object.entries(FAKE)) {
    if (name === "url") continue; // only its parsed public project ref is intentionally exposed
    assert.ok(
      !serialized.includes(value),
      `secret "${name}" leaked into the report output — this endpoint must never emit a value`,
    );
  }
});

check("NO PARTIAL DISCLOSURE: no secret fragment of 8+ chars survives into the output", () => {
  const serialized = JSON.stringify(buildServiciosRuntimeReadinessReport(fullyPopulatedEnv));
  for (const [name, value] of Object.entries(FAKE)) {
    if (name === "url") continue;
    for (let i = 0; i + 8 <= value.length; i += 1) {
      const fragment = value.slice(i, i + 8);
      assert.ok(
        !serialized.includes(fragment),
        `an 8-char fragment of "${name}" leaked — prefixes/suffixes are secrets too`,
      );
    }
  }
});

check("NO SECRET LENGTH DISCLOSURE: no numeric field exists anywhere in the report", () => {
  const serialized = JSON.stringify(buildServiciosRuntimeReadinessReport(fullyPopulatedEnv));
  assert.ok(
    !/:\s*\d/.test(serialized),
    "a number appeared in the report — lengths and counts are forbidden, only booleans/strings",
  );
});

check("OUTPUT SHAPE: every leaf is a boolean, a fixed literal, or an allow-listed string", () => {
  const report = buildServiciosRuntimeReadinessReport(fullyPopulatedEnv);
  const allowedStringPaths = new Set([
    "environment.vercelEnv",
    "environment.gitCommitSha",
    "supabase.projectRef",
    "stripe.mode",
  ]);
  const walk = (node: unknown, path: string) => {
    if (node === null) return;
    if (typeof node === "boolean") return;
    if (typeof node === "string") {
      assert.ok(allowedStringPaths.has(path), `unexpected string leaf at "${path}"`);
      return;
    }
    assert.equal(typeof node, "object", `unexpected leaf type at "${path}"`);
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      walk(v, path ? `${path}.${k}` : k);
    }
  };
  const { ok, ...rest } = report;
  assert.equal(ok, true);
  walk(rest, "");
});

// =================================================================================
// 2. Stripe classification — fabricated samples only
// =================================================================================

check("STRIPE MODE: sk_test_ classifies as test", () => {
  assert.equal(classifyStripeMode("sk_test_FAKE0000"), "test");
});
check("STRIPE MODE: sk_live_ classifies as live", () => {
  assert.equal(classifyStripeMode("sk_live_FAKE0000"), "live");
});
check("STRIPE MODE: anything else is unknown (never a confident guess)", () => {
  for (const sample of ["", undefined, "rk_test_FAKE", "pk_test_FAKE", "whsec_FAKE", "garbage"]) {
    assert.equal(classifyStripeMode(sample), "unknown", `"${String(sample)}" must be unknown`);
  }
});
check("STRIPE MODE: the classification never contains key characters", () => {
  const sample = "sk_test_SUPERSECRETVALUE";
  const mode = classifyStripeMode(sample);
  assert.ok(!sample.includes(mode) || mode === "test", "sanity");
  assert.ok(["test", "live", "unknown"].includes(mode));
  assert.ok(!mode.includes("SUPERSECRET"));
});

// =================================================================================
// 3. Supabase project ref — parsed from the public URL host only
// =================================================================================

check("SUPABASE REF: parsed from the public hostname, matching the authoritative project", () => {
  assert.equal(parseSupabaseProjectRef("https://xuieateniufcrsfdomwl.supabase.co"), "xuieateniufcrsfdomwl");
});
check("SUPABASE REF: a non-supabase or malformed host yields null, never an echo", () => {
  for (const sample of [undefined, "", "not a url", "https://evil.example.com", "https://db.internal/x"]) {
    assert.equal(parseSupabaseProjectRef(sample), null, `"${String(sample)}" must not be echoed`);
  }
});
check("SUPABASE REF: never derived by decoding a token", () => {
  // Base64/JWT decoding of any kind is forbidden. (A plain `host.split(".")` is the legitimate
  // hostname parse and is asserted positively below, so it is not part of this deny-list.)
  assert.ok(
    !/atob|Buffer\.from|jwtDecode|jsonwebtoken|base64/i.test(REPORT_SRC),
    "the project ref must come from the URL host only — never from decoding a JWT",
  );
  assert.match(
    REPORT_SRC,
    /host\.split\("\."\)/,
    "the ref must be taken from the parsed hostname",
  );
  assert.ok(
    !/SUPABASE_SERVICE_ROLE_KEY[\s\S]{0,120}split/.test(REPORT_SRC),
    "the service-role key must never be split or parsed",
  );
});

// =================================================================================
// 4. Production kill-switch
// =================================================================================

check("PRODUCTION DISABLED: the route returns 404 when VERCEL_ENV is production", () => {
  assert.match(
    ROUTE_SRC,
    /process\.env\.VERCEL_ENV\s*===\s*"production"/,
    "the production guard must exist",
  );
  assert.match(ROUTE_SRC, /status:\s*404/, "the production guard must return 404");
  const guardIdx = ROUTE_SRC.indexOf('process.env.VERCEL_ENV === "production"');
  const buildIdx = ROUTE_SRC.indexOf("buildServiciosRuntimeReadinessReport(");
  assert.ok(guardIdx > 0 && buildIdx > guardIdx, "the guard must run BEFORE any report is built");
});

check("VERCEL ENV classification is a closed set", () => {
  assert.equal(classifyVercelEnv("preview"), "preview");
  assert.equal(classifyVercelEnv("production"), "production");
  assert.equal(classifyVercelEnv("development"), "development");
  for (const sample of [undefined, "", "staging", "PROD"]) {
    assert.equal(classifyVercelEnv(sample), "unknown");
  }
});

// =================================================================================
// 5. Zero external calls / not cached
// =================================================================================

check("ZERO EXTERNAL CALLS: no fetch, SDK, database or provider call in either file", () => {
  const forbidden = [
    /\bfetch\s*\(/,
    /\bhttps?:\/\/[^"'\s]*"\s*\)/,
    /supabase/i,
    /stripe\./i,
    /twilio/i,
    /googleapis/i,
    /XMLHttpRequest/,
    /node:https?/,
    /axios/,
  ];
  for (const re of forbidden) {
    assert.ok(!re.test(ROUTE_SRC), `route.ts must not contain ${re}`);
  }
  // The classifier names env vars in strings; assert it performs no CALL of any kind.
  for (const re of [/\bfetch\s*\(/, /\bawait\b/, /XMLHttpRequest/, /axios/, /node:https?/]) {
    assert.ok(!re.test(REPORT_SRC), `readinessReport.ts must not contain ${re}`);
  }
});

check("IMPORTS: the route imports only next/server and the local pure classifier", () => {
  const imports = [...ROUTE_SRC.matchAll(/from\s+"([^"]+)"/g)].map((m) => m[1]).sort();
  assert.deepEqual(imports, ["./readinessReport", "next/server"]);
});

check("IMPORTS: the classifier imports nothing at all (provably pure)", () => {
  const imports = [...REPORT_SRC.matchAll(/^\s*import\s/gm)];
  assert.equal(imports.length, 0, "readinessReport.ts must have zero imports");
});

check("NOT CACHED: force-dynamic, revalidate 0, nodejs runtime, no-store", () => {
  assert.match(ROUTE_SRC, /export const dynamic = "force-dynamic"/);
  assert.match(ROUTE_SRC, /export const revalidate = 0/);
  assert.match(ROUTE_SRC, /export const runtime = "nodejs"/);
  assert.match(ROUTE_SRC, /no-store/);
});

check("NOT INDEXED: the response carries a noindex robots header", () => {
  assert.match(ROUTE_SRC, /x-robots-tag/i);
});

check("READ-ONLY: the route exposes GET only — no POST/PUT/PATCH/DELETE handler", () => {
  for (const verb of ["POST", "PUT", "PATCH", "DELETE"]) {
    assert.ok(
      !new RegExp(`export\\s+async\\s+function\\s+${verb}\\b`).test(ROUTE_SRC),
      `${verb} must not be exported from a diagnostic route`,
    );
  }
  assert.match(ROUTE_SRC, /export\s+async\s+function\s+GET\b/);
});

// =================================================================================
// 6. Unset environment degrades honestly
// =================================================================================

check("EMPTY ENV: every flag reports false, nothing throws, no value invented", () => {
  const report = buildServiciosRuntimeReadinessReport({});
  assert.equal(report.supabase.allThreePresent, false);
  assert.equal(report.supabase.projectRef, null);
  assert.equal(report.servicios.strictPublish, false);
  assert.equal(report.identity.hashKeySet, false);
  assert.equal(report.twilio.allSet, false);
  assert.equal(report.stripe.secretSet, false);
  assert.equal(report.stripe.mode, "unknown");
  assert.equal(report.google.mapsKeySet, false);
  assert.equal(report.blob.tokenSet, false);
  assert.equal(report.environment.vercelEnv, "unknown");
  assert.equal(report.environment.gitCommitSha, null);
});

check("STRICT PUBLISH: only the exact literal \"1\" counts as enabled", () => {
  assert.equal(buildServiciosRuntimeReadinessReport({ SERVICIOS_STRICT_PUBLISH: "1" }).servicios.strictPublish, true);
  for (const sample of ["0", "true", "yes", "", " "]) {
    assert.equal(
      buildServiciosRuntimeReadinessReport({ SERVICIOS_STRICT_PUBLISH: sample }).servicios.strictPublish,
      false,
      `"${sample}" must not count as strict publish`,
    );
  }
});

check("UNSET-REQUIRED FLAGS: presence of dev-publish / moderation-mode is reported honestly", () => {
  const clean = buildServiciosRuntimeReadinessReport({});
  assert.equal(clean.servicios.devPublishSet, false);
  assert.equal(clean.servicios.moderationModeSet, false);
  const dirty = buildServiciosRuntimeReadinessReport({
    SERVICIOS_DEV_PUBLISH: "1",
    SERVICIOS_MODERATION_MODE: "1",
  });
  assert.equal(dirty.servicios.devPublishSet, true);
  assert.equal(dirty.servicios.moderationModeSet, true);
});

if (failures.length) {
  console.error(`\n${failures.length} check(s) FAILED`);
  process.exit(1);
}
console.log("\nverify-servicios-runtime-readiness-probe: PASS");
