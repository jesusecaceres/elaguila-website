import { Suspense } from "react";
import { getPublishChooserCategoryKeys } from "@/app/lib/clasificados/categoryChooserServer";
import PublicarGatewayClient from "./PublicarGatewayClient";

/**
 * Gate I.5.2 — modern canonical publish gateway. Reuses the exact same DB-backed readiness
 * source the old `/clasificados/publicar` chooser used (`getPublishChooserCategoryKeys()`) —
 * this gate does not introduce a second readiness mechanism.
 */
export const dynamic = "force-dynamic";

export default async function PublicarGatewayPage() {
  const chooserKeys = await getPublishChooserCategoryKeys();
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F6F0E2] pt-28 pb-16">
          <div className="mx-auto max-w-6xl px-6 text-sm text-[#5D4A25]">Cargando…</div>
        </main>
      }
    >
      <PublicarGatewayClient chooserKeys={chooserKeys} />
    </Suspense>
  );
}
