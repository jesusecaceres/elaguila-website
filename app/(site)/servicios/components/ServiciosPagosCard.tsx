import { FaMoneyBillWave } from "react-icons/fa";
import type { ServiciosProfileResolved, ServiciosLang } from "../types/serviciosBusinessProfile";
import { getServiciosProfileLabels } from "../copy/serviciosProfileCopy";
import { isServiciosPaymentMethodId } from "../lib/serviciosPaymentMethodCatalog";
import { ServiciosPaymentMethodBadge } from "./ServiciosPaymentMethodBadge";
import { SV } from "./serviciosDesignTokens";

export function ServiciosPagosCard({ profile, lang }: { profile: ServiciosProfileResolved; lang: ServiciosLang }) {
  if (!profile.paymentMethodIds.length && !profile.customPaymentMethods.length) return null;
  const L = getServiciosProfileLabels(lang);

  return (
    <section
      className="rounded-2xl border p-3 shadow-sm sm:p-6 md:p-8"
      style={{ backgroundColor: SV.card, borderColor: SV.border, boxShadow: SV.shadowSm }}
    >
      <div className="flex items-center gap-2">
        <FaMoneyBillWave className="h-5 w-5 shrink-0 text-[#3B66AD]" aria-hidden />
        <h2 className="text-lg font-bold tracking-tight text-[color:var(--lx-text)] md:text-xl">{L.paymentsTitle}</h2>
      </div>
      <div className="mt-4 flex flex-nowrap gap-2 overflow-x-auto pb-1 md:mt-5 md:flex-wrap md:overflow-visible">
        {profile.paymentMethodIds.map((id) =>
          isServiciosPaymentMethodId(id) ? (
            <div
              key={id}
              className="shrink-0 rounded-xl border border-black/[0.06] bg-white/95 px-3 py-2 shadow-sm"
              style={{ borderColor: SV.goldBorder }}
            >
              <ServiciosPaymentMethodBadge lang={lang} standardId={id} />
            </div>
          ) : null,
        )}
        {profile.customPaymentMethods.map((label, i) => (
          <div
            key={`pm-custom-${i}-${label.slice(0, 24)}`}
            className="shrink-0 rounded-xl border border-black/[0.06] bg-white/95 px-3 py-2 shadow-sm"
            style={{ borderColor: SV.goldBorder }}
          >
            <ServiciosPaymentMethodBadge lang={lang} customLabel={label} />
          </div>
        ))}
      </div>
    </section>
  );
}
