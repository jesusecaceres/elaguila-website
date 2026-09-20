/**
 * LEONIX QUICK — FINAL ALL-PROGRAM PROOF MATRIX checker.
 *
 * Validates `docs/quick-final/LEONIX_QUICK_FINAL_ALL_PROGRAM_PROOF_MATRIX.md` as a
 * machine-checkable artifact rather than prose: required columns, unique ids, allowed
 * statuses, full 19-family coverage, all five entry strategies, non-empty evidence on
 * every PROVEN row, a declared blocker class + required flag on every BLOCKED row, and
 * that every repository path cited in an evidence cell actually exists on disk.
 *
 * Self-tests (`--self-test`) feed the validator deliberately broken matrices — missing
 * family, duplicate id, invalid status, empty proof, unclassified blocker, malformed
 * row — and require each to be rejected, so a green run cannot come from a validator
 * that simply never fails.
 *
 * Run: npx tsx scripts/verify-quick-final-all-program-proof-01.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");
const DEFAULT_MATRIX = path.join(
  ROOT,
  "docs/quick-final/LEONIX_QUICK_FINAL_ALL_PROGRAM_PROOF_MATRIX.md",
);

const REQUIRED_COLUMNS = [
  "REQUIREMENT ID",
  "FAMILY / SYSTEM",
  "ENTRY STRATEGY",
  "REQUIREMENT",
  "VISIBLE CONTROL / ENTRY",
  "USER VALUE SOURCE",
  "QUICK / EXISTING STATE",
  "DRAFT / PERSISTENCE",
  "ADAPTER / ROUTER",
  "CANONICAL DESTINATION",
  "VALIDATOR",
  "PREVIEW / SUBMISSION",
  "MEDIA",
  "PAYMENT",
  "PUBLISH / MODERATION",
  "DATABASE / SOURCE",
  "PUBLIC OUTPUT",
  "MANAGEMENT",
  "LIFECYCLE",
  "OWNERSHIP GUARD",
  "SECURITY GUARD",
  "FOCUSED VERIFIER",
  "PREVIEW / STATIC EVIDENCE",
  "STATUS",
  "NOTES",
] as const;

const ALLOWED_STATUS = new Set(["PROVEN", "PROVEN_NA", "BLOCKED", "REPAIR_REQUIRED"]);

const ALLOWED_STRATEGY = new Set([
  "QUICK_FORM",
  "EXISTING_SHORT_FORM",
  "DIRECT_CANONICAL_LINK",
  "DISCOVERY_DESTINATION",
  "CONTENT_DESTINATION",
  "CROSS_CUTTING",
]);

/** The five user-entry strategy types that must each be represented by a real family. */
const FAMILY_STRATEGIES = [
  "QUICK_FORM",
  "EXISTING_SHORT_FORM",
  "DIRECT_CANONICAL_LINK",
  "DISCOVERY_DESTINATION",
  "CONTENT_DESTINATION",
];

const ALLOWED_BLOCKER_CLASS = new Set([
  "OWNER_PRICING_DECISION",
  "OWNER_PRODUCT_DECISION",
  "OUTSIDE_QUICK_CONTRACT",
  "EXTERNAL_PERMISSION",
]);

const REQUIRED_FAMILIES = [
  "En Venta",
  "Rentas",
  "Empleos",
  "Autos Privado",
  "Bienes FSBO",
  "Clases",
  "Comunidad",
  "Busco",
  "Mascotas",
  "Servicios",
  "Restaurantes",
  "Autos Dealer",
  "Bienes Negocio/Agent",
  "Comida Local",
  "Ofertas Locales",
  "Negocios Locales",
  "Viajes",
  "Iglesias",
  "Recursos",
];

/** Cross-cutting systems that must each carry their own row. */
const REQUIRED_CROSS_CUTTING = [
  "FIELD WIRING",
  "MEDIA",
  "AUTH",
  "OWNERSHIP",
  "PAYMENT",
  "STAFF PWA",
  "BUSINESS HUB",
  "ADMIN",
  "ANALYTICS",
  "LIFECYCLE",
  "STRUCTURED INVENTORY",
  "MENUS",
  "COUPONS",
  "OFERTAS PRICING REPAIR",
  "OUT-OF-SCOPE PROTECTION",
  "PREVIEW IDENTITY",
  "CLASSIFIEDS CERTIFICATION PRESERVATION",
  "BUSINESS CORE CERTIFICATION PRESERVATION",
  "REMAINING FAMILY COVERAGE",
  "AUTHORIZED MEDIA API SURFACE",
];

/** Cells that may never be blank on a PROVEN row — the substance of the proof. */
const CRITICAL_EVIDENCE_COLUMNS = [
  "REQUIREMENT",
  "VISIBLE CONTROL / ENTRY",
  "CANONICAL DESTINATION",
  "FOCUSED VERIFIER",
  "PREVIEW / STATIC EVIDENCE",
];

const REQUIRED_SECTIONS = [
  "## PREVIEW IDENTITY",
  "## TOTALS",
];

type Row = Record<string, string> & { __line: number };

function splitRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((c) => c.trim());
}

function isSeparator(line: string): boolean {
  return /^\|[\s:|-]+\|$/.test(line.trim());
}

export type ParseResult = {
  rows: Row[];
  header: string[];
  text: string;
};

function parseMatrix(file: string): ParseResult {
  assert.ok(fs.existsSync(file), `proof matrix not found: ${file}`);
  const text = fs.readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/);

  let header: string[] | null = null;
  const rows: Row[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    // The matrix is a single contiguous pipe table; later two-column summary
    // tables must not be parsed as matrix rows.
    if (!line.trim().startsWith("|")) {
      if (header && rows.length > 0) break;
      continue;
    }
    if (isSeparator(line)) continue;
    const cells = splitRow(line);

    if (!header) {
      if (cells[0] !== "REQUIREMENT ID") continue;
      header = cells;
      continue;
    }

    // Every subsequent pipe row must be a well-formed matrix row.
    assert.equal(
      cells.length,
      header.length,
      `malformed row at line ${i + 1}: ${cells.length} cells, expected ${header.length}`,
    );
    const row: Row = { __line: i + 1 } as Row;
    header.forEach((h, idx) => {
      row[h] = cells[idx] ?? "";
    });
    rows.push(row);
  }

  assert.ok(header, "no proof matrix table found (header row starting with REQUIREMENT ID)");
  return { rows, header: header!, text };
}

/** Pull repository-relative paths out of an evidence cell so they can be existence-checked. */
function citedPaths(cell: string): string[] {
  const out: string[] = [];
  const re = /`([^`]+)`/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(cell))) {
    const token = m[1]!.trim();
    if (!/^(app|scripts|docs|public)\//.test(token)) continue;
    if (/[*?]/.test(token)) continue;
    // Strip a trailing symbol reference such as `file.ts:functionName`.
    const cleaned = token.replace(/:[A-Za-z0-9_$]+$/, "");
    out.push(cleaned);
  }
  return out;
}

export function validate(file: string): {
  total: number;
  proven: number;
  provenNa: number;
  blocked: number;
  repairRequired: number;
  requiredBlockers: number;
} {
  const { rows, header, text } = parseMatrix(file);

  for (const col of REQUIRED_COLUMNS) {
    assert.ok(header.includes(col), `missing required column: ${col}`);
  }

  assert.ok(rows.length > 0, "proof matrix has no rows");

  const ids = new Set<string>();
  for (const row of rows) {
    const id = row["REQUIREMENT ID"] ?? "";
    assert.ok(id.length > 0, `empty REQUIREMENT ID at line ${row.__line}`);
    assert.ok(!ids.has(id), `duplicate REQUIREMENT ID "${id}" at line ${row.__line}`);
    ids.add(id);

    const status = row["STATUS"] ?? "";
    assert.ok(
      ALLOWED_STATUS.has(status),
      `invalid STATUS "${status}" for ${id} at line ${row.__line}`,
    );

    const strategy = row["ENTRY STRATEGY"] ?? "";
    assert.ok(
      ALLOWED_STRATEGY.has(strategy),
      `invalid ENTRY STRATEGY "${strategy}" for ${id} at line ${row.__line}`,
    );

    if (status === "PROVEN") {
      for (const col of CRITICAL_EVIDENCE_COLUMNS) {
        const cell = (row[col] ?? "").trim();
        assert.ok(
          cell.length > 0 && cell !== "-" && cell !== "—",
          `PROVEN row ${id} has empty critical evidence cell "${col}" at line ${row.__line}`,
        );
      }
    }

    if (status === "BLOCKED") {
      const notes = row["NOTES"] ?? "";
      const cls = /BLOCKER_CLASS=([A-Z_]+)/.exec(notes)?.[1];
      assert.ok(
        cls && ALLOWED_BLOCKER_CLASS.has(cls),
        `BLOCKED row ${id} must declare a valid BLOCKER_CLASS= in NOTES (line ${row.__line})`,
      );
      assert.ok(
        /REQUIRED=(YES|NO)/.test(notes),
        `BLOCKED row ${id} must declare REQUIRED=YES|NO in NOTES (line ${row.__line})`,
      );
    }

    // Every repository path cited as evidence must actually exist.
    for (const col of header) {
      for (const p of citedPaths(row[col] ?? "")) {
        assert.ok(
          fs.existsSync(path.join(ROOT, p)),
          `cited path does not exist: "${p}" (row ${id}, column ${col}, line ${row.__line})`,
        );
      }
    }
  }

  // All 19 families represented.
  const familyCells = rows.map((r) => r["FAMILY / SYSTEM"] ?? "");
  for (const fam of REQUIRED_FAMILIES) {
    assert.ok(
      familyCells.some((c) => c === fam),
      `missing required family row: ${fam}`,
    );
  }

  // All cross-cutting systems represented.
  for (const xc of REQUIRED_CROSS_CUTTING) {
    assert.ok(
      familyCells.some((c) => c === xc),
      `missing required cross-cutting row: ${xc}`,
    );
  }

  // Every one of the five user-entry strategies is actually used by a family row.
  const familyRows = rows.filter((r) => REQUIRED_FAMILIES.includes(r["FAMILY / SYSTEM"] ?? ""));
  for (const strat of FAMILY_STRATEGIES) {
    assert.ok(
      familyRows.some((r) => r["ENTRY STRATEGY"] === strat),
      `entry strategy not represented by any family: ${strat}`,
    );
  }

  // Named subjects that must be present by explicit mission requirement.
  assert.ok(
    familyCells.includes("Ofertas Locales") &&
      familyCells.includes("OFERTAS PRICING REPAIR"),
    "Ofertas pricing reconciliation must be represented",
  );
  assert.ok(familyCells.includes("Comida Local"), "Comida Local must be represented");

  for (const section of REQUIRED_SECTIONS) {
    assert.ok(text.includes(section), `missing required section: ${section}`);
  }

  const proven = rows.filter((r) => r["STATUS"] === "PROVEN").length;
  const provenNa = rows.filter((r) => r["STATUS"] === "PROVEN_NA").length;
  const blocked = rows.filter((r) => r["STATUS"] === "BLOCKED").length;
  const repairRequired = rows.filter((r) => r["STATUS"] === "REPAIR_REQUIRED").length;
  const requiredBlockers = rows.filter(
    (r) => r["STATUS"] === "BLOCKED" && /REQUIRED=YES/.test(r["NOTES"] ?? ""),
  ).length;

  assert.equal(repairRequired, 0, `REPAIR_REQUIRED must be 0, found ${repairRequired}`);
  assert.equal(requiredBlockers, 0, `required blockers must be 0, found ${requiredBlockers}`);

  return {
    total: rows.length,
    proven,
    provenNa,
    blocked,
    repairRequired,
    requiredBlockers,
  };
}

/** Each fixture mutates a valid matrix into a specific defect the validator must catch. */
function selfTest(): void {
  const good = fs.readFileSync(DEFAULT_MATRIX, "utf8");
  const tmpDir = fs.mkdtempSync(path.join(require("node:os").tmpdir(), "quick-proof-selftest-"));

  const cases: { name: string; mutate: (src: string) => string }[] = [
    {
      name: "missing family",
      mutate: (src) =>
        src
          .split("\n")
          .filter((l) => !/^\|\s*FAM-19\b/.test(l))
          .join("\n"),
    },
    {
      name: "duplicate id",
      mutate: (src) => src.replace(/^\|\s*FAM-02\b/m, "| FAM-01"),
    },
    {
      name: "invalid status",
      mutate: (src) => src.replace(/\|\s*PROVEN\s*\|/, "| DEFINITELY_FINE |"),
    },
    {
      name: "empty proof",
      mutate: (src) =>
        src.replace(/^(\|\s*FAM-01\s*\|)/m, "$1").replace(
          /^(\|\s*FAM-01\s*\|[^|]*\|[^|]*\|)[^|]*\|/m,
          "$1  |",
        ),
    },
    {
      name: "unclassified blocker",
      mutate: (src) => src.replace(/BLOCKER_CLASS=[A-Z_]+/, "BLOCKER_CLASS=MYSTERY"),
    },
    {
      // Drop a column separator so the row carries one cell fewer than the header.
      name: "malformed row",
      mutate: (src) => src.replace(/^\|\s*FAM-03\s*\|\s*Empleos\s*\|/m, "| FAM-03 Empleos |"),
    },
    {
      name: "nonexistent cited path",
      mutate: (src) =>
        src.replace(
          /`app\/lib\/quickClassifieds\/quickClassifiedRegistry\.ts`/,
          "`app/lib/quickClassifieds/thisFileDoesNotExist.ts`",
        ),
    },
  ];

  let caught = 0;
  for (const c of cases) {
    const mutated = c.mutate(good);
    assert.notEqual(mutated, good, `self-test fixture "${c.name}" did not change the matrix`);
    const f = path.join(tmpDir, `${c.name.replace(/\s+/g, "-")}.md`);
    fs.writeFileSync(f, mutated, "utf8");
    let threw = false;
    try {
      validate(f);
    } catch {
      threw = true;
    }
    assert.ok(threw, `self-test FAILED — validator accepted a matrix with: ${c.name}`);
    caught += 1;
    console.log(`  self-test rejected: ${c.name}`);
  }

  fs.rmSync(tmpDir, { recursive: true, force: true });
  console.log(`  self-test: ${caught}/${cases.length} defect classes correctly rejected`);
}

function main(): void {
  const target = process.argv.find((a) => a.endsWith(".md")) ?? DEFAULT_MATRIX;
  const totals = validate(target);
  console.log(
    `verify-quick-final-all-program-proof-01: matrix OK (${totals.total} rows: ` +
      `PROVEN ${totals.proven}, PROVEN_NA ${totals.provenNa}, BLOCKED ${totals.blocked}, ` +
      `REPAIR_REQUIRED ${totals.repairRequired}, required blockers ${totals.requiredBlockers})`,
  );
  selfTest();
  console.log("verify-quick-final-all-program-proof-01: OK");
}

main();
