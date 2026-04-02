/** Re-export shared draft persistence (single source of truth). */
export {
  AUTOS_NEGOCIOS_DRAFT_KEY,
  clearAutosNegociosDraft,
  loadAutosNegociosDraft,
  saveAutosNegociosDraft,
  type AutosNegociosDraftV1,
} from "@/app/clasificados/autos/negocios/lib/autosNegociosDraftStorage";
