import { FaMoneyBillWave } from "react-icons/fa";
import type { ServiciosProfileResolved, ServiciosLang } from "../types/serviciosBusinessProfile";
import { getServiciosProfileLabels } from "../copy/serviciosProfileCopy";
import {
  getServiciosPaymentMethodLabel,
  isServiciosPaymentMethodId,
} from "../lib/serviciosPaymentMethodCatalog";
import { SV } from "./serviciosDesignTokens";

export function ServiciosPagosCard({ profile, lang }: { profile: ServiciosProfileResolved; lang: ServiciosLang }) {
  if (!profile.paymentMethodIds.length) return null;
  const L = getServiciosProfileLabels(lang);

  return (
    <section
      className="rounded-2xl border p-4 shadow-sm sm:p-6 md:p-8"
      style={{ backgroundColor: SV.card, borderColor: SV.border, boxShadow: SV.shadowSm }}
    >
      <div className="flex items-center gap-2">
        <FaMoneyBillWave className="h-5 w-5 shrink-0 text-[#3B66AD]" aria-hidden />
        <h2 className="text-lg font-bold tracking-tight text-[color:var(--lx-text)] md:text-xl">{L.paymentsTitle}</h2>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {profile.paymentMethodIds.map((id) =>
          isServiciosPaymentMethodId(id) ? (
            <div
              key={id}
              className="rounded-xl border border-black/[0.06] bg-white/95 px-3.5 py-2 text-sm font-medium leading-snug text-[color:var(--lx-text)] shadow-sm"
              style={{ borderColor: SV.goldBorder }}
            >
              {getServiciosPaymentMethodLabel(id, lang)}
            </div>
          ) : null,
        )}
      </div>
    </section>
  );
}
