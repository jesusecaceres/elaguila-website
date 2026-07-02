/**
 * BIENES_ACTIVE_APPLICATION_HARD_REFRESH_DRAFT_HOLDING — code-level contract verifier.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(root, rel));
}

type Row = { requirement: string; pass: boolean; evidence: string };
const rows: Row[] = [];

function check(req: string, pass: boolean, evidence: string) {
  rows.push({ requirement: req, pass, evidence });
}

const previewDraft = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/previewDraft.ts",
);
const app = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/AgenteIndividualResidencialApplication.tsx",
);
const childMap = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioChildInventoryFormMapping.ts",
);
const childDraft = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioAdditionalInventoryDraft.ts",
);
const draftPersist = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioInventoryDraftPersistence.ts",
);
const childApp = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/BrNegocioChildInventoryFullApplication.tsx",
);
const draftMedia = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/brAgenteResDraftMedia.ts",
);

check(
  "Parent preview draft key exists",
  previewDraft.includes("BR_AGENTE_RES_PREVIEW_DRAFT_KEY"),
  "br-negocio-agente-residencial-preview-draft",
);
check(
  "Parent return draft key exists",
  previewDraft.includes("BR_AGENTE_RES_RETURN_KEY"),
  "br-negocio-agente-residencial-return-draft",
);
check(
  "localStorage fallback key exists",
  previewDraft.includes("BR_AGENTE_RES_DRAFT_LS_FALLBACK_KEY"),
  "ls-fallback",
);
check(
  "Bootstrap restores preview draft on cold refresh",
  previewDraft.includes("sessionStorage.getItem(BR_AGENTE_RES_PREVIEW_DRAFT_KEY)"),
  "bootstrap preview restore",
);
check(
  "Bootstrap merges child inventory on restore",
  previewDraft.includes("mergeChildInventoryWithMediaBridge"),
  "bootstrap child merge",
);
check(
  "IDB rehydrate after refresh",
  previewDraft.includes("rehydrateAgenteResDraftMediaFromIdb") &&
    previewDraft.includes("inlineBrAgenteResHeavyMediaFromIdb"),
  "IDB inline on restore",
);
check(
  "Debounced autosave persists active application",
  app.includes("persistAgenteResApplicationDraftQuiet") && app.includes("skipFirstPersistRef"),
  "autosave + skip first wipe",
);
check(
  "Child drafts stored in additionalInventoryProperties",
  previewDraft.includes("additionalInventoryProperties") && draftPersist.includes("stripChildInventoryForSession"),
  "child in parent draft",
);
check(
  "Child media sync helper exists",
  childDraft.includes("syncChildInventoryDraftMedia"),
  "syncChildInventoryDraftMedia",
);
check(
  "Edit rehydrate uses sync + session merge",
  childMap.includes("buildChildInventoryEditorState") &&
    childMap.includes("mergeChildEditorSessionWithDraft"),
  "child mapping",
);
check(
  "Child editor hydrates draft via media bridge on open",
  childApp.includes("mergeChildInventoryWithMediaBridge") &&
    childApp.includes("mergeChildEditorSessionWithDraft"),
  "child full app",
);
check(
  "Stale empty session cannot replace saved draft propertyForm blindly",
  !childApp.includes("propertyForm: session.propertyForm as Partial"),
  "no raw session overwrite",
);
check(
  "Child IDB offload/inline for refresh",
  draftMedia.includes("offloadChildDraft") && draftMedia.includes("inlineChildDraft"),
  "child IDB media",
);
check(
  "Intentional clear helper exists (publish/abandon)",
  previewDraft.includes("clearAgenteIndividualResidencialPublishTempState"),
  "clear on intentional abandon",
);
check(
  "IDB namespace stable (deploy-safe versioning)",
  draftMedia.includes('BR_AGENTE_DRAFT_MEDIA_NAMESPACE = "br-agente-res-v1"'),
  "br-agente-res-v1",
);
check(
  "No Stripe imports in scoped files",
  ![previewDraft, app, childMap, childDraft, draftPersist, childApp, draftMedia].some((s) =>
    /stripe/i.test(s),
  ),
  "no stripe",
);
check(
  "No Supabase imports in scoped files",
  ![previewDraft, app, childMap, childDraft, draftPersist, childApp, draftMedia].some((s) =>
    /@\/app\/lib\/supabase|from \"supabase/.test(s),
  ),
  "no supabase",
);

const priorVerifier = "scripts/bienes-child-inventory-persistence-rehydration-audit.ts";
check("Prior child rehydration verifier present", exists(priorVerifier), priorVerifier);

const pass = rows.filter((r) => r.pass).length;
const fail = rows.length - pass;
for (const r of rows) {
  console.log(`${r.pass ? "PASS" : "FAIL"} — ${r.requirement} (${r.evidence})`);
}
console.log(`\n${pass}/${rows.length} PASS`);
if (fail > 0) process.exit(1);
