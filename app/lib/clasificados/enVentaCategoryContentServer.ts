import "server-only";

import { getSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import type { ClasificadosCategoryContentRootPayload } from "@/app/lib/clasificados/clasificadosCategoryContentTypes";
import {
  extractCategoryPatch,
  mergeEnVentaHubLanding,
  mergeEnVentaPublishHub,
  parseEnVentaPatch,
} from "@/app/lib/clasificados/mergeClasificadosCategoryContent";
import type { ClasificadosEnVentaContentPatch } from "@/app/lib/clasificados/clasificadosCategoryContentTypes";

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
