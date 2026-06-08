/**
 * BR-INV-E-FAST Bienes Raices real inventory publish queue audit (no DB/network).
 * Run: npm run br:inv-e-fast-audit
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");
const AUDIT = "app/(site)/clasificados/bienes-raices/BR_INV_E_FAST_REAL_PUBLISH_QUEUE_AUDIT.md";
const QUEUE = "app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioInventoryPublishQueue.ts";
const PREFILL = "app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioInventoryQueuePrefill.ts";
const FLOW = "app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioInventoryPostPublishFlow.ts";
const BRIDGE = "app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/BrNegocioInventoryPublishBridgePanel.tsx";
const BRIDGE_COPY = "app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioInventoryPublishBridgeCopy.ts";
const ADD_FLOW = "app/(site)/clasificados/lib/leonixBrPropertyInventoryAddFlow.ts";
const PRIVADO = "app/(site)/clasificados/publicar/bienes-raices/privado";
const RENTAS = "app/(site)/clasificados/rentas";

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(ROOT, rel.replace(/\//g, path.sep)));
}

function run() {
  assert.ok(exists(AUDIT), "BR-INV-E-FAST audit doc must exist");
  assert.ok(exists(QUEUE), "Queue helper must exist");
  assert.ok(exists(PREFILL), "Prefill helper must exist");
  assert.ok(exists(FLOW), "Post-publish flow helper must exist");
  assert.ok(exists(BRIDGE), "Bridge panel must exist");

  const audit = read(AUDIT);
  const queue = read(QUEUE);
  const prefill = read(PREFILL);
  const flow = read(FLOW);
  const bridge = read(BRIDGE);
  const bridgeCopy = read(BRIDGE_COPY);
  const addFlow = read(ADD_FLOW);

  assert.ok(audit.includes("BR-INV-E-FAST"), "Gate title required");
  assert.ok(/existing add-mode|inventoryMode=add/i.test(audit), "Existing add-mode documented");
  assert.ok(/queue|Queue storage/i.test(audit), "Queue documented");
  assert.ok(/Main publish bridge|bridge panel/i.test(audit), "Main publish bridge documented");
  assert.ok(/Child prefill|prefill/i.test(audit), "Child prefill documented");
  assert.ok(/Child publish/i.test(audit), "Child publish documented");
  assert.ok(/RelatedBrAgentProperties|related inventory/i.test(audit), "Public related inventory documented");
  assert.ok(/No fake listing|No fake URLs|no fake Leonix/i.test(audit), "No fake IDs/URLs claims required");
  assert.ok(/No Supabase|no Supabase writes/i.test(audit), "No Supabase queue writes claim");
  assert.ok(/No schema\/migration|no schema/i.test(audit), "No schema/migration claim");
  assert.ok(audit.includes("BR Privado"), "BR Privado untouched required");
  assert.ok(/Rentas.*FALSE|Rentas untouched/i.test(audit), "Rentas untouched required");

  assert.ok(queue.includes("createQueueAfterMainPublish"), "createQueueAfterMainPublish required");
  assert.ok(queue.includes("advanceQueue"), "advanceQueue required");
  assert.ok(queue.includes("sessionStorage"), "sessionStorage queue required");
  assert.equal(/leonix_ad_id|fakeListingId/i.test(queue), false, "Queue must not store fake Leonix/listing IDs");

  assert.ok(prefill.includes("applyInventoryDraftToAgenteFormState"), "Agente prefill required");
  assert.ok(prefill.includes("applyInventoryDraftToNegocioFormState"), "Negocio prefill required");

  assert.ok(flow.includes("handleMainPublishWithOptionalQueue"), "Main queue handler required");
  assert.ok(flow.includes("handleQueuedChildPublishSuccess"), "Child queue handler required");
  assert.ok(flow.includes("inventoryMode=add") || flow.includes("prepareNextQueuedChildNavigation"), "Add-mode navigation required");

  assert.ok(
    bridgeCopy.includes("Publish next property") || bridgeCopy.includes("Publicar siguiente propiedad"),
    "Publish next CTA required",
  );
  assert.ok(
    bridgeCopy.includes("View main listing") || bridgeCopy.includes("Ver anuncio principal"),
    "View main listing CTA required",
  );

  assert.ok(addFlow.includes("inventoryMode"), "Existing add-mode flow file intact");

  for (const dir of [PRIVADO, RENTAS]) {
    if (!fs.existsSync(path.join(ROOT, dir.replace(/\//g, path.sep)))) continue;
    const walk = (base: string) => {
      for (const ent of fs.readdirSync(base, { withFileTypes: true })) {
        const full = path.join(base, ent.name);
        if (ent.isDirectory()) walk(full);
        else if (ent.name.endsWith(".tsx") || ent.name.endsWith(".ts")) {
          const rel = path.relative(ROOT, full).replace(/\\/g, "/");
          const content = read(rel);
          assert.equal(content.includes("brNegocioInventoryPublishQueue"), false, `${rel} must not import queue`);
          assert.equal(content.includes("BrNegocioInventoryPublishBridgePanel"), false, `${rel} must not import bridge`);
        }
      }
    };
    walk(path.join(ROOT, dir.replace(/\//g, path.sep)));
  }

  console.log("BR-INV-E-FAST audit doc OK");
  console.log("Queue + add-mode + bridge + prefill OK");
  console.log("No fake IDs / no schema claims OK");
  console.log("BR Privado / Rentas untouched OK");
}

run();
