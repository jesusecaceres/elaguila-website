/**
 * Globalization Wave 4 P0 — Bienes Negocio dashboard-edit reverse mapper data-loss fix.
 * Proves `bienesPublishedRowToAgenteApplicationDraft` no longer maintains a second, thin,
 * incomplete parser and instead reuses the exact same parsing logic already proven correct on
 * the live public page (`parseBienesAgenteResidencialPublishedState`), preserving the
 * Bienes-inventory-pack-specific fields on top. Source-level checks only — not a substitute for
 * owner browser QA (published row → edit → preview → republish → same row → zero field loss).
 */
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
let pass = 0;
let fail = 0;

function read(rel: string): string {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

function check(label: string, condition: boolean): void {
  if (condition) {
    pass += 1;
    console.log(`  ok  - ${label}`);
  } else {
    fail += 1;
    console.error(`  FAIL - ${label}`);
  }
}

console.log("verify-wave4-p0-bienes-negocio-reverse-mapper-2026-09-09: starting");

const SHARED_PARSER_PATH =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/parseBienesAgenteResidencialPublishedState.ts";
const SHELL_PATH = "app/(site)/clasificados/bienes-raices/listing/BienesRaicesNegocioLiveDetailShell.tsx";
const MAPPER_PATH =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/bienesPublishedToAgenteApplicationDraft.ts";

// --- 1. Shared parser module exists and exports the extracted function ---
{
  const shared = read(SHARED_PARSER_PATH);
  check(
    "SHARED 1: parseBienesAgenteResidencialPublishedState is exported",
    /export function parseBienesAgenteResidencialPublishedState/.test(shared),
  );
  check(
    "SHARED 2: contains the full identity/business_meta field set (spot-check a broad sample, not just address)",
    shared.includes("agenteLicencia: trim(identityMeta.negocioLicencia)") &&
      shared.includes("googleReviewsUrl: normalizeUrl(identityMeta.negocioGoogleReviewsUrl)") &&
      shared.includes("yelpReviewsUrl: normalizeUrl(identityMeta.negocioYelpReviewsUrl)") &&
      shared.includes("businessExtraUrls: parseBusinessExtraLinks(identityMeta.negocioBusinessExtraUrls)") &&
      shared.includes("mostrarSegundoAgente: Boolean(coAgent.name)") &&
      shared.includes("mostrarBrokerAsesor: Boolean(broker.name)") &&
      shared.includes("extraOpenHouse: Boolean(gate.openHouseEnabled)"),
  );
}

// --- 2. The live public shell no longer maintains its own duplicate parser ---
{
  const shell = read(SHELL_PATH);
  check(
    "SHELL 1: local buildPublishedState() function is gone",
    !/function buildPublishedState/.test(shell),
  );
  check(
    "SHELL 2: shell now imports and calls the shared parser",
    shell.includes(
      'import { parseBienesAgenteResidencialPublishedState } from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/parseBienesAgenteResidencialPublishedState"',
    ) && shell.includes("parseBienesAgenteResidencialPublishedState({ listing, parentIdentity, lang })"),
  );
  check(
    "SHELL 3: no dead references remain to the deleted local helper functions",
    !/\bfunction (parseJsonObject|parseJsonArray|humanPairValue|splitBaths|normalizeUrl|socialUrls|parseBusinessExtraLinks|firstSocialFor|listingStatus|subtypeFromPair|splitCoAgent)\(/.test(
      shell,
    ),
  );
}

// --- 3. The dashboard-edit reverse mapper now reuses the shared parser (the actual P0 fix) ---
{
  const mapper = read(MAPPER_PATH);
  check(
    "MAPPER 1: imports the shared parser instead of reimplementing its own",
    mapper.includes(
      'import { parseBienesAgenteResidencialPublishedState } from "./parseBienesAgenteResidencialPublishedState"',
    ),
  );
  check(
    "MAPPER 2: bienesPublishedRowToAgenteApplicationDraft calls the shared parser",
    mapper.includes("const shared = parseBienesAgenteResidencialPublishedState({"),
  );
  check(
    "MAPPER 3: return value spreads the shared parser's full output (not a thin ~17-field object)",
    /return \{\s*\.\.\.shared,/.test(mapper),
  );
  check(
    "MAPPER 4: the old thin reimplementation (business_meta-only contactChannels shortcut) is gone",
    !mapper.includes("leonixContactChannelsFormSliceFromPayload") &&
      !mapper.includes("parseLeonixContactChannelsV1FromDetailPairs") &&
      !mapper.includes("parsePublishedBusinessExtraLinks"),
  );
  check(
    "MAPPER 5: Bienes-inventory-pack-specific fields (not covered by the shared parser) are preserved on top",
    mapper.includes("additionalInventoryProperties: children") &&
      mapper.includes("confirmInventoryPackPricing: packEnabled") &&
      mapper.includes("inventoryPackAccepted: false"),
  );
  check(
    "MAPPER 6: OWNER_LISTING_SELECT now includes contact_phone/contact_email (needed by the shared parser's fallback chain)",
    /"[^"]*\bcontact_phone\b[^"]*\bcontact_email\b[^"]*"/.test(mapper),
  );
  check(
    "MAPPER 7: hydration passes the real lang through to the shared parser instead of hardcoding one",
    mapper.includes("bienesPublishedRowToAgenteApplicationDraft({ row: parentRow, childRows, lang: input.lang })"),
  );
}

console.log(`\nverify-wave4-p0-bienes-negocio-reverse-mapper-2026-09-09: ${pass}/${pass + fail} checks passed`);
if (fail > 0) process.exit(1);
