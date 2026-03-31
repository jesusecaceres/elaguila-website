import { NextResponse } from "next/server";
import { buildTiendaOrderEmailBodies } from "@/app/lib/tienda/formatTiendaOrderEmail";
import { generateTiendaOrderId } from "@/app/lib/tienda/generateTiendaOrderId";
import { sendTiendaOrderEmailResend } from "@/app/lib/tienda/sendTiendaOrderEmailResend";
import { validateTiendaOrderPayload } from "@/app/lib/tienda/validateTiendaOrderPayload";
import type { TiendaOrderSubmissionResult } from "@/app/tienda/types/orderSubmission";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<NextResponse<TiendaOrderSubmissionResult>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON", code: "BAD_JSON" }, { status: 400 });
  }

  const validated = validateTiendaOrderPayload(body);
  if (!validated.ok) {
    return NextResponse.json(
      { ok: false, error: validated.error, code: validated.code },
      { status: validated.code === "INVALID_PRODUCT" ? 404 : 400 }
    );
  }

  const orderId = generateTiendaOrderId();
  const submittedAt = new Date().toISOString();

  const { subject, text, html } = buildTiendaOrderEmailBodies(orderId, submittedAt, validated.payload);

  const sent = await sendTiendaOrderEmailResend({ subject, text, html });
  if (!sent.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: sent.message,
        code: "EMAIL_FAILED",
      },
      { status: 503 }
    );
  }

  return NextResponse.json({ ok: true, orderId, submittedAt });
}
