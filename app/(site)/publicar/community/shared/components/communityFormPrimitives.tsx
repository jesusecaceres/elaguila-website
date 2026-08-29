"use client";

import CityAutocomplete from "@/app/components/CityAutocomplete";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import {
  EmpleosFieldLabel,
  EmpleosSectionCard,
} from "@/app/publicar/empleos/shared/ui/empleosFormPrimitives";

import type { CommunityCommonDraft } from "../types/communityQuickDraft";

/**
 * Genuinely category-agnostic form primitives shared by the Comunidad and Clases
 * editors (identical for both — no per-category branching lives here). Category
 * composition itself (field order, sections, taxonomy) is owned by each category's
 * own editor component, not by this file.
 */

export const INPUT = "mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm";

export function ctaLabels(lang: Lang) {
  return lang === "es"
    ? {
        phone: "Teléfono",
        whatsapp: "WhatsApp",
        email: "Correo",
        website: "Sitio web",
        primary: "Acción principal preferida *",
      }
    : {
        phone: "Phone",
        whatsapp: "WhatsApp",
        email: "Email",
        website: "Website",
        primary: "Preferred primary action *",
      };
}

export const MEDIA_COPY = {
  es: {
    urlPh: "https://… (URL de imagen o PDF)",
    addUrl: "Añadir URL",
    upload: "Sube imagen, PDF o archivo del volante",
    main: "Principal",
    remove: "Quitar",
    up: "Arriba",
    down: "Abajo",
    altImage: "Texto alternativo (imagen)",
  },
  en: {
    urlPh: "https://… (image or PDF URL)",
    addUrl: "Add URL",
    upload: "Upload an image, PDF, or flyer file",
    main: "Main",
    remove: "Remove",
    up: "Up",
    down: "Down",
    altImage: "Image alt text",
  },
} as const;

type LocationProps = {
  lang: Lang;
  discoveryLine: string;
  cityHint: string;
  publicCity: string;
  publicCityLabel: string;
  stateLabel: string;
  zipLabel: string;
  venueLabel: string;
  addressLabel: string;
  addressLine2Label: string;
  addressHelperText: string;
  addressPlaceholder: string;
  countryLabel: string;
  zipValue: string;
  venueValue: string;
  addressValue: string;
  addressLine2Value: string;
  stateValue: string;
  countryValue: string;
  sectionTitle: string;
  onChange: (p: Partial<CommunityCommonDraft>) => void;
};

export function LocationSection({
  lang,
  discoveryLine,
  cityHint,
  publicCity,
  publicCityLabel,
  stateLabel,
  zipLabel,
  venueLabel,
  addressLabel,
  addressLine2Label,
  addressHelperText,
  addressPlaceholder,
  countryLabel,
  zipValue,
  venueValue,
  addressValue,
  addressLine2Value,
  stateValue,
  countryValue,
  sectionTitle,
  onChange,
}: LocationProps) {
  return (
    <EmpleosSectionCard title={sectionTitle}>
      <p className="text-xs text-[color:var(--lx-muted)]">{discoveryLine}</p>

      <label className="block text-sm">
        <EmpleosFieldLabel lang={lang} optional>
          {venueLabel}
        </EmpleosFieldLabel>
        <input
          className={INPUT}
          value={venueValue}
          onChange={(e) => onChange({ venue: e.target.value })}
          placeholder={lang === "es" ? "Ej. Centro Comunitario" : "e.g. Community Center"}
        />
      </label>

      <label className="block text-sm">
        <EmpleosFieldLabel lang={lang} optional>
          {addressLabel}
        </EmpleosFieldLabel>
        <input
          className={INPUT}
          value={addressValue}
          onChange={(e) => onChange({ addressLine1: e.target.value })}
          placeholder={addressPlaceholder}
        />
        <p className="mt-1.5 text-xs leading-relaxed text-[color:var(--lx-text-2)]">{addressHelperText}</p>
      </label>

      <label className="block text-sm">
        <EmpleosFieldLabel lang={lang} optional>
          {addressLine2Label}
        </EmpleosFieldLabel>
        <input
          className={INPUT}
          value={addressLine2Value}
          onChange={(e) => onChange({ addressLine2: e.target.value })}
          placeholder={lang === "es" ? "Apto, Suite, Unidad…" : "Apt, Suite, Unit…"}
        />
      </label>

      <div className="block text-sm">
        <EmpleosFieldLabel lang={lang} required>
          {publicCityLabel}
        </EmpleosFieldLabel>
        <CityAutocomplete
          className="mt-1"
          value={publicCity}
          onChange={(v) => onChange({ publicCity: v })}
          lang={lang}
          variant="light"
          stripInvalidOnBlur
          placeholder={
            lang === "es" ? "Ej. San José, Stockton, Ciudad de México…" : "e.g. San José, Stockton, Mexico City…"
          }
        />
        <p className="mt-1.5 text-xs leading-relaxed text-[color:var(--lx-text-2)]">{cityHint}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <EmpleosFieldLabel lang={lang} optional>
            {stateLabel}
          </EmpleosFieldLabel>
          <input
            className={INPUT}
            value={stateValue}
            onChange={(e) => onChange({ state: e.target.value })}
            placeholder={lang === "es" ? "CA, TX, CDMX…" : "CA, TX, NY…"}
          />
        </label>
        <label className="block text-sm">
          <EmpleosFieldLabel lang={lang} optional>
            {countryLabel}
          </EmpleosFieldLabel>
          <input
            className={INPUT}
            value={countryValue}
            onChange={(e) => onChange({ country: e.target.value })}
            placeholder={lang === "es" ? "Ej. Estados Unidos, México…" : "e.g. United States, Mexico…"}
          />
        </label>
      </div>

      <label className="block text-sm">
        <EmpleosFieldLabel lang={lang} optional>
          {zipLabel}
        </EmpleosFieldLabel>
        <input
          className={INPUT}
          value={zipValue}
          onChange={(e) => onChange({ zip: e.target.value })}
          placeholder={lang === "es" ? "95110, C.P. 06600…" : "95110, M5V 3A8…"}
          inputMode="numeric"
        />
      </label>
    </EmpleosSectionCard>
  );
}
