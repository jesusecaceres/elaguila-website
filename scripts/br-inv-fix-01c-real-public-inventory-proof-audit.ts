/**
 * BR-INV-FIX-01C real child inventory publish proof audit.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const AUDIT = "app/(site)/clasificados/bienes-raices/BR_INV_FIX_01C_REAL_PUBLIC_INVENTORY_PROOF_AUDIT.md";
const MAPPER =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/mapping/mapAgenteResidencialFormStateToNegocioForPublish.ts";
const PREFILL = "app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioInventoryQueuePrefill.ts";
const HANDOFF =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioInventoryAddModePreviewHandoff.ts";
const QUEUE = "app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioInventoryPublishQueue.ts";
const POST = "app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioInventoryPostPublishFlow.ts";
const FETCH = "app/(site)/clasificados/bienes-raices/lib/fetchBrRelatedInventoryListingsBrowser.ts";
const RELATED = "app/(site)/clasificados/bienes-raices/components/RelatedBrAgentProperties.tsx";
const POLICY = "app/(site)/clasificados/lib/leonixBrPropertyInventoryPolicy.ts";
const PUBLISH = "app/(site)/clasificados/lib/leonixPublishRealEstateFromDraftState.ts";
const PRIVADO = "app/(site)/clasificados/publicar/bienes-raices/privado";
const RENTAS = "app/(site)/clasificados/rentas";
const AUTOS = "app/(site)/clasificados/autos";

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function run() {
  assert.ok(fs.existsSync(path.join(ROOT, AUDIT.replace(/\//g, path.sep))), "audit doc");
  const audit = read(AUDIT);
  const mapper = read(MAPPER);
  const prefill = read(PREFILL);
  const handoff = read(HANDOFF);
  const queue = read(QUEUE);
  const post = read(POST);
  const fetchRel = read(FETCH);
  const related = read(RELATED);
  const policy = read(POLICY);
  const publish = read(PUBLISH);

  assert.ok(audit.includes("BR-INV-FIX-01C"), "gate name");
  assert.ok(/child add-mode prefill/i.test(audit), "child add-mode prefill");
  assert.ok(/real public URL/i.test(audit), "real public URL");
  assert.ok(/real Leonix Ad ID/i.test(audit), "real Leonix Ad ID");
  assert.ok(audit.includes("br_inventory_group_id"), "br_inventory_group_id");
  assert.ok(audit.includes("br_inventory_parent_listing_id"), "br_inventory_parent_listing_id");
  assert.ok(audit.includes("inventory_role"), "inventory_role");
  assert.ok(/parent public page/i.test(audit), "parent public page");
  assert.ok(/child public page/i.test(audit), "child public page");
  assert.ok(/no fake URLs/i.test(audit), "no fake URLs");
  assert.ok(/no fake Leonix IDs/i.test(audit), "no fake Leonix IDs");
  assert.ok(/BR Privado regression/i.test(audit), "BR Privado regression audit");
  assert.ok(/Rentas regression/i.test(audit), "Rentas regression audit");
  assert.ok(/Autos untouched/i.test(audit), "Autos untouched");

  assert.ok(mapper.includes("additionalInventoryProperties: []"), "child publish clears nested inventory");
  assert.ok(mapper.includes('bio: ""'), "agent bio not polluted by property description");
  assert.ok(mapper.includes("contactChannels"), "contact channels mapped");
  assert.ok(mapper.includes("identityAgente"), "agent identity mapped");
  assert.ok(prefill.includes("applyInventoryDraftToAgenteFormState"), "agente prefill");
  assert.ok(handoff.includes("syncAgenteAddModePreviewHandoff"), "preview handoff");
  assert.ok(handoff.includes("readQueuePrefillForAddMode"), "queue prefill guard");
  assert.ok(queue.includes("readQueuePrefillForAddMode"), "queue prefill export");
  assert.ok(post.includes("leonixLiveAnuncioPath"), "real paths in post publish");
  assert.ok(fetchRel.includes("is_published"), "published-only fetch");
  assert.ok(fetchRel.includes("inventory_property"), "child role filter");
  assert.ok(fetchRel.includes("currentInventoryRole"), "viewer role filter");
  assert.ok(related.includes("leonixLiveAnuncioPath"), "real card hrefs");
  assert.ok(policy.includes("inventoryMetadataForBrNegocioPublish"), "inventory metadata helper");
  assert.ok(publish.includes("publishLeonixListingFromAgenteResidencialDraft"), "agente publish entry");
  assert.ok(publish.includes("mapAgenteResidencialFormStateToNegocioForPublish"), "mapper wired");

  for (const dir of [PRIVADO, RENTAS]) {
    const base = path.join(ROOT, dir.replace(/\//g, path.sep));
    if (!fs.existsSync(base)) continue;
    const walk = (d: string) => {
      for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
        const full = path.join(d, ent.name);
        if (ent.isDirectory()) walk(full);
        else if (/\.(tsx|ts)$/.test(ent.name)) {
          const rel = path.relative(ROOT, full).replace(/\\/g, "/");
          const c = read(rel);
          assert.equal(c.includes("brNegocioInventoryPublishQueue"), false, `${rel} must not import publish queue`);
          assert.equal(c.includes("syncAgenteAddModePreviewHandoff"), false, `${rel} must not import 01C handoff`);
        }
      }
    };
    walk(base);
  }

  const autosBase = path.join(ROOT, AUTOS.replace(/\//g, path.sep));
  if (fs.existsSync(autosBase)) {
    const walkAutos = (d: string) => {
      for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
        const full = path.join(d, ent.name);
        if (ent.isDirectory()) walkAutos(full);
        else if (/\.(tsx|ts)$/.test(ent.name)) {
          const rel = path.relative(ROOT, full).replace(/\\/g, "/");
          const c = read(rel);
          assert.equal(c.includes("brNegocioInventory"), false, `${rel} autos must not reference BR inventory`);
        }
      }
    };
    walkAutos(autosBase);
  }

  console.log("BR-INV-FIX-01C audit OK");
}

run();
