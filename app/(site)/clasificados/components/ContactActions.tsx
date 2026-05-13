"use client";

import React, { useState } from "react";

import { EmailContactOptionsSheet } from "@/app/components/clasificados/EmailContactOptionsSheet";

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

export default function ContactActions(props: Props) {
  const lang: Lang = props.lang === "en" ? "en" : "es";
  const onContact = props.onContact;
  const [emailSheetOpen, setEmailSheetOpen] = useState(false);

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

  const handleContact = () => {
    onContact?.();
  };

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

  const emailSheet =
    email && mailtoHref ? (
      <EmailContactOptionsSheet
        open={emailSheetOpen}
        onClose={() => setEmailSheetOpen(false)}
        email={email}
        lang={lang}
        mailtoHref={mailtoHref}
        mailtoSubject={mailSub}
        listingId={props.listingId}
        listingCategory={props.listingCategory}
        ownerUserId={props.ownerUserId}
      />
    ) : null;

  return (
    <div className={cx("flex flex-wrap gap-2", props.className)}>
      {phoneTel ? (
        <a href={`tel:${phoneTel}`} className={cx(BtnBase, primary)} onClick={handleContact}>
          {labels.call}
        </a>
      ) : null}

      {smsHref ? (
        <a href={smsHref} className={cx(BtnBase, secondary)} onClick={handleContact}>
          {labels.text}
        </a>
      ) : null}

      {whatsappHref ? (
        <a href={whatsappHref} target="_blank" rel="noreferrer" className={cx(BtnBase, secondary)} onClick={handleContact}>
          {labels.whatsapp}
        </a>
      ) : null}

      {mailtoHref ? (
        <button type="button" className={cx(BtnBase, secondary)} onClick={() => setEmailSheetOpen(true)}>
          {labels.email}
        </button>
      ) : null}

      {mapsUrl ? (
        <a href={mapsUrl} target="_blank" rel="noreferrer" className={cx(BtnBase, secondary)} onClick={handleContact}>
          {labels.directions}
        </a>
      ) : null}

      {website ? (
        <a href={website} target="_blank" rel="noreferrer" className={cx(BtnBase, secondary)} onClick={handleContact}>
          {labels.website}
        </a>
      ) : null}
      {emailSheet}
    </div>
  );
}
