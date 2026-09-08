// Cross-platform launcher for Gate L. The gate script imports a real
// `server-only`-guarded module (ofertasLocalesCommercialServer.ts) to prove
// the free-entitlement behavior with genuine function calls rather than
// source regexes, so the child process needs the `react-server` export
// condition active (see the "react-server" field in server-only's
// package.json) — set via NODE_OPTIONS, which Node.js permits.
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const target = path.join(__dirname, "ofertas-locales-gate-l-two-lane-backend-closeout-audit.ts");
const result = spawnSync(process.execPath, [require.resolve("tsx/cli"), target], {
  stdio: "inherit",
  env: {
    ...process.env,
    NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ""} --conditions=react-server`.trim(),
  },
});

process.exit(result.status ?? 1);
