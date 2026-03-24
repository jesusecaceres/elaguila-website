/**
 * En Venta — Level 1 departments (canonical browse + publish step 1).
 */

export type EnVentaDepartmentKey =
  | "electronicos"
  | "hogar"
  | "muebles"
  | "ropa-accesorios"
  | "bebes-ninos"
  | "herramientas"
  | "vehiculos-partes"
  | "deportes"
  | "juguetes-juegos"
  | "coleccionables"
  | "musica-foto-video"
  | "otros";

export const EN_VENTA_DEPARTMENTS: Array<{
  key: EnVentaDepartmentKey;
  label: { es: string; en: string };
  browseHint: { es: string; en: string };
}> = [
  { key: "electronicos", label: { es: "Electrónicos", en: "Electronics" }, browseHint: { es: "Teléfonos, laptops, audio", en: "Phones, laptops, audio" } },
  { key: "hogar", label: { es: "Hogar", en: "Home" }, browseHint: { es: "Decoración, cocina, jardín", en: "Decor, kitchen, garden" } },
  { key: "muebles", label: { es: "Muebles", en: "Furniture" }, browseHint: { es: "Sofás, camas, escritorios", en: "Sofas, beds, desks" } },
  { key: "ropa-accesorios", label: { es: "Ropa y accesorios", en: "Clothing & accessories" }, browseHint: { es: "Calzado, bolsas, relojes", en: "Shoes, bags, watches" } },
  { key: "bebes-ninos", label: { es: "Bebés y niños", en: "Baby & kids" }, browseHint: { es: "Coche, ropa, juguetes", en: "Strollers, clothes, toys" } },
  { key: "herramientas", label: { es: "Herramientas", en: "Tools" }, browseHint: { es: "Taladro, sierra, taller", en: "Drills, saws, shop" } },
  { key: "vehiculos-partes", label: { es: "Vehículos y partes", en: "Vehicles & parts" }, browseHint: { es: "Llantas, audio, accesorios", en: "Tires, audio, accessories" } },
  { key: "deportes", label: { es: "Deportes", en: "Sports" }, browseHint: { es: "Bicis, pesas, outdoor", en: "Bikes, weights, outdoor" } },
  { key: "juguetes-juegos", label: { es: "Juguetes y juegos", en: "Toys & games" }, browseHint: { es: "Consolas, mesa, coleccionables", en: "Consoles, board games" } },
  { key: "coleccionables", label: { es: "Coleccionables", en: "Collectibles" }, browseHint: { es: "Arte, monedas, memorabilia", en: "Art, coins, memorabilia" } },
  { key: "musica-foto-video", label: { es: "Música, foto y video", en: "Music, photo & video" }, browseHint: { es: "Instrumentos, cámaras", en: "Instruments, cameras" } },
  { key: "otros", label: { es: "Otros", en: "Other" }, browseHint: { es: "Todo lo demás", en: "Everything else" } },
];
