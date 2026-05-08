/**
 * PostgREST / Supabase errors when `listing_analytics` is missing, renamed, or not in schema cache.
 */
export function isListingAnalyticsTableUnavailableError(message: string | undefined | null): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  if (m.includes("pgrst205")) return true;
  if (!m.includes("listing_analytics")) return false;
  if (m.includes("schema cache")) return true;
  if (m.includes("could not find the table")) return true;
  if (m.includes("does not exist")) return true;
  return false;
}
