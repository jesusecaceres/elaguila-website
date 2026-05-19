"use client";

import { useState } from "react";
import {
  buildCallIntent,
  buildSendEmailIntent,
  buildWebsiteIntent,
  buildWhatsAppMessageIntent,
  CtaActionSheet,
  type CtaSheetIntent,
} from "@/app/components/cta";

const ACCENT = "#D97706";

type Props = {
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  websiteLabel: string;
  lang?: "es" | "en";
};

function digits(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function ViajesNegocioContactBlock({ phone, whatsapp, email, website, websiteLabel, lang = "es" }: Props) {
  const [ctaIntent, setCtaIntent] = useState<CtaSheetIntent | null>(null);
  const contactShareExtras = { email: email ?? undefined, websiteUrl: website ?? undefined };

  const openSheet = (intent: CtaSheetIntent | null) => {
    if (intent) setCtaIntent(intent);
  };

  return (
    <>
      <div className="mt-4 flex flex-col gap-2 text-sm">
        {phone ? (
          <button
            type="button"
            onClick={() => openSheet(buildCallIntent({ phone: digits(phone), contactShareExtras }))}
            className="text-left hover:underline"
          >
            📞 {phone}
          </button>
        ) : null}
        {whatsapp ? (
          <button
            type="button"
            onClick={() => openSheet(buildWhatsAppMessageIntent({ whatsappDigits: digits(whatsapp), message: "", contactShareExtras }))}
            className="text-left font-semibold underline-offset-2 hover:underline"
            style={{ color: ACCENT }}
          >
            WhatsApp {whatsapp}
          </button>
        ) : null}
        {email ? (
          <button
            type="button"
            onClick={() =>
              openSheet(
                buildSendEmailIntent({
                  email,
                  subject: "Consulta sobre viajes — Leonix",
                  body: "",
                  contactShareExtras,
                }),
              )
            }
            className="text-left hover:underline"
          >
            ✉️ {email}
          </button>
        ) : null}
        {website ? (
          <button
            type="button"
            onClick={() => openSheet(buildWebsiteIntent({ url: website, headline: websiteLabel, kind: "website" }))}
            className="text-left hover:underline"
          >
            🌐 {websiteLabel}
          </button>
        ) : null}
      </div>
      <CtaActionSheet open={ctaIntent != null} onClose={() => setCtaIntent(null)} intent={ctaIntent} lang={lang} />
    </>
  );
}
