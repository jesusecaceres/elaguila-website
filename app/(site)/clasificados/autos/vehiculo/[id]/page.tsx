import type { Metadata } from "next";
import { Suspense } from "react";
import { AutosLiveVehicleClient } from "./AutosLiveVehicleClient";
import { getActiveLiveAutosBundle } from "@/app/lib/clasificados/autos/autosClassifiedsListingService";
import { resolveClasificadosPublishLangFromSearchParams } from "@/app/lib/clasificados/clasificadosPublishLang";
import { autosVehicleJsonLd } from "../../seo/autosVehicleJsonLd";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ lang?: string }>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { id } = await params;
  const sp = (await searchParams) ?? {};
  const { copyLang: lang } = resolveClasificadosPublishLangFromSearchParams(sp);
  const bundle = await getActiveLiveAutosBundle(id, lang);
  const canonical = `/clasificados/autos/vehiculo/${encodeURIComponent(id)}`;
  if (!bundle) {
    return {
      title: lang === "es" ? "Vehículo | Leonix Autos" : "Vehicle | Leonix Autos",
      alternates: { canonical },
      robots: { index: false, follow: false },
    };
  }
  const row = bundle.publicRow;
  const title = `${row.vehicleTitle} | Leonix Autos`;
  const description = `${row.vehicleTitle} · ${row.city}, ${row.state}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      images: row.primaryImageUrl ? [{ url: row.primaryImageUrl }] : undefined,
    },
  };
}

export default async function ClasificadosAutosLiveVehiclePage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = (await searchParams) ?? {};
  const { copyLang: lang } = resolveClasificadosPublishLangFromSearchParams(sp);
  // Package F Build F2, Gate 15 (P1 SEO fix) — real Vehicle structured data, sourced from the
  // same published row generateMetadata() already reads above.
  const bundle = await getActiveLiveAutosBundle(id, lang);
  const row = bundle?.publicRow;
  const jsonLd = row
    ? autosVehicleJsonLd({
        title: row.vehicleTitle,
        url: `/clasificados/autos/vehiculo/${encodeURIComponent(id)}`,
        imageUrl: row.primaryImageUrl || undefined,
        price: row.price,
        year: row.year,
        make: row.make,
        model: row.model,
        mileage: row.mileage,
        bodyStyle: row.bodyStyle || undefined,
        transmission: row.transmission || undefined,
        driveWheelConfiguration: row.drivetrain || undefined,
        fuelType: row.fuelType || undefined,
        color: row.exteriorColor,
        city: row.city,
        state: row.state,
      })
    : null;
  return (
    <Suspense fallback={<div className="min-h-screen bg-[color:var(--lx-page)]" aria-busy="true" />}>
      {jsonLd ? (
        <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      ) : null}
      <AutosLiveVehicleClient listingId={id} lang={lang} />
    </Suspense>
  );
}
