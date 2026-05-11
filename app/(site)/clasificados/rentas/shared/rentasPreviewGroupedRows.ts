/**
 * Splits Rentas `propertyDetailsRows` into preview sections (resumen, requisitos, condiciones, chips, rest).
 */

export type RentasGroupedPreviewRows = {
  resumen: Array<{ label: string; value: string }>;
  requisitos: string;
  condiciones: string;
  servicios: string[];
  caracteristicas: Array<{ label: string; value: string }>;
};

function splitCsvAndBullets(value: string): string[] {
  const raw = String(value ?? "").trim();
  if (!raw) return [];
  const normalized = raw.replace(/^•\s*/gm, "").replace(/\n/g, ",");
  return normalized
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

export function groupedRentasPropertyRows(rows: Array<{ label: string; value: string }> | undefined): RentasGroupedPreviewRows {
  const list = Array.isArray(rows) ? rows : [];
  const byLabel = new Map(list.map((r) => [r.label, r.value] as const));
  const pick = (label: string) => {
    const v = byLabel.get(label);
    if (!v || !String(v).trim()) return null;
    return { label, value: String(v).trim() };
  };
  const requisitos = String(byLabel.get("Requisitos") ?? "").trim();
  const condiciones = String(byLabel.get("Condiciones importantes") ?? "").trim();
  const servicios = splitCsvAndBullets(String(byLabel.get("Servicios incluidos") ?? ""));
  const resumenOrder = [
    "Renta mensual",
    "Tipo de renta",
    "Depósito",
    "Plazo del contrato",
    "Disponibilidad",
    "Estado del anuncio",
  ] as const;
  const resumen = resumenOrder.map((label) => pick(label)).filter((x): x is { label: string; value: string } => x != null);
  const pulled = new Set<string>([...resumenOrder, "Requisitos", "Condiciones importantes", "Servicios incluidos"]);
  const caracteristicas = list
    .filter((r) => !pulled.has(r.label))
    .map((r) => ({ label: r.label, value: String(r.value ?? "").trim() }))
    .filter((r) => r.value);
  return { resumen, requisitos, condiciones, servicios, caracteristicas };
}
