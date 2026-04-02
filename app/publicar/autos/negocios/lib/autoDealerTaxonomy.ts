/** Controlled option sets for dealership listing form (ES). */

import type { VehicleBadge } from "@/app/clasificados/autos/negocios/types/autoDealerListing";

export const CONDITION_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Seleccionar…" },
  { value: "new", label: "Nuevo" },
  { value: "used", label: "Usado" },
  { value: "certified", label: "Certificado" },
];

export const BODY_STYLE_OPTIONS = [
  "",
  "Sedán",
  "SUV",
  "Pickup",
  "Coupe",
  "Hatchback",
  "Minivan",
  "Convertible",
  "Wagon",
  "Otro",
];

export const FUEL_OPTIONS = ["", "Gasolina", "Gasolina premium", "Diésel", "Híbrido", "Híbrido enchufable", "Eléctrico", "Otro"];

export const DRIVETRAIN_OPTIONS = ["", "FWD", "RWD", "AWD", "4WD"];

export const TRANSMISSION_OPTIONS = [
  "",
  "Automática",
  "Automática de doble embrague",
  "Manual",
  "CVT",
  "Otro",
];

export const TITLE_STATUS_OPTIONS = ["", "Título limpio", "Salvamento", "Título reconstruido", "Otro"];

export const EXTERIOR_COLOR_OPTIONS = [
  "",
  "Negro",
  "Blanco",
  "Gris",
  "Plateado",
  "Azul",
  "Rojo",
  "Otro",
];

export const INTERIOR_COLOR_OPTIONS = ["", "Negro", "Beige", "Gris", "Marrón", "Otro"];

export const US_STATE_OPTIONS = [
  "",
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
];

export const FEATURE_OPTIONS: string[] = [
  "Cámara de reversa",
  "Monitor de punto ciego",
  "Apple CarPlay",
  "Android Auto",
  "Control crucero adaptativo",
  "Techo panorámico",
  "Asientos calefactables",
  "Navegación",
  "Remote start",
  "AWD / 4WD",
  "Tercera fila",
];

export const BADGE_OPTIONS: { key: VehicleBadge; label: string }[] = [
  { key: "certified", label: "Certificado" },
  { key: "new", label: "Nuevo" },
  { key: "used", label: "Usado" },
  { key: "clean_title", label: "Título limpio" },
  { key: "one_owner", label: "Un dueño" },
  { key: "low_miles", label: "Bajo millaje" },
  { key: "dealer_maintained", label: "Mantenido por el dealer" },
];
