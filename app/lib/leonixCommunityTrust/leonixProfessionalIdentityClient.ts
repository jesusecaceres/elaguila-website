/** Item 21 — client-side resolver, mirrors fetchLeonixEndorsementSummary's fail-closed shape. */
import type { BrRentasCommunityTrustCategory } from "./leonixProfessionalIdentityServer";

export async function fetchLeonixProfessionalIdentityId(
  category: BrRentasCommunityTrustCategory,
  ownerId: string,
  displayName?: string | null,
): Promise<{ ok: true; id: string } | { ok: false }> {
  try {
    const params = new URLSearchParams({ category, ownerId });
    if (displayName?.trim()) params.set("displayName", displayName.trim());
    const res = await fetch(`/api/leonix-professional-identity?${params.toString()}`);
    const json = (await res.json().catch(() => ({}))) as { ok?: boolean; id?: string };
    if (!res.ok || !json.ok || !json.id) return { ok: false };
    return { ok: true, id: json.id };
  } catch {
    return { ok: false };
  }
}
