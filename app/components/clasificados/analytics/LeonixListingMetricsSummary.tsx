"use client";

import { LeonixEngagementBar } from "./LeonixEngagementBar";
import { LeonixMetricPill } from "./LeonixMetricPill";
import type { ListingMetrics } from "@/app/lib/clasificadosAnalytics";

type Props = {
  metrics: ListingMetrics;
  variant?: "bar" | "pills" | "compact";
  className?: string;
  lang?: "es" | "en";
  showTitle?: boolean;
  title?: string;
};

const DEFAULT_TITLES = {
  es: "Estadísticas del anuncio",
  en: "Listing Statistics"
} as const;

/**
 * Comprehensive metrics summary component following Leonix design system
 * Can display metrics in different formats: bar, pills, or compact
 */
export function LeonixListingMetricsSummary({ 
  metrics, 
  variant = "bar",
  className = "",
  lang = "es",
  showTitle = false,
  title
}: Props) {
  const displayTitle = title || DEFAULT_TITLES[lang];
  
  if (variant === "pills") {
    return (
      <div className={`space-y-3 ${className}`}>
        {showTitle && (
          <h3 className="text-lg font-semibold text-[#1A1A1A]">
            {displayTitle}
          </h3>
        )}
        <div className="flex flex-wrap gap-2">
          <LeonixMetricPill type="views" value={metrics.views} lang={lang} />
          {metrics.likes > 0 && (
            <LeonixMetricPill type="likes" value={metrics.likes} lang={lang} />
          )}
          {metrics.saves > 0 && (
            <LeonixMetricPill type="saves" value={metrics.saves} lang={lang} />
          )}
          {metrics.shares > 0 && (
            <LeonixMetricPill type="shares" value={metrics.shares} lang={lang} />
          )}
          {metrics.ctaClicks > 0 && (
            <LeonixMetricPill type="clicks" value={metrics.ctaClicks} lang={lang} />
          )}
          {metrics.leads > 0 && (
            <LeonixMetricPill type="contacts" value={metrics.leads} lang={lang} />
          )}
          {metrics.applications > 0 && (
            <LeonixMetricPill type="applications" value={metrics.applications} lang={lang} />
          )}
        </div>
      </div>
    );
  }
  
  if (variant === "compact") {
    return (
      <div className={`space-y-2 ${className}`}>
        {showTitle && (
          <h3 className="text-sm font-medium text-[#7A7A7A] uppercase tracking-wide">
            {displayTitle}
          </h3>
        )}
        <LeonixEngagementBar 
          metrics={metrics} 
          variant="minimal" 
          lang={lang}
        />
      </div>
    );
  }
  
  // Default bar variant
  return (
    <div className={`space-y-4 ${className}`}>
      {showTitle && (
        <h3 className="text-lg font-semibold text-[#1A1A1A]">
          {displayTitle}
        </h3>
      )}
      <LeonixEngagementBar 
        metrics={metrics} 
        variant="default" 
        lang={lang}
      />
      
      {metrics.lastEngagement && (
        <p className="text-xs text-[#7A7A7A]">
          {lang === "es" 
            ? `Última actividad: ${new Date(metrics.lastEngagement).toLocaleDateString("es-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })}`
            : `Last activity: ${new Date(metrics.lastEngagement).toLocaleDateString("en-US", {
                month: "short", 
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })}`
          }
        </p>
      )}
    </div>
  );
}
