import "server-only";

import { cookies } from "next/headers";
import { requireAdminCookie } from "@/app/lib/supabase/server";

export async function assertAdminLeadExportAccess(): Promise<Response | null> {
  const jar = await cookies();
  if (!requireAdminCookie(jar)) {
    return new Response("Unauthorized", { status: 401 });
  }
  return null;
}
