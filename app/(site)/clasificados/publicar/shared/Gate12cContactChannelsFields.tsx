"use client";

import type { LeonixContactChannelsFormSlice } from "@/app/clasificados/lib/leonixContactChannelsV1";

type Lang = "es" | "en";

type Props = {
  lang: Lang;
  value: LeonixContactChannelsFormSlice;
  onChange: (next: LeonixContactChannelsFormSlice) => void;
  fieldClass: string;
  titleClass: string;
};

export function Gate12cContactChannelsFields({ lang, value, onChange, fieldClass, titleClass }: Props) {
  const t =
    lang === "es"
      ? {
          section: "Más formas de contacto",
          masInfo: "Sitio web / Más información",
          ig: "Instagram",
          igHint: "@usuario o https://instagram.com/usuario",
          fb: "Facebook",
          fbHint: "https://facebook.com/tu-pagina",
          yt: "YouTube",
          ytHint: "https://youtube.com/@tu-canal",
          tt: "TikTok",
          ttHint: "@usuario o https://tiktok.com/@usuario",
          call: "Permitir llamadas",
          sms: "Permitir mensajes de texto (SMS)",
          wa: "Mostrar WhatsApp",
          pref: "Método de contacto preferido (opcional)",
          prefPh: "Teléfono",
          prefEm: "Correo",
          prefWa: "WhatsApp",
          prefSm: "SMS",
          prefWeb: "Sitio web",
          prefNone: "Sin preferencia",
        }
      : {
          section: "More contact options",
          masInfo: "Website / more information",
          ig: "Instagram",
          igHint: "@handle or https://instagram.com/handle",
          fb: "Facebook",
          fbHint: "https://facebook.com/your-page",
          yt: "YouTube",
          ytHint: "https://youtube.com/@your-channel",
          tt: "TikTok",
          ttHint: "@handle or https://tiktok.com/@handle",
          call: "Allow calls",
          sms: "Allow SMS / text messages",
          wa: "Show WhatsApp",
          pref: "Preferred contact method (optional)",
          prefPh: "Phone",
          prefEm: "Email",
          prefWa: "WhatsApp",
          prefSm: "SMS",
          prefWeb: "Website",
          prefNone: "No preference",
        };

  const set = (patch: Partial<LeonixContactChannelsFormSlice>) => onChange({ ...value, ...patch });

  const siNoVal = (v: "" | "si" | "no") => (v === "no" ? "no" : "si");

  return (
    <section className="min-w-0">
      <h2 className={titleClass}>{t.section}</h2>
      <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2 sm:gap-5">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-[#111111]/85">{t.masInfo}</label>
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
          <label className="mb-1 block text-sm font-medium text-[#111111]/85">{t.ig}</label>
          <p className="mb-1 text-xs text-[#111111]/55">{t.igHint}</p>
          <input className={fieldClass} value={value.instagram} onChange={(e) => set({ instagram: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[#111111]/85">{t.fb}</label>
          <p className="mb-1 text-xs text-[#111111]/55">{t.fbHint}</p>
          <input className={fieldClass} value={value.facebook} onChange={(e) => set({ facebook: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[#111111]/85">{t.yt}</label>
          <p className="mb-1 text-xs text-[#111111]/55">{t.ytHint}</p>
          <input className={fieldClass} value={value.youtube} onChange={(e) => set({ youtube: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[#111111]/85">{t.tt}</label>
          <p className="mb-1 text-xs text-[#111111]/55">{t.ttHint}</p>
          <input className={fieldClass} value={value.tiktok} onChange={(e) => set({ tiktok: e.target.value })} />
        </div>
        <div className="sm:col-span-2 flex flex-wrap gap-4">
          <label className="inline-flex items-center gap-2 text-sm text-[#111111]/90">
            <input
              type="checkbox"
              checked={siNoVal(value.permitirLlamadas) === "si"}
              onChange={(e) => set({ permitirLlamadas: e.target.checked ? "si" : "no" })}
            />
            {t.call}
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-[#111111]/90">
            <input
              type="checkbox"
              checked={siNoVal(value.permitirSms) === "si"}
              onChange={(e) => set({ permitirSms: e.target.checked ? "si" : "no" })}
            />
            {t.sms}
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-[#111111]/90">
            <input
              type="checkbox"
              checked={siNoVal(value.whatsappActivo) === "si"}
              onChange={(e) => set({ whatsappActivo: e.target.checked ? "si" : "no" })}
            />
            {t.wa}
          </label>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-[#111111]/85">{t.pref}</label>
          <select
            className={fieldClass}
            value={value.contactoPreferido}
            onChange={(e) => set({ contactoPreferido: e.target.value as LeonixContactChannelsFormSlice["contactoPreferido"] })}
          >
            <option value="">{t.prefNone}</option>
            <option value="phone">{t.prefPh}</option>
            <option value="email">{t.prefEm}</option>
            <option value="whatsapp">{t.prefWa}</option>
            <option value="sms">{t.prefSm}</option>
            <option value="website">{t.prefWeb}</option>
          </select>
        </div>
      </div>
    </section>
  );
}
