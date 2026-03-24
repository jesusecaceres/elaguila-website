/**
 * Bienes Raíces reads legacy shared-wizard detail keys only through `app/clasificados/lib/**`.
 * Do not import legacy coalesce or key maps via another category (e.g. en-venta re-exports).
 */
export {
  coalesceWizardDetailValue,
  coalesceNegocioNombreFromWizard,
  coalesceNegocioAgenteFromWizard,
} from "@/app/clasificados/lib/legacyWizardCoalesce";
export { LEGACY_WIZARD_BR_DETAIL, LEGACY_WIZARD_SHARED_NEGOCIO } from "@/app/clasificados/lib/legacyWizardDraftKeys";
