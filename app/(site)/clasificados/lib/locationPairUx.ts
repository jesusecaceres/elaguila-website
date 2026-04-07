/**
 * Reusable city/ZIP unlink UX:
 * - clearing one field intentionally clears the paired field
 * - replacing one side of a complete pair unlinks the other side to avoid mismatch loops
 */
export function nextCityZipFromCityInput(prev: { city: string; zip: string }, nextCityRaw: string) {
  const nextCity = nextCityRaw;
  const cityTrim = nextCity.trim();
  const prevCityTrim = prev.city.trim();
  const hasCompleteZip = prev.zip.replace(/\D/g, "").length === 5;

  if (!cityTrim) {
    return { city: "", zip: "" };
  }
  if (hasCompleteZip && prevCityTrim && cityTrim !== prevCityTrim) {
    return { city: nextCity, zip: "" };
  }
  return { city: nextCity, zip: prev.zip };
}

export function nextCityZipFromZipInput(prev: { city: string; zip: string }, nextZipRaw: string) {
  const nextZip = nextZipRaw.replace(/\D/g, "").slice(0, 5);
  const prevZip = prev.zip.replace(/\D/g, "").slice(0, 5);
  const hasCity = prev.city.trim().length > 0;

  if (!nextZip) {
    return { city: "", zip: "" };
  }
  if (hasCity && prevZip.length === 5 && nextZip !== prevZip) {
    return { city: "", zip: nextZip };
  }
  return { city: prev.city, zip: nextZip };
}
