import { NextResponse } from "next/server";

/**
 * Reserved checkout entry for Leonix BR/Rentas boosts — return 501 until product + Stripe Connect are wired.
 */
export async function POST() {
  return NextResponse.json(
    { ok: false, error: "leonix_checkout_not_enabled", message: "Boost checkout para BR/Rentas aún no está activo." },
    { status: 501 }
  );
}
