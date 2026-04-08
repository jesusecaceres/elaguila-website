import type { Metadata } from "next";
import { Suspense } from "react";
import { AutosLiveVehicleClient } from "./AutosLiveVehicleClient";
import { getAutosPublicListingById } from "../../data/sampleAutosPublicInventory";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const row = getAutosPublicListingById(id);
  if (!row) {
    return { title: "Vehículo | Leonix Autos" };
  }
  return {
    title: `${row.vehicleTitle} | Leonix Autos`,
    description: `${row.vehicleTitle} · ${row.city}, ${row.state}`,
  };
}

export default async function ClasificadosAutosLiveVehiclePage({ params }: Props) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="min-h-screen bg-[color:var(--lx-page)]" aria-busy="true" />}>
      <AutosLiveVehicleClient listingId={id} />
    </Suspense>
  );
}
