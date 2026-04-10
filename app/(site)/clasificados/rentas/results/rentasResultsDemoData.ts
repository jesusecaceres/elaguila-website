import type { BrNegocioCategoriaPropiedad } from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";

export type RentasResultsDemoListing = {
  id: string;
  imageUrl: string;
  rentDisplay: string;
  title: string;
  addressLine: string;
  beds: string;
  baths: string;
  sqft: string;
  categoriaPropiedad: BrNegocioCategoriaPropiedad;
  branch: "privado" | "negocio";
  badges: string[];
  promoted?: boolean;
  layout?: "vertical" | "horizontal";
  /** Demo-only: higher = newer for "Recientes" band. */
  recencyRank?: number;
  amueblado?: boolean;
  mascotasPermitidas?: boolean;
};

export const RENTAS_RESULTS_DEMO_TOTAL = 842;

/** Featured / promoted — Negocio-first for shell strategy; still mixed elsewhere on landing. */
export const rentasResultsFeatured: RentasResultsDemoListing = {
  id: "r-mty-hero",
  imageUrl: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=1200&q=80&auto=format&fit=crop",
  rentDisplay: "$3,200 / mes",
  title: "Oficina ejecutiva con recepción",
  addressLine: "San Pedro Garza García, NL",
  beds: "—",
  baths: "2",
  sqft: "1,100 ft²",
  categoriaPropiedad: "comercial",
  branch: "negocio",
  badges: ["destacada", "negocio"],
  promoted: true,
  recencyRank: 100,
  amueblado: true,
  mascotasPermitidas: false,
};

export const rentasResultsGridDemo: RentasResultsDemoListing[] = [
  {
    id: "r-gdl-1",
    imageUrl: "https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=900&q=80&auto=format&fit=crop",
    rentDisplay: "$1,950 / mes",
    title: "Casa en renta con patio",
    addressLine: "Tlaquepaque, Jalisco",
    beds: "3",
    baths: "2",
    sqft: "1,450 ft²",
    categoriaPropiedad: "residencial",
    branch: "privado",
    badges: ["privado"],
    layout: "horizontal",
    recencyRank: 88,
    amueblado: false,
    mascotasPermitidas: true,
  },
  {
    id: "r-mty-1",
    imageUrl: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=900&q=80&auto=format&fit=crop",
    rentDisplay: "$45,000 MXN/mes",
    title: "Residencia con alberca y jardín",
    addressLine: "Monterrey, NL",
    beds: "3",
    baths: "4",
    sqft: "1,200 m²",
    categoriaPropiedad: "residencial",
    branch: "privado",
    badges: ["destacada", "privado"],
    promoted: true,
    recencyRank: 95,
    amueblado: false,
    mascotasPermitidas: true,
  },
  {
    id: "r-cdmx-1",
    imageUrl: "https://images.unsplash.com/photo-1600585154084-4e5fe7c39198?w=900&q=80&auto=format&fit=crop",
    rentDisplay: "$22,000 / mes",
    title: "Loft tipo estudio amueblado",
    addressLine: "Roma Norte, CDMX",
    beds: "1",
    baths: "1",
    sqft: "540 ft²",
    categoriaPropiedad: "residencial",
    branch: "privado",
    badges: ["privado"],
    recencyRank: 90,
    amueblado: true,
    mascotasPermitidas: false,
  },
  {
    id: "r-agu-1",
    imageUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&q=80&auto=format&fit=crop",
    rentDisplay: "$18,000 / mes",
    title: "Terreno en renta para eventos",
    addressLine: "Aguascalientes, Ags.",
    beds: "—",
    baths: "—",
    sqft: "2,000 m²",
    categoriaPropiedad: "terreno_lote",
    branch: "negocio",
    badges: ["negocio"],
    layout: "horizontal",
    recencyRank: 72,
    amueblado: false,
    mascotasPermitidas: false,
  },
  {
    id: "r-gdl-2",
    imageUrl: "https://images.unsplash.com/photo-1605146769289-440113cc31d0?w=900&q=80&auto=format&fit=crop",
    rentDisplay: "$2,400 / mes",
    title: "Townhouse en fraccionamiento",
    addressLine: "Guadalajara, Jalisco",
    beds: "3",
    baths: "2.5",
    sqft: "1,720 ft²",
    categoriaPropiedad: "residencial",
    branch: "negocio",
    badges: ["negocio"],
    recencyRank: 80,
    amueblado: false,
    mascotasPermitidas: true,
  },
  {
    id: "r-qro-1",
    imageUrl: "https://images.unsplash.com/photo-1600585154340-0ef3c08dc8e4?w=900&q=80&auto=format&fit=crop",
    rentDisplay: "$28,500 / mes",
    title: "Showroom avenida principal",
    addressLine: "Querétaro, Qro.",
    beds: "—",
    baths: "3",
    sqft: "2,400 ft²",
    categoriaPropiedad: "comercial",
    branch: "negocio",
    badges: ["negocio", "comercial"],
    recencyRank: 78,
    amueblado: false,
    mascotasPermitidas: false,
  },
];
