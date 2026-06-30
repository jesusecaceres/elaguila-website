export type EmpleosGlobalLocationInput = {
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  stateRegion?: string | null;
  state?: string | null;
  postalCode?: string | null;
  zip?: string | null;
  country?: string | null;
  venue?: string | null;
  modality?: string | null;
};

export type EmpleosNormalizedGlobalLocation = {
  addressLine1: string;
  addressLine2: string;
  city: string;
  stateRegion: string;
  postalCode: string;
  country: string;
};

function clean(value: unknown): string {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

export function normalizeEmpleosGlobalLocation(input: EmpleosGlobalLocationInput): EmpleosNormalizedGlobalLocation {
  return {
    addressLine1: clean(input.addressLine1),
    addressLine2: clean(input.addressLine2),
    city: clean(input.city),
    stateRegion: clean(input.stateRegion) || clean(input.state),
    postalCode: clean(input.postalCode) || clean(input.zip),
    country: clean(input.country),
  };
}

export function formatEmpleosLocationLine(
  input: EmpleosGlobalLocationInput,
  opts?: { compact?: boolean; includePostal?: boolean; includeAddress?: boolean },
): string {
  const loc = normalizeEmpleosGlobalLocation(input);
  const compact = opts?.compact !== false;
  const locality = [loc.city, loc.stateRegion, compact ? loc.country : loc.postalCode, compact ? "" : loc.country]
    .filter(Boolean)
    .join(", ");
  const withPostal = opts?.includePostal && loc.postalCode && compact ? [locality, loc.postalCode].filter(Boolean).join(" · ") : locality;
  if (!opts?.includeAddress) return withPostal || "—";
  return [loc.addressLine1, loc.addressLine2, withPostal].filter(Boolean).join("\n") || "—";
}

export function formatEmpleosRemoteLocationLine(input: EmpleosGlobalLocationInput, lang: "es" | "en" = "es"): string {
  const base = formatEmpleosLocationLine(input, { compact: true });
  const remote = lang === "es" ? "Remoto" : "Remote";
  return base && base !== "—" ? `${remote} · ${base}` : remote;
}

export function buildEmpleosLocationSearchText(input: EmpleosGlobalLocationInput): string {
  const loc = normalizeEmpleosGlobalLocation(input);
  return [loc.addressLine1, loc.addressLine2, loc.city, loc.stateRegion, loc.postalCode, loc.country, input.venue]
    .map(clean)
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}
