import type { HubCategoryKey, HubListing } from "../config/clasificadosHub";

export function buildFeaturedByCategory(
  poolListings: HubListing[],
  limits: Record<HubCategoryKey, number>
): Record<HubCategoryKey, HubListing[]> {
  const out: Record<HubCategoryKey, HubListing[]> = {
    rentas: [],
    "en-venta": [],
    empleos: [],
    servicios: [],
    travel: [],
    autos: [],
    clases: [],
    comunidad: [],
    restaurantes: [],
  };

  for (const cat of Object.keys(out) as HubCategoryKey[]) {
    const all = poolListings.filter((l) => l.category === cat);
    const business = all.filter((x) => x.sellerType === "business");
    const personal = all.filter((x) => x.sellerType === "personal");
    const limit = limits[cat];
    const mixed: HubListing[] = [];
    let bi = 0;
    let pi = 0;

    while (mixed.length < limit && (bi < business.length || pi < personal.length)) {
      if (bi < business.length) mixed.push(business[bi++]);
      if (mixed.length >= limit) break;
      if (pi < personal.length) mixed.push(personal[pi++]);
    }

    out[cat] = mixed.slice(0, limit);
  }

  return out;
}
