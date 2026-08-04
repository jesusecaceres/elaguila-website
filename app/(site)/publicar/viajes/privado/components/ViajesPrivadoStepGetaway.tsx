"use client";

import type {
  ViajesOfferKind,
  ViajesOfferModelV2,
} from "@/app/(site)/clasificados/viajes/lib/v2/viajesOfferModelV2";
import { ViajesDateRangeFields } from "../../components/ViajesDateRangeFields";

const LABEL = "block text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]";
const INPUT = "w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-[color:var(--lx-text)]";
const CARD =
  "rounded-[20px] border border-black/10 bg-[color:var(--lx-page)] p-4 shadow-[0_8px_28px_-12px_rgba(42,36,22,0.08)] sm:p-5";

const OFFER_KINDS: { value: ViajesOfferKind; es: string; en: string }[] = [
  { value: "day_activity", es: "Actividad de un día", en: "Day activity" },
  { value: "day_trip", es: "Viaje de un día", en: "Day trip" },
  { value: "weekend_getaway", es: "Escapada de fin de semana", en: "Weekend getaway" },
  { value: "tour_excursion", es: "Tour / excursión", en: "Tour / excursion" },
  { value: "cruise", es: "Crucero", en: "Cruise" },
  { value: "resort_hotel", es: "Resort / hotel", en: "Resort / hotel" },
  { value: "vacation_rental", es: "Renta vacacional", en: "Vacation rental" },
  { value: "vacation_package", es: "Paquete vacacional", en: "Vacation package" },
  { value: "group_trip", es: "Viaje grupal", en: "Group trip" },
  { value: "transportation_transfer", es: "Transporte / traslado", en: "Transportation / transfer" },
  { value: "flight_inclusive_package", es: "Paquete con vuelo", en: "Flight-inclusive package" },
  { value: "car_rental", es: "Renta de auto", en: "Car rental" },
  { value: "other", es: "Otro", en: "Other" },
];

type Props = {
  offer: ViajesOfferModelV2;
  onChange: (offer: ViajesOfferModelV2) => void;
  lang?: "es" | "en";
};

export function ViajesPrivadoStepGetaway({ offer, onChange, lang = "es" }: Props) {
  const es = lang !== "en";
  const patchBasics = (partial: Partial<ViajesOfferModelV2["basics"]>) =>
    onChange({ ...offer, basics: { ...offer.basics, ...partial } });
  const patchPricing = (partial: Partial<ViajesOfferModelV2["pricing"]>) =>
    onChange({ ...offer, pricing: { ...offer.pricing, ...partial } });

  return (
    <div className="space-y-5">
      <section className={`${CARD} space-y-4`}>
        <div>
          <label className={LABEL} htmlFor="vx-prv-offerKind">
            {es ? "Tipo de oferta" : "Offer kind"}
          </label>
          <select
            id="vx-prv-offerKind"
            className={`${INPUT} mt-1`}
            value={offer.offerKind}
            onChange={(e) => onChange({ ...offer, offerKind: e.target.value as ViajesOfferKind })}
          >
            {OFFER_KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {es ? k.es : k.en}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={LABEL} htmlFor="vx-prv-title">
            {es ? "Título" : "Title"}
          </label>
          <input
            id="vx-prv-title"
            className={`${INPUT} mt-1`}
            value={offer.basics.title}
            onChange={(e) => patchBasics({ title: e.target.value })}
            placeholder={es ? "Ej. Cupo en tour a Las Vegas" : "e.g. Spot on a Las Vegas tour"}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL} htmlFor="vx-prv-dest">
              {es ? "Destino" : "Destination"}
            </label>
            <input
              id="vx-prv-dest"
              className={`${INPUT} mt-1`}
              value={offer.basics.destinationLabel}
              onChange={(e) => patchBasics({ destinationLabel: e.target.value })}
            />
          </div>
          <div>
            <label className={LABEL} htmlFor="vx-prv-dep">
              {es ? "Salida" : "Departure"}
            </label>
            <input
              id="vx-prv-dep"
              className={`${INPUT} mt-1`}
              value={offer.basics.departureLabel}
              onChange={(e) => patchBasics({ departureLabel: e.target.value })}
            />
          </div>
          <div>
            <label className={LABEL} htmlFor="vx-prv-dur">
              {es ? "Duración" : "Duration"}
            </label>
            <input
              id="vx-prv-dur"
              className={`${INPUT} mt-1`}
              value={offer.basics.durationLabel}
              onChange={(e) => patchBasics({ durationLabel: e.target.value })}
            />
          </div>
          <div>
            <label className={LABEL} htmlFor="vx-prv-price">
              {es ? "Precio" : "Price"}
            </label>
            <input
              id="vx-prv-price"
              className={`${INPUT} mt-1`}
              value={offer.pricing.priceFrom}
              onChange={(e) => patchPricing({ priceFrom: e.target.value })}
            />
          </div>
        </div>
      </section>

      <section className={CARD}>
        <p className={`${LABEL} mb-3`}>{es ? "Fechas" : "Dates"}</p>
        <ViajesDateRangeFields
          lang={lang}
          dateMode={offer.schedule.dateMode}
          fechaInicio={offer.schedule.startDate}
          fechaFin={offer.schedule.endDate}
          fechasNota={offer.schedule.note}
          fechas={offer.schedule.legacyFechas}
          onPatch={(p) =>
            onChange({
              ...offer,
              schedule: {
                ...offer.schedule,
                ...(p.dateMode !== undefined ? { dateMode: p.dateMode } : {}),
                ...(p.fechaInicio !== undefined ? { startDate: p.fechaInicio } : {}),
                ...(p.fechaFin !== undefined ? { endDate: p.fechaFin } : {}),
                ...(p.fechasNota !== undefined ? { note: p.fechasNota } : {}),
                ...(p.fechas !== undefined ? { legacyFechas: p.fechas } : {}),
              },
            })
          }
          copy={{
            modeFixed: es ? "Fechas fijas" : "Fixed dates",
            modeFlexible: es ? "Flexible" : "Flexible",
            modeSeasonal: es ? "Temporada" : "Seasonal",
            start: es ? "Inicio" : "Start",
            end: es ? "Fin" : "End",
            note: es ? "Nota de fechas" : "Date note",
            previewHint: es ? "Vista previa:" : "Preview:",
          }}
        />
      </section>

      <section className={`${CARD} space-y-3`}>
        <p className={LABEL}>{es ? "Público (opcional)" : "Audience (optional)"}</p>
        {(
          [
            ["audienceFamilies", es ? "Familias" : "Families"],
            ["audienceCouples", es ? "Parejas" : "Couples"],
            ["audienceGroups", es ? "Grupos" : "Groups"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex cursor-pointer items-center gap-2 text-sm text-[color:var(--lx-text)]">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-black/20"
              checked={offer.basics[key]}
              onChange={(e) => patchBasics({ [key]: e.target.checked })}
            />
            {label}
          </label>
        ))}
      </section>
    </div>
  );
}
