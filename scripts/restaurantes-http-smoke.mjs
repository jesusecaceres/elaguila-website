/**
 * Restaurantes HTTP smoke (single Node process: spawns `next start`, curls, exits).
 * Prerequisite: `npm run build` (or `next build`) must have produced `.next/BUILD_ID`.
 *
 * Usage: `node scripts/restaurantes-http-smoke.mjs`
 */
import { spawn } from "node:child_process";
import * as fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const port = Number(process.env.RESTAURANTES_SMOKE_PORT || "3012");
const buildIdPath = path.join(repoRoot, ".next", "BUILD_ID");

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
      path: u.pathname,
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
      const r = await httpGet(`${base}/clasificados/restaurantes`);
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

  const nextBin = path.join(repoRoot, "node_modules", "next", "dist", "bin", "next");
  const child = spawn(process.execPath, [nextBin, "start", "-p", String(port)], {
    cwd: repoRoot,
    env: { ...process.env, NODE_ENV: "production" },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stderr = "";
  child.stderr?.on("data", (d) => {
    stderr += String(d);
  });

  const base = `http://127.0.0.1:${port}`;
  try {
    await waitForReady(base, 90_000);

    const checks = [
      ["GET landing", `${base}/clasificados/restaurantes`, async () => httpGet(`${base}/clasificados/restaurantes`)],
      ["GET results", `${base}/clasificados/restaurantes/resultados`, async () => httpGet(`${base}/clasificados/restaurantes/resultados`)],
      ["GET publish app", `${base}/publicar/restaurantes`, async () => httpGet(`${base}/publicar/restaurantes`)],
      [
        "POST publish empty body → 400",
        `${base}/api/clasificados/restaurantes/publish`,
        async () => httpPostJson(`${base}/api/clasificados/restaurantes/publish`, "{}"),
      ],
    ];

    for (const [label, url, fn] of checks) {
      const r = await fn();
      const ok = label.includes("400") ? r.status === 400 : r.status === 200;
      if (!ok) {
        throw new Error(`${label} failed: status=${r.status} url=${url} bodyHead=${JSON.stringify(r.body?.slice(0, 120))}`);
      }
      console.log(`OK ${label} (${r.status})`);
    }

    console.log("RESTAURANTES_HTTP_SMOKE_PASS");
  } catch (e) {
    console.error("RESTAURANTES_HTTP_SMOKE_FAIL", e);
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
