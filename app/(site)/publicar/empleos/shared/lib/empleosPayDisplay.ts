/** Structured pay fields + legacy string normalization for Empleos quick lane. */

export type EmpleosPayUnit =
  | ""
  | "por-hora"
  | "por-dia"
  | "por-semana"
  | "por-mes"
  | "por-anio"
  | "por-proyecto"
  | "por-contrato"
  | "a-comision"
  | "propinas"
  | "a-convenir"
  | "otro";

export const EMPLEOS_PAY_UNIT_OPTIONS_ES: readonly { value: EmpleosPayUnit; label: string }[] = [
  { value: "", label: "Seleccionar tipo…" },
  { value: "por-hora", label: "Por hora" },
  { value: "por-dia", label: "Por día" },
  { value: "por-semana", label: "Por semana" },
  { value: "por-mes", label: "Por mes" },
  { value: "por-anio", label: "Por año" },
  { value: "por-proyecto", label: "Por proyecto" },
  { value: "por-contrato", label: "Por contrato" },
  { value: "a-comision", label: "A comisión" },
  { value: "propinas", label: "Propinas" },
  { value: "a-convenir", label: "A convenir" },
  { value: "otro", label: "Otro" },
];

export const EMPLEOS_PAY_UNIT_OPTIONS_EN: readonly { value: EmpleosPayUnit; label: string }[] = [
  { value: "", label: "Select type…" },
  { value: "por-hora", label: "Per hour" },
  { value: "por-dia", label: "Per day" },
  { value: "por-semana", label: "Per week" },
  { value: "por-mes", label: "Per month" },
  { value: "por-anio", label: "Per year" },
  { value: "por-proyecto", label: "Per project" },
  { value: "por-contrato", label: "Per contract" },
  { value: "a-comision", label: "Commission" },
  { value: "propinas", label: "Tips" },
  { value: "a-convenir", label: "Negotiable" },
  { value: "otro", label: "Other" },
];

const UNIT_LABEL_ES: Record<Exclude<EmpleosPayUnit, "">, string> = {
  "por-hora": "por hora",
  "por-dia": "por día",
  "por-semana": "por semana",
  "por-mes": "por mes",
  "por-anio": "por año",
  "por-proyecto": "por proyecto",
  "por-contrato": "por contrato",
  "a-comision": "a comisión",
  propinas: "propinas",
  "a-convenir": "A convenir",
  otro: "",
};

const UNIT_ALIASES: Record<string, EmpleosPayUnit> = {
  hora: "por-hora",
  hr: "por-hora",
  hour: "por-hora",
  dia: "por-dia",
  day: "por-dia",
  semana: "por-semana",
  week: "por-semana",
  mes: "por-mes",
  month: "por-mes",
  ano: "por-anio",
  año: "por-anio",
  year: "por-anio",
  proyecto: "por-proyecto",
  contrato: "por-contrato",
  comision: "a-comision",
  comisión: "a-comision",
  propina: "propinas",
  tips: "propinas",
  convenir: "a-convenir",
  doe: "a-convenir",
};

function st(v: unknown): string {
  return String(v ?? "").trim();
}

export function normalizePayUnit(raw: unknown): EmpleosPayUnit {
  const v = st(raw).toLowerCase();
  if (!v) return "";
  const slugs: EmpleosPayUnit[] = [
    "por-hora", "por-dia", "por-semana", "por-mes", "por-anio",
    "por-proyecto", "por-contrato", "a-comision", "propinas", "a-convenir", "otro",
  ];
  if (slugs.includes(v as EmpleosPayUnit)) return v as EmpleosPayUnit;
  for (const [key, slug] of Object.entries(UNIT_ALIASES)) {
    if (v.includes(key)) return slug;
  }
  return "";
}

/** Format bare numeric amount or range with $ — skip for non-numeric phrases. */
export function formatPayAmount(raw: string): string {
  const s = raw.trim();
  if (!s) return "";
  const lower = s.toLowerCase();
  if (lower === "a convenir" || lower === "negotiable" || lower === "doe") return "A convenir";
  const fixed = s.replace(/\$\s+/g, "$");
  if (/^\$/.test(fixed)) return fixed.replace(/\$\s+/g, "$");
  if (/^\d+(\.\d+)?$/.test(fixed)) return `$${fixed}`;
  const rangeMatch = fixed.match(/^(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)(.*)$/);
  if (rangeMatch) {
    const [, lo, hi, rest] = rangeMatch;
    return `$${lo}–$${hi}${rest ?? ""}`;
  }
  const rangeWithDollar = fixed.match(/^\$(\d+(?:\.\d+)?)\s*[-–]\s*\$?(\d+(?:\.\d+)?)(.*)$/);
  if (rangeWithDollar) {
    const [, lo, hi, rest] = rangeWithDollar;
    return `$${lo}–$${hi}${rest ?? ""}`;
  }
  return fixed;
}

function payUnitLabel(unit: EmpleosPayUnit, custom: string, lang: "es" | "en"): string {
  if (!unit) return "";
  if (unit === "otro") return custom.trim();
  if (unit === "a-convenir") return lang === "es" ? "A convenir" : "Negotiable";
  const es = UNIT_LABEL_ES[unit];
  if (lang === "en") {
    const enMap: Partial<Record<EmpleosPayUnit, string>> = {
      "por-hora": "per hour",
      "por-dia": "per day",
      "por-semana": "per week",
      "por-mes": "per month",
      "por-anio": "per year",
      "por-proyecto": "per project",
      "por-contrato": "per contract",
      "a-comision": "commission",
      propinas: "tips",
    };
    return enMap[unit] ?? es;
  }
  return es;
}

export function composePayFromFields(
  amount: string,
  unit: EmpleosPayUnit,
  unitCustom: string,
  note: string,
  lang: "es" | "en" = "es",
): string {
  const amtRaw = st(amount);
  const noteStr = st(note);
  const unitLabel = payUnitLabel(unit, unitCustom, lang);

  if (unit === "a-convenir" && !amtRaw) return lang === "es" ? "A convenir" : "Negotiable";
  if (amtRaw.toLowerCase() === "a convenir" || amtRaw.toLowerCase() === "negotiable") {
    return lang === "es" ? "A convenir" : "Negotiable";
  }

  const formattedAmt = formatPayAmount(amtRaw);
  const skipDollarUnits = unit === "a-comision" || unit === "propinas";

  let base = "";
  if (formattedAmt === "A convenir") {
    base = formattedAmt;
  } else if (formattedAmt && unitLabel && !skipDollarUnits) {
    base = `${formattedAmt} ${unitLabel}`;
  } else if (formattedAmt && unitLabel && skipDollarUnits) {
    base = unit === "propinas" && formattedAmt.startsWith("$")
      ? `${formattedAmt} · ${unitLabel}`
      : `${formattedAmt} ${unitLabel}`;
  } else if (formattedAmt) {
    base = formattedAmt;
  } else if (unitLabel) {
    base = unitLabel.charAt(0).toUpperCase() + unitLabel.slice(1);
  }

  if (!base) return "—";
  if (noteStr) return `${base}${noteStr.startsWith("(") ? ` ${noteStr}` : ` (${noteStr})`}`;
  return base;
}

/** Parse legacy pay strings like "$20/hora", "$18 - $25 por hora". */
export function parseLegacyPayString(pay: string): {
  payAmount: string;
  payUnit: EmpleosPayUnit;
  payUnitCustom: string;
  payNote: string;
} {
  const raw = st(pay);
  if (!raw || raw === "—") return { payAmount: "", payUnit: "", payUnitCustom: "", payNote: "" };

  const lower = raw.toLowerCase();
  if (lower === "a convenir" || lower.includes("negotiable") || lower === "doe") {
    return { payAmount: "", payUnit: "a-convenir", payUnitCustom: "", payNote: "" };
  }

  let unit: EmpleosPayUnit = "";
  let unitCustom = "";
  let amountPart = raw;

  for (const [key, slug] of Object.entries(UNIT_ALIASES)) {
    const re = new RegExp(`\\b(por\\s+)?${key}\\b`, "i");
    if (re.test(lower)) {
      unit = slug;
      amountPart = raw.replace(re, "").replace(/\//g, " ").trim();
      break;
    }
  }

  if (!unit) {
    const porMatch = lower.match(/\bpor\s+([a-záéíóúñ]+)/i);
    if (porMatch) {
      unit = normalizePayUnit(porMatch[1]!) || "otro";
      if (unit === "otro") unitCustom = porMatch[1]!;
      amountPart = raw.slice(0, porMatch.index).trim();
    }
  }

  const slashMatch = raw.match(/^(.+?)\s*[\/\\]\s*(.+)$/);
  if (slashMatch && !unit) {
    amountPart = slashMatch[1]!.trim();
    const tail = slashMatch[2]!.trim().toLowerCase();
    unit = normalizePayUnit(tail) || (tail ? "otro" : "");
    if (unit === "otro") unitCustom = slashMatch[2]!.trim();
  }

  const noteMatch = amountPart.match(/^(.+?)\s*(\([^)]+\))\s*$/);
  let payNote = "";
  if (noteMatch) {
    amountPart = noteMatch[1]!.trim();
    payNote = noteMatch[2]!.replace(/^\(|\)$/g, "").trim();
  }

  return {
    payAmount: amountPart.replace(/^\$+/, "").replace(/\s+/g, " ").trim() || amountPart.trim(),
    payUnit: unit,
    payUnitCustom: unitCustom,
    payNote,
  };
}

export type PayDisplayInput = {
  pay?: string;
  payAmount?: string;
  payUnit?: string;
  payUnitCustom?: string;
  payNote?: string;
};

/** Primary display helper — prefers structured fields, falls back to legacy pay string. */
export function normalizePayDisplay(input: PayDisplayInput, lang: "es" | "en" = "es"): string {
  const amount = st(input.payAmount);
  const unit = normalizePayUnit(input.payUnit);
  const unitCustom = st(input.payUnitCustom);
  const note = st(input.payNote);
  const legacy = st(input.pay);

  if (amount || unit) {
    return composePayFromFields(amount, unit, unitCustom, note, lang);
  }

  if (!legacy || legacy === "—") return "—";

  const parsed = parseLegacyPayString(legacy);
  if (parsed.payUnit || parsed.payAmount) {
    const composed = composePayFromFields(
      parsed.payAmount || legacy,
      parsed.payUnit,
      parsed.payUnitCustom,
      parsed.payNote,
      lang,
    );
    if (composed !== "—") return composed;
  }

  return formatPayAmount(legacy);
}

/** Sync legacy `pay` field from structured inputs for publish compatibility. */
export function syncLegacyPayField(input: PayDisplayInput, lang: "es" | "en" = "es"): string {
  const composed = normalizePayDisplay(input, lang);
  return composed === "—" ? st(input.pay) : composed;
}
