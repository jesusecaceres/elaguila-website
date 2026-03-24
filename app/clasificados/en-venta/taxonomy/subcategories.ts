/**
 * En Venta — optional Level 2 rails inside a department (publish + lista pills).
 */

import type { EnVentaDepartmentKey } from "./categories";

export type EnVentaSubcategoryDef = {
  key: string;
  dept: EnVentaDepartmentKey;
  label: { es: string; en: string };
};

/** Flat list: dept + sub-key for URLs (evDept + evSub). */
export const EN_VENTA_SUBCATEGORY_ROWS: EnVentaSubcategoryDef[] = [
  { dept: "electronicos", key: "phones", label: { es: "Teléfonos y tablets", en: "Phones & tablets" } },
  { dept: "electronicos", key: "computo", label: { es: "Computadoras", en: "Computers" } },
  { dept: "electronicos", key: "tv-audio", label: { es: "TV y audio", en: "TV & audio" } },
  { dept: "electronicos", key: "wearables", label: { es: "Wearables", en: "Wearables" } },
  { dept: "hogar", key: "cocina", label: { es: "Cocina", en: "Kitchen" } },
  { dept: "hogar", key: "decoracion", label: { es: "Decoración", en: "Decor" } },
  { dept: "hogar", key: "jardin", label: { es: "Jardín y exterior", en: "Garden & outdoor" } },
  { dept: "muebles", key: "sala", label: { es: "Sala", en: "Living room" } },
  { dept: "muebles", key: "recamara", label: { es: "Recámara", en: "Bedroom" } },
  { dept: "muebles", key: "oficina", label: { es: "Oficina", en: "Office" } },
  { dept: "ropa-accesorios", key: "ropa", label: { es: "Ropa", en: "Clothing" } },
  { dept: "ropa-accesorios", key: "calzado", label: { es: "Calzado", en: "Footwear" } },
  { dept: "ropa-accesorios", key: "accesorios", label: { es: "Accesorios", en: "Accessories" } },
  { dept: "bebes-ninos", key: "equipo", label: { es: "Equipo (coches, sillas)", en: "Gear (strollers, seats)" } },
  { dept: "bebes-ninos", key: "ropa-ninos", label: { es: "Ropa infantil", en: "Kids clothes" } },
  { dept: "herramientas", key: "manuales", label: { es: "Herramientas manuales", en: "Hand tools" } },
  { dept: "herramientas", key: "electricas", label: { es: "Eléctricas", en: "Power tools" } },
  { dept: "vehiculos-partes", key: "llantas", label: { es: "Llantas y rines", en: "Tires & wheels" } },
  { dept: "vehiculos-partes", key: "audio-auto", label: { es: "Audio y electrónica", en: "Car audio & electronics" } },
  { dept: "vehiculos-partes", key: "accesorios-auto", label: { es: "Accesorios", en: "Accessories" } },
  { dept: "deportes", key: "ciclismo", label: { es: "Ciclismo", en: "Cycling" } },
  { dept: "deportes", key: "fitness", label: { es: "Fitness", en: "Fitness" } },
  { dept: "deportes", key: "outdoor", label: { es: "Aire libre", en: "Outdoors" } },
  { dept: "juguetes-juegos", key: "consolas", label: { es: "Consolas y videojuegos", en: "Consoles & games" } },
  { dept: "juguetes-juegos", key: "mesa", label: { es: "Juegos de mesa", en: "Board games" } },
  { dept: "coleccionables", key: "arte", label: { es: "Arte", en: "Art" } },
  { dept: "coleccionables", key: "antiguedades", label: { es: "Antigüedades", en: "Antiques" } },
  { dept: "musica-foto-video", key: "instrumentos", label: { es: "Instrumentos", en: "Instruments" } },
  { dept: "musica-foto-video", key: "foto", label: { es: "Fotografía", en: "Photography" } },
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
