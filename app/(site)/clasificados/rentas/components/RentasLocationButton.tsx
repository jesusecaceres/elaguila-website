"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  RENTAS_QUERY_LAT,
  RENTAS_QUERY_LNG,
  RENTAS_QUERY_RADIUS_KM,
} from "@/app/clasificados/rentas/shared/rentasResultsQueryKeys";

type Props = {
  lang: "es" | "en";
  copy: {
    locationUseMine: string;
    locationDenied: string;
    locationPending: string;
    locationScaffoldNote: string;
  };
  /** Current query string (preserves filters + `lang`). */
  baseQueryString: string;
};

/**
 * Click-only geolocation — never calls `getCurrentPosition` until the user acts.
 * Writes `lat`, `lng`, `radius_km` to the URL; grid filtering stays manual until geo index exists.
 */
export function RentasLocationButton({ lang, copy, baseQueryString }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<"idle" | "pending" | "denied" | "ok">("idle");

  const onClick = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus("denied");
      return;
    }
    setStatus("pending");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const sp = new URLSearchParams(baseQueryString);
        sp.set(RENTAS_QUERY_LAT, String(pos.coords.latitude));
        sp.set(RENTAS_QUERY_LNG, String(pos.coords.longitude));
        sp.set(RENTAS_QUERY_RADIUS_KM, "25");
        if (!sp.get("lang")) sp.set("lang", lang);
        router.replace(`${pathname}?${sp.toString()}`);
        setStatus("ok");
      },
      () => setStatus("denied"),
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 60_000 }
    );
  }, [baseQueryString, lang, pathname, router]);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onClick}
        className="inline-flex min-h-[44px] w-full max-w-xs items-center justify-center rounded-full border border-[#5B7C99]/35 bg-white px-4 text-sm font-semibold text-[#2C3E4D] shadow-sm transition hover:border-[#C45C26]/35 hover:bg-[#FFFCF7] sm:w-auto"
      >
        {status === "pending" ? copy.locationPending : copy.locationUseMine}
      </button>
      {status === "denied" ? <p className="text-xs text-[#8B4513]">{copy.locationDenied}</p> : null}
      {status === "ok" ? <p className="text-xs text-[#4A4338]/88">{copy.locationScaffoldNote}</p> : null}
    </div>
  );
}
