// app/api/supabase-test/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Read-only health check: confirms env + RLS allows public SELECT on listings.
export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      return NextResponse.json(
        { ok: false, error: "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY" },
        { status: 500 }
      );
    }

    const supabase = createClient(url, anonKey);

    const { data, error } = await supabase.from("listings").select("id").limit(1);

    return NextResponse.json({
      ok: !error,
      read: {
        ok: !error,
        error: error?.message ?? null,
        sampleCount: data?.length ?? 0,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
