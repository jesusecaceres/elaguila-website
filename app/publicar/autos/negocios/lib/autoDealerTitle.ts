export function buildVehicleTitle(
  year: number | undefined,
  make: string | undefined,
  model: string | undefined,
  trim: string | undefined,
): string {
  const parts: string[] = [];
  if (year !== undefined && Number.isFinite(year)) parts.push(String(year));
  [make, model, trim].forEach((x) => {
    const t = x?.trim();
    if (t) parts.push(t);
  });
  return parts.join(" ");
}
