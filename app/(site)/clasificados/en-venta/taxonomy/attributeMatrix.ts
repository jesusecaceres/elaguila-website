/**
 * En Venta — conditional optional fields (Level 3+), keyed by department (+ optional article).
 */

import type { EnVentaDepartmentKey } from "./categories";

export type EnVentaAttributeField = {
  key: string;
  label: { es: string; en: string };
  type: "text" | "number" | "select";
  options?: Array<{ value: string; label: { es: string; en: string } }>;
};

const STORAGE: Record<string, EnVentaAttributeField[]> = {
  electronicos: [
    { key: "storageGb", label: { es: "Almacenamiento (GB)", en: "Storage (GB)" }, type: "text", options: undefined },
    { key: "screenInches", label: { es: "Pantalla (pulg.)", en: "Screen (in.)" }, type: "text" },
  ],
  "vehiculos-partes": [
    {
      key: "fitsVehicle",
      label: { es: "Compatible con", en: "Fits vehicle" },
      type: "text",
    },
  ],
  muebles: [{ key: "dimensions", label: { es: "Medidas aprox.", en: "Approx. dimensions" }, type: "text" }],
  hogar: [{ key: "applianceVoltage", label: { es: "Voltaje (si aplica)", en: "Voltage (if applicable)" }, type: "text" }],
  default: [],
};

export function getEnVentaAttributeFields(
  dept: string,
  _articleKey?: string
): EnVentaAttributeField[] {
  const d = dept.trim().toLowerCase() as EnVentaDepartmentKey;
  return STORAGE[d] ?? STORAGE.default;
}
