"use client";

import { useState } from "react";
import type { ServiciosProfileResolved, ServiciosLang } from "../types/serviciosBusinessProfile";
import { getServiciosProfileLabels } from "../copy/serviciosProfileCopy";
import { resolveServiciosQuoteDestination } from "../lib/serviciosContactActions";
import { resolveServiciosServiceVisual } from "@/app/(site)/clasificados/servicios/lib/serviciosServiceVisualCatalog";
import { SV } from "./serviciosDesignTokens";

// Service type detection (mobile / onsite hint next to catalog emoji)
const getServiceType = (serviceName: string): "mobile" | "onsite" | "both" => {
  const name = serviceName.toLowerCase();
  const mobileKeywords = ["móvil", "mobile", "domicilio", "a domicilio", "delivery", "entrega"];
  const onsiteKeywords = ["taller", "local", "tienda", "oficina", "consultorio"];

  const hasMobile = mobileKeywords.some((keyword) => name.includes(keyword));
  const hasOnsite = onsiteKeywords.some((keyword) => name.includes(keyword));

  if (hasMobile && hasOnsite) return "both";
  if (hasMobile) return "mobile";
  return "onsite";
};

const getServiceTypeIcon = (serviceType: "mobile" | "onsite" | "both") => {
  switch (serviceType) {
    case "mobile":
      return "🚗";
    case "onsite":
      return "🏢";
    case "both":
      return "🚗🏢";
    default:
      return "📍";
  }
};

export function ServiciosServicesGrid({ profile, lang }: { profile: ServiciosProfileResolved; lang: ServiciosLang }) {
  const L = getServiciosProfileLabels(lang);
  const items = profile.services;
  const [expanded, setExpanded] = useState(false);
  if (!items.length) return null;

  const quoteDestination = resolveServiciosQuoteDestination(profile, lang);

  const handleServiceQuoteClick = (serviceName: string) => {
    if (!quoteDestination) return;

    let message =
      lang === "en"
        ? "Hi, I saw your profile on Leonix and would like to request a quote."
        : "Hola, vi tu perfil en Leonix y quiero pedir una cotización.";

    message += lang === "en" ? ` for ${serviceName}` : ` para ${serviceName}`;

    if (quoteDestination.kind === "whatsapp") {
      const encodedMessage = encodeURIComponent(message);
      window.open(`${quoteDestination.href}?text=${encodedMessage}`, "_blank", "noopener noreferrer");
    } else {
      window.open(quoteDestination.href, "_blank", "noopener noreferrer");
    }
  };

  const featured = items.slice(0, 8);
  const rest = items.slice(8);
  const showMore = rest.length > 0 && !expanded;
  const visibleExtra = expanded ? rest : [];

  return (
    <section
      className="rounded-2xl border p-4 shadow-sm sm:p-6 md:p-8"
      style={{ backgroundColor: SV.card, borderColor: SV.border, boxShadow: SV.shadowSm }}
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-lg font-bold tracking-tight text-[color:var(--lx-text)] md:text-xl">{L.services}</h2>
        {rest.length > 0 ? (
          <p className="text-xs font-medium text-[color:var(--lx-muted)]">
            {lang === "en" ? `${items.length} services` : `${items.length} servicios`}
          </p>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {featured.map((s) => {
          const serviceType = getServiceType(s.title);
          const { emoji } = resolveServiciosServiceVisual({ id: s.id, label: s.title });
          return (
            <button
              key={s.id}
              onClick={() => quoteDestination && handleServiceQuoteClick(s.title)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium shadow-sm transition hover:shadow-md ${quoteDestination ? "cursor-pointer" : "cursor-default"}`}
              style={{
                borderColor: SV.warmBorder,
                backgroundColor: SV.beige,
                color: SV.text,
              }}
              onMouseEnter={(e) => {
                if (quoteDestination) {
                  e.currentTarget.style.borderColor = SV.goldBorder;
                  e.currentTarget.style.backgroundColor = SV.goldSoft;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = SV.warmBorder;
                e.currentTarget.style.backgroundColor = SV.beige;
              }}
            >
              <span className="mr-1 shrink-0 text-[10px] leading-none text-[#3B66AD]/60">{getServiceTypeIcon(serviceType)}</span>
              <span className="shrink-0 text-[0.95rem] leading-none" aria-hidden>
                {emoji}
              </span>
              <span className="min-w-0">{s.title}</span>
            </button>
          );
        })}
      </div>

      {showMore ? (
        <button
          type="button"
          className="mt-6 w-full rounded-xl border border-black/[0.1] bg-white py-3 text-sm font-semibold text-[color:var(--lx-text)] shadow-sm transition hover:border-[#3B66AD]/35"
          onClick={() => setExpanded(true)}
        >
          {L.showMoreServices}
        </button>
      ) : null}

      {visibleExtra.length > 0 ? (
        <div className="mt-6 border-t pt-6" style={{ borderColor: SV.warmBorder }}>
          <div className="flex flex-wrap gap-2">
            {visibleExtra.map((s) => {
              const serviceType = getServiceType(s.title);
              const { emoji } = resolveServiciosServiceVisual({ id: s.id, label: s.title });
              return (
                <button
                  key={s.id}
                  onClick={() => quoteDestination && handleServiceQuoteClick(s.title)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium shadow-sm transition hover:shadow-md ${quoteDestination ? "cursor-pointer" : "cursor-default"}`}
                  style={{
                    borderColor: SV.warmBorder,
                    backgroundColor: SV.beige,
                    color: SV.text,
                  }}
                  onMouseEnter={(e) => {
                    if (quoteDestination) {
                      e.currentTarget.style.borderColor = SV.goldBorder;
                      e.currentTarget.style.backgroundColor = SV.goldSoft;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = SV.warmBorder;
                    e.currentTarget.style.backgroundColor = SV.beige;
                  }}
                >
                  <span className="mr-1 shrink-0 text-[10px] leading-none text-[#3B66AD]/60">{getServiceTypeIcon(serviceType)}</span>
                  <span className="shrink-0 text-[0.95rem] leading-none" aria-hidden>
                    {emoji}
                  </span>
                  <span className="min-w-0">{s.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
