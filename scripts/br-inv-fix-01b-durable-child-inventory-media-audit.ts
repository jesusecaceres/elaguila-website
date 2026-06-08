/**
 * BR-INV-FIX-01B durable child inventory + media persistence audit.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const AUDIT = "app/(site)/clasificados/bienes-raices/BR_INV_FIX_01B_DURABLE_CHILD_INVENTORY_MEDIA_AUDIT.md";
const DRAFT = "app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioAdditionalInventoryDraft.ts";
const PERSIST = "app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioInventoryDraftPersistence.ts";
const MEDIA = "app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/BrNegocioPrePublishInventoryDrawerMedia.tsx";
const PREFILL = "app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioInventoryQueuePrefill.ts";
const QUEUE = "app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioInventoryPublishQueue.ts";
const PREVIEW = "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/previewDraft.ts";
const PRIVADO = "app/(site)/clasificados/publicar/bienes-raices/privado";
const RENTAS = "app/(site)/clasificados/rentas";

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function run() {
  assert.ok(fs.existsSync(path.join(ROOT, AUDIT.replace(/\//g, path.sep))), "audit doc");
  const audit = read(AUDIT);
  const draft = read(DRAFT);
  const persist = read(PERSIST);
  const media = read(MEDIA);
  const prefill = read(PREFILL);
  const queue = read(QUEUE);
  const preview = read(PREVIEW);

  assert.ok(audit.includes("BR-INV-FIX-01B"), "gate name");
  assert.ok(/property-only|Property-only/i.test(audit), "property-only drawer");
  assert.ok(/photoUrls|Child media/i.test(audit), "child photos");
  assert.ok(/tour|brochure|MLS/i.test(audit), "child links");
  assert.ok(/bridge|Persistence/i.test(audit), "persistence");
  assert.ok(/Queue|prefill/i.test(audit), "queue prefill");
  assert.ok(/cover|Cover/i.test(audit), "cover behavior");
  assert.ok(/BR Privado regression/i.test(audit), "BR Privado regression audit");
  assert.ok(/Rentas Privado regression/i.test(audit), "Rentas Privado regression audit");
  assert.ok(/Rentas Negocio regression/i.test(audit), "Rentas Negocio regression audit");
  assert.ok(/child inventory not touched|01A/i.test(audit) || audit.includes("01A"), "lane note");

  assert.ok(draft.includes("photoUrls"), "photoUrls field");
  assert.ok(draft.includes("primaryPhotoIndex"), "primaryPhotoIndex field");
  assert.ok(draft.includes("tourUrl"), "tourUrl field");
  assert.ok(draft.includes("mlsUrl"), "mlsUrl field");
  assert.ok(persist.includes("setChildInventoryMediaBridge"), "media bridge");
  assert.ok(persist.includes("stripChildInventoryForSession"), "session strip");
  assert.ok(media.includes("LeonixRealEstateSortablePhotoStrip"), "photo strip UI");
  assert.ok(prefill.includes("ctaUrlMls"), "agente mls prefill");
  assert.ok(queue.includes("stripChildInventoryForSession"), "queue strip");
  assert.ok(preview.includes("stripChildInventoryForSession"), "preview strip");
  assert.ok(preview.includes("mergeChildInventoryWithMediaBridge"), "preview merge");

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
          assert.equal(c.includes("BrNegocioPrePublishInventoryDrawerMedia"), false, `${rel} must not import child media drawer`);
        }
      }
    };
    walk(base);
  }

  console.log("BR-INV-FIX-01B audit OK");
}

run();
