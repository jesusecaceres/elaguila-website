"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createEmptyRestauranteDraft } from "./createEmptyRestauranteDraft";
import type { RestauranteListingDraft } from "./restauranteDraftTypes";
import {
  clearRestauranteDraftStorage,
  loadRestauranteDraftFromStorage,
  resetRestauranteDraftInStorage,
  saveRestauranteDraftToStorage,
} from "./restauranteDraftStorage";

function trimDraftStrings(d: RestauranteListingDraft): RestauranteListingDraft {
  const t = (s: string | undefined) => {
    if (s == null) return undefined;
    const x = s.trim();
    return x === "" ? undefined : x;
  };
  return {
    ...d,
    businessName: d.businessName.trim(),
    businessType: d.businessType.trim(),
    businessTypeCustom: t(d.businessTypeCustom),
    primaryCuisine: d.primaryCuisine.trim(),
    primaryCuisineCustom: t(d.primaryCuisineCustom),
    secondaryCuisine: t(d.secondaryCuisine),
    secondaryCuisineCustom: t(d.secondaryCuisineCustom),
    additionalCuisineOtherCustom: t(d.additionalCuisineOtherCustom),
    languageOtherCustom: t(d.languageOtherCustom),
    serviceModeOtherCustom: t(d.serviceModeOtherCustom),
    shortSummary: d.shortSummary.trim(),
    longDescription: t(d.longDescription),
    cityCanonical: d.cityCanonical.trim(),
    neighborhood: t(d.neighborhood),
    zipCode: t(d.zipCode),
    specialHoursNote: t(d.specialHoursNote),
    temporaryHoursNote: t(d.temporaryHoursNote),
    websiteUrl: t(d.websiteUrl),
    phoneNumber: t(d.phoneNumber),
    email: t(d.email),
    whatsAppNumber: t(d.whatsAppNumber),
    instagramUrl: t(d.instagramUrl),
    facebookUrl: t(d.facebookUrl),
    tiktokUrl: t(d.tiktokUrl),
    youtubeUrl: t(d.youtubeUrl),
    reservationUrl: t(d.reservationUrl),
    orderUrl: t(d.orderUrl),
    menuUrl: t(d.menuUrl),
    addressLine1: t(d.addressLine1),
    addressLine2: t(d.addressLine2),
    state: t(d.state),
    serviceAreaText: t(d.serviceAreaText),
    googleReviewUrl: t(d.googleReviewUrl),
    yelpReviewUrl: t(d.yelpReviewUrl),
    testimonialSnippet: t(d.testimonialSnippet),
  };
}

export function useRestauranteDraft() {
  const [hydrated, setHydrated] = useState(false);
  const [draft, setDraft] = useState<RestauranteListingDraft>(() => createEmptyRestauranteDraft());
  const draftRef = useRef(draft);
  draftRef.current = draft;

  useEffect(() => {
    const loaded = loadRestauranteDraftFromStorage();
    if (loaded) setDraft(loaded);
    setHydrated(true);
  }, []);

  const persist = useCallback((next: RestauranteListingDraft) => {
    return saveRestauranteDraftToStorage(next);
  }, []);

  const setDraftPatch = useCallback(
    (patch: Partial<RestauranteListingDraft>) => {
      setDraft((prev) => {
        const merged = { ...prev, ...patch };
        persist(merged);
        return merged;
      });
    },
    [persist]
  );

  const replaceDraft = useCallback(
    (next: RestauranteListingDraft) => {
      setDraft(next);
      persist(next);
    },
    [persist]
  );

  const resetDraft = useCallback(() => {
    const next = resetRestauranteDraftInStorage();
    setDraft(next);
  }, []);

  const clearStorageOnly = useCallback(() => {
    clearRestauranteDraftStorage();
    const next = createEmptyRestauranteDraft();
    setDraft(next);
  }, []);

  return {
    hydrated,
    draft,
    draftRef,
    setDraftPatch,
    replaceDraft,
    resetDraft,
    clearStorageOnly,
    trimDraftStrings,
  };
}
