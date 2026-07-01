"use client";

import type { AgenteIndividualResidencialFormState } from "@/app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteIndividualResidencialFormState";
import CityAutocomplete from "@/app/components/CityAutocomplete";
import {
  BR_COUNTRY_SUGGESTIONS,
  BR_US_STATE_DATALIST_OPTIONS,
  isBrUsCountry,
  resolveBrUsStateInput,
} from "@/app/lib/clasificados/bienes-raices/brLocationHelpers";
import { AiField, aiInputClass } from "@/app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/formPrimitives";

type LocationCopy = {
  ciudad: string;
  ciudadHint: string;
  ciudadPlaceholder: string;
  direccionEstado: string;
  direccionEstadoHint: string;
  direccionEstadoHintIntl: string;
  direccionPais: string;
  direccionPaisHint: string;
  direccionCodigoPostal: string;
  direccionCodigoPostalHint: string;
  direccionCodigoPostalHintIntl: string;
  area: string;
  areaHint: string;
};

type Props = {
  state: AgenteIndividualResidencialFormState;
  setState: React.Dispatch<React.SetStateAction<AgenteIndividualResidencialFormState>>;
  lang: "es" | "en";
  copy: LocationCopy;
};

export function BrAgenteLocationFormFields({ state, setState, lang, copy }: Props) {
  const usCountry = isBrUsCountry(state.direccionPais);
  const postalHint = copy.direccionCodigoPostalHint;

  return (
    <>
      <AiField label={copy.direccionPais} hint={copy.direccionPaisHint}>
        <input
          className={aiInputClass}
          list="br-agente-country-suggestions"
          value={state.direccionPais}
          onChange={(ev) => setState((s) => ({ ...s, direccionPais: ev.target.value }))}
          autoComplete="country-name"
          placeholder={lang === "en" ? "United States" : "Estados Unidos"}
        />
        <datalist id="br-agente-country-suggestions">
          {BR_COUNTRY_SUGGESTIONS.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </AiField>
      <AiField label={copy.ciudad} hint={copy.ciudadHint}>
        <CityAutocomplete
          value={state.ciudad}
          onChange={(v) => setState((s) => ({ ...s, ciudad: v }))}
          lang={lang}
          variant="brForm"
          freeText
          placeholder={copy.ciudadPlaceholder}
          className="w-full"
        />
      </AiField>
      <AiField label={copy.direccionEstado} hint={usCountry ? copy.direccionEstadoHint : copy.direccionEstadoHintIntl}>
        {usCountry ? (
          <>
            <input
              className={aiInputClass}
              list="br-agente-us-state-suggestions"
              value={state.direccionEstado}
              onChange={(ev) => setState((s) => ({ ...s, direccionEstado: ev.target.value }))}
              onBlur={(ev) => {
                const resolved = resolveBrUsStateInput(ev.target.value);
                if (resolved !== ev.target.value) {
                  setState((s) => ({ ...s, direccionEstado: resolved }));
                }
              }}
              autoComplete="address-level1"
              placeholder={lang === "en" ? "CA or California" : "CA o California"}
            />
            <datalist id="br-agente-us-state-suggestions">
              {BR_US_STATE_DATALIST_OPTIONS.map(({ code, label }) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </datalist>
          </>
        ) : (
          <input
            className={aiInputClass}
            value={state.direccionEstado}
            onChange={(ev) => setState((s) => ({ ...s, direccionEstado: ev.target.value }))}
            autoComplete="address-level1"
            placeholder={lang === "en" ? "State / province / region" : "Estado / provincia / región"}
          />
        )}
      </AiField>
      <AiField label={copy.direccionCodigoPostal} hint={postalHint}>
        <input
          className={aiInputClass}
          value={state.direccionCodigoPostal}
          onChange={(ev) => setState((s) => ({ ...s, direccionCodigoPostal: ev.target.value }))}
          autoComplete="postal-code"
        />
      </AiField>
      <AiField label={copy.area} hint={copy.areaHint}>
        <input
          className={aiInputClass}
          value={state.areaCiudad}
          onChange={(ev) => setState((s) => ({ ...s, areaCiudad: ev.target.value }))}
          autoComplete="off"
        />
      </AiField>
    </>
  );
}
