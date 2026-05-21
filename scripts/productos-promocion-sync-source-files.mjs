/**
 * Recursively lists images under public/productos-promocion/source-images/
 * and writes folder-prefixed paths into imageMap.ts SOURCE_IMAGE_FILES.
 * Run from repo root: node scripts/productos-promocion-sync-source-files.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = path.join(root, "public/productos-promocion/source-images");
const imageMapPath = path.join(root, "app/(site)/productos-promocion/imageMap.ts");
const exts = /\.(jpg|jpeg|png|webp|svg)$/i;

function listImages(dir, prefix = "") {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir).sort()) {
    const full = path.join(dir, name);
    const rel = prefix ? `${prefix}/${name}` : name;
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      out.push(...listImages(full, rel));
    } else if (exts.test(name)) {
      out.push(rel.replace(/\\/g, "/"));
    }
  }
  return out;
}

const files = listImages(sourceDir);
let imageMap = fs.readFileSync(imageMapPath, "utf8");
imageMap = imageMap.replace(
  /export const SOURCE_IMAGE_FILES: readonly string\[\] = \[[\s\S]*?\n\];\n\nconst SOURCE_FILE_SET/,
  `export const SOURCE_IMAGE_FILES: readonly string[] = ${JSON.stringify(files, null, 2)};\n\nconst SOURCE_FILE_SET`,
);
fs.writeFileSync(imageMapPath, imageMap);
console.log(`Updated SOURCE_IMAGE_FILES with ${files.length} file(s).`);
