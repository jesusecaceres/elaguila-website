/**
 * Fails if likely Spanish UI literals appear in admin source outside the dictionary file.
 * Allowed: adminStrings.ts (EN+ES), comments-only lines (best-effort), ASCII-only UI.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "app", "admin");
const ALLOW_FILES = new Set([
  path.join(ROOT, "_lib", "adminStrings.ts"),
  /** Bilingual label tables (Spanish lives in the `es` object, not default UI). */
  path.join(ROOT, "_lib", "adminWorkspaceHubLabels.ts"),
]);
function allowPath(abs) {
  const rel = path.relative(ROOT, abs).split(path.sep).join("/");
  if (/^(_lib\/adminViajes.*Mock\.ts|_lib\/adminViajes.*_mock\.ts)$/i.test(rel)) return true;
  return false;
}

const ACCENT_RE = /[áéíóúñÁÉÍÓÚÑ¿¡üÜ]/;
const SPANISH_HINT_RE =
  /\b(no hay|sin fecha|sin url|sin datos|cola de|cola admin|buscar\b|guardar\b|eliminar\b|descripción|descripcion|título|titulo|pagos\b|soporte\b|categorías|categorias|ajustes\b|anuncios\b|moderación|moderacion|operaciones|limpiar\b|aplicar\b|reportes\b|gestionar|ficha vendedor|ver público|ver publico|abrir cola|bandeja\b|pedidos\b|vendedor\b|público\b|público|notas \(opcional|opcional, supabase|estado operativo|visibilidad\b|destacar\b|guarda visibilidad|efectivo admin|conteos\b|fuente\b|anotación)\b/i;

/** Remove routing and URL attrs so /admin/usuarios etc. do not trip Spanish word checks. */
function stripRoutingAndUrls(line) {
  return (
    line
      // href="/path" href={`/path`} actionHref=...
      .replace(/\b(?:href|actionHref|src)=\{\s*`[^`]*`\s*\}/g, " ")
      .replace(/\b(?:href|actionHref|src)=\{[^}]*\}/g, " ")
      .replace(/\b(?:href|actionHref|src)=["'][^"']*["']/g, " ")
      // loose /admin/... segments (incl. template tails)
      .replace(/\/admin\/[a-z0-9\-/_${}.`]*\}?/gi, " ")
  );
}

function shouldSkipRel(relPosix) {
  if (relPosix.includes(`${path.posix.sep}node_modules${path.posix.sep}`)) return true;
  return false;
}

function stripLineComments(line) {
  const i = line.indexOf("//");
  if (i < 0) return line;
  const q = line.slice(0, i);
  if ((q.match(/'/g) || []).length % 2 === 1) return line;
  if ((q.match(/"/g) || []).length % 2 === 1) return line;
  return q;
}

function walk(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    const rel = path.relative(process.cwd(), p).split(path.sep).join("/");
    if (ent.isDirectory()) {
      if (!shouldSkipRel(rel)) out.push(...walk(p));
    } else if (/\.(tsx|ts)$/.test(ent.name)) {
      out.push(p);
    }
  }
  return out;
}

const hits = [];
for (const abs of walk(ROOT)) {
  if (ALLOW_FILES.has(abs) || allowPath(abs)) continue;
  const raw = fs.readFileSync(abs, "utf8");
  const lines = raw.split(/\r?\n/);
  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const scan = stripRoutingAndUrls(stripLineComments(line));
    if (ACCENT_RE.test(scan) || SPANISH_HINT_RE.test(scan)) {
      hits.push({ file: path.relative(process.cwd(), abs).split(path.sep).join("/"), line: idx + 1, text: line.trim().slice(0, 200) });
    }
  }
}

if (hits.length) {
  console.error(`admin-language audit failed: ${hits.length} hit(s)`);
  for (const h of hits.slice(0, 80)) {
    console.error(`${h.file}:${h.line}: ${h.text}`);
  }
  if (hits.length > 80) console.error(`… and ${hits.length - 80} more`);
  process.exit(1);
}
console.log("admin-language audit: OK");
