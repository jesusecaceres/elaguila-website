import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getBearerUserId } from "@/app/api/clasificados/_lib/bearerUser";
import {
  submitEnVentaListingReport,
  type SubmitEnVentaListingReportResult,
} from "@/app/(site)/clasificados/en-venta/report/submitEnVentaListingReport";
import type { EnVentaReportReasonCode } from "@/app/(site)/clasificados/en-venta/moderation/enVentaPolicyCopy";

export const runtime = "nodejs";

const REASON_CODES: EnVentaReportReasonCode[] = [
  "policy",
  "offensive",
  "prohibited",
  "scam",
  "misleading",
  "wrong_category",
  "sold_unavailable",
  "other",
];

function isReasonCode(v: unknown): v is EnVentaReportReasonCode {
  return typeof v === "string" && (REASON_CODES as string[]).includes(v);
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const o = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const listingId = String(o.listingId ?? "").trim();
  const reasonCode = o.reasonCode;
  const details = String(o.details ?? "").trim().slice(0, 1500);
  const lang = o.lang === "en" ? "en" : "es";

  if (!listingId) {
    return NextResponse.json({ ok: false, error: "missing_listing_id" }, { status: 400 });
  }
  if (!isReasonCode(reasonCode)) {
    return NextResponse.json({ ok: false, error: "invalid_reason" }, { status: 400 });
  }

  const reporterId = await getBearerUserId(req);

  let result: SubmitEnVentaListingReportResult;
  try {
    result = await submitEnVentaListingReport({
      listingId,
      reasonCode,
      details,
      reporterId,
      lang,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "report_failed";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }

  if (!result.ok) {
    return NextResponse.json(result, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    reportId: result.reportId,
    adminEmailSent: result.adminEmailSent,
  });
}
