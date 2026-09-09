import { NextRequest, NextResponse } from "next/server";

import { applyLeonixAdminSessionCookies } from "@/app/lib/supabase/adminSession";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const password = String(formData.get("password") ?? "").trim();
  const expected = String(process.env.ADMIN_PASSWORD ?? "").trim();
  if (!expected || password !== expected) {
    return NextResponse.redirect(new URL("/admin/login?error=1", request.url), 303);
  }
  const res = NextResponse.redirect(new URL("/admin", request.url), 303);
  const result = applyLeonixAdminSessionCookies(res, { bootstrap: true });
  if (!result.ok) {
    // Fail closed: never redirect to /admin looking successful without a real signed session.
    return NextResponse.redirect(new URL("/admin/login?error=bootstrap_unavailable", request.url), 303);
  }
  return res;
}
