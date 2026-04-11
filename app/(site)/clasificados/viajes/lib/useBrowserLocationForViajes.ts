"use client";

import { useCallback, useState } from "react";

import type { ViajesOriginId } from "./viajesOrigins";
import { resolveNearestViajesOrigin } from "./resolveNearestViajesOrigin";

export type ViajesBrowserLocationState =
  | { status: "idle" }
  | { status: "requesting" }
  | { status: "denied" }
  | { status: "unavailable" }
  | { status: "timeout" }
  | { status: "ready"; originId: ViajesOriginId };

/**
 * Browser geolocation gated behind an explicit user click.
 * Maps WGS84 coordinates to the nearest configured Viajes origin bucket.
 */
export function useBrowserLocationForViajes() {
  const [state, setState] = useState<ViajesBrowserLocationState>({ status: "idle" });

  const requestLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState({ status: "unavailable" });
      return;
    }
    setState({ status: "requesting" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nearest = resolveNearestViajesOrigin(pos.coords.latitude, pos.coords.longitude);
        setState({ status: "ready", originId: nearest.id });
      },
      (err: GeolocationPositionError) => {
        // 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
        if (err.code === 1) setState({ status: "denied" });
        else if (err.code === 3) setState({ status: "timeout" });
        else setState({ status: "unavailable" });
      },
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 120_000 }
    );
  }, []);

  const reset = useCallback(() => setState({ status: "idle" }), []);

  return { state, requestLocation, reset };
}
