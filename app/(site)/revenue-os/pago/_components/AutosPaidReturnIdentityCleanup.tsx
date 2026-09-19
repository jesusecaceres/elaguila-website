"use client";

import { useEffect } from "react";

import {
  clearAutosLaneListingIdentity,
  getBrowserAutosIdentityStorages,
  readAutosDraftListingIdentity,
} from "@/app/lib/clasificados/autos/autosCanonicalListingIdentity";

/** Base packages whose success return means "the application row this browser saved is now paid". */
const AUTOS_BASE_PACKAGE_KEYS: ReadonlySet<string> = new Set(["autos_privado_30d", "autos_dealer_monthly"]);

/**
 * Stripe returned to the success URL for an Autos payment: the row this application saved is now
 * paid / awaiting activation, so its draft-bound identity must not be reused by the NEXT application
 * (which would otherwise fail closed with "already published" instead of starting a new listing).
 * Retry-after-cancel keeps the identity — only the success return clears it.
 *
 * Scoped (2026-09 forensic closeout): a lane's identity is cleared only when it IS the paid listing. A boost,
 * renewal or inventory pack return must not wipe an unrelated in-progress application's identity (its next
 * save would POST a duplicate row + Leonix Ad ID). When the paid listing id is unknown, only a base package
 * return clears (the pre-existing behaviour for that case).
 */
export function AutosPaidReturnIdentityCleanup({
  paidListingId,
  packageKey,
}: {
  paidListingId?: string | null;
  packageKey?: string | null;
}) {
  useEffect(() => {
    try {
      const storages = getBrowserAutosIdentityStorages();
      const paid = String(paidListingId ?? "").trim();
      const isBase = AUTOS_BASE_PACKAGE_KEYS.has(String(packageKey ?? "").trim());
      for (const lane of ["privado", "negocios"] as const) {
        if (paid) {
          const stored = readAutosDraftListingIdentity(storages, lane, lane);
          if (stored?.listingId === paid) clearAutosLaneListingIdentity(storages, lane);
        } else if (isBase) {
          clearAutosLaneListingIdentity(storages, lane);
        }
      }
    } catch {
      /* storage unavailable — nothing to clear */
    }
  }, [paidListingId, packageKey]);
  return null;
}
