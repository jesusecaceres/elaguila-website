/**
 * Gate EMPLEOS-E3 MASTER — Audit Script
 * Run: npx tsx scripts/empleos-e3-master-paid-job-product-audit.ts
 *
 * Verifies all E3 changes are present in the relevant files.
 * Exits 0 if all pass, 1 if any fail.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
let pass = 0;
let fail = 0;

function check(label: string, filePath: string, test: string | ((content: string) => boolean)): void {
  const abs = path.join(ROOT, filePath);
  let content: string;
  try {
    content = fs.readFileSync(abs, "utf8");
  } catch {
    console.error(`  FAIL  [${label}] — file not found: ${filePath}`);
    fail++;
    return;
  }
  const result = typeof test === "string" ? content.includes(test) : test(content);
  if (result) {
    console.log(`  PASS  [${label}]`);
    pass++;
  } else {
    console.error(`  FAIL  [${label}] — check failed in: ${filePath}`);
    fail++;
  }
}

console.log("\n=== Gate EMPLEOS-E3 MASTER — Paid Job Product Audit ===\n");

// ── AUDIT DOC ─────────────────────────────────────────────────────────────
console.log("── Audit doc ──");
check("E3 audit doc exists", "app/lib/clasificados/empleos/EMPLEOS_E3_MASTER_PAID_JOB_PRODUCT_AUDIT.md", "Gate EMPLEOS-E3 MASTER");
check("E3 audit has TRUE/FALSE table", "app/lib/clasificados/empleos/EMPLEOS_E3_MASTER_PAID_JOB_PRODUCT_AUDIT.md", "TRUE/FALSE");
check("E3 audit references En Venta/Varios benchmark", "app/lib/clasificados/empleos/EMPLEOS_E3_MASTER_PAID_JOB_PRODUCT_AUDIT.md", "En Venta/Varios");
check("E3 audit covers simple + business/corporate", "app/lib/clasificados/empleos/EMPLEOS_E3_MASTER_PAID_JOB_PRODUCT_AUDIT.md", "Simple + Business");
check("E3 audit covers employer business card", "app/lib/clasificados/empleos/EMPLEOS_E3_MASTER_PAID_JOB_PRODUCT_AUDIT.md", "Employer Business Card");
check("E3 audit covers structured shifts", "app/lib/clasificados/empleos/EMPLEOS_E3_MASTER_PAID_JOB_PRODUCT_AUDIT.md", "Schedule / Turnos");
check("E3 audit covers pay formatting", "app/lib/clasificados/empleos/EMPLEOS_E3_MASTER_PAID_JOB_PRODUCT_AUDIT.md", "Pay Formatting");
check("E3 audit covers analytics/truth", "app/lib/clasificados/empleos/EMPLEOS_E3_MASTER_PAID_JOB_PRODUCT_AUDIT.md", "Analytics / Truth");
check("E3 audit covers mobile/PWA", "app/lib/clasificados/empleos/EMPLEOS_E3_MASTER_PAID_JOB_PRODUCT_AUDIT.md", "Mobile / PWA");

// ── FORM KEY LABELS ──────────────────────────────────────────────────────
console.log("\n── Form key labels (ES/EN) ──");
const FORM = "app/(site)/publicar/empleos/quick/EmpleoQuickApplicationClient.tsx";
check("Publicar empleo label", FORM, "Publicar empleo");
check("Puesto y empleador label", FORM, "Puesto y empleador");
check("Detalles del empleo label", FORM, "Detalles del empleo");
check("Pago, horario y beneficios label", FORM, "Pago, horario y beneficios");
check("Multimedia / Media label", FORM, (c) => c.includes("Multimedia") || c.includes('"4. Media"'));
check("Tarjeta del empleador label", FORM, "Tarjeta del empleador");
check("Ubicacion del empleo label", FORM, "Ubicaci\u00f3n del empleo");
check("Empresa y enlaces label", FORM, "Empresa y enlaces");
check("Nombre del negocio / empleador field", FORM, "Nombre del negocio / empleador");
check("Logo section present", FORM, "logo");
check("Nombre de contacto field", FORM, "Nombre de contacto");
check("Titulo / cargo del contacto field", FORM, "T\u00edtulo / cargo del contacto");
check("Hora de inicio field", FORM, "Hora de inicio");
check("Hora de fin field", FORM, "Hora de fin");
check("Sitio web de la empresa field", FORM, "Sitio web de la empresa");
check("LinkedIn field", FORM, "LinkedIn");
check("Facebook field", FORM, "Facebook");
check("Instagram field", FORM, "Instagram");
check("TikTok field", FORM, "TikTok");
check("YouTube field", FORM, "YouTube");
check("X / Twitter field", FORM, "X / Twitter");
check("Snapchat field", FORM, "Snapchat");
check("Pais / Country field", FORM, "Pa\u00eds");
check("Estado / Region field", FORM, "Estado / Regi\u00f3n");
check("Codigo postal field", FORM, "C\u00f3digo postal");
check("$24.99 price banner", FORM, "$24.99");
check("Section 1 helper copy ES", FORM, "Esta informaci\u00f3n define c\u00f3mo aparecer\u00e1");
check("Section 2 spec description copy ES", FORM, "documentos requeridos");
check("Section 4 images helper copy ES", FORM, "Las im\u00e1genes muestran el trabajo");
check("Section 4 logo identity copy ES", FORM, "El logo aparece junto al nombre del empleador");

// ── CTA CARD LABELS ───────────────────────────────────────────────────────
console.log("\n── CTA card labels ──");
const CTA = "app/(site)/clasificados/empleos/components/quickJob/QuickJobCTACard.tsx";
check("Aplicar a este empleo label", CTA, "Aplicar a este empleo");
check("Contactar empleador label", CTA, "Contactar empleador");
check("Conoce al empleador label", CTA, "Conoce al empleador");
check("Learn about the employer EN label", CTA, "Learn about the employer");
check("Publicado en Leonix trust cue", CTA, "Publicado en Leonix");
check("Published on Leonix EN trust cue", CTA, "Published on Leonix");
check("Aplicar ahora CTA", CTA, "Aplicar ahora");

// ── DATA CHAIN: DRAFT TYPE ─────────────────────────────────────────────
console.log("\n── Draft type ──");
const DRAFT = "app/(site)/publicar/empleos/shared/types/empleosQuickDraft.ts";
check("contactTitle in draft type", DRAFT, "contactTitle: string;");
check("startTime in EmpleosQuickScheduleRow", DRAFT, "startTime: string;");
check("endTime in EmpleosQuickScheduleRow", DRAFT, "endTime: string;");
check("companyTikTok in draft type", DRAFT, "companyTikTok: string;");
check("companyYouTube in draft type", DRAFT, "companyYouTube: string;");
check("companyX in draft type", DRAFT, "companyX: string;");
check("companySnapchat in draft type", DRAFT, "companySnapchat: string;");
check("contactTitle in emptyEmpleosQuickDraft", DRAFT, 'contactTitle: "",');
check("companyTikTok in emptyEmpleosQuickDraft", DRAFT, 'companyTikTok: "",');
check("companyYouTube in emptyEmpleosQuickDraft", DRAFT, 'companyYouTube: "",');
check("companyX in emptyEmpleosQuickDraft", DRAFT, 'companyX: "",');
check("companySnapchat in emptyEmpleosQuickDraft", DRAFT, 'companySnapchat: "",');
check("normalizeEmpleosQuickDraft handles companyTikTok", DRAFT, "companyTikTok:");

// ── PUBLISH SNAPSHOT TYPE ─────────────────────────────────────────────
console.log("\n── Publish snapshot type ──");
const SNAP = "app/(site)/publicar/empleos/shared/publish/empleosPublishSnapshots.ts";
check("contactTitle in EmpleosQuickPublishSnapshot", SNAP, "contactTitle?: string;");
check("startTime optional in EmpleosQuickScheduleRowSnapshot", SNAP, "startTime?: string;");
check("endTime optional in EmpleosQuickScheduleRowSnapshot", SNAP, "endTime?: string;");
check("companyTikTok in snapshot", SNAP, "companyTikTok?: string;");
check("companyYouTube in snapshot", SNAP, "companyYouTube?: string;");
check("companyX in snapshot", SNAP, "companyX?: string;");
check("companySnapchat in snapshot", SNAP, "companySnapchat?: string;");

// ── PUBLISH BUILDER ───────────────────────────────────────────────────
console.log("\n── Publish envelope builder ──");
const BUILDER = "app/(site)/publicar/empleos/shared/publish/buildEmpleosPublishEnvelope.ts";
check("contactTitle emitted in buildQuickPublishSnapshot", BUILDER, "contactTitle: d.contactTitle");
check("startTime emitted in schedRows", BUILDER, "startTime: String(r.startTime");
check("endTime emitted in schedRows", BUILDER, "endTime: String(r.endTime");
check("companyTikTok emitted", BUILDER, "companyTikTok: sanitizeHttpUrl(d.companyTikTok)");
check("companyYouTube emitted", BUILDER, "companyYouTube: sanitizeHttpUrl(d.companyYouTube)");
check("companyX emitted", BUILDER, "companyX: sanitizeHttpUrl(d.companyX)");
check("companySnapchat emitted", BUILDER, "companySnapchat: sanitizeHttpUrl(d.companySnapchat)");
check("joinQuickScheduleForPublish uses dot separator", BUILDER, "\u00b7");
check("joinQuickScheduleForPublish uses en-dash", BUILDER, "\u2013");

// ── ENVELOPE HYDRATOR ─────────────────────────────────────────────────
console.log("\n── Envelope hydrator ──");
const HYDRATOR = "app/(site)/publicar/empleos/shared/lib/empleosDraftFromEnvelope.ts";
check("contactTitle hydrated from envelope", HYDRATOR, "contactTitle: d.contactTitle");
check("applyLink hydrated from envelope", HYDRATOR, "applyLink: d.applyLink");
check("smsPhone hydrated from envelope", HYDRATOR, "smsPhone: d.smsPhone");
check("workspaceName hydrated from envelope", HYDRATOR, "workspaceName: d.workspaceName");
check("locationNotes hydrated from envelope", HYDRATOR, "locationNotes: d.locationNotes");
check("companyTikTok hydrated from envelope", HYDRATOR, "companyTikTok: d.companyTikTok");
check("companyYouTube hydrated from envelope", HYDRATOR, "companyYouTube: d.companyYouTube");
check("companyX hydrated from envelope", HYDRATOR, "companyX: d.companyX");
check("companySnapchat hydrated from envelope", HYDRATOR, "companySnapchat: d.companySnapchat");
check("startTime hydrated in schedule rows", HYDRATOR, "startTime:");
check("endTime hydrated in schedule rows", HYDRATOR, "endTime:");

// ── MAPPER ────────────────────────────────────────────────────────────
console.log("\n── Mapper ──");
const MAPPER = "app/(site)/publicar/empleos/shared/mappers/mapQuickDraftToShell.ts";
check("companyTikTok passed through mapper", MAPPER, "companyTikTok:");
check("companyYouTube passed through mapper", MAPPER, "companyYouTube:");
check("companyX passed through mapper", MAPPER, "companyX:");
check("companySnapchat passed through mapper", MAPPER, "companySnapchat:");
check("videoUrls passed through mapper", MAPPER, "videoUrls:");
check("contactTitle passed through mapper", MAPPER, "contactTitle:");
check("stateRegion passed through mapper", MAPPER, "stateRegion:");
check("country passed through mapper", MAPPER, "country:");

// ── SHELL TYPE ────────────────────────────────────────────────────────
console.log("\n── Shell type ──");
const SHELL = "app/(site)/clasificados/empleos/data/empleoQuickJobSampleData.ts";
check("companyTikTok in QuickJobDetailSample", SHELL, "companyTikTok?: string;");
check("companyYouTube in QuickJobDetailSample", SHELL, "companyYouTube?: string;");
check("companyX in QuickJobDetailSample", SHELL, "companyX?: string;");
check("companySnapchat in QuickJobDetailSample", SHELL, "companySnapchat?: string;");
check("contactTitle in QuickJobDetailSample", SHELL, "contactTitle?: string;");
check("stateRegion in QuickJobDetailSample", SHELL, "stateRegion?: string;");
check("country in QuickJobDetailSample", SHELL, "country?: string;");

// ── CTA CARD SOCIALS ─────────────────────────────────────────────────
console.log("\n── CTA card social platform support ──");
check("CTA card has companyTikTok prop", CTA, "companyTikTok?: string;");
check("CTA card has companyYouTube prop", CTA, "companyYouTube?: string;");
check("CTA card has companyX prop", CTA, "companyX?: string;");
check("CTA card has companySnapchat prop", CTA, "companySnapchat?: string;");
check("CTA card renders TikTok button", CTA, "SiTiktok");
check("CTA card renders YouTube button", CTA, "FaYoutube");
check("CTA card renders X button", CTA, "SiX");
check("CTA card renders Snapchat button", CTA, "FaSnapchat");
check("hasCompanyLinks includes TikTok", CTA, "companyTikTok || companyYouTube");

// ── DETAIL PAGE PASSES NEW PROPS ─────────────────────────────────────
console.log("\n── Detail page prop pass-through ──");
const DETAIL = "app/(site)/clasificados/empleos/components/quickJob/EmpleoQuickDetailPage.tsx";
check("Detail page passes companyTikTok", DETAIL, "companyTikTok={data.companyTikTok");
check("Detail page passes companyYouTube", DETAIL, "companyYouTube={data.companyYouTube");
check("Detail page passes companyX", DETAIL, "companyX={data.companyX");
check("Detail page passes companySnapchat", DETAIL, "companySnapchat={data.companySnapchat");
check("Detail page passes contactTitle", DETAIL, "contactTitle={data.contactTitle");

// ── CATEGORY DROPDOWN ─────────────────────────────────────────────────
console.log("\n── Category dropdown ──");
const CATS = "app/(site)/clasificados/empleos/data/empleosLandingSampleData.ts";
check("Category: construccion", CATS, "Construcci\u00f3n");
check("Category: restaurante", CATS, "Restaurante / Cocina");
check("Category: cuidado-ninos", CATS, "Cuidado de ni\u00f1os");
check("Category: otro", CATS, '{ value: "otro"');
check("Category: recursos-humanos", CATS, "Recursos Humanos");
check("Category: voluntariado", CATS, "Voluntariado");

// ── ANALYTICS NON-REGRESSION ─────────────────────────────────────────
console.log("\n── Analytics non-regression ──");
check("CTA tracks phone", CTA, 'trackEmpleosSidebarContactCta("phone"');
check("CTA tracks whatsapp", CTA, 'trackEmpleosSidebarContactCta("whatsapp"');
check("CTA tracks email", CTA, 'trackEmpleosSidebarContactCta("email"');
check("CTA tracks website", CTA, 'trackEmpleosSidebarContactCta("website"');
check("formatPay() function present", CTA, "function formatPay(");
check("formatPhone() function present", CTA, "function formatPhone(");
check("looksLikeEmail() guard present", CTA, "function looksLikeEmail(");
check("validEmail gates email CTA", CTA, "validEmail");

// ── SCOPE SAFETY ─────────────────────────────────────────────────────
console.log("\n── Scope safety ──");
check("No Stripe/payment strings in draft type", DRAFT, (c) => !c.includes("stripe") && !c.includes("payment_intent"));
check("No Stripe/payment strings in form", FORM, (c) => !c.toLowerCase().includes("stripe"));
check("No Supabase migration strings in form", FORM, (c) => !c.includes("CREATE TABLE") && !c.includes("ALTER TABLE"));
check(".env.local not referenced in form", FORM, (c) => !c.includes(".env.local"));
check("E3 audit doc exists", "app/lib/clasificados/empleos/EMPLEOS_E3_MASTER_PAID_JOB_PRODUCT_AUDIT.md", "READY TO COMMIT");

// ── SUMMARY ──────────────────────────────────────────────────────────
console.log(`\n=== Results: ${pass} PASS, ${fail} FAIL ===\n`);
process.exit(fail > 0 ? 1 : 0);
