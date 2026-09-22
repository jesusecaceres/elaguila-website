import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

/**
 * The customer/site identity a request carries, if any — the SAME bearer resolution the per-
 * category publish routes already perform (`serviciosOwnerIdFromBearer`,
 * `restauranteOwnerIdFromBearer`), lifted so the two assisted routes that never read a bearer
 * (Autos, Bienes) can answer the one question the mixed-context refusal needs: "is there a site
 * session on this request, and whose is it?"
 *
 * Read-only. Never grants anything: a resolved id is evidence of a second identity on the wire,
 * which in assisted mode is a reason to refuse, not to proceed.
 */
export async function customerUserIdFromBearer(req: NextRequest): Promise<string | null> {
  const auth = req.headers?.get?.("authorization") ?? null;
  const token = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  try {
    const sb = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await sb.auth.getUser(token);
    if (error || !data.user) return null;
    return data.user.id;
  } catch {
    return null;
  }
}
