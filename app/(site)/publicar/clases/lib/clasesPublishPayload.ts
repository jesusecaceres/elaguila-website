import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { formatWeekly } from "@/app/(site)/publicar/community/shared/lib/communityScheduleText";
import { normalizeWebsiteForOpen } from "@/app/(site)/publicar/community/shared/lib/communityWebsiteAndSocial";
import type { ClasesQuickDraft } from "@/app/(site)/publicar/community/shared/types/communityQuickDraft";
import {
  labelClasesSkillLevel,
  labelCommunityAudience,
  labelCommunityRegistration,
  resolveClasesCategoryPublicLabel,
} from "@/app/(site)/publicar/community/shared/taxonomy/communityTaxonomy";

/** Clases-owned publish description composer. */
export function buildClasesDescription(d: ClasesQuickDraft, lang: Lang): string {
  const parts: string[] = [];
  if (d.description.trim()) parts.push(d.description.trim());
  parts.push(lang === "es" ? `Organizador: ${d.organizer.trim()}` : `Organizer: ${d.organizer.trim()}`);
  parts.push(
    `${lang === "es" ? "Tipo" : "Type"}: ${resolveClasesCategoryPublicLabel(d.category, d.categoryCustom, lang)}`,
  );
  const modeLabel =
    d.mode === "presencial"
      ? lang === "es"
        ? "Presencial"
        : "In person"
      : d.mode === "enLinea"
        ? lang === "es"
          ? "En línea"
          : "Online"
        : lang === "es"
          ? "Híbrida"
          : "Hybrid";
  parts.push(`${lang === "es" ? "Modalidad" : "Mode"}: ${modeLabel}`);
  parts.push(
    `${lang === "es" ? "¿Para quién es la clase?" : "Who is this class for?"}: ${labelCommunityAudience(d.audience, lang)}`,
  );
  parts.push(`${lang === "es" ? "Nivel" : "Level"}: ${labelClasesSkillLevel(d.skillLevel, lang)}`);
  parts.push(
    `${lang === "es" ? "¿Requiere registro?" : "Registration required?"}: ${labelCommunityRegistration(d.registrationRequired, lang)}`,
  );
  if (d.bringNote.trim()) {
    parts.push(
      `${lang === "es" ? "Qué deben llevar o saber" : "What to bring or know"}: ${d.bringNote.trim()}`,
    );
  }
  const cost =
    d.classCostType === "gratis"
      ? lang === "es"
        ? "Gratis"
        : "Free"
      : lang === "es"
        ? "Clase pagada (tarifa de anuncio Leonix: $24.99 por 30 días)"
        : "Paid class (Leonix listing fee: $24.99 per 30 days)";
  parts.push(`${lang === "es" ? "Costo" : "Cost"}: ${cost}`);
  const wk = formatWeekly(d.weeklySchedule, lang);
  if (wk) parts.push(wk);
  if (d.venue.trim()) parts.push(`${lang === "es" ? "Lugar" : "Venue"}: ${d.venue.trim()}`);
  if (d.addressLine1.trim()) parts.push(`${lang === "es" ? "Dirección" : "Address"}: ${d.addressLine1.trim()}`);
  const site = normalizeWebsiteForOpen(d.website);
  if (site) parts.push(`${lang === "es" ? "Web" : "Web"}: ${site}`);
  /** Social links: detail_pairs + contact canvas only (no raw social URLs in description body). */
  return parts.join("\n\n").trim();
}

/** Clases-owned publish detail-pair composer — clases-only fields (common fields live in the shared transport file). */
export function buildClasesDetailPairs(c: ClasesQuickDraft): Array<{ label: string; value: string }> {
  const pairs: Array<{ label: string; value: string }> = [];
  pairs.push({ label: "Leonix:classCategory", value: c.category.trim() });
  if (c.category === "otro" && c.categoryCustom.trim()) {
    pairs.push({ label: "Leonix:classCategoryCustom", value: c.categoryCustom.trim() });
  }
  /** Full multi-type selection (Gate 2A); categories[0] always mirrors Leonix:classCategory above. */
  if (c.categories.length > 0) {
    pairs.push({ label: "Leonix:classCategories", value: c.categories.join(",") });
  }
  pairs.push({ label: "Leonix:classCostType", value: c.classCostType });
  pairs.push({ label: "Leonix:mode", value: c.mode });
  if (c.classCostType === "pagada") {
    pairs.push({ label: "Leonix:priceAmount", value: c.priceAmount.trim() });
    pairs.push({ label: "Leonix:priceFrequency", value: c.priceFrequency });
    if (c.priceNote.trim()) pairs.push({ label: "Leonix:priceNote", value: c.priceNote.trim() });
  }
  pairs.push({
    label: "Leonix:weeklyScheduleJson",
    value: JSON.stringify(c.weeklySchedule),
  });
  pairs.push({ label: "Leonix:skillLevel", value: c.skillLevel.trim() });
  /** Provider payment methods (Gate 2A) — how students pay the instructor, never the Leonix listing fee. */
  if (c.paymentMethods.length > 0) {
    pairs.push({ label: "Leonix:paymentMethods", value: c.paymentMethods.join(",") });
    if (c.paymentMethods.includes("otro") && c.paymentMethodOther.trim()) {
      pairs.push({ label: "Leonix:paymentMethodOther", value: c.paymentMethodOther.trim() });
    }
  }
  if (c.startDate.trim()) pairs.push({ label: "Leonix:classStartDate", value: c.startDate.trim() });
  if (c.endDate.trim()) pairs.push({ label: "Leonix:classEndDate", value: c.endDate.trim() });
  const cl = c.classLinks;
  const pushUrl = (label: string, raw: string) => {
    const v = normalizeWebsiteForOpen(raw);
    if (v) pairs.push({ label, value: v });
  };
  pushUrl("Leonix:clsRegistrationUrl", cl.registrationUrl);
  pushUrl("Leonix:clsPaymentUrl", cl.paymentUrl);
  pushUrl("Leonix:clsTicketsUrl", cl.ticketsUrl);
  pushUrl("Leonix:clsDonationUrl", cl.donationUrl);
  pushUrl("Leonix:clsMaterialsUrl", cl.classMaterialsUrl);
  pushUrl("Leonix:clsSyllabusUrl", cl.syllabusUrl);
  pushUrl("Leonix:clsGuideUrl", cl.classGuideUrl);
  pushUrl("Leonix:clsInstructorUrl", cl.instructorPageUrl);
  pushUrl("Leonix:clsStudentPortalUrl", cl.studentPortalUrl);
  pushUrl("Leonix:clsVendorsUrl", cl.vendorsResourcesUrl);
  pushUrl("Leonix:clsFoodVendorsUrl", cl.foodVendorsUrl);
  pushUrl("Leonix:clsSponsorsUrl", cl.sponsorsUrl);
  const cl1l = cl.customLink1Label.trim();
  const cl1u = normalizeWebsiteForOpen(cl.customLink1Url);
  if (cl1l && cl1u) {
    pairs.push({ label: "Leonix:clsCustom1Label", value: cl1l });
    pairs.push({ label: "Leonix:clsCustom1Url", value: cl1u });
  }
  const cl2l = cl.customLink2Label.trim();
  const cl2u = normalizeWebsiteForOpen(cl.customLink2Url);
  if (cl2l && cl2u) {
    pairs.push({ label: "Leonix:clsCustom2Label", value: cl2l });
    pairs.push({ label: "Leonix:clsCustom2Url", value: cl2u });
  }
  return pairs;
}

export function clasesPriceFields(d: ClasesQuickDraft): { price: number; is_free: boolean } {
  if (d.classCostType !== "gratis") return { price: 0, is_free: false };
  return { price: 0, is_free: true };
}
