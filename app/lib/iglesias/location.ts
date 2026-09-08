/** Textual location matching against real saved church fields. No geocoding, radius, or aliases. */

export type IglesiasLocationFields = {
  city?: string | null;
  state?: string | null;
  country?: string | null;
  zip?: string | null;
};

export function foldIglesiasLocationText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function iglesiasLocationTerm(city: string, zip: string): string {
  return (city || zip).trim();
}

export function iglesiasLocationMatches(fields: IglesiasLocationFields, rawTerm: string): boolean {
  const term = foldIglesiasLocationText(rawTerm);
  if (!term) return true;
  const haystack = [fields.city, fields.state, fields.country, fields.zip]
    .filter((v): v is string => Boolean(v && String(v).trim()))
    .map((v) => foldIglesiasLocationText(v));
  return haystack.some((v) => v.includes(term));
}
