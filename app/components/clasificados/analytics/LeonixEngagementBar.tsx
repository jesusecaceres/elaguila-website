"use client";

import { FiEye, FiHeart, FiBookmark, FiShare2, FiMousePointer, FiMessageCircle, FiFileText } from "react-icons/fi";
import type { ListingMetrics } from "@/app/lib/clasificadosAnalytics";

type Props = {
  metrics: ListingMetrics;
  variant?: "default" | "compact" | "minimal";
  className?: string;
  lang?: "es" | "en";
};

const LABELS = {
  es: {
    views: "Vistas",
    likes: "Me gusta", 
    saves: "Guardados",
    shares: "Compartidos",
    clicks: "Clics",
    contacts: "Contactos",
    applications: "Solicitudes"
  },
  en: {
    views: "Views",
    likes: "Likes",
    saves: "Saves", 
    shares: "Shares",
    clicks: "Clicks",
    contacts: "Contacts",
    applications: "Applications"
  }
} as const;

/**
 * Premium engagement bar following Leonix design system
 * Shows key metrics in a clean, scannable format
 */
export function LeonixEngagementBar({ 
  metrics, 
  variant = "default", 
  className = "",
  lang = "es" 
}: Props) {
  const labels = LABELS[lang];
  
  const items = [
    {
      key: "views",
      value: metrics.views,
      label: labels.views,
      icon: <FiEye className="h-4 w-4" />,
      show: true
    },
    {
      key: "likes", 
      value: metrics.likes,
      label: labels.likes,
      icon: <FiHeart className="h-4 w-4" />,
      show: metrics.likes > 0
    },
    {
      key: "saves",
      value: metrics.saves, 
      label: labels.saves,
      icon: <FiBookmark className="h-4 w-4" />,
      show: metrics.saves > 0
    },
    {
      key: "shares",
      value: metrics.shares,
      label: labels.shares, 
      icon: <FiShare2 className="h-4 w-4" />,
      show: metrics.shares > 0
    },
    {
      key: "clicks",
      value: metrics.ctaClicks,
      label: labels.clicks,
      icon: <FiMousePointer className="h-4 w-4" />,
      show: metrics.ctaClicks > 0
    },
    {
      key: "contacts",
      value: metrics.leads,
      label: labels.contacts,
      icon: <FiMessageCircle className="h-4 w-4" />,
      show: metrics.leads > 0
    },
    {
      key: "applications", 
      value: metrics.applications,
      label: labels.applications,
      icon: <FiFileText className="h-4 w-4" />,
      show: metrics.applications > 0
    }
  ].filter(item => item.show);

  if (variant === "minimal") {
    return (
      <div className={`flex items-center gap-4 text-sm text-[#7A7A7A] ${className}`}>
        {items.map((item) => (
          <span key={item.key} className="flex items-center gap-1">
            {item.icon}
            <span>{item.value}</span>
          </span>
        ))}
      </div>
    );
  }

  const cellClasses = variant === "compact" 
    ? "flex items-center gap-2 rounded-xl bg-[#FFFAF0] px-3 py-2 border border-[#E5E5E5]/50"
    : "flex items-center gap-2 rounded-2xl bg-[#FFFAF0] px-4 py-3 border border-[#E5E5E5]/50";

  const containerClasses = variant === "compact"
    ? "flex flex-wrap gap-2"
    : "flex flex-wrap gap-3 sm:gap-4";

  return (
    <div className={`${containerClasses} ${className}`}>
      {items.map((item) => (
        <div key={item.key} className={cellClasses}>
          <span className="text-[#D4A574]">{item.icon}</span>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-[#1A1A1A] tabular-nums">
              {item.value}
            </span>
            <span className="text-xs text-[#7A7A7A]">
              {item.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
