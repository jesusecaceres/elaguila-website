/**
 * One-shot Playwright proof: upload 3 images → hard refresh → Preview → Volver.
 * Uses authenticated smoke seller (BR_SMOKE_* / SMOKE_SELLER_*).
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
const port = String(process.env.BR_E2E_PORT ?? "3031");
const base = `http://127.0.0.1:${port}`;

function authStorageKey(supabaseUrl) {
  const ref = new URL(supabaseUrl).hostname.split(".")[0];
  return `sb-${ref}-auth-token`;
}

const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

function fail(msg) {
  console.error("FAIL:", msg);
  process.exit(1);
}

async function waitForDurablePhotos(page, min = 3) {
  await page.waitForFunction(
    (n) => {
      try {
        const raw =
          sessionStorage.getItem("br-negocio-agente-residencial-preview-draft") ||
          localStorage.getItem("br-negocio-agente-residencial-draft-ls-fallback") ||
          "";
        if (!raw.includes("__LX_BR_AGENTE_IDB__")) return false;
        const j = JSON.parse(raw);
        const state = j.state && typeof j.state === "object" ? j.state : j;
        const fotos = Array.isArray(state.fotosDataUrls) ? state.fotosDataUrls : [];
        return fotos.filter((u) => typeof u === "string" && u.includes("__LX_BR_AGENTE_IDB__")).length >= n;
      } catch {
        return false;
      }
    },
    min,
    { timeout: 30_000 },
  );
}

async function photoStats(page) {
  return page.evaluate(() => {
    const raw =
      sessionStorage.getItem("br-negocio-agente-residencial-preview-draft") ||
      localStorage.getItem("br-negocio-agente-residencial-draft-ls-fallback") ||
      "";
    const j = JSON.parse(raw);
    const state = j.state && typeof j.state === "object" ? j.state : j;
    return {
      fotos: Array.isArray(state.fotosDataUrls) ? state.fotosDataUrls.length : 0,
      durable: (state.fotosDataUrls || []).filter((u) => String(u).includes("__LX_BR_AGENTE_IDB__")).length,
      imgs: document.querySelectorAll("img").length,
    };
  });
}

async function main() {
  if (!url || !anon || !email || !password) fail("missing Supabase/smoke env");
  if (!fs.existsSync(path.join(root, ".next", "BUILD_ID"))) fail("missing .next build — run npm run build first");

  const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", port], {
    cwd: root,
    env: { ...process.env, NODE_ENV: "production" },
    stdio: ["ignore", "pipe", "pipe"],
  });

  try {
    for (let i = 0; i < 60; i++) {
      try {
        const r = await fetch(`${base}/clasificados/bienes-raices?lang=en`);
        if (r.ok || r.status === 200 || r.status === 304) break;
      } catch {
        /* wait */
      }
      await new Promise((r) => setTimeout(r, 1000));
    }

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const page = await context.newPage();

    const browserAnon = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: sess, error: sErr } = await browserAnon.auth.signInWithPassword({ email, password });
    if (sErr || !sess.session) fail(sErr?.message ?? "sign-in failed");
    const storageKey = authStorageKey(url);
    const persisted = JSON.stringify(sess.session);
    await context.addInitScript(
      ([k, v]) => {
        try {
          localStorage.setItem(k, v);
        } catch {
          /* ignore */
        }
      },
      [storageKey, persisted],
    );
    await page.goto(base + "/");
    await page.evaluate(
      ({ k, v }) => {
        localStorage.setItem(k, v);
      },
      { k: storageKey, v: persisted },
    );

    await page.goto(`${base}/clasificados/publicar/bienes-raices/negocio?propiedad=residencial&lang=en`, {
      waitUntil: "domcontentloaded",
    });
    await page.locator("aside nav").getByText(/Listing type|Tipo de anuncio/i).first().waitFor({ timeout: 90_000 });
    await page.locator("aside nav button").nth(2).click();
    await page.waitForTimeout(400);

    const fileInput = page.locator('input[type="file"][accept*="image"]').first();
    await fileInput.setInputFiles([
      { name: "p1.png", mimeType: "image/png", buffer: TINY_PNG },
      { name: "p2.png", mimeType: "image/png", buffer: TINY_PNG },
      { name: "p3.png", mimeType: "image/png", buffer: TINY_PNG },
    ]);
    await waitForDurablePhotos(page, 3);

    const before = await page.locator("img").count();
    if (before < 3) fail(`expected >=3 visible images before refresh, got ${before}`);

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.locator("aside nav").getByText(/Listing type|Tipo de anuncio/i).first().waitFor({ timeout: 90_000 });
    await page.locator("aside nav button").nth(2).click();
    await page.waitForTimeout(800);
    const afterRefresh = await photoStats(page);
    if (afterRefresh.fotos < 3 || afterRefresh.durable < 3 || afterRefresh.imgs < 3) {
      fail(`hard refresh failed ${JSON.stringify(afterRefresh)}`);
    }

    await page.evaluate(() => {
      const raw = sessionStorage.getItem("br-negocio-agente-residencial-preview-draft");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const state = parsed.state && typeof parsed.state === "object" ? parsed.state : parsed;
      sessionStorage.setItem(
        "br-negocio-agente-residencial-return-draft",
        JSON.stringify({ state, savedAt: Date.now() }),
      );
    });
    await page.goto(`${base}/clasificados/bienes-raices/preview/negocio?lang=en`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(2000);
    const previewImgs = await page.locator("img").count();
    if (previewImgs < 1) fail(`preview missing images (count=${previewImgs})`);

    const volver = page
      .getByRole("link", { name: /Volver a editar|Back to edit|Return to edit|Continue editing/i })
      .or(page.getByRole("button", { name: /Volver a editar|Back to edit|Continue editing/i }));
    if (await volver.count()) {
      await volver.first().click();
    } else {
      await page.goto(`${base}/clasificados/publicar/bienes-raices/negocio?propiedad=residencial&lang=en`, {
        waitUntil: "domcontentloaded",
      });
    }
    await page.locator("aside nav").getByText(/Listing type|Tipo de anuncio/i).first().waitFor({ timeout: 90_000 });
    await page.locator("aside nav button").nth(2).click();
    await page.waitForTimeout(1000);
    const afterVolver = await photoStats(page);
    if (afterVolver.fotos < 3 || afterVolver.durable < 3 || afterVolver.imgs < 3) {
      fail(`volver failed ${JSON.stringify(afterVolver)}`);
    }

    console.log("PASS: bienes image persistence hard-refresh + preview + volver browser proof");
    console.log(JSON.stringify({ beforeImgs: before, afterRefresh, previewImgs, afterVolver }, null, 2));
    await browser.close();
  } finally {
    server.kill("SIGTERM");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
