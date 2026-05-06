/** Certification list caps (advertiser-provided free text) */
export const MAX_SERVICIOS_CERTIFICATIONS = 24;
export const SERVICIOS_CERTIFICATION_LABEL_MAX = 72;

export function normalizeCredentialDedupeKey(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function sanitizeCertificationLabels(raw: string[] | undefined | null): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const t = item.trim().slice(0, SERVICIOS_CERTIFICATION_LABEL_MAX);
    if (!t) continue;
    const k = normalizeCredentialDedupeKey(t);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(t);
    if (out.length >= MAX_SERVICIOS_CERTIFICATIONS) break;
  }
  return out;
}

export const SERVICIOS_CREDENTIAL_STRING_MAX = {
  licenseType: 120,
  licenseNumber: 64,
  licenseAuthority: 160,
  licenseExpiration: 32,
  insuranceType: 120,
  documentUrl: 2048,
} as const;
