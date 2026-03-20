/**
 * En Venta taxonomy: subcategories and artículo options per subcategory.
 * Single source of truth for the publish form (Subcategoría + Artículo).
 * Clean Spanish UI labels; no slang. Search synonyms live elsewhere.
 */

export type SubcategoryOption = {
  key: string;
  label: { es: string; en: string };
};

export type ArticuloOption = {
  value: string;
  label: { es: string; en: string };
};

/** Article options can be flat or grouped (e.g. Vehículos y partes: Vehículos | Autopartes). */
export type ArticuloOptionGroup = {
  groupLabel: { es: string; en: string };
  options: ArticuloOption[];
};

export type ArticuloOptionsResult =
  | { type: "flat"; options: ArticuloOption[] }
  | { type: "grouped"; groups: ArticuloOptionGroup[] };

/** Subcategories for En Venta. Order and keys drive the Subcategoría dropdown. */
export const EN_VENTA_SUBCATEGORIES: SubcategoryOption[] = [
  { key: "electronicos", label: { es: "Electrónicos", en: "Electronics" } },
  { key: "hogar", label: { es: "Hogar", en: "Home" } },
  { key: "muebles", label: { es: "Muebles", en: "Furniture" } },
  { key: "ropa-accesorios", label: { es: "Ropa y accesorios", en: "Clothing & accessories" } },
  { key: "bebes-ninos", label: { es: "Bebés y niños", en: "Babies & kids" } },
  { key: "herramientas", label: { es: "Herramientas", en: "Tools" } },
  { key: "vehiculos-partes", label: { es: "Vehículos y partes", en: "Vehicles & parts" } },
  { key: "deportes", label: { es: "Deportes", en: "Sports" } },
  { key: "juguetes-juegos", label: { es: "Juguetes y juegos", en: "Toys & games" } },
  { key: "coleccionables", label: { es: "Coleccionables", en: "Collectibles" } },
  { key: "musica-foto-video", label: { es: "Música / foto / video", en: "Music / photo / video" } },
  { key: "otros", label: { es: "Otros", en: "Other" } },
];

/** Artículo options for "Vehículos y partes": two groups. */
const ARTICULOS_VEHICULOS_PARTES: ArticuloOptionGroup[] = [
  {
    groupLabel: { es: "Vehículos", en: "Vehicles" },
    options: [
      { value: "carros", label: { es: "Carros", en: "Cars" } },
      { value: "camionetas", label: { es: "Camionetas", en: "Trucks / pickups" } },
      { value: "motocicletas", label: { es: "Motocicletas", en: "Motorcycles" } },
      { value: "botes", label: { es: "Botes", en: "Boats" } },
      { value: "rvs", label: { es: "RVs", en: "RVs" } },
      { value: "vehiculos-comerciales", label: { es: "Vehículos comerciales", en: "Commercial vehicles" } },
    ],
  },
  {
    groupLabel: { es: "Autopartes", en: "Auto parts" },
    options: [
      { value: "llantas", label: { es: "Llantas", en: "Tires" } },
      { value: "rines", label: { es: "Rines", en: "Rims" } },
      { value: "accesorios-carro", label: { es: "Accesorios para carro", en: "Car accessories" } },
      { value: "partes-motor", label: { es: "Partes de motor", en: "Engine parts" } },
    ],
  },
];

/** Flat artículo options per subcategory (existing ramas). */
const ARTICULOS_FLAT: Record<string, ArticuloOption[]> = {
  electronicos: [
    { value: "celular", label: { es: "Celular", en: "Phone" } },
    { value: "laptop", label: { es: "Laptop", en: "Laptop" } },
    { value: "tablet", label: { es: "Tablet", en: "Tablet" } },
    { value: "tv", label: { es: "TV", en: "TV" } },
    { value: "bocina", label: { es: "Bocina", en: "Speaker" } },
    { value: "audifonos", label: { es: "Audífonos", en: "Headphones" } },
    { value: "camara", label: { es: "Cámara", en: "Camera" } },
    { value: "videojuego-consola", label: { es: "Videojuego / consola", en: "Video game / console" } },
    { value: "accesorios", label: { es: "Accesorios", en: "Accessories" } },
    { value: "otro", label: { es: "Otro", en: "Other" } },
  ],
  hogar: [
    { value: "electrodomestico", label: { es: "Electrodoméstico", en: "Appliance" } },
    { value: "decoracion", label: { es: "Decoración", en: "Decor" } },
    { value: "cocina", label: { es: "Cocina", en: "Kitchen" } },
    { value: "organizacion", label: { es: "Organización", en: "Organization" } },
    { value: "limpieza", label: { es: "Limpieza", en: "Cleaning" } },
    { value: "otro", label: { es: "Otro", en: "Other" } },
  ],
  muebles: [
    { value: "sofa", label: { es: "Sofá", en: "Sofa" } },
    { value: "mesa", label: { es: "Mesa", en: "Table" } },
    { value: "silla", label: { es: "Silla", en: "Chair" } },
    { value: "cama", label: { es: "Cama", en: "Bed" } },
    { value: "comoda", label: { es: "Cómoda", en: "Dresser" } },
    { value: "escritorio", label: { es: "Escritorio", en: "Desk" } },
    { value: "estante", label: { es: "Estante", en: "Shelf" } },
    { value: "otro", label: { es: "Otro", en: "Other" } },
  ],
  "ropa-accesorios": [
    { value: "camisa", label: { es: "Camisa", en: "Shirt" } },
    { value: "pantalon", label: { es: "Pantalón", en: "Pants" } },
    { value: "zapatos", label: { es: "Zapatos", en: "Shoes" } },
    { value: "bolsa", label: { es: "Bolsa", en: "Bag" } },
    { value: "joyeria", label: { es: "Joyería", en: "Jewelry" } },
    { value: "accesorios", label: { es: "Accesorios", en: "Accessories" } },
    { value: "otro", label: { es: "Otro", en: "Other" } },
  ],
  "bebes-ninos": [
    { value: "ropa", label: { es: "Ropa", en: "Clothing" } },
    { value: "juguete", label: { es: "Juguete", en: "Toy" } },
    { value: "carriola", label: { es: "Carriola", en: "Stroller" } },
    { value: "cuna", label: { es: "Cuna", en: "Crib" } },
    { value: "silla-carro", label: { es: "Silla para carro", en: "Car seat" } },
    { value: "accesorios", label: { es: "Accesorios", en: "Accessories" } },
    { value: "otro", label: { es: "Otro", en: "Other" } },
  ],
  herramientas: [
    { value: "taladro", label: { es: "Taladro", en: "Drill" } },
    { value: "caja-herramientas", label: { es: "Caja de herramientas", en: "Toolbox" } },
    { value: "sierra", label: { es: "Sierra", en: "Saw" } },
    { value: "generador", label: { es: "Generador", en: "Generator" } },
    { value: "jardineria", label: { es: "Jardinería", en: "Gardening" } },
    { value: "otro", label: { es: "Otro", en: "Other" } },
  ],
  deportes: [
    { value: "bicicleta", label: { es: "Bicicleta", en: "Bicycle" } },
    { value: "pesas", label: { es: "Pesas", en: "Weights" } },
    { value: "equipo", label: { es: "Equipo", en: "Equipment" } },
    { value: "ropa-deportiva", label: { es: "Ropa deportiva", en: "Sportswear" } },
    { value: "otro", label: { es: "Otro", en: "Other" } },
  ],
  "juguetes-juegos": [
    { value: "juguetes", label: { es: "Juguetes", en: "Toys" } },
    { value: "juegos-mesa", label: { es: "Juegos de mesa", en: "Board games" } },
    { value: "consola", label: { es: "Consola", en: "Console" } },
    { value: "videojuego", label: { es: "Videojuego", en: "Video game" } },
    { value: "otro", label: { es: "Otro", en: "Other" } },
  ],
  coleccionables: [
    { value: "monedas", label: { es: "Monedas", en: "Coins" } },
    { value: "tarjetas", label: { es: "Tarjetas", en: "Cards" } },
    { value: "antiguedades", label: { es: "Antigüedades", en: "Antiques" } },
    { value: "figuras", label: { es: "Figuras", en: "Figures" } },
    { value: "memorabilia", label: { es: "Memorabilia", en: "Memorabilia" } },
    { value: "otro", label: { es: "Otro", en: "Other" } },
  ],
  "musica-foto-video": [
    { value: "instrumento", label: { es: "Instrumento", en: "Instrument" } },
    { value: "microfono", label: { es: "Micrófono", en: "Microphone" } },
    { value: "camara", label: { es: "Cámara", en: "Camera" } },
    { value: "lente", label: { es: "Lente", en: "Lens" } },
    { value: "iluminacion", label: { es: "Iluminación", en: "Lighting" } },
    { value: "audio", label: { es: "Audio", en: "Audio" } },
    { value: "otro", label: { es: "Otro", en: "Other" } },
  ],
  otros: [{ value: "otro", label: { es: "Otro", en: "Other" } }],
  /** Legacy: drafts saved with "auto-partes" still resolve. Not shown in subcategory dropdown. */
  "auto-partes": [
    { value: "llantas", label: { es: "Llantas", en: "Tires" } },
    { value: "rines", label: { es: "Rines", en: "Rims" } },
    { value: "bateria", label: { es: "Batería", en: "Battery" } },
    { value: "luces", label: { es: "Luces", en: "Lights" } },
    { value: "estereo", label: { es: "Estéreo", en: "Stereo" } },
    { value: "accesorios", label: { es: "Accesorios", en: "Accessories" } },
    { value: "otro", label: { es: "Otro", en: "Other" } },
  ],
};

/**
 * Returns artículo options for a subcategory. Use for the Artículo dropdown.
 * For "vehiculos-partes" returns grouped options (Vehículos | Autopartes); otherwise flat.
 */
export function getArticuloOptionsForSubcategory(subcategoryKey: string): ArticuloOptionsResult {
  if (subcategoryKey === "vehiculos-partes") {
    return { type: "grouped", groups: ARTICULOS_VEHICULOS_PARTES };
  }
  const flat = ARTICULOS_FLAT[subcategoryKey] ?? [];
  return { type: "flat", options: flat };
}

/**
 * Resolves artículo display label for a given subcategory + value (e.g. for detail pairs / preview).
 */
export function getArticuloLabel(
  subcategoryKey: string,
  itemTypeValue: string,
  lang: "es" | "en"
): string {
  const result = getArticuloOptionsForSubcategory(subcategoryKey);
  if (result.type === "flat") {
    const opt = result.options.find((o) => o.value === itemTypeValue);
    return opt ? opt.label[lang] : itemTypeValue;
  }
  for (const g of result.groups) {
    const opt = g.options.find((o) => o.value === itemTypeValue);
    if (opt) return opt.label[lang];
  }
  return itemTypeValue;
}
