import type { Metadata } from "next";
import { Suspense } from "react";
import { AutosLiveVehicleClient } from "./AutosLiveVehicleClient";
import { getActiveLiveAutosBundle } from "@/app/lib/clasificados/autos/autosClassifiedsListingService";
import { resolveClasificadosPublishLangFromSearchParams } from "@/app/lib/clasificados/clasificadosPublishLang";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ lang?: string }>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { id } = await params;
  const sp = (await searchParams) ?? {};
  const { copyLang: lang } = resolveClasificadosPublishLangFromSearchParams(sp);
  const bundle = await getActiveLiveAutosBundle(id, lang);
  if (!bundle) {
    return { title: lang === "es" ? "Vehículo | Leonix Autos" : "Vehicle | Leonix Autos" };
  }
  const row = bundle.publicRow;
  return {
    title: `${row.vehicleTitle} | Leonix Autos`,
    description: `${row.vehicleTitle} · ${row.city}, ${row.state}`,
  };
}

export default async function ClasificadosAutosLiveVehiclePage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = (await searchParams) ?? {};
  const { copyLang: lang } = resolveClasificadosPublishLangFromSearchParams(sp);
  return (
    <Suspense fallback={<div className="min-h-screen bg-[color:var(--lx-page)]" aria-busy="true" />}>
      <AutosLiveVehicleClient listingId={id} lang={lang} />
    </Suspense>
  );
}
