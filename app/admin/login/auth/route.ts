import { NextRequest, NextResponse } from "next/server";

import {
  applyLeonixAdminSessionCookies,
  lookupActiveAdminRosterByEmail,
  verifyAdminSupabaseCredentials,
} from "@/app/lib/supabase/adminSession";

/**
 * Staff/owner email+password login — sets leonix_admin session cookies after Supabase Auth + roster check.
 */
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email.includes("@") || !password) {
    return NextResponse.redirect(new URL("/admin/login?error=auth", request.url), 303);
  }

  const verified = await verifyAdminSupabaseCredentials(email, password);
  if (!verified.ok) {
    return NextResponse.redirect(new URL("/admin/login?error=auth", request.url), 303);
  }

  const roster = await lookupActiveAdminRosterByEmail(verified.email);
  if (!roster.ok) {
    const code = roster.code === "inactive" ? "inactive" : "not_roster";
    return NextResponse.redirect(new URL(`/admin/login?error=${code}`, request.url), 303);
  }

  const role = roster.role.trim().toLowerCase();
  const dest =
    role === "super_admin" || role === "sales_manager" || role === "content_manager"
      ? "/admin"
      : "/admin/team";

  const res = NextResponse.redirect(new URL(dest, request.url), 303);
  applyLeonixAdminSessionCookies(res, {
    operatorEmail: verified.email,
    authUserId: verified.userId,
    bootstrap: false,
  });
  return res;
}
