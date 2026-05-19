import type { BienesRaicesNegocioFormState, BienesRaicesAdvertiserType } from "@/app/clasificados/publicar/bienes-raices/negocio/application/schema/bienesRaicesNegocioFormState";
import {
  createEmptyLeonixContactChannelsFormSlice,
  type LeonixContactChannelsFormSlice,
} from "@/app/clasificados/lib/leonixContactChannelsV1";

function trim(s: unknown): string {
  if (s == null) return "";
  return typeof s === "string" ? s.trim() : String(s).trim();
}

function firstRed(raws: string[]): string {
  for (const r of raws) {
    const t = trim(r);
    if (t) return t;
  }
  return "";
}

function identitySlice(
  adv: BienesRaicesAdvertiserType,
  s: BienesRaicesNegocioFormState,
): { sitioWeb: string; redes: string[] } {
  if (adv === "agente_individual") {
    return { sitioWeb: trim(s.identityAgente.sitioWeb), redes: s.identityAgente.redes ?? [] };
  }
  if (adv === "equipo_agentes") {
    return { sitioWeb: trim(s.identityEquipo.sitioWeb), redes: s.identityEquipo.redes ?? [] };
  }
  if (adv === "oficina_brokerage") {
    return { sitioWeb: trim(s.identityOficina.sitioWeb), redes: s.identityOficina.redes ?? [] };
  }
  if (adv === "constructor_desarrollador") {
    return { sitioWeb: trim(s.identityConstructor.sitioWeb), redes: s.identityConstructor.redes ?? [] };
  }
  return { sitioWeb: "", redes: [] };
}

/**
 * Fills contact channel URLs from identity when step 12 no longer collects duplicate social/website fields.
 * Button toggles in `cta` + `contactChannels` si/no flags remain on the form slice.
 */
export function hydrateBrNegocioContactChannelsFromIdentity(
  state: BienesRaicesNegocioFormState,
): LeonixContactChannelsFormSlice {
  const base = state.contactChannels ?? createEmptyLeonixContactChannelsFormSlice();
  const adv = state.advertiserType;
  if (!adv) return base;
  const id = identitySlice(adv, state);
  const red0 = firstRed(id.redes);
  const patch: Partial<LeonixContactChannelsFormSlice> = {};
  if (!trim(base.masInformacionUrl) && trim(id.sitioWeb)) {
    patch.masInformacionUrl = id.sitioWeb;
  }
  if (!trim(base.instagram) && /instagram/i.test(red0)) patch.instagram = red0;
  if (!trim(base.facebook) && /facebook|fb\./i.test(red0)) patch.facebook = red0;
  if (!trim(base.youtube) && /youtube|youtu\.be/i.test(red0)) patch.youtube = red0;
  if (!trim(base.tiktok) && /tiktok/i.test(red0)) patch.tiktok = red0;
  return { ...base, ...patch };
}
