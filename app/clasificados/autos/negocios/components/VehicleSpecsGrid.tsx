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

const CARD =
  "rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 shadow-[0_8px_32px_-8px_rgba(42,36,22,0.08)]";

export function VehicleSpecsGrid({ data }: { data: AutoDealerListing }) {
  const { t } = useAutosNegociosPreviewCopy();
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
  const makeStr = data.make?.trim() || undefined;
  const modelStr = data.model?.trim() || undefined;
  const trimStr = data.trim?.trim() || undefined;

  const rows: Array<{ key: string; label: string; value: string | undefined; icon: ReactNode }> = [
    { key: "year", label: rowsL.year, value: yearStr, icon: <BiCalendar className="h-5 w-5" /> },
    { key: "make", label: rowsL.make, value: makeStr, icon: <BiCar className="h-5 w-5" /> },
    { key: "model", label: rowsL.model, value: modelStr, icon: <BiCar className="h-5 w-5" /> },
    { key: "trim", label: rowsL.trim, value: trimStr, icon: <BiCar className="h-5 w-5" /> },
    { key: "body", label: rowsL.body, value: resolveBodyStyle(data), icon: <BiCar className="h-5 w-5" /> },
    { key: "drive", label: rowsL.drive, value: resolveDrivetrain(data), icon: <TbRoad className="h-5 w-5" /> },
    { key: "trans", label: rowsL.trans, value: resolveTransmission(data), icon: <BiTachometer className="h-5 w-5" /> },
    { key: "eng", label: rowsL.eng, value: data.engine, icon: <BiCylinder className="h-5 w-5" /> },
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

  const visible = rows.filter((r) => r.value !== undefined && String(r.value).trim() !== "");
  if (visible.length === 0) return null;

  const { title, subtitle } = t.preview.specs;

  return (
    <section className={CARD}>
      <h2 className="text-base font-bold tracking-tight text-[color:var(--lx-text)]">{title}</h2>
      <p className="mt-1 text-sm text-[color:var(--lx-muted)]">{subtitle}</p>
      <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
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
