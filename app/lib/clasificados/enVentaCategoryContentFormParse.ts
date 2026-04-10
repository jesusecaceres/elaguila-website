import type {
  BilingualPatch,
  ClasificadosDetailFieldCopyPatch,
  ClasificadosEnVentaContentPatch,
} from "@/app/lib/clasificados/clasificadosCategoryContentTypes";
import { DETAIL_FIELDS } from "@/app/clasificados/config/publishDetailFields";

function str(f: FormData, k: string): string {
  const v = f.get(k);
  return typeof v === "string" ? v.trim() : "";
}

function bp(es: string, en: string): BilingualPatch | undefined {
  if (!es && !en) return undefined;
  return { es: es || undefined, en: en || undefined };
}

function setBilingualOn(
  holder: Record<string, BilingualPatch | undefined>,
  key: string,
  prevPair: BilingualPatch | undefined,
  es: string,
  en: string
): void {
  const n = bp(es, en);
  if (!n) {
    delete holder[key];
    return;
  }
  holder[key] = { ...prevPair, ...n };
}

/**
 * Applies the full editor form to the stored patch. Empty fields **remove** overrides
 * so the public site falls back to code defaults (`enVentaContentDefaults` + `DETAIL_FIELDS`).
 */
export function buildEnVentaCategoryPatchFromForm(
  prev: ClasificadosEnVentaContentPatch | null | undefined,
  f: FormData
): ClasificadosEnVentaContentPatch {
  const p = prev ?? {};

  const hubLanding: Record<string, string | BilingualPatch | undefined> = { ...p.hubLanding };

  setBilingualOn(hubLanding as Record<string, BilingualPatch | undefined>, "hero", p.hubLanding?.hero, str(f, "hub_hero_es"), str(f, "hub_hero_en"));
  setBilingualOn(hubLanding as Record<string, BilingualPatch | undefined>, "sub", p.hubLanding?.sub, str(f, "hub_sub_es"), str(f, "hub_sub_en"));
  setBilingualOn(hubLanding as Record<string, BilingualPatch | undefined>, "searchPh", p.hubLanding?.searchPh, str(f, "hub_searchPh_es"), str(f, "hub_searchPh_en"));
  setBilingualOn(hubLanding as Record<string, BilingualPatch | undefined>, "search", p.hubLanding?.search, str(f, "hub_search_es"), str(f, "hub_search_en"));
  setBilingualOn(hubLanding as Record<string, BilingualPatch | undefined>, "publish", p.hubLanding?.publish, str(f, "hub_publish_es"), str(f, "hub_publish_en"));
  setBilingualOn(hubLanding as Record<string, BilingualPatch | undefined>, "lista", p.hubLanding?.lista, str(f, "hub_lista_es"), str(f, "hub_lista_en"));
  setBilingualOn(hubLanding as Record<string, BilingualPatch | undefined>, "trust", p.hubLanding?.trust, str(f, "hub_trust_es"), str(f, "hub_trust_en"));

  const heroEmoji = str(f, "hub_hero_emoji");
  if (!heroEmoji) delete hubLanding.heroEmoji;
  else hubLanding.heroEmoji = heroEmoji;

  const heroImageUrl = str(f, "hub_hero_image_url");
  if (!heroImageUrl) delete hubLanding.heroImageUrl;
  else hubLanding.heroImageUrl = heroImageUrl;

  const publishHub: Record<string, string | BilingualPatch | undefined> = { ...p.publishHub };

  setBilingualOn(publishHub as Record<string, BilingualPatch | undefined>, "title", p.publishHub?.title, str(f, "pub_title_es"), str(f, "pub_title_en"));
  setBilingualOn(publishHub as Record<string, BilingualPatch | undefined>, "subtitle", p.publishHub?.subtitle, str(f, "pub_subtitle_es"), str(f, "pub_subtitle_en"));
  setBilingualOn(publishHub as Record<string, BilingualPatch | undefined>, "freeTitle", p.publishHub?.freeTitle, str(f, "pub_freeTitle_es"), str(f, "pub_freeTitle_en"));
  setBilingualOn(publishHub as Record<string, BilingualPatch | undefined>, "freeDesc", p.publishHub?.freeDesc, str(f, "pub_freeDesc_es"), str(f, "pub_freeDesc_en"));
  setBilingualOn(publishHub as Record<string, BilingualPatch | undefined>, "proTitle", p.publishHub?.proTitle, str(f, "pub_proTitle_es"), str(f, "pub_proTitle_en"));
  setBilingualOn(publishHub as Record<string, BilingualPatch | undefined>, "proDesc", p.publishHub?.proDesc, str(f, "pub_proDesc_es"), str(f, "pub_proDesc_en"));
  setBilingualOn(publishHub as Record<string, BilingualPatch | undefined>, "sfTitle", p.publishHub?.sfTitle, str(f, "pub_sfTitle_es"), str(f, "pub_sfTitle_en"));
  setBilingualOn(publishHub as Record<string, BilingualPatch | undefined>, "sfDesc", p.publishHub?.sfDesc, str(f, "pub_sfDesc_es"), str(f, "pub_sfDesc_en"));
  setBilingualOn(publishHub as Record<string, BilingualPatch | undefined>, "back", p.publishHub?.back, str(f, "pub_back_es"), str(f, "pub_back_en"));

  const laneFree = str(f, "pub_lane_free_emoji");
  if (!laneFree) delete publishHub.laneFreeEmoji;
  else publishHub.laneFreeEmoji = laneFree;

  const lanePro = str(f, "pub_lane_pro_badge");
  if (!lanePro) delete publishHub.laneProBadge;
  else publishHub.laneProBadge = lanePro;

  const laneSf = str(f, "pub_lane_sf_emoji");
  if (!laneSf) delete publishHub.laneSfEmoji;
  else publishHub.laneSfEmoji = laneSf;

  const backHref = str(f, "pub_back_href");
  if (!backHref) delete publishHub.backHref;
  else publishHub.backHref = backHref;

  const detailFields: Record<string, ClasificadosDetailFieldCopyPatch> = { ...p.detailFields };

  for (const row of DETAIL_FIELDS["en-venta"] ?? []) {
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

  const out: ClasificadosEnVentaContentPatch = {};

  if (Object.keys(hubLanding).length) {
    out.hubLanding = hubLanding as ClasificadosEnVentaContentPatch["hubLanding"];
  }
  if (Object.keys(publishHub).length) {
    out.publishHub = publishHub as ClasificadosEnVentaContentPatch["publishHub"];
  }
  if (Object.keys(detailFields).length) {
    out.detailFields = detailFields;
  }
  if (staffModerationNotes) {
    out.staffModerationNotes = staffModerationNotes;
  }

  return out;
}
