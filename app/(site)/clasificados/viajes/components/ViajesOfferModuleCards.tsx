import type { ViajesTravelModule, ViajesItineraryItem } from "../lib/v2/viajesOfferModelV2";

function ModuleShell({
  kindLabel,
  title,
  description,
  lines,
}: {
  kindLabel: string;
  title: string;
  description?: string;
  lines: string[];
}) {
  const filled = lines.filter(Boolean);
  return (
    <li className="rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)]/40 p-3.5 text-sm sm:p-4">
      <p className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">{kindLabel}</p>
      <p className="mt-1 font-semibold text-[color:var(--lx-text)]">{title}</p>
      {description?.trim() ? <p className="mt-1 text-[color:var(--lx-text-2)]">{description}</p> : null}
      {filled.length ? (
        <ul className="mt-2 space-y-1 text-xs text-[color:var(--lx-muted)]">
          {filled.map((line) => (
            <li key={line}>• {line}</li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function kindLabel(kind: ViajesTravelModule["kind"], lang: "es" | "en"): string {
  const es: Record<ViajesTravelModule["kind"], string> = {
    accommodation: "Alojamiento",
    transportation: "Transporte",
    food: "Comidas",
    activity: "Actividad",
    cruise: "Crucero",
    flight: "Vuelo",
    vacation_rental: "Renta vacacional",
    car_rental: "Auto de renta",
    addon: "Extra",
  };
  const en: Record<ViajesTravelModule["kind"], string> = {
    accommodation: "Accommodation",
    transportation: "Transportation",
    food: "Food",
    activity: "Activity",
    cruise: "Cruise",
    flight: "Flight",
    vacation_rental: "Vacation rental",
    car_rental: "Car rental",
    addon: "Add-on",
  };
  return lang === "en" ? en[kind] : es[kind];
}

function moduleTitle(m: ViajesTravelModule): string {
  switch (m.kind) {
    case "accommodation":
      return m.propertyType || m.kind;
    case "transportation":
      return m.mode || m.provider || m.kind;
    case "food":
      return m.mealPlanOrName || m.kind;
    case "activity":
      return m.activityName || m.kind;
    case "cruise":
      return m.ship || m.kind;
    case "flight":
      return m.airline || m.kind;
    case "vacation_rental":
      return m.propertyType || m.kind;
    case "car_rental":
      return m.vehicleClass || m.provider || m.kind;
    case "addon":
      return m.name || m.kind;
  }
}

function moduleLines(m: ViajesTravelModule): string[] {
  switch (m.kind) {
    case "accommodation":
      return [m.roomOrOccupancy, m.nights ? `${m.nights} noches` : ""].filter(Boolean);
    case "transportation":
      return [m.provider, [m.origin, m.destination].filter(Boolean).join(" → ")].filter(Boolean);
    case "food":
      return [m.quantityOrFrequency, m.dietaryNote].filter(Boolean);
    case "activity":
      return [m.venue, m.duration, m.dateTime, m.locationLabel].filter(Boolean);
    case "cruise":
      return [m.departurePort, m.returnPort, m.nights, m.cabinNote, m.portsStops].filter(Boolean);
    case "flight":
      return [[m.origin, m.destination].filter(Boolean).join(" → "), m.cabinBaggageNote, m.connectionNote].filter(Boolean);
    case "vacation_rental":
      return [m.capacity, m.bedrooms, m.baths, m.amenitiesNote].filter(Boolean);
    case "car_rental":
      return [
        m.pickupLocation,
        m.dropoffLocation,
        m.dateWindow,
        m.capacity,
        m.startingPrice,
        m.mileageSummary,
        m.fuelSummary,
      ].filter(Boolean);
    case "addon":
      return [m.priceOrIncluded].filter(Boolean);
  }
}

export function ViajesOfferModuleCards({
  modules,
  lang = "es",
}: {
  modules: ViajesTravelModule[];
  lang?: "es" | "en";
}) {
  if (!modules.length) return null;
  return (
    <section className="overflow-hidden rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-5 shadow-sm sm:p-8">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[color:var(--lx-burgundy)]">
        {lang === "en" ? "Trip details" : "Detalle del viaje"}
      </h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {modules.map((m) => (
          <ModuleShell
            key={m.id}
            kindLabel={kindLabel(m.kind, lang)}
            title={moduleTitle(m)}
            description={m.description}
            lines={moduleLines(m)}
          />
        ))}
      </ul>
    </section>
  );
}

export function ViajesOfferItinerarySection({
  items,
  lang = "es",
}: {
  items: ViajesItineraryItem[];
  lang?: "es" | "en";
}) {
  const filled = items.filter((i) => i.title.trim() || i.description.trim() || i.dayLabel.trim());
  if (!filled.length) return null;
  return (
    <section className="overflow-hidden rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-5 shadow-sm sm:p-8">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[color:var(--lx-burgundy)]">
        {lang === "en" ? "Itinerary" : "Itinerario"}
      </h2>
      <ol className="mt-4 space-y-3">
        {filled.map((item) => (
          <li key={item.id} className="rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)]/40 p-4">
            {item.dayLabel.trim() ? (
              <p className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">{item.dayLabel}</p>
            ) : null}
            {item.title.trim() ? <p className="mt-1 font-semibold text-[color:var(--lx-text)]">{item.title}</p> : null}
            {item.locationLabel.trim() ? (
              <p className="mt-0.5 text-xs text-[color:var(--lx-muted)]">{item.locationLabel}</p>
            ) : null}
            {item.description.trim() ? (
              <p className="mt-2 text-sm text-[color:var(--lx-text-2)]">{item.description}</p>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
