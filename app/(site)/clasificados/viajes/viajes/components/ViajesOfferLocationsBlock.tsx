import type { ViajesLocationsV2 } from "../lib/v2/viajesOfferModelV2";
import { viajesCanShowPublicMap, viajesPublicAddressLabel, viajesPublicMapQuery } from "../lib/viajesPublicLocation";

export function ViajesOfferLocationsBlock({
  locations,
  lane,
  lang = "es",
}: {
  locations: ViajesLocationsV2;
  lane: "affiliate" | "business" | "private" | "editorial";
  lang?: "es" | "en";
}) {
  const destination = viajesPublicAddressLabel(locations.destination);
  const departure = viajesPublicAddressLabel(locations.departureMeetingPort);
  const office = lane === "business" || lane === "affiliate" ? viajesPublicAddressLabel(locations.providerOffice) : "";
  // Never surface privateExact publicly
  const mapAddr =
    lane === "private"
      ? locations.destination.showPublicly && locations.destination.showMap
        ? locations.destination
        : null
      : locations.providerOffice.showPublicly && locations.providerOffice.showMap
        ? locations.providerOffice
        : locations.destination.showPublicly && locations.destination.showMap
          ? locations.destination
          : null;
  const showMap = mapAddr ? viajesCanShowPublicMap(mapAddr) : false;

  if (!destination && !departure && !office && !showMap) return null;

  return (
    <section className="overflow-hidden rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-5 shadow-sm sm:p-8">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[color:var(--lx-burgundy)]">
        {lang === "en" ? "Location" : "Ubicación"}
      </h2>
      <ul className="mt-4 space-y-2 text-sm text-[color:var(--lx-text-2)]">
        {destination ? (
          <li>
            <span className="font-semibold text-[color:var(--lx-text)]">{lang === "en" ? "Destination: " : "Destino: "}</span>
            {destination}
          </li>
        ) : null}
        {departure ? (
          <li>
            <span className="font-semibold text-[color:var(--lx-text)]">{lang === "en" ? "Departure: " : "Salida: "}</span>
            {departure}
          </li>
        ) : null}
        {office ? (
          <li>
            <span className="font-semibold text-[color:var(--lx-text)]">{lang === "en" ? "Office: " : "Oficina: "}</span>
            {office}
          </li>
        ) : null}
      </ul>
      {showMap && mapAddr ? (
        <div className="mt-4 overflow-hidden rounded-xl border border-[color:var(--lx-nav-border)]">
          <iframe
            title={lang === "en" ? "Public location map" : "Mapa de ubicación pública"}
            className="h-56 w-full bg-[color:var(--lx-section)]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://maps.google.com/maps?q=${viajesPublicMapQuery(mapAddr)}&z=12&output=embed`}
          />
          <p className="border-t border-[color:var(--lx-nav-border)] px-3 py-2 text-[11px] text-[color:var(--lx-muted)]">
            {viajesPublicAddressLabel(mapAddr)}
          </p>
        </div>
      ) : null}
    </section>
  );
}
