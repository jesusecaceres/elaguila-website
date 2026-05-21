"use client";

import { useState } from "react";

import CityAutocomplete from "@/app/components/CityAutocomplete";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";

type Props = {
  lang: Lang;
  label: string;
  defaultValue: string;
  name?: string;
};

/** NorCal city autocomplete for GET results filters (shared CA_CITIES catalog). */
export function MascotasResultsCityFilter({ lang, label, defaultValue, name = "city" }: Props) {
  const [city, setCity] = useState(defaultValue);

  return (
    <label className="block text-xs font-semibold text-[#5C5346]">
      {label}
      <CityAutocomplete
        value={city}
        onChange={setCity}
        placeholder={lang === "es" ? "Ciudad NorCal" : "NorCal city"}
        lang={lang}
        variant="light"
        className="mt-1 min-h-[44px] w-full rounded-xl border border-[#C9B46A]/35 bg-white px-3 py-2 text-sm"
        stripInvalidOnBlur
      />
      <input type="hidden" name={name} value={city} />
    </label>
  );
}
