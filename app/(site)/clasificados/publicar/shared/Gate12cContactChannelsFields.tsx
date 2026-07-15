"use client";

import type { LeonixContactChannelsFormSlice } from "@/app/clasificados/lib/leonixContactChannelsV1";
import { getLaunchUiMessages } from "@/app/lib/i18n/launchUiDictionaries";
import type { OfficialLocale } from "@/app/lib/language";

type Props = {
  lang: OfficialLocale;
  value: LeonixContactChannelsFormSlice;
  onChange: (next: LeonixContactChannelsFormSlice) => void;
  fieldClass: string;
  titleClass: string;
};

export function Gate12cContactChannelsFields({ lang, value, onChange, fieldClass, titleClass }: Props) {
  const ch = getLaunchUiMessages(lang).rentas.channels;

  const set = (patch: Partial<LeonixContactChannelsFormSlice>) => onChange({ ...value, ...patch });

  const siNoVal = (v: "" | "si" | "no") => (v === "no" ? "no" : "si");

  return (
    <section className="min-w-0">
      <h2 className={titleClass}>{ch.section}</h2>
      <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2 sm:gap-5">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-[#111111]/85">{ch.websiteMoreInfo}</label>
          <input
            className={fieldClass}
            type="url"
            placeholder="https://"
            value={value.masInformacionUrl}
            onChange={(e) => set({ masInformacionUrl: e.target.value })}
            autoComplete="url"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[#111111]/85">{ch.ig}</label>
          <p className="mb-1 text-xs text-[#111111]/55">{ch.igHint}</p>
          <input className={fieldClass} value={value.instagram} onChange={(e) => set({ instagram: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[#111111]/85">{ch.fb}</label>
          <p className="mb-1 text-xs text-[#111111]/55">{ch.fbHint}</p>
          <input className={fieldClass} value={value.facebook} onChange={(e) => set({ facebook: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[#111111]/85">{ch.yt}</label>
          <p className="mb-1 text-xs text-[#111111]/55">{ch.ytHint}</p>
          <input className={fieldClass} value={value.youtube} onChange={(e) => set({ youtube: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[#111111]/85">{ch.tt}</label>
          <p className="mb-1 text-xs text-[#111111]/55">{ch.ttHint}</p>
          <input className={fieldClass} value={value.tiktok} onChange={(e) => set({ tiktok: e.target.value })} />
        </div>
        <div className="sm:col-span-2 flex flex-wrap gap-4">
          <label className="inline-flex items-center gap-2 text-sm text-[#111111]/90">
            <input
              type="checkbox"
              checked={siNoVal(value.permitirLlamadas) === "si"}
              onChange={(e) => set({ permitirLlamadas: e.target.checked ? "si" : "no" })}
            />
            {ch.allowCalls}
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-[#111111]/90">
            <input
              type="checkbox"
              checked={siNoVal(value.permitirSms) === "si"}
              onChange={(e) => set({ permitirSms: e.target.checked ? "si" : "no" })}
            />
            {ch.allowSms}
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-[#111111]/90">
            <input
              type="checkbox"
              checked={siNoVal(value.whatsappActivo) === "si"}
              onChange={(e) => set({ whatsappActivo: e.target.checked ? "si" : "no" })}
            />
            {ch.showWhatsApp}
          </label>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-[#111111]/85">{ch.preferredMethod}</label>
          <select
            className={fieldClass}
            value={value.contactoPreferido}
            onChange={(e) =>
              set({ contactoPreferido: e.target.value as LeonixContactChannelsFormSlice["contactoPreferido"] })
            }
          >
            <option value="">{ch.prefNone}</option>
            <option value="phone">{ch.prefPhone}</option>
            <option value="email">{ch.prefEmail}</option>
            <option value="whatsapp">{ch.prefWhatsApp}</option>
            <option value="sms">{ch.prefSms}</option>
            <option value="website">{ch.prefWeb}</option>
          </select>
        </div>
      </div>
    </section>
  );
}
