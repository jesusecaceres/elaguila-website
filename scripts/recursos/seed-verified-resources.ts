/**
 * Recursos Data OS — verified resource seed path (Build 02, Gate 10).
 *
 * SEEDING POLICY — READ BEFORE EDITING:
 *   - Do NOT add guessed/invented organizations, phone numbers, URLs, or hours here.
 *   - Only add records here once Coach (or another authoritative source) has supplied verified,
 *     official-source-backed data for each entry.
 *   - `VERIFIED_RESOURCES` below is intentionally EMPTY. Leave it empty until real data exists.
 *
 * USAGE (not run automatically by any build/deploy step):
 *   npx tsx scripts/recursos/seed-verified-resources.ts --confirm
 *
 * Without `--confirm`, or with an empty `VERIFIED_RESOURCES` array, this script does nothing and
 * prints a message — it will never silently write placeholder rows.
 */
import { dbCreateCommunityResource, type CommunityResourceInput } from "@/app/lib/recursos/server/communityResourcesDb";

/**
 * Add ONLY verified, official-source-backed records here. Each entry must include
 * `verification.officialSourceUrl` and should leave `verification.lastVerifiedAt` unset unless a
 * human has actually confirmed the information on that date.
 */
const VERIFIED_RESOURCES: CommunityResourceInput[] = [];

async function main() {
  const confirmed = process.argv.includes("--confirm");

  if (VERIFIED_RESOURCES.length === 0) {
    console.log("[seed-verified-resources] VERIFIED_RESOURCES is empty — nothing to seed. This is expected until verified source data is supplied.");
    return;
  }

  if (!confirmed) {
    console.log(
      `[seed-verified-resources] ${VERIFIED_RESOURCES.length} record(s) staged but --confirm was not passed. Re-run with --confirm to write them.`,
    );
    return;
  }

  for (const input of VERIFIED_RESOURCES) {
    const result = await dbCreateCommunityResource(input, "seed-script");
    if (result.ok) {
      console.log(`[seed-verified-resources] created: ${result.slug} (${result.id})`);
    } else {
      console.error(`[seed-verified-resources] FAILED for slug "${input.slug}": ${result.error}`);
    }
  }
}

main().catch((e) => {
  console.error("[seed-verified-resources] fatal error:", e);
  process.exitCode = 1;
});
