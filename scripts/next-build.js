/**
 * Next 15 on Windows can race on manifest / export files (AV indexing, parallel writers).
 * `NEXT_PRIVATE_WORKER_THREADS=false` reduces worker races.
 *
 * Retries:
 * - After a **Windows-style flake** (ENOENT rename `export/500.html`, missing `build-manifest.json`, …),
 *   the next attempt runs **without** deleting `.next` (a full rebuild from partial output usually succeeds).
 * - After **missing `.next/types`** ghosts (often from wiping `.next` mid-pipeline) or from the 3rd+ attempt,
 *   we **delete `.next`** before retrying.
 */
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

process.env.NEXT_PRIVATE_WORKER_THREADS = "false";

const nextCli = require.resolve("next/dist/bin/next");

const args = process.argv.slice(2);
const nextArgs = args.length ? args : ["build"];

const WIN_BUILD_FLAKES =
  /ENOENT: no such file or directory.*\.next|build-manifest\.json|pages-manifest\.json|_ssgManifest\.js|next-font-manifest\.json|Cannot find module '.*next-font-manifest|rename '.*\.next\\export\\500\.html'|rename '.*\.next\/export\/500\.html'|Unexpected end of JSON input|EPERM|EBUSY/i;

function sleepMs(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    // synchronous throttle between retries
  }
}

function rmNextDir() {
  const nextDir = path.join(process.cwd(), ".next");
  /** Windows: AV/indexers can leave `.next/export` briefly non-empty during parallel teardown. */
  for (let i = 0; i < 8; i++) {
    try {
      fs.rmSync(nextDir, { recursive: true, force: true, maxRetries: 12, retryDelay: 350 });
      return;
    } catch {
      if (i === 7) return;
      sleepMs(500 + i * 200);
    }
  }
}

function runNextBuildOnce() {
  return spawnSync(process.execPath, [nextCli, ...nextArgs], {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 64,
    env: process.env,
    stdio: ["inherit", "pipe", "pipe"],
  });
}

function shouldRetryWindowsBuild(result, combined) {
  if (process.platform !== "win32") return false;
  if (nextArgs[0] !== "build") return false;
  if (result.status === 0) return false;
  return WIN_BUILD_FLAKES.test(combined);
}

function shouldRetryNextTypesGhost(result, combined) {
  if (nextArgs[0] !== "build") return false;
  if (result.status === 0) return false;
  return /File '.*[\\/]\.next[\\/]types[\\/].*' not found|Root file specified for compilation/i.test(combined);
}

const maxAttempts =
  nextArgs[0] !== "build"
    ? 1
    : process.platform === "win32"
      ? Math.min(5, Math.max(2, Number(process.env.NEXT_BUILD_WIN_RETRIES ?? "4") || 4))
      : 2;

let lastResult = { status: 1, stdout: "", stderr: "" };
let lastCombined = "";

if (nextArgs[0] === "build") {
  try {
    fs.rmSync(path.join(process.cwd(), "tsconfig.tsbuildinfo"), { force: true });
  } catch {
    // best-effort — avoids TS "root file" ghosts pointing at removed `.next/types/*`
  }
}

for (let attempt = 1; attempt <= maxAttempts; attempt++) {
  if (attempt > 1) {
    sleepMs(1200);
    const winFlake = shouldRetryWindowsBuild(lastResult, lastCombined);
    const ghost = shouldRetryNextTypesGhost(lastResult, lastCombined);
    /** In-place retry can leave `.next/server` without font manifest; clean and rebuild. */
    const fontManifestRace = /next-font-manifest\.json|Cannot find module '.*next-font-manifest/i.test(lastCombined);
    if (ghost || attempt >= 3 || fontManifestRace) {
      // eslint-disable-next-line no-console
      console.error(`\n[next-build] Cleaning .next and retrying (${attempt}/${maxAttempts})…\n`);
      rmNextDir();
    } else if (winFlake) {
      // eslint-disable-next-line no-console
      console.error(`\n[next-build] Retrying build in-place after Windows artifact flake (${attempt}/${maxAttempts})…\n`);
    } else {
      // eslint-disable-next-line no-console
      console.error(`\n[next-build] Cleaning .next and retrying (${attempt}/${maxAttempts})…\n`);
      rmNextDir();
    }
  }

  lastResult = runNextBuildOnce();
  lastCombined = `${lastResult.stdout ?? ""}\n${lastResult.stderr ?? ""}`;
  if (lastResult.stdout) process.stdout.write(lastResult.stdout);
  if (lastResult.stderr) process.stderr.write(lastResult.stderr);

  if (lastResult.status === 0) {
    process.exit(0);
  }

  const retry =
    attempt < maxAttempts &&
    (shouldRetryNextTypesGhost(lastResult, lastCombined) || shouldRetryWindowsBuild(lastResult, lastCombined));
  if (!retry) {
    process.exit(lastResult.status ?? 1);
  }
}

process.exit(lastResult.status ?? 1);
