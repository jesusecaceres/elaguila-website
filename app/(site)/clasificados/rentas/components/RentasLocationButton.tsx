"use client";

/**
 * Geo-radius search is disabled: public listings do not yet carry coordinates for server-side radius filtering.
 * City / ZIP above remain the supported location narrowing path (see `rentasBrowseContract`).
 */
export function RentasLocationButton({
  copy,
}: {
  lang: "es" | "en";
  copy: {
    geoSearchDisabledTitle: string;
    geoSearchDisabledBody: string;
  };
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-[#D4CBC0]/80 bg-[#FFFCF7]/90 px-4 py-3">
      <p className="text-xs font-semibold text-[#2C3E4D]">{copy.geoSearchDisabledTitle}</p>
      <p className="text-xs leading-snug text-[#5C5346]/90">{copy.geoSearchDisabledBody}</p>
    </div>
  );
}
