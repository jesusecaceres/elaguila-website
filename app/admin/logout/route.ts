import { NextRequest, NextResponse } from "next/server";

import { clearLeonixAdminSessionCookies } from "@/app/lib/supabase/adminSession";

export async function POST(request: NextRequest) {
  const res = NextResponse.redirect(new URL("/admin/login", request.url), 303);
  clearLeonixAdminSessionCookies(res);
  return res;
}
