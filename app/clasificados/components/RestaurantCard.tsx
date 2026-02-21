"use client";

import Link from "next/link";
import type { Restaurant } from "../../data/restaurants";
import { ReviewButton, ReviewSummary } from "../restaurantes/components/R3Widgets";

type Lang = "es" | "en";

function label(lang: Lang, es: string, en: string) {
  return lang === "es" ? es : en;
}

export default function RestaurantCard({ r, lang }: { r: Restaurant; lang: Lang }) {
  const has = {
    phone: Boolean(r.phone),
    text: Boolean(r.text),
    email: Boolean(r.email),
    directions: Boolean(r.googleMapsUrl || r.address),
    website: Boolean(r.website),
    social: Boolean(r.instagram || r.facebook),
    coupons: Boolean(r.couponsUrl),
  };

  const mapsHref =
    r.googleMapsUrl ||
    (r.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.address)}` : "");

  return (
    <div className="rounded-2xl border border-yellow-400/25 bg-black/40 p-6 text-left shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-white truncate">{r.name}</h3>
            {r.verified && (
              <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-200">
                {label(lang, "Verificado", "Verified")}
              </span>
            )}
            {r.supporter && (
              <span className="inline-flex items-center rounded-full border border-yellow-400/30 bg-yellow-500/10 px-2.5 py-0.5 text-xs font-semibold text-yellow-200">
                {r.supporter}
              </span>
            )}
          </div>

          <div className="mt-1 text-sm text-gray-300">
            {[r.cuisine, r.city].filter(Boolean).join(" • ")}
          </div>

          {r.address && <div className="mt-2 text-sm text-gray-400">{r.address}</div>}
        </div>
      </div>

      
      <div className="mt-4 flex items-center justify-between gap-3">
        <ReviewSummary restaurantId={r.id} lang={lang} />
        <ReviewButton restaurantId={r.id} lang={lang} />
      </div>

<div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
        <ActionButton
          enabled={has.phone}
          href={r.phone ? `tel:${r.phone}` : "#"}
          text={label(lang, "Llamar", "Call")}
        />
        <ActionButton
          enabled={has.text}
          href={r.text ? `sms:${r.text}` : "#"}
          text={label(lang, "Texto", "Text")}
        />
        <ActionButton
          enabled={has.email}
          href={r.email ? `mailto:${r.email}` : "#"}
          text={label(lang, "Email", "Email")}
        />
        <ActionButton
          enabled={has.directions}
          href={mapsHref || "#"}
          text={label(lang, "Cómo llegar", "Directions")}
          external
        />
        <ActionButton
          enabled={has.website}
          href={r.website || "#"}
          text={label(lang, "Sitio web", "Website")}
          external
        />
        <ActionButton
          enabled={has.social}
          href={(r.instagram || r.facebook) || "#"}
          text={label(lang, "Social", "Social")}
          external
        />
      </div>

      <div className="mt-4">
        {has.coupons ? (
          <Link
            href={r.couponsUrl!}
            className="inline-flex items-center justify-center rounded-xl border border-yellow-400/30 bg-yellow-500/10 px-4 py-2 text-sm font-semibold text-yellow-200 hover:bg-yellow-500/15 transition"
          >
            {label(lang, "Ver cupones", "View coupons")}
          </Link>
        ) : (
          <div className="text-xs text-gray-500">
            {label(
              lang,
              "Cupones disponibles solo para anunciantes del magazine.",
              "Coupons are available for magazine advertisers only."
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ActionButton({
  enabled,
  href,
  text,
  external,
}: {
  enabled: boolean;
  href: string;
  text: string;
  external?: boolean;
}) {
  const base =
    "inline-flex items-center justify-center rounded-xl border px-3 py-2 text-sm font-semibold transition";

  if (!enabled) {
    return (
      <div className={`${base} border-white/10 bg-white/5 text-gray-500 cursor-not-allowed`}>
        {text}
      </div>
    );
  }

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className={`${base} border-yellow-400/25 bg-black/30 text-white hover:bg-[#1a1100]`}
    >
      {text}
    </a>
  );
}