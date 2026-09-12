import { NextRequest, NextResponse } from "next/server";

/**
 * Gate G23 — shared Globalization address-suggestion endpoint.
 *
 * Server-side only: keeps GOOGLE_MAPS_API_KEY out of the browser bundle entirely. Any
 * authenticated owner-application flow across categories may call this — it carries no
 * category-specific logic and writes nothing (read-only lookup). Manual entry never depends on
 * this route succeeding; a caller that gets `ok:false` (missing config, provider error, or zero
 * results) must fall back to plain manual address entry, never block saving.
 */
import { googleAddressProvider } from "@/app/lib/businessAddress/providers/googleAddressProvider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_QUERY_CHARS = 200;

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid_json" }, { status: 400 });
  }

  const query = typeof (body as { query?: unknown })?.query === "string" ? (body as { query: string }).query : "";
  const country = typeof (body as { country?: unknown })?.country === "string" ? (body as { country: string }).country : undefined;

  const trimmed = query.trim();
  if (!trimmed) {
    return NextResponse.json({ ok: false, reason: "empty_query" }, { status: 400 });
  }
  if (trimmed.length > MAX_QUERY_CHARS) {
    return NextResponse.json({ ok: false, reason: "query_too_long" }, { status: 400 });
  }

  const result = await googleAddressProvider.suggest(trimmed, country ? { country } : undefined);
  if (!result.ok) {
    // Not an HTTP error: "no provider configured" / zero-match / provider hiccup are all
    // legitimate, expected outcomes the caller must degrade gracefully from, never treat as a
    // hard failure of the owner's ability to save a manual address.
    return NextResponse.json({ ok: false, reason: result.reason }, { status: 200 });
  }

  return NextResponse.json({ ok: true, suggestions: result.suggestions }, { status: 200 });
}
