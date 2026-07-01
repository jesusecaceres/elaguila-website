"use client";

import { AutosLandingPage } from "../../landing/AutosLandingPage";
import type { AutosPublicMarket } from "@/app/lib/clasificados/autos/autosPublicMarket";

export function AutosPublicLanding({ market = "private" }: { market?: AutosPublicMarket }) {
  return <AutosLandingPage market={market} />;
}
