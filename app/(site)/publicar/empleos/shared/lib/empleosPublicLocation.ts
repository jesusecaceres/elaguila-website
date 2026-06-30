import { isEmpleosInternalFilterRegion } from "../constants/empleosStandardRegion";
import { formatEmpleosLocationLine } from "./empleosGlobalLocation";

export type EmpleosQuickAddressFields = {
  city: string;
  state: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  addressLine1?: string;
  addressLine2?: string;
  stateRegion?: string;
  postalCode?: string;
  country?: string;
};

/**
 * Public headline city/state for Quick: never prefer internal filter region over detailed address.
 */
export function empleosQuickPublicCityState(input: EmpleosQuickAddressFields): {
  city: string;
  state: string;
  /** Shown subtly when we still used NorCal (or equivalent) internally for filters. */
  filterRegionFootnote?: string;
} {
  const addrCity = input.addressCity.trim();
  const addrState = input.addressState.trim();
  const addrZip = input.addressZip.trim();
  const filterCity = input.city.trim();
  const filterState = input.state.trim();

  if (addrCity) {
    return {
      city: addrCity,
      state: addrState || input.stateRegion?.trim() || filterState,
      filterRegionFootnote: isEmpleosInternalFilterRegion(filterCity) ? filterCity : undefined,
    };
  }
  if (filterCity && !isEmpleosInternalFilterRegion(filterCity)) {
    return { city: filterCity, state: filterState };
  }
  return {
    city: filterCity || "—",
    state: filterState,
    filterRegionFootnote: isEmpleosInternalFilterRegion(filterCity) ? filterCity : undefined,
  };
}

export function empleosPremiumPublicCityState(input: {
  city: string;
  state: string;
  employerAddress: string;
}): { city: string; state: string; filterRegionFootnote?: string } {
  const line = input.employerAddress.trim();
  if (line) {
    const mCity = line.match(/^([^,]+),\s*([A-Z]{2})\b/);
    if (mCity) {
      return {
        city: mCity[1]!.trim(),
        state: mCity[2]!.trim(),
        filterRegionFootnote: isEmpleosInternalFilterRegion(input.city.trim()) ? input.city.trim() : undefined,
      };
    }
  }
  const c = input.city.trim();
  const s = input.state.trim();
  if (c && !isEmpleosInternalFilterRegion(c)) {
    return { city: c, state: s };
  }
  return {
    city: c || "—",
    state: s,
    filterRegionFootnote: isEmpleosInternalFilterRegion(c) ? c : undefined,
  };
}

export function empleosFeriaPublicCityState(input: {
  city: string;
  state: string;
  stateRegion?: string;
  postalCode?: string;
  country?: string;
  venue: string;
}): { cityLine: string; filterRegionFootnote?: string } {
  const venue = input.venue.trim();
  const c = input.city.trim();
  const s = input.stateRegion?.trim() || input.state.trim();
  const country = input.country?.trim() ?? "";
  if (venue) {
    const tail =
      c && !isEmpleosInternalFilterRegion(c)
        ? ` · ${formatEmpleosLocationLine({ city: c, stateRegion: s, postalCode: input.postalCode, country }, { compact: true })}`
        : country
          ? ` · ${country}`
          : "";
    return {
      cityLine: `${venue}${tail}`,
      filterRegionFootnote: isEmpleosInternalFilterRegion(c) ? c : undefined,
    };
  }
  if (c && !isEmpleosInternalFilterRegion(c)) {
    return { cityLine: formatEmpleosLocationLine({ city: c, stateRegion: s, postalCode: input.postalCode, country }, { compact: true }) };
  }
  return {
    cityLine: c && s ? `${c}, ${s}` : c || s || "—",
    filterRegionFootnote: isEmpleosInternalFilterRegion(c) ? c : undefined,
  };
}
