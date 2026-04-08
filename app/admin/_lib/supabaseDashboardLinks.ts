import "server-only";

/** Project ref from `https://<ref>.supabase.co` — used for dashboard deep links only. */
export function getSupabaseProjectRefFromEnv(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    const host = new URL(url).hostname;
    const sub = host.split(".")[0];
    return sub && sub.length > 0 ? sub : null;
  } catch {
    return null;
  }
}

/** Supabase Dashboard → Authentication → Users (password recovery, magic links). */
export function getSupabaseAuthUsersDashboardUrl(): string | null {
  const ref = getSupabaseProjectRefFromEnv();
  if (!ref) return null;
  return `https://supabase.com/dashboard/project/${ref}/auth/users`;
}
