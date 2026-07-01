import { NextResponse } from "next/server";
import {
  fulfillCheckoutSessionCompleted,
  markCheckoutSessionExpired,
} from "@/app/lib/listingPlans/revenueFulfillment";
import {
  REVENUE_WEBHOOK_EVENT_CHECKOUT_COMPLETED,
  REVENUE_WEBHOOK_EVENT_CHECKOUT_EXPIRED,
  verifyStripeWebhookEvent,
} from "@/app/lib/listingPlans/revenueWebhook";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getStripeSecretKey(): string | null {
  return process.env.STRIPE_SECRET_KEY?.trim() || null;
}

function getStripeWebhookSecret(): string | null {
  return process.env.STRIPE_WEBHOOK_SECRET?.trim() || null;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  const verified = verifyStripeWebhookEvent({
    rawBody,
    signature,
    webhookSecret: getStripeWebhookSecret(),
    stripeSecretKey: getStripeSecretKey(),
  });

  if (!verified.ok) {
    return NextResponse.json({ ok: false, code: verified.code }, { status: verified.status });
  }

  const { event } = verified;

  if (event.type === REVENUE_WEBHOOK_EVENT_CHECKOUT_COMPLETED) {
    const result = await fulfillCheckoutSessionCompleted({
      session: event.data.object,
      eventId: event.id,
      eventType: event.type,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          received: true,
          ok: false,
          code: result.code,
          message: result.message,
        },
        { status: 422 },
      );
    }

    return NextResponse.json({
      received: true,
      ok: true,
      idempotent: result.idempotent === true,
      paymentRecordId: result.paymentRecordId ?? null,
    });
  }

  if (event.type === REVENUE_WEBHOOK_EVENT_CHECKOUT_EXPIRED) {
    const result = await markCheckoutSessionExpired({
      session: event.data.object,
      eventId: event.id,
      eventType: event.type,
    });

    return NextResponse.json({
      received: true,
      ok: result.ok,
      code: result.code ?? null,
      idempotent: result.idempotent === true,
    });
  }

  return NextResponse.json({
    received: true,
    ok: true,
    ignored: true,
    eventType: event.type,
  });
}
