import Navbar from "@/app/components/Navbar";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import {
  resolveClasificadosPublishLangFromSearchParams,
} from "@/app/lib/clasificados/clasificadosPublishLang";

import { ViajesLangSwitch } from "../components/ViajesLangSwitch";
import { ViajesOfferDetailLayout } from "../components/ViajesOfferDetailLayout";
import { VIAJES_PREVIEW_OFFER } from "../data/viajesPreviewSampleData";
import { getViajesUi } from "../data/viajesUiCopy";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ClasificadosViajesPreviewPage({ searchParams }: Props) {
  const sp = await searchParams;
  const { routeLang, copyLang: lang } = resolveClasificadosPublishLangFromSearchParams(sp);
  const ui = getViajesUi(lang);
  const backHref = appendLangToPath("/publicar/viajes/negocios", routeLang);
  const exploreViajesHref = appendLangToPath("/clasificados/viajes", routeLang);

  return (
    <div className="min-h-screen bg-[color:var(--lx-page)] text-[color:var(--lx-text)]">
      <Navbar />
      <div className="border-b border-[color:var(--lx-nav-border)] bg-[color:var(--lx-nav-bg)] px-4 py-2 sm:px-5">
        <div className="mx-auto flex max-w-7xl justify-end">
          <ViajesLangSwitch compact />
        </div>
      </div>
      <ViajesOfferDetailLayout
        offer={VIAJES_PREVIEW_OFFER}
        backHref={backHref}
        backLabel={ui.previewBackToApplication}
        preview
        ui={ui}
        exploreViajesHref={exploreViajesHref}
      />
    </div>
  );
}
