/**
 * Launcher for Phase 8B preset smoke (TypeScript implementation).
 * Usage: node scripts/smoke-servicios-business-presets.mjs
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const r = spawnSync("npx", ["tsx", join(root, "scripts", "smoke-servicios-business-presets.ts")], {
  cwd: root,
  stdio: "inherit",
  shell: true,
});
process.exit(r.status === 0 ? 0 : r.status ?? 1);
