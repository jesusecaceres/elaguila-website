#!/usr/bin/env node
import { execFileSync } from "node:child_process";

function run(cmd, args) {
  execFileSync(cmd, args, { stdio: "inherit", env: process.env });
}

run("node", ["scripts/verify-rentas-full-stacked-production-closure-01.mjs"]);
run("node", ["scripts/smoke-revenue-os-rentas-paid-publish-lockdown-01.mjs"]);

console.log("smoke-rentas-full-stacked-production-closure-01: PASS");
