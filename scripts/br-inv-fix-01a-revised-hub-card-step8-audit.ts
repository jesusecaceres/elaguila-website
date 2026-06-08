/**
 * BR-INV-FIX-01A-REVISED hub card + Step 8 audit (no DB/network).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const AUDIT = "app/(site)/clasificados/bienes-raices/BR_INV_FIX_01A_REVISED_HUB_CARD_STEP8_AUDIT.md";
const SIDEBAR = "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/BrAgenteResContactSidebar.tsx";
const DETECTED = "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/lib/agenteResidencialDetectedActions.ts";
const FORMAT = "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/lib/agenteResidencialPreviewFormat.ts";
const STEP8 = "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/sections/steps04-09.tsx";
const PRIVADO = "app/(site)/clasificados/publicar/bienes-raices/privado";
const RENTAS = "app/(site)/clasificados/rentas";

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function run() {
  assert.ok(fs.existsSync(path.join(ROOT, AUDIT.replace(/\//g, path.sep))), "audit doc");
  const audit = read(AUDIT);
  const sidebar = read(SIDEBAR);
  const detected = read(DETECTED);
  const format = read(FORMAT);
  const step8 = read(STEP8);

  assert.ok(audit.includes("BR-INV-FIX-01A-REVISED"), "gate name");
  assert.ok(/Business Hub blueprint/i.test(audit), "Business Hub blueprint");
  assert.ok(/Leonix brand system/i.test(audit), "Leonix brand system");
  assert.ok(/Main agent|Agente principal/i.test(audit), "main agent");
  assert.ok(/Office|Broker|Oficina/i.test(audit), "office/brokerage");
  assert.ok(/Second agent|Segundo agente/i.test(audit), "second agent limited");
  assert.ok(/Financing|Financiamiento/i.test(audit), "financing limited");
  assert.ok(/Google/i.test(audit), "Google reviews");
  assert.ok(/Yelp/i.test(audit), "Yelp");
  assert.ok(/Snapchat/i.test(audit), "Snapchat");
  assert.ok(/Step 8|data-driven|detected/i.test(audit), "Step 8 data-driven");
  assert.ok(/duplicate social/i.test(audit), "duplicate social rows");
  assert.ok(/BR Privado regression/i.test(audit), "BR Privado regression");
  assert.ok(/Rentas Privado regression/i.test(audit), "Rentas Privado regression");
  assert.ok(/Rentas Negocio regression/i.test(audit), "Rentas Negocio regression");
  assert.ok(/child inventory not touched|Child inventory drawer/i.test(audit), "child inventory untouched");

  assert.ok(sidebar.includes("mainAgentLabel") || sidebar.includes("Agente principal"), "main agent card");
  assert.ok(sidebar.includes("quickActionsLabel") || sidebar.includes("Acciones"), "quick actions");
  assert.ok(format.includes("buildMainAgentBusinessHub"), "business hub builder");
  assert.ok(format.includes("googleReviewsUrl"), "google field");
  assert.ok(detected.includes("detectAgenteResBuyerActions"), "detected actions");
  assert.ok(step8.includes("detectAgenteResBuyerActions"), "Step 8 uses detected");
  assert.equal(step8.includes('type="checkbox"') && step8.includes("permitirLlamar"), false, "no checkbox wall");

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
          assert.equal(c.includes("BrAgenteResContactSidebar"), false, `${rel} must not import sidebar`);
          assert.equal(c.includes("detectAgenteResBuyerActions"), false, `${rel} must not import detected`);
        }
      }
    };
    walk(base);
  }

  console.log("BR-INV-FIX-01A-REVISED audit OK");
}

run();
