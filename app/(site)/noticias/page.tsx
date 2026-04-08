import { Suspense } from "react";
import { getSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import { mergeNoticiasPagePayload } from "@/app/lib/siteSectionContent/noticiasPageMerge";
import { NoticiasPageClient } from "./NoticiasPageClient";

export const dynamic = "force-dynamic";

export default async function NoticiasPage() {
  const { payload } = await getSiteSectionPayload("noticias_page");
  const shell = mergeNoticiasPagePayload(payload);

  return (
    <Suspense fallback={null}>
      <NoticiasPageClient shell={shell} />
    </Suspense>
  );
}
