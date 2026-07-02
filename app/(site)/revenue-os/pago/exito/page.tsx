import { lookupRevenuePaymentProof } from "@/app/lib/listingPlans/revenuePaymentLookup";
import { RevenueOsPagoResultView } from "../_components/RevenueOsPagoResultView";

export const dynamic = "force-dynamic";

export default async function RevenueOsPagoExitoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const lang = params.lang === "en" ? "en" : "es";
  const sessionId = typeof params.session_id === "string" ? params.session_id : "";
  const paymentRecordId = typeof params.payment_record_id === "string" ? params.payment_record_id : "";
  const returnTo = typeof params.return_to === "string" ? params.return_to : null;

  const proof = await lookupRevenuePaymentProof({
    stripeCheckoutSessionId: sessionId,
    paymentRecordId: paymentRecordId || undefined,
    lang,
  });

  return (
    <RevenueOsPagoResultView
      proof={proof}
      lang={lang}
      returnTo={returnTo}
      showRefreshHint
    />
  );
}
