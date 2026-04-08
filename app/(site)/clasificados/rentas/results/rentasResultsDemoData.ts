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
};

export const RENTAS_RESULTS_DEMO_TOTAL = 842;

export const rentasResultsFeatured: RentasResultsDemoListing = {
  id: "rentas-feat-1",
  imageUrl: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&q=80&auto=format&fit=crop",
  rentDisplay: "$2,850 / mes",
  title: "Departamento amueblado céntrico",
  addressLine: "Zapopan, Jalisco",
  beds: "2",
  baths: "2",
  sqft: "980 ft²",
  categoriaPropiedad: "residencial",
  branch: "negocio",
  badges: ["negocio", "promo"],
  promoted: true,
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
  },
  {
    id: "r-mty-1",
    imageUrl: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=900&q=80&auto=format&fit=crop",
    rentDisplay: "$3,200 / mes",
    title: "Oficina ejecutiva con recepción",
    addressLine: "San Pedro Garza García, NL",
    beds: "—",
    baths: "2",
    sqft: "1,100 ft²",
    categoriaPropiedad: "comercial",
    branch: "negocio",
    badges: ["negocio", "comercial"],
  },
  {
    id: "r-cdmx-1",
    imageUrl: "https://images.unsplash.com/photo-1600585154084-4e5fe7c39198?w=900&q=80&auto=format&fit=crop",
    rentDisplay: "$22,000 / mes",
    title: "Loft tipo estudio",
    addressLine: "Roma Norte, CDMX",
    beds: "1",
    baths: "1",
    sqft: "540 ft²",
    categoriaPropiedad: "residencial",
    branch: "privado",
    badges: ["privado"],
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
  },
];
