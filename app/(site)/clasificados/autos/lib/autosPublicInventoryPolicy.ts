/**
 * Public Autos inventory policy (launch vs demo).
 *
 * - **Default (production):** empty API responses stay empty — no blueprint rows masquerading as live inventory.
 * - **Demo:** set `NEXT_PUBLIC_LEONIX_AUTOS_PUBLIC_DEMO=1` in `.env.local` to show structured sample listings for UI/QA only.
 */
export function autosPublicDemoInventoryAllowed(): boolean {
  return process.env.NEXT_PUBLIC_LEONIX_AUTOS_PUBLIC_DEMO === "1";
}
