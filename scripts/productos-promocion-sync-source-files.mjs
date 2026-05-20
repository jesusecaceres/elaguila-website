/**
 * Lists image files in public/productos-promocion/source-images/ and writes them into imageMap.ts SOURCE_IMAGE_FILES.
 * Run from repo root: node scripts/productos-promocion-sync-source-files.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = path.join(root, "public/productos-promocion/source-images");
const imageMapPath = path.join(root, "app/(site)/productos-promocion/imageMap.ts");
const exts = /\.(jpg|jpeg|png|webp|svg)$/i;

let files = [];
if (fs.existsSync(sourceDir)) {
  files = fs.readdirSync(sourceDir).filter((f) => exts.test(f)).sort();
}

let imageMap = fs.readFileSync(imageMapPath, "utf8");
imageMap = imageMap.replace(
  /export const SOURCE_IMAGE_FILES: readonly string\[\] = \[[\s\S]*?\];/,
  `export const SOURCE_IMAGE_FILES: readonly string[] = ${JSON.stringify(files, null, 2)};`,
);
fs.writeFileSync(imageMapPath, imageMap);
console.log(`Updated SOURCE_IMAGE_FILES with ${files.length} file(s).`);
