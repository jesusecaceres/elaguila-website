/**
 * En Venta — optional Level 2 rails inside a department (publish + lista pills).
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
    itemTypeValues: ["phone", "tablet", "wearable", "other-el"],
  },
  {
    dept: "electronicos",
    key: "computo",
    label: { es: "Computadoras", en: "Computers" },
    itemTypeValues: ["laptop", "desktop", "other-el"],
  },
  {
    dept: "electronicos",
    key: "tv-audio",
    label: { es: "TV y audio", en: "TV & audio" },
    itemTypeValues: ["tv", "audio", "other-el"],
  },
  {
    dept: "electronicos",
    key: "wearables",
    label: { es: "Wearables", en: "Wearables" },
    itemTypeValues: ["wearable", "other-el"],
  },
  {
    dept: "hogar",
    key: "cocina",
    label: { es: "Cocina", en: "Kitchen" },
    itemTypeValues: ["kitchen", "other-hogar"],
  },
  {
    dept: "hogar",
    key: "decoracion",
    label: { es: "Decoración", en: "Decor" },
    itemTypeValues: ["decor", "bath", "other-hogar"],
  },
  {
    dept: "hogar",
    key: "jardin",
    label: { es: "Jardín y exterior", en: "Garden & outdoor" },
    itemTypeValues: ["garden", "other-hogar"],
  },
  {
    dept: "muebles",
    key: "sala",
    label: { es: "Sala", en: "Living room" },
    itemTypeValues: ["sofa", "storage", "other-mueble"],
  },
  {
    dept: "muebles",
    key: "recamara",
    label: { es: "Recámara", en: "Bedroom" },
    itemTypeValues: ["bed", "other-mueble"],
  },
  {
    dept: "muebles",
    key: "oficina",
    label: { es: "Oficina", en: "Office" },
    itemTypeValues: ["desk", "storage", "other-mueble"],
  },
  {
    dept: "ropa-accesorios",
    key: "ropa",
    label: { es: "Ropa", en: "Clothing" },
    itemTypeValues: ["tops", "bottoms", "other-ropa"],
  },
  {
    dept: "ropa-accesorios",
    key: "calzado",
    label: { es: "Calzado", en: "Footwear" },
    itemTypeValues: ["shoes", "other-ropa"],
  },
  {
    dept: "ropa-accesorios",
    key: "accesorios",
    label: { es: "Accesorios", en: "Accessories" },
    itemTypeValues: ["bags", "other-ropa"],
  },
  {
    dept: "bebes-ninos",
    key: "equipo",
    label: { es: "Equipo (coches, sillas)", en: "Gear (strollers, seats)" },
    itemTypeValues: ["gear", "other-ninos"],
  },
  {
    dept: "bebes-ninos",
    key: "ropa-ninos",
    label: { es: "Ropa infantil", en: "Kids clothes" },
    itemTypeValues: ["clothes-kids", "other-ninos"],
  },
  {
    dept: "herramientas",
    key: "manuales",
    label: { es: "Herramientas manuales", en: "Hand tools" },
    itemTypeValues: ["hand", "other-tools"],
  },
  {
    dept: "herramientas",
    key: "electricas",
    label: { es: "Eléctricas", en: "Power tools" },
    itemTypeValues: ["power", "other-tools"],
  },
  {
    dept: "vehiculos-partes",
    key: "llantas",
    label: { es: "Llantas y rines", en: "Tires & wheels" },
    itemTypeValues: ["wheels", "other-auto"],
  },
  {
    dept: "vehiculos-partes",
    key: "audio-auto",
    label: { es: "Audio y electrónica", en: "Car audio & electronics" },
    itemTypeValues: ["audio-car", "other-auto"],
  },
  {
    dept: "vehiculos-partes",
    key: "accesorios-auto",
    label: { es: "Accesorios", en: "Accessories" },
    itemTypeValues: ["parts", "other-auto"],
  },
  {
    dept: "deportes",
    key: "ciclismo",
    label: { es: "Ciclismo", en: "Cycling" },
    itemTypeValues: ["bike", "other-sport"],
  },
  {
    dept: "deportes",
    key: "fitness",
    label: { es: "Fitness", en: "Fitness" },
    itemTypeValues: ["fitness", "team", "other-sport"],
  },
  {
    dept: "deportes",
    key: "outdoor",
    label: { es: "Aire libre", en: "Outdoors" },
    itemTypeValues: ["outdoor", "team", "other-sport"],
  },
  {
    dept: "juguetes-juegos",
    key: "consolas",
    label: { es: "Consolas y videojuegos", en: "Consoles & games" },
    itemTypeValues: ["console", "other-game"],
  },
  {
    dept: "juguetes-juegos",
    key: "mesa",
    label: { es: "Juegos de mesa", en: "Board games" },
    itemTypeValues: ["board", "other-game"],
  },
  {
    dept: "coleccionables",
    key: "arte",
    label: { es: "Arte", en: "Art" },
    itemTypeValues: ["art", "other-coll"],
  },
  {
    dept: "coleccionables",
    key: "antiguedades",
    label: { es: "Antigüedades", en: "Antiques" },
    itemTypeValues: ["coins", "memorabilia", "other-coll"],
  },
  {
    dept: "musica-foto-video",
    key: "instrumentos",
    label: { es: "Instrumentos", en: "Instruments" },
    itemTypeValues: ["instrument", "other-media"],
  },
  {
    dept: "musica-foto-video",
    key: "foto",
    label: { es: "Fotografía", en: "Photography" },
    itemTypeValues: ["camera", "other-media"],
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
