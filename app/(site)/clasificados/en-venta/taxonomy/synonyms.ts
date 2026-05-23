/**
 * En Venta — item-level query expansion for results `q` search (Spanish + English).
 * Not used for global hub category routing (Autos, Empleos, Rentas, etc.).
 */

import type { EnVentaDepartmentKey } from "./categories";

/** Lowercase, accent-stripped, collapsed whitespace — shared by expansion + results matching. */
export function normalizeEnVentaSearchText(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ");
}

const SYNONYM_GROUPS: string[][] = [
  ["tecnologia", "tecnología", "electronica", "electrónica", "electronicos", "gadget", "gadgets"],
  ["iphone", "celular", "teléfono", "telefono", "android", "smartphone", "phone"],
  ["laptop", "macbook", "computadora", "pc", "notebook"],
  [
    "hogar cocina",
    "cocina y electrodomesticos",
    "cocina y electrodomésticos",
    "electrodomesticos hogar",
    "decoracion hogar",
    "decoración hogar",
    "articulos para el hogar",
  ],
  [
    "electrodomesticos",
    "electrodomésticos",
    "refrigerador",
    "nevera",
    "fridge",
    "refrigerator",
    "washer",
    "dryer",
    "lavadora",
    "secadora",
    "estufa",
    "horno",
    "microwave",
    "microondas",
  ],
  [
    "accesorios mascotas",
    "pet supplies",
    "dog crate",
    "jaula",
    "transportadora",
    "cama perro",
    "pet bed",
    "acuario",
    "aquarium",
    "correa",
    "leash",
    "pet toy",
    "juguete mascota",
  ],
  ["libros", "books", "peliculas", "películas", "movies", "dvds", "cds", "vinilos", "vinyl", "revistas", "magazines"],
  [
    "materiales",
    "construction materials",
    "madera",
    "lumber",
    "tile",
    "azulejo",
    "piso",
    "flooring",
    "fixtures",
    "hardware",
    "ferreteria",
    "ferretería",
  ],
  [
    "garage sale",
    "yard sale",
    "venta de garage",
    "venta de garaje",
    "moving sale",
    "estate sale",
    "lote",
    "bundle",
    "varios",
  ],
  ["joyeria", "joyería", "jewelry", "relojes", "watches", "lentes de sol", "sunglasses"],
  ["oficina", "office", "utiles escolares", "útiles escolares", "school supplies", "printer", "impresora", "desk accessories"],
  ["autopartes", "partes de auto", "car parts", "tires", "llantas", "rims", "rines", "car audio", "car stereo", "estereo", "estéreo", "accesorios de auto"],
  ["sofa", "sillón", "sillon", "couch"],
  ["mesa cocina", "mesa de cocina", "kitchen table", "dining table", "dining chair", "silla comedor", "mesa comedor"],
  ["cama", "mattress", "colchon", "colchón", "bed"],
  ["bicicleta", "bike", "bici", "ciclismo"],
  [
    "herramienta",
    "herramientas",
    "herramientas y materiales",
    "taladro",
    "sierra",
    "tool",
    "tools",
    "drill",
    "materiales construccion",
    "materiales de construcción",
    "ferreteria",
    "ferretería",
  ],
  ["ropa zapatos", "ropa zapatos accesorios", "calzado", "tenis", "zapatillas", "sneakers"],
  ["mueble", "muebles", "furniture", "mesa", "silla", "hogar"],
  ["ropa", "clothes", "zapatos", "shoes", "tenis"],
  ["juguetes", "toys", "lego", "muñeca", "muneca"],
  ["consola", "playstation", "xbox", "nintendo", "videojuego"],
  ["cámara", "camara", "camera", "lente", "lens"],
  ["tv", "television", "televisión", "televisor"],
  ["cafetera", "coffee maker", "coffee-maker", "licuadora", "blender", "batidora", "air fryer", "freidora"],
  ["ollas", "sartenes", "pots", "pans", "cookware", "platos", "vasos", "dishes"],
  ["colchon", "colchón", "mattress", "cómoda", "dresser", "buró", "nightstand"],
  ["carriola", "stroller", "coche bebe", "car seat", "silla auto", "cuna", "crib"],
  ["taladro", "drill", "lijadora", "sander", "sierra", "saw"],
  ["bateria auto", "car battery", "frenos", "brakes", "estereo", "stereo", "head unit"],
  ["caminadora", "treadmill", "mancuernas", "dumbbells", "pesas", "weights", "yoga mat"],
  ["consola", "playstation", "xbox", "nintendo", "mando", "controller", "lego", "muñeca", "doll"],
  ["guitarra", "guitar", "piano", "teclado", "keyboard", "vinilo", "vinyl", "acuario", "aquarium"],
  [
    "libros musica",
    "libros música",
    "libros musica foto",
    "coleccionables",
    "coleccionable",
    "antiguedades",
    "antigüedades",
    "memorabilia",
  ],
  [
    "mascotas accesorios",
    "accesorios para mascotas",
    "pet supplies",
    "suministros mascotas",
    "correa perro",
    "juguete perro",
    "cama perro",
    "jaula perro",
    "transportadora mascota",
  ],
  [
    "garage sale",
    "venta de garage",
    "venta de garaje",
    "yard sale",
    "mudanza",
    "moving sale",
    "estate sale",
    "lote varios",
    "lote de articulos",
    "lote de artículos",
  ],
  ["deportes aire libre", "aire libre", "outdoor", "camping", "pesca", "fishing"],
];

function queryTouchesSynonymGroup(q: string, group: string[]): boolean {
  const tokens = q.split(" ").filter((t) => t.length >= 2);
  for (const raw of group) {
    const g = normalizeEnVentaSearchText(raw);
    if (!g) continue;
    if (q === g || q.includes(g) || g.includes(q)) return true;
    for (const tok of tokens) {
      if (tok.length >= 3 && (g.includes(tok) || tok.includes(g))) return true;
    }
  }
  return false;
}

/** Map loose tokens to canonical department hints for browse rail (optional). */
export const KEYWORD_TO_DEPT_HINT: Array<{ re: RegExp; dept: EnVentaDepartmentKey }> = [
  { re: /tecnolog[ií]a|electr[oó]nica|iphone|android|pixel|galaxy|tablet|ipad|macbook|laptop|tv|televisi[oó]n|headphone|aud[ií]fono/i, dept: "electronicos" },
  { re: /electrodom[eé]sticos|refrigerador|nevera|fridge|refrigerator|washer|dryer|lavadora|secadora|estufa|horno|microwave|microondas/i, dept: "hogar" },
  { re: /sofa|sill[oó]n|colch[oó]n|mesa de centro|mesa comedor|escritorio|mueble|librero|bookshelf/i, dept: "muebles" },
  { re: /cafetera|licuadora|batidora|freidora|ollas|sartenes|utensilios|platos|vasos|tostadora/i, dept: "hogar" },
  { re: /toallas|accesorios de baño|shower curtain/i, dept: "hogar" },
  { re: /ropa|zapatos|calzado|tenis|zapatillas|chamarra|vestido|bolsa|joyer[ií]a|jewelry|relojes|watches|lentes de sol|sunglasses/i, dept: "ropa-accesorios" },
  { re: /beb[eé]|ni[nñ]o|stroller|coche|car seat|cuna/i, dept: "bebes-ninos" },
  { re: /taladro|sierra|herramienta|dewalt|makita|materiales|construction materials|madera|lumber|tile|azulejo|piso|flooring|fixtures|hardware|ferreter[ií]a/i, dept: "herramientas" },
  { re: /autopartes|partes de auto|car parts|llanta|llantas|tire|tires|rin|rines|rims|freno|bater[ií]a|aceite|car audio|accesorios de auto/i, dept: "vehiculos-partes" },
  { re: /bici|bicicleta|pesa|gym|raqueta|bal[oó]n|camping|pesca|aire libre|outdoor/i, dept: "deportes" },
  { re: /juguete|lego|mu[nñ]eca|consola|nintendo|playstation|xbox|videojuego/i, dept: "juguetes-juegos" },
  { re: /colecci[oó]n|moneda|arte|antig|memorabilia|estampilla|trading card/i, dept: "coleccionables" },
  { re: /guitar|piano|c[aá]mara|lente|tr[ií]pode|libros|books|pel[ií]culas|movies|dvds|cds|vinilos|vinyl|revistas|magazines/i, dept: "musica-foto-video" },
  {
    re: /accesorios mascotas|mascotas accesorios|pet supplies|suministros mascota|dog crate|jaula|transportadora|cama perro|pet bed|acuario|aquarium|correa|leash|pet toy|juguete mascota|collar perro/i,
    dept: "otros",
  },
  {
    re: /garage sale|yard sale|venta de garage|venta de garaje|moving sale|mudanza|estate sale|lote|bundle|varios articulos|varios artículos/i,
    dept: "otros",
  },
  { re: /oficina|office|[uú]tiles escolares|school supplies|printer|impresora|desk accessories/i, dept: "otros" },
];

export function expandEnVentaSearchTerms(raw: string): string[] {
  const q = normalizeEnVentaSearchText(raw);
  if (!q) return [];
  const parts = new Set<string>([q]);
  for (const group of SYNONYM_GROUPS) {
    if (queryTouchesSynonymGroup(q, group)) {
      for (const g of group) {
        const n = normalizeEnVentaSearchText(g);
        if (n) parts.add(n);
      }
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
