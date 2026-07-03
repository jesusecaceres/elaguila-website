import { NextResponse, type NextRequest } from "next/server";
import { getBearerUserId } from "@/app/api/clasificados/_lib/bearerUser";
import {
  PROMO_CHECKOUT_INVALID_MESSAGE,
  validatePromoForPublishCheckout,
} from "@/app/lib/listingPlans/revenuePromoValidation";
import { isRevenueSupabaseAdminConfigured } from "@/app/lib/listingPlans/revenueCheckout";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ValidateBody = {
  code?: string;
  category?: string;
  packageKey?: string;
  subtotalCents?: number;
  listingId?: string | null;
  customerEmail?: string | null;
  locale?: "es" | "en";
};

export async function POST(request: NextRequest) {
  const locale =
    request.headers.get("accept-language")?.toLowerCase().startsWith("en") ? "en" : "es";

  if (!isRevenueSupabaseAdminConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        userMessage:
          locale === "es"
            ? "Este código promocional no es válido para este pago."
            : PROMO_CHECKOUT_INVALID_MESSAGE.en,
      },
      { status: 503 },
    );
  }

  let body: ValidateBody;
  try {
    body = (await request.json()) as ValidateBody;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        userMessage:
          locale === "es" ? PROMO_CHECKOUT_INVALID_MESSAGE.es : PROMO_CHECKOUT_INVALID_MESSAGE.en,
      },
      { status: 400 },
    );
  }

  const reqLocale = body.locale === "en" ? "en" : body.locale === "es" ? "es" : locale;
  const code = String(body.code ?? "").trim();
  if (!code) {
    return NextResponse.json(
      {
        ok: false,
        userMessage:
          reqLocale === "es" ? PROMO_CHECKOUT_INVALID_MESSAGE.es : PROMO_CHECKOUT_INVALID_MESSAGE.en,
      },
      { status: 400 },
    );
  }

  void getBearerUserId(request);

  const result = await validatePromoForPublishCheckout({
    code,
    category: String(body.category ?? ""),
    packageKey: String(body.packageKey ?? ""),
    subtotalCents: Number(body.subtotalCents ?? 0),
    listingId: body.listingId,
    customerEmail: body.customerEmail,
    locale: reqLocale,
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: 200 });
  }

  return NextResponse.json(result);
}
