/**
 * Bienes Raíces landing gateway — tile/shortcut → results URL params.
 * Every entry maps to real taxonomy values, priceMin/priceMax, or safe text search (`q`).
 */

import type { IconType } from "react-icons";
import {
  FiHome,
  FiGrid,
  FiMaximize2,
  FiLayers,
  FiTruck,
  FiUsers,
  FiDollarSign,
  FiDroplet,
  FiCoffee,
  FiWifi,
  FiZap,
  FiHeart,
  FiClock,
  FiBookOpen,
} from "react-icons/fi";

export type BienesGatewayLink = {
  labelEs: string;
  labelEn: string;
  params: Record<string, string>;
  /** False when omitted from UI (blocker documented in final output). */
  wired: boolean;
};

export type BienesGatewayTile = BienesGatewayLink & {
  Icon: IconType;
  accent: "burgundy" | "green" | "gold";
  hintEs?: string;
  hintEn?: string;
};

export type BienesDrawerPropertyType = {
  value: string;
  labelEs: string;
  labelEn: string;
};

/** Visual intent tiles — propertyType or safe keyword search only. */
export const BIENES_INTENT_TILES: BienesGatewayTile[] = [
  {
    labelEs: "Casas",
    labelEn: "Houses",
    hintEs: "Residencial",
    hintEn: "Residential",
    Icon: FiHome,
    accent: "burgundy",
    params: { propertyType: "residencial" },
    wired: true,
  },
  {
    labelEs: "Departamentos",
    labelEn: "Apartments",
    hintEs: "Apartamentos y unidades",
    hintEn: "Apartments and units",
    Icon: FiGrid,
    accent: "gold",
    params: { propertyType: "departamento" },
    wired: true,
  },
  {
    labelEs: "Venta",
    labelEn: "Sale",
    hintEs: "Propiedades en venta",
    hintEn: "Properties for sale",
    Icon: FiDollarSign,
    accent: "green",
    params: { operationType: "venta" },
    wired: true,
  },
  {
    labelEs: "Renta",
    labelEn: "Rent",
    hintEs: "Propiedades en renta",
    hintEn: "Properties for rent",
    Icon: FiClock,
    accent: "burgundy",
    params: { operationType: "renta" },
    wired: true,
  },
  {
    labelEs: "Comerciales",
    labelEn: "Commercial",
    hintEs: "Locales, oficinas y negocios",
    hintEn: "Retail, offices, and businesses",
    Icon: FiLayers,
    accent: "green",
    params: { propertyType: "comercial" },
    wired: true,
  },
  {
    labelEs: "Terrenos",
    labelEn: "Land",
    hintEs: "Lotes y oportunidades",
    hintEn: "Lots and opportunities",
    Icon: FiMaximize2,
    accent: "gold",
    params: { propertyType: "terreno" },
    wired: true,
  },
  {
    labelEs: "Proyecto nuevo",
    labelEn: "New construction",
    hintEs: "Construcción y desarrollo",
    hintEn: "Construction and development",
    Icon: FiTruck,
    accent: "green",
    params: { propertyType: "proyecto_nuevo" },
    wired: true,
  },
  {
    labelEs: "Multifamiliar",
    labelEn: "Multifamily",
    hintEs: "Inversión",
    hintEn: "Investment",
    Icon: FiUsers,
    accent: "burgundy",
    params: { propertyType: "multifamiliar" },
    wired: true,
  },
];

export const BIENES_BUDGET_SHORTCUTS: (BienesGatewayLink & { Icon: IconType })[] = [
  {
    labelEs: "Hasta $500k",
    labelEn: "Up to $500k",
    Icon: FiDollarSign,
    params: { priceMax: "500000" },
    wired: true,
  },
  {
    labelEs: "$500k–$800k",
    labelEn: "$500k–$800k",
    Icon: FiDollarSign,
    params: { priceMin: "500000", priceMax: "800000" },
    wired: true,
  },
  {
    labelEs: "$800k–$1.2M",
    labelEn: "$800k–$1.2M",
    Icon: FiDollarSign,
    params: { priceMin: "800000", priceMax: "1200000" },
    wired: true,
  },
  {
    labelEs: "$1.2M+",
    labelEn: "$1.2M+",
    Icon: FiDollarSign,
    params: { priceMin: "1200000" },
    wired: true,
  },
  {
    labelEs: "Rentas hasta $2,500",
    labelEn: "Rentals up to $2,500",
    Icon: FiDollarSign,
    params: { operationType: "renta", priceMax: "2500" },
    wired: true,
  },
  {
    labelEs: "Rentas $2,500+",
    labelEn: "Rentals $2,500+",
    Icon: FiDollarSign,
    params: { operationType: "renta", priceMin: "2500" },
    wired: true,
  },
];

export const BIENES_PRACTICAL_SHORTCUTS: (BienesGatewayLink & { Icon: IconType })[] = [
  {
    labelEs: "2+ recámaras",
    labelEn: "2+ bedrooms",
    Icon: FiHome,
    params: { beds: "2" },
    wired: true,
  },
  {
    labelEs: "3+ recámaras",
    labelEn: "3+ bedrooms",
    Icon: FiHome,
    params: { beds: "3" },
    wired: true,
  },
  {
    labelEs: "2+ baños",
    labelEn: "2+ bathrooms",
    Icon: FiDroplet,
    params: { baths: "2" },
    wired: true,
  },
  {
    labelEs: "Aceptan mascotas",
    labelEn: "Pets allowed",
    Icon: FiHeart,
    params: { pets: "true" },
    wired: true,
  },
  {
    labelEs: "Amueblado",
    labelEn: "Furnished",
    Icon: FiHome,
    params: { furnished: "true" },
    wired: true,
  },
  {
    labelEs: "Con piscina",
    labelEn: "With pool",
    Icon: FiDroplet,
    params: { pool: "true" },
    wired: true,
  },
  {
    labelEs: "Comercial",
    labelEn: "Commercial",
    Icon: FiLayers,
    params: { propertyType: "comercial" },
    wired: true,
  },
  {
    labelEs: "Terreno / lote",
    labelEn: "Land / lot",
    Icon: FiMaximize2,
    params: { propertyType: "terreno" },
    wired: true,
  },
];

/** Drawer property types — real taxonomy values. */
export const BIENES_DRAWER_PROPERTY_TYPES: BienesDrawerPropertyType[] = [
  { value: "residencial", labelEs: "Residencial", labelEn: "Residential" },
  { value: "comercial", labelEs: "Comercial", labelEn: "Commercial" },
  { value: "terreno", labelEs: "Terreno / lote", labelEn: "Land / lot" },
  { value: "proyecto_nuevo", labelEs: "Proyecto nuevo", labelEn: "New construction" },
  { value: "multifamiliar", labelEs: "Multifamiliar", labelEn: "Multifamily" },
];

export const BIENES_DRAWER_SELLER_TYPES: BienesGatewayLink[] = [
  {
    labelEs: "Todos",
    labelEn: "All",
    params: {},
    wired: true,
  },
  {
    labelEs: "Particular / Privado",
    labelEn: "Private / Individual",
    params: { sellerType: "privado" },
    wired: true,
  },
  {
    labelEs: "Negocio / Agente",
    labelEn: "Business / Agent",
    params: { sellerType: "negocio" },
    wired: true,
  },
];
