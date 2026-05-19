/**
 * En Venta — optional Level 2 rails inside a department (publish + lista pills).
 * `itemTypeValues` must be product-level slugs (never repeat the subcategory label).
 */

import type { EnVentaDepartmentKey } from "./categories";

export type EnVentaSubcategoryDef = {
  key: string;
  dept: EnVentaDepartmentKey;
  label: { es: string; en: string };
  /**
   * When set, publish item-type options are narrowed to these `ARTICLES` values for this department.
   * When omitted, the full department-level item-type list is shown (subcategory is a soft label only).
   */
  itemTypeValues?: readonly string[];
};

/** Flat list: dept + sub-key for URLs (evDept + evSub). */
export const EN_VENTA_SUBCATEGORY_ROWS: EnVentaSubcategoryDef[] = [
  {
    dept: "electronicos",
    key: "phones",
    label: { es: "Teléfonos y tablets", en: "Phones & tablets" },
    itemTypeValues: ["phone", "tablet", "phone-case", "charger-cable", "wearable", "other-el"],
  },
  {
    dept: "electronicos",
    key: "computo",
    label: { es: "Computadoras", en: "Computers" },
    itemTypeValues: ["laptop", "desktop", "monitor", "printer", "gaming-accessory", "other-el"],
  },
  {
    dept: "electronicos",
    key: "tv-audio",
    label: { es: "TV y audio", en: "TV & audio" },
    itemTypeValues: ["tv", "audio", "headphones", "soundbar", "other-el"],
  },
  {
    dept: "electronicos",
    key: "wearables",
    label: { es: "Wearables", en: "Wearables" },
    itemTypeValues: ["wearable", "charger-cable", "other-el"],
  },
  {
    dept: "hogar",
    key: "cocina",
    label: { es: "Cocina", en: "Kitchen" },
    itemTypeValues: [
      "cookware",
      "bakeware",
      "dishes-glassware",
      "utensils",
      "coffee-maker",
      "blender-mixer",
      "air-fryer",
      "toaster",
      "kitchen-storage",
      "kitchen-other",
      "other-hogar",
    ],
  },
  {
    dept: "hogar",
    key: "decoracion",
    label: { es: "Decoración", en: "Decor" },
    itemTypeValues: [
      "wall-art",
      "rugs-curtains",
      "lighting",
      "mirrors",
      "vases-planters",
      "seasonal-decor",
      "decor-other",
      "other-hogar",
    ],
  },
  {
    dept: "hogar",
    key: "jardin",
    label: { es: "Jardín y exterior", en: "Garden & outdoor" },
    itemTypeValues: ["patio-furniture", "grill-bbq", "lawn-garden", "outdoor-lighting", "garden-other", "other-hogar"],
  },
  {
    dept: "hogar",
    key: "bano",
    label: { es: "Baño", en: "Bath" },
    itemTypeValues: ["towels", "shower-bath", "bath-other", "other-hogar"],
  },
  {
    dept: "hogar",
    key: "electrodomesticos",
    label: { es: "Electrodomésticos", en: "Appliances" },
    itemTypeValues: [
      "refrigerator",
      "washer-dryer",
      "stove-oven",
      "microwave",
      "dishwasher",
      "small-appliance",
      "appliance-other",
      "other-hogar",
    ],
  },
  {
    dept: "muebles",
    key: "sala",
    label: { es: "Sala", en: "Living room" },
    itemTypeValues: ["sofa", "sectional", "recliner", "coffee-table", "tv-stand", "storage", "other-mueble"],
  },
  {
    dept: "muebles",
    key: "recamara",
    label: { es: "Recámara", en: "Bedroom" },
    itemTypeValues: ["bed", "mattress", "dresser", "nightstand", "storage", "other-mueble"],
  },
  {
    dept: "muebles",
    key: "oficina",
    label: { es: "Oficina", en: "Office" },
    itemTypeValues: ["desk", "office-chair", "bookshelf", "storage", "other-mueble"],
  },
  {
    dept: "muebles",
    key: "comedor",
    label: { es: "Comedor", en: "Dining" },
    itemTypeValues: ["dining-table", "dining-chairs", "storage", "other-mueble"],
  },
  {
    dept: "ropa-accesorios",
    key: "ropa",
    label: { es: "Ropa", en: "Clothing" },
    itemTypeValues: ["tops", "bottoms", "dresses", "outerwear", "other-ropa"],
  },
  {
    dept: "ropa-accesorios",
    key: "calzado",
    label: { es: "Calzado", en: "Footwear" },
    itemTypeValues: ["shoes", "boots", "sandals", "other-ropa"],
  },
  {
    dept: "ropa-accesorios",
    key: "accesorios",
    label: { es: "Accesorios", en: "Accessories" },
    itemTypeValues: ["bags", "belts-hats", "accessory-other", "other-ropa"],
  },
  {
    dept: "ropa-accesorios",
    key: "joyeria-relojes",
    label: { es: "Joyería y relojes", en: "Jewelry & watches" },
    itemTypeValues: ["jewelry", "watches", "sunglasses", "accessory-other", "other-ropa"],
  },
  {
    dept: "bebes-ninos",
    key: "equipo",
    label: { es: "Equipo (coches, sillas)", en: "Gear (strollers, seats)" },
    itemTypeValues: ["stroller", "car-seat", "crib", "high-chair", "baby-gear", "other-ninos"],
  },
  {
    dept: "bebes-ninos",
    key: "ropa-ninos",
    label: { es: "Ropa infantil", en: "Kids clothes" },
    itemTypeValues: ["clothes-kids", "other-ninos"],
  },
  {
    dept: "bebes-ninos",
    key: "juguetes-ninos",
    label: { es: "Juguetes infantiles", en: "Kids toys" },
    itemTypeValues: ["toys-small", "playset", "other-ninos"],
  },
  {
    dept: "herramientas",
    key: "manuales",
    label: { es: "Herramientas manuales", en: "Hand tools" },
    itemTypeValues: ["wrench-set", "screwdriver-set", "hammer", "saw-hand", "hand", "other-tools"],
  },
  {
    dept: "herramientas",
    key: "electricas",
    label: { es: "Eléctricas", en: "Power tools" },
    itemTypeValues: ["drill", "saw-power", "sander", "power", "other-tools"],
  },
  {
    dept: "herramientas",
    key: "materiales-construccion",
    label: { es: "Materiales de construcción", en: "Building materials" },
    itemTypeValues: ["lumber", "tile-flooring", "fixtures", "hardware", "paint-supplies", "material-other", "other-tools"],
  },
  {
    dept: "vehiculos-partes",
    key: "llantas",
    label: { es: "Llantas y rines", en: "Tires & wheels" },
    itemTypeValues: ["tires", "rims", "wheels", "other-auto"],
  },
  {
    dept: "vehiculos-partes",
    key: "audio-auto",
    label: { es: "Audio y electrónica", en: "Car audio & electronics" },
    itemTypeValues: ["stereo-headunit", "audio-car", "other-auto"],
  },
  {
    dept: "vehiculos-partes",
    key: "accesorios-auto",
    label: { es: "Accesorios y partes", en: "Parts & accessories" },
    itemTypeValues: [
      "battery",
      "brakes",
      "lights-auto",
      "mirrors-auto",
      "interior-accessory",
      "roof-rack",
      "engine-part",
      "body-part",
      "parts",
      "other-auto",
    ],
  },
  {
    dept: "deportes",
    key: "ciclismo",
    label: { es: "Ciclismo", en: "Cycling" },
    itemTypeValues: ["bike", "helmet-bike", "other-sport"],
  },
  {
    dept: "deportes",
    key: "fitness",
    label: { es: "Fitness", en: "Fitness" },
    itemTypeValues: ["treadmill", "weights", "yoga-mat", "exercise-bike", "other-sport"],
  },
  {
    dept: "deportes",
    key: "outdoor",
    label: { es: "Aire libre", en: "Outdoors" },
    itemTypeValues: ["camping-tent", "fishing", "other-sport"],
  },
  {
    dept: "deportes",
    key: "deportes-equipo",
    label: { es: "Deportes de equipo", en: "Team sports" },
    itemTypeValues: ["soccer-ball", "basketball", "golf", "team-sport-gear", "other-sport"],
  },
  {
    dept: "juguetes-juegos",
    key: "consolas",
    label: { es: "Consolas y videojuegos", en: "Consoles & games" },
    itemTypeValues: ["console", "games-physical", "controller", "other-game"],
  },
  {
    dept: "juguetes-juegos",
    key: "mesa",
    label: { es: "Juegos de mesa", en: "Board games" },
    itemTypeValues: ["board", "puzzles", "other-game"],
  },
  {
    dept: "juguetes-juegos",
    key: "juguetes",
    label: { es: "Juguetes", en: "Toys" },
    itemTypeValues: ["action-figures", "dolls", "lego-blocks", "other-game"],
  },
  {
    dept: "coleccionables",
    key: "arte",
    label: { es: "Arte", en: "Art" },
    itemTypeValues: ["art-print", "painting", "art", "other-coll"],
  },
  {
    dept: "coleccionables",
    key: "antiguedades",
    label: { es: "Antigüedades y monedas", en: "Antiques & coins" },
    itemTypeValues: ["coins", "stamps", "trading-cards", "antiques", "memorabilia", "other-coll"],
  },
  {
    dept: "musica-foto-video",
    key: "instrumentos",
    label: { es: "Instrumentos", en: "Instruments" },
    itemTypeValues: ["guitar", "keyboard-piano", "drums-percussion", "instrument", "other-media"],
  },
  {
    dept: "musica-foto-video",
    key: "foto",
    label: { es: "Fotografía", en: "Photography" },
    itemTypeValues: ["camera", "lens", "tripod", "other-media"],
  },
  {
    dept: "musica-foto-video",
    key: "libros-medios",
    label: { es: "Libros y medios", en: "Books & media" },
    itemTypeValues: ["books", "movies", "music-media", "vinyl", "magazines", "media-other", "other-media"],
  },
  {
    dept: "otros",
    key: "mascotas-accesorios",
    label: { es: "Accesorios para mascotas", en: "Pet supplies" },
    itemTypeValues: ["pet-crate", "pet-bed", "aquarium", "pet-accessory", "pet-toy", "pet-other"],
  },
  {
    dept: "otros",
    key: "venta-garage-mudanza",
    label: { es: "Venta de garage / mudanza", en: "Garage / moving sale" },
    itemTypeValues: ["garage-sale", "moving-sale", "estate-sale", "bundle-lot", "misc"],
  },
  {
    dept: "otros",
    key: "oficina-escuela",
    label: { es: "Oficina y escuela", en: "Office & school" },
    itemTypeValues: ["office-equipment", "school-supplies", "printer", "desk-accessories", "office-other", "misc"],
  },
  { dept: "otros", key: "general", label: { es: "General", en: "General" } },
];

export function getSubcategoriesForDept(dept: string): EnVentaSubcategoryDef[] {
  const d = dept.trim().toLowerCase() as EnVentaDepartmentKey;
  return EN_VENTA_SUBCATEGORY_ROWS.filter((r) => r.dept === d);
}

export function findSubcategory(dept: string, subKey: string): EnVentaSubcategoryDef | null {
  const d = dept.trim().toLowerCase();
  const s = subKey.trim().toLowerCase();
  return EN_VENTA_SUBCATEGORY_ROWS.find((r) => r.dept === d && r.key === s) ?? null;
}
