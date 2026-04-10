/**
 * Single serialization path: preview VMs → `detail_pairs` for Supabase `listings` rows.
 * Preview and live share the same facts when publish uses this module.
 */

import type { BienesRaicesPrivadoPreviewVm } from "@/app/clasificados/bienes-raices/preview/privado/model/bienesRaicesPrivadoPreviewVm";
import type { BienesRaicesNegocioPreviewVm } from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/bienesRaicesNegocioPreviewVm";

function pushFact(out: Array<{ label: string; value: string }>, label: string, value: string) {
  const l = label.trim();
  const v = value.trim();
  if (!l || !v) return;
  out.push({ label: l, value: v });
}

/** BR / Rentas privado preview VM → detail pair rows (human labels, Spanish). */
export function buildDetailPairsFromBienesRaicesPrivadoPreviewVm(vm: BienesRaicesPrivadoPreviewVm): Array<{ label: string; value: string }> {
  const out: Array<{ label: string; value: string }> = [];
  pushFact(out, "Operación", vm.operationSummary);
  pushFact(out, "Estado del anuncio", vm.listingStatusLabel);
  if (vm.location?.hasMeaningfulAddress) {
    const locLine = [vm.location.line1, vm.location.cityStateZip].filter((x) => String(x ?? "").trim()).join(" · ");
    pushFact(out, "Ubicación", locLine || vm.addressLine);
  } else {
    pushFact(out, "Ubicación", vm.addressLine);
  }
  if (vm.location?.mapsUrl) pushFact(out, "Mapa / enlace", vm.location.mapsUrl);
  for (const q of vm.quickFacts ?? []) {
    pushFact(out, q.label, q.value);
  }
  for (const r of vm.propertyDetailsRows ?? []) {
    pushFact(out, r.label, r.value);
  }
  for (const r of vm.highlightsRows ?? []) {
    pushFact(out, r.label, r.value);
  }
  return out;
}

/** BR / Rentas negocio preview VM → detail pair rows (includes deep clusters as scannable lines). */
export function buildDetailPairsFromBienesRaicesNegocioPreviewVm(vm: BienesRaicesNegocioPreviewVm): Array<{ label: string; value: string }> {
  const out: Array<{ label: string; value: string }> = [];
  pushFact(out, "Operación", vm.operationSummary);
  pushFact(out, "Estado", vm.listingStatusLabel);
  pushFact(out, "Dirección", vm.location?.fullAddress?.trim() || vm.addressLine);
  if (vm.location?.mapsUrl) pushFact(out, "Mapa / enlace", vm.location.mapsUrl);
  for (const q of vm.quickFacts ?? []) {
    pushFact(out, q.label, q.value);
  }
  for (const r of vm.propertyDetailsRows ?? []) {
    pushFact(out, r.label, r.value);
  }
  for (const r of vm.highlightsRows ?? []) {
    pushFact(out, r.label, r.value);
  }
  const pushModule = (title: string, rows: Array<{ label: string; value: string }>) => {
    for (const r of rows) {
      pushFact(out, `${title}: ${r.label}`, r.value);
    }
  };
  if (vm.schools?.showModule) pushModule("Escuelas", vm.schools.rows);
  if (vm.community?.showModule) pushModule("Comunidad", vm.community.rows);
  if (vm.hoaDevelopment?.showModule) pushModule("HOA / desarrollo", vm.hoaDevelopment.rows);
  for (const cl of vm.detailClusters ?? []) {
    for (const b of cl.blocks ?? []) {
      if (!b.hasContent || !b.bullets?.length) continue;
      pushFact(out, `${cl.title} — ${b.heading}`, b.bullets.join("; "));
    }
  }
  for (const d of vm.deepBlocks ?? []) {
    if (!d.hasContent || !d.bullets?.length) continue;
    pushFact(out, d.heading, d.bullets.join("; "));
  }
  return out;
}
