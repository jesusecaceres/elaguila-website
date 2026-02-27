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
   * When true, renders the core buttons even if values are missing (disabled),
   * so every category/detail page can show the same conversion cluster without fake data.
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

  const showDisabled = Boolean(props.showDisabled);

  const labels =
    lang === "es"
      ? { call: "Llamar", text: "Texto", email: "Email", directions: "Direcciones", website: "Sitio web" }
      : { call: "Call", text: "Text", email: "Email", directions: "Directions", website: "Website" };

  const BtnBase =
    "px-4 py-2 rounded-xl font-semibold transition";

  const secondary =
    "bg-white/5 border border-white/10 hover:bg-white/10 text-white";

  const disabled =
    "bg-white/5 border border-white/10 text-white/60 cursor-not-allowed";

  const primary =
    "bg-yellow-500 text-black hover:bg-yellow-400";

  return (
    <div className={cx("flex flex-wrap gap-2", props.className)}>
      {phoneTel || showDisabled ? (
        <a
          href={phoneTel ? `tel:${phoneTel}` : undefined}
          aria-disabled={!phoneTel}
          onClick={(e) => {
            if (!phoneTel) e.preventDefault();
          }}
          className={cx(BtnBase, phoneTel ? primary : disabled)}
        >
          {labels.call}
        </a>
      ) : null}

      {textTel || showDisabled ? (
        <a
          href={textTel ? `sms:${textTel}` : undefined}
          aria-disabled={!textTel}
          onClick={(e) => {
            if (!textTel) e.preventDefault();
          }}
          className={cx(BtnBase, textTel ? secondary : disabled)}
        >
          {labels.text}
        </a>
      ) : null}

      {email || showDisabled ? (
        <a
          href={email ? `mailto:${email}` : undefined}
          aria-disabled={!email}
          onClick={(e) => {
            if (!email) e.preventDefault();
          }}
          className={cx(BtnBase, email ? secondary : disabled)}
        >
          {labels.email}
        </a>
      ) : null}

      {mapsUrl || showDisabled ? (
        <a
          href={mapsUrl || undefined}
          target={mapsUrl ? "_blank" : undefined}
          rel={mapsUrl ? "noreferrer" : undefined}
          aria-disabled={!mapsUrl}
          onClick={(e) => {
            if (!mapsUrl) e.preventDefault();
          }}
          className={cx(BtnBase, mapsUrl ? secondary : disabled)}
        >
          {labels.directions}
        </a>
      ) : null}

      {website ? (
        <a
          href={website}
          target="_blank"
          rel="noreferrer"
          className={cx(BtnBase, secondary)}
        >
          {labels.website}
        </a>
      ) : null}
    </div>
  );
}
