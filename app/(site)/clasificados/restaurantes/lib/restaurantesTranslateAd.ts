import { pickTranslatableAdFields } from "@/app/lib/translation/helpers";
import type { Locale, TranslatableAdFields } from "@/app/lib/translation/types";
import type { RestaurantDetailShellData } from "@/app/clasificados/restaurantes/shell/restaurantDetailShellTypes";

const STACK_LINE_RE = /^(\d+)\t([^\t]*)\t(.*)$/;
const MENU_LINE_RE = /^(\d+)\t(.*)$/;

const EXCLUDED_STACK_LABEL_RE =
  /phone|teléfono|telefono|email|correo|whatsapp|precio|price|url|website|sitio|address|dirección|direccion|mapa|horario|hours|reserva|order|menú|menu/i;

function isProseStackRow(label: string, value: string): boolean {
  const l = label.trim();
  const v = value.trim();
  if (!v) return false;
  if (EXCLUDED_STACK_LABEL_RE.test(l)) return false;
  if (/^https?:\/\/|mailto:|tel:|wa\.me/i.test(v)) return false;
  if (/^\+?\d[\d\s().-]{7,}$/.test(v)) return false;
  return true;
}

function encodeMenuSupportingLines(
  items: NonNullable<RestaurantDetailShellData["menuHighlights"]>,
): string | undefined {
  const lines = items
    .map((item, i) => {
      const line = item.supportingLine?.trim();
      if (!line) return null;
      return `${i}\t${line}`;
    })
    .filter((line): line is string => Boolean(line));
  return lines.length ? lines.join("\n") : undefined;
}

function decodeMenuSupportingLines(
  encoded: string,
  original: NonNullable<RestaurantDetailShellData["menuHighlights"]>,
): NonNullable<RestaurantDetailShellData["menuHighlights"]> {
  const byIndex = new Map<number, string>();
  for (const line of encoded.split("\n")) {
    const trimmed = line.trimEnd();
    if (!trimmed) continue;
    const match = MENU_LINE_RE.exec(trimmed);
    if (!match) continue;
    const index = Number(match[1]);
    if (!Number.isFinite(index) || index < 0) continue;
    byIndex.set(index, match[2]);
  }
  return original.map((item, index) => {
    const next = byIndex.get(index);
    if (!next?.trim()) return item;
    return { ...item, supportingLine: next.trim() };
  });
}

function encodeStackSections(
  sections: NonNullable<RestaurantDetailShellData["stackSections"]>,
): string | undefined {
  const lines: string[] = [];
  let offset = 0;
  for (const section of sections) {
    for (const row of section.rows) {
      if (!isProseStackRow(row.label, row.value)) continue;
      lines.push(`${offset}\t${row.label.trim()}\t${row.value.trim()}`);
      offset += 1;
    }
  }
  return lines.length ? lines.join("\n") : undefined;
}

function decodeStackSections(
  encoded: string,
  original: NonNullable<RestaurantDetailShellData["stackSections"]>,
): NonNullable<RestaurantDetailShellData["stackSections"]> {
  const flat: Array<{ sectionIndex: number; rowIndex: number; label: string; value: string }> = [];
  original.forEach((section, sectionIndex) => {
    section.rows.forEach((row, rowIndex) => {
      if (isProseStackRow(row.label, row.value)) {
        flat.push({ sectionIndex, rowIndex, label: row.label, value: row.value });
      }
    });
  });

  const byIndex = new Map<number, { label: string; value: string }>();
  for (const line of encoded.split("\n")) {
    const trimmed = line.trimEnd();
    if (!trimmed) continue;
    const match = STACK_LINE_RE.exec(trimmed);
    if (!match) continue;
    const index = Number(match[1]);
    if (!Number.isFinite(index) || index < 0) continue;
    byIndex.set(index, { label: match[2], value: match[3] });
  }

  return original.map((section, sectionIndex) => ({
    ...section,
    rows: section.rows.map((row, rowIndex) => {
      const flatIndex = flat.findIndex((f) => f.sectionIndex === sectionIndex && f.rowIndex === rowIndex);
      if (flatIndex < 0) return row;
      const translated = byIndex.get(flatIndex);
      if (!translated) return row;
      return {
        label: translated.label.trim() || row.label,
        value: translated.value.trim() || row.value,
      };
    }),
  }));
}

/** Restaurant story prose only — business name, contact, hours grid, prices, and CTA hrefs stay out. */
export function buildRestaurantesTranslatableContent(
  data: RestaurantDetailShellData,
): TranslatableAdFields {
  const notes = [
    data.hoursDetail?.specialNote?.trim(),
    data.hoursDetail?.temporaryNote?.trim(),
  ].filter(Boolean);

  return {
    description: data.aboutBody?.trim() || undefined,
    details: encodeMenuSupportingLines(data.menuHighlights ?? []),
    highlights: notes.length ? notes.join("\n") : undefined,
    shareText: data.trustLight?.summaryLine?.trim() || undefined,
    customServiceText: encodeStackSections(data.stackSections ?? []),
  };
}

export function hasRestaurantesTranslatableProse(content: unknown): boolean {
  return Object.keys(pickTranslatableAdFields(content)).length > 0;
}

export function shouldOfferRestaurantesTranslateAd(
  siteLocale: Locale,
  translatableContent: unknown,
): boolean {
  if (!hasRestaurantesTranslatableProse(translatableContent)) return false;
  return siteLocale === "es" || siteLocale === "en";
}

export function applyRestaurantesTranslation(
  data: RestaurantDetailShellData,
  translated: Partial<TranslatableAdFields>,
): RestaurantDetailShellData {
  let next: RestaurantDetailShellData = data;

  if (translated.description?.trim()) {
    next = { ...next, aboutBody: translated.description.trim() };
  }

  if (translated.details?.trim() && data.menuHighlights?.length) {
    next = {
      ...next,
      menuHighlights: decodeMenuSupportingLines(translated.details, data.menuHighlights),
    };
  }

  if (translated.highlights?.trim() && data.hoursDetail) {
    const [special, temporary] = translated.highlights.split("\n");
    next = {
      ...next,
      hoursDetail: {
        ...data.hoursDetail,
        specialNote: special?.trim() || data.hoursDetail.specialNote,
        temporaryNote: temporary?.trim() || data.hoursDetail.temporaryNote,
      },
    };
  }

  if (translated.shareText?.trim() && data.trustLight) {
    next = {
      ...next,
      trustLight: { ...data.trustLight, summaryLine: translated.shareText.trim() },
    };
  }

  if (translated.customServiceText?.trim() && data.stackSections?.length) {
    next = {
      ...next,
      stackSections: decodeStackSections(translated.customServiceText, data.stackSections),
    };
  }

  return next;
}
