/**
 * Gate G.2.3.1 — minimal browser client for the new BR server-authorized lifecycle mutation
 * route. Mirrors the existing `fetchDashboardListingPackageEntitlementBadges` pattern (session
 * access token -> bearer header -> POST). No Supabase table write happens client-side anymore
 * for BR pause/resume/archive/discontinue/republish — this only calls the server route.
 */
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";

export type BrLifecycleMutationKey = "pause" | "resume" | "archive" | "discontinue" | "republish" | "activate_pending";

export type BrLifecycleMutationClientResult =
  | { ok: true; status: string; isPublished: boolean }
  | { ok: false; code: string; message?: string };

export async function callBrLifecycleMutation(input: {
  listingId: string;
  mutation: BrLifecycleMutationKey;
}): Promise<BrLifecycleMutationClientResult> {
  const listingId = input.listingId.trim();
  if (!listingId) return { ok: false, code: "invalid_request" };

  const supabase = createSupabaseBrowserClient();
  const { data: auth } = await supabase.auth.getSession();
  const token = auth.session?.access_token;
  if (!token?.trim()) return { ok: false, code: "br_lifecycle_auth_required" };

  try {
    const res = await fetch("/api/clasificados/bienes-raices/listing-lifecycle", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token.trim()}`,
      },
      body: JSON.stringify({ listingId, mutation: input.mutation }),
    });
    const json = (await res.json().catch(() => null)) as
      | { ok?: boolean; code?: string; message?: string; status?: string; isPublished?: boolean }
      | null;
    if (!res.ok || !json?.ok) {
      return { ok: false, code: json?.code ?? "br_lifecycle_request_failed", message: json?.message };
    }
    return { ok: true, status: String(json.status ?? ""), isPublished: json.isPublished === true };
  } catch {
    return { ok: false, code: "br_lifecycle_request_failed" };
  }
}
