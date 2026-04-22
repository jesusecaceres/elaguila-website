/**
 * Servicios HTTP smoke: spawns `next start`, curls happy/failure paths (no auth).
 * Prerequisite: `npm run build` must have produced `.next/BUILD_ID`.
 *
 * Uses `SERVICIOS_DEV_PUBLISH=1` so `next start` (production Node) can persist publishes
 * to `.servicios-dev-publishes.json` for discovery SSR without Supabase.
 *
 * Usage: `node scripts/servicios-http-smoke.mjs`
 */
import { spawn } from "node:child_process";
import * as fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const port = Number(process.env.SERVICIOS_SMOKE_PORT || "3015");
const buildIdPath = path.join(repoRoot, ".next", "BUILD_ID");
const fixturePath = path.join(repoRoot, "scripts", "fixtures", "servicios-smoke-publish-state.json");

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let body = "";
      res.on("data", (c) => {
        body += c;
      });
      res.on("end", () => resolve({ status: res.statusCode ?? 0, body }));
    });
    req.on("error", reject);
    req.setTimeout(25_000, () => {
      req.destroy(new Error(`timeout: ${url}`));
    });
  });
}

function httpPostJson(url, jsonBody) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const opts = {
      hostname: u.hostname,
      port: u.port || 80,
      path: u.pathname + u.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(jsonBody),
      },
    };
    const req = http.request(opts, (res) => {
      let body = "";
      res.on("data", (c) => {
        body += c;
      });
      res.on("end", () => resolve({ status: res.statusCode ?? 0, body }));
    });
    req.on("error", reject);
    req.setTimeout(25_000, () => {
      req.destroy(new Error(`timeout: ${url}`));
    });
    req.write(jsonBody);
    req.end();
  });
}

async function waitForReady(base, maxMs) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const r = await httpGet(`${base}/clasificados/servicios`);
      if (r.status === 200) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server did not become ready within ${maxMs}ms`);
}

async function main() {
  if (!fs.existsSync(buildIdPath)) {
    console.error("Missing .next/BUILD_ID — run `npm run build` first.");
    process.exit(1);
  }
  if (!fs.existsSync(fixturePath)) {
    console.error("Missing fixture:", fixturePath);
    process.exit(1);
  }

  const nextBin = path.join(repoRoot, "node_modules", "next", "dist", "bin", "next");
  const child = spawn(process.execPath, [nextBin, "start", "-p", String(port)], {
    cwd: repoRoot,
    env: {
      ...process.env,
      NODE_ENV: "production",
      SERVICIOS_DEV_PUBLISH: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stderr = "";
  child.stderr?.on("data", (d) => {
    stderr += String(d);
  });

  const base = `http://127.0.0.1:${port}`;
  try {
    await waitForReady(base, 90_000);

    const analyticsNullSlug = await httpPostJson(
      `${base}/api/clasificados/servicios/analytics`,
      JSON.stringify({ eventType: "filter_change", listingSlug: null, meta: { smoke: "servicios-http-smoke" } }),
    );
    if (analyticsNullSlug.status === 200) {
      let aj = { ok: false };
      try {
        aj = JSON.parse(analyticsNullSlug.body);
      } catch {
        /* */
      }
      if (!aj.ok) {
        console.warn(
          "[servicios-smoke] POST analytics filter_change + null listingSlug returned { ok: false } — remote DB may still require migration 20260422190000_servicios_analytics_slug_nullable.sql (listing_slug NOT NULL).",
        );
      } else {
        console.log("OK POST analytics filter_change with null listingSlug (200, ok=true)");
      }
    } else {
      console.warn(`[servicios-smoke] analytics null-slug probe: status=${analyticsNullSlug.status} (expected 503 if Supabase unset)`);
    }

    const publishUrl = `${base}/api/clasificados/servicios/publish`;

    /** @type {Array<[string, string, () => Promise<{status:number, body:string}>, (r:{status:number, body:string}) => boolean]>} */
    const checks = [
      ["GET landing", `${base}/clasificados/servicios`, async () => httpGet(`${base}/clasificados/servicios`), (r) => r.status === 200],
      ["GET resultados", `${base}/clasificados/servicios/resultados`, async () => httpGet(`${base}/clasificados/servicios/resultados`), (r) => r.status === 200],
      [
        "GET resultados junk params (no 500)",
        `${base}/clasificados/servicios/resultados?legal=xyz&msg=2&foo=bar`,
        async () => httpGet(`${base}/clasificados/servicios/resultados?legal=xyz&msg=2&foo=bar`),
        (r) => r.status === 200,
      ],
      ["GET publish app", `${base}/clasificados/publicar/servicios`, async () => httpGet(`${base}/clasificados/publicar/servicios`), (r) => r.status === 200],
      ["POST publish empty body → 400", publishUrl, async () => httpPostJson(publishUrl, "{}"), (r) => r.status === 400],
      [
        "POST publish missing state → 400",
        publishUrl,
        async () => httpPostJson(publishUrl, JSON.stringify({ lang: "es" })),
        (r) => r.status === 400,
      ],
      [
        "POST publish incomplete → 422",
        publishUrl,
        async () =>
          httpPostJson(
            publishUrl,
            JSON.stringify({
              lang: "es",
              state: { businessName: "X", city: "", confirmCommunityRules: false },
            }),
          ),
        (r) => r.status === 422,
      ],
      [
        "POST analytics (needs Supabase) — 400 invalid event or 503",
        `${base}/api/clasificados/servicios/analytics`,
        async () =>
          httpPostJson(
            `${base}/api/clasificados/servicios/analytics`,
            JSON.stringify({ eventType: "not_a_real_event", listingSlug: "abc" }),
          ),
        (r) => r.status === 400 || r.status === 503,
      ],
      [
        "POST inquiry invalid email → 400",
        `${base}/api/clasificados/servicios/inquiry`,
        async () =>
          httpPostJson(
            `${base}/api/clasificados/servicios/inquiry`,
            JSON.stringify({
              listingSlug: "test-slug",
              senderName: "AB",
              senderEmail: "bad",
              message: "1234567890",
            }),
          ),
        (r) => r.status === 400 || r.status === 503,
      ],
      [
        "POST review invalid rating → 400",
        `${base}/api/clasificados/servicios/review`,
        async () =>
          httpPostJson(
            `${base}/api/clasificados/servicios/review`,
            JSON.stringify({
              listingSlug: "test-slug",
              authorName: "AB",
              body: "123456789012",
              rating: 99,
            }),
          ),
        (r) => r.status === 400 || r.status === 503,
      ],
      [
        "POST manage no auth",
        `${base}/api/clasificados/servicios/manage`,
        async () => httpPostJson(`${base}/api/clasificados/servicios/manage`, JSON.stringify({ slug: "x", action: "pause" })),
        (r) => r.status === 401 || r.status === 503,
      ],
    ];

    for (const [label, url, fn, okFn] of checks) {
      const r = await fn();
      if (!okFn(r)) {
        throw new Error(`${label} failed: status=${r.status} url=${url} bodyHead=${JSON.stringify(r.body?.slice(0, 200))}`);
      }
      console.log(`OK ${label} (${r.status})`);
    }

    const rawFixture = fs.readFileSync(fixturePath, "utf8");
    const state = JSON.parse(rawFixture);
    state.businessName = `SmokeTest Plumbing ${Date.now()}`;
    const pubRes = await httpPostJson(publishUrl, JSON.stringify({ state, lang: "es" }));
    if (pubRes.status !== 200) {
      throw new Error(`POST publish happy path failed: status=${pubRes.status} body=${pubRes.body?.slice(0, 400)}`);
    }
    const pubJson = JSON.parse(pubRes.body);
    if (!pubJson.ok || !pubJson.slug) {
      throw new Error(`POST publish happy path bad JSON: ${pubRes.body?.slice(0, 400)}`);
    }
    const slug = String(pubJson.slug);
    console.log(`OK POST publish happy path → slug=${slug} persistence=${pubJson.persistence}`);

    const detail = await httpGet(`${base}/clasificados/servicios/${encodeURIComponent(slug)}?lang=es`);
    if (detail.status !== 200) {
      throw new Error(`GET detail failed: status=${detail.status} slug=${slug}`);
    }
    if (!detail.body.includes(state.businessName)) {
      throw new Error(`GET detail missing businessName in HTML for slug=${slug}`);
    }
    console.log(`OK GET public detail contains businessName (${detail.status})`);

    const results = await httpGet(`${base}/clasificados/servicios/resultados?lang=es&q=${encodeURIComponent("SmokeTest")}`);
    if (results.status !== 200) {
      throw new Error(`GET filtered results failed: status=${results.status}`);
    }
    if (!results.body.includes(slug)) {
      throw new Error(`GET results page missing slug link for ${slug}`);
    }
    console.log(`OK GET resultados surfaces slug (${results.status})`);

    console.log("SERVICIOS_HTTP_SMOKE_PASS");
  } catch (e) {
    console.error("SERVICIOS_HTTP_SMOKE_FAIL", e);
    if (stderr.trim()) console.error("next stderr tail:", stderr.slice(-800));
    process.exit(1);
  } finally {
    child.kill("SIGTERM");
    await new Promise((r) => setTimeout(r, 1500));
    try {
      child.kill("SIGKILL");
    } catch {
      /* */
    }
  }
}

main();
