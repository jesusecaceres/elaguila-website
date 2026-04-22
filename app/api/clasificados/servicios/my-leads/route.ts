import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { listServiciosLeadsForProvider } from "@/app/clasificados/servicios/lib/serviciosOpsTablesServer";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 503 });
  }

  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) {
    return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.json({ ok: false, error: "misconfigured" }, { status: 500 });
  }

  const sb = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user) {
    return NextResponse.json({ ok: false, error: "invalid_token" }, { status: 401 });
  }

  const leads = await listServiciosLeadsForProvider(data.user.id, 100);
  return NextResponse.json({
    ok: true,
    leads: leads.map((l) => ({
      id: l.id,
      listing_slug: l.listing_slug,
      sender_name: l.sender_name,
      sender_email: l.sender_email,
      message: l.message,
      request_kind: l.request_kind,
      created_at: l.created_at,
      read_at: l.read_at,
    })),
  });
}
