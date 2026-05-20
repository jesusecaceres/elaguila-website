/**
 * Gate 12D-2 — HOA/community application surfacing audit (Bienes Raíces).
 */
import fs from "node:fs";
import path from "node:path";
const ROOT = process.cwd();

const GATE_12D2_TOUCHED = [
  "app/(site)/clasificados/lib/leonixBrGate12dHoaPreview.ts",
  "app/(site)/clasificados/lib/leonixBrGate12d.ts",
  "app/(site)/clasificados/publicar/bienes-raices/shared/BrGate12dHoaCommunitySection.tsx",
  "app/(site)/clasificados/publicar/bienes-raices/privado/schema/bienesRaicesPrivadoFormState.ts",
  "app/(site)/clasificados/publicar/bienes-raices/privado/application/BienesRaicesPrivadoForm.tsx",
  "app/(site)/clasificados/publicar/bienes-raices/privado/application/mapping/mapBienesRaicesPrivadoStateToPreviewVm.ts",
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/schema/bienesRaicesNegocioFormState.ts",
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/ContactoCtasNegocioSection.tsx",
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/BienesRaicesNegocioApplication.tsx",
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/mapping/mapBienesRaicesNegocioStateToPreviewVm.ts",
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/mapping/bienesRaicesNegocioPreviewVm.ts",
  "app/(site)/clasificados/bienes-raices/preview/BienesRaicesNegocioPreviewView.tsx",
  "app/(site)/clasificados/bienes-raices/BR12D_2_HOA_APPLICATION_SURFACING_AUDIT.md",
  "scripts/br12d-2-hoa-application-surfacing-audit.ts",
  "package.json",
];

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function mustInclude(haystack: string, needle: string, label: string): void {
  if (!haystack.includes(needle)) {
    throw new Error(`BR12D-2 audit failed: missing ${label} (${needle})`);
  }
}

function main(): void {
  const auditDoc = read("app/(site)/clasificados/bienes-raices/BR12D_2_HOA_APPLICATION_SURFACING_AUDIT.md");
  const shared = read("app/(site)/clasificados/publicar/bienes-raices/shared/BrGate12dHoaCommunitySection.tsx");
  const privadoForm = read(
    "app/(site)/clasificados/publicar/bienes-raices/privado/application/BienesRaicesPrivadoForm.tsx",
  );
  const negocioContact = read(
    "app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/ContactoCtasNegocioSection.tsx",
  );
  const negocioState = read(
    "app/(site)/clasificados/publicar/bienes-raices/negocio/application/schema/bienesRaicesNegocioFormState.ts",
  );
  const gate12d = read("app/(site)/clasificados/lib/leonixBrGate12d.ts");
  const privadoMap = read(
    "app/(site)/clasificados/publicar/bienes-raices/privado/application/mapping/mapBienesRaicesPrivadoStateToPreviewVm.ts",
  );
  const negocioMap = read(
    "app/(site)/clasificados/publicar/bienes-raices/negocio/application/mapping/mapBienesRaicesNegocioStateToPreviewVm.ts",
  );
  const negocioPreview = read("app/(site)/clasificados/bienes-raices/preview/BienesRaicesNegocioPreviewView.tsx");
  const pkg = read("package.json");

  mustInclude(auditDoc, "TRUE/FALSE", "audit table");
  mustInclude(shared, "HOA y comunidad", "HOA ES title");
  mustInclude(shared, "HOA and community", "HOA EN title");
  mustInclude(shared, "hasHoa", "hasHoa field");
  mustInclude(shared, "hoaFee", "hoaFee field");
  mustInclude(shared, "hoaFrequency", "hoaFrequency field");
  mustInclude(shared, "hoaIncludes", "hoaIncludes field");
  mustInclude(shared, "communityRules", "communityRules field");
  mustInclude(shared, "petRules", "petRules field");
  mustInclude(shared, "rentalRestrictions", "rentalRestrictions field");
  mustInclude(shared, "shortTermRentalAllowed", "shortTermRentalAllowed field");
  mustInclude(shared, "parkingRules", "parkingRules field");

  mustInclude(privadoForm, "BrGate12dHoaCommunitySection", "privado HOA section");
  mustInclude(negocioContact, "BrGate12dHoaCommunitySection", "negocio HOA section");
  mustInclude(negocioState, "gate12d:", "negocio gate12d state");

  mustInclude(negocioContact, "openHouseActivo", "open house still in negocio");
  mustInclude(privadoForm, "Open house y visitas", "open house still in privado");

  mustInclude(gate12d, "buildBrLiveGate12dHoaCard", "gate 12D live HOA helper");
  mustInclude(gate12d, "Leonix:br_gate12d_v1", "gate 12D contract");
  mustInclude(gate12d, "resolveNegocioGate12dHoaSlice", "negocio gate12d resolver");

  mustInclude(privadoMap, "buildBrGate12dHoaPreviewCard", "privado preview HOA map");
  mustInclude(negocioMap, "hoaCommunityCard", "negocio preview HOA card");
  mustInclude(negocioPreview, "hoaCommunityCard", "negocio preview HOA render");

  mustInclude(pkg, "br:12d-2-hoa-application-surfacing-audit", "package script");

  const forbiddenPrefixes = [
    "app/(site)/clasificados/publicar/autos/",
    "app/(site)/clasificados/publicar/servicios/",
    "app/(site)/clasificados/publicar/restaurantes/",
    "app/(site)/clasificados/publicar/clases/",
    "app/(site)/clasificados/publicar/comunidad/",
    "supabase/migrations/",
    "app/(site)/clasificados/publicar/rentas/",
  ];
  for (const f of GATE_12D2_TOUCHED) {
    for (const prefix of forbiddenPrefixes) {
      if (f.startsWith(prefix) || f.includes("/migrations/")) {
        throw new Error(`BR12D-2 audit failed: gate file list includes forbidden path: ${f}`);
      }
    }
  }

  console.log("br12d-2-hoa-application-surfacing-audit: OK");
}

main();
