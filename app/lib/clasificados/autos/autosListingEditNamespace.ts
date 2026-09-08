/**
 * Gate I.11A — Listing-scoped draft namespace for Autos (Negocios + Privado).
 *
 * `autosNegociosDraftStorage.ts` / `autosPrivadoDraftStorage.ts` and every IndexedDB helper they
 * call (`autosNegociosDraftImageIdb.ts`, `autosNegociosDraftVideoIdb.ts`, `autosNegociosDraftIdbRefs.ts`)
 * already treat `namespace` as an opaque scoping string — they never parse or validate it. Prior
 * to this gate, every caller passed the raw per-user namespace (`u:<userId>` / `anon:<installId>`)
 * for BOTH a fresh "new listing" application and "edit an existing published listing" — meaning
 * opening dashboard-edit for listing A would overwrite the same session/IndexedDB keys a
 * concurrently in-progress "new listing" draft (or a different listing B's edit) was using.
 *
 * This function derives a distinct, listing-scoped namespace so callers can pass it wherever they
 * previously passed the raw namespace, with zero changes required to the storage/IDB layer itself.
 */
export function autosListingEditNamespace(baseNamespace: string, listingId: string | null | undefined): string {
  const id = (listingId ?? "").trim();
  if (!id) return baseNamespace;
  return `${baseNamespace}:listingEdit:${id}`;
}

export function isAutosListingEditNamespace(namespace: string): boolean {
  return namespace.includes(":listingEdit:");
}
