/**
 * Canonical QA environment preflight.
 *
 * Leonix uses ONE Supabase project: Leonix Media (xuieateniufcrsfdomwl).
 * The former Staging and Certification projects were retired/deleted on 2026-09-25.
 *
 * This verifier is intentionally fail-closed. It confirms that the current environment points to
 * the canonical project, then refuses to claim a destructive/live QA run is safe unless a real
 * owner-approved QA identity and record have been explicitly registered.
 *
 * Usage:
 *   npx tsx scripts/verify-qa-environment.ts <category|--all> production
 */
import { createClient } from "@supabase/supabase-js";
import {
  QA_FIXTURE_REGISTRY,
  getQaFixture,
  type QaFixtureCategory,
  type QaFixtureEnvironment,
} from "../app/lib/qaFoundation/qaFixtureRegistry";

const CANONICAL_PROJECT_REF = "xuieateniufcrsfdomwl";

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

async function runPreflight(category: QaFixtureCategory): Promise<PreflightResult> {
  const environment: QaFixtureEnvironment = "production";
  const reasons: string[] = [];
  const fixture = getQaFixture(category, environment);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const actualProjectRef = extractProjectRef(supabaseUrl);
  const deploymentEnvironment = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown";

  const projectRefMatches =
    actualProjectRef !== null && actualProjectRef === CANONICAL_PROJECT_REF;

  if (!actualProjectRef) {
    reasons.push(
      "NEXT_PUBLIC_SUPABASE_URL is not set or is not a recognizable Supabase URL.",
    );
  } else if (!projectRefMatches) {
    reasons.push(
      `Connected project ref (${actualProjectRef}) is not canonical Leonix Media (${CANONICAL_PROJECT_REF}). ABORT.`,
    );
  }

  if (!fixture) {
    reasons.push(`No canonical fixture registry entry for ${category}/production.`);
  } else if (fixture.status !== "ready") {
    reasons.push(
      `No owner-approved production QA fixture is registered for ${category}: ${fixture.notes}`,
    );
  }

  let qaUserExists = false;
  const qaUserEmail = fixture?.qaAccountEmail ?? null;
  let applicationOrListingId = fixture?.applicationOrListingId ?? null;
  let recordExists = false;

  if (projectRefMatches && serviceKey && supabaseUrl && qaUserEmail && applicationOrListingId) {
    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers({ perPage: 200 });
    if (usersError) {
      reasons.push(`Could not query auth.users: ${usersError.message}`);
    } else {
      qaUserExists = users.users.some(
        (u) => u.email?.toLowerCase() === qaUserEmail.toLowerCase(),
      );
      if (!qaUserExists) reasons.push("Registered production QA user was not found.");
    }

    const table = LISTING_TABLE_BY_CATEGORY[category];
    if (table) {
      const { data, error } = await supabase
        .from(table)
        .select("id")
        .eq("id", applicationOrListingId)
        .maybeSingle();
      if (error) reasons.push(`Could not verify registered QA row in ${table}: ${error.message}`);
      else recordExists = Boolean(data);
      if (!recordExists) reasons.push("Registered production QA record was not found.");
    }
  } else {
    if (!serviceKey) reasons.push("SUPABASE_SERVICE_ROLE_KEY is not set.");
    if (!qaUserEmail) reasons.push("No production QA account is registered.");
    if (!applicationOrListingId) reasons.push("No production QA listing/application is registered.");
  }

  const safeToQa =
    projectRefMatches &&
    fixture?.status === "ready" &&
    qaUserExists &&
    recordExists &&
    reasons.length === 0;

  return {
    category,
    environment,
    deploymentEnvironment,
    actualProjectRef,
    expectedProjectRef: CANONICAL_PROJECT_REF,
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
  console.log(`\n=== ${r.category} / production ===`);
  console.log(`DEPLOYMENT ENVIRONMENT: ${r.deploymentEnvironment}`);
  console.log(`SUPABASE PROJECT REF: ${r.actualProjectRef ?? "(unresolved)"}`);
  console.log(`EXPECTED PROJECT REF: ${r.expectedProjectRef}`);
  console.log(`SAFE TO QA: ${r.safeToQa ? "TRUE" : "FALSE"}`);
  for (const reason of r.reasons) console.log(`  - ${reason}`);
}

async function main() {
  const [, , arg1, arg2] = process.argv;
  if (!arg1 || arg2 !== "production") {
    console.error(
      'Usage: npx tsx scripts/verify-qa-environment.ts <category|--all> production',
    );
    console.error(
      "Staging/Certification targets no longer exist. Leonix Media is the only Supabase project.",
    );
    process.exitCode = 2;
    return;
  }

  const categories: QaFixtureCategory[] =
    arg1 === "--all"
      ? Array.from(new Set(QA_FIXTURE_REGISTRY.map((e) => e.category)))
      : [arg1 as QaFixtureCategory];

  let anyUnsafe = false;
  for (const category of categories) {
    const result = await runPreflight(category);
    printResult(result);
    if (!result.safeToQa) anyUnsafe = true;
  }
  process.exitCode = anyUnsafe ? 1 : 0;
}

main().catch((e) => {
  console.error("Preflight script crashed:", e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
