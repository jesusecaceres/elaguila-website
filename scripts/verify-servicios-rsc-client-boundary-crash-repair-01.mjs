import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const checks = [];

function ok(name, condition) {
  checks.push({ name, ok: Boolean(condition) });
}

const page = read("app/(site)/clasificados/servicios/[slug]/page.tsx");
const layer = read("app/(site)/servicios/components/ServiciosPublicTranslationLayer.tsx");
const standardShell = read("app/(site)/servicios/components/ServiciosProfileView.tsx");
const proShell = read("app/(site)/servicios/components/ServiciosProfessionalProfileShell.tsx");

ok("translation layer no longer accepts function child", !/children\s*:\s*\(/.test(layer) && !/children\s*\(/.test(layer));
ok("translation layer exposes hook contract", layer.includes("useServiciosPublicTranslation") && layer.includes("displayProfile") && layer.includes("translateControl"));
ok("standard shell is a client component", standardShell.startsWith('"use client";'));
ok("standard shell uses hook internally", standardShell.includes("useServiciosPublicTranslation({ profile, lang, listingKey })"));
ok("professional shell uses hook internally", proShell.includes("useServiciosPublicTranslation({ profile, lang, listingKey })"));
ok("standard shell has no translation render prop", !standardShell.includes("<ServiciosPublicTranslationLayer") && !/\{\s*\(displayProfile,\s*translateControl\)\s*=>/.test(standardShell));
ok("professional shell has no translation render prop", !proShell.includes("<ServiciosPublicTranslationLayer") && !/\{\s*\(displayProfile,\s*translateControl\)\s*=>/.test(proShell));
ok("public route passes no function children to translation layer", !page.includes("<ServiciosPublicTranslationLayer"));
ok("professional and standard shell imports remain in route", page.includes("ServiciosProfessionalProfileShell") && page.includes("ServiciosProfileView"));
ok("template routing remains in route", page.includes("resolveServiciosListingTemplate") && page.includes("isServiciosProfessionalTemplate"));
ok("translation support remains", layer.includes("TranslateAdControl") && layer.includes("requestServiciosAdTranslation") && layer.includes("onShowOriginal"));
ok("no use server misuse added", !layer.includes('"use server"') && !standardShell.includes('"use server"') && !proShell.includes('"use server"') && !page.includes('"use server"'));

let changedFiles = [];
try {
  changedFiles = execFileSync("git", ["diff", "--name-only"], { cwd: root, encoding: "utf8" })
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
} catch {
  changedFiles = [];
}

const allowed = changedFiles.every((f) =>
  f === "app/(site)/servicios/components/ServiciosPublicTranslationLayer.tsx" ||
  f === "app/(site)/servicios/components/ServiciosProfileView.tsx" ||
  f === "app/(site)/servicios/components/ServiciosProfessionalProfileShell.tsx" ||
  f === "scripts/verify-servicios-rsc-client-boundary-crash-repair-01.mjs" ||
  f === "package.json"
);
ok("no unrelated categories changed", allowed);

const failed = checks.filter((c) => !c.ok);
for (const c of checks) console.log(`${c.ok ? "PASS" : "FAIL"} ${c.name}`);
if (failed.length) {
  console.error(`\n${failed.length} Servicios RSC boundary checks failed.`);
  process.exit(1);
}
console.log("\nServicios RSC client boundary crash repair verifier passed.");
