import { existsSync } from "node:fs";
import { resolve } from "node:path";

const sourcePdf = resolve(process.cwd(), "proof-input", "magazine", "source.pdf");

if (!existsSync(sourcePdf)) {
  console.log("[magazine proof-render] No source PDF found. Exiting without rendering.");
  process.exit(0);
}

console.log("[magazine proof-render] Stub only. Rendering is intentionally disabled in this gate.");
process.exit(0);
