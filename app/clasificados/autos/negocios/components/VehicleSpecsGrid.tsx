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
import type { AutoDealerListing } from "../types/autoDealerListing";
import { formatMiles } from "./autoDealerFormatters";
import { SpecIconRow } from "./SpecIconRow";

function conditionEs(c: AutoDealerListing["condition"]): string {
  if (c === "new") return "Nuevo";
  if (c === "certified") return "Certificado";
  return "Usado";
}

const CARD =
  "rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 shadow-[0_8px_32px_-8px_rgba(42,36,22,0.08)]";

export function VehicleSpecsGrid({ data }: { data: AutoDealerListing }) {
  const mpg =
    data.mpgCity != null && data.mpgHighway != null
      ? `${data.mpgCity} / ${data.mpgHighway} mpg`
      : "—";

  return (
    <section className={CARD}>
      <h2 className="text-base font-bold tracking-tight text-[color:var(--lx-text)]">Especificaciones</h2>
      <p className="mt-1 text-sm text-[color:var(--lx-muted)]">Datos verificados por el concesionario</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <SpecIconRow icon={<BiCar className="h-5 w-5" />} label="Estilo de carrocería" value={data.bodyStyle} />
        <SpecIconRow icon={<TbRoad className="h-5 w-5" />} label="Tracción" value={data.drivetrain} />
        <SpecIconRow icon={<BiTachometer className="h-5 w-5" />} label="Transmisión" value={data.transmission} />
        <SpecIconRow icon={<BiCylinder className="h-5 w-5" />} label="Motor" value={data.engine} />
        <SpecIconRow icon={<BiGasPump className="h-5 w-5" />} label="Combustible" value={data.fuelType} />
        <SpecIconRow icon={<FiLayers className="h-5 w-5" />} label="Rendimiento (ciudad / carretera)" value={mpg} />
        <SpecIconRow icon={<BiPalette className="h-5 w-5" />} label="Color exterior" value={data.exteriorColor} />
        <SpecIconRow icon={<BiColorFill className="h-5 w-5" />} label="Color interior" value={data.interiorColor} />
        <SpecIconRow icon={<BiCar className="h-5 w-5" />} label="Puertas" value={String(data.doors)} />
        <SpecIconRow icon={<TbArmchair className="h-5 w-5" />} label="Asientos" value={String(data.seats)} />
        <SpecIconRow icon={<BiKey className="h-5 w-5" />} label="Condición" value={conditionEs(data.condition)} />
        <SpecIconRow icon={<BiShieldQuarter className="h-5 w-5" />} label="Estado del título" value={data.titleStatus} />
        <SpecIconRow icon={<span className="text-xs font-bold">VIN</span>} label="VIN" value={data.vin} />
        <SpecIconRow icon={<span className="text-xs font-bold">#</span>} label="Stock" value={data.stockNumber} />
        <SpecIconRow icon={<BiTachometer className="h-5 w-5" />} label="Millaje" value={formatMiles(data.mileage)} />
      </div>
    </section>
  );
}
