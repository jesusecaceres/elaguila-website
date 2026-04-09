import type { Lang } from "@/app/clasificados/config/clasificadosHub";

import type { EmpleosFeriaDraft } from "../types/empleosFeriaDraft";
import type { EmpleosPremiumDraft } from "../types/empleosPremiumDraft";
import type { EmpleosQuickDraft } from "../types/empleosQuickDraft";
import { EMPLEOS_GATE_FERIA, EMPLEOS_GATE_PREMIUM, EMPLEOS_GATE_QUICK } from "./empleosGateMessages";

const st = (v: unknown) => String(v ?? "").trim();

export type GateResult = { ok: true } | { ok: false; issues: string[] };

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=70";

export function gateEmpleosQuickPreview(d: EmpleosQuickDraft, lang: Lang = "es"): GateResult {
  const L = EMPLEOS_GATE_QUICK[lang];
  const issues: string[] = [];
  if (!st(d.title)) issues.push(L.title);
  if (!st(d.businessName)) issues.push(L.businessName);
  if (!st(d.city)) issues.push(L.city);
  if (!st(d.state)) issues.push(L.state);
  if (!st(d.jobType)) issues.push(L.jobType);
  if (!st(d.schedule)) issues.push(L.schedule);
  if (!st(d.pay)) issues.push(L.pay);
  if (!st(d.description)) issues.push(L.description);
  const hasImg = d.images.some((x) => st(x.url));
  if (!hasImg) issues.push(L.image);
  const hasCta = st(d.phone) || st(d.whatsapp) || st(d.email);
  if (!hasCta) issues.push(L.cta);
  return issues.length ? { ok: false, issues } : { ok: true };
}

export function gateEmpleosPremiumPreview(d: EmpleosPremiumDraft, lang: Lang = "es"): GateResult {
  const L = EMPLEOS_GATE_PREMIUM[lang];
  const issues: string[] = [];
  if (!st(d.title)) issues.push(L.title);
  if (!st(d.companyName)) issues.push(L.company);
  if (!st(d.city)) issues.push(L.city);
  if (!st(d.state)) issues.push(L.state);
  if (!st(d.salaryPrimary)) issues.push(L.salaryPrimary);
  if (!st(d.jobType)) issues.push(L.jobType);
  if (!st(d.introduction)) issues.push(L.introduction);
  const hasHero = d.gallery.some((x) => st(x.url));
  if (!hasHero) issues.push(L.heroImage);
  if (!st(d.whatsapp) && !st(d.email) && !st(d.websiteUrl)) {
    issues.push(L.applyChannel);
  }
  if (d.responsibilities.filter((x) => st(x)).length === 0) issues.push(L.responsibility);
  if (d.requirements.filter((x) => st(x)).length === 0) issues.push(L.requirement);
  if (d.offers.filter((x) => st(x)).length === 0) issues.push(L.offer);
  return issues.length ? { ok: false, issues } : { ok: true };
}

export function gateEmpleosFeriaPreview(d: EmpleosFeriaDraft, lang: Lang = "es"): GateResult {
  const L = EMPLEOS_GATE_FERIA[lang];
  const issues: string[] = [];
  if (!st(d.title)) issues.push(L.title);
  if (!st(d.flyerImageUrl)) issues.push(L.flyer);
  if (!st(d.dateLine)) issues.push(L.date);
  if (!st(d.venue)) issues.push(L.venue);
  if (!st(d.city)) issues.push(L.city);
  if (!st(d.state)) issues.push(L.state);
  if (!st(d.organizer)) issues.push(L.organizer);
  const hasContact = st(d.contactPhone) || st(d.contactEmail) || st(d.contactLink) || st(d.organizerUrl);
  if (!hasContact) issues.push(L.contact);
  return issues.length ? { ok: false, issues } : { ok: true };
}

export { FALLBACK_IMG };
