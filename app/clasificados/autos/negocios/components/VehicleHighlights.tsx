import { BiCamera, BiCar, BiChip, BiNavigation, BiSun } from "react-icons/bi";
import { FiSmartphone, FiWind } from "react-icons/fi";
import { TbArmchair2, TbGauge, TbLayoutGrid } from "react-icons/tb";
import type { ReactNode } from "react";
import type { AutoDealerListing } from "../types/autoDealerListing";

const CARD =
  "rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 shadow-[0_8px_32px_-8px_rgba(42,36,22,0.08)]";

const PILL =
  "flex items-start gap-3 rounded-[14px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] p-3 shadow-[0_2px_12px_rgba(42,36,22,0.04)]";

function iconForFeature(label: string): ReactNode {
  const t = label.toLowerCase();
  if (t.includes("carplay") || t.includes("android")) return <BiChip className="h-5 w-5 shrink-0 text-[color:var(--lx-gold)]" />;
  if (t.includes("cámara") || t.includes("camara")) return <BiCamera className="h-5 w-5 shrink-0 text-[color:var(--lx-gold)]" />;
  if (t.includes("punto ciego")) return <FiWind className="h-5 w-5 shrink-0 text-[color:var(--lx-gold)]" />;
  if (t.includes("crucero")) return <TbGauge className="h-5 w-5 shrink-0 text-[color:var(--lx-gold)]" />;
  if (t.includes("techo")) return <BiSun className="h-5 w-5 shrink-0 text-[color:var(--lx-gold)]" />;
  if (t.includes("asientos")) return <TbArmchair2 className="h-5 w-5 shrink-0 text-[color:var(--lx-gold)]" />;
  if (t.includes("navegación") || t.includes("navegacion")) return <BiNavigation className="h-5 w-5 shrink-0 text-[color:var(--lx-gold)]" />;
  if (t.includes("remote")) return <FiSmartphone className="h-5 w-5 shrink-0 text-[color:var(--lx-gold)]" />;
  if (t.includes("awd") || t.includes("4wd") || t.includes("4x4")) return <BiCar className="h-5 w-5 shrink-0 text-[color:var(--lx-gold)]" />;
  if (t.includes("tercera")) return <TbLayoutGrid className="h-5 w-5 shrink-0 text-[color:var(--lx-gold)]" />;
  return <BiCheckDecor />;
}

function BiCheckDecor() {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-nav-hover)] text-sm font-bold text-[color:var(--lx-gold)]">
      ✓
    </span>
  );
}

export function VehicleHighlights({ data }: { data: AutoDealerListing }) {
  if (data.features.length === 0) return null;

  return (
    <section className={CARD}>
      <h2 className="text-base font-bold tracking-tight text-[color:var(--lx-text)]">Destacados</h2>
      <p className="mt-1 text-sm text-[color:var(--lx-muted)]">Equipamiento seleccionado por el vendedor</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.features.map((f) => (
          <div key={f} className={PILL}>
            {iconForFeature(f)}
            <span className="text-sm font-semibold leading-snug text-[color:var(--lx-text)]">{f}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
