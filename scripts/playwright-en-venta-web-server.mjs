/**
 * Playwright webServer entry: hermetic `next build` then `next start` on a fixed port.
 * Avoids Windows `next dev` races (ENOENT manifests / missing vendor chunks) after `rm -rf .next`.
 *
 * Env from parent (Playwright) is inherited — keep EN_VENTA_DEV_PUBLISH=1 etc.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const cwd = path.join(root, "..");

try {
  fs.rmSync(path.join(cwd, ".next"), { recursive: true, force: true });
} catch {
  /* ignore */
}

const shell = process.platform === "win32";
const build = spawnSync("npm", ["run", "build"], {
  cwd,
  stdio: "inherit",
  shell,
  env: { ...process.env, NODE_ENV: "production" },
});
if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

const child = spawn("npx", ["next", "start", "-p", "3016"], {
  cwd,
  stdio: "inherit",
  shell,
  env: { ...process.env, NODE_ENV: "production" },
});

child.on("exit", (code, signal) => {
  if (signal) process.exit(1);
  process.exit(code ?? 0);
});
