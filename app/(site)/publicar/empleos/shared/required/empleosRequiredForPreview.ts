import type { EmpleosFeriaDraft } from "../types/empleosFeriaDraft";
import type { EmpleosPremiumDraft } from "../types/empleosPremiumDraft";
import type { EmpleosQuickDraft } from "../types/empleosQuickDraft";

const st = (v: unknown) => String(v ?? "").trim();

export type GateResult = { ok: true } | { ok: false; issues: string[] };

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=70";

export function gateEmpleosQuickPreview(d: EmpleosQuickDraft): GateResult {
  const issues: string[] = [];
  if (!st(d.title)) issues.push("Título del puesto");
  if (!st(d.businessName)) issues.push("Nombre del negocio");
  if (!st(d.city)) issues.push("Ciudad");
  if (!st(d.state)) issues.push("Estado");
  if (!st(d.jobType)) issues.push("Tipo de empleo");
  if (!st(d.schedule)) issues.push("Horario");
  if (!st(d.pay)) issues.push("Pago");
  if (!st(d.description)) issues.push("Descripción corta");
  const hasImg = d.images.some((x) => st(x.url));
  if (!hasImg) issues.push("Imagen principal (sube o pega URL)");
  const hasCta = st(d.phone) || st(d.whatsapp) || st(d.email);
  if (!hasCta) issues.push("Al menos un método de contacto (teléfono, WhatsApp o email)");
  return issues.length ? { ok: false, issues } : { ok: true };
}

export function gateEmpleosPremiumPreview(d: EmpleosPremiumDraft): GateResult {
  const issues: string[] = [];
  if (!st(d.title)) issues.push("Título del puesto");
  if (!st(d.companyName)) issues.push("Empresa");
  if (!st(d.city)) issues.push("Ciudad");
  if (!st(d.state)) issues.push("Estado");
  if (!st(d.salaryPrimary)) issues.push("Salario principal");
  if (!st(d.jobType)) issues.push("Tipo de empleo");
  if (!st(d.introduction)) issues.push("Descripción del puesto");
  const hasHero = d.gallery.some((x) => st(x.url));
  if (!hasHero) issues.push("Al menos una imagen principal / hero");
  if (!st(d.whatsapp) && !st(d.email) && !st(d.websiteUrl)) {
    issues.push("Al menos un canal: WhatsApp, email o sitio web");
  }
  if (d.responsibilities.filter((x) => st(x)).length === 0) issues.push("Al menos una responsabilidad");
  if (d.requirements.filter((x) => st(x)).length === 0) issues.push("Al menos un requisito");
  if (d.offers.filter((x) => st(x)).length === 0) issues.push("Al menos un ítem en Ofrecemos");
  return issues.length ? { ok: false, issues } : { ok: true };
}

export function gateEmpleosFeriaPreview(d: EmpleosFeriaDraft): GateResult {
  const issues: string[] = [];
  if (!st(d.title)) issues.push("Título");
  if (!st(d.flyerImageUrl)) issues.push("Imagen del flyer o URL");
  if (!st(d.dateLine)) issues.push("Fecha");
  if (!st(d.venue)) issues.push("Sede");
  if (!st(d.city)) issues.push("Ciudad");
  if (!st(d.state)) issues.push("Estado");
  if (!st(d.organizer)) issues.push("Organizador");
  const hasContact = st(d.contactPhone) || st(d.contactEmail) || st(d.contactLink) || st(d.organizerUrl);
  if (!hasContact) issues.push("Al menos un método de contacto");
  return issues.length ? { ok: false, issues } : { ok: true };
}

export { FALLBACK_IMG };
