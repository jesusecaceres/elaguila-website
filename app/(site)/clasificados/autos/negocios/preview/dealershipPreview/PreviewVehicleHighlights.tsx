"use client";

import { BiCamera, BiCar, BiCheck, BiChip, BiNavigation, BiSun } from "react-icons/bi";
import { FiSmartphone, FiWind } from "react-icons/fi";
import { TbArmchair2, TbGauge, TbLayoutGrid } from "react-icons/tb";
import type { ReactNode } from "react";
import type { AutoDealerListing } from "../../types/autoDealerListing";
import { useAutosNegociosPreviewCopy } from "../../lib/AutosNegociosPreviewLocaleContext";
import {
  autosPreviewPremiumCardClass,
  autosPreviewRectEquipmentClass,
  autosPreviewSectionEyebrowClass,
  autosPreviewSectionTitleClass,
} from "./previewPremiumTokens";

const CARD = `${autosPreviewPremiumCardClass} p-5 sm:p-6`;

/**
 * Display-only Spanish relabeling for common dealer-entered equipment phrases (free text,
 * no fixed taxonomy exists upstream). Never mutates `data.features`/`data.customEquipment`;
 * unrecognized/custom text passes through unchanged.
 */
const EQUIPMENT_LABEL_ES: Record<string, string> = {
  "keyless entry": "Entrada sin llave",
  "fog lights": "Luces de niebla",
  "trailer hitch": "Enganche de remolque",
  "premium wheels": "Rines premium",
  "blind spot monitor": "Monitor de punto ciego",
  "adaptive cruise control": "Control crucero adaptativo",
  "backup camera": "Cámara de reversa",
  "rear camera": "Cámara de reversa",
  "heated seats": "Asientos calefactables",
  "leather steering wheel": "Volante de cuero",
  "sunroof": "Techo solar",
  "moonroof": "Quemacocos",
  "third row seating": "Tercera fila de asientos",
  "remote start": "Arranque remoto",
  "navigation system": "Sistema de navegación",
  "apple carplay": "Apple CarPlay",
  "android auto": "Android Auto",
};

function translateFeatureLabel(label: string, lang: "es" | "en"): string {
  if (lang !== "es") return label;
  const translated = EQUIPMENT_LABEL_ES[label.trim().toLowerCase()];
  return translated ?? label;
}

/** Avoids duplicate entries when translation collapses two dealer-entered variants (e.g. "Backup Camera" + "Rear Camera"). */
function dedupeLabels(labels: string[]): string[] {
  return labels.filter((label, idx, arr) => arr.findIndex((x) => x.toLowerCase() === label.toLowerCase()) === idx);
}

function iconForFeature(label: string): ReactNode {
  const t = label.toLowerCase();
  if (t.includes("carplay") || t.includes("android")) return <BiChip className="h-5 w-5 shrink-0 text-[#8A6B1F]" />;
  if (t.includes("cámara") || t.includes("camara") || t.includes("backup") || t.includes("parking"))
    return <BiCamera className="h-5 w-5 shrink-0 text-[#8A6B1F]" />;
  if (t.includes("punto ciego") || t.includes("blind")) return <FiWind className="h-5 w-5 shrink-0 text-[#8A6B1F]" />;
  if (t.includes("crucero") || t.includes("cruise")) return <TbGauge className="h-5 w-5 shrink-0 text-[#8A6B1F]" />;
  if (t.includes("techo") || t.includes("roof") || t.includes("panoramic")) return <BiSun className="h-5 w-5 shrink-0 text-[#8A6B1F]" />;
  if (t.includes("asientos") || t.includes("heated") || t.includes("seat") || t.includes("leather"))
    return <TbArmchair2 className="h-5 w-5 shrink-0 text-[#8A6B1F]" />;
  if (t.includes("navegación") || t.includes("navegacion") || t.includes("navigation"))
    return <BiNavigation className="h-5 w-5 shrink-0 text-[#8A6B1F]" />;
  if (t.includes("remote") || t.includes("arranque") || t.includes("bluetooth"))
    return <FiSmartphone className="h-5 w-5 shrink-0 text-[#8A6B1F]" />;
  if (t.includes("awd") || t.includes("4wd") || t.includes("4x4")) return <BiCar className="h-5 w-5 shrink-0 text-[#8A6B1F]" />;
  if (t.includes("tercera") || t.includes("third")) return <TbLayoutGrid className="h-5 w-5 shrink-0 text-[#8A6B1F]" />;
  return <BiCheck className="h-5 w-5 shrink-0 text-[#2F6B3A]" />;
}

function FeatureColumn({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  if (items.length === 0) return null;
  return (
    <div className="min-w-0">
      <h3 className="text-sm font-bold tracking-tight text-[#1F241C]">{title}</h3>
      <ul className="mt-3 grid gap-2.5">
        {items.map((f) => (
          <li key={f} className={autosPreviewRectEquipmentClass}>
            {iconForFeature(f)}
            <span className="break-words text-sm font-semibold leading-snug text-[#1F241C]">{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PreviewVehicleHighlights({ data }: { data: AutoDealerListing }) {
  const { t, lang } = useAutosNegociosPreviewCopy();
  const checklist = dedupeLabels(
    (data.features ?? []).map((f) => f.trim()).filter(Boolean).map((f) => translateFeatureLabel(f, lang)),
  );
  const custom = dedupeLabels(
    (data.customEquipment ?? []).map((f) => f.trim()).filter(Boolean).map((f) => translateFeatureLabel(f, lang)),
  );

  /** Split without inventing claims: checklist → key specs; custom → highlights; else bipartite split. */
  let keySpecs: string[] = [];
  let highlights: string[] = [];
  if (checklist.length > 0 && custom.length > 0) {
    keySpecs = checklist;
    highlights = custom;
  } else {
    const all = checklist.length > 0 ? checklist : custom;
    const mid = Math.ceil(all.length / 2);
    keySpecs = all.slice(0, mid);
    highlights = all.slice(mid);
  }

  if (keySpecs.length === 0 && highlights.length === 0) return null;

  const keyTitle = lang === "es" ? "Especificaciones clave" : "Key specifications";
  const hiTitle = lang === "es" ? "Características destacadas" : "Highlighted features";
  const moreLabel =
    lang === "es" ? "Ver todas las características" : "View all features";

  const mobileAll = [...keySpecs, ...highlights];
  const mobilePrimary = mobileAll.slice(0, 6);
  const mobileRest = mobileAll.slice(6);

  return (
    <section className={CARD}>
      <p className={autosPreviewSectionEyebrowClass}>{lang === "es" ? "Equipamiento" : "Equipment"}</p>
      <h2 className={`mt-1 ${autosPreviewSectionTitleClass}`}>{t.preview.highlights.title}</h2>
      <p className="mt-1 text-sm text-[#5C5346]">{t.preview.highlights.subtitle}</p>

      <div className="mt-4 grid gap-3 sm:hidden">
        {mobilePrimary.map((f) => (
          <div key={f} className={autosPreviewRectEquipmentClass}>
            {iconForFeature(f)}
            <span className="break-words text-sm font-semibold leading-snug text-[#1F241C]">{f}</span>
          </div>
        ))}
      </div>
      {mobileRest.length > 0 ? (
        <details className="mt-3 sm:hidden">
          <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-center rounded-[10px] border border-[#D6C7AD]/80 bg-[#FFFDF7] px-4 text-sm font-bold text-[#7A1E2C] [&::-webkit-details-marker]:hidden">
            {moreLabel} ({mobileRest.length})
          </summary>
          <div className="mt-3 grid gap-3">
            {mobileRest.map((f) => (
              <div key={f} className={autosPreviewRectEquipmentClass}>
                {iconForFeature(f)}
                <span className="break-words text-sm font-semibold leading-snug text-[#1F241C]">{f}</span>
              </div>
            ))}
          </div>
        </details>
      ) : null}

      <div className="mt-5 hidden gap-6 sm:grid sm:grid-cols-2">
        <FeatureColumn title={keyTitle} items={keySpecs} />
        <FeatureColumn title={hiTitle} items={highlights} />
      </div>
    </section>
  );
}
