import { Suspense } from "react";
import { getPublishChooserCategoryKeys } from "@/app/lib/clasificados/categoryChooserServer";
import PublicarPageClient from "./PublicarPageClient";

/** DB-backed chooser keys — avoid static prerender (and flaky worker chunks on some environments). */
export const dynamic = "force-dynamic";

export default async function PublicarRootPage() {
  const chooserKeys = await getPublishChooserCategoryKeys();
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F6F0E2] pt-28 pb-16">
          <div className="mx-auto max-w-6xl px-6 text-sm text-[#5D4A25]">Cargando…</div>
        </main>
      }
    >
      <PublicarPageClient chooserKeys={chooserKeys} />
    </Suspense>
  );
}
