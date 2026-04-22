/**
 * Empleos HTTP smoke: spawns `next start`, curls public Empleos routes, exits.
 * Prerequisite: `npm run build` must have produced `.next/BUILD_ID`.
 *
 * Usage: `node scripts/empleos-http-smoke.mjs`
 */
import { spawn } from "node:child_process";
import * as fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const port = Number(process.env.EMPLEOS_SMOKE_PORT || "3013");
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

async function waitForReady(base, maxMs) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const r = await httpGet(`${base}/clasificados/empleos`);
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

    const paths = [
      ["/clasificados/empleos", "landing"],
      ["/clasificados/empleos/resultados", "results"],
      ["/clasificados/publicar/empleos", "publish hub"],
      ["/publicar/empleos/quick", "quick lane"],
    ];

    for (const [p, label] of paths) {
      const url = `${base}${p}`;
      const r = await httpGet(url);
      if (r.status !== 200) {
        throw new Error(`${label} ${url} status=${r.status}`);
      }
      console.log(`OK ${label} ${url} status=${r.status} bytes=${r.body.length}`);
    }

    console.log("EMPLEOS_HTTP_SMOKE_PASS");
  } catch (e) {
    console.error("EMPLEOS_HTTP_SMOKE_FAIL", e);
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
