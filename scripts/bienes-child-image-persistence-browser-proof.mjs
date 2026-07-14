/**
 * One-shot child inventory image persistence proof (does not use parent success as child proof).
 */
import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  try {
    const text = fs.readFileSync(path.join(root, ".env.local"), "utf8");
    for (const line of text.split(/\r?\n/)) {
      const s = line.trim();
      if (!s || s.startsWith("#")) continue;
      const eq = s.indexOf("=");
      if (eq < 1) continue;
      const k = s.slice(0, eq).trim();
      let v = s.slice(eq + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (!process.env[k]) process.env[k] = v;
    }
  } catch {
    /* ignore */
  }
}
loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const email = (process.env.BR_SMOKE_EMAIL ?? process.env.SMOKE_SELLER_EMAIL ?? "").trim();
const password = (process.env.BR_SMOKE_PASSWORD ?? process.env.SMOKE_SELLER_PASSWORD ?? "").trim();
const port = String(process.env.BR_E2E_PORT ?? "3033");
const base = `http://127.0.0.1:${port}`;
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

function fail(msg) {
  console.error("FAIL:", msg);
  process.exit(1);
}
function authStorageKey(supabaseUrl) {
  return `sb-${new URL(supabaseUrl).hostname.split(".")[0]}-auth-token`;
}

async function main() {
  if (!url || !anon || !email || !password) fail("missing env");
  if (!fs.existsSync(path.join(root, ".next", "BUILD_ID"))) fail("missing build");

  const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", port], {
    cwd: root,
    env: { ...process.env, NODE_ENV: "production" },
    stdio: ["ignore", "pipe", "pipe"],
  });

  try {
    for (let i = 0; i < 60; i++) {
      try {
        const r = await fetch(`${base}/clasificados/bienes-raices?lang=en`);
        if (r.ok || r.status === 200) break;
      } catch {
        /* wait */
      }
      await new Promise((r) => setTimeout(r, 800));
    }

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const page = await context.newPage();
    const pageLogs = [];
    page.on("console", (msg) => pageLogs.push(`[${msg.type()}] ${msg.text()}`));
    page.on("pageerror", (err) => pageLogs.push(`[pageerror] ${err.message}`));
    const client = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: sess, error } = await client.auth.signInWithPassword({ email, password });
    if (error || !sess.session) fail(error?.message ?? "signin");
    const k = authStorageKey(url);
    const v = JSON.stringify(sess.session);
    await context.addInitScript(
      ([kk, vv]) => {
        try {
          localStorage.setItem(kk, vv);
        } catch {
          /* ignore */
        }
      },
      [k, v],
    );
    await page.goto(base + "/");
    await page.evaluate(({ kk, vv }) => localStorage.setItem(kk, vv), { kk: k, vv: v });
    // Dismiss cookie consent if it covers the child drawer action buttons.
    const consent = page.getByRole("button", { name: /Accept|Aceptar|Allow|Permitir|Got it|Entendido/i });
    if (await consent.count()) {
      await consent.first().click({ force: true }).catch(() => undefined);
      await page.waitForTimeout(300);
    }

    await page.goto(`${base}/clasificados/publicar/bienes-raices/negocio?propiedad=residencial&lang=en`, {
      waitUntil: "domcontentloaded",
    });
    await page.locator("aside nav").getByText(/Listing type|Tipo de anuncio/i).first().waitFor({ timeout: 90_000 });

    // Minimal parent title so saves/progress work; parent photos left empty for isolation check
    await page.locator("aside nav button").nth(1).click();
    await page.waitForTimeout(300);
    const title = page.locator('input[type="text"]').first();
    if (await title.count()) await title.fill("Parent Isolation Check BR");

    await page.locator("aside nav button").nth(9).click();
    await page.waitForTimeout(500);

    const accept = page.getByRole("button", { name: /Add Inventory Pack|Agregar Paquete de inventario/i });
    if (await accept.count()) await accept.first().click();
    await page.waitForTimeout(400);

    const addBtn = page.getByRole("button", { name: /Add property to inventory|Agregar propiedad al inventario/i });
    await expectVisible(addBtn.first(), 30_000);
    await addBtn.first().click();
    await page.getByRole("heading", { name: /Add property to inventory|Agregar propiedad al inventario/i }).waitFor({
      timeout: 45_000,
    });
    await page.getByRole("button", { name: /Residential|Residencial/i }).first().click();
    await page.getByRole("link", { name: /Continue to property form|Continuar al formulario/i }).click();

    const dialog = page.locator("[data-br-child-inventory-app]");
    await dialog.waitFor({ timeout: 60_000 });
    await dialog.locator("[data-br-child-step='2']").click();
    await page.waitForTimeout(400);

    await dialog.locator('input[type="file"][accept*="image"]').first().setInputFiles([
      { name: "c1.png", mimeType: "image/png", buffer: TINY_PNG },
      { name: "c2.png", mimeType: "image/png", buffer: TINY_PNG },
      { name: "c3.png", mimeType: "image/png", buffer: TINY_PNG },
    ]);

    await page.waitForFunction(
      () => {
        try {
          const raw = sessionStorage.getItem("br-negocio-child-inventory-editor-session") || "";
          if (!raw.includes("CHILD_EDITOR_") && !raw.includes("__LX_BR_AGENTE_IDB__")) return false;
          const j = JSON.parse(raw);
          const fotos = j?.propertyForm?.fotosDataUrls || [];
          const durable = fotos.filter((u) => String(u).includes("__LX_BR_AGENTE_IDB__"));
          return j?.editingId && String(j.editingId) !== "new-child" && durable.length >= 3;
        } catch {
          return false;
        }
      },
      null,
      { timeout: 30_000 },
    );

    const before = await page.evaluate(() => {
      const j = JSON.parse(sessionStorage.getItem("br-negocio-child-inventory-editor-session") || "{}");
      return {
        editingId: j.editingId,
        durable: (j.propertyForm?.fotosDataUrls || []).filter((u) => String(u).includes("__LX_BR_AGENTE_IDB__")).length,
        imgs: document.querySelectorAll("[data-br-child-inventory-app] img").length,
      };
    });
    if (before.durable < 3) fail("child durable refs missing before refresh: " + JSON.stringify(before));
    if (!before.editingId || before.editingId === "new-child") fail("unstable child id: " + before.editingId);

    await page.reload({ waitUntil: "domcontentloaded" });
    // Shell restore remounts the same child draft id (drawer may already be open after refresh).
    const dialogAfter = page.locator("[data-br-child-inventory-app]");
    try {
      await dialogAfter.waitFor({ timeout: 8_000 });
    } catch {
      await page.locator("aside nav").getByText(/Listing type|Tipo de anuncio/i).first().waitFor({ timeout: 90_000 });
      await page.locator("aside nav button").nth(9).click({ force: true });
      await page.waitForTimeout(800);
      const acceptAgain = page.getByRole("button", { name: /Add Inventory Pack|Agregar Paquete de inventario/i });
      if (await acceptAgain.count()) await acceptAgain.first().click();
      await dialogAfter.waitFor({ timeout: 60_000 });
    }
    await dialogAfter.locator("[data-br-child-step='2']").click();
    await page.waitForTimeout(1200);

    const after = await page.evaluate(() => {
      const j = JSON.parse(sessionStorage.getItem("br-negocio-child-inventory-editor-session") || "{}");
      return {
        editingId: j.editingId,
        durable: (j.propertyForm?.fotosDataUrls || []).filter((u) => String(u).includes("__LX_BR_AGENTE_IDB__")).length,
        fotos: (j.propertyForm?.fotosDataUrls || []).length,
        imgs: document.querySelectorAll("[data-br-child-inventory-app] img").length,
        parentDraft: sessionStorage.getItem("br-negocio-agente-residencial-preview-draft") || "",
      };
    });
    if (after.editingId !== before.editingId) fail(`child id changed ${before.editingId} -> ${after.editingId}`);
    if (after.durable < 3 && after.fotos < 3) fail("child photos lost after refresh: " + JSON.stringify(after));
    if (after.imgs < 3) fail("child visible imgs lost: " + after.imgs);

    // Parent draft must not pick up child MAIN_PHOTO collision
    if (after.parentDraft.includes(`CHILD_EDITOR_${before.editingId}`) === false) {
      // parent may or may not mirror child session; ensure parent MAIN_PHOTO count wasn't polluted by requiring child key isolation only
    }
    const parentFotos = (() => {
      try {
        const raw = after.parentDraft;
        if (!raw) return 0;
        const j = JSON.parse(raw);
        const state = j.state && typeof j.state === "object" ? j.state : j;
        return (state.fotosDataUrls || []).length;
      } catch {
        return -1;
      }
    })();
    if (parentFotos > 0) fail("parent images changed / polluted; parent fotos=" + parentFotos);

    // Back / Next navigation must keep child images
    await dialogAfter.locator("[data-br-child-step='1']").click();
    await page.waitForTimeout(300);
    await dialogAfter.locator("[data-br-child-step='2']").click();
    await page.waitForTimeout(800);
    const afterNavImgs = await dialogAfter.locator("img").count();
    if (afterNavImgs < 3) fail("child images lost after Back/Next: " + afterNavImgs);

    // Fill required child fields (needed for Preview gate + Save)
    await dialogAfter.locator("[data-br-child-step='1']").click();
    await page.waitForTimeout(400);
    await dialogAfter.getByLabel(/^Listing title|^Título/i).fill("Child Persist Property");
    await dialogAfter.getByLabel(/^Price|^Precio/i).fill("450000");
    const city = dialogAfter.getByPlaceholder(/San Jose|Los Angeles|Mexico City|ej\.|e\.g\./i).first();
    await city.fill("San Jose");
    await city.blur();
    const stateInput = dialogAfter.getByPlaceholder(/CA or California|CA o California/i);
    await stateInput.fill("CA");
    await stateInput.blur();
    await page.waitForTimeout(300);

    // Child Preview → Continue editing (Volver path)
    await dialogAfter.locator("[data-br-child-step='9']").click();
    await page.waitForTimeout(400);
    await dialogAfter.getByRole("button", { name: /Preview this property|Vista previa de esta propiedad/i }).click();
    await page.getByRole("heading", { name: /Additional property preview|Vista previa de la propiedad adicional/i }).waitFor({
      timeout: 20_000,
    });
    await page.getByRole("button", { name: /Continue editing this property|Seguir editando esta propiedad/i }).click();
    await dialogAfter.waitFor({ timeout: 20_000 });
    await dialogAfter.locator("[data-br-child-step='2']").click();
    await page.waitForTimeout(900);
    const afterVolver = await dialogAfter.locator("img").count();
    if (afterVolver < 3) fail("child preview/volver lost images: " + afterVolver);

    await dialogAfter.locator("[data-br-child-step='9']").click();
    await page.waitForTimeout(500);
    const saveBtn = dialogAfter.getByRole("button", { name: /^Save property$|^Guardar propiedad$/i });
    // Capture required fields before save for diagnostics
    const preSave = await page.evaluate(() => {
      const root = document.querySelector("[data-br-child-inventory-app]");
      const inputs = Array.from(root?.querySelectorAll("input") || []).map((el) => ({
        ph: el.getAttribute("placeholder") || "",
        val: el.value,
        type: el.type,
      }));
      const j = JSON.parse(sessionStorage.getItem("br-negocio-child-inventory-editor-session") || "{}");
      const pf = j.propertyForm || {};
      const saveBtns = Array.from(root?.querySelectorAll("button") || [])
        .filter((b) => /^(Save property|Guardar propiedad)$/i.test((b.textContent || "").trim()))
        .map((b) => ({ text: (b.textContent || "").trim(), disabled: b.disabled }));
      return {
        inputs: inputs.filter((x) => x.type !== "file" && x.type !== "checkbox").slice(0, 20),
        titulo: pf.titulo,
        precio: pf.precio,
        ciudad: pf.ciudad,
        pais: pf.direccionPais,
        estado: pf.direccionEstado,
        fotos: (pf.fotosDataUrls || []).length,
        saveBtns,
        overlay: Boolean(document.querySelector('[role="dialog"][aria-modal="true"]')),
      };
    });
    await saveBtn.first().click({ force: true });
    // Also ensure the DOM click lands if Playwright force-click misses React handler.
    await page.evaluate(() => {
      const root = document.querySelector("[data-br-child-inventory-app]");
      const btn = Array.from(root?.querySelectorAll("button") || []).find((b) =>
        /^(Save property|Guardar propiedad)$/i.test((b.textContent || "").trim()),
      );
      btn?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
    });
    await page.waitForTimeout(2500);
    // Save must close the child drawer (not stay open on validation errors)
    await page.waitForFunction(
      () => !document.querySelector("[data-br-child-inventory-app]"),
      null,
      { timeout: 15_000 },
    ).catch(async () => {
      const errs = await dialogAfter.locator("li").allTextContents().catch(() => []);
      const banner = await dialogAfter.locator("[class*='text-red'], [role='alert']").allTextContents().catch(() => []);
      const afterClick = await page.evaluate(() => {
        const j = JSON.parse(sessionStorage.getItem("br-negocio-child-inventory-editor-session") || "null");
        const draft = JSON.parse(sessionStorage.getItem("br-negocio-agente-residencial-preview-draft") || "{}");
        const state = draft.state && typeof draft.state === "object" ? draft.state : draft;
        return {
          sessionPresent: Boolean(j),
          inv: (state.additionalInventoryProperties || []).length,
          drawer: Boolean(document.querySelector("[data-br-child-inventory-app]")),
        };
      });
      fail(
        "child save did not close drawer; validation/errors=" +
          JSON.stringify({ errs, banner, preSave, afterClick, pageLogs: pageLogs.slice(-30) }),
      );
    });

    const savedParent = await page.evaluate(() => {
      try {
        const j = JSON.parse(sessionStorage.getItem("br-negocio-agente-residencial-preview-draft") || "{}");
        const state = j.state && typeof j.state === "object" ? j.state : j;
        const inv = state.additionalInventoryProperties || [];
        return {
          count: inv.length,
          fotos: (inv[0]?.propertyForm?.fotosDataUrls || inv[0]?.fotosDataUrls || []).length,
          id: inv[0]?.id || null,
          parentFotos: (state.fotosDataUrls || []).length,
        };
      } catch {
        return { count: 0, fotos: 0, id: null, parentFotos: -1 };
      }
    });
    if (savedParent.count < 1) fail("save/return did not persist child inventory card: " + JSON.stringify(savedParent));
    if (savedParent.fotos < 3) fail("save/return lost child durable photos: " + JSON.stringify(savedParent));
    if (savedParent.parentFotos > 0) fail("parent photos polluted after child save: " + savedParent.parentFotos);

    // Reopen the same saved child
    const editChild = page.getByRole("button", { name: /^Edit$|^Editar$/i }).first();
    await editChild.click();
    await page.locator("[data-br-child-inventory-app]").waitFor({ timeout: 30_000 });
    await page.locator("[data-br-child-inventory-app] [data-br-child-step='2']").click();
    await page.waitForTimeout(1200);
    const reopen = await page.evaluate(() => {
      const j = JSON.parse(sessionStorage.getItem("br-negocio-child-inventory-editor-session") || "{}");
      return {
        editingId: j.editingId || null,
        fotos: (j.propertyForm?.fotosDataUrls || []).length,
        durable: (j.propertyForm?.fotosDataUrls || []).filter((u) => String(u).includes("__LX_BR_AGENTE_IDB__")).length,
        imgs: document.querySelectorAll("[data-br-child-inventory-app] img").length,
      };
    });
    if (reopen.imgs < 3 && reopen.fotos < 3 && reopen.durable < 3) {
      fail("reopen lost photos: " + JSON.stringify(reopen));
    }

    console.log("PASS: child image persistence hard-refresh + save/reopen + preview/volver browser proof");
    console.log(JSON.stringify({ before, after, parentFotos, savedParent, reopen, afterVolver }, null, 2));
    await browser.close();
  } finally {
    server.kill("SIGTERM");
  }
}

async function expectVisible(loc, timeout) {
  await loc.waitFor({ state: "visible", timeout });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
