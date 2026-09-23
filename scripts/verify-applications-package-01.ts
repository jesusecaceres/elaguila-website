import { spawnSync } from "node:child_process";

type Gate = {
  name: string;
  command: string;
  args: string[];
};

const gates: Gate[] = [
  {
    name: "Business application shared contract (Servicios / Restaurantes / Comida Local)",
    command: "node",
    args: ["scripts/verify-business-application-contract.mjs"],
  },
  {
    name: "Quick all-program canonical application proof",
    command: "node",
    args: ["node_modules/tsx/dist/cli.mjs", "scripts/verify-quick-final-all-program-proof-01.ts"],
  },
  {
    name: "Servicios golden owner/application delta",
    command: "node",
    args: ["node_modules/tsx/dist/cli.mjs", "scripts/verify-servicios-owner-qa-delta.ts"],
  },
  {
    name: "Servicios business-type preset integrity",
    command: "node",
    args: ["node_modules/tsx/dist/cli.mjs", "scripts/smoke-servicios-business-presets.ts"],
  },
  {
    name: "Restaurantes preview readiness",
    command: "node",
    args: ["node_modules/tsx/dist/cli.mjs", "scripts/restaurante-preview-readiness-smoke.ts"],
  },
  {
    name: "Comida Local final customer flow lock",
    command: "node",
    args: ["node_modules/tsx/dist/cli.mjs", "scripts/comida-local-food-p2-final-customer-flow-lock-audit.ts"],
  },
  {
    name: "Quick staff assisted-sales application doorway proof",
    command: "node",
    args: ["node_modules/tsx/dist/cli.mjs", "--tsconfig", "scripts/lib/tsconfig.harness.json", "scripts/verify-quick-sales-preview-01.ts"],
  },
  {
    name: "Autos final application acceptance",
    command: "node",
    args: ["node_modules/tsx/dist/cli.mjs", "scripts/autos-a5-final-acceptance-live-completion-audit.ts"],
  },
  {
    name: "Autos Dealer inventory add-on parity",
    command: "node",
    args: ["scripts/verify-autos-dealer-inventory-addon-live-parity-02.mjs"],
  },
  {
    name: "Autos Dealer exact 10 base plus 10 add-on capacity",
    command: "node",
    args: ["scripts/verify-revenue-os-autos-dealer-inventory-entitlement-parity-01.mjs"],
  },
  {
    name: "Bienes final launch golden stack",
    command: "node",
    args: ["scripts/verify-bienes-final-launch-golden-stack-01.mjs"],
  },
  {
    name: "Bienes inventory golden-stack parity",
    command: "node",
    args: ["scripts/verify-bienes-inventory-golden-stack-parity-01.mjs"],
  },
  {
    name: "Bienes property-kind discovery (casa / terreno / comercial)",
    command: "node",
    args: ["node_modules/tsx/dist/cli.mjs", "scripts/verify-bienes-negocio-gate2-discovery.ts"],
  },
  {
    name: "Rentas Privado and Negocio paid publish lockdown",
    command: "node",
    args: ["scripts/verify-revenue-os-rentas-paid-publish-lockdown-01.mjs"],
  },
  {
    name: "Rentas Negocio populated round-trip stabilization",
    command: "node",
    args: ["node_modules/tsx/dist/cli.mjs", "scripts/verify-rentas-negocio-gate1-stabilization.ts"],
  },
  {
    name: "Rentas launch application self-test",
    command: "node",
    args: ["node_modules/tsx/dist/cli.mjs", "scripts/rentas-launch-selftest.ts"],
  },
  {
    name: "Rentas field contract",
    command: "node",
    args: ["node_modules/tsx/dist/cli.mjs", "scripts/rentas-field-contract-selftest.ts"],
  },
  {
    name: "Empleos paid Quick/Premium versus free Feria publish contract",
    command: "node",
    args: ["scripts/verify-revenue-os-empleos-paid-publish-checkpoint-01.mjs"],
  },
  {
    name: "Empleos final application QA readiness",
    command: "node",
    args: ["scripts/verify-empleos-final-qa-readiness.mjs"],
  },
  {
    name: "En Venta full repository application completion",
    command: "node",
    args: ["node_modules/tsx/dist/cli.mjs", "scripts/en-venta-gate-2p-final-repo-completion-audit.ts"],
  },
  {
    name: "En Venta preview persistence",
    command: "node",
    args: ["node_modules/tsx/dist/cli.mjs", "scripts/en-venta-gate-2r-final-preview-persistence-audit.ts"],
  },
  {
    name: "Clases deep application branches and Preview continuity",
    command: "node",
    args: ["node_modules/tsx/dist/cli.mjs", "scripts/gate-2d-community-owner-qa-debt-selftest.ts"],
  },
  {
    name: "Community family owner/application repairs (Clases / Comunidad / Busco / Mascotas)",
    command: "node",
    args: ["node_modules/tsx/dist/cli.mjs", "scripts/community-owner-qa-final-repair-audit.ts"],
  },
  {
    name: "Busco application/preview/published parity",
    command: "node",
    args: ["node_modules/tsx/dist/cli.mjs", "scripts/busco-b1-quick-connection-audit.ts"],
  },
  {
    name: "Comunidad preview/publish identity",
    command: "node",
    args: ["node_modules/tsx/dist/cli.mjs", "scripts/comunidad-preview-publish-id-gate-audit.ts"],
  },
  {
    name: "Viajes Negocio and Privado application/preview source gate",
    command: "node",
    args: ["node_modules/tsx/dist/cli.mjs", "scripts/verify-viajes-application-source-01.ts"],
  },
  {
    name: "Mascotas y Perdidos five-branch application proof",
    command: "node",
    args: ["node_modules/tsx/dist/cli.mjs", "scripts/verify-mascotas-application-branches-01.ts"],
  },
  {
    name: "Ofertas Locales two-lane application/preview gate",
    command: "node",
    args: ["node_modules/tsx/dist/cli.mjs", "scripts/ofertas-locales-gate-k-two-lane-final-verifier.ts"],
  },
];

let passed = 0;
for (const gate of gates) {
  console.log(`\n=== APPLICATION PACKAGE: ${gate.name} ===`);
  const result = spawnSync(gate.command, gate.args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
    shell: false,
  });
  if (result.error) {
    console.error(`FAILED TO START: ${gate.name}: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`APPLICATION PACKAGE FAILED: ${gate.name} (exit ${result.status ?? "unknown"})`);
    process.exit(result.status ?? 1);
  }
  passed += 1;
}

console.log(`\nAPPLICATION PACKAGE SOURCE GATE PASSED: ${passed}/${gates.length} category gates green.`);
