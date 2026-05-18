/**
 * En Venta taxonomy — single import surface for config + publish + lista delegates.
 * `EN_VENTA_SUBCATEGORIES` remains the schema/publish “rama” list (here: departments).
 */

import { EN_VENTA_DEPARTMENTS, type EnVentaDepartmentKey } from "../../taxonomy/categories";
import { findSubcategory } from "../../taxonomy/subcategories";
export { EN_VENTA_DEPARTMENTS, type EnVentaDepartmentKey } from "../../taxonomy/categories";
export { EN_VENTA_SUBCATEGORY_ROWS, getSubcategoriesForDept, findSubcategory } from "../../taxonomy/subcategories";
export { expandEnVentaSearchTerms, inferDeptFromQuery, KEYWORD_TO_DEPT_HINT } from "../../taxonomy/synonyms";
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

const ARTICLES: Record<EnVentaDepartmentKey, Array<{ value: string; label: { es: string; en: string } }>> = {
  electronicos: [
    { value: "phone", label: { es: "Teléfono", en: "Phone" } },
    { value: "tablet", label: { es: "Tablet", en: "Tablet" } },
    { value: "laptop", label: { es: "Laptop / PC", en: "Laptop / PC" } },
    { value: "desktop", label: { es: "Escritorio", en: "Desktop" } },
    { value: "tv", label: { es: "TV", en: "TV" } },
    { value: "audio", label: { es: "Audio", en: "Audio" } },
    { value: "wearable", label: { es: "Wearable", en: "Wearable" } },
    { value: "other-el", label: { es: "Otro electrónico", en: "Other electronics" } },
  ],
  hogar: [
    { value: "kitchen", label: { es: "Cocina", en: "Kitchen" } },
    { value: "decor", label: { es: "Decoración", en: "Decor" } },
    { value: "bath", label: { es: "Baño", en: "Bath" } },
    { value: "garden", label: { es: "Jardín", en: "Garden" } },
    { value: "refrigerator", label: { es: "Refrigerador", en: "Refrigerator" } },
    { value: "washer-dryer", label: { es: "Lavadora / secadora", en: "Washer / dryer" } },
    { value: "stove-oven", label: { es: "Estufa / horno", en: "Stove / oven" } },
    { value: "microwave", label: { es: "Microondas", en: "Microwave" } },
    { value: "small-appliance", label: { es: "Electrodoméstico pequeño", en: "Small appliance" } },
    { value: "appliance-other", label: { es: "Otro electrodoméstico", en: "Other appliance" } },
    { value: "other-hogar", label: { es: "Otro hogar", en: "Other home" } },
  ],
  muebles: [
    { value: "sofa", label: { es: "Sofá / sala", en: "Sofa / living" } },
    { value: "bed", label: { es: "Cama / recámara", en: "Bed / bedroom" } },
    { value: "desk", label: { es: "Escritorio / oficina", en: "Desk / office" } },
    { value: "storage", label: { es: "Almacenaje", en: "Storage" } },
    { value: "other-mueble", label: { es: "Otro mueble", en: "Other furniture" } },
  ],
  "ropa-accesorios": [
    { value: "tops", label: { es: "Ropa superior", en: "Tops" } },
    { value: "bottoms", label: { es: "Ropa inferior", en: "Bottoms" } },
    { value: "shoes", label: { es: "Calzado", en: "Footwear" } },
    { value: "bags", label: { es: "Bolsas / mochilas", en: "Bags" } },
    { value: "jewelry", label: { es: "Joyería", en: "Jewelry" } },
    { value: "watches", label: { es: "Relojes", en: "Watches" } },
    { value: "sunglasses", label: { es: "Lentes de sol", en: "Sunglasses" } },
    { value: "accessory-other", label: { es: "Otro accesorio", en: "Other accessory" } },
    { value: "other-ropa", label: { es: "Otro", en: "Other" } },
  ],
  "bebes-ninos": [
    { value: "gear", label: { es: "Equipo (coche, silla)", en: "Gear (stroller, seat)" } },
    { value: "clothes-kids", label: { es: "Ropa infantil", en: "Kids clothes" } },
    { value: "toys-small", label: { es: "Juguetes", en: "Toys" } },
    { value: "other-ninos", label: { es: "Otro", en: "Other" } },
  ],
  herramientas: [
    { value: "hand", label: { es: "Manuales", en: "Hand tools" } },
    { value: "power", label: { es: "Eléctricas", en: "Power tools" } },
    { value: "lumber", label: { es: "Madera", en: "Lumber" } },
    { value: "tile-flooring", label: { es: "Piso / azulejo", en: "Tile / flooring" } },
    { value: "fixtures", label: { es: "Accesorios de instalación", en: "Fixtures" } },
    { value: "hardware", label: { es: "Ferretería", en: "Hardware" } },
    { value: "material-other", label: { es: "Otro material", en: "Other material" } },
    { value: "other-tools", label: { es: "Otro", en: "Other" } },
  ],
  "vehiculos-partes": [
    { value: "wheels", label: { es: "Llantas / rines", en: "Wheels / tires" } },
    { value: "audio-car", label: { es: "Audio / electrónica", en: "Audio / electronics" } },
    { value: "parts", label: { es: "Partes / accesorios", en: "Parts / accessories" } },
    { value: "other-auto", label: { es: "Otro", en: "Other" } },
  ],
  deportes: [
    { value: "bike", label: { es: "Bicicleta", en: "Bicycle" } },
    { value: "fitness", label: { es: "Fitness", en: "Fitness" } },
    { value: "team", label: { es: "Deportes de equipo", en: "Team sports" } },
    { value: "outdoor", label: { es: "Outdoor", en: "Outdoor" } },
    { value: "other-sport", label: { es: "Otro", en: "Other" } },
  ],
  "juguetes-juegos": [
    { value: "console", label: { es: "Consola / videojuegos", en: "Console / video games" } },
    { value: "board", label: { es: "Juegos de mesa", en: "Board games" } },
    { value: "other-game", label: { es: "Otro", en: "Other" } },
  ],
  coleccionables: [
    { value: "art", label: { es: "Arte", en: "Art" } },
    { value: "coins", label: { es: "Monedas / medallas", en: "Coins / medals" } },
    { value: "memorabilia", label: { es: "Memorabilia", en: "Memorabilia" } },
    { value: "other-coll", label: { es: "Otro", en: "Other" } },
  ],
  "musica-foto-video": [
    { value: "instrument", label: { es: "Instrumento", en: "Instrument" } },
    { value: "camera", label: { es: "Cámara / lentes", en: "Camera / lenses" } },
    { value: "books", label: { es: "Libros", en: "Books" } },
    { value: "movies", label: { es: "Películas", en: "Movies" } },
    { value: "music-media", label: { es: "Música física", en: "Physical music" } },
    { value: "vinyl", label: { es: "Vinilos", en: "Vinyl" } },
    { value: "magazines", label: { es: "Revistas", en: "Magazines" } },
    { value: "media-other", label: { es: "Otro medio", en: "Other media" } },
    { value: "other-media", label: { es: "Otro", en: "Other" } },
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
    { value: "bundle-lot", label: { es: "Lote", en: "Bundle / lot" } },
    { value: "office-equipment", label: { es: "Equipo de oficina", en: "Office equipment" } },
    { value: "school-supplies", label: { es: "Útiles escolares", en: "School supplies" } },
    { value: "printer", label: { es: "Impresora", en: "Printer" } },
    { value: "office-other", label: { es: "Otro de oficina", en: "Other office / school" } },
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
