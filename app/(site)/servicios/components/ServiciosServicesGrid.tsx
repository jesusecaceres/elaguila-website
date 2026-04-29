"use client";

import { useState } from "react";
import Image from "next/image";
import type {
  ServiciosProfileResolved,
  ServiciosLang,
  ServiciosServiceVisualVariant,
} from "../types/serviciosBusinessProfile";
import { getServiciosProfileLabels } from "../copy/serviciosProfileCopy";
import { serviciosImageUnoptimized } from "../lib/serviciosMediaUrl";
import { resolveServiciosQuoteDestination } from "../lib/serviciosContactActions";
import { SV } from "./serviciosDesignTokens";
import { FiBriefcase, FiLayers, FiMessageCircle, FiSettings, FiTool, FiZap } from "react-icons/fi";

function variantSurface(v: ServiciosServiceVisualVariant | undefined): { gradient: string; Icon: typeof FiTool; glyph: string } {
  switch (v ?? "default") {
    case "instalacion":
      return {
        gradient: "linear-gradient(145deg, #1e3a5f 0%, #3B66AD 48%, #5a8fd4 100%)",
        Icon: FiLayers,
        glyph: "◇",
      };
    case "mantenimiento":
      return {
        gradient: "linear-gradient(145deg, #2d4a3e 0%, #3d6b55 50%, #5a9a7a 100%)",
        Icon: FiSettings,
        glyph: "◆",
      };
    case "reparacion":
      return {
        gradient: "linear-gradient(145deg, #4a3020 0%, #8b5a2b 45%, #c9a84a 100%)",
        Icon: FiTool,
        glyph: "▸",
      };
    case "consulta":
      return {
        gradient: "linear-gradient(145deg, #2a2f45 0%, #4a5685 50%, #6b7fb8 100%)",
        Icon: FiMessageCircle,
        glyph: "◎",
      };
    case "emergencia":
      return {
        gradient: "linear-gradient(145deg, #5c1f1f 0%, #a83232 50%, #d94a4a 100%)",
        Icon: FiZap,
        glyph: "!",
      };
    default:
      return {
        gradient: "linear-gradient(145deg, #2d528d 0%, #4a6fa5 50%, #7a9bc9 100%)",
        Icon: FiBriefcase,
        glyph: "◆",
      };
  }
}

function featuredGridClass(count: number): string {
  if (count === 1) return "grid grid-cols-1 gap-4 max-w-xl mx-auto w-full";
  if (count === 2) return "grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-4xl mx-auto w-full";
  return "grid grid-cols-1 gap-4 sm:grid-cols-2 w-full";
}

// Simple emoji mapping for service categories
const getServiceEmoji = (serviceName: string): string => {
  const name = serviceName.toLowerCase();
  if (name.includes('plomería') || name.includes('fontanería') || name.includes('reparación') || name.includes('instalación')) return '🔧';
  if (name.includes('auto') || name.includes('carro') || name.includes('coche') || name.includes('mecánico')) return '🚗';
  if (name.includes('salud') || name.includes('médico') || name.includes('doctor') || name.includes('enfermería')) return '🩺';
  if (name.includes('belleza') || name.includes('peluquería') || name.includes('cabello') || name.includes('spa')) return '✂️';
  if (name.includes('legal') || name.includes('abogado') || name.includes('ley') || name.includes('notaría')) return '⚖️';
  if (name.includes('educación') || name.includes('clases') || name.includes('tutor') || name.includes('curso')) return '📚';
  if (name.includes('fiesta') || name.includes('evento') || name.includes('celebración') || name.includes('música')) return '🎉';
  if (name.includes('tecnología') || name.includes('computadora') || name.includes('web') || name.includes('soporte')) return '💻';
  if (name.includes('limpieza') || name.includes('aseo') || name.includes('mantenimiento')) return '🧹';
  if (name.includes('construcción') || name.includes('obra') || name.includes('albañil')) return '🏗️';
  if (name.includes('jardín') || name.includes('paisaje') || name.includes('jardinería')) return '🌱';
  return '✅'; // Default emoji
};

// Service type detection
const getServiceType = (serviceName: string): 'mobile' | 'onsite' | 'both' => {
  const name = serviceName.toLowerCase();
  const mobileKeywords = ['móvil', 'mobile', 'domicilio', 'a domicilio', 'delivery', 'entrega'];
  const onsiteKeywords = ['taller', 'local', 'tienda', 'oficina', 'consultorio'];
  
  const hasMobile = mobileKeywords.some(keyword => name.includes(keyword));
  const hasOnsite = onsiteKeywords.some(keyword => name.includes(keyword));
  
  if (hasMobile && hasOnsite) return 'both';
  if (hasMobile) return 'mobile';
  return 'onsite';
};

// Service type icon
const getServiceTypeIcon = (serviceType: 'mobile' | 'onsite' | 'both') => {
  switch (serviceType) {
    case 'mobile': return '🚗';
    case 'onsite': return '🏢';
    case 'both': return '🚗🏢';
    default: return '📍';
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
    
    let message = lang === "en" 
      ? "Hi, I saw your profile on Leonix and would like to request a quote."
      : "Hola, vi tu perfil en Leonix y quiero pedir una cotización.";
    
    message += lang === "en" 
      ? ` for ${serviceName}`
      : ` para ${serviceName}`;
    
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
          return (
            <button
              key={s.id}
              onClick={() => quoteDestination && handleServiceQuoteClick(s.title)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium shadow-sm transition hover:shadow-md ${quoteDestination ? 'cursor-pointer' : 'cursor-default'}`}
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
              <span className="text-xs text-[#3B66AD]/60 mr-1">{getServiceTypeIcon(serviceType)}</span>
              <span className="text-base">{getServiceEmoji(s.title)}</span>
              <span>{s.title}</span>
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
              return (
                <button
                  key={s.id}
                  onClick={() => quoteDestination && handleServiceQuoteClick(s.title)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium shadow-sm transition hover:shadow-md ${quoteDestination ? 'cursor-pointer' : 'cursor-default'}`}
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
                  <span className="text-xs text-[#3B66AD]/60 mr-1">{getServiceTypeIcon(serviceType)}</span>
                  <span className="text-base">{getServiceEmoji(s.title)}</span>
                  <span>{s.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
