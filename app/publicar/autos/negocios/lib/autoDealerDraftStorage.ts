/** Re-export shared draft persistence (single source of truth). */
export {
  AUTOS_NEGOCIOS_DRAFT_KEY,
  AUTOS_NEGOCIOS_DRAFT_STORAGE_PREFIX,
  LEGACY_AUTOS_NEGOCIOS_DRAFT_KEY,
  clearAutosNegociosDraft,
  loadAutosNegociosDraft,
  loadAutosNegociosDraftResolved,
  saveAutosNegociosDraftResolved,
  storageEventAffectsAutosNegociosDraft,
  type AutosNegociosDraftV1,
} from "@/app/clasificados/autos/negocios/lib/autosNegociosDraftStorage";
