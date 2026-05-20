"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  buildCallIntent,
  buildDirectionsIntent,
  buildSendEmailIntent,
  buildSmsMessageIntent,
  buildSocialLinkIntent,
  buildWebsiteIntent,
  buildWhatsAppMessageIntent,
  CtaActionSheet,
  type CtaSheetIntent,
} from "@/app/components/cta";
import type { CtaLang } from "@/app/components/cta/types";

export type BrContactHrefBundle = {
  solicitarInfoHref?: string | null;
  llamarHref?: string | null;
  whatsappHref?: string | null;
  smsHref?: string | null;
  programarVisitaHref?: string | null;
  websiteHref?: string | null;
  mapsUrl?: string | null;
};

function phoneFromTelHref(href: string | null | undefined): string {
  const h = String(href ?? "").trim();
  if (!h) return "";
  return h.replace(/^tel:/i, "").trim();
}

function waDigitsFromHref(href: string | null | undefined): string {
  const h = String(href ?? "").trim();
  const m = h.match(/wa\.me\/+(\d+)/i);
  if (m?.[1]) return m[1];
  return phoneFromTelHref(h).replace(/\D/g, "");
}

function phoneFromSmsHref(href: string | null | undefined): string {
  const h = String(href ?? "").trim();
  if (!h.toLowerCase().startsWith("sms:")) return "";
  return h.replace(/^sms:/i, "").split("?")[0]?.trim() ?? "";
}

function parseMailtoHref(href: string | null | undefined): { email: string; subject: string; body: string } {
  const raw = String(href ?? "").trim();
  if (!raw.toLowerCase().startsWith("mailto:")) return { email: "", subject: "", body: "" };
  const rest = raw.slice(7);
  const [addrPart, queryPart] = rest.split("?", 2);
  let email = "";
  try {
    email = decodeURIComponent(addrPart.split(",")[0]?.trim() ?? "");
  } catch {
    email = addrPart.split(",")[0]?.trim() ?? "";
  }
  const params = new URLSearchParams(queryPart ?? "");
  const subject = params.get("subject") ?? "";
  const body = params.get("body") ?? "";
  return { email, subject, body };
}

function smsBodyFromHref(href: string | null | undefined): string {
  const h = String(href ?? "").trim();
  if (!h.toLowerCase().startsWith("sms:")) return "";
  const q = h.indexOf("?");
  if (q < 0) return "";
  const params = new URLSearchParams(h.slice(q + 1));
  return params.get("body") ?? "";
}

export function useBrContactCtaSheet(opts: {
  lang: CtaLang;
  hrefs: BrContactHrefBundle;
  publicUrl?: string;
  defaultMessage?: string;
}) {
  const [ctaIntent, setCtaIntent] = useState<CtaSheetIntent | null>(null);
  const lang = opts.lang;

  const mailtoInfo = useMemo(() => parseMailtoHref(opts.hrefs.solicitarInfoHref), [opts.hrefs.solicitarInfoHref]);
  const mailtoVisit = useMemo(() => parseMailtoHref(opts.hrefs.programarVisitaHref), [opts.hrefs.programarVisitaHref]);

  const contactShareExtras = useMemo(
    () => ({
      publicUrl: opts.publicUrl?.trim() || undefined,
      email: mailtoInfo.email || undefined,
    }),
    [opts.publicUrl, mailtoInfo.email],
  );

  const defaultMsg =
    opts.defaultMessage?.trim() ||
    (lang === "es" ? "Hola, me interesa esta propiedad." : "Hi, I'm interested in this property.");

  const phone =
    phoneFromTelHref(opts.hrefs.llamarHref) ||
    phoneFromSmsHref(opts.hrefs.smsHref) ||
    phoneFromTelHref(opts.hrefs.whatsappHref);
  const waDigits = waDigitsFromHref(opts.hrefs.whatsappHref) || phone.replace(/\D/g, "");
  const smsBody = smsBodyFromHref(opts.hrefs.smsHref) || defaultMsg;

  const openSheet = useCallback((intent: CtaSheetIntent | null) => {
    if (intent) setCtaIntent(intent);
  }, []);

  const closeSheet = useCallback(() => setCtaIntent(null), []);

  const openCall = useCallback(() => {
    openSheet(buildCallIntent({ phone, contactShareExtras }));
  }, [openSheet, phone, contactShareExtras]);

  const openSms = useCallback(() => {
    openSheet(buildSmsMessageIntent({ message: smsBody, phone, contactShareExtras }));
  }, [openSheet, smsBody, phone, contactShareExtras]);

  const openWhatsApp = useCallback(() => {
    openSheet(
      buildWhatsAppMessageIntent({
        message: smsBody || defaultMsg,
        phone,
        whatsappDigits: waDigits,
        contactShareExtras,
      }),
    );
  }, [openSheet, smsBody, defaultMsg, phone, waDigits, contactShareExtras]);

  const openEmail = useCallback(() => {
    const m = mailtoInfo.email ? mailtoInfo : mailtoVisit;
    openSheet(
      buildSendEmailIntent({
        email: m.email,
        subject: m.subject || (lang === "es" ? "Consulta — Leonix" : "Inquiry — Leonix"),
        body: m.body || defaultMsg,
        contactShareExtras,
      }),
    );
  }, [openSheet, mailtoInfo, mailtoVisit, lang, defaultMsg, contactShareExtras]);

  const openProgramarVisita = useCallback(() => {
    if (mailtoVisit.email || mailtoVisit.subject || mailtoVisit.body) {
      openSheet(
        buildSendEmailIntent({
          email: mailtoVisit.email,
          subject: mailtoVisit.subject || (lang === "es" ? "Programar visita" : "Schedule a tour"),
          body: mailtoVisit.body || defaultMsg,
          contactShareExtras,
        }),
      );
      return;
    }
    const url = String(opts.hrefs.programarVisitaHref ?? "").trim();
    if (/^https?:\/\//i.test(url)) {
      openSheet(
        buildWebsiteIntent({
          url,
          kind: "booking",
          headline: lang === "es" ? "Programar visita" : "Schedule a tour",
        }),
      );
    }
  }, [openSheet, mailtoVisit, lang, defaultMsg, contactShareExtras, opts.hrefs.programarVisitaHref]);

  const openWebsite = useCallback(() => {
    const url = String(opts.hrefs.websiteHref ?? "").trim();
    if (!url) return;
    openSheet(buildWebsiteIntent({ url, kind: "website" }));
  }, [openSheet, opts.hrefs.websiteHref]);

  const openMaps = useCallback(() => {
    const url = String(opts.hrefs.mapsUrl ?? "").trim();
    if (!url) return;
    openSheet(
      buildDirectionsIntent({
        addressOrUrl: url,
        isMapsUrl: /^https?:\/\//i.test(url),
        contactShareExtras,
      }),
    );
  }, [openSheet, opts.hrefs.mapsUrl, contactShareExtras]);

  const openSocial = useCallback(
    (url: string) => {
      const u = url.trim();
      if (!u) return;
      openSheet(buildSocialLinkIntent({ url: u }));
    },
    [openSheet],
  );

  const sheet: ReactNode = (
    <CtaActionSheet open={ctaIntent != null} onClose={closeSheet} intent={ctaIntent} lang={lang} />
  );

  return {
    sheet,
    openCall,
    openSms,
    openWhatsApp,
    openEmail,
    openProgramarVisita,
    openWebsite,
    openMaps,
    openSocial,
    hasPhone: phone.replace(/\D/g, "").length >= 8,
    hasWa: waDigits.length >= 8,
    hasEmail: Boolean(mailtoInfo.email || mailtoVisit.email),
  };
}
