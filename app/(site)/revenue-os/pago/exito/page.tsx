import { lookupRevenuePaymentProof } from "@/app/lib/listingPlans/revenuePaymentLookup";
import { resolveRevenueOsSuccessReturnPath } from "@/app/lib/listingPlans/revenueOsReturnPath";
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
  const category = typeof params.category === "string" ? params.category : "";
  const packageKey = typeof params.package_key === "string" ? params.package_key : "";
  const returnToRaw = typeof params.return_to === "string" ? params.return_to : null;
  const boostSource = typeof params.boost_source === "string" ? params.boost_source : null;
  const returnTo = resolveRevenueOsSuccessReturnPath({
    returnTo: returnToRaw,
    category,
    packageKey,
    lang,
  });

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
      category={category}
      boostSource={boostSource}
      showRefreshHint
    />
  );
}
