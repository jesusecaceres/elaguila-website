/**
 * URL-driven browse filters for `cat=autos` on lista. Single source of truth for param shape + apply logic.
 */

export type AutosBrowseListingShape = {
  year?: number;
  make?: string;
  model?: string;
  sellerType?: string;
  condition?: string;
  mileage?: number;
};

export type AutosBrowseParams = {
  aymin: string;
  aymax: string;
  amake: string;
  amodel: string;
  amilesmax: string;
  acond: string;
  aseller: string;
};

export const EMPTY_AUTOS_BROWSE_PARAMS: AutosBrowseParams = {
  aymin: "",
  aymax: "",
  amake: "",
  amodel: "",
  amilesmax: "",
  acond: "",
  aseller: "",
};

function parseNumLoose(s: string): number | null {
  const n = Number(String(s).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

export function applyAutosBrowseParams<T extends AutosBrowseListingShape>(list: T[], ap: AutosBrowseParams): T[] {
  const yMin = ap.aymin ? parseNumLoose(ap.aymin) : null;
  const yMax = ap.aymax ? parseNumLoose(ap.aymax) : null;
  const milesMax = ap.amilesmax ? parseNumLoose(ap.amilesmax) : null;
  const makeQ = (ap.amake || "").trim().toLowerCase();
  const modelQ = (ap.amodel || "").trim().toLowerCase();
  const cond = (ap.acond || "").trim().toLowerCase();

  return list.filter((x) => {
    if (yMin !== null && typeof x.year === "number" && x.year < yMin) return false;
    if (yMax !== null && typeof x.year === "number" && x.year > yMax) return false;

    if (makeQ) {
      const mk = (x.make || "").toLowerCase();
      if (!mk.includes(makeQ)) return false;
    }

    if (modelQ) {
      const md = (x.model || "").toLowerCase();
      if (!md.includes(modelQ)) return false;
    }

    if (milesMax !== null && typeof x.mileage === "number") {
      const m = x.mileage;
      if (Number.isFinite(m) && m > milesMax) return false;
    }

    if (cond && typeof x.condition === "string") {
      const c = String(x.condition).toLowerCase();
      if (cond === "new" && c !== "new") return false;
      if (cond === "used" && c !== "used") return false;
    }

    const seller = (ap.aseller || "").trim().toLowerCase();
    if (seller) {
      const st = typeof x.sellerType === "string" ? String(x.sellerType).toLowerCase() : "";
      if (!st || st !== seller) return false;
    }

    return true;
  });
}
