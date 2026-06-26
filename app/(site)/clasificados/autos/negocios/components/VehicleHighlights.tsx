"use client";

import { BiCamera, BiCar, BiChip, BiNavigation, BiSun } from "react-icons/bi";
import { FiSmartphone, FiWind } from "react-icons/fi";
import { TbArmchair2, TbGauge, TbLayoutGrid } from "react-icons/tb";
import type { ReactNode } from "react";
import type { AutoDealerListing } from "../types/autoDealerListing";
import { useAutosNegociosPreviewCopy } from "../lib/AutosNegociosPreviewLocaleContext";

import { autosPreviewPremiumCardClass, autosPreviewRectEquipmentClass, autosPreviewSectionEyebrowClass, autosPreviewSectionTitleClass } from "@/app/lib/clasificados/autos/autosNegociosPremiumPreviewTokens";

const CARD = `${autosPreviewPremiumCardClass} p-5 sm:p-6`;

function iconForFeature(label: string): ReactNode {
  const t = label.toLowerCase();
  if (t.includes("carplay") || t.includes("android")) return <BiChip className="h-5 w-5 shrink-0 text-[color:var(--lx-gold)]" />;
  if (t.includes("cámara") || t.includes("camara") || t.includes("backup")) return <BiCamera className="h-5 w-5 shrink-0 text-[color:var(--lx-gold)]" />;
  if (t.includes("punto ciego") || t.includes("blind")) return <FiWind className="h-5 w-5 shrink-0 text-[color:var(--lx-gold)]" />;
  if (t.includes("crucero") || t.includes("cruise")) return <TbGauge className="h-5 w-5 shrink-0 text-[color:var(--lx-gold)]" />;
  if (t.includes("techo") || t.includes("roof") || t.includes("panoramic")) return <BiSun className="h-5 w-5 shrink-0 text-[color:var(--lx-gold)]" />;
  if (t.includes("asientos") || t.includes("heated") || t.includes("seat")) return <TbArmchair2 className="h-5 w-5 shrink-0 text-[color:var(--lx-gold)]" />;
  if (t.includes("navegación") || t.includes("navegacion") || t.includes("navigation")) return <BiNavigation className="h-5 w-5 shrink-0 text-[color:var(--lx-gold)]" />;
  if (t.includes("remote") || t.includes("arranque")) return <FiSmartphone className="h-5 w-5 shrink-0 text-[color:var(--lx-gold)]" />;
  if (t.includes("awd") || t.includes("4wd") || t.includes("4x4")) return <BiCar className="h-5 w-5 shrink-0 text-[color:var(--lx-gold)]" />;
  if (t.includes("tercera") || t.includes("third")) return <TbLayoutGrid className="h-5 w-5 shrink-0 text-[color:var(--lx-gold)]" />;
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
  const { t, lang } = useAutosNegociosPreviewCopy();
  const checklist = (data.features ?? []).map((f) => f.trim()).filter(Boolean);
  const custom = (data.customEquipment ?? []).map((f) => f.trim()).filter(Boolean);
  const feats = [...checklist, ...custom];
  if (feats.length === 0) return null;

  const { title, subtitle } = t.preview.highlights;

  return (
    <section className={CARD}>
      <p className={autosPreviewSectionEyebrowClass}>{lang === "es" ? "Equipamiento" : "Equipment"}</p>
      <h2 className={`mt-1 ${autosPreviewSectionTitleClass}`}>{title}</h2>
      <p className="mt-1 text-sm text-[color:var(--lx-muted)]">{subtitle}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {feats.map((f) => (
          <div key={f} className={autosPreviewRectEquipmentClass}>
            {iconForFeature(f)}
            <span className="break-words text-sm font-semibold leading-snug text-[#1F241C]">{f}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
