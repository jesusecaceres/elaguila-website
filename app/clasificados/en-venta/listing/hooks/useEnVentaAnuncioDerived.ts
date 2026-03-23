"use client";

import { useMemo } from "react";
import type { EnVentaAnuncioListingLike } from "../types/enVentaAnuncioLiveTypes";
import { isEnVentaCategoryKey } from "../utils/enVentaAnuncioLiveDerived";

export type EnVentaAnuncioDerived = {
  isEnVenta: boolean;
};

export function useEnVentaAnuncioDerived(options: {
  listing: EnVentaAnuncioListingLike | null | undefined;
}): EnVentaAnuncioDerived {
  const { listing } = options;
  return useMemo(
    () => ({
      isEnVenta: isEnVentaCategoryKey(listing?.category),
    }),
    [listing?.category]
  );
}
