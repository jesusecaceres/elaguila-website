import { Suspense } from "react";
import { getMergedEnVentaDetailFieldsUi } from "@/app/lib/clasificados/enVentaCategoryContentServer";
import { EnVentaDetailFieldCopyProvider } from "@/app/clasificados/en-venta/publish/EnVentaDetailFieldCopyContext";
import { resolveClasificadosPublishLangFromSearchParams } from "@/app/lib/clasificados/clasificadosPublishLang";
import LeonixEnVentaProApplication from "./application/LeonixEnVentaProApplication";

export const dynamic = "force-dynamic";

export default async function EnVentaProPublishPage(props: { searchParams?: Promise<{ lang?: string }> }) {
  const sp = (await props.searchParams) ?? {};
  const { copyLang } = resolveClasificadosPublishLangFromSearchParams(sp);
  const detailFieldsUi = await getMergedEnVentaDetailFieldsUi(copyLang);

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
