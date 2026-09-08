/**
 * LEO-3 Living Leonix Book foundation — targeted construction verifier.
 *
 * Run: npx tsx scripts/verify-leo-3-living-book.ts
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function src(rel: string): string {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

function exists(rel: string): boolean {
  return existsSync(path.join(ROOT, rel));
}

function leoApiSurfaceOk(): boolean {
  if (exists("app/leo/page.tsx")) return false;
  if (!exists("app/api/leo")) return true;
  if (!exists("app/api/leo/conversation/route.ts")) return false;
  const routes: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = path.join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (name === "route.ts") routes.push(path.relative(path.join(ROOT, "app/api/leo"), p).replace(/\\/g, "/"));
    }
  };
  walk(path.join(ROOT, "app/api/leo"));
  return routes.length === 1 && routes[0] === "conversation/route.ts";
}

let failures = 0;
const check = (ok: boolean, label: string) => {
  if (ok) console.log(`PASS  ${label}`);
  else {
    failures += 1;
    console.error(`FAIL  ${label}`);
  }
};

function main() {
  const migrationsDir = path.join(ROOT, "supabase/migrations");
  const migrationFiles = readdirSync(migrationsDir).filter((f) => f.includes("leo_living_book"));
  check(migrationFiles.length === 1, "Exactly one LEO Living Book migration file exists");
  const migrationRel = `supabase/migrations/${migrationFiles[0] ?? ""}`;
  const migration = migrationFiles[0] ? src(migrationRel) : "";

  check(/CREATE TABLE IF NOT EXISTS public\.leo_memory_records/.test(migration), "Migration creates public.leo_memory_records");
  check(
    (migration.match(/CREATE TABLE IF NOT EXISTS public\.leo_/g) ?? []).length === 1,
    "Migration creates only one LEO-owned table",
  );
  check(!/DROP TABLE|TRUNCATE|ALTER TABLE public\.(listings|profiles|businesses)/i.test(migration), "Migration is additive/non-destructive");
  check(/ENABLE ROW LEVEL SECURITY/i.test(migration), "RLS enabled on leo_memory_records");
  check(
    !/^\s*create policy/im.test(migration) && !/create policy "/i.test(migration),
    "No anon/public/authenticated policies on leo_memory_records",
  );
  check(/epistemic_type text NOT NULL/i.test(migration) && /system_fact/.test(migration), "Epistemic type constraint exists");
  check(/status text NOT NULL DEFAULT 'active'/i.test(migration) && /superseded/.test(migration), "Status constraint exists");
  check(
    /source_system text NOT NULL/i.test(migration) && /source_actor_type text NOT NULL/i.test(migration),
    "Provenance fields exist",
  );
  check(/subject_type text NOT NULL/i.test(migration) && /subject_key text NOT NULL/i.test(migration), "Subject reference fields exist");
  check(/supersedes_id uuid NULL REFERENCES public\.leo_memory_records/i.test(migration), "Self-supersession relationship exists");
  check(/contradicts_ids uuid\[\]/i.test(migration), "Contradiction relationship column exists");
  check(
    /leo_memory_records_subject_active_idx/.test(migration) &&
      /leo_memory_records_epistemic_type_idx/.test(migration) &&
      /leo_memory_records_created_at_idx/.test(migration) &&
      /leo_memory_records_supersedes_id_idx/.test(migration),
    "Useful indexes exist (subject active, epistemic, created_at, supersession)",
  );
  check(!/vector|embedding|pgvector/i.test(migration), "No vector/embedding architecture in migration");

  const repoPath = "app/leo/_lib/leoLivingBookRepository.ts";
  const servicePath = "app/leo/_lib/leoLivingBookService.ts";
  const typesPath = "app/leo/_lib/leoTypes.ts";
  check(exists(repoPath), "Repository module exists");
  check(exists(servicePath), "Owner-only service module exists");
  const repo = src(repoPath);
  const service = src(servicePath);
  const types = src(typesPath);

  check(repo.includes('import "server-only"'), "Repository is server-only");
  check(service.includes('import "server-only"'), "Service is server-only");
  check(service.includes("requireLeoOwnerAccess"), "Service enforces owner_admin boundary");
  check(!/\bdeleteLeo|\.delete\s*\(|function delete/i.test(repo + service), "No delete helper in Living Book modules");
  check(repo.includes("LEO_MEMORY_LIST_MAX") && repo.includes(".limit("), "Repository uses bounded reads");
  check(
    repo.includes("validateCreateInput") && repo.includes("source.system provenance is required"),
    "Create requires provenance",
  );
  check(
    repo.includes("supersedeLeoMemoryRecord") &&
      repo.includes('status: "superseded"') &&
      repo.includes("supersedesId"),
    "Supersession creates new record and marks old superseded",
  );
  check(
    repo.includes("recordLeoMemoryContradiction") && repo.includes("contradicts_ids"),
    "Contradiction links both records without overwrite of statements",
  );
  check(
    !/openai\.com|chat\.completions|generateText|@ai-sdk|anthropic|runListingAiModeration/i.test(repo + service),
    "No AI/provider imports",
  );
  check(!/business-concierge|diyConcierge|app\/lib\/business/i.test(repo + service), "No Business Concierge imports");
  check(!/"use client"/.test(repo + service), "No client component");
  check(leoApiSurfaceOk(), "No public API route or UI page (conversation-only API allowed)");
  check(
    types.includes("LeoMemoryEpistemicType") &&
      types.includes("LeoMemoryRecord") &&
      types.includes("LeoCreateMemoryInput") &&
      types.includes("LeoSupersedeMemoryInput") &&
      types.includes("owner_statement") &&
      types.includes("active_decision"),
    "leoTypes Living Book contract present",
  );
  check(
    !/from\("listings"\)\.insert|duplicate listing|copy listing row/i.test(repo + service),
    "No canonical listing/customer/business row duplication writes",
  );
  check(
    !repo.includes("getAdminDashboardSnapshot") && !repo.includes("assembleLeoListingReasonChain"),
    "No automatic Admin snapshot / Reason Chain persistence wiring",
  );
  check(
    !/process\.env\.(SUPABASE_SERVICE_ROLE_KEY|OPENAI_API_KEY|RESEND_API_KEY)/.test(repo + service),
    "No service-role/secret env values exported or referenced for printing",
  );

  check(
    repo.includes("leoCreateMemoryRequiresProvenance") &&
      repo.includes("source.system provenance is required"),
    "Repository exposes provenance requirement helper / create validation",
  );
  check(
    /source\.system provenance is required/.test(repo) &&
      /epistemicType is required/.test(repo) &&
      /statement is required/.test(repo),
    "Fixture-equivalent: create validation rejects missing provenance fields",
  );

  if (failures > 0) {
    console.error(`\nLEO-3 verifier FAILED with ${failures} check(s).`);
    process.exit(1);
  }
  console.log("\nLEO-3 verifier PASSED.");
}

main();
