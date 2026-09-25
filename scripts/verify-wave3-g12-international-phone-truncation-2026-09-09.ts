/**
 * Globalization Wave 3 G12 — international phone-number silent-truncation fix.
 * `formatPhoneInputDisplay` (serviciosPhoneUi.ts) hard-truncates to 10 digits and forces US
 * (XXX) XXX-XXXX grouping — correct and intentional for Servicios' own primary-phone contract,
 * but several OTHER categories imported it directly for THEIR primary/dealer/finance phone
 * fields, silently corrupting any real international number as the owner types (worse than a
 * validation rejection — nothing tells them their number was mangled). The same class of bug
 * also existed on the READ side: 3 "PublishedQuickToDraft.ts" reverse mappers re-truncated an
 * already-stored phone to 10 digits on every dashboard hydration, risking silent data loss on
 * re-save even for numbers that had been stored correctly. Source-level checks only.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
let pass = 0;
let fail = 0;

function read(rel: string): string {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

function check(label: string, condition: boolean): void {
  if (condition) {
    pass += 1;
    console.log(`  ok  - ${label}`);
  } else {
    fail += 1;
    console.error(`  FAIL - ${label}`);
  }
}

console.log("verify-wave3-g12-international-phone-truncation-2026-09-09: starting");

// --- 1. New shared safe helper exists and Servicios' own contract is untouched ---
{
  const util = read("app/(site)/clasificados/publicar/servicios/lib/serviciosPhoneUi.ts");
  check(
    "UTIL 1: formatUsStylePhoneInputSafe exported — never truncates a number that looks international",
    util.includes("export function formatUsStylePhoneInputSafe(raw: string): string") &&
      /if \(hasLeadingPlus \|\| digitCount > 10\) return formatWhatsAppInputDisplay\(raw\);/.test(util),
  );
  check(
    "UTIL 2: formatPhoneInputDisplay itself is untouched (still Servicios' own deliberate US-only contract)",
    util.includes("export function formatPhoneInputDisplay(raw: string): string {") &&
      util.includes("const d = digitsOnly(raw).slice(0, 10);"),
  );
}

// --- 2. Input-time call sites no longer destructively truncate ---
const inputSites: Array<[string, string]> = [
  [
    "app/(site)/publicar/empleos/shared/components/EmpleosCtaFieldGroup.tsx",
    "Clases/Comunidad quick + Empleos Premium (via formatUsPhone)",
  ],
  ["app/(site)/publicar/empleos/shared/components/EmpleosPremiumCtaFieldGroup.tsx", "Empleos Premium phone field"],
  ["app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx", "Autos Privado dealer office phone"],
  ["app/(site)/publicar/autos/shared/components/AutosDealerFinanceFields.tsx", "Autos Dealer finance-contact phone"],
  ["app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx", "Autos Negocios dealer office/mobile/SMS phone"],
  ["app/(site)/publicar/busco/quick/BuscoQuickFormClient.tsx", "Busco Quick phone/SMS phone"],
  ["app/(site)/publicar/community/shared/components/CommunityExtendedContactFields.tsx", "Community shared SMS phone field"],
  ["app/(site)/publicar/community/shared/preview/CommunityContactCanvas.tsx", "Community preview phone display"],
];
for (const [rel, desc] of inputSites) {
  const src = read(rel);
  check(
    `INPUT: ${desc} (${rel}) no longer calls the truncating formatPhoneInputDisplay`,
    src.includes("formatUsStylePhoneInputSafe") && !src.includes("formatPhoneInputDisplay"),
  );
}

// --- 3. Hydration/reverse-mapper call sites no longer re-truncate an already-stored number ---
const hydrationSites: Array<[string, string]> = [
  ["app/(site)/publicar/clases/lib/clasesPublishedQuickToDraft.ts", "Clases Quick hydration"],
  ["app/(site)/publicar/comunidad/lib/comunidadPublishedQuickToDraft.ts", "Comunidad Quick hydration"],
  ["app/(site)/publicar/mascotas-y-perdidos/shared/mascotasPerdidosPublishedQuickToDraft.ts", "Mascotas/Perdidos Quick hydration"],
];
for (const [rel, desc] of hydrationSites) {
  const src = read(rel);
  check(
    `HYDRATION: ${desc} (${rel}) to10Display no longer slices to 10 digits before the length check`,
    !/const d = rawDigits\.replace\(\/\\D\/g, ""\)\.slice\(0, 10\);/.test(src) &&
      /return d\.length === 10 \? formatPhoneInputDisplay\(d\) : d;/.test(src),
  );
  check(
    `HYDRATION: ${desc} (${rel}) phone-digit extraction no longer pre-truncates before to10Display runs`,
    !/\.replace\(\/\\D\/g, ""\)\.slice\(0, 10\)/.test(src),
  );
}

console.log(
  `\nverify-wave3-g12-international-phone-truncation-2026-09-09: ${pass}/${pass + fail} checks passed`,
);
if (fail > 0) process.exit(1);
