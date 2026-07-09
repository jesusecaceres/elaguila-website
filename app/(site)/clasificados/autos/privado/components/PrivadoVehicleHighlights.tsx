"use client";

import { BiCamera, BiCar, BiChip, BiNavigation, BiSun } from "react-icons/bi";
import { FiSmartphone, FiWind } from "react-icons/fi";
import { TbArmchair2, TbGauge, TbLayoutGrid } from "react-icons/tb";
import type { ReactNode } from "react";
import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { useAutosPrivadoPreviewCopy } from "../lib/AutosPrivadoPreviewLocaleContext";
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

export function PrivadoVehicleHighlights({ data }: { data: AutoDealerListing }) {
  const { lang } = useAutosPrivadoPreviewCopy();
  const checklist = (data.features ?? []).map((f) => f.trim()).filter(Boolean);
  const custom = (data.customEquipment ?? []).map((f) => f.trim()).filter(Boolean);
  
  // Also parse legacy otherEquipmentDetails string into custom equipment if customEquipment is empty
  let legacyCustom: string[] = [];
  if (custom.length === 0 && data.otherEquipmentDetails) {
    legacyCustom = data.otherEquipmentDetails
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  
  const allCustom = [...custom, ...legacyCustom];
  const feats = [...checklist, ...allCustom];
  if (feats.length === 0) return null;

  const title = lang === "es" ? "Equipamiento y mejoras" : "Equipment and upgrades";
  const subtitle = lang === "es"
    ? "Equipamiento seleccionado por el vendedor"
    : "Equipment selected by the seller";

  const mobilePrimary = feats.slice(0, 6);
  const mobileRest = feats.slice(6);
  const moreLabel =
    lang === "es"
      ? `Ver todo el equipo (${mobileRest.length})`
      : `View all equipment (${mobileRest.length})`;

  // Separate checklist from custom for rendering custom upgrades in their own subsection
  const hasCustomUpgrades = allCustom.length > 0;

  return (
    <section className={CARD}>
      <p className={autosPreviewSectionEyebrowClass}>{lang === "es" ? "Equipamiento" : "Equipment"}</p>
      <h2 className={`mt-1 ${autosPreviewSectionTitleClass}`}>{title}</h2>
      <p className="mt-1 text-sm text-[color:var(--lx-muted)]">{subtitle}</p>
      
      {/* Selected equipment checklist */}
      {checklist.length > 0 && (
        <>
          <div className="mt-4 grid gap-3 sm:hidden">
            {checklist.map((f) => (
              <div key={f} className={autosPreviewRectEquipmentClass}>
                {iconForFeature(f)}
                <span className="break-words text-sm font-semibold leading-snug text-[#1F241C]">{f}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 hidden gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-3">
            {checklist.map((f) => (
              <div key={f} className={autosPreviewRectEquipmentClass}>
                {iconForFeature(f)}
                <span className="break-words text-sm font-semibold leading-snug text-[#1F241C]">{f}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Seller-added upgrades subsection */}
      {hasCustomUpgrades && (
        <div className={checklist.length > 0 ? "mt-6 border-t border-[color:var(--lx-nav-border)]/70 pt-5" : "mt-4"}>
          <h3 className="text-sm font-bold tracking-tight text-[color:var(--lx-text)]">
            {lang === "es" ? "Mejoras agregadas por el vendedor" : "Seller-added upgrades"}
          </h3>
          <div className="mt-3 grid gap-3 sm:hidden">
            {allCustom.map((f) => (
              <div key={f} className={autosPreviewRectEquipmentClass}>
                {iconForFeature(f)}
                <span className="break-words text-sm font-semibold leading-snug text-[#1F241C]">{f}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 hidden gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-3">
            {allCustom.map((f) => (
              <div key={f} className={autosPreviewRectEquipmentClass}>
                {iconForFeature(f)}
                <span className="break-words text-sm font-semibold leading-snug text-[#1F241C]">{f}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile "View more" for checklist only (custom upgrades are always shown) */}
      {checklist.length > 6 && (
        <details className="mt-3 sm:hidden">
          <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-center rounded-xl border border-[color:var(--lx-gold-border)] bg-[#FFFDF7] px-4 text-sm font-bold text-[color:var(--lx-text)] [&::-webkit-details-marker]:hidden">
            {moreLabel}
          </summary>
          <div className="mt-3 grid gap-3">
            {checklist.slice(6).map((f) => (
              <div key={f} className={autosPreviewRectEquipmentClass}>
                {iconForFeature(f)}
                <span className="break-words text-sm font-semibold leading-snug text-[#1F241C]">{f}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </section>
  );
}
