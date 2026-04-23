import { isEmpleosInternalFilterRegion } from "@/app/publicar/empleos/shared/constants/empleosStandardRegion";
import { empleosFeriaPublicCityState } from "@/app/publicar/empleos/shared/lib/empleosPublicLocation";

import type { EmpleosJobRecord } from "../data/empleosJobTypes";

/**
 * One-line location for results / cards: venue-first for Feria; avoid NorCal as the only
 * headline when employer address or venue implies a more local label (legacy DB rows).
 */
export function empleosJobRecordListLocationLine(job: EmpleosJobRecord): string {
  if (job.publicationLane === "feria") {
    return empleosFeriaPublicCityState({
      city: job.city,
      state: job.state,
      venue: job.feriaVenue ?? "",
    }).cityLine;
  }

  const addr = job.employerAddressLine?.trim();
  if (addr && isEmpleosInternalFilterRegion(job.city)) {
    const tail = addr.match(/,\s*([A-Z]{2})(?:\s+\d{5}(?:-\d{4})?)?\s*$/);
    if (tail && tail.index != null) {
      const st = tail[1]!;
      const before = addr.slice(0, tail.index).trim();
      const parts = before.split(",").map((s) => s.trim()).filter(Boolean);
      const locality = parts.length ? parts[parts.length - 1]! : job.city;
      if (locality && !isEmpleosInternalFilterRegion(locality)) {
        const zip = job.postalCode?.trim();
        const base = `${locality}, ${st}`;
        return zip && !addr.includes(zip) ? `${base} · ${zip}` : base;
      }
    }
  }

  if (!isEmpleosInternalFilterRegion(job.city)) {
    const zip = job.postalCode?.trim();
    const base = `${job.city}, ${job.state}`.trim();
    return zip ? `${base} · ${zip}` : base;
  }

  if (addr) return addr;

  return `${job.city}, ${job.state}`.trim() || "—";
}
