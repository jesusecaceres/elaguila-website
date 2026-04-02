import {
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
import { formatMiles } from "./autoDealerFormatters";
import { SpecIconRow } from "./SpecIconRow";

function conditionEs(c: AutoDealerListing["condition"]): string | undefined {
  if (c === undefined) return undefined;
  if (c === "new") return "Nuevo";
  if (c === "certified") return "Certificado";
  return "Usado";
}

const CARD =
  "rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 shadow-[0_8px_32px_-8px_rgba(42,36,22,0.08)]";

export function VehicleSpecsGrid({ data }: { data: AutoDealerListing }) {
  const mpg =
    data.mpgCity != null &&
    Number.isFinite(data.mpgCity) &&
    data.mpgHighway != null &&
    Number.isFinite(data.mpgHighway)
      ? `${data.mpgCity} / ${data.mpgHighway} mpg`
      : undefined;

  const doors =
    data.doors !== undefined && Number.isFinite(data.doors) ? String(data.doors) : undefined;
  const seats =
    data.seats !== undefined && Number.isFinite(data.seats) ? String(data.seats) : undefined;
  const mileageStr =
    data.mileage !== undefined && Number.isFinite(data.mileage) ? formatMiles(data.mileage) : undefined;

  const rows: Array<{ key: string; label: string; value: string | undefined; icon: ReactNode }> = [
    { key: "body", label: "Estilo de carrocería", value: data.bodyStyle, icon: <BiCar className="h-5 w-5" /> },
    { key: "drive", label: "Tracción", value: data.drivetrain, icon: <TbRoad className="h-5 w-5" /> },
    { key: "trans", label: "Transmisión", value: data.transmission, icon: <BiTachometer className="h-5 w-5" /> },
    { key: "eng", label: "Motor", value: data.engine, icon: <BiCylinder className="h-5 w-5" /> },
    { key: "fuel", label: "Combustible", value: data.fuelType, icon: <BiGasPump className="h-5 w-5" /> },
    { key: "mpg", label: "Rendimiento (ciudad / carretera)", value: mpg, icon: <FiLayers className="h-5 w-5" /> },
    { key: "ex", label: "Color exterior", value: data.exteriorColor, icon: <BiPalette className="h-5 w-5" /> },
    { key: "in", label: "Color interior", value: data.interiorColor, icon: <BiColorFill className="h-5 w-5" /> },
    { key: "doors", label: "Puertas", value: doors, icon: <BiCar className="h-5 w-5" /> },
    { key: "seats", label: "Asientos", value: seats, icon: <TbArmchair className="h-5 w-5" /> },
    { key: "cond", label: "Condición", value: conditionEs(data.condition), icon: <BiKey className="h-5 w-5" /> },
    { key: "title", label: "Estado del título", value: data.titleStatus, icon: <BiShieldQuarter className="h-5 w-5" /> },
    { key: "vin", label: "VIN", value: data.vin, icon: <span className="text-xs font-bold">VIN</span> },
    { key: "stock", label: "Stock", value: data.stockNumber, icon: <span className="text-xs font-bold">#</span> },
    { key: "mi", label: "Millaje", value: mileageStr, icon: <BiTachometer className="h-5 w-5" /> },
  ];

  const visible = rows.filter((r) => r.value !== undefined && String(r.value).trim() !== "");
  if (visible.length === 0) return null;

  return (
    <section className={CARD}>
      <h2 className="text-base font-bold tracking-tight text-[color:var(--lx-text)]">Especificaciones</h2>
      <p className="mt-1 text-sm text-[color:var(--lx-muted)]">Datos verificados por el concesionario</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {visible.map((r) => (
          <SpecIconRow key={r.key} icon={r.icon} label={r.label} value={r.value} />
        ))}
      </div>
    </section>
  );
}
