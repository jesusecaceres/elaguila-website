/**
 * Gate BIENES-NEGOCIO-2 — pure Admin destination builders for Bienes Raíces rows.
 *
 * Deliberately NOT `server-only`: a URL builder has no I/O and no server dependency, and keeping it
 * behind the server boundary would force every consumer (the panel, a test) to become server-only
 * too. These point at the EXISTING canonical Admin listing destination — no new route family.
 */

/** The existing staff listing detail/control page. */
export function adminBienesChildHref(listingId: string): string {
  return `/admin/workspace/clasificados/listings/${encodeURIComponent(listingId)}/edit`;
}

/** Same destination for a parent row — one canonical Admin doorway for both. */
export function adminBienesParentHref(listingId: string): string {
  return adminBienesChildHref(listingId);
}
