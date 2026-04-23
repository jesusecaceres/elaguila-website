import { isEmpleosInternalFilterRegion } from "../constants/empleosStandardRegion";

export type EmpleosQuickAddressFields = {
  city: string;
  state: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
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
      state: addrState || filterState,
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
  venue: string;
}): { cityLine: string; filterRegionFootnote?: string } {
  const venue = input.venue.trim();
  const c = input.city.trim();
  const s = input.state.trim();
  if (venue) {
    const tail = c && !isEmpleosInternalFilterRegion(c) ? ` · ${c}${s ? `, ${s}` : ""}` : "";
    return {
      cityLine: `${venue}${tail}`,
      filterRegionFootnote: isEmpleosInternalFilterRegion(c) ? c : undefined,
    };
  }
  if (c && !isEmpleosInternalFilterRegion(c)) {
    return { cityLine: `${c}${s ? `, ${s}` : ""}` };
  }
  return {
    cityLine: c && s ? `${c}, ${s}` : c || s || "—",
    filterRegionFootnote: isEmpleosInternalFilterRegion(c) ? c : undefined,
  };
}
