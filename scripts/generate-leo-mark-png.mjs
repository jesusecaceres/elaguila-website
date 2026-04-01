import sharp from "sharp";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const svgPath = join(root, "public", "ai", "leo-mark.svg");
const outPath = join(root, "public", "ai", "leo-mark.png");

const svg = await readFile(svgPath);
await sharp(svg, { density: 144 }).png({ compressionLevel: 9 }).toFile(outPath);
console.log("Wrote", outPath);
