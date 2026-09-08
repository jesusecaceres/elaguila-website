/**
 * Gate G1.6 — QA environment preflight.
 *
 * Run BEFORE any manual/automated QA session against a live Supabase project. Reports whether
 * the current environment, project ref, QA account, and QA record actually match what the QA
 * session is supposed to be testing — never assumes, always checks live.
 *
 * Never prints secret values (service role key, anon key, passwords, tokens). Only the Supabase
 * project ref is shown, which is a public URL component, not a secret.
 *
 * Usage:
 *   npx tsx scripts/verify-qa-environment.ts <category> <environment>
 *   npx tsx scripts/verify-qa-environment.ts comida-local staging
 *   npx tsx scripts/verify-qa-environment.ts --all staging
 *
 * Exit code is non-zero if SAFE TO QA is FALSE for any checked category, so this can gate a CI
 * step or a pre-QA checklist without a human having to parse output.
 */
import { createClient } from "@supabase/supabase-js";
import {
  QA_FIXTURE_REGISTRY,
  getQaFixture,
  type QaFixtureCategory,
  type QaFixtureEnvironment,
} from "../app/lib/qaFoundation/qaFixtureRegistry";

const EXPECTED_PROJECT_REF_BY_ENV: Record<QaFixtureEnvironment, string> = {
  staging: "cgeehvnfyrdoperdotdh",
  production: "xuieateniufcrsfdomwl",
};

// Category -> the table that would hold a real listing/application row for that category.
const LISTING_TABLE_BY_CATEGORY: Partial<Record<QaFixtureCategory, string>> = {
  servicios: "servicios_public_listings",
  restaurantes: "restaurantes_public_listings",
  "comida-local": "comida_local_public_listings",
  "ofertas-locales": "ofertas_locales",
  "autos-dealer": "autos_classifieds_listings",
  "autos-privado": "autos_classifieds_listings",
  "bienes-raices": "listings",
  rentas: "listings",
};

function extractProjectRef(supabaseUrl: string | undefined): string | null {
  if (!supabaseUrl) return null;
  const m = supabaseUrl.match(/^https?:\/\/([a-z0-9]+)\.supabase\.co/i);
  return m ? m[1] : null;
}

type PreflightResult = {
  category: QaFixtureCategory;
  environment: QaFixtureEnvironment;
  deploymentEnvironment: string;
  actualProjectRef: string | null;
  expectedProjectRef: string;
  projectRefMatches: boolean;
  qaUserExists: boolean;
  qaUserEmail: string | null;
  applicationOrListingId: string | null;
  recordExists: boolean;
  safeToQa: boolean;
  reasons: string[];
};

async function runPreflight(
  category: QaFixtureCategory,
  environment: QaFixtureEnvironment,
): Promise<PreflightResult> {
  const reasons: string[] = [];
  const fixture = getQaFixture(category, environment);
  const expectedProjectRef = EXPECTED_PROJECT_REF_BY_ENV[environment];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const actualProjectRef = extractProjectRef(supabaseUrl);
  const deploymentEnvironment = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown";

  const projectRefMatches = actualProjectRef !== null && actualProjectRef === expectedProjectRef;
  if (!actualProjectRef) {
    reasons.push("NEXT_PUBLIC_SUPABASE_URL is not set or not a recognizable Supabase URL — cannot verify which project this environment actually targets.");
  } else if (!projectRefMatches) {
    reasons.push(
      `Connected project ref (${actualProjectRef}) does not match the expected ${environment} ref (${expectedProjectRef}). ` +
        `This environment is pointed at the WRONG Supabase project for this QA run.`,
    );
  }

  if (!fixture) {
    reasons.push(`No fixture registry entry for ${category}/${environment} — registry is incomplete for this category.`);
  } else if (fixture.status === "schema_missing") {
    reasons.push(`Fixture registry says schema is missing for ${category}/${environment}: ${fixture.notes}`);
  } else if (fixture.status === "unknown") {
    reasons.push(`Fixture registry has not verified ${category}/${environment} yet: ${fixture.notes}`);
  }

  let qaUserExists = false;
  let qaUserEmail: string | null = fixture?.qaAccountEmail ?? null;
  let applicationOrListingId: string | null = null;
  let recordExists = false;

  if (projectRefMatches && serviceKey && supabaseUrl) {
    const supabase = createClient(supabaseUrl, serviceKey);

    if (qaUserEmail) {
      // Service-role listUsers by email filter isn't available in supabase-js v2 directly;
      // fall back to a bounded scan since staging/cert projects have very few users.
      const { data, error } = await supabase.auth.admin.listUsers({ perPage: 200 });
      if (error) {
        reasons.push(`Could not query auth.users: ${error.message}`);
      } else {
        qaUserExists = data.users.some((u) => u.email?.toLowerCase() === qaUserEmail!.toLowerCase());
        if (!qaUserExists) {
          reasons.push(`QA account ${qaUserEmail} not found in this project's auth.users.`);
        }
      }
    } else {
      reasons.push(`No QA account email recorded in the fixture registry for ${category}/${environment}.`);
    }

    const table = LISTING_TABLE_BY_CATEGORY[category];
    if (table) {
      const { data, error } = await supabase.from(table).select("id").limit(1);
      if (error) {
        reasons.push(`Could not query ${table}: ${error.message} (table may not exist in this project).`);
      } else if (data && data.length > 0) {
        recordExists = true;
        applicationOrListingId = String((data[0] as { id: string }).id);
      } else {
        reasons.push(`${table} has zero rows in this project — no real listing/application record to test against yet.`);
      }
    }
  } else if (!serviceKey) {
    reasons.push("SUPABASE_SERVICE_ROLE_KEY is not set — cannot run live checks.");
  }

  const safeToQa = projectRefMatches && qaUserExists && recordExists && reasons.length === 0;

  return {
    category,
    environment,
    deploymentEnvironment,
    actualProjectRef,
    expectedProjectRef,
    projectRefMatches,
    qaUserExists,
    qaUserEmail,
    applicationOrListingId,
    recordExists,
    safeToQa,
    reasons,
  };
}

function printResult(r: PreflightResult) {
  console.log(`\n=== ${r.category} / ${r.environment} ===`);
  console.log(`DEPLOYMENT ENVIRONMENT: ${r.deploymentEnvironment}`);
  console.log(`SUPABASE PROJECT REF: ${r.actualProjectRef ?? "(unresolved)"}`);
  console.log(`EXPECTED PROJECT REF: ${r.expectedProjectRef}`);
  console.log(`QA USER EXISTS: ${r.qaUserExists ? "TRUE" : "FALSE"}${r.qaUserEmail ? ` (${r.qaUserEmail})` : ""}`);
  console.log(`APPLICATION/LISTING ID: ${r.applicationOrListingId ?? "(none)"}`);
  console.log(`RECORD EXISTS: ${r.recordExists ? "TRUE" : "FALSE"}`);
  console.log(`SAFE TO QA: ${r.safeToQa ? "TRUE" : "FALSE"}`);
  if (r.reasons.length > 0) {
    console.log("Reasons:");
    for (const reason of r.reasons) console.log(`  - ${reason}`);
  }
}

async function main() {
  const [, , arg1, arg2] = process.argv;
  if (!arg1 || !arg2) {
    console.error("Usage: npx tsx scripts/verify-qa-environment.ts <category|--all> <staging|production>");
    process.exitCode = 2;
    return;
  }

  const environment = arg2 as QaFixtureEnvironment;
  if (environment !== "staging" && environment !== "production") {
    console.error(`Unknown environment "${environment}". Expected "staging" or "production".`);
    process.exitCode = 2;
    return;
  }

  const categories: QaFixtureCategory[] =
    arg1 === "--all"
      ? Array.from(new Set(QA_FIXTURE_REGISTRY.map((e) => e.category)))
      : [arg1 as QaFixtureCategory];

  let anyUnsafe = false;
  for (const category of categories) {
    const result = await runPreflight(category, environment);
    printResult(result);
    if (!result.safeToQa) anyUnsafe = true;
  }

  // Set exitCode rather than calling process.exit() directly: an abrupt exit can race the
  // Supabase client's underlying HTTP keep-alive handle on Windows/Node and crash with a
  // libuv assertion after all real output has already been printed. Setting exitCode lets
  // Node drain the event loop and exit cleanly with the same code.
  process.exitCode = anyUnsafe ? 1 : 0;
}

main().catch((e) => {
  console.error("Preflight script crashed:", e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
