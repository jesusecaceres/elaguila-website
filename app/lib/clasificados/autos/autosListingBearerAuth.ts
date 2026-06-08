import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export type AutosPublishRequestUser = {
  id: string;
  email: string | null;
};

async function resolveAutosPublishUserFromBearer(token: string): Promise<AutosPublishRequestUser | null> {
  if (!isSupabaseAdminConfigured()) return null;
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user?.id) return null;
    return { id: data.user.id, email: data.user.email ?? null };
  } catch {
    return null;
  }
}

export async function getAutosPublishUserFromRequest(request: Request): Promise<AutosPublishRequestUser | null> {
  const auth = request.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : null;
  if (!token) return null;
  return resolveAutosPublishUserFromBearer(token);
}

export async function getAutosPublishUserIdFromRequest(request: Request): Promise<string | null> {
  const user = await getAutosPublishUserFromRequest(request);
  return user?.id ?? null;
}
