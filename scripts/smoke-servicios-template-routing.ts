/**
 * Gate 1 — Servicios template routing smoke (no network).
 * Run: npx tsx scripts/smoke-servicios-template-routing.ts
 */
import {
  isServiciosProfessionalTemplate,
  resolveServiciosListingTemplate,
} from "../app/(site)/clasificados/servicios/lib/serviciosTemplateRouting";

function fail(msg: string): never {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

function assertTemplate(
  label: string,
  input: Parameters<typeof resolveServiciosListingTemplate>[0],
  expected: ReturnType<typeof resolveServiciosListingTemplate>,
): void {
  const got = resolveServiciosListingTemplate(input);
  if (got !== expected) {
    fail(`${label}: expected ${expected}, got ${got} (${JSON.stringify(input)})`);
  }
}

console.log("smoke-servicios-template-routing: start");

assertTemplate("abogado_asesoria_legal", { businessTypeId: "abogado_asesoria_legal" }, "legal_provider");
assertTemplate("contador_impuestos", { businessTypeId: "contador_impuestos" }, "financial_provider");
assertTemplate("terapia_fisica", { businessTypeId: "terapia_fisica" }, "clinic_provider");
assertTemplate("jardineria_paisajismo", { businessTypeId: "jardineria_paisajismo" }, "standard_service");
assertTemplate("unknown_service", { businessTypeId: "unknown_service" }, "standard_service");
assertTemplate("category Dentista", { categoryLabel: "Dentista" }, "clinic_provider");
assertTemplate("category Abogado de accidentes", { categoryLabel: "Abogado de accidentes" }, "legal_provider");

assertTemplate("null/empty safe", {}, "standard_service");
assertTemplate("empty strings", { businessTypeId: "", categoryLabel: "   " }, "standard_service");

if (!isServiciosProfessionalTemplate("legal_provider")) fail("legal_provider should be professional");
if (isServiciosProfessionalTemplate("standard_service")) fail("standard_service should not be professional");

// terapia substring guard: spa/masaje therapeutic copy must not flip to clinic
assertTemplate(
  "spa masajes not clinic via terapeuticos",
  { businessTypeId: "spa_masajes", categoryLabel: "Masajes terapéuticos" },
  "standard_service",
);

assertTemplate("consultoria_negocios advisor", { businessTypeId: "consultoria_negocios" }, "advisor_provider");
assertTemplate("consultoria_variada stays standard", { businessTypeId: "consultoria_variada" }, "standard_service");
assertTemplate("marketing stays standard", { businessTypeId: "marketing_publicidad" }, "standard_service");

assertTemplate(
  "contador category wins over legal_professional internal_group",
  { internalGroup: "legal_professional", categoryLabel: "Contador / Impuestos" },
  "financial_provider",
);
assertTemplate(
  "marketing under legal_professional group stays standard",
  { internalGroup: "legal_professional", categoryLabel: "Marketing / Publicidad" },
  "standard_service",
);
assertTemplate(
  "published opsMeta businessTypeId exact map",
  { businessTypeId: "contador_impuestos", internalGroup: "legal_professional" },
  "financial_provider",
);

console.log("smoke-servicios-template-routing: OK");
