"use client";

import React from "react";

type Lang = "es" | "en";

type Props = {
  lang?: Lang;

  /** Raw phone for tel: */
  phone?: string | null;

  /** Raw phone for sms: (can differ from phone) */
  text?: string | null;

  /** Email address for mailto: */
  email?: string | null;

  /** Absolute http(s) website URL */
  website?: string | null;

  /** Absolute http(s) maps/directions URL */
  mapsUrl?: string | null;

  /**
   * Deprecated: we no longer render disabled CTAs. Buttons only appear when actionable.
   * Kept for backward-compat with older call sites.
   */
  showDisabled?: boolean;

  className?: string;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function normalizePhoneForTel(raw: string) {
  return String(raw || "").replace(/[^0-9+]/g, "");
}

function safeHttpUrl(raw: string) {
  const u = String(raw || "").trim();
  if (!u) return "";
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  return "";
}

export default function ContactActions(props: Props) {
  const lang: Lang = props.lang === "en" ? "en" : "es";

  const phoneTel = props.phone ? normalizePhoneForTel(props.phone) : "";
  const textTel = props.text ? normalizePhoneForTel(props.text) : "";
  const email = String(props.email || "").trim();
  const website = safeHttpUrl(props.website || "");
  const mapsUrl = safeHttpUrl(props.mapsUrl || "");

  const labels =
    lang === "es"
      ? { call: "Llamar", text: "Texto", email: "Email", directions: "Direcciones", website: "Sitio web" }
      : { call: "Call", text: "Text", email: "Email", directions: "Directions", website: "Website" };

  const BtnBase = "px-4 py-2 rounded-xl font-semibold transition";
  const secondary = "bg-white/5 border border-white/10 hover:bg-white/10 text-white";
  const primary = "bg-yellow-500 text-black hover:bg-yellow-400";

  const hasAny = Boolean(phoneTel || textTel || email || mapsUrl || website);

  if (!hasAny) return null;

  return (
    <div className={cx("flex flex-wrap gap-2", props.className)}>
      {phoneTel ? (
        <a href={`tel:${phoneTel}`} className={cx(BtnBase, primary)}>
          {labels.call}
        </a>
      ) : null}

      {textTel ? (
        <a href={`sms:${textTel}`} className={cx(BtnBase, secondary)}>
          {labels.text}
        </a>
      ) : null}

      {email ? (
        <a href={`mailto:${email}`} className={cx(BtnBase, secondary)}>
          {labels.email}
        </a>
      ) : null}

      {mapsUrl ? (
        <a href={mapsUrl} target="_blank" rel="noreferrer" className={cx(BtnBase, secondary)}>
          {labels.directions}
        </a>
      ) : null}

      {website ? (
        <a href={website} target="_blank" rel="noreferrer" className={cx(BtnBase, secondary)}>
          {labels.website}
        </a>
      ) : null}
    </div>
  );
}
