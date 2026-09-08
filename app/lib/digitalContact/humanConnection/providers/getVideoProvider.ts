import "server-only";

import type { HumanConnectionVideoProvider } from "./types";
import { unconfiguredVideoProvider } from "./unconfiguredProvider";
import { createDailyVideoProvider } from "./dailyProvider";

/**
 * Resolve the active video provider.
 *
 * Env:
 *   HUMAN_CONNECTION_VIDEO_PROVIDER=unconfigured|daily
 *   DAILY_API_KEY=... (server-only; never NEXT_PUBLIC_*)
 *
 * Unknown ids fail closed to unconfigured.
 */
export function getHumanConnectionVideoProvider(): HumanConnectionVideoProvider {
  const id = String(process.env.HUMAN_CONNECTION_VIDEO_PROVIDER ?? "unconfigured")
    .trim()
    .toLowerCase();

  if (id === "daily") {
    const daily = createDailyVideoProvider();
    if (!daily.isConfigured()) {
      console.warn(
        "[human-connection] HUMAN_CONNECTION_VIDEO_PROVIDER=daily but DAILY_API_KEY is missing; using unconfigured",
      );
      return unconfiguredVideoProvider;
    }
    return daily;
  }

  if (id && id !== "unconfigured" && id !== "none" && id !== "") {
    console.warn(
      `[human-connection] video provider "${id}" is not implemented; using unconfigured adapter`,
    );
  }

  return unconfiguredVideoProvider;
}

export function isHumanConnectionVideoProviderReady(): boolean {
  const p = getHumanConnectionVideoProvider();
  const cap = p.getCapability();
  return p.isConfigured() && cap.healthy && cap.canCreateEphemeralSession;
}
