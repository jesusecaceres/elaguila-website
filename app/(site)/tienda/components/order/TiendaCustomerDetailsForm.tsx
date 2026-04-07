"use client";

import type { Lang } from "../../types/tienda";
import type { TiendaCustomerDetails } from "../../types/orderHandoff";
import { ohPick, orderHandoffCopy } from "../../data/orderHandoffCopy";

export function TiendaCustomerDetailsForm(props: {
  lang: Lang;
  value: TiendaCustomerDetails;
  onChange: (next: TiendaCustomerDetails) => void;
}) {
  const { lang, value, onChange } = props;
  const patch = (key: keyof TiendaCustomerDetails, v: string) => onChange({ ...value, [key]: v });

  return (
    <section className="rounded-2xl border border-[rgba(255,255,255,0.10)] bg-[rgba(255,247,226,0.05)] p-5 sm:p-6 space-y-4">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[rgba(201,168,74,0.95)]">
          {ohPick(orderHandoffCopy.formTitle, lang)}
        </h2>
        <p className="mt-2 text-sm text-[rgba(255,255,255,0.65)]">{ohPick(orderHandoffCopy.formIntro, lang)}</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block text-sm">
          <span className="text-[rgba(255,247,226,0.75)]">{ohPick(orderHandoffCopy.fieldFullName, lang)} *</span>
          <input
            required
            name="tiendaOrderFullName"
            autoComplete="name"
            value={value.fullName}
            onChange={(e) => patch("fullName", e.target.value)}
            className="mt-1 w-full rounded-lg border border-[rgba(255,255,255,0.14)] bg-[rgba(0,0,0,0.35)] px-3 py-2 text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-[rgba(201,168,74,0.45)]"
          />
        </label>
        <label className="block text-sm">
          <span className="text-[rgba(255,247,226,0.75)]">{ohPick(orderHandoffCopy.fieldBusinessName, lang)}</span>
          <input
            name="tiendaOrderBusinessName"
            autoComplete="organization"
            value={value.businessName}
            onChange={(e) => patch("businessName", e.target.value)}
            className="mt-1 w-full rounded-lg border border-[rgba(255,255,255,0.14)] bg-[rgba(0,0,0,0.35)] px-3 py-2 text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-[rgba(201,168,74,0.45)]"
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="text-[rgba(255,247,226,0.75)]">{ohPick(orderHandoffCopy.fieldEmail, lang)} *</span>
          <input
            required
            type="email"
            name="tiendaOrderEmail"
            autoComplete="email"
            value={value.email}
            onChange={(e) => patch("email", e.target.value)}
            className="mt-1 w-full rounded-lg border border-[rgba(255,255,255,0.14)] bg-[rgba(0,0,0,0.35)] px-3 py-2 text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-[rgba(201,168,74,0.45)]"
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="text-[rgba(255,247,226,0.75)]">{ohPick(orderHandoffCopy.fieldPhone, lang)} *</span>
          <input
            required
            type="tel"
            name="tiendaOrderPhone"
            autoComplete="tel"
            value={value.phone}
            onChange={(e) => patch("phone", e.target.value)}
            className="mt-1 w-full rounded-lg border border-[rgba(255,255,255,0.14)] bg-[rgba(0,0,0,0.35)] px-3 py-2 text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-[rgba(201,168,74,0.45)]"
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="text-[rgba(255,247,226,0.75)]">{ohPick(orderHandoffCopy.fieldNotes, lang)}</span>
          <textarea
            name="tiendaOrderNotes"
            rows={3}
            value={value.notes}
            onChange={(e) => patch("notes", e.target.value)}
            className="mt-1 w-full rounded-lg border border-[rgba(255,255,255,0.14)] bg-[rgba(0,0,0,0.35)] px-3 py-2 text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-[rgba(201,168,74,0.45)] resize-y min-h-[88px]"
          />
        </label>
      </div>
    </section>
  );
}
