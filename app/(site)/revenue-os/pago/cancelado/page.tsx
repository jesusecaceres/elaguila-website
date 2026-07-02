import Link from "next/link";
import { lookupRevenuePaymentProof } from "@/app/lib/listingPlans/revenuePaymentLookup";
import {
  resolveRevenueCategoryLabel,
  resolveRevenuePackageLabel,
} from "@/app/lib/listingPlans/revenueDisplay";

export const dynamic = "force-dynamic";

export default async function RevenueOsPagoCanceladoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const lang = params.lang === "en" ? "en" : "es";
  const category = typeof params.category === "string" ? params.category : "";
  const packageKey = typeof params.package_key === "string" ? params.package_key : "";
  const listingId = typeof params.listing_id === "string" ? params.listing_id : "";
  const sessionId = typeof params.session_id === "string" ? params.session_id : "";

  const proof = sessionId
    ? await lookupRevenuePaymentProof({ stripeCheckoutSessionId: sessionId, lang })
    : null;

  const paidDespiteCancel =
    proof?.found && proof.paymentState === "confirmed" && proof.entitlementState === "active";

  const dashboardHref = lang === "es" ? "/dashboard/mis-anuncios?lang=es" : "/dashboard/mis-anuncios?lang=en";
  const categoryLabel = resolveRevenueCategoryLabel(category, lang);
  const packageLabel = resolveRevenuePackageLabel(packageKey, lang);

  return (
    <main className="mx-auto min-h-[50vh] max-w-xl px-4 py-12 sm:py-16">
      <div className="rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7]/95 p-6 shadow-sm sm:p-8">
        <p className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">Leonix Revenue OS</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#1E1810] sm:text-3xl">
          {lang === "es" ? "Pago cancelado" : "Payment canceled"}
        </h1>

        {paidDespiteCancel ? (
          <p className="mt-3 text-sm leading-relaxed text-emerald-900">
            {lang === "es"
              ? "Encontramos un pago confirmado para esta sesión. Tu plan del anuncio ya está activo."
              : "We found a confirmed payment for this session. Your ad plan is already active."}
          </p>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-[#5C5346]">
            {lang === "es"
              ? "No completaste el pago en Stripe. Tu anuncio no fue activado por pago — solo el webhook verificado activa el plan del anuncio."
              : "You did not complete payment in Stripe. Your listing was not activated by payment — only the verified webhook activates the ad plan."}
          </p>
        )}

        {(category || packageKey || listingId) && (
          <dl className="mt-6 space-y-2 rounded-xl border border-[#E8DFD0]/80 bg-white/70 p-4 text-sm">
            {category ? (
              <div className="flex justify-between gap-4">
                <dt className="text-[#7A7164]">{lang === "es" ? "Categoría" : "Category"}</dt>
                <dd className="font-semibold text-[#1E1810]">{categoryLabel}</dd>
              </div>
            ) : null}
            {packageKey ? (
              <div className="flex justify-between gap-4">
                <dt className="text-[#7A7164]">{lang === "es" ? "Plan del anuncio" : "Ad plan"}</dt>
                <dd className="font-semibold text-[#1E1810]">{packageLabel}</dd>
              </div>
            ) : null}
            {listingId ? (
              <div className="flex justify-between gap-4">
                <dt className="text-[#7A7164]">{lang === "es" ? "Anuncio" : "Listing"}</dt>
                <dd className="font-semibold text-[#1E1810]">{listingId}</dd>
              </div>
            ) : null}
          </dl>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          {paidDespiteCancel ? (
            <Link
              href={dashboardHref}
              className="inline-flex rounded-xl bg-[#2A2620] px-5 py-2.5 text-sm font-semibold text-[#FAF7F2] hover:bg-[#1a1814]"
            >
              {lang === "es" ? "Ver Mis anuncios" : "View My listings"}
            </Link>
          ) : (
            <>
              {category && packageKey && listingId ? (
                <Link
                  href={`/dashboard/mis-anuncios?lang=${lang}`}
                  className="inline-flex rounded-xl bg-[#2A2620] px-5 py-2.5 text-sm font-semibold text-[#FAF7F2] hover:bg-[#1a1814]"
                >
                  {lang === "es" ? "Volver al panel" : "Back to dashboard"}
                </Link>
              ) : null}
              <Link
                href={dashboardHref}
                className="inline-flex rounded-xl border border-[#E8DFD0] bg-white px-5 py-2.5 text-sm font-semibold text-[#2C2416] hover:bg-[#FAF7F2]"
              >
                {lang === "es" ? "Mis anuncios" : "My listings"}
              </Link>
            </>
          )}
          <Link
            href={lang === "es" ? "/contacto?lang=es" : "/contact?lang=en"}
            className="inline-flex px-5 py-2.5 text-sm font-semibold text-[#5C5346] underline-offset-2 hover:underline"
          >
            {lang === "es" ? "Contactar soporte" : "Contact support"}
          </Link>
        </div>
      </div>
    </main>
  );
}
