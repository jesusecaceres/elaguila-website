"use client";

import { ServiciosHorizontalResultCard } from "../components/ServiciosHorizontalResultCard";
import type { ServiciosProfileResolved } from "@/app/(site)/servicios/types/serviciosBusinessProfile";

interface ServiciosPreviewCardProps {
  data: ServiciosProfileResolved;
  className?: string;
  lang?: "es" | "en";
  /** Ignored — discovery cards never show like/save/share (see full vitrina). */
  showEngagementMetrics?: boolean;
  listingId?: string;
  persistEngagement?: boolean;
}

/** @deprecated Prefer `ServiciosHorizontalResultCard` with `previewProfile` — same UI, no engagement row. */
export function ServiciosPreviewCard({
  data,
  className = "",
  lang = "es",
}: ServiciosPreviewCardProps) {
  return <ServiciosHorizontalResultCard previewProfile={data} lang={lang} className={className} />;
}
