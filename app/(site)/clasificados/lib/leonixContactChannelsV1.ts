/**
 * Leonix Gate 12C — persisted contact channel preferences + social URLs (detail_pairs machine row).
 * Category-agnostic JSON payload; used by Rentas + Bienes Raíces privado/negocio.
 */

import { readLeonixDetailPairValue } from "@/app/clasificados/lib/leonixRealEstateListingContract";
import {
  normalizeLeonixFacebookUrl,
  normalizeLeonixInstagramUrl,
  normalizeLeonixTiktokUrl,
  normalizeLeonixWebsiteUrl,
  normalizeLeonixYoutubeUrl,
} from "@/app/clasificados/lib/leonixContactSocialNormalize";

export const LEONIX_DP_CONTACT_CHANNELS_V1 = "Leonix:contact_channels_v1" as const;

export type LeonixPreferredContact = "" | "phone" | "email" | "whatsapp" | "sms" | "website";

/** Raw form slice (strings + si/no), before normalization. */
export type LeonixContactChannelsFormSlice = {
  masInformacionUrl: string;
  instagram: string;
  facebook: string;
  youtube: string;
  tiktok: string;
  permitirLlamadas: "" | "si" | "no";
  permitirSms: "" | "si" | "no";
  whatsappActivo: "" | "si" | "no";
  contactoPreferido: LeonixPreferredContact;
};

export function createEmptyLeonixContactChannelsFormSlice(): LeonixContactChannelsFormSlice {
  return {
    masInformacionUrl: "",
    instagram: "",
    facebook: "",
    youtube: "",
    tiktok: "",
    permitirLlamadas: "si",
    permitirSms: "si",
    whatsappActivo: "si",
    contactoPreferido: "",
  };
}

export type LeonixContactChannelsV1Payload = {
  v: 1;
  allowCall: boolean;
  allowSms: boolean;
  whatsappEnabled: boolean;
  preferred: LeonixPreferredContact;
  instructions?: string;
  website?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  youtube?: string | null;
  tiktok?: string | null;
};

function siNoToBool(v: "" | "si" | "no", defaultTrue: boolean): boolean {
  if (v === "no") return false;
  if (v === "si") return true;
  return defaultTrue;
}

export function buildLeonixContactChannelsV1PayloadFromFormSlice(
  slice: LeonixContactChannelsFormSlice,
  opts?: { fallbackWebsite?: string; instructionsNote?: string },
): LeonixContactChannelsV1Payload | null {
  const website =
    normalizeLeonixWebsiteUrl(slice.masInformacionUrl) ??
    normalizeLeonixWebsiteUrl(opts?.fallbackWebsite ?? "") ??
    null;
  const instagram = normalizeLeonixInstagramUrl(slice.instagram);
  const facebook = normalizeLeonixFacebookUrl(slice.facebook);
  const youtube = normalizeLeonixYoutubeUrl(slice.youtube);
  const tiktok = normalizeLeonixTiktokUrl(slice.tiktok);
  const instructions = String(opts?.instructionsNote ?? "").trim() || undefined;
  const preferred = (slice.contactoPreferido ?? "") as LeonixPreferredContact;

  const allowCall = siNoToBool(slice.permitirLlamadas, true);
  const allowSms = siNoToBool(slice.permitirSms, true);
  const whatsappEnabled = siNoToBool(slice.whatsappActivo, true);

  const hasAny =
    website ||
    instagram ||
    facebook ||
    youtube ||
    tiktok ||
    instructions ||
    preferred ||
    !allowCall ||
    !allowSms ||
    !whatsappEnabled;

  if (!hasAny) return null;

  return {
    v: 1,
    allowCall,
    allowSms,
    whatsappEnabled,
    preferred: preferred || "",
    instructions,
    website,
    instagram,
    facebook,
    youtube,
    tiktok,
  };
}

export function serializeLeonixContactChannelsV1Payload(payload: LeonixContactChannelsV1Payload): string {
  return JSON.stringify(payload);
}

export function parseLeonixContactChannelsV1FromDetailPairs(detailPairs: unknown): LeonixContactChannelsV1Payload | null {
  const raw = readLeonixDetailPairValue(detailPairs, LEONIX_DP_CONTACT_CHANNELS_V1);
  if (!raw?.trim()) return null;
  try {
    const o = JSON.parse(raw) as unknown;
    if (!o || typeof o !== "object" || Array.isArray(o)) return null;
    const rec = o as Record<string, unknown>;
    if (rec.v !== 1) return null;
    const allowCall = rec.allowCall === false ? false : true;
    const allowSms = rec.allowSms === false ? false : true;
    const whatsappEnabled = rec.whatsappEnabled === false ? false : true;
    const preferred = typeof rec.preferred === "string" ? (rec.preferred as LeonixPreferredContact) : "";
    const instructions = typeof rec.instructions === "string" ? rec.instructions.trim() || undefined : undefined;
    const website = typeof rec.website === "string" ? normalizeLeonixWebsiteUrl(rec.website) : null;
    const instagram = typeof rec.instagram === "string" ? normalizeLeonixInstagramUrl(rec.instagram) : null;
    const facebook = typeof rec.facebook === "string" ? normalizeLeonixFacebookUrl(rec.facebook) : null;
    const youtube = typeof rec.youtube === "string" ? normalizeLeonixYoutubeUrl(rec.youtube) : null;
    const tiktok = typeof rec.tiktok === "string" ? normalizeLeonixTiktokUrl(rec.tiktok) : null;

    return {
      v: 1,
      allowCall,
      allowSms,
      whatsappEnabled,
      preferred: preferred || "",
      instructions,
      website,
      instagram,
      facebook,
      youtube,
      tiktok,
    };
  } catch {
    return null;
  }
}

export type LeonixPublicSocialLink = { kind: "instagram" | "facebook" | "youtube" | "tiktok"; href: string };

export function socialLinksFromChannelsPayload(ch: LeonixContactChannelsV1Payload | null): LeonixPublicSocialLink[] {
  if (!ch) return [];
  const out: LeonixPublicSocialLink[] = [];
  if (ch.instagram) out.push({ kind: "instagram", href: ch.instagram });
  if (ch.facebook) out.push({ kind: "facebook", href: ch.facebook });
  if (ch.youtube) out.push({ kind: "youtube", href: ch.youtube });
  if (ch.tiktok) out.push({ kind: "tiktok", href: ch.tiktok });
  return out;
}

export function mergePartialLeonixContactChannelsFormSlice(
  base: LeonixContactChannelsFormSlice,
  partial?: Partial<LeonixContactChannelsFormSlice> | null,
): LeonixContactChannelsFormSlice {
  if (!partial) return base;
  return {
    ...base,
    ...partial,
    masInformacionUrl: typeof partial.masInformacionUrl === "string" ? partial.masInformacionUrl : base.masInformacionUrl,
    instagram: typeof partial.instagram === "string" ? partial.instagram : base.instagram,
    facebook: typeof partial.facebook === "string" ? partial.facebook : base.facebook,
    youtube: typeof partial.youtube === "string" ? partial.youtube : base.youtube,
    tiktok: typeof partial.tiktok === "string" ? partial.tiktok : base.tiktok,
    permitirLlamadas: partial.permitirLlamadas === "si" || partial.permitirLlamadas === "no" ? partial.permitirLlamadas : base.permitirLlamadas,
    permitirSms: partial.permitirSms === "si" || partial.permitirSms === "no" ? partial.permitirSms : base.permitirSms,
    whatsappActivo: partial.whatsappActivo === "si" || partial.whatsappActivo === "no" ? partial.whatsappActivo : base.whatsappActivo,
    contactoPreferido:
      partial.contactoPreferido !== undefined && partial.contactoPreferido !== null
        ? (partial.contactoPreferido as LeonixPreferredContact)
        : base.contactoPreferido,
  };
}

/**
 * Fills social/website from `business_meta` when Gate 12C machine row is absent (backward compat with legacy negocioRedes / sitioWeb).
 */
export function enrichContactChannelsFromBusinessMeta(
  channels: LeonixContactChannelsV1Payload | null,
  meta: Record<string, string> | null,
): LeonixContactChannelsV1Payload | null {
  if (!meta) return channels;
  const websiteMeta = normalizeLeonixWebsiteUrl(meta.negocioSitioWeb ?? "");
  const ig = normalizeLeonixInstagramUrl(meta.negocioInstagram ?? "");
  const fb = normalizeLeonixFacebookUrl(meta.negocioFacebook ?? "");
  const yt = normalizeLeonixYoutubeUrl(meta.negocioYoutube ?? "");
  const tt = normalizeLeonixTiktokUrl(meta.negocioTiktok ?? "");
  const prefs = {
    allowCall: meta.negocioPermiteLlamadas === "no" ? false : true,
    allowSms: meta.negocioPermiteSms === "no" ? false : true,
    whatsappEnabled: meta.negocioWhatsappActivo === "no" ? false : true,
    preferred: (meta.negocioContactoPreferido ?? "") as LeonixPreferredContact,
  };
  if (!channels && !websiteMeta && !ig && !fb && !yt && !tt && !meta.negocioPermiteLlamadas && !meta.negocioPermiteSms && !meta.negocioWhatsappActivo) {
    return null;
  }
  const base: LeonixContactChannelsV1Payload =
    channels ??
    ({
      v: 1,
      allowCall: true,
      allowSms: true,
      whatsappEnabled: true,
      preferred: "",
    } as LeonixContactChannelsV1Payload);
  return {
    ...base,
    allowCall: channels ? base.allowCall : prefs.allowCall,
    allowSms: channels ? base.allowSms : prefs.allowSms,
    whatsappEnabled: channels ? base.whatsappEnabled : prefs.whatsappEnabled,
    preferred: base.preferred || prefs.preferred || "",
    website: base.website ?? websiteMeta,
    instagram: base.instagram ?? ig,
    facebook: base.facebook ?? fb,
    youtube: base.youtube ?? yt,
    tiktok: base.tiktok ?? tt,
  };
}

/** Merges normalized Gate 12C keys into an existing `business_meta` JSON string (Rentas negocio publish). */
export function mergeBusinessMetaJsonWithGate12cOverlay(
  existingJson: string | null | undefined,
  overlay: Record<string, string>,
): string | null {
  if (!Object.keys(overlay).length) {
    if (existingJson && String(existingJson).trim()) return String(existingJson).trim();
    return null;
  }
  const o: Record<string, string> = {};
  if (existingJson && String(existingJson).trim()) {
    try {
      const p = JSON.parse(String(existingJson)) as Record<string, unknown>;
      for (const [k, v] of Object.entries(p)) {
        if (typeof v === "string" && v.trim()) o[k] = v.trim();
      }
    } catch {
      /* ignore */
    }
  }
  for (const [k, v] of Object.entries(overlay)) {
    const t = String(v ?? "").trim();
    if (t) o[k] = t;
  }
  return Object.keys(o).length ? JSON.stringify(o) : null;
}

export function buildGate12cNegocioMetaOverlayFromRentasNegocio(state: {
  contactChannels: LeonixContactChannelsFormSlice;
  negocioSitioWeb: string;
  negocioBio: string;
}): Record<string, string> {
  const ch = buildLeonixContactChannelsV1PayloadFromFormSlice(state.contactChannels, {
    fallbackWebsite: state.negocioSitioWeb,
    instructionsNote: state.negocioBio,
  });
  const out: Record<string, string> = {};
  if (!ch) return out;
  if (ch.instagram) out.negocioInstagram = ch.instagram;
  if (ch.facebook) out.negocioFacebook = ch.facebook;
  if (ch.youtube) out.negocioYoutube = ch.youtube;
  if (ch.tiktok) out.negocioTiktok = ch.tiktok;
  if (ch.website) out.negocioSitioWeb = ch.website;
  if (ch.allowCall === false) out.negocioPermiteLlamadas = "no";
  else out.negocioPermiteLlamadas = "si";
  if (ch.allowSms === false) out.negocioPermiteSms = "no";
  else out.negocioPermiteSms = "si";
  if (ch.whatsappEnabled === false) out.negocioWhatsappActivo = "no";
  else out.negocioWhatsappActivo = "si";
  if (ch.preferred) out.negocioContactoPreferido = ch.preferred;
  return out;
}

export function formatLeonixPreferredContactLine(
  ch: LeonixContactChannelsV1Payload | null | undefined,
  lang: "es" | "en",
): string {
  const pref = (ch?.preferred ?? "").trim() as LeonixPreferredContact;
  if (!pref) return "";
  const es: Record<string, string> = {
    phone: "Prefieren contacto: teléfono",
    email: "Prefieren contacto: correo",
    whatsapp: "Prefieren contacto: WhatsApp",
    sms: "Prefieren contacto: SMS",
    website: "Prefieren contacto: sitio web",
  };
  const en: Record<string, string> = {
    phone: "Preferred contact: phone",
    email: "Preferred contact: email",
    whatsapp: "Preferred contact: WhatsApp",
    sms: "Preferred contact: SMS",
    website: "Preferred contact: website",
  };
  const m = lang === "en" ? en : es;
  return m[pref] ?? "";
}
