import { getSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import { mergeCuponesPagePayload } from "@/app/lib/siteSectionContent/cuponesPageMerge";
import { CuponesPageClient } from "./CuponesPageClient";

export const dynamic = "force-dynamic";

export default async function CuponesPage() {
  const { payload } = await getSiteSectionPayload("cupones_page");
  const merged = mergeCuponesPagePayload(payload);
  return <CuponesPageClient lang="es" merged={merged} />;
}
