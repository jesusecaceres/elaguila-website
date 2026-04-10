import type {
  BilingualPatch,
  ClasificadosCategoryDetailOnlyPatch,
  ClasificadosDetailFieldCopyPatch,
} from "@/app/lib/clasificados/clasificadosCategoryContentTypes";
import { DETAIL_FIELDS, type DetailField } from "@/app/clasificados/config/publishDetailFields";

function str(f: FormData, k: string): string {
  const v = f.get(k);
  return typeof v === "string" ? v.trim() : "";
}

function bp(es: string, en: string): BilingualPatch | undefined {
  if (!es && !en) return undefined;
  return { es: es || undefined, en: en || undefined };
}

/** Detail-field rows + optional staff notes — same field names as En Venta admin (`df_*`, `staff_mod_*`). */
export function buildDetailFieldsCategoryPatchFromForm(
  rows: DetailField[],
  prev: ClasificadosCategoryDetailOnlyPatch | null | undefined,
  f: FormData
): ClasificadosCategoryDetailOnlyPatch {
  const p = prev ?? {};
  const detailFields: Record<string, ClasificadosDetailFieldCopyPatch> = { ...p.detailFields };

  for (const row of rows) {
    const key = row.key;
    const prevRow = p.detailFields?.[key] ?? {};
    const nextRow: ClasificadosDetailFieldCopyPatch = { ...prevRow };

    const label = bp(str(f, `df_${key}_label_es`), str(f, `df_${key}_label_en`));
    const placeholder = bp(str(f, `df_${key}_ph_es`), str(f, `df_${key}_ph_en`));
    const help = bp(str(f, `df_${key}_help_es`), str(f, `df_${key}_help_en`));

    if (!label) delete nextRow.label;
    else nextRow.label = label;
    if (!placeholder) delete nextRow.placeholder;
    else nextRow.placeholder = placeholder;
    if (!help) delete nextRow.help;
    else nextRow.help = help;

    if (!nextRow.label && !nextRow.placeholder && !nextRow.help) delete detailFields[key];
    else detailFields[key] = nextRow;
  }

  const staffEs = str(f, "staff_mod_es");
  const staffEn = str(f, "staff_mod_en");
  const staffModerationNotes = bp(staffEs, staffEn);

  const out: { detailFields?: Record<string, ClasificadosDetailFieldCopyPatch>; staffModerationNotes?: BilingualPatch } = {};
  if (Object.keys(detailFields).length) out.detailFields = detailFields;
  if (staffModerationNotes) out.staffModerationNotes = staffModerationNotes;
  return out;
}

export function parseDetailOnlyCategorySlug(raw: string): string | null {
  const s = decodeURIComponent(raw).trim().toLowerCase();
  if (!s || s === "en-venta") return null;
  return s;
}
