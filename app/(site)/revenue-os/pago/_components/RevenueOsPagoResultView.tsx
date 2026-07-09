import Link from "next/link";
import type { RevenuePaymentProof } from "@/app/lib/listingPlans/revenuePaymentLookup";
import {
  buildDashboardMisAnunciosReturnPath,
  resolveRevenueCategoryDefaultReturnPath,
  sanitizeRevenueOsReturnPath,
} from "@/app/lib/listingPlans/revenueOsReturnPath";
import { resolveBienesInventoryPackSuccessPrimaryCta } from "@/app/(site)/dashboard/lib/bienesDashboardInventoryAddonCheckout";
import { resolveAutosDealerInventoryPackSuccessPrimaryCta } from "@/app/(site)/dashboard/lib/autosDashboardInventoryAddonCheckout";
import { resolveRestauranteOffersAddonSuccessPrimaryCta } from "@/app/(site)/dashboard/lib/restaurantesDashboardCouponAddonCheckout";
import { resolveServiciosOffersAddonSuccessPrimaryCta } from "@/app/(site)/dashboard/lib/serviciosDashboardOffersAddonCheckout";

const SHELL = "mx-auto max-w-xl px-4 py-12 sm:py-16";

type Copy = {
  title: string;
  subtitle: string;
  body: string;
  detailLines: Array<{ label: string; value: string | null }>;
  note?: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  supportHref: string;
  supportLabel: string;
  tone: "success" | "warn" | "neutral" | "error";
};

function resolveCopy(
  proof: RevenuePaymentProof,
  lang: "en" | "es",
  returnTo?: string | null,
  category?: string | null,
): Copy {
  const dashboardHref = buildDashboardMisAnunciosReturnPath(lang);
  const categoryHref = resolveRevenueCategoryDefaultReturnPath(category ?? proof.category ?? "", lang);
  const safeReturnTo = returnTo?.trim()
    ? sanitizeRevenueOsReturnPath(returnTo, dashboardHref)
    : null;
  const supportHref = lang === "es" ? "/contacto?lang=es" : "/contact?lang=en";
  const offersAddonPrimaryCta =
    resolveRestauranteOffersAddonSuccessPrimaryCta({
      packageKey: proof.packageKey,
      listingId: proof.listingId,
      leonixAdId: proof.leonixAdId,
      lang,
    }) ??
    resolveServiciosOffersAddonSuccessPrimaryCta({
      packageKey: proof.packageKey,
      listingId: proof.listingId,
      leonixAdId: proof.leonixAdId,
      lang,
    }) ??
    resolveBienesInventoryPackSuccessPrimaryCta({
      packageKey: proof.packageKey,
      listingId: proof.listingId,
      leonixAdId: proof.leonixAdId,
      lang,
    }) ??
    resolveAutosDealerInventoryPackSuccessPrimaryCta({
      packageKey: proof.packageKey,
      listingId: proof.listingId,
      leonixAdId: proof.leonixAdId,
      lang,
    });

  const detailLines: Copy["detailLines"] = [];
  if (proof.categoryLabel) detailLines.push({ label: lang === "es" ? "Categoría" : "Category", value: proof.categoryLabel });
  if (proof.packageLabel) detailLines.push({ label: lang === "es" ? "Plan del anuncio" : "Ad plan", value: proof.packageLabel });
  if (proof.leonixAdId) detailLines.push({ label: "Leonix Ad ID", value: proof.leonixAdId });
  if (proof.listingId) detailLines.push({ label: lang === "es" ? "Anuncio" : "Listing", value: proof.listingId });
  if (proof.amountDisplay) detailLines.push({ label: lang === "es" ? "Monto" : "Amount", value: proof.amountDisplay });
  if (proof.adPlanBadge) detailLines.push({ label: lang === "es" ? "Estado del plan" : "Plan status", value: proof.adPlanBadge });

  if (!proof.found) {
    return {
      title: lang === "es" ? "Pago no encontrado" : "Payment not found",
      subtitle: lang === "es" ? "Leonix Revenue OS" : "Leonix Revenue OS",
      body:
        lang === "es"
          ? "No encontramos un registro de pago para esta sesión. Si acabas de pagar, espera unos segundos y actualiza la página."
          : "We could not find a payment record for this session. If you just paid, wait a few seconds and refresh.",
      detailLines,
      note:
        lang === "es"
          ? "El pago solo se confirma cuando el webhook verificado de Stripe actualiza nuestro sistema."
          : "Payment is confirmed only when Stripe’s verified webhook updates our system.",
      primaryHref: dashboardHref,
      primaryLabel: lang === "es" ? "Ir a Mis anuncios" : "Go to My listings",
      supportHref,
      supportLabel: lang === "es" ? "Contactar soporte" : "Contact support",
      tone: "error",
    };
  }

  if (proof.paymentState === "confirmed" && proof.entitlementState === "active") {
    return {
      title: lang === "es" ? "Pago recibido" : "Payment received",
      subtitle: lang === "es" ? "Plan del anuncio activo" : "Ad plan active",
      body:
        lang === "es"
          ? "Stripe confirmó tu pago. Tu plan del anuncio está activo según nuestro registro verificado."
          : "Stripe confirmed your payment. Your listing ad plan is active per our verified records.",
      detailLines,
      note:
        lang === "es"
          ? "Activado por webhook verificado de Stripe — no por esta página."
          : "Activated by verified Stripe webhook — not by this page.",
      primaryHref: offersAddonPrimaryCta?.href ?? dashboardHref,
      primaryLabel: offersAddonPrimaryCta?.label ?? (lang === "es" ? "Volver a mi panel" : "Back to my dashboard"),
      secondaryHref: offersAddonPrimaryCta
        ? dashboardHref
        : safeReturnTo && safeReturnTo !== dashboardHref
          ? safeReturnTo
          : categoryHref,
      secondaryLabel: offersAddonPrimaryCta
        ? lang === "es"
          ? "Volver a mi panel"
          : "Back to my dashboard"
        : lang === "es"
          ? "Ver categoría"
          : "View category",
      supportHref,
      supportLabel: lang === "es" ? "Ayuda" : "Help",
      tone: "success",
    };
  }

  if (proof.paymentState === "confirmed" && proof.entitlementState !== "active") {
    return {
      title: lang === "es" ? "Pago recibido" : "Payment received",
      subtitle: lang === "es" ? "Confirmando tu anuncio…" : "Confirming your listing…",
      body:
        lang === "es"
          ? "Estamos confirmando la publicación de tu anuncio. Tu anuncio se activará cuando Stripe confirme el pago."
          : "We're confirming your listing. Your listing will activate when Stripe confirms payment.",
      detailLines,
      note: lang === "es" ? "Actualiza esta página en un momento." : "Refresh this page in a moment.",
      primaryHref: offersAddonPrimaryCta?.href ?? dashboardHref,
      primaryLabel: offersAddonPrimaryCta?.label ?? (lang === "es" ? "Volver a mi panel" : "Back to my dashboard"),
      secondaryHref: offersAddonPrimaryCta
        ? dashboardHref
        : safeReturnTo && safeReturnTo !== dashboardHref
          ? safeReturnTo
          : categoryHref,
      secondaryLabel: offersAddonPrimaryCta
        ? lang === "es"
          ? "Volver a mi panel"
          : "Back to my dashboard"
        : lang === "es"
          ? "Ver categoría"
          : "View category",
      supportHref,
      supportLabel: lang === "es" ? "Contactar soporte" : "Contact support",
      tone: "warn",
    };
  }

  if (proof.paymentState === "processing") {
    return {
      title: lang === "es" ? "Pago recibido" : "Payment received",
      subtitle: lang === "es" ? "Esperando confirmación de Stripe" : "Waiting for Stripe confirmation",
      body:
        lang === "es"
          ? "Estamos confirmando la publicación de tu anuncio. Tu anuncio se activará cuando Stripe confirme el pago."
          : "We're confirming your listing. Your listing will activate when Stripe confirms payment.",
      detailLines,
      note:
        lang === "es"
          ? "No marcamos nada como pagado hasta que Stripe envíe el webhook verificado. Si ya pagaste, espera unos segundos y actualiza."
          : "We do not mark anything paid until Stripe sends the verified webhook. If you already paid, wait a few seconds and refresh.",
      primaryHref: dashboardHref,
      primaryLabel: lang === "es" ? "Volver a mi panel" : "Back to my dashboard",
      secondaryHref: safeReturnTo && safeReturnTo !== dashboardHref ? safeReturnTo : categoryHref,
      secondaryLabel: lang === "es" ? "Ver categoría" : "View category",
      supportHref,
      supportLabel: lang === "es" ? "Contactar soporte" : "Contact support",
      tone: "warn",
    };
  }

  if (proof.paymentState === "canceled" || proof.paymentState === "expired") {
    return {
      title: lang === "es" ? "Pago no completado" : "Payment not completed",
      subtitle: lang === "es" ? "Sesión cancelada o expirada" : "Session canceled or expired",
      body:
        lang === "es"
          ? "Este pago no se completó. Tu anuncio no fue activado por pago."
          : "This payment was not completed. Your listing was not activated by payment.",
      detailLines,
      primaryHref: `/revenue-os/pago/cancelado?lang=${lang}`,
      primaryLabel: lang === "es" ? "Ver opciones" : "View options",
      secondaryHref: dashboardHref,
      secondaryLabel: lang === "es" ? "Mis anuncios" : "My listings",
      supportHref,
      supportLabel: lang === "es" ? "Ayuda" : "Help",
      tone: "neutral",
    };
  }

  return {
    title: lang === "es" ? "Estado del pago" : "Payment status",
    subtitle: "Leonix Revenue OS",
    body: lang === "es" ? "Consulta el estado de tu pago abajo." : "See your payment status below.",
    detailLines,
    primaryHref: dashboardHref,
    primaryLabel: lang === "es" ? "Mis anuncios" : "My listings",
    supportHref,
    supportLabel: lang === "es" ? "Ayuda" : "Help",
    tone: "neutral",
  };
}

function toneClasses(tone: Copy["tone"]): { ring: string; icon: string } {
  switch (tone) {
    case "success":
      return { ring: "border-emerald-200 bg-emerald-50/90", icon: "text-emerald-700" };
    case "warn":
      return { ring: "border-amber-200 bg-amber-50/90", icon: "text-amber-800" };
    case "error":
      return { ring: "border-red-200 bg-red-50/90", icon: "text-red-800" };
    default:
      return { ring: "border-[#E8DFD0] bg-[#FFFCF7]/95", icon: "text-[#5C5346]" };
  }
}

export function RevenueOsPagoResultView({
  proof,
  lang,
  returnTo,
  category,
  showRefreshHint,
}: {
  proof: RevenuePaymentProof;
  lang: "en" | "es";
  returnTo?: string | null;
  category?: string | null;
  showRefreshHint?: boolean;
}) {
  const copy = resolveCopy(proof, lang, returnTo, category);
  const tone = toneClasses(copy.tone);

  return (
    <main className={`${SHELL} min-h-[50vh]`}>
      <div className={`rounded-2xl border p-6 shadow-sm sm:p-8 ${tone.ring}`}>
        <p className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">{copy.subtitle}</p>
        <h1 className={`mt-2 text-2xl font-bold tracking-tight sm:text-3xl ${tone.icon}`}>{copy.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#5C5346]">{copy.body}</p>

        {copy.detailLines.length > 0 ? (
          <dl className="mt-6 space-y-2 rounded-xl border border-[#E8DFD0]/80 bg-white/70 p-4 text-sm">
            {copy.detailLines.map((line) =>
              line.value ? (
                <div key={line.label} className="flex flex-wrap justify-between gap-x-4 gap-y-1">
                  <dt className="font-medium text-[#7A7164]">{line.label}</dt>
                  <dd className="font-semibold text-[#1E1810]">{line.value}</dd>
                </div>
              ) : null,
            )}
          </dl>
        ) : null}

        {copy.note ? (
          <p className="mt-4 text-xs leading-relaxed text-[#7A7164]">{copy.note}</p>
        ) : null}

        {showRefreshHint && (proof.paymentState === "processing" || proof.entitlementState === "pending") ? (
          <p className="mt-2 text-xs text-[#7A7164]">
            {lang === "es"
              ? "Puedes actualizar esta página para ver el estado más reciente."
              : "You can refresh this page to see the latest status."}
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={copy.primaryHref}
            className="inline-flex rounded-xl bg-[#2A2620] px-5 py-2.5 text-sm font-semibold text-[#FAF7F2] hover:bg-[#1a1814]"
          >
            {copy.primaryLabel}
          </Link>
          {copy.secondaryHref && copy.secondaryLabel ? (
            <Link
              href={copy.secondaryHref}
              className="inline-flex rounded-xl border border-[#E8DFD0] bg-white px-5 py-2.5 text-sm font-semibold text-[#2C2416] hover:bg-[#FAF7F2]"
            >
              {copy.secondaryLabel}
            </Link>
          ) : null}
          <Link
            href={copy.supportHref}
            className="inline-flex rounded-xl border border-transparent px-5 py-2.5 text-sm font-semibold text-[#5C5346] underline-offset-2 hover:underline"
          >
            {copy.supportLabel}
          </Link>
        </div>
      </div>
    </main>
  );
}
