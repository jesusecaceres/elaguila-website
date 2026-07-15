import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

const previewDraft = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/previewDraft.ts",
);
const media = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/brAgenteResDraftMedia.ts",
);
const idb = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/brAgenteResDraftMediaIdb.ts",
);
const app = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/AgenteIndividualResidencialApplication.tsx",
);
const preview = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialPreviewClient.tsx",
);
const childSession = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioChildInventoryEditorSession.ts",
);

assert.match(previewDraft, /BR_AGENTE_RES_APPLICATION_INSTANCE_QUERY_PARAM\s*=\s*"applicationInstanceId"/, "applicationInstanceId query param exists");
assert.match(previewDraft, /ensureBrAgenteResApplicationInstanceId/, "applicationInstanceId resolver exists");
assert.match(previewDraft, /withBrAgenteResApplicationInstanceParam/, "Preview/return URL carries applicationInstanceId");
assert.match(previewDraft, /previewKey:\s*`\$\{BR_AGENTE_RES_PREVIEW_DRAFT_KEY\}:\$\{applicationInstanceId\}`/, "parent preview key is namespaced");
assert.match(previewDraft, /returnKey:\s*`\$\{BR_AGENTE_RES_RETURN_KEY\}:\$\{applicationInstanceId\}`/, "return key is namespaced");
assert.match(previewDraft, /fallbackKey:\s*`\$\{BR_AGENTE_RES_DRAFT_LS_FALLBACK_KEY\}:\$\{applicationInstanceId\}`/, "fallback/inventory key is namespaced");
assert.match(previewDraft, /mediaNamespace:\s*brAgenteDraftMediaNamespaceForApplicationInstance\(applicationInstanceId\)/, "media namespace is namespaced");
assert.match(media, /BR_AGENTE_DRAFT_MEDIA_NAMESPACE = "br-agente-res-v1"/, "legacy media namespace constant retained for migration");
assert.match(media, /`\$\{BR_AGENTE_DRAFT_MEDIA_NAMESPACE\}:\$\{id\}`/, "parent/child media namespace derives from applicationInstanceId");
assert.match(childSession, /childInventoryEditorSessionKey\(\)/, "child editor session key is namespace-aware");
assert.match(childSession, /getActiveBrAgenteDraftMediaNamespace\(\)/, "child editor IDB uses active application namespace");
assert.match(previewDraft, /migrateLegacyAgenteResDraftIntoApplicationNamespace/, "legacy migration exists");
assert.match(previewDraft, /inlineBrAgenteResHeavyMediaFromIdb\(BR_AGENTE_DRAFT_MEDIA_NAMESPACE,\s*legacyState\)/, "legacy media is recovered before migration");
assert.match(previewDraft, /persistAgenteResApplicationDraftResolved\(merged,\s*\{[\s\S]*applicationInstanceId/, "legacy draft is copied into namespaced storage");
assert.doesNotMatch(previewDraft, /deleteDatabase/, "no IndexedDB database deletion in draft helper");
assert.doesNotMatch(idb, /deleteDatabase/, "no IndexedDB database deletion in IDB helper");

const bootstrapStart = previewDraft.indexOf("export function bootstrapAgenteIndividualResidencialApplicationState(");
const bootstrapEnd = previewDraft.indexOf("// C — Brand-new application", bootstrapStart);
const bootstrapClose = previewDraft.indexOf("return createEmptyAgenteIndividualResidencialState();", bootstrapEnd);
const bootstrapFn = previewDraft.slice(bootstrapStart, bootstrapClose + 80);
assert.ok(bootstrapFn.includes("clearAgenteResApplicationMemoryOnly()"), "new application clears memory only");
assert.doesNotMatch(bootstrapFn, /clearAgenteIndividualResidencialPublishTempState\(/, "new application bootstrap does not clear storage");
assert.doesNotMatch(bootstrapFn, /clearBrAgenteResDraftMediaNamespace/, "new application bootstrap does not clear IDB namespace");

assert.match(app, /ensureBrAgenteResApplicationInstanceId\(searchParams\)/, "application creates/resolves stable instance id");
assert.match(app, /qs\.set\(BR_AGENTE_RES_APPLICATION_INSTANCE_QUERY_PARAM,\s*applicationInstanceId\)/, "application writes identity param");
assert.match(app, /router\.replace\(/, "application replaces URL with scoped identity");
assert.match(app, /persistAgenteResApplicationDraftResolved\(state,\s*\{\s*applicationInstanceId,\s*writeReturn:\s*true\s*}\)/, "preview save is scoped");
assert.match(app, /flushAgenteResDraftSyncForUnload\(state,\s*\{\s*applicationInstanceId\s*}\)/, "hard refresh flush is scoped");
assert.match(app, /BR_AGENTE_RES_PREVIEW_ROUTE/, "application opens agente preview route");
assert.match(preview, /loadAgenteResPreviewDraftResolved\(\{\s*applicationInstanceId\s*}\)/, "preview reads scoped draft");
assert.match(preview, /withBrAgenteResApplicationInstanceParam/, "Volver a editar keeps scoped identity");

console.log("verify-bienes-application-instance-isolation-01: PASS");
