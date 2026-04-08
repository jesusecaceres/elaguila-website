import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export async function getAutosPublishUserIdFromRequest(request: Request): Promise<string | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const auth = request.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : null;
  if (!token) return null;
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user?.id) return null;
    return data.user.id;
  } catch {
    return null;
  }
}
