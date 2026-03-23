/**
 * Title-only scan for year / make+model token / mileage (lista cards + detail fallbacks).
 */

function normalizeSpace(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

export type ParsedAutoTitle = {
  year: string | null;
  specLabel: string | null;
  mileageLabel: string | null;
};

export function parseAutoFromTitle(title: string): ParsedAutoTitle {
  const t = normalizeSpace(title);
  const mileageMatch = t.match(/\b(\d{1,3}(?:[\.,]\d{3})+|\d+(?:\.\d+)?)\s*(k)?\s*(miles|millas|mi)\b/i);
  let mileageLabel: string | null = null;
  if (mileageMatch) {
    const rawNum = mileageMatch[1];
    const hasK = Boolean(mileageMatch[2]);
    const num = Number(String(rawNum).replace(/,/g, ""));
    if (!Number.isNaN(num)) {
      const miles = hasK ? Math.round(num * 1000) : Math.round(num);
      mileageLabel = miles >= 1000 ? `${miles.toLocaleString()} mi` : `${miles} mi`;
    } else {
      mileageLabel = normalizeSpace(mileageMatch[0]).replace(/millas|miles/i, "mi");
    }
  }

  const yearMatch = t.match(/^(19\d{2}|20\d{2})\b/);
  const year = yearMatch ? yearMatch[1] : null;

  let specLabel: string | null = null;
  if (year) {
    const withoutMileage = mileageMatch ? t.replace(mileageMatch[0], "").trim() : t;
    const afterYear = normalizeSpace(withoutMileage.replace(new RegExp("^" + year + "\\b"), "").trim());
    const cleaned = afterYear.replace(/^[\-–—:\s]+/, "").trim();
    const tokens = cleaned.split(" ").filter(Boolean);
    const mm = tokens.slice(0, 3).join(" ").trim();
    if (mm) specLabel = `${year} • ${mm}`;
  }

  return { year, specLabel, mileageLabel };
}
