import { Suspense } from "react";
import { getMergedEnVentaDetailFieldsUi } from "@/app/lib/clasificados/enVentaCategoryContentServer";
import { EnVentaDetailFieldCopyProvider } from "@/app/clasificados/en-venta/publish/EnVentaDetailFieldCopyContext";
import LeonixEnVentaFreeApplication from "./application/LeonixEnVentaFreeApplication";

export const dynamic = "force-dynamic";

export default async function EnVentaFreePublishPage(props: { searchParams?: Promise<{ lang?: string }> }) {
  const sp = (await props.searchParams) ?? {};
  const lang = sp.lang === "en" ? "en" : "es";
  const detailFieldsUi = await getMergedEnVentaDetailFieldsUi(lang);

  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#D9D9D9] pt-24 text-sm font-medium text-[#111111]/70">
          Cargando…
        </main>
      }
    >
      <EnVentaDetailFieldCopyProvider value={detailFieldsUi}>
        <LeonixEnVentaFreeApplication />
      </EnVentaDetailFieldCopyProvider>
    </Suspense>
  );
}
