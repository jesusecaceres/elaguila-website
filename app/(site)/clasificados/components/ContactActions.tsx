"use client";

import { useCallback, useState } from "react";

import { CtaActionSheet } from "@/app/components/cta/CtaActionSheet";
import type { CtaActionCallback, CtaSheetIntent } from "@/app/components/cta/types";
import { trackClasificadosEvent } from "@/app/lib/clasificadosAnalytics";

type Lang = "es" | "en";

type Props = {
  lang?: Lang;

  /** Raw phone for tel: */
  phone?: string | null;

  /** Raw phone for sms: (can differ from phone) */
  text?: string | null;

  /** Optional SMS body (UTF-8) */
  smsBody?: string | null;

  /** Digits-only WhatsApp number */
  whatsappPhone?: string | null;

  /** Prefilled WhatsApp message */
  whatsappMessage?: string | null;

  /** Email address for mailto: */
  email?: string | null;

  /** Optional mailto subject / body */
  mailtoSubject?: string | null;
  mailtoBody?: string | null;

  /** Absolute http(s) website URL */
  website?: string | null;

  /** Absolute http(s) maps/directions URL */
  mapsUrl?: string | null;

  /**
   * Deprecated: we no longer render disabled CTAs. Buttons only appear when actionable.
   * Kept for backward-compat with older call sites.
   */
  showDisabled?: boolean;

  /** Called when user initiates contact (call, text, email, etc.) for analytics */
  onContact?: () => void;

  /** When set with `email`, opens the email options sheet instead of only mailto: */
  listingId?: string | null;
  listingCategory?: string | null;
  ownerUserId?: string | null;

  className?: string;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function normalizePhoneForTel(raw: string) {
  return String(raw || "").replace(/[^0-9+]/g, "");
}

function digitsOnlyUs(raw: string): string {
  return String(raw || "").replace(/\D/g, "").slice(0, 15);
}

function safeHttpUrl(raw: string) {
  const u = String(raw || "").trim();
  if (!u) return "";
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  return "";
}

function isProbablySafeEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function gmailComposeUrl(to: string, subject: string): string {
  const q = new URLSearchParams();
  q.set("view", "cm");
  q.set("fs", "1");
  q.set("to", to.trim());
  if (subject.trim()) q.set("su", subject.trim());
  return `https://mail.google.com/mail/?${q.toString()}`;
}

export default function ContactActions(props: Props) {
  const lang: Lang = props.lang === "en" ? "en" : "es";
  const onContact = props.onContact;
  const [ctaOpen, setCtaOpen] = useState(false);
  const [ctaIntent, setCtaIntent] = useState<CtaSheetIntent | null>(null);

  const phoneTel = props.phone ? normalizePhoneForTel(props.phone) : "";
  const textTel = props.text ? normalizePhoneForTel(props.text) : "";
  const email = String(props.email || "").trim();
  const website = safeHttpUrl(props.website || "");
  const mapsUrl = safeHttpUrl(props.mapsUrl || "");

  const smsBody = String(props.smsBody ?? "").trim();
  const smsHrefBase = textTel || phoneTel;
  const smsHref =
    smsHrefBase && smsBody
      ? `sms:${smsHrefBase}?&body=${encodeURIComponent(smsBody)}`
      : smsHrefBase
        ? `sms:${smsHrefBase}`
        : "";

  const waDigits = props.whatsappPhone ? digitsOnlyUs(props.whatsappPhone) : "";
  const waMsg = String(props.whatsappMessage ?? "").trim();
  const whatsappHref =
    waDigits.length >= 10
      ? waMsg
        ? `https://wa.me/${waDigits}?text=${encodeURIComponent(waMsg)}`
        : `https://wa.me/${waDigits}`
      : "";

  const mailSub = String(props.mailtoSubject ?? "").trim();
  const mailBody = String(props.mailtoBody ?? "").trim();
  let mailtoHref = "";
  if (email) {
    if (mailSub && mailBody) {
      mailtoHref = `mailto:${email}?subject=${encodeURIComponent(mailSub)}&body=${encodeURIComponent(mailBody)}`;
    } else if (mailSub) {
      mailtoHref = `mailto:${email}?subject=${encodeURIComponent(mailSub)}`;
    } else if (mailBody) {
      mailtoHref = `mailto:${email}?body=${encodeURIComponent(mailBody)}`;
    } else {
      mailtoHref = `mailto:${email}`;
    }
  }

  const extras = {
    email: email || undefined,
    websiteUrl: website || undefined,
  };

  const openSheet = (intent: CtaSheetIntent) => {
    onContact?.();
    setCtaIntent(intent);
    setCtaOpen(true);
  };

  const handleCtaSheetAction = useCallback<CtaActionCallback>(
    (info) => {
      const id = (props.listingId ?? "").trim();
      if (!id || info.kind !== "send_email") return;
      const map: Record<string, "email_open_app" | "email_copy" | "email_gmail_open"> = {
        open_email: "email_open_app",
        copy_email: "email_copy",
        gmail_open: "email_gmail_open",
      };
      const action = map[info.actionId];
      if (!action) return;
      void trackClasificadosEvent({
        listing_id: id,
        category: props.listingCategory ?? undefined,
        event_type: "cta_click",
        event_source: "detail",
        owner_user_id: props.ownerUserId ?? null,
        metadata: { action },
      });
    },
    [props.listingCategory, props.listingId, props.ownerUserId],
  );

  const labels =
    lang === "es"
      ? {
          call: "Llamar",
          text: "Enviar texto",
          whatsapp: "WhatsApp",
          email: "Escribir correo",
          directions: "Ver mapa",
          website: "Sitio web",
        }
      : {
          call: "Call",
          text: "Send text",
          whatsapp: "WhatsApp",
          email: "Email",
          directions: "View map",
          website: "Website",
        };

  const BtnBase = "px-4 py-2 rounded-xl font-semibold transition";
  const secondary = "bg-white/5 border border-white/10 hover:bg-white/10 text-white";
  const primary = "bg-yellow-500 text-black hover:bg-yellow-400";

  const hasAny = Boolean(phoneTel || smsHref || whatsappHref || mailtoHref || mapsUrl || website);

  if (!hasAny) return null;

  const phoneForCall = (props.phone ?? phoneTel).trim() || phoneTel;
  const gmailHref = email && isProbablySafeEmail(email) ? gmailComposeUrl(email, mailSub) : null;

  return (
    <div className={cx("flex flex-wrap gap-2", props.className)}>
      {phoneTel ? (
        <button
          type="button"
          className={cx(BtnBase, primary)}
          onClick={() =>
            openSheet({
              kind: "call",
              phone: phoneForCall,
              contactShareExtras: extras,
            })
          }
        >
          {labels.call}
        </button>
      ) : null}

      {smsHref ? (
        <button
          type="button"
          className={cx(BtnBase, secondary)}
          onClick={() =>
            openSheet({
              kind: "send_message",
              message: smsBody,
              phone: smsHrefBase,
              whatsappDigits: undefined,
              contactShareExtras: extras,
            })
          }
        >
          {labels.text}
        </button>
      ) : null}

      {whatsappHref ? (
        <button
          type="button"
          className={cx(BtnBase, secondary)}
          onClick={() =>
            openSheet({
              kind: "send_message",
              message: waMsg,
              phone: waDigits,
              whatsappDigits: waDigits,
              contactShareExtras: extras,
            })
          }
        >
          {labels.whatsapp}
        </button>
      ) : null}

      {mailtoHref ? (
        <button
          type="button"
          className={cx(BtnBase, secondary)}
          onClick={() =>
            openSheet({
              kind: "send_email",
              email,
              subject: mailSub,
              body: mailBody,
              contactShareExtras: extras,
              gmailComposeHref: gmailHref,
            })
          }
        >
          {labels.email}
        </button>
      ) : null}

      {mapsUrl ? (
        <button
          type="button"
          className={cx(BtnBase, secondary)}
          onClick={() =>
            openSheet({
              kind: "directions",
              addressOrUrl: mapsUrl,
              isMapsUrl: true,
              contactShareExtras: extras,
            })
          }
        >
          {labels.directions}
        </button>
      ) : null}

      {website ? (
        <button
          type="button"
          className={cx(BtnBase, secondary)}
          onClick={() =>
            openSheet({
              kind: "website",
              url: website,
            })
          }
        >
          {labels.website}
        </button>
      ) : null}

      <CtaActionSheet
        open={ctaOpen}
        onClose={() => {
          setCtaOpen(false);
          setCtaIntent(null);
        }}
        intent={ctaIntent}
        lang={lang}
        onAction={handleCtaSheetAction}
      />
    </div>
  );
}
