/**
 * En Venta taxonomy — single import surface for config + publish + lista delegates.
 * `EN_VENTA_SUBCATEGORIES` remains the schema/publish “rama” list (here: departments).
 */

import { EN_VENTA_DEPARTMENTS, type EnVentaDepartmentKey } from "../../taxonomy/categories";
import { findSubcategory } from "../../taxonomy/subcategories";
export { EN_VENTA_DEPARTMENTS, type EnVentaDepartmentKey } from "../../taxonomy/categories";
export { EN_VENTA_SUBCATEGORY_ROWS, getSubcategoriesForDept, findSubcategory } from "../../taxonomy/subcategories";
export {
  expandEnVentaSearchTerms,
  inferDeptFromQuery,
  KEYWORD_TO_DEPT_HINT,
  normalizeEnVentaSearchText,
} from "../../taxonomy/synonyms";
export { getEnVentaAttributeFields, type EnVentaAttributeField } from "../../taxonomy/attributeMatrix";

/** Back-compat: category schema + publish “rama” = department. */
export const EN_VENTA_SUBCATEGORIES = EN_VENTA_DEPARTMENTS.map((d) => ({
  key: d.key,
  label: d.label,
}));

export const EN_VENTA_PUBLISH_CONDITION_OPTIONS = [
  { value: "new", labelEs: "Nuevo", labelEn: "New" },
  { value: "like-new", labelEs: "Como nuevo", labelEn: "Like new" },
  { value: "good", labelEs: "Bueno", labelEn: "Good" },
  { value: "fair", labelEs: "Regular", labelEn: "Fair" },
] as const;

export type EnVentaConditionValue = (typeof EN_VENTA_PUBLISH_CONDITION_OPTIONS)[number]["value"];

/** Slug-stable item types; legacy slugs kept for published rows — subcategory filters use product-level values only. */
const ARTICLES: Record<EnVentaDepartmentKey, Array<{ value: string; label: { es: string; en: string } }>> = {
  electronicos: [
    { value: "phone", label: { es: "Teléfono", en: "Phone" } },
    { value: "tablet", label: { es: "Tablet", en: "Tablet" } },
    { value: "laptop", label: { es: "Laptop", en: "Laptop" } },
    { value: "desktop", label: { es: "PC de escritorio", en: "Desktop PC" } },
    { value: "monitor", label: { es: "Monitor", en: "Monitor" } },
    { value: "tv", label: { es: "Televisor", en: "TV" } },
    { value: "audio", label: { es: "Bocina / audio", en: "Speaker / audio" } },
    { value: "headphones", label: { es: "Audífonos", en: "Headphones" } },
    { value: "soundbar", label: { es: "Barra de sonido", en: "Soundbar" } },
    { value: "wearable", label: { es: "Reloj inteligente / wearable", en: "Smartwatch / wearable" } },
    { value: "phone-case", label: { es: "Funda / case", en: "Phone case" } },
    { value: "charger-cable", label: { es: "Cargador / cable", en: "Charger / cable" } },
    { value: "printer", label: { es: "Impresora", en: "Printer" } },
    { value: "gaming-accessory", label: { es: "Accesorio gaming", en: "Gaming accessory" } },
    { value: "smart-home", label: { es: "Casa inteligente", en: "Smart home" } },
    { value: "other-el", label: { es: "Otro electrónico", en: "Other electronics" } },
  ],
  hogar: [
    { value: "cookware", label: { es: "Ollas y sartenes", en: "Pots & pans" } },
    { value: "bakeware", label: { es: "Repostería / hornear", en: "Bakeware" } },
    { value: "dishes-glassware", label: { es: "Platos y vasos", en: "Dishes & glassware" } },
    { value: "utensils", label: { es: "Utensilios", en: "Utensils" } },
    { value: "coffee-maker", label: { es: "Cafetera", en: "Coffee maker" } },
    { value: "blender-mixer", label: { es: "Licuadora / batidora", en: "Blender / mixer" } },
    { value: "air-fryer", label: { es: "Freidora de aire", en: "Air fryer" } },
    { value: "toaster", label: { es: "Tostadora", en: "Toaster" } },
    { value: "kitchen-storage", label: { es: "Organizadores de cocina", en: "Kitchen organizers" } },
    { value: "kitchen-other", label: { es: "Otro — cocina", en: "Other — kitchen" } },
    { value: "wall-art", label: { es: "Cuadros y arte", en: "Wall art" } },
    { value: "rugs-curtains", label: { es: "Tapetes y cortinas", en: "Rugs & curtains" } },
    { value: "lighting", label: { es: "Lámparas", en: "Lamps & lighting" } },
    { value: "mirrors", label: { es: "Espejos", en: "Mirrors" } },
    { value: "vases-planters", label: { es: "Floreros y macetas", en: "Vases & planters" } },
    { value: "seasonal-decor", label: { es: "Decoración de temporada", en: "Seasonal decor" } },
    { value: "decor-other", label: { es: "Otro — decoración", en: "Other — decor" } },
    { value: "towels", label: { es: "Toallas", en: "Towels" } },
    { value: "shower-bath", label: { es: "Accesorios de baño", en: "Bath accessories" } },
    { value: "bath-other", label: { es: "Otro — baño", en: "Other — bath" } },
    { value: "patio-furniture", label: { es: "Muebles de patio", en: "Patio furniture" } },
    { value: "grill-bbq", label: { es: "Parrilla / asador", en: "Grill / BBQ" } },
    { value: "lawn-garden", label: { es: "Jardín y césped", en: "Lawn & garden" } },
    { value: "outdoor-lighting", label: { es: "Iluminación exterior", en: "Outdoor lighting" } },
    { value: "garden-other", label: { es: "Otro — jardín", en: "Other — garden" } },
    { value: "refrigerator", label: { es: "Refrigerador", en: "Refrigerator" } },
    { value: "washer-dryer", label: { es: "Lavadora / secadora", en: "Washer / dryer" } },
    { value: "stove-oven", label: { es: "Estufa / horno", en: "Stove / oven" } },
    { value: "microwave", label: { es: "Microondas", en: "Microwave" } },
    { value: "dishwasher", label: { es: "Lavavajillas", en: "Dishwasher" } },
    { value: "small-appliance", label: { es: "Electrodoméstico pequeño", en: "Small appliance" } },
    { value: "appliance-other", label: { es: "Otro electrodoméstico", en: "Other appliance" } },
    { value: "kitchen", label: { es: "Artículo de cocina (general)", en: "Kitchen item (general)" } },
    { value: "decor", label: { es: "Artículo de decoración (general)", en: "Decor item (general)" } },
    { value: "bath", label: { es: "Artículo de baño (general)", en: "Bath item (general)" } },
    { value: "garden", label: { es: "Artículo de jardín (general)", en: "Garden item (general)" } },
    { value: "other-hogar", label: { es: "Otro hogar", en: "Other home" } },
  ],
  muebles: [
    { value: "sofa", label: { es: "Sofá", en: "Sofa" } },
    { value: "sectional", label: { es: "Sala en L / modular", en: "Sectional" } },
    { value: "recliner", label: { es: "Sillón reclinable", en: "Recliner" } },
    { value: "coffee-table", label: { es: "Mesa de centro", en: "Coffee table" } },
    { value: "tv-stand", label: { es: "Mueble para TV", en: "TV stand" } },
    { value: "bed", label: { es: "Cama", en: "Bed frame" } },
    { value: "mattress", label: { es: "Colchón", en: "Mattress" } },
    { value: "dresser", label: { es: "Cómoda / ropero", en: "Dresser" } },
    { value: "nightstand", label: { es: "Buró / mesa de noche", en: "Nightstand" } },
    { value: "desk", label: { es: "Escritorio", en: "Desk" } },
    { value: "office-chair", label: { es: "Silla de oficina", en: "Office chair" } },
    { value: "bookshelf", label: { es: "Librero / estante", en: "Bookshelf" } },
    { value: "storage", label: { es: "Almacenaje / gabinete", en: "Storage cabinet" } },
    { value: "dining-table", label: { es: "Mesa de comedor", en: "Dining table" } },
    { value: "dining-chairs", label: { es: "Sillas de comedor", en: "Dining chairs" } },
    { value: "other-mueble", label: { es: "Otro mueble", en: "Other furniture" } },
  ],
  "ropa-accesorios": [
    { value: "tops", label: { es: "Ropa superior", en: "Tops" } },
    { value: "bottoms", label: { es: "Ropa inferior", en: "Bottoms" } },
    { value: "dresses", label: { es: "Vestidos", en: "Dresses" } },
    { value: "outerwear", label: { es: "Chamarras / abrigos", en: "Outerwear" } },
    { value: "shoes", label: { es: "Tenis / zapatos", en: "Sneakers / shoes" } },
    { value: "boots", label: { es: "Botas", en: "Boots" } },
    { value: "sandals", label: { es: "Sandalias", en: "Sandals" } },
    { value: "bags", label: { es: "Bolsas / mochilas", en: "Bags / backpacks" } },
    { value: "jewelry", label: { es: "Joyería", en: "Jewelry" } },
    { value: "watches", label: { es: "Relojes", en: "Watches" } },
    { value: "sunglasses", label: { es: "Lentes de sol", en: "Sunglasses" } },
    { value: "belts-hats", label: { es: "Cinturones / gorras", en: "Belts / hats" } },
    { value: "accessory-other", label: { es: "Otro accesorio", en: "Other accessory" } },
    { value: "other-ropa", label: { es: "Otra ropa", en: "Other clothing" } },
  ],
  "bebes-ninos": [
    { value: "stroller", label: { es: "Carriola / coche", en: "Stroller" } },
    { value: "car-seat", label: { es: "Silla para auto", en: "Car seat" } },
    { value: "crib", label: { es: "Cuna", en: "Crib" } },
    { value: "high-chair", label: { es: "Silla para comer", en: "High chair" } },
    { value: "baby-gear", label: { es: "Equipo para bebé", en: "Baby gear" } },
    { value: "gear", label: { es: "Equipo infantil (general)", en: "Kids gear (general)" } },
    { value: "clothes-kids", label: { es: "Ropa infantil", en: "Kids clothing" } },
    { value: "toys-small", label: { es: "Juguetes", en: "Toys" } },
    { value: "playset", label: { es: "Juego / set", en: "Playset" } },
    { value: "other-ninos", label: { es: "Otro bebé / niño", en: "Other baby / kids" } },
  ],
  herramientas: [
    { value: "wrench-set", label: { es: "Llaves / dados", en: "Wrenches / sockets" } },
    { value: "screwdriver-set", label: { es: "Desarmadores", en: "Screwdrivers" } },
    { value: "hammer", label: { es: "Martillo", en: "Hammer" } },
    { value: "saw-hand", label: { es: "Sierra manual", en: "Hand saw" } },
    { value: "hand", label: { es: "Herramienta manual (general)", en: "Hand tool (general)" } },
    { value: "drill", label: { es: "Taladro", en: "Drill" } },
    { value: "saw-power", label: { es: "Sierra eléctrica", en: "Power saw" } },
    { value: "sander", label: { es: "Lijadora", en: "Sander" } },
    { value: "power", label: { es: "Herramienta eléctrica (general)", en: "Power tool (general)" } },
    { value: "lumber", label: { es: "Madera", en: "Lumber" } },
    { value: "tile-flooring", label: { es: "Piso / azulejo", en: "Tile / flooring" } },
    { value: "fixtures", label: { es: "Accesorios de instalación", en: "Plumbing / fixtures" } },
    { value: "hardware", label: { es: "Ferretería suelta", en: "Hardware" } },
    { value: "paint-supplies", label: { es: "Pintura y brochas", en: "Paint & supplies" } },
    { value: "material-other", label: { es: "Otro material", en: "Other material" } },
    { value: "other-tools", label: { es: "Otra herramienta", en: "Other tool" } },
  ],
  "vehiculos-partes": [
    { value: "tires", label: { es: "Llantas", en: "Tires" } },
    { value: "rims", label: { es: "Rines", en: "Rims" } },
    { value: "wheels", label: { es: "Llantas / rines (set)", en: "Wheels / tire set" } },
    { value: "battery", label: { es: "Batería de auto", en: "Car battery" } },
    { value: "brakes", label: { es: "Frenos", en: "Brakes" } },
    { value: "lights-auto", label: { es: "Luces / faros", en: "Lights / headlights" } },
    { value: "mirrors-auto", label: { es: "Espejos", en: "Mirrors" } },
    { value: "interior-accessory", label: { es: "Interior / tapetes", en: "Interior / mats" } },
    { value: "roof-rack", label: { es: "Portaequipajes", en: "Roof rack" } },
    { value: "stereo-headunit", label: { es: "Estéreo / pantalla", en: "Stereo / head unit" } },
    { value: "audio-car", label: { es: "Audio para auto", en: "Car audio" } },
    { value: "engine-part", label: { es: "Parte de motor", en: "Engine part" } },
    { value: "body-part", label: { es: "Parte de carrocería", en: "Body part" } },
    { value: "parts", label: { es: "Parte / accesorio (general)", en: "Part / accessory (general)" } },
    { value: "other-auto", label: { es: "Otra parte de auto", en: "Other auto part" } },
  ],
  deportes: [
    { value: "bike", label: { es: "Bicicleta", en: "Bicycle" } },
    { value: "helmet-bike", label: { es: "Casco / ciclismo", en: "Helmet / cycling" } },
    { value: "treadmill", label: { es: "Caminadora", en: "Treadmill" } },
    { value: "weights", label: { es: "Pesas / mancuernas", en: "Weights / dumbbells" } },
    { value: "yoga-mat", label: { es: "Tapete de yoga", en: "Yoga mat" } },
    { value: "exercise-bike", label: { es: "Bicicleta estática", en: "Exercise bike" } },
    { value: "camping-tent", label: { es: "Camping / tienda", en: "Camping / tent" } },
    { value: "fishing", label: { es: "Pesca", en: "Fishing" } },
    { value: "golf", label: { es: "Golf", en: "Golf" } },
    { value: "soccer-ball", label: { es: "Fútbol", en: "Soccer" } },
    { value: "basketball", label: { es: "Baloncesto", en: "Basketball" } },
    { value: "team-sport-gear", label: { es: "Equipo deportivo", en: "Team sports gear" } },
    { value: "fitness", label: { es: "Fitness (general)", en: "Fitness (general)" } },
    { value: "outdoor", label: { es: "Aire libre (general)", en: "Outdoors (general)" } },
    { value: "team", label: { es: "Deporte de equipo (general)", en: "Team sport (general)" } },
    { value: "other-sport", label: { es: "Otro deporte", en: "Other sport" } },
  ],
  "juguetes-juegos": [
    { value: "console", label: { es: "Consola", en: "Game console" } },
    { value: "games-physical", label: { es: "Videojuego físico", en: "Physical game" } },
    { value: "controller", label: { es: "Control / mando", en: "Controller" } },
    { value: "board", label: { es: "Juego de mesa", en: "Board game" } },
    { value: "puzzles", label: { es: "Rompecabezas", en: "Puzzles" } },
    { value: "action-figures", label: { es: "Figuras de acción", en: "Action figures" } },
    { value: "dolls", label: { es: "Muñecas", en: "Dolls" } },
    { value: "lego-blocks", label: { es: "LEGO / bloques", en: "LEGO / blocks" } },
    { value: "other-game", label: { es: "Otro juguete / juego", en: "Other toy / game" } },
  ],
  coleccionables: [
    { value: "art-print", label: { es: "Arte / lámina", en: "Art / print" } },
    { value: "painting", label: { es: "Pintura", en: "Painting" } },
    { value: "coins", label: { es: "Monedas / medallas", en: "Coins / medals" } },
    { value: "stamps", label: { es: "Estampillas", en: "Stamps" } },
    { value: "trading-cards", label: { es: "Tarjetas coleccionables", en: "Trading cards" } },
    { value: "memorabilia", label: { es: "Memorabilia", en: "Memorabilia" } },
    { value: "antiques", label: { es: "Antigüedades", en: "Antiques" } },
    { value: "art", label: { es: "Arte (general)", en: "Art (general)" } },
    { value: "other-coll", label: { es: "Otro coleccionable", en: "Other collectible" } },
  ],
  "musica-foto-video": [
    { value: "guitar", label: { es: "Guitarra", en: "Guitar" } },
    { value: "keyboard-piano", label: { es: "Teclado / piano", en: "Keyboard / piano" } },
    { value: "drums-percussion", label: { es: "Batería / percusión", en: "Drums / percussion" } },
    { value: "instrument", label: { es: "Otro instrumento", en: "Other instrument" } },
    { value: "camera", label: { es: "Cámara", en: "Camera" } },
    { value: "lens", label: { es: "Lente", en: "Lens" } },
    { value: "tripod", label: { es: "Trípode", en: "Tripod" } },
    { value: "books", label: { es: "Libros", en: "Books" } },
    { value: "movies", label: { es: "Películas / DVD", en: "Movies / DVD" } },
    { value: "music-media", label: { es: "CDs / música", en: "CDs / music" } },
    { value: "vinyl", label: { es: "Vinilos", en: "Vinyl records" } },
    { value: "magazines", label: { es: "Revistas", en: "Magazines" } },
    { value: "media-other", label: { es: "Otro medio", en: "Other media" } },
    { value: "other-media", label: { es: "Otro música / foto", en: "Other music / photo" } },
  ],
  otros: [
    { value: "pet-crate", label: { es: "Jaula / transportadora", en: "Crate / carrier" } },
    { value: "pet-bed", label: { es: "Cama para mascota", en: "Pet bed" } },
    { value: "aquarium", label: { es: "Acuario", en: "Aquarium" } },
    { value: "pet-accessory", label: { es: "Accesorio para mascota", en: "Pet accessory" } },
    { value: "pet-toy", label: { es: "Juguete para mascota", en: "Pet toy" } },
    { value: "pet-other", label: { es: "Otro accesorio de mascota", en: "Other pet supply" } },
    { value: "garage-sale", label: { es: "Venta de garage", en: "Garage sale" } },
    { value: "moving-sale", label: { es: "Venta de mudanza", en: "Moving sale" } },
    { value: "estate-sale", label: { es: "Venta de herencia", en: "Estate sale" } },
    { value: "bundle-lot", label: { es: "Lote / varios artículos", en: "Bundle / lot" } },
    { value: "office-equipment", label: { es: "Equipo de oficina", en: "Office equipment" } },
    { value: "school-supplies", label: { es: "Útiles escolares", en: "School supplies" } },
    { value: "printer", label: { es: "Impresora", en: "Printer" } },
    { value: "desk-accessories", label: { es: "Accesorios de escritorio", en: "Desk accessories" } },
    { value: "office-other", label: { es: "Otro oficina / escuela", en: "Other office / school" } },
    { value: "misc", label: { es: "Varios", en: "Miscellaneous" } },
  ],
};

export function getArticulosForDepartment(deptKey: string) {
  const k = deptKey.trim().toLowerCase() as EnVentaDepartmentKey;
  return ARTICLES[k] ?? ARTICLES.otros;
}

/**
 * Publish item-type options for department + optional subcategory.
 * - No subcategory: full department list (users can publish without Level 2).
 * - Subcategory with `itemTypeValues`: narrowed list.
 * - Subcategory without `itemTypeValues`: full department list (optional refiner only).
 * - If a narrowed filter ever matches nothing (data bug), falls back to the department list.
 */
export function getItemTypesForSelection(deptKey: string, subKey?: string | null) {
  const base = getArticulosForDepartment(deptKey);
  const trimmed = subKey?.trim();
  if (!trimmed) return base;
  const sub = findSubcategory(deptKey, trimmed);
  const filter = sub?.itemTypeValues;
  if (!filter?.length) return base;
  const allowed = new Set(filter);
  const narrowed = base.filter((a) => allowed.has(a.value));
  return narrowed.length > 0 ? narrowed : base;
}

export function getArticuloLabel(deptKey: string, articleValue: string, lang: "es" | "en"): string {
  const opts = getArticulosForDepartment(deptKey);
  const hit = opts.find((o) => o.value === articleValue.trim());
  return hit ? hit.label[lang] : articleValue.trim();
}

export function departmentLabel(deptKey: string, lang: "es" | "en"): string {
  const hit = EN_VENTA_DEPARTMENTS.find((d) => d.key === deptKey.trim().toLowerCase());
  return hit ? hit.label[lang] : deptKey;
}
