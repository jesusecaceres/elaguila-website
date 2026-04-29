"use client";

import { FiEye, FiHeart, FiBookmark, FiShare2, FiMousePointer, FiMessageCircle, FiFileText } from "react-icons/fi";

type Props = {
  type: "views" | "likes" | "saves" | "shares" | "clicks" | "contacts" | "applications";
  value: number;
  variant?: "default" | "small" | "large";
  className?: string;
  lang?: "es" | "en";
  showIcon?: boolean;
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

const ICONS = {
  views: FiEye,
  likes: FiHeart,
  saves: FiBookmark,
  shares: FiShare2,
  clicks: FiMousePointer,
  contacts: FiMessageCircle,
  applications: FiFileText
} as const;

/**
 * Individual metric pill component following Leonix design system
 * Used for displaying single engagement metrics
 */
export function LeonixMetricPill({ 
  type, 
  value, 
  variant = "default", 
  className = "",
  lang = "es",
  showIcon = true 
}: Props) {
  const labels = LABELS[lang];
  const Icon = ICONS[type];
  
  const sizeClasses = {
    small: "px-2 py-1 text-xs",
    default: "px-3 py-1.5 text-sm", 
    large: "px-4 py-2 text-base"
  };
  
  const iconSizes = {
    small: "h-3 w-3",
    default: "h-4 w-4",
    large: "h-5 w-5"
  };
  
  const valueSizes = {
    small: "text-sm font-semibold",
    default: "text-base font-bold",
    large: "text-lg font-bold"
  };
  
  const labelSizes = {
    small: "text-[10px]",
    default: "text-xs",
    large: "text-sm"
  };
  
  return (
    <div className={`
      inline-flex items-center gap-2 rounded-full
      bg-[#FFFAF0] border border-[#E5E5E5]/50
      ${sizeClasses[variant]}
      ${className}
    `}>
      {showIcon && (
        <Icon className={`${iconSizes[variant]} text-[#D4A574]`} />
      )}
      <div className="flex items-center gap-1">
        <span className={`${valueSizes[variant]} text-[#1A1A1A] tabular-nums`}>
          {value}
        </span>
        <span className={`${labelSizes[variant]} text-[#7A7A7A]`}>
          {labels[type]}
        </span>
      </div>
    </div>
  );
}
