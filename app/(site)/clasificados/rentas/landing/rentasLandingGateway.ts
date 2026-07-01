/**
 * Rentas landing gateway — tile/shortcut → results URL params.
 * Every entry maps to real taxonomy values, rent_min/max, subtype, or safe text search (`q`).
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
import {
  RENTAS_QUERY_AMUEBLADO,
  RENTAS_QUERY_MASCOTAS,
  RENTAS_QUERY_Q,
  RENTAS_QUERY_RECS,
  RENTAS_QUERY_RENT_MAX,
  RENTAS_QUERY_RENT_MIN,
  RENTAS_QUERY_ROOM_BATH,
  RENTAS_QUERY_ROOM_KITCHEN,
  RENTAS_QUERY_SUBTYPE,
} from "@/app/clasificados/rentas/shared/rentasBrowseContract";

export type RentasGatewayLink = {
  labelEs: string;
  labelEn: string;
  params: Record<string, string>;
  /** False when omitted from UI (blocker documented in final output). */
  wired: boolean;
};

export type RentasGatewayTile = RentasGatewayLink & {
  Icon: IconType;
  accent: "burgundy" | "green" | "gold";
  hintEs?: string;
  hintEn?: string;
};

export type RentasDrawerSpaceType = {
  value: string;
  labelEs: string;
  labelEn: string;
};

/** Visual intent tiles — subtype or safe keyword search only. */
export const RENTAS_INTENT_TILES: RentasGatewayTile[] = [
  {
    labelEs: "Cuarto",
    labelEn: "Room",
    hintEs: "Para una persona o pareja",
    hintEn: "For one person or a couple",
    Icon: FiHome,
    accent: "burgundy",
    params: { [RENTAS_QUERY_SUBTYPE]: "cuarto-privado" },
    wired: true,
  },
  {
    labelEs: "Garage",
    labelEn: "Garage",
    hintEs: "Espacio convertido o privado",
    hintEn: "Converted or private space",
    Icon: FiGrid,
    accent: "gold",
    params: { [RENTAS_QUERY_Q]: "garage" },
    wired: true,
  },
  {
    labelEs: "Sala / espacio",
    labelEn: "Living space",
    hintEs: "Algo sencillo y económico",
    hintEn: "Simple and affordable",
    Icon: FiMaximize2,
    accent: "green",
    params: { [RENTAS_QUERY_Q]: "sala" },
    wired: true,
  },
  {
    labelEs: "Estudio",
    labelEn: "Studio",
    hintEs: "Todo en un solo espacio",
    hintEn: "All in one space",
    Icon: FiLayers,
    accent: "burgundy",
    params: { [RENTAS_QUERY_SUBTYPE]: "estudio" },
    wired: true,
  },
  {
    labelEs: "Apartamento",
    labelEn: "Apartment",
    hintEs: "Más privacidad",
    hintEn: "More privacy",
    Icon: FiHome,
    accent: "green",
    params: { [RENTAS_QUERY_SUBTYPE]: "apartamento" },
    wired: true,
  },
  {
    labelEs: "ADU / Casita",
    labelEn: "ADU / Casita",
    hintEs: "Entrada independiente si aplica",
    hintEn: "Separate entry when available",
    Icon: FiHome,
    accent: "gold",
    params: { [RENTAS_QUERY_SUBTYPE]: "tiny-home" },
    wired: true,
  },
  {
    labelEs: "Casa móvil",
    labelEn: "Mobile home",
    hintEs: "Opción práctica",
    hintEn: "A practical option",
    Icon: FiTruck,
    accent: "green",
    params: { [RENTAS_QUERY_SUBTYPE]: "casa-movil-renta" },
    wired: true,
  },
  {
    labelEs: "Para familia",
    labelEn: "For family",
    hintEs: "Más espacio para vivir",
    hintEn: "More room to live",
    Icon: FiUsers,
    accent: "burgundy",
    params: { [RENTAS_QUERY_RECS]: "2" },
    wired: true,
  },
];

export const RENTAS_BUDGET_SHORTCUTS: (RentasGatewayLink & { Icon: IconType })[] = [
  {
    labelEs: "Hasta $800",
    labelEn: "Up to $800",
    Icon: FiDollarSign,
    params: { [RENTAS_QUERY_RENT_MAX]: "800" },
    wired: true,
  },
  {
    labelEs: "$800–$1,200",
    labelEn: "$800–$1,200",
    Icon: FiDollarSign,
    params: { [RENTAS_QUERY_RENT_MIN]: "800", [RENTAS_QUERY_RENT_MAX]: "1200" },
    wired: true,
  },
  {
    labelEs: "$1,200–$1,800",
    labelEn: "$1,200–$1,800",
    Icon: FiDollarSign,
    params: { [RENTAS_QUERY_RENT_MIN]: "1200", [RENTAS_QUERY_RENT_MAX]: "1800" },
    wired: true,
  },
  {
    labelEs: "$1,800+",
    labelEn: "$1,800+",
    Icon: FiDollarSign,
    params: { [RENTAS_QUERY_RENT_MIN]: "1800" },
    wired: true,
  },
];

export const RENTAS_PRACTICAL_SHORTCUTS: (RentasGatewayLink & { Icon: IconType })[] = [
  {
    labelEs: "Baño privado",
    labelEn: "Private bath",
    Icon: FiDroplet,
    params: { [RENTAS_QUERY_ROOM_BATH]: "privado" },
    wired: true,
  },
  {
    labelEs: "Cocina",
    labelEn: "Kitchen",
    Icon: FiCoffee,
    params: { [RENTAS_QUERY_Q]: "cocina" },
    wired: true,
  },
  {
    labelEs: "Servicios incluidos",
    labelEn: "Utilities included",
    Icon: FiZap,
    params: { [RENTAS_QUERY_Q]: "servicios incluidos" },
    wired: true,
  },
  {
    labelEs: "Internet incluido",
    labelEn: "Internet included",
    Icon: FiWifi,
    params: { [RENTAS_QUERY_Q]: "internet" },
    wired: true,
  },
  {
    labelEs: "Amueblado",
    labelEn: "Furnished",
    Icon: FiHome,
    params: { [RENTAS_QUERY_AMUEBLADO]: "1" },
    wired: true,
  },
  {
    labelEs: "Mascotas",
    labelEn: "Pets",
    Icon: FiHeart,
    params: { [RENTAS_QUERY_MASCOTAS]: "1" },
    wired: true,
  },
  {
    labelEs: "Temporal",
    labelEn: "Short-term",
    Icon: FiClock,
    params: { [RENTAS_QUERY_SUBTYPE]: "renta-temporal" },
    wired: true,
  },
  {
    labelEs: "Estudiantes",
    labelEn: "Students",
    Icon: FiBookOpen,
    params: { [RENTAS_QUERY_SUBTYPE]: "vivienda-estudiantes" },
    wired: true,
  },
];

/** Drawer space types — real taxonomy `propertySubtype` values. */
export const RENTAS_DRAWER_SPACE_TYPES: RentasDrawerSpaceType[] = [
  { value: "cuarto-privado", labelEs: "Cuarto privado", labelEn: "Private room" },
  { value: "cuarto-compartido", labelEs: "Cuarto compartido", labelEn: "Shared room" },
  { value: "estudio", labelEs: "Estudio", labelEn: "Studio" },
  { value: "apartamento", labelEs: "Apartamento", labelEn: "Apartment" },
  { value: "tiny-home", labelEs: "ADU / Casita", labelEn: "ADU / Casita" },
  { value: "casa-movil-renta", labelEs: "Casa móvil", labelEn: "Mobile home" },
  { value: "casa", labelEs: "Casa", labelEn: "House" },
  { value: "renta-temporal", labelEs: "Renta temporal", labelEn: "Short-term rental" },
  { value: "vivienda-estudiantes", labelEs: "Vivienda para estudiantes", labelEn: "Student housing" },
  { value: "subarrendamiento", labelEs: "Subarrendamiento", labelEn: "Sublease" },
  { value: "espacio-rv", labelEs: "Espacio para RV", labelEn: "RV space" },
  { value: "local-comercial", labelEs: "Local comercial", labelEn: "Retail space" },
  { value: "bodega", labelEs: "Bodega", labelEn: "Warehouse" },
  { value: "oficina", labelEs: "Oficina", labelEn: "Office" },
];

export const RENTAS_DRAWER_FOR_WHO: RentasGatewayLink[] = [
  {
    labelEs: "Una persona",
    labelEn: "One person",
    params: { [RENTAS_QUERY_RECS]: "1" },
    wired: true,
  },
  {
    labelEs: "Pareja",
    labelEn: "Couple",
    params: { [RENTAS_QUERY_RECS]: "1" },
    wired: true,
  },
  {
    labelEs: "Familia",
    labelEn: "Family",
    params: { [RENTAS_QUERY_RECS]: "2" },
    wired: true,
  },
  {
    labelEs: "Estudiantes",
    labelEn: "Students",
    params: { [RENTAS_QUERY_SUBTYPE]: "vivienda-estudiantes" },
    wired: true,
  },
];

export const RENTAS_US_BUDGET_BANDS: { value: string; labelEs: string; labelEn: string; rentMin?: number; rentMax?: number }[] = [
  { value: "u0-800", labelEs: "Hasta $800", labelEn: "Up to $800", rentMax: 800 },
  { value: "u800-1200", labelEs: "$800 – $1,200", labelEn: "$800 – $1,200", rentMin: 800, rentMax: 1200 },
  { value: "u1200-1800", labelEs: "$1,200 – $1,800", labelEn: "$1,200 – $1,800", rentMin: 1200, rentMax: 1800 },
  { value: "u1800+", labelEs: "$1,800+", labelEn: "$1,800+", rentMin: 1800 },
];
