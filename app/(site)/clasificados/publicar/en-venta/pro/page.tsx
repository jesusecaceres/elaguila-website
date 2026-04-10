import { Suspense } from "react";
import { getMergedEnVentaDetailFieldsUi } from "@/app/lib/clasificados/enVentaCategoryContentServer";
import { EnVentaDetailFieldCopyProvider } from "@/app/clasificados/en-venta/publish/EnVentaDetailFieldCopyContext";
import LeonixEnVentaProApplication from "./application/LeonixEnVentaProApplication";

export const dynamic = "force-dynamic";

export default async function EnVentaProPublishPage(props: { searchParams?: Promise<{ lang?: string }> }) {
  const sp = (await props.searchParams) ?? {};
  const lang = sp.lang === "en" ? "en" : "es";
  const detailFieldsUi = await getMergedEnVentaDetailFieldsUi(lang);

  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#0f0f0f] pt-24 text-sm font-medium text-white/70">
          Cargando…
        </main>
      }
    >
      <EnVentaDetailFieldCopyProvider value={detailFieldsUi}>
        <LeonixEnVentaProApplication />
      </EnVentaDetailFieldCopyProvider>
    </Suspense>
  );
}
