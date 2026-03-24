"use client";

import SectionShell from "@/app/clasificados/en-venta/shared/components/SectionShell";
import type { EnVentaProApplicationState } from "../schema/enVentaProFormState";
import type { EnVentaFreeSectionProps } from "../../../free/application/types/sectionProps";
import { inputClass, labelClass } from "../../../free/application/helpers/fieldCx";

const COPY = {
  es: {
    title: "Políticas y confianza",
    desc: "Devoluciones, garantías y señales de credibilidad — sin convertirse en BR.",
    ret: "Notas de devolución / cambios",
    war: "Garantía (si aplica)",
    appt: "Citas / visitas",
    del: "Notas de entrega / envío",
    delH: "Tiempos, costos o zonas de envío para este anuncio.",
    pick: "Notas de recogida",
    pickH: "Cómo coordinar recogida o qué esperar al recoger.",
    bio: "Bio del vendedor",
    exp: "Experiencia / historial",
    lang: "Idiomas",
    hours: "Horario de atención",
    pol: "Políticas de la tienda",
  },
  en: {
    title: "Policies & trust",
    desc: "Returns, warranty, and credibility signals — still marketplace En Venta.",
    ret: "Return / exchange notes",
    war: "Warranty (if any)",
    appt: "Appointments / visits",
    del: "Delivery / shipping notes",
    delH: "Timing, cost, or zones for this listing.",
    pick: "Pickup notes",
    pickH: "How pickup works or what buyers should expect.",
    bio: "Seller bio",
    exp: "Experience / track record",
    lang: "Languages",
    hours: "Business hours",
    pol: "Store policies",
  },
} as const;

export function PoliciesTrustSection({
  lang,
  state,
  setState,
}: EnVentaFreeSectionProps<EnVentaProApplicationState>) {
  const t = COPY[lang];
  return (
    <SectionShell lang={lang} title={t.title} description={t.desc}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>{t.ret}</label>
          <textarea
            className={`${inputClass} mt-2 min-h-[72px]`}
            value={state.returnNotes}
            onChange={(e) => setState((s) => ({ ...s, returnNotes: e.target.value }))}
          />
        </div>
        <div>
          <label className={labelClass}>{t.war}</label>
          <textarea
            className={`${inputClass} mt-2 min-h-[72px]`}
            value={state.warrantyNotes}
            onChange={(e) => setState((s) => ({ ...s, warrantyNotes: e.target.value }))}
          />
        </div>
      </div>
      <div>
        <label className={labelClass}>{t.appt}</label>
        <textarea
          className={`${inputClass} mt-2 min-h-[64px]`}
          value={state.appointmentNotes}
          onChange={(e) => setState((s) => ({ ...s, appointmentNotes: e.target.value }))}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>{t.del}</label>
          <p className="mt-1 text-xs text-white/45">{t.delH}</p>
          <textarea
            className={`${inputClass} mt-2 min-h-[72px]`}
            value={state.deliveryPolicyNotes}
            onChange={(e) => setState((s) => ({ ...s, deliveryPolicyNotes: e.target.value }))}
          />
        </div>
        <div>
          <label className={labelClass}>{t.pick}</label>
          <p className="mt-1 text-xs text-white/45">{t.pickH}</p>
          <textarea
            className={`${inputClass} mt-2 min-h-[72px]`}
            value={state.pickupPolicyNotes}
            onChange={(e) => setState((s) => ({ ...s, pickupPolicyNotes: e.target.value }))}
          />
        </div>
      </div>
      <div>
        <label className={labelClass}>{t.bio}</label>
        <textarea
          className={`${inputClass} mt-2 min-h-[80px]`}
          value={state.sellerBio}
          onChange={(e) => setState((s) => ({ ...s, sellerBio: e.target.value }))}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>{t.exp}</label>
          <input
            className={`${inputClass} mt-2`}
            value={state.storeExperience}
            onChange={(e) => setState((s) => ({ ...s, storeExperience: e.target.value }))}
          />
        </div>
        <div>
          <label className={labelClass}>{t.lang}</label>
          <input
            className={`${inputClass} mt-2`}
            value={state.languages}
            onChange={(e) => setState((s) => ({ ...s, languages: e.target.value }))}
          />
        </div>
      </div>
      <div>
        <label className={labelClass}>{t.hours}</label>
        <input
          className={`${inputClass} mt-2`}
          value={state.businessHours}
          onChange={(e) => setState((s) => ({ ...s, businessHours: e.target.value }))}
        />
      </div>
      <div>
        <label className={labelClass}>{t.pol}</label>
        <textarea
          className={`${inputClass} mt-2 min-h-[88px]`}
          value={state.storePolicyNotes}
          onChange={(e) => setState((s) => ({ ...s, storePolicyNotes: e.target.value }))}
        />
      </div>
    </SectionShell>
  );
}
