import {
  ALL_LEGACY_BR_WIZARD_DETAIL_VALUES,
  LEGACY_WIZARD_SHARED_NEGOCIO,
} from "@/app/clasificados/lib/legacyWizardDraftKeys";

/** Drop legacy shared-wizard keys from a details object before persisting (BR / shared publish saves). */
export function stripLegacySharedWizardBrKeys(details: Record<string, string>): Record<string, string> {
  const out = { ...details };
  for (const k of ALL_LEGACY_BR_WIZARD_DETAIL_VALUES) {
    delete out[k];
  }
  delete out[LEGACY_WIZARD_SHARED_NEGOCIO.businessName];
  delete out[LEGACY_WIZARD_SHARED_NEGOCIO.agentName];
  return out;
}
