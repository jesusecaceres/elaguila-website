import type { AdminLang } from "@/app/admin/_lib/adminI18nCookie";
import type { AdminListingCommercialTruth } from "@/app/admin/_lib/adminListingCommercialTruth";
import { ADMIN_VIAJES_NO_PAYMENT_COPY, adminViajesCommercialView } from "@/app/admin/_lib/adminCategoryShellAdoption";
import { AdminCommercialTruthSection } from "../../_components/normalized/AdminListingCardSections";

/**
 * COMMERCIAL TRUTH for a Viajes staged listing (READ-ONLY, no hooks).
 *
 * Viajes has NO payment product: staged offers are moderated by staff and never sold through checkout.
 * When the read-only commercial loader finds no payment / entitlement / subscription record the cell
 * says so plainly ("No payment product") — it never renders an "unpaid" state, because there is
 * nothing to be unpaid. If a record DOES exist, or the sources could not be read, the shared
 * commercial section states exactly that instead.
 */
export function ViajesCommercialTruthCell({
  lang = "en",
  truth,
}: {
  lang?: AdminLang;
  truth: AdminListingCommercialTruth | null | undefined;
}) {
  const view = adminViajesCommercialView(truth);
  if (view === "no_payment_product") {
    const copy = ADMIN_VIAJES_NO_PAYMENT_COPY[lang];
    return (
      <div className="min-w-0 space-y-0.5" data-testid="admin-commercial-truth" data-state="no_payment_product">
        <p className="rounded-md border border-[#E8DFD0] bg-[#FAF7F2] px-2 py-1 text-[11px] font-bold leading-snug text-[#5C5346]">
          {copy.headline}
        </p>
        <p className="text-[10px] leading-snug text-[#9A9084]">{copy.detail}</p>
      </div>
    );
  }
  return <AdminCommercialTruthSection lang={lang} truth={truth} compact />;
}
