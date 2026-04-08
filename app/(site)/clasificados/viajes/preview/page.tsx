import Navbar from "@/app/components/Navbar";

import { ViajesOfferDetailLayout } from "../components/ViajesOfferDetailLayout";
import { VIAJES_PREVIEW_OFFER } from "../data/viajesPreviewSampleData";

export default function ClasificadosViajesPreviewPage() {
  return (
    <div className="min-h-screen bg-[color:var(--lx-page)] text-[color:var(--lx-text)]">
      <Navbar />
      <ViajesOfferDetailLayout offer={VIAJES_PREVIEW_OFFER} backHref="/publicar/viajes/negocios" preview />
    </div>
  );
}
