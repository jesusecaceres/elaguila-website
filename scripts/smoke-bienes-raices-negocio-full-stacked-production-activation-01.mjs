#!/usr/bin/env node
import { execFileSync } from "node:child_process";

function run(cmd, args) {
  execFileSync(cmd, args, { stdio: "inherit", env: process.env });
}

run("node", ["scripts/verify-bienes-raices-negocio-full-stacked-production-activation-01.mjs"]);

console.log("smoke-bienes-raices-negocio-full-stacked-production-activation-01: PASS");
