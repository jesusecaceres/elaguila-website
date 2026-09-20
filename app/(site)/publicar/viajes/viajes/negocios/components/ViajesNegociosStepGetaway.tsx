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

export function ViajesNegociosStepGetaway({ offer, onChange, lang = "es" }: Props) {
  const es = lang !== "en";
  const patchBasics = (partial: Partial<ViajesOfferModelV2["basics"]>) =>
    onChange({ ...offer, basics: { ...offer.basics, ...partial } });
  const patchPricing = (partial: Partial<ViajesOfferModelV2["pricing"]>) =>
    onChange({ ...offer, pricing: { ...offer.pricing, ...partial } });

  return (
    <div className="space-y-5">
      <section className={`${CARD} space-y-4`}>
        <div>
          <label className={LABEL} htmlFor="vx-biz-offerKind">
            {es ? "Tipo de oferta" : "Offer kind"}
          </label>
          <select
            id="vx-biz-offerKind"
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
          <label className={LABEL} htmlFor="vx-biz-title">
            {es ? "Título" : "Title"}
          </label>
          <input
            id="vx-biz-title"
            className={`${INPUT} mt-1`}
            value={offer.basics.title}
            onChange={(e) => patchBasics({ title: e.target.value })}
            placeholder={es ? "Ej. Cancún all-inclusive 4 noches" : "e.g. Cancun all-inclusive 4 nights"}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL} htmlFor="vx-biz-dest">
              {es ? "Destino" : "Destination"}
            </label>
            <input
              id="vx-biz-dest"
              className={`${INPUT} mt-1`}
              value={offer.basics.destinationLabel}
              onChange={(e) => patchBasics({ destinationLabel: e.target.value })}
            />
          </div>
          <div>
            <label className={LABEL} htmlFor="vx-biz-dep">
              {es ? "Salida / meeting point" : "Departure / meeting point"}
            </label>
            <input
              id="vx-biz-dep"
              className={`${INPUT} mt-1`}
              value={offer.basics.departureLabel}
              onChange={(e) => patchBasics({ departureLabel: e.target.value })}
            />
          </div>
          <div>
            <label className={LABEL} htmlFor="vx-biz-dur">
              {es ? "Duración" : "Duration"}
            </label>
            <input
              id="vx-biz-dur"
              className={`${INPUT} mt-1`}
              value={offer.basics.durationLabel}
              onChange={(e) => patchBasics({ durationLabel: e.target.value })}
              placeholder={es ? "Ej. 4 noches / 5 días" : "e.g. 4 nights / 5 days"}
            />
          </div>
          <div>
            <label className={LABEL} htmlFor="vx-biz-price">
              {es ? "Precio desde" : "Price from"}
            </label>
            <input
              id="vx-biz-price"
              className={`${INPUT} mt-1`}
              value={offer.pricing.priceFrom}
              onChange={(e) => patchPricing({ priceFrom: e.target.value })}
              placeholder={es ? "Ej. $899 USD" : "e.g. $899 USD"}
            />
          </div>
        </div>

        <div>
          <label className={LABEL} htmlFor="vx-biz-budget">
            {es ? "Rango de presupuesto" : "Budget band"}
          </label>
          <select
            id="vx-biz-budget"
            className={`${INPUT} mt-1`}
            value={offer.pricing.budgetBand}
            onChange={(e) =>
              patchPricing({
                budgetBand: e.target.value as ViajesOfferModelV2["pricing"]["budgetBand"],
              })
            }
          >
            <option value="">{es ? "Sin especificar" : "Not specified"}</option>
            <option value="economico">{es ? "Económico" : "Economy"}</option>
            <option value="moderado">{es ? "Moderado" : "Moderate"}</option>
            <option value="premium">Premium</option>
          </select>
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
        <p className={LABEL}>{es ? "Público" : "Audience"}</p>
        {(
          [
            ["audienceFamilies", es ? "Familias" : "Families"],
            ["audienceCouples", es ? "Parejas" : "Couples"],
            ["audienceGroups", es ? "Grupos" : "Groups"],
            ["spanishGuide", es ? "Guía en español" : "Spanish guide"],
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
        <div>
          <label className={LABEL} htmlFor="vx-biz-svc-lang">
            {es ? "Idioma de atención" : "Service language"}
          </label>
          <input
            id="vx-biz-svc-lang"
            className={`${INPUT} mt-1`}
            value={offer.basics.serviceLanguage}
            onChange={(e) => patchBasics({ serviceLanguage: e.target.value })}
          />
        </div>
      </section>
    </div>
  );
}
