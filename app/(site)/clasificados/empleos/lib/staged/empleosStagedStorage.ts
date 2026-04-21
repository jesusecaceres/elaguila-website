import type { EmpleosCanonicalListing } from "./empleosCanonicalListing";

export const EMPLEOS_STAGED_REGISTRY_EVENT = "leonix-empleos-staged-registry-changed";

const STORAGE_KEY = "leonix_empleos_canonical_registry_v1";

function safeParse(raw: string | null): EmpleosCanonicalListing[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? (v as EmpleosCanonicalListing[]) : [];
  } catch {
    return [];
  }
}

export function readAllEmpleosCanonical(): EmpleosCanonicalListing[] {
  if (typeof window === "undefined") return [];
  try {
    return safeParse(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

export function writeAllEmpleosCanonical(rows: EmpleosCanonicalListing[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    window.dispatchEvent(new CustomEvent(EMPLEOS_STAGED_REGISTRY_EVENT));
  } catch {
    /* quota / private mode */
  }
}

export function upsertEmpleosCanonical(row: EmpleosCanonicalListing): void {
  const all = readAllEmpleosCanonical();
  const i = all.findIndex((r) => r.listingId === row.listingId);
  if (i >= 0) all[i] = row;
  else all.push(row);
  writeAllEmpleosCanonical(all);
}

export function getEmpleosCanonicalBySlug(slug: string): EmpleosCanonicalListing | undefined {
  return readAllEmpleosCanonical().find((r) => r.slug === slug);
}

export function getEmpleosCanonicalById(listingId: string): EmpleosCanonicalListing | undefined {
  return readAllEmpleosCanonical().find((r) => r.listingId === listingId);
}

export function listEmpleosCanonicalByOwner(ownerId: string): EmpleosCanonicalListing[] {
  return readAllEmpleosCanonical().filter((r) => r.ownerId === ownerId);
}

export function bumpEmpleosStagedAnalytics(
  listingId: string,
  field: keyof import("./empleosCanonicalListing").EmpleosStagedAnalytics,
): void {
  const all = readAllEmpleosCanonical();
  const i = all.findIndex((r) => r.listingId === listingId);
  if (i < 0) return;
  const row = all[i]!;
  const analytics = { ...row.analytics, [field]: row.analytics[field] + 1 };
  all[i] = { ...row, analytics, updatedAt: new Date().toISOString() };
  writeAllEmpleosCanonical(all);
}
