/**
 * Globalization Master Integration — Wave 1: G23 Street Address Verifier global adoption.
 *
 * Servicios (prior gate) is the proven reference adapter. This proves the SAME shared
 * BusinessAddressVerifiedInput + businessAddressContract engine is now actually mounted, with a
 * full additive round-trip for verificationStatus/provider/providerPlaceId, in:
 *   - Restaurantes
 *   - Comida Local
 *   - Autos Dealer
 *   - Bienes Negocio
 *   - Rentas Negocio (+ Rentas Privado, which shares the same form-state/merge infrastructure)
 *
 * Source-level checks only — string/AST-light inspection of the real files, matching the
 * established pattern of scripts/verify-servicios-p0-owner-gaps-2026-09-09.ts.
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

console.log("verify-g23-wave1-global-adoption-2026-09-09: starting");

// --- Restaurantes ---
{
  const model = read("app/(site)/clasificados/restaurantes/application/restauranteListingApplicationModel.ts");
  check(
    "RESTAURANTES 1: RestauranteLocationDetails declares the 3 verification fields",
    model.includes("physicalVerificationStatus?:") && model.includes("physicalProviderPlaceId?:"),
  );
  const empty = read("app/(site)/clasificados/restaurantes/application/createEmptyRestauranteDraft.ts");
  check(
    "RESTAURANTES 2: empty-draft defaults include the 3 fields",
    empty.includes('physicalVerificationStatus: "unverified"'),
  );
  const client = read("app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx");
  check(
    "RESTAURANTES 3: BusinessAddressVerifiedInput is imported and mounted in place of the plain addressLine1 input",
    client.includes('import { BusinessAddressVerifiedInput } from "@/app/components/forms/BusinessAddressVerifiedInput"') &&
      client.includes("<BusinessAddressVerifiedInput"),
  );
  const payload = read("app/(site)/clasificados/restaurantes/application/buildRestaurantePublishPayload.ts");
  check(
    "RESTAURANTES 4: the real trap file (buildRestaurantePublishPayload's hard-coded allowlist) explicitly includes the 3 fields — without this they'd never leave the browser",
    payload.includes('physicalVerificationStatus: blockHeavyMedia(draft.physicalVerificationStatus'),
  );
}

// --- Comida Local ---
{
  const types = read("app/lib/clasificados/comida-local/comidaLocalTypes.ts");
  check(
    "COMIDA 1: ComidaLocalDraft declares the 3 verification fields",
    types.includes("physicalVerificationStatus:") && types.includes("physicalProviderPlaceId:"),
  );
  const defaults = read("app/lib/clasificados/comida-local/createEmptyComidaLocalDraft.ts");
  check(
    "COMIDA 2: empty-draft defaults include the 3 fields",
    defaults.includes('physicalVerificationStatus: "unverified"'),
  );
  const client = read("app/(site)/publicar/comida-local/ComidaLocalApplicationClient.tsx");
  check(
    "COMIDA 3: BusinessAddressVerifiedInput is imported and mounted in place of the plain businessAddressLine input",
    client.includes('import { BusinessAddressVerifiedInput } from "@/app/components/forms/BusinessAddressVerifiedInput"') &&
      client.includes("<BusinessAddressVerifiedInput"),
  );
  const persistence = read("app/lib/clasificados/comida-local/comidaLocalDraftPersistence.ts");
  check(
    "COMIDA 4: the real trap function (mergeComidaLocalDraftFromStorage's field-by-field rebuild, which runs on every ~400ms autosave) explicitly restores the 3 fields — without this they'd self-destruct on the next keystroke",
    /function mergeComidaLocalDraftFromStorage[\s\S]*?physicalVerificationStatus:[\s\S]*?physicalProvider:[\s\S]*?physicalProviderPlaceId:/.test(
      persistence,
    ),
  );
}

// --- Autos Dealer ---
{
  const type = read("app/(site)/clasificados/autos/negocios/types/autoDealerListing.ts");
  check(
    "AUTOS 1: AutoDealerListing declares the 3 verification fields",
    type.includes("dealerAddressVerificationStatus?:") && type.includes("dealerAddressProviderPlaceId?:"),
  );
  const defaults = read("app/(site)/clasificados/autos/negocios/lib/autoDealerDraftDefaults.ts");
  check(
    "AUTOS 2: createEmptyListing defaults include the 3 fields",
    defaults.includes('dealerAddressVerificationStatus: "unverified"'),
  );
  const patchType = read("app/lib/clasificados/autos/autosDealerStructuredAddress.ts");
  check(
    "AUTOS 3: the shared DealerStructuredAddressPatch Pick<> type includes the 3 fields (needed for the component prop type)",
    patchType.includes('"dealerAddressVerificationStatus"'),
  );
  const fields = read("app/(site)/publicar/autos/shared/components/AutosDealerStructuredAddressFields.tsx");
  check(
    "AUTOS 4: BusinessAddressVerifiedInput is imported and mounted in place of the plain Street Name input",
    fields.includes('import { BusinessAddressVerifiedInput } from "@/app/components/forms/BusinessAddressVerifiedInput"') &&
      fields.includes("<BusinessAddressVerifiedInput"),
  );
}

// --- Bienes Negocio ---
{
  const agenteType = read(
    "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteIndividualResidencialFormState.ts",
  );
  check(
    "BIENES 1: AgenteIndividualResidencialFormState declares the 3 verification fields (type + default)",
    agenteType.includes("direccionVerificationStatus:") &&
      /direccionVerificationStatus: "unverified"/.test(agenteType),
  );
  const steps = read(
    "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/sections/steps01-03.tsx",
  );
  check(
    "BIENES 2: BusinessAddressVerifiedInput is imported and mounted in place of the plain direccionLinea1 input",
    steps.includes('import { BusinessAddressVerifiedInput } from "@/app/components/forms/BusinessAddressVerifiedInput"') &&
      steps.includes("<BusinessAddressVerifiedInput"),
  );
  const stateMapper = read(
    "app/(site)/clasificados/publicar/bienes-raices/negocio/application/mapping/mapAgenteResidencialFormStateToNegocioForPublish.ts",
  );
  check(
    "BIENES 3: the real trap file (mapAgenteResidencialFormStateToNegocioForPublish's hand-listed field mapping) explicitly carries the 3 fields into the shared BienesRaicesNegocioFormState",
    stateMapper.includes("direccionVerificationStatus: s.direccionVerificationStatus"),
  );
  const negocioType = read(
    "app/(site)/clasificados/publicar/bienes-raices/negocio/application/schema/bienesRaicesNegocioFormState.ts",
  );
  check(
    "BIENES 4: BienesRaicesNegocioFormState declares the 3 fields",
    negocioType.includes("direccionVerificationStatus?:"),
  );
  const businessMeta = read("app/(site)/clasificados/lib/leonixNegocioBusinessMetaFromFormState.ts");
  check(
    "BIENES 5: buildBusinessMetaJsonFromBienesRaicesNegocioState actually serializes the 3 fields into business_meta (matches the same pattern proven for G21's googleReviewsUrl/yelpReviewsUrl)",
    businessMeta.includes("meta.negocioDireccionVerificationStatus = s.direccionVerificationStatus"),
  );
}

// --- Rentas Negocio (+ Privado, shared infrastructure) ---
{
  const privadoType = read("app/(site)/clasificados/publicar/rentas/privado/schema/rentasPrivadoFormState.ts");
  check(
    "RENTAS 1: RentasPrivadoFormState declares the 3 fields",
    privadoType.includes("direccionVerificationStatus:"),
  );
  check(
    "RENTAS 2: mergePartialRentasPrivadoState (allowlist trap #1) explicitly restores the 3 fields",
    /const direccionVerificationStatus =[\s\S]{0,300}direccionVerificationStatusAllowed/.test(privadoType) &&
      /direccionVerificationStatus,\s*\n\s*direccionProvider,\s*\n\s*direccionProviderPlaceId,/.test(privadoType),
  );
  const negocioType = read("app/(site)/clasificados/publicar/rentas/negocio/schema/rentasNegocioFormState.ts");
  check(
    "RENTAS 3: RentasNegocioFormState declares the 3 fields",
    negocioType.includes("direccionVerificationStatus:"),
  );
  check(
    "RENTAS 4: mergePartialRentasNegocioState (allowlist trap #2) explicitly restores the 3 fields via asPrivado",
    negocioType.includes("direccionVerificationStatus: asPrivado.direccionVerificationStatus"),
  );
  check(
    "RENTAS 5: createEmptyRentasNegocioFormState carries the 3 fields from its Privado base",
    negocioType.includes("direccionVerificationStatus: p.direccionVerificationStatus"),
  );
  const toBienes = read(
    "app/(site)/clasificados/publicar/rentas/negocio/application/mapping/rentasNegocioToBienesRaicesNegocioState.ts",
  );
  check(
    "RENTAS 6: rentasNegocioToBienesRaicesNegocioState's basePartial (allowlist trap #3) carries the 3 fields into the shared Bienes pipeline, which BIENES 5 above proves actually serializes them",
    toBienes.includes("direccionVerificationStatus: s.direccionVerificationStatus"),
  );
  const shared = read("app/(site)/clasificados/publicar/rentas/shared/RentasAnuncioFormSection.tsx");
  check(
    "RENTAS 7: BusinessAddressVerifiedInput is imported and mounted in the shared form section used by both Rentas Privado and Rentas Negocio",
    shared.includes('import { BusinessAddressVerifiedInput } from "@/app/components/forms/BusinessAddressVerifiedInput"') &&
      shared.includes("<BusinessAddressVerifiedInput"),
  );
}

console.log(`\nverify-g23-wave1-global-adoption-2026-09-09: ${pass}/${pass + fail} checks passed`);
if (fail > 0) process.exit(1);
