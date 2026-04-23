/**
 * Rentas listing inquiries use the same server handler as En Venta;
 * `INQUIRY_CATEGORIES` in that route includes `rentas` for `listings` lookups.
 * This path exists so Rentas UI calls a category-named endpoint (clearer for QA and clients).
 */
export const runtime = "nodejs";

export { POST } from "../../en-venta/inquiry/route";
