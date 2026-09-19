"use client";

import { useEffect } from "react";

import {
  clearAutosLaneListingIdentity,
  getBrowserAutosIdentityStorages,
} from "@/app/lib/clasificados/autos/autosCanonicalListingIdentity";

/**
 * Stripe returned to the success URL for an Autos payment: the row this application saved is now
 * paid / awaiting activation, so its draft-bound identity must not be reused by the NEXT application
 * (which would otherwise fail closed with "already published" instead of starting a new listing).
 * Retry-after-cancel keeps the identity — only the success return clears it.
 */
export function AutosPaidReturnIdentityCleanup() {
  useEffect(() => {
    try {
      const storages = getBrowserAutosIdentityStorages();
      clearAutosLaneListingIdentity(storages, "privado");
      clearAutosLaneListingIdentity(storages, "negocios");
    } catch {
      /* storage unavailable — nothing to clear */
    }
  }, []);
  return null;
}
