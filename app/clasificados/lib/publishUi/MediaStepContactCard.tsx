"use client";

import type { Dispatch, SetStateAction } from "react";

export type ContactMethod = "phone" | "email" | "both";

export type MediaStepContactCardProps = {
  lang: "es" | "en";
  cx: (...classes: Array<string | false | null | undefined>) => string;
  copy: {
    contact: string;
    phone: string;
    email: string;
    both: string;
  };
  contactMethod: ContactMethod;
  setContactMethod: (m: ContactMethod) => void;
  contactPhone: string;
  setContactPhone: Dispatch<SetStateAction<string>>;
  contactEmail: string;
  setContactEmail: Dispatch<SetStateAction<string>>;
  formatPhoneDisplay: (raw: string) => string;
  phoneOk: boolean;
  emailOk: boolean;
};

/** Media step: phone/email contact selector (hidden for BR negocio in parent). */
export function MediaStepContactCard({
  lang,
  cx,
  copy,
  contactMethod,
  setContactMethod,
  contactPhone,
  setContactPhone,
  contactEmail,
  setContactEmail,
  formatPhoneDisplay,
  phoneOk,
  emailOk,
}: MediaStepContactCardProps) {
  return (
    <div className="rounded-2xl border border-black/10 bg-[#F5F5F5] p-4">
      <div className="text-sm text-[#111111]">{copy.contact}</div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {(
          [
            ["phone", copy.phone],
            ["email", copy.email],
            ["both", copy.both],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setContactMethod(value)}
            className={cx(
              "rounded-xl border px-3 py-2 text-sm font-semibold",
              contactMethod === value
                ? "border-[#C9B46A]/50 bg-[#F8F6F0] text-[#111111]"
                : "border-black/10 bg-[#F5F5F5] text-[#111111] hover:bg-[#EFEFEF]"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(contactMethod === "phone" || contactMethod === "both") && (
          <div>
            <label className="text-xs text-[#111111]">{copy.phone}</label>
            <input
              value={contactPhone}
              onChange={(e) => setContactPhone(formatPhoneDisplay(e.target.value))}
              placeholder="(408) 555-1234"
              className="mt-2 w-full rounded-xl border border-black/10 bg-white/9 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
            />
            {!phoneOk && (
              <div className="mt-1 text-xs text-red-600">
                {lang === "es" ? "Agrega un teléfono válido (10 dígitos)." : "Add a valid phone (10 digits)."}
              </div>
            )}
          </div>
        )}

        {(contactMethod === "email" || contactMethod === "both") && (
          <div>
            <label className="text-xs text-[#111111]">{copy.email}</label>
            <input
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder={lang === "es" ? "Ej: nombre@email.com" : "Ex: name@email.com"}
              className="mt-2 w-full rounded-xl border border-black/10 bg-white/9 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
            />
            {!emailOk && (
              <div className="mt-1 text-xs text-red-600">
                {lang === "es" ? "Agrega un email válido." : "Add a valid email."}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
