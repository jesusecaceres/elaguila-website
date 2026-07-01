import type { JobModalitySlug } from "@/app/clasificados/empleos/data/empleosJobTypes";
import type { QuickJobDetailSample } from "@/app/clasificados/empleos/data/empleoQuickJobSampleData";
import {
  sampleCategorySelectOptions,
  sampleExperienceOptions,
  sampleJobTypeSelectOptions,
} from "@/app/clasificados/empleos/data/empleosLandingSampleData";

import { empleosQuickPublicCityState } from "../lib/empleosPublicLocation";
import { ensurePublicPayString, normalizePayDisplayParts } from "../lib/empleosPayDisplay";
import {
  normalizeScheduleRows,
  scheduleMainDisplay,
  scheduleSidebarSummary,
} from "../lib/empleosScheduleDisplay";
import { FALLBACK_IMG } from "../required/empleosRequiredForPreview";
import type { EmpleosQuickDraft } from "../types/empleosQuickDraft";
import { sanitizeHttpUrl } from "../publish/empleosPublishSanitize";

function pickMainImage(d: EmpleosQuickDraft): { src: string; alt: string } {
  const withUrl = d.images.filter((x) => String(x.url ?? "").trim());
  if (!withUrl.length) return { src: FALLBACK_IMG, alt: "Imagen del empleo" };
  const main = withUrl.find((x) => x.isMain) ?? withUrl[0];
  return { src: main.url, alt: main.alt || "Imagen principal" };
}

function modalityLabelEs(m: JobModalitySlug): string {
  if (m === "remoto") return "Remoto";
  if (m === "hibrido") return "Híbrido";
  if (m === "campo") return "Trabajo en campo";
  if (m === "varias-ubicaciones") return "Varias ubicaciones";
  if (m === "otro") return "Otro";
  return "Presencial";
}

function labelFromOptions(
  value: string,
  options: readonly { value: string; label: string }[],
): string {
  const v = value.trim();
  if (!v) return "—";
  return options.find((o) => o.value === v)?.label ?? v;
}

export function mapQuickDraftToShell(d: EmpleosQuickDraft): QuickJobDetailSample {
  const main = pickMainImage(d);
  const hasAddr = Boolean(
    d.addressLine1.trim() ||
      d.addressLine2.trim() ||
      d.addressZip.trim() ||
      d.postalCode.trim() ||
      d.workspaceName.trim(),
  );
  const loc = empleosQuickPublicCityState({
    city: d.city,
    state: d.state,
    addressCity: d.addressCity,
    addressState: d.addressState,
    addressZip: d.addressZip,
    country: d.country,
  });
  const isRemote = d.workModality === "remoto";
  const finalLoc = hasAddr || d.locationNotes.trim() || isRemote
    ? {
        businessLine: d.workspaceName.trim() || d.businessName.trim() || "Ubicación del empleo",
        addressLine1: d.addressLine1.trim() || (isRemote ? "Remoto" : "—"),
        addressLine2: d.addressLine2.trim() || undefined,
        city: d.addressCity.trim() || loc.city,
        state: d.addressState.trim() || d.stateRegion.trim() || loc.state,
        zip: d.postalCode.trim() || d.addressZip.trim() || "",
        country: d.country.trim() || undefined,
        locationNotes: d.locationNotes.trim() || undefined,
        isRemote,
      }
    : undefined;

  const web = sanitizeHttpUrl(d.website);
  const payParts = normalizePayDisplayParts({
    pay: d.pay,
    payAmount: d.payAmount,
    payUnit: d.payUnit,
    payUnitCustom: d.payUnitCustom,
    payNote: d.payNote,
  });
  const scheduleRows = normalizeScheduleRows(d.scheduleRows, d.schedule);
  const scheduleFull = scheduleMainDisplay(d.scheduleRows, d.schedule);
  const scheduleSummary = scheduleSidebarSummary(d.scheduleRows, d.schedule);
  const categoryLabel =
    d.categorySlug === "otro"
      ? d.categoryCustom.trim() || "Otro"
      : labelFromOptions(d.categorySlug, sampleCategorySelectOptions);

  return {
    title: d.title.trim() || "Empleo",
    businessName: d.businessName.trim() || "Empresa",
    logoSrc: d.logoUrl.trim() || undefined,
    logoAlt: d.businessName.trim() || undefined,
    city: loc.city,
    state: loc.state,
    stateRegion: d.stateRegion.trim() || d.state.trim() || undefined,
    country: d.country.trim() || undefined,
    filterRegionFootnote: loc.filterRegionFootnote,
    mainImageSrc: main.src,
    mainImageAlt: main.alt,
    pay: ensurePublicPayString(payParts.headline),
    payAmount: d.payAmount.trim() || undefined,
    payUnit: d.payUnit.trim() || undefined,
    payUnitCustom: d.payUnitCustom.trim() || undefined,
    payNote: d.payNote.trim() || undefined,
    jobType: d.jobType.trim() || "—",
    jobTypeLabel:
      d.jobType === "otro" && d.jobTypeCustom.trim()
        ? d.jobTypeCustom.trim()
        : labelFromOptions(d.jobType, sampleJobTypeSelectOptions),
    categoryLabel,
    experienceLabel: labelFromOptions(d.experienceLevel, sampleExperienceOptions),
    schedule: scheduleFull,
    scheduleSummary,
    scheduleRows,
    workModalityLabel: modalityLabelEs(d.workModality),
    description: d.description.trim() || "—",
    benefits: d.benefits.map((b) => b.trim()).filter(Boolean),
    applyLink: sanitizeHttpUrl(d.applyLink) ?? undefined,
    phone: d.phone.trim(),
    whatsapp: d.whatsapp.trim(),
    smsPhone: d.smsPhone.trim() || undefined,
    email: d.email.trim(),
    websiteUrl: web ?? undefined,
    contactPerson: d.contactPerson.trim() || undefined,
    contactTitle: d.contactTitle.trim() || undefined,
    preferredApplyMethod: d.preferredApplyMethod || undefined,
    primaryCta: d.primaryCta,
    workspaceName: d.workspaceName.trim() || undefined,
    locationNotes: d.locationNotes.trim() || undefined,
    companyLinkedIn: sanitizeHttpUrl(d.companyLinkedIn) ?? undefined,
    companyFacebook: sanitizeHttpUrl(d.companyFacebook) ?? undefined,
    companyInstagram: sanitizeHttpUrl(d.companyInstagram) ?? undefined,
    companyTikTok: sanitizeHttpUrl(d.companyTikTok) ?? undefined,
    companyYouTube: sanitizeHttpUrl(d.companyYouTube) ?? undefined,
    companyX: sanitizeHttpUrl(d.companyX) ?? undefined,
    companySnapchat: sanitizeHttpUrl(d.companySnapchat) ?? undefined,
    companyOtherLinkLabel: d.companyOtherLinkLabel.trim() || undefined,
    companyOtherLinkUrl: sanitizeHttpUrl(d.companyOtherLinkUrl) ?? undefined,
    videoUrls: d.videoUrls.filter((u) => /^https?:\/\//i.test(u)).slice(0, 4),
    location: finalLoc,
    relatedJobs: [],
  };
}
