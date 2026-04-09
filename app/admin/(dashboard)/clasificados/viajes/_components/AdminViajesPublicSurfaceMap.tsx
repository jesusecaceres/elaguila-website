import { adminCardBase } from "@/app/admin/_components/adminTheme";

export function AdminViajesPublicSurfaceMap() {
  return (
    <div className={`${adminCardBase} mb-6 border border-sky-200/80 bg-sky-50/70 p-5`}>
      <p className="text-xs font-bold uppercase tracking-wide text-sky-950">Public surface map (affiliate lane)</p>
      <p className="mt-2 text-sm text-[#1E1810]">
        Fields in Affiliate Cards are intentionally shaped to feed the live Viajes experience — not a disconnected spreadsheet.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-sky-100 bg-white/90 p-3 text-xs text-[#2C2416]">
          <p className="font-bold text-sky-950">Landing & rails</p>
          <p className="mt-1 text-[#5C5346]">
            Headline, hero image, price-from, duration, and placement flags map to homepage featured and “top ofertas” rails on{" "}
            <code className="rounded bg-sky-100 px-1">/clasificados/viajes</code>.
          </p>
        </div>
        <div className="rounded-2xl border border-sky-100 bg-white/90 p-3 text-xs text-[#2C2416]">
          <p className="font-bold text-sky-950">Results</p>
          <p className="mt-1 text-[#5C5346]">
            Destination + origin context + “results eligible” drive inclusion on{" "}
            <code className="rounded bg-sky-100 px-1">/clasificados/viajes/resultados</code> once wired.
          </p>
        </div>
        <div className="rounded-2xl border border-sky-100 bg-white/90 p-3 text-xs text-[#2C2416]">
          <p className="font-bold text-sky-950">Offer detail</p>
          <p className="mt-1 text-[#5C5346]">
            Public slug + short description + booking URL become{" "}
            <code className="rounded bg-sky-100 px-1">/clasificados/viajes/oferta/[slug]</code> — outbound partner CTA, not Leonix checkout.
          </p>
        </div>
        <div className="rounded-2xl border border-sky-100 bg-white/90 p-3 text-xs text-[#2C2416]">
          <p className="font-bold text-sky-950">Seasonal & trust</p>
          <p className="mt-1 text-[#5C5346]">
            Campaign ids + audience tags align with Campaigns / Seasonal. Affiliate label fields must remain visible on-card — never mimic user-generated listings.
          </p>
        </div>
      </div>
    </div>
  );
}
