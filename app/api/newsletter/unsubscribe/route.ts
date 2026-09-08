import { NextResponse } from "next/server";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { processNewsletterUnsubscribeToken } from "@/app/lib/newsletter/newsletterUnsubscribeServer";

/**
 * Real newsletter unsubscribe path.
 * Gate: CHECKOUT-NEWSLETTER-CHECKBOX-CAPTURE-01 (Step 5)
 *
 * Token-based (RFC 8058 one-click-unsubscribe style) — GET is intentional and safe here: the
 * token is an unguessable per-subscriber secret, the operation is idempotent (a repeat click/bot
 * prefetch reports ALREADY_UNSUBSCRIBED rather than erroring or re-writing), and this is exactly
 * the standard shape of an email unsubscribe link. Never looks up by email — only by token — so
 * one subscriber can never affect another's row.
 *
 * Always returns HTTP 200 with a truthful discriminated `status` body (mirrors the
 * checkout-capture route's contract) — no fake success, no opaque failure.
 */
export const runtime = "nodejs";

async function handle(token: string | null) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ status: "FAILED", reason: "not_configured" });
  }
  if (!token) {
    return NextResponse.json({ status: "INVALID_TOKEN" });
  }

  let supabase;
  try {
    supabase = getAdminSupabase();
  } catch {
    return NextResponse.json({ status: "FAILED", reason: "not_configured" });
  }

  try {
    const result = await processNewsletterUnsubscribeToken(supabase, token);
    return NextResponse.json(result);
  } catch (e) {
    console.warn("[newsletter] unsubscribe threw", {
      message: e instanceof Error ? e.message : "unknown",
    });
    return NextResponse.json({ status: "FAILED", reason: "exception" });
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  return handle(url.searchParams.get("token"));
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ status: "FAILED", reason: "bad_json" });
  }
  const token = body && typeof body === "object" ? String((body as Record<string, unknown>).token ?? "") : "";
  return handle(token || null);
}
