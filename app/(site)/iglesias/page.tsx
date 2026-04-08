import { Suspense } from "react";
import { getSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import { mergeIglesiasPagePayload } from "@/app/lib/siteSectionContent/iglesiasPageMerge";
import { IglesiasPageClient } from "./IglesiasPageClient";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { payload } = await getSiteSectionPayload("iglesias_page");
  const shell = mergeIglesiasPagePayload(payload);

  return (
    <Suspense fallback={null}>
      <IglesiasPageClient shell={shell} />
    </Suspense>
  );
}
