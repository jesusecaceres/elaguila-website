/**
 * En Venta — lightweight query expansion for lista search (Spanish + English cues).
 */

import type { EnVentaDepartmentKey } from "./categories";

const SYNONYM_GROUPS: string[][] = [
  ["iphone", "celular", "teléfono", "telefono", "android", "smartphone", "phone"],
  ["laptop", "macbook", "computadora", "pc", "notebook"],
  ["electrodomesticos", "refrigerador", "nevera", "fridge", "refrigerator", "washer", "dryer", "lavadora", "secadora", "estufa", "horno", "microwave", "microondas"],
  ["accesorios mascotas", "pet supplies", "dog crate", "jaula", "transportadora", "cama perro", "pet bed", "acuario", "aquarium", "correa", "leash", "pet toy", "juguete mascota"],
  ["libros", "books", "peliculas", "movies", "dvds", "cds", "vinilos", "vinyl", "revistas", "magazines"],
  ["materiales", "construction materials", "madera", "lumber", "tile", "azulejo", "piso", "flooring", "fixtures", "hardware", "ferreteria"],
  ["garage sale", "yard sale", "venta de garage", "venta de garaje", "moving sale", "mudanza", "estate sale", "lote", "bundle", "varios"],
  ["joyeria", "jewelry", "relojes", "watches", "lentes de sol", "sunglasses"],
  ["oficina", "office", "utiles escolares", "school supplies", "printer", "impresora", "desk accessories"],
  ["autopartes", "partes de auto", "car parts", "tires", "llantas", "rims", "rines", "car audio", "accesorios de auto"],
  ["sofa", "sillón", "sillon", "couch"],
  ["bicicleta", "bike", "bici", "ciclismo"],
  ["herramienta", "taladro", "sierra", "tool", "drill"],
  ["mueble", "furniture", "mesa", "silla"],
  ["ropa", "clothes", "zapatos", "shoes", "tenis"],
  ["juguetes", "toys", "lego", "muñeca", "muneca"],
  ["consola", "playstation", "xbox", "nintendo", "videojuego"],
  ["cámara", "camara", "camera", "lente", "lens"],
];

/** Map loose tokens to canonical department hints for browse rail (optional). */
export const KEYWORD_TO_DEPT_HINT: Array<{ re: RegExp; dept: EnVentaDepartmentKey }> = [
  { re: /iphone|android|pixel|galaxy|tablet|ipad|macbook|laptop|tv|televisi[oó]n|headphone|aud[ií]fono/i, dept: "electronicos" },
  { re: /electrodom[eé]sticos|refrigerador|nevera|fridge|refrigerator|washer|dryer|lavadora|secadora|estufa|horno|microwave|microondas/i, dept: "hogar" },
  { re: /sofa|sill[oó]n|colch[oó]n|mesa|silla|escritorio|mueble/i, dept: "muebles" },
  { re: /ropa|zapatos|tenis|chamarra|vestido|bolsa|joyer[ií]a|jewelry|relojes|watches|lentes de sol|sunglasses/i, dept: "ropa-accesorios" },
  { re: /beb[eé]|ni[nñ]o|stroller|coche|car seat|cuna/i, dept: "bebes-ninos" },
  { re: /taladro|sierra|herramienta|dewalt|makita|materiales|construction materials|madera|lumber|tile|azulejo|piso|flooring|fixtures|hardware|ferreter[ií]a/i, dept: "herramientas" },
  { re: /autopartes|partes de auto|car parts|llanta|llantas|tire|tires|rin|rines|rims|freno|bater[ií]a|aceite|car audio|accesorios de auto/i, dept: "vehiculos-partes" },
  { re: /bici|bicicleta|pesa|gym|raqueta|bal[oó]n/i, dept: "deportes" },
  { re: /juguete|lego|mu[nñ]eca|consola|nintendo|playstation/i, dept: "juguetes-juegos" },
  { re: /colecci[oó]n|moneda|arte|antig/i, dept: "coleccionables" },
  { re: /guitar|piano|c[aá]mara|lente|tr[ií]pode|libros|books|pel[ií]culas|movies|dvds|cds|vinilos|vinyl|revistas|magazines/i, dept: "musica-foto-video" },
  { re: /accesorios mascotas|pet supplies|dog crate|jaula|transportadora|cama perro|pet bed|acuario|aquarium|correa|leash|pet toy|juguete mascota|garage sale|yard sale|venta de garage|venta de garaje|moving sale|mudanza|estate sale|lote|bundle|varios|oficina|office|[uú]tiles escolares|school supplies|printer|impresora|desk accessories/i, dept: "otros" },
];

export function expandEnVentaSearchTerms(raw: string): string[] {
  const q = raw.trim().toLowerCase();
  if (!q) return [];
  const parts = new Set<string>([q]);
  for (const group of SYNONYM_GROUPS) {
    if (group.some((g) => q.includes(g))) {
      for (const g of group) parts.add(g);
    }
  }
  return [...parts];
}

export function inferDeptFromQuery(raw: string): EnVentaDepartmentKey | null {
  const q = raw.trim();
  if (!q) return null;
  for (const { re, dept } of KEYWORD_TO_DEPT_HINT) {
    if (re.test(q)) return dept;
  }
  return null;
}
