/**
 * Central emoji/visual catalog for Servicios service chips (preset + custom labels).
 * Single source for public profile chips and publish preview — no network, no AI.
 */

import type {
  BusinessTypePreset,
  ChipDef,
  ServiciosInternalGroup,
} from "@/app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes";
import { BUSINESS_TYPE_PRESETS, getBusinessTypePreset } from "@/app/(site)/clasificados/publicar/servicios/lib/businessTypePresets";

export const SERVICIOS_SERVICE_VISUAL_DEFAULT_EMOJI = "🛠️";

export type ResolveServiciosServiceVisualInput = {
  id?: string;
  label?: string;
  businessTypeId?: string;
  internalGroup?: ServiciosInternalGroup;
};

export type ServiciosServiceVisualResolved = {
  emoji: string;
  visualGroup: string;
};

function normalizeHay(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

/** Strip draft prefixes like `svc_` */
export function normalizeServiciosServiceChipId(raw: string | undefined): string | undefined {
  if (!raw?.trim()) return undefined;
  const t = raw.trim();
  return t.startsWith("svc_") ? t.slice(4) : t;
}

function defaultEmojiForInternalGroup(g: ServiciosInternalGroup): string {
  switch (g) {
    case "automotive":
      return "🚗";
    case "health_beauty":
      return "💆";
    case "legal_professional":
      return "⚖️";
    case "education_tutoring":
      return "📚";
    case "events_entertainment":
      return "🎉";
    case "technology_support":
      return "💻";
    case "home_trade":
    case "miscellaneous":
    case "other":
    default:
      return SERVICIOS_SERVICE_VISUAL_DEFAULT_EMOJI;
  }
}

/**
 * Curated emoji per preset + chip (handles elec_* electrician vs electronics repair, etc.).
 */
export function emojiVisualGroupForPresetChip(
  preset: BusinessTypePreset,
  chip: ChipDef,
): ServiciosServiceVisualResolved {
  const vg = preset.internalGroup;
  const { id } = chip;
  const hay = normalizeHay(`${chip.es} ${chip.en}`);

  const pair = (emoji: string): ServiciosServiceVisualResolved => ({ emoji, visualGroup: vg });

  switch (preset.id) {
    case "plomeria":
      if (id === "plom_destape" || id === "plom_calentador") return pair("🚿");
      return pair("🔧");
    case "electricista":
      return pair("⚡");
    case "reparacion_electronicos":
      if (id === "elec_computadoras") return pair("💻");
      if (id === "elec_consolas") return pair("🎮");
      return pair("📱");
    case "carpinteria":
      return pair("🪚");
    case "carroceria_pintura":
      if (id === "carp_pintura") return pair("🎨");
      return pair("🚗");
    case "pintura":
      return pair("🎨");
    case "hvac_aire_acondicionado":
      return pair("❄️");
    case "fumigacion_control_plagas":
      return pair("🐜");
    case "jardineria_paisajismo":
      return pair("🌱");
    case "limpieza_hogares":
      return pair("🧹");
    case "peluqueria_barberia":
      return pair("✂️");
    case "unas_manicure":
      return pair("💅");
    case "spa_masajes":
      return pair("💆");
    case "grua_remolque":
      return pair("🚚");
    case "traduccion_documentos":
    case "traduccion_interpretacion":
      return pair("🌐");
    case "servicios_impresion":
      return pair("🖨️");
    case "desarrollo_web_apps":
      return pair("🧑‍💻");
    case "consultoria_negocios":
    case "consultoria_variada":
    case "servicio_otro_generico":
      if (/consult|asesor|advisor/i.test(hay)) return pair("💼");
      return pair(SERVICIOS_SERVICE_VISUAL_DEFAULT_EMOJI);
    default:
      break;
  }

  /* Prefix fallbacks when preset.id not specialized above */
  if (id.startsWith("mec_") || id.startsWith("llan_") || id.startsWith("aceite_") || id.startsWith("lav_"))
    return pair("🚗");
  if (id.startsWith("vid_") || id.startsWith("bat_") || id.startsWith("alin_") || id.startsWith("trans_"))
    return pair("🚗");
  if (id.startsWith("grua_")) return pair("🚚");
  if (id.startsWith("leg_") || id.startsWith("not_")) return pair("⚖️");
  if (id.startsWith("cont_") || id.startsWith("fisc_")) return pair("📄");
  if (id.startsWith("edu_") || id.startsWith("tutor_")) return pair("📚");
  if (id.startsWith("evt_") || id.startsWith("dj_") || id.startsWith("boda_")) return pair("🎧");
  if (id.startsWith("foto_") || id.startsWith("video_")) return pair("📸");
  if (id.startsWith("ti_") || id.startsWith("soft_") || id.startsWith("red_")) return pair("💻");
  if (id.startsWith("dev_") || id.startsWith("ux_")) return pair("🧑‍💻");
  if (id.startsWith("mud_") || id.startsWith("empaq_")) return pair("📦");
  if (id.startsWith("mens_") || id.startsWith("deliv_") || id.startsWith("domic_")) return pair("🛵");
  if (id.startsWith("nutri_") || id.startsWith("nutr_") || id.startsWith("diet_")) return pair("🥗");
  if (id.startsWith("fit_") || id.startsWith("gym_") || id.startsWith("entren_")) return pair("🏋️");
  if (id.startsWith("med_") || id.startsWith("fisio_") || id.startsWith("terap_")) return pair("🩺");
  if (id.startsWith("trad_")) return pair("🌐");
  if (id.startsWith("imp_")) return pair("🖨️");
  if (id.startsWith("remo_") || id.startsWith("repar_hogar")) return pair("🏗️");
  if (id.startsWith("fumi_")) return pair("🐜");
  if (id.startsWith("jard_")) return pair("🌱");
  if (id.startsWith("limp_")) return pair("🧹");
  if (id.startsWith("pint_")) return pair("🎨");
  if (id.startsWith("hvac_")) return pair("❄️");
  if (id.startsWith("pel_")) return pair("✂️");
  if (id.startsWith("spa_")) return pair("💆");
  if (id.startsWith("unas_")) return pair("💅");
  if (id.startsWith("plom_")) {
    if (id === "plom_destape" || id === "plom_calentador") return pair("🚿");
    return pair("🔧");
  }
  if (id.startsWith("elec_")) {
    if (preset.id === "electricista") return pair("⚡");
    return pair("📱");
  }
  if (id.startsWith("repar_")) return pair("🛠️");

  return {
    emoji: defaultEmojiForInternalGroup(vg),
    visualGroup: vg,
  };
}

/** Keyword rows: first match wins (normalized haystack). */
const LABEL_KEYWORD_RULES: { test: RegExp; emoji: string; visualGroup: string }[] = [
  { test: /iphone|android|celular|mobile phone|smartphone|tablet|pantalla rota/i, emoji: "📱", visualGroup: "technology_support" },
  { test: /computadora|laptop|pc |macbook|reparacion de pc/i, emoji: "💻", visualGroup: "technology_support" },
  { test: /limpieza|cleaning|oficina|janitorial|aseo/i, emoji: "🧹", visualGroup: "home_trade" },
  { test: /plomer|fugas|drenaje|fontan|water heater|calentador/i, emoji: "🔧", visualGroup: "home_trade" },
  { test: /electric|ilumin|lighting|cableado/i, emoji: "⚡", visualGroup: "home_trade" },
  { test: /hvac|aire acond|ac |calefacc|refriger/i, emoji: "❄️", visualGroup: "home_trade" },
  { test: /plaga|pest|fumig|insect|termita/i, emoji: "🐜", visualGroup: "home_trade" },
  { test: /jardin|paisaj|riego|landscap/i, emoji: "🌱", visualGroup: "home_trade" },
  { test: /pintur|painting/i, emoji: "🎨", visualGroup: "home_trade" },
  { test: /carpinter|mueble|wood|madera/i, emoji: "🪚", visualGroup: "home_trade" },
  { test: /mecan|automot|llanta|transmission|grua|towing|oil change/i, emoji: "🚗", visualGroup: "automotive" },
  { test: /barber|peluquer|corte de cabello|haircut|hair color/i, emoji: "✂️", visualGroup: "health_beauty" },
  { test: /manicur|pedicur|\bnails?\b|uñas|unas acril/i, emoji: "💅", visualGroup: "health_beauty" },
  { test: /spa |masaje|massage/i, emoji: "💆", visualGroup: "health_beauty" },
  { test: /medic|terapia|fisio|salud|clinic/i, emoji: "🩺", visualGroup: "health_beauty" },
  { test: /gym|fitness|entren|personal train/i, emoji: "🏋️", visualGroup: "health_beauty" },
  { test: /nutri|diet/i, emoji: "🥗", visualGroup: "health_beauty" },
  { test: /abogad|notar|legal |ley |attorney/i, emoji: "⚖️", visualGroup: "legal_professional" },
  { test: /contab|fiscal|impuesto|tax |nomina/i, emoji: "📄", visualGroup: "legal_professional" },
  { test: /tutor|clases|curso|education|school/i, emoji: "📚", visualGroup: "education_tutoring" },
  { test: /boda|fiesta|evento|dj |wedding|party/i, emoji: "🎉", visualGroup: "events_entertainment" },
  { test: /foto|video |film/i, emoji: "📸", visualGroup: "events_entertainment" },
  { test: /traduc|interpret|translation/i, emoji: "🌐", visualGroup: "miscellaneous" },
  { test: /impres|printing|grafic/i, emoji: "🖨️", visualGroup: "miscellaneous" },
  { test: /mudanz|moving|storage|almacen/i, emoji: "📦", visualGroup: "miscellaneous" },
  { test: /delivery|mensaj|domicilio/i, emoji: "🛵", visualGroup: "miscellaneous" },
  { test: /web |app |software|desarrollo|developer|it |redes|network/i, emoji: "💻", visualGroup: "technology_support" },
  { test: /consult|asesor/i, emoji: "💼", visualGroup: "miscellaneous" },
];

function matchKeywordEmoji(labelHay: string): ServiciosServiceVisualResolved | null {
  if (!labelHay.trim()) return null;
  for (const r of LABEL_KEYWORD_RULES) {
    if (r.test.test(labelHay)) return { emoji: r.emoji, visualGroup: r.visualGroup };
  }
  return null;
}

function presetsWithChipId(chipId: string): BusinessTypePreset[] {
  return BUSINESS_TYPE_PRESETS.filter((p) => p.suggestedServices.some((c) => c.id === chipId));
}

function disambiguateDuplicateChipId(
  chipId: string,
  labelHay: string,
  candidates: BusinessTypePreset[],
): BusinessTypePreset {
  if (candidates.length === 1) return candidates[0]!;
  if (chipId === "carp_reparacion") {
    if (/mueble|furniture|wood|carpinter|kitchen cabinet/i.test(labelHay)) {
      return candidates.find((p) => p.id === "carpinteria") ?? candidates[0]!;
    }
    if (/carrocer|body shop|abolladura|dent |automotive paint|auto paint/i.test(labelHay)) {
      return candidates.find((p) => p.id === "carroceria_pintura") ?? candidates[0]!;
    }
    return candidates[0]!;
  }
  if (chipId === "trad_certificada") {
    if (/simult|conference|interpretacion oral|consecutive/i.test(labelHay)) {
      return candidates.find((p) => p.id === "traduccion_interpretacion") ?? candidates[0]!;
    }
    return candidates.find((p) => p.id === "traduccion_documentos") ?? candidates[0]!;
  }
  return candidates[0]!;
}

/**
 * Resolve emoji + visual group for a service chip (preset id, custom label, or both).
 */
export function resolveServiciosServiceVisual(input: ResolveServiciosServiceVisualInput): ServiciosServiceVisualResolved {
  const normId = normalizeServiciosServiceChipId(input.id);
  const labelHay = normalizeHay(input.label ?? "");

  if (input.businessTypeId && normId) {
    const preset = getBusinessTypePreset(input.businessTypeId);
    const chip = preset?.suggestedServices.find((c) => c.id === normId);
    if (preset && chip) return emojiVisualGroupForPresetChip(preset, chip);
  }

  if (normId && normId !== "custom_service" && !normId.startsWith("custom_")) {
    const candidates = presetsWithChipId(normId);
    if (candidates.length >= 1) {
      const preset = disambiguateDuplicateChipId(normId, labelHay, candidates);
      const chip = preset.suggestedServices.find((c) => c.id === normId);
      if (chip) return emojiVisualGroupForPresetChip(preset, chip);
    }
  }

  const kw = matchKeywordEmoji(labelHay);
  if (kw) return kw;

  if (input.internalGroup) {
    return {
      emoji: defaultEmojiForInternalGroup(input.internalGroup),
      visualGroup: input.internalGroup,
    };
  }

  if (input.businessTypeId) {
    const preset = getBusinessTypePreset(input.businessTypeId);
    if (preset) {
      return {
        emoji: defaultEmojiForInternalGroup(preset.internalGroup),
        visualGroup: preset.internalGroup,
      };
    }
  }

  return { emoji: SERVICIOS_SERVICE_VISUAL_DEFAULT_EMOJI, visualGroup: "other" };
}
