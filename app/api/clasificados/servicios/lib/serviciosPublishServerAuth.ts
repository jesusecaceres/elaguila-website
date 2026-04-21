import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

/**
 * Production-style Servicios publish: real DB + authenticated provider only.
 * Preview / local dev stays lenient unless `SERVICIOS_STRICT_PUBLISH=1`.
 */
export function isServiciosStrictPublishEnvironment(): boolean {
  if (process.env.SERVICIOS_STRICT_PUBLISH === "1") return true;
  return process.env.VERCEL_ENV === "production";
}

export async function serviciosOwnerIdFromBearer(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  const sb = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}
