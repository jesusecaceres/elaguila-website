/**
 * Next 15 on Windows can race on manifest/trace files when worker threads are enabled.
 * Disabling private worker threads keeps `next build` deterministic for local/CI.
 */
process.env.NEXT_PRIVATE_WORKER_THREADS = "false";

const { spawnSync } = require("node:child_process");
const nextCli = require.resolve("next/dist/bin/next");

const args = process.argv.slice(2);
const nextArgs = args.length ? args : ["build"];

const result = spawnSync(process.execPath, [nextCli, ...nextArgs], {
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);
