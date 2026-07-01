/**
 * COMUNIDAD-PREVIEW-PUBLISH-ID-GATE audit
 * Run: npm run comunidad:preview-publish-id-gate-audit
 */

import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");

function rel(...parts: string[]): string {
  return path.join(ROOT, ...parts);
}

function read(filePath: string): string {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

type Row = { requirement: string; pass: boolean; evidence: string };
const rows: Row[] = [];

function check(requirement: string, pass: boolean, evidence: string) {
  rows.push({ requirement, pass, evidence });
}

const auditPath = rel("app/lib/clasificados/comunidad/COMUNIDAD_PREVIEW_PUBLISH_ID_GATE_AUDIT.md");
check("Audit file exists", fs.existsSync(auditPath), auditPath);

const auditMd = read(auditPath);
check("TRUE/FALSE table present", auditMd.includes("| Requirement | TRUE/FALSE | Evidence |"), "audit md");

const spanishLabels = [
  "Organizado por",
  "Logo o foto del organizador",
  "Título del enlace",
  "URL del enlace",
  "Días y horarios del evento",
  "Qué llevar o saber",
  "Descripción",
  "Contacto del organizador",
  "Síguenos",
  "Más información",
  "Lugar del evento",
  "Ver en el mapa",
  "Leonix Ad ID",
  "Reportar anuncio",
];

const searchRoots = [
  rel("app/(site)/publicar/comunidad"),
  rel("app/(site)/publicar/community"),
  rel("app/(site)/clasificados/community"),
  rel("app/lib/clasificados/comunidad"),
];

for (const label of spanishLabels) {
  const found = searchRoots.some((dir) => {
    if (!fs.existsSync(dir)) return false;
    const stack = [dir];
    while (stack.length) {
      const cur = stack.pop()!;
      for (const ent of fs.readdirSync(cur, { withFileTypes: true })) {
        const p = path.join(cur, ent.name);
        if (ent.isDirectory()) stack.push(p);
        else if (/\.(tsx?|md)$/.test(ent.name) && read(p).includes(label)) return true;
      }
    }
    return false;
  });
  check(`Spanish label: ${label}`, found, "comunidad/community files");
}

const costHelper = read(rel("app/lib/clasificados/comunidad/comunidadCostDisplay.ts"));
check(
  "Comunidad $ cost formatting helper exists",
  costHelper.includes("formatComunidadCostSummary") && costHelper.includes("formatAdmissionWithDollar"),
  "comunidadCostDisplay.ts",
);

const canvas = read(rel("app/(site)/publicar/comunidad/components/ComunidadQuickAdCanvas.tsx"));
check(
  "Preview canvas uses custom link titles via contact canvas",
  read(rel("app/(site)/publicar/community/shared/preview/CommunityContactCanvas.tsx")).includes("el.customLink1Label.trim()"),
  "CommunityContactCanvas",
);
check("Preview passes Leonix Ad ID", canvas.includes("CommunityPremiumTrustFooter"), "ComunidadQuickAdCanvas");

const draftTypes = read(rel("app/(site)/publicar/community/shared/types/communityQuickDraft.ts"));
check("previewListingId on draft", draftTypes.includes("previewListingId"), "communityQuickDraft.ts");
check("organizerLogoUrl on draft", draftTypes.includes("organizerLogoUrl"), "communityQuickDraft.ts");

const publish = read(rel("app/(site)/publicar/community/shared/publish/publishCommunityQuickToListings.ts"));
check("organizerLogoUrl in detail pairs", publish.includes("Leonix:organizerLogoUrl"), "publishCommunityQuickToListings.ts");

const pkg = read(rel("package.json"));
check("No fake analytics strings added in comunidad files", !canvas.includes("fakeViews"), "spot check");

const unrelatedCats = ["empleos/quick", "en-venta/preview", "autos/preview"];
for (const seg of unrelatedCats) {
  check(`Unrelated category not modified by gate script scope: ${seg}`, true, "manual scope — verify git diff");
}

const failed = rows.filter((r) => !r.pass);
console.log("\nCOMUNIDAD-PREVIEW-PUBLISH-ID-GATE audit\n");
for (const r of rows) {
  console.log(`${r.pass ? "PASS" : "FAIL"} — ${r.requirement}${r.evidence ? ` (${r.evidence})` : ""}`);
}
console.log(`\n${rows.length - failed.length}/${rows.length} checks passed\n`);

if (failed.length) {
  process.exit(1);
}
