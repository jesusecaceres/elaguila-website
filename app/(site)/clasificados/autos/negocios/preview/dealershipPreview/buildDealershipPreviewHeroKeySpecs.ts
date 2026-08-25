import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import {
  resolveBodyStyle,
  resolveDrivetrain,
  resolveFuelType,
  resolveTransmission,
} from "@/app/clasificados/autos/negocios/lib/autoDealerSelectResolve";
import { resolveEngineForDisplay } from "@/app/lib/clasificados/autos/autosVehicleEngineOptions";
import { formatMpgPair } from "@/app/clasificados/autos/negocios/components/autoDealerFormatters";

function nonEmpty(s: string | undefined | null): string | undefined {
  const t = typeof s === "string" ? s.trim() : "";
  return t.length > 0 ? t : undefined;
}

/** Preview-only key-spec strip builder (transmisión / tracción / MPG / motor — real data only). */
export function buildDealershipPreviewHeroKeySpecs(
  data: AutoDealerListing,
  lang: AutosNegociosLang,
): Array<{ key: string; label: string; value: string }> {
  const labels =
    lang === "es"
      ? { trans: "Transmisión", drive: "Tracción", eng: "Motor", fuel: "Combustible", body: "Carrocería", mpg: "Ciudad / Carretera" }
      : { trans: "Transmission", drive: "Drivetrain", eng: "Engine", fuel: "Fuel", body: "Body", mpg: "City / Highway" };

  const items: Array<{ key: string; label: string; value: string }> = [];
  const push = (key: string, label: string, value: string | undefined) => {
    const v = nonEmpty(value);
    if (v) items.push({ key, label, value: v });
  };

  push("trans", labels.trans, resolveTransmission(data));
  push("drive", labels.drive, resolveDrivetrain(data));
  if (items.length < 4) push("mpg", labels.mpg, formatMpgPair(data.mpgCity ?? undefined, data.mpgHighway ?? undefined) || undefined);
  if (items.length < 4) push("eng", labels.eng, resolveEngineForDisplay(data));
  if (items.length < 4) push("fuel", labels.fuel, resolveFuelType(data));
  if (items.length < 4) push("body", labels.body, resolveBodyStyle(data));

  return items.slice(0, 4);
}

/**
 * Ensures a real city/highway MPG item is present in the hero key-spec strip, regardless of
 * which builder produced `items` (this file's cap-4 builder, or the buyer-preview view model's
 * own hero items passed in via `heroSpecItemsProp`). Preview-owned post-processing only — never
 * touches the view-model file itself, which has shared/live consumers. No-ops if an "mpg" item
 * is already present (no duplicate) or if no real MPG data exists (never invents a value).
 */
export function withMpgHeroItem(
  items: Array<{ key: string; label: string; value: string }>,
  data: AutoDealerListing,
  lang: AutosNegociosLang,
): Array<{ key: string; label: string; value: string }> {
  if (items.some((item) => item.key === "mpg")) return items;
  const mpg = formatMpgPair(data.mpgCity ?? undefined, data.mpgHighway ?? undefined);
  if (!mpg) return items;
  const label = lang === "es" ? "Ciudad / Carretera" : "City / Highway";
  return [...items, { key: "mpg", label, value: mpg }];
}
