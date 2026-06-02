/**
 * Gate P4-H — Varios WhatsApp input mask + CTA audit
 * Run: npm run varios:p4h-whatsapp-input-cta-audit
 */
import fs from "fs";
import path from "path";

const root = process.cwd();

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(root, rel));
}

type Row = { requirement: string; pass: boolean; evidence: string };
const rows: Row[] = [];

function add(requirement: string, pass: boolean, evidence: string) {
  rows.push({ requirement, pass, evidence });
}

const auditPath = "app/lib/clasificados/en-venta/VARIOS_P4H_WHATSAPP_INPUT_CTA_AUDIT.md";
const seller = read("app/(site)/clasificados/publicar/en-venta/free/application/sections/SellerContactSection.tsx");
const phoneDisplay = read("app/(site)/clasificados/en-venta/shared/utils/enVentaPhoneDisplay.ts");
const contactActions = read("app/(site)/clasificados/en-venta/shared/utils/enVentaContactActions.ts");
const contactBtns = read("app/(site)/clasificados/en-venta/shared/components/EnVentaContactButtons.tsx");
const normalize = read("app/(site)/clasificados/en-venta/shared/utils/normalizeEnVentaApplicationState.ts");
const pkg = read("package.json");

const auditMd = exists(auditPath) ? read(auditPath) : "";
const bundle = [seller, phoneDisplay, contactActions, contactBtns, normalize].join("\n");

add("Audit markdown exists", exists(auditPath), auditPath);
add("Audit TRUE/FALSE table", auditMd.includes("| Requirement | TRUE/FALSE |"), auditPath);
add("Phone pattern documented", auditMd.includes("Existing phone formatting pattern"), auditPath);
add("WhatsApp root cause documented", auditMd.includes("WhatsApp input root cause"), auditPath);
add("formatEnVentaPhoneInput helper", phoneDisplay.includes("formatEnVentaPhoneInput"), "enVentaPhoneDisplay.ts");
add("WhatsApp onChange uses formatter", seller.includes("whatsapp: formatEnVentaPhoneInput"), "SellerContactSection.tsx");
add("Phone onChange uses formatter", seller.includes("phone: formatEnVentaPhoneInput"), "SellerContactSection.tsx");
add("WhatsApp label in UI", contactBtns.includes("WhatsApp"), "EnVentaContactButtons.tsx");
add("WhatsApp icon", contactBtns.includes("IconWhatsApp"), "EnVentaContactButtons.tsx");
add("WhatsApp when digits valid", contactActions.includes("const showWa = waValid"), "enVentaContactActions.ts");
add("Digits-only href helper", phoneDisplay.includes("enVentaContactDigits"), "enVentaPhoneDisplay.ts");
add("Draft normalize formats whatsapp", normalize.includes("formatEnVentaPhoneInput(str(input.whatsapp))"), "normalizeEnVentaApplicationState.ts");
add("No public $9.99 copy", !bundle.includes("$9.99"), "bundle");
add("No Stripe copy", !/\bstripe\b/i.test(bundle), "bundle");
add("No Boost/Impulsar copy", !bundle.includes("Impulsar") && !/\bboost\b/i.test(bundle.toLowerCase()), "bundle");
add("Gate P4-H npm script", pkg.includes("varios:p4h-whatsapp-input-cta-audit"), "package.json");

const failed = rows.filter((r) => !r.pass);
console.log("# Gate P4-H — Varios WhatsApp input mask + CTA audit\n");
for (const r of rows) {
  console.log(`| ${r.requirement} | ${r.pass ? "TRUE" : "FALSE"} | ${r.evidence} |`);
}
console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
if (failed.length) {
  console.error("\nFailed:");
  for (const f of failed) console.error(`- ${f.requirement}: ${f.evidence}`);
  process.exit(1);
}
