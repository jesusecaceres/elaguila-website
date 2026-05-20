/**
 * En Venta — Level 1 departments (canonical browse + publish step 1).
 * Slugs are stable for `evDept`, publish `rama`, and saved listings; change labels only in this gate.
 */

export type EnVentaDepartmentKey =
  | "electronicos"
  | "hogar"
  | "muebles"
  | "ropa-accesorios"
  | "bebes-ninos"
  | "herramientas"
  | "deportes"
  | "juguetes-juegos"
  | "musica-foto-video"
  | "coleccionables"
  | "vehiculos-partes"
  | "otros";

export const EN_VENTA_DEPARTMENTS: Array<{
  key: EnVentaDepartmentKey;
  label: { es: string; en: string };
  browseHint: { es: string; en: string };
}> = [
  {
    key: "electronicos",
    label: { es: "Electrónica y tecnología", en: "Electronics & tech" },
    browseHint: { es: "Teléfonos, computadoras, TV y audio", en: "Phones, computers, TV & audio" },
  },
  {
    key: "hogar",
    label: { es: "Hogar, cocina y electrodomésticos", en: "Home, kitchen & appliances" },
    browseHint: { es: "Cocina, decoración, baño, jardín, electrodomésticos", en: "Kitchen, decor, bath, garden, appliances" },
  },
  {
    key: "muebles",
    label: { es: "Muebles", en: "Furniture" },
    browseHint: { es: "Sala, recámara, comedor, oficina", en: "Living room, bedroom, dining, office" },
  },
  {
    key: "ropa-accesorios",
    label: { es: "Ropa, zapatos y accesorios", en: "Clothing, shoes & accessories" },
    browseHint: { es: "Ropa, calzado, bolsas, joyería", en: "Clothing, footwear, bags, jewelry" },
  },
  {
    key: "bebes-ninos",
    label: { es: "Bebés y niños", en: "Baby & kids" },
    browseHint: { es: "Carriola, ropa infantil, equipo seguro", en: "Strollers, kids clothes, baby gear" },
  },
  {
    key: "herramientas",
    label: { es: "Herramientas y materiales", en: "Tools & materials" },
    browseHint: { es: "Manuales, eléctricas, madera, ferretería", en: "Hand tools, power tools, lumber, hardware" },
  },
  {
    key: "deportes",
    label: { es: "Deportes y aire libre", en: "Sports & outdoors" },
    browseHint: { es: "Bicis, fitness, camping, deportes de equipo", en: "Bikes, fitness, camping, team sports" },
  },
  {
    key: "juguetes-juegos",
    label: { es: "Juguetes, juegos y videojuegos", en: "Toys, games & video games" },
    browseHint: { es: "Consolas, juegos de mesa, juguetes", en: "Consoles, board games, toys" },
  },
  {
    key: "musica-foto-video",
    label: { es: "Libros, música, foto y video", en: "Books, music, photo & video" },
    browseHint: { es: "Libros, instrumentos, cámaras, vinilos", en: "Books, instruments, cameras, vinyl" },
  },
  {
    key: "coleccionables",
    label: { es: "Coleccionables y antigüedades", en: "Collectibles & antiques" },
    browseHint: { es: "Arte, monedas, tarjetas, memorabilia", en: "Art, coins, cards, memorabilia" },
  },
  {
    key: "vehiculos-partes",
    label: { es: "Partes y accesorios de auto", en: "Auto parts & accessories" },
    browseHint: {
      es: "Llantas, audio, refacciones — no vehículos completos",
      en: "Tires, audio, parts — not full vehicles",
    },
  },
  {
    key: "otros",
    label: { es: "Otros artículos", en: "Other items" },
    browseHint: {
      es: "Mascotas (solo accesorios), garage, mudanza, oficina",
      en: "Pet supplies only, garage sales, moving lots, office",
    },
  },
];
