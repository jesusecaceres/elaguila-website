"use client";

import {
  BiCalendar,
  BiCar,
  BiColorFill,
  BiCylinder,
  BiGasPump,
  BiKey,
  BiPalette,
  BiShieldQuarter,
  BiTachometer,
} from "react-icons/bi";
import { FiLayers } from "react-icons/fi";
import { TbArmchair, TbRoad } from "react-icons/tb";
import type { ReactNode } from "react";
import type { AutoDealerListing } from "../types/autoDealerListing";
import {
  resolveBodyStyle,
  resolveDrivetrain,
  resolveExteriorColor,
  resolveFuelType,
  resolveInteriorColor,
  resolveTitleStatus,
  resolveTransmission,
} from "../lib/autoDealerSelectResolve";
import { formatMiles, formatMpgPair, formatStockDisplay, formatVinDisplay } from "./autoDealerFormatters";
import { SpecIconRow } from "./SpecIconRow";
import { useAutosNegociosPreviewCopy } from "../lib/AutosNegociosPreviewLocaleContext";
import { normalizeVehicleSegment } from "@/app/(site)/publicar/autos/negocios/lib/autoDealerTitle";
import { resolveEngineForDisplay } from "@/app/lib/clasificados/autos/autosVehicleEngineOptions";
import { autosPreviewPremiumCardClass, autosPreviewSectionEyebrowClass, autosPreviewSectionTitleClass } from "@/app/lib/clasificados/autos/autosNegociosPremiumPreviewTokens";

const CARD = `${autosPreviewPremiumCardClass} p-5 sm:p-6`;

export function VehicleSpecsGrid({
  data,
  hiddenRowKeys,
  variant = "full",
}: {
  data: AutoDealerListing;
  /** Optional row keys to omit (e.g. Privado shell hides inventory-only rows). */
  hiddenRowKeys?: readonly string[];
  /** `canvasStrip` renders a compact horizontal strip for the unified vehicle canvas. */
  variant?: "full" | "canvasStrip";
}) {
  const { t, lang } = useAutosNegociosPreviewCopy();
  const hidden = new Set(hiddenRowKeys ?? []);
  const rowsL = t.preview.specs.rows;

  function conditionLabel(c: AutoDealerListing["condition"]): string | undefined {
    if (c === undefined) return undefined;
    const row = t.taxonomy.condition.find((x) => x.value === c);
    return row?.label;
  }

  const mpg = formatMpgPair(data.mpgCity ?? undefined, data.mpgHighway ?? undefined) || undefined;

  const doors =
    data.doors !== undefined && Number.isFinite(data.doors) ? String(data.doors) : undefined;
  const seats =
    data.seats !== undefined && Number.isFinite(data.seats) ? String(data.seats) : undefined;
  const mileageStr =
    data.mileage !== undefined && Number.isFinite(data.mileage) ? formatMiles(data.mileage) : undefined;

  const yearStr =
    data.year !== undefined && Number.isFinite(data.year) ? String(Math.round(data.year)) : undefined;
  const makeRaw = data.make?.trim();
  const modelRaw = data.model?.trim();
  const trimRaw = data.trim?.trim();
  const makeStr = normalizeVehicleSegment(makeRaw) ?? (makeRaw || undefined);
  const modelStr = normalizeVehicleSegment(modelRaw) ?? (modelRaw || undefined);
  const trimStr = normalizeVehicleSegment(trimRaw) ?? (trimRaw || undefined);
  const engineStr = resolveEngineForDisplay(data);

  const rows: Array<{ key: string; label: string; value: string | undefined; icon: ReactNode }> = [
    { key: "year", label: rowsL.year, value: yearStr, icon: <BiCalendar className="h-5 w-5" /> },
    { key: "make", label: rowsL.make, value: makeStr, icon: <BiCar className="h-5 w-5" /> },
    { key: "model", label: rowsL.model, value: modelStr, icon: <BiCar className="h-5 w-5" /> },
    { key: "trim", label: rowsL.trim, value: trimStr, icon: <BiCar className="h-5 w-5" /> },
    { key: "body", label: rowsL.body, value: resolveBodyStyle(data), icon: <BiCar className="h-5 w-5" /> },
    { key: "drive", label: rowsL.drive, value: resolveDrivetrain(data), icon: <TbRoad className="h-5 w-5" /> },
    { key: "trans", label: rowsL.trans, value: resolveTransmission(data), icon: <BiTachometer className="h-5 w-5" /> },
    { key: "eng", label: rowsL.eng, value: engineStr, icon: <BiCylinder className="h-5 w-5" /> },
    { key: "fuel", label: rowsL.fuel, value: resolveFuelType(data), icon: <BiGasPump className="h-5 w-5" /> },
    { key: "mpg", label: rowsL.mpg, value: mpg, icon: <FiLayers className="h-5 w-5" /> },
    { key: "ex", label: rowsL.ex, value: resolveExteriorColor(data), icon: <BiPalette className="h-5 w-5" /> },
    { key: "in", label: rowsL.in, value: resolveInteriorColor(data), icon: <BiColorFill className="h-5 w-5" /> },
    { key: "doors", label: rowsL.doors, value: doors, icon: <BiCar className="h-5 w-5" /> },
    { key: "seats", label: rowsL.seats, value: seats, icon: <TbArmchair className="h-5 w-5" /> },
    { key: "cond", label: rowsL.cond, value: conditionLabel(data.condition), icon: <BiKey className="h-5 w-5" /> },
    { key: "title", label: rowsL.title, value: resolveTitleStatus(data), icon: <BiShieldQuarter className="h-5 w-5" /> },
    {
      key: "vin",
      label: rowsL.vin,
      value: data.vin ? formatVinDisplay(data.vin) : undefined,
      icon: <span className="text-xs font-bold">VIN</span>,
    },
    {
      key: "stock",
      label: rowsL.stock,
      value: data.stockNumber ? formatStockDisplay(data.stockNumber) : undefined,
      icon: <span className="text-xs font-bold">#</span>,
    },
    { key: "mi", label: rowsL.mi, value: mileageStr, icon: <BiTachometer className="h-5 w-5" /> },
  ];

  const visible = rows.filter(
    (r) => !hidden.has(r.key) && r.value !== undefined && String(r.value).trim() !== "",
  );
  if (visible.length === 0) return null;

  const CANVAS_STRIP_KEYS = ["year", "make", "model", "trim", "trans", "fuel", "drive", "mi", "body"] as const;
  const stripVisible =
    variant === "canvasStrip"
      ? CANVAS_STRIP_KEYS.map((k) => visible.find((r) => r.key === k)).filter(
          (r): r is (typeof visible)[number] => r != null,
        )
      : visible;

  if (variant === "canvasStrip") {
    if (stripVisible.length === 0) return null;
    return (
      <div
        className="grid min-w-0 grid-cols-2 gap-px overflow-hidden rounded-[10px] border border-[#D6C7AD]/70 bg-[#D6C7AD]/45 sm:grid-cols-4 lg:grid-cols-8"
        data-autos-canvas-specs-strip="1"
      >
        {stripVisible.map((r) => (
          <div
            key={r.key}
            className="flex min-h-[3.25rem] min-w-0 flex-col justify-center bg-[#FFFCF7] px-2.5 py-2"
          >
            <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#8A6B1F]">{r.label}</p>
            <p
              className={`mt-0.5 truncate text-sm font-bold leading-tight text-[#1F241C] ${r.key === "vin" ? "font-mono text-[13px] tracking-wide" : ""}`}
            >
              {r.value}
            </p>
          </div>
        ))}
      </div>
    );
  }

  const { title, subtitle } = t.preview.specs;
  const mobilePrimary = visible.slice(0, 6);
  const mobileRest = visible.slice(6);
  const moreLabel =
    lang === "es"
      ? `Ver más especificaciones (${mobileRest.length})`
      : `View more specs (${mobileRest.length})`;

  return (
    <section className={CARD}>
      <p className={autosPreviewSectionEyebrowClass}>{lang === "es" ? "Detalles del vehículo" : "Vehicle details"}</p>
      <h2 className={`mt-1 ${autosPreviewSectionTitleClass}`}>{title}</h2>
      <p className="mt-1 text-sm text-[color:var(--lx-muted)]">{subtitle}</p>
      <div className="mt-4 grid min-w-0 gap-3 sm:hidden">
        {mobilePrimary.map((r) => (
          <SpecIconRow
            key={r.key}
            icon={r.icon}
            label={r.label}
            value={r.value}
            valueClassName={r.key === "vin" ? "font-mono text-[13px] tracking-wide" : undefined}
          />
        ))}
      </div>
      {mobileRest.length > 0 ? (
        <details className="mt-3 sm:hidden">
          <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-center rounded-xl border border-[color:var(--lx-gold-border)] bg-[#FFFDF7] px-4 text-sm font-bold text-[color:var(--lx-text)] [&::-webkit-details-marker]:hidden">
            {moreLabel}
          </summary>
          <div className="mt-3 grid min-w-0 gap-3">
            {mobileRest.map((r) => (
              <SpecIconRow
                key={r.key}
                icon={r.icon}
                label={r.label}
                value={r.value}
                valueClassName={r.key === "vin" ? "font-mono text-[13px] tracking-wide" : undefined}
              />
            ))}
          </div>
        </details>
      ) : null}
      <div className="mt-4 hidden min-w-0 auto-rows-fr gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visible.map((r) => (
          <SpecIconRow
            key={r.key}
            icon={r.icon}
            label={r.label}
            value={r.value}
            valueClassName={r.key === "vin" ? "font-mono text-[13px] tracking-wide" : undefined}
          />
        ))}
      </div>
    </section>
  );
}
