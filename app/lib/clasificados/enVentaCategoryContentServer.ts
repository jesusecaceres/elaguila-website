import "server-only";

import { DETAIL_FIELDS } from "@/app/clasificados/config/publishDetailFields";
import { getSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import type { ClasificadosCategoryContentRootPayload } from "@/app/lib/clasificados/clasificadosCategoryContentTypes";
import {
  extractCategoryPatch,
  mergeDetailFieldPatch,
  mergeEnVentaHubLanding,
  mergeEnVentaPublishHub,
  parseEnVentaPatch,
} from "@/app/lib/clasificados/mergeClasificadosCategoryContent";
import type { ClasificadosEnVentaContentPatch } from "@/app/lib/clasificados/clasificadosCategoryContentTypes";
import type { EnVentaDetailFieldCopyMap } from "@/app/lib/clasificados/enVentaDetailFieldUiTypes";

const SECTION = "clasificados_category_content" as const;
const SLUG = "en-venta";

async function loadEnVentaPatch(): Promise<ClasificadosEnVentaContentPatch | null> {
  const { payload } = await getSiteSectionPayload(SECTION);
  const root = payload as unknown as ClasificadosCategoryContentRootPayload;
  const raw = extractCategoryPatch(root, SLUG);
  return parseEnVentaPatch(raw);
}

export async function getMergedEnVentaHubLanding(lang: "es" | "en") {
  const patch = await loadEnVentaPatch();
  return mergeEnVentaHubLanding(lang, patch);
}

export async function getMergedEnVentaPublishHub(lang: "es" | "en") {
  const patch = await loadEnVentaPatch();
  return mergeEnVentaPublishHub(lang, patch);
}

export async function getEnVentaContentPatchForAdmin(): Promise<ClasificadosEnVentaContentPatch | null> {
  return loadEnVentaPatch();
}

/** Merged labels / placeholders / help for the live En Venta publish wizards (Free + Pro). */
export async function getMergedEnVentaDetailFieldsUi(lang: "es" | "en"): Promise<EnVentaDetailFieldCopyMap> {
  const patch = await loadEnVentaPatch();
  const rows = DETAIL_FIELDS["en-venta"] ?? [];
  const out: EnVentaDetailFieldCopyMap = {};
  for (const row of rows) {
    const m = mergeDetailFieldPatch(row.label, row.placeholder, patch?.detailFields?.[row.key], lang);
    out[row.key] = {
      label: m.label,
      ...(m.placeholder ? { placeholder: m.placeholder } : {}),
      ...(m.help ? { help: m.help } : {}),
    };
  }
  return out;
}
