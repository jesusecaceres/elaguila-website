"use client";

import type { Dispatch, SetStateAction } from "react";
import {
  aiCardClass,
  aiHintClass,
  aiSubClass,
  aiTitleClass,
  AiField,
} from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/application/formPrimitives";
import type { RentasShowingFormSlice } from "@/app/clasificados/rentas/lib/leonixRentasShowing";
import { getLaunchUiMessages } from "@/app/lib/i18n/launchUiDictionaries";
import type { OfficialLocale } from "@/app/lib/language";

type Props<T extends RentasShowingFormSlice> = {
  state: T;
  setState: Dispatch<SetStateAction<T>>;
  fieldClass: string;
  textareaFieldClass: string;
  lang: OfficialLocale;
};

export function RentasShowingTourSection<T extends RentasShowingFormSlice>({
  state,
  setState,
  fieldClass,
  textareaFieldClass,
  lang,
}: Props<T>) {
  const s = getLaunchUiMessages(lang).rentas.showings;

  return (
    <section className={`${aiCardClass} min-w-0`}>
      <h2 className={aiTitleClass}>{s.sectionTitle}</h2>
      <p className={aiSubClass}>{s.optionalHint}</p>
      <div className="mt-5 grid min-w-0 gap-4 sm:gap-5">
        <AiField label={s.byAppointment} hint={s.byAppointmentHint}>
          <label className="flex min-h-[44px] items-center gap-3 rounded-xl border border-[#E8DFD0] bg-[#FFFCF7] px-3 py-2 text-sm text-[#2C2416]">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={Boolean(state.showingByAppointment)}
              onChange={(e) => setState((st) => ({ ...st, showingByAppointment: e.target.checked }))}
            />
            <span className="min-w-0">{s.byAppointmentCheckbox}</span>
          </label>
        </AiField>
        <AiField label={s.availability} hint={s.availabilityHint}>
          <input
            className={fieldClass}
            value={state.showingAvailability}
            onChange={(e) => setState((st) => ({ ...st, showingAvailability: e.target.value }))}
            placeholder={s.availabilityPlaceholder}
          />
        </AiField>
        <AiField label={s.instructions} hint={s.instructionsHint}>
          <textarea
            className={textareaFieldClass}
            rows={3}
            value={state.showingInstructions}
            onChange={(e) => setState((st) => ({ ...st, showingInstructions: e.target.value }))}
            placeholder={s.instructionsPlaceholder}
          />
        </AiField>
        <AiField label={s.virtualTour} hint={s.virtualTourHint}>
          <input
            className={fieldClass}
            type="url"
            inputMode="url"
            value={state.virtualTourUrl}
            onChange={(e) => setState((st) => ({ ...st, virtualTourUrl: e.target.value }))}
            placeholder="https://…"
          />
          <p className={aiHintClass}>{s.invalidHttps}</p>
        </AiField>
      </div>
    </section>
  );
}
