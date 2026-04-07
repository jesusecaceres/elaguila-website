"use client";

import { useMemo } from "react";
import type { AutosAnuncioFactPair, AutosAnuncioLang, AutosAnuncioListingLike } from "../types/autosAnuncioLiveTypes";
import { buildAutosAnuncioLiveFacts } from "../utils/autosAnuncioLiveDerived";

export type AutosAnuncioDerived = {
  autosLiveFacts: { facts: AutosAnuncioFactPair[] } | null;
};

export function useAutosAnuncioDerived(options: {
  listing: AutosAnuncioListingLike | null | undefined;
  lang: AutosAnuncioLang;
}): AutosAnuncioDerived {
  const { listing, lang } = options;
  const active = listing?.category === "autos";

  const autosLiveFacts = useMemo(
    () => (active && listing ? buildAutosAnuncioLiveFacts(listing, lang) : null),
    [active, listing, lang]
  );

  return { autosLiveFacts };
}
