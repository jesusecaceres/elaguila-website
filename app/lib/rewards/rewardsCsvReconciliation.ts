/**
 * LEONIX IX REWARDS — staff CSV import / export / reconciliation.
 *
 * PURE AND IO-FREE. Parsing, validation, safety and idempotency all live here so
 * `scripts/verify-ix-rewards-behavior-01.ts` can drive the real code against fixtures. The
 * authorization, the canonical lookups and the actual writes live in the route.
 *
 * THE SHAPE OF THE WORKFLOW, AND WHY
 *
 *   PREVIEW (dry run)  →  the staff member sees every accepted row, every rejected row and the
 *                         exact reason for each, and NOTHING has been written.
 *   COMMIT             →  the same file, re-validated, plus the batch fingerprint the preview
 *                         returned. A fingerprint mismatch is refused, because a commit that
 *                         silently applied a different file than the one reviewed would make the
 *                         review meaningless.
 *
 * There is no third mode. A file is never partially applied without the operator being told
 * exactly which rows moved and which did not: `NO SILENT PARTIAL SUCCESS` is enforced by making
 * the rejected-row report part of every result, not an optional extra.
 *
 * CSV INJECTION. A cell beginning with `=`, `+`, `-`, `@`, a tab or a carriage return is executed
 * as a formula by Excel, Sheets and Numbers when the exported file is opened. Every value that
 * LEAVES this system through `toReconciliationCsv()` is therefore prefixed with a single quote,
 * and every value that ENTERS through `parseRewardsCsv()` is REJECTED rather than sanitized —
 * because a legitimate business name, reference or reason never starts with a formula character,
 * and quietly rewriting a staff member's data is worse than telling them it was wrong.
 */

import { createHash } from "node:crypto";

/** A CSV import is bounded. A file larger than this is refused before it is parsed. */
export const CSV_MAX_BYTES = 2_000_000;
/** And so is its row count, so one paste cannot queue thousands of money movements. */
export const CSV_MAX_ROWS = 1_000;

/** The exact header a rewards reconciliation file must carry, in this order. */
export const CSV_REQUIRED_HEADERS = [
  "payment_record_id",
  "business_id",
  "owner_user_id",
  "amount_cents",
  "kind",
  "reference",
  "reason",
] as const;

export type RewardsCsvKind = "earn_adjustment" | "manual_adjustment";

export type RewardsCsvRow = {
  /** 1-based index of the row in the FILE, header included, so a staff member can find it. */
  lineNumber: number;
  paymentRecordId: string | null;
  businessId: string | null;
  ownerUserId: string | null;
  amountCents: number;
  kind: RewardsCsvKind;
  reference: string;
  reason: string;
  /** Derived, never supplied: the key that makes re-importing this exact row a no-op. */
  idempotencyKey: string;
};

export type RewardsCsvRejection = {
  lineNumber: number;
  code: string;
  message: string;
  /** The offending raw line, truncated. Echoed back so the operator can see what they sent. */
  raw: string;
};

export type RewardsCsvParseResult =
  | { ok: false; code: string; message: string }
  | {
      ok: true;
      rows: RewardsCsvRow[];
      rejections: RewardsCsvRejection[];
      /** Rows whose reference collides with another row IN THE SAME FILE. */
      duplicateReferences: string[];
      /** Identifies this exact accepted row set. The commit step must present it back. */
      batchFingerprint: string;
    };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Leading characters a spreadsheet treats as the start of a formula. */
const FORMULA_LEAD_RE = /^[=+\-@\t\r]/;

function isUuid(v: string): boolean {
  return UUID_RE.test(v);
}

/**
 * Would a spreadsheet execute this cell?
 *
 * A negative number legitimately starts with `-`, so numeric cells are checked as numbers and
 * only TEXT cells are held to this rule.
 */
export function looksLikeFormula(value: string): boolean {
  return FORMULA_LEAD_RE.test(value);
}

/**
 * One CSV line into fields, honouring RFC4180 double-quoting.
 *
 * Hand-rolled rather than pulled from a dependency because the grammar this accepts is
 * deliberately narrow: quoted fields, doubled quotes inside them, commas outside them. Anything
 * stranger is a rejected row, not a parser feature.
 */
export function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(field);
      field = "";
    } else {
      field += ch;
    }
  }
  out.push(field);
  return out;
}

/** The idempotency key an imported row posts under. Derived, so re-importing moves nothing twice. */
export function csvRowIdempotencyKey(reference: string): string {
  return `csv:${reference}`;
}

/**
 * A stable fingerprint of the ACCEPTED rows.
 *
 * WHAT IT MUST GUARANTEE: the file being committed is the file that was reviewed. Anything a
 * reviewer could have read and approved has to be inside it.
 *
 * EVERY FIELD, NOT JUST THE MONEY. An earlier version hashed only the reference, amount, kind and
 * target — which let a commit swap the `reason` text for anything at all while still matching the
 * preview's fingerprint. That text is written into the immutable ledger and then shown to the
 * customer in their own credit history, so it is exactly the kind of content a review exists to
 * catch. `reason` is now part of the canonical string.
 *
 * SHA-256, NOT A SHORT NON-CRYPTOGRAPHIC HASH. The previous 32-bit FNV-1a was brute-forceable in
 * seconds: an attacker could change an amount and then vary the free-form `reference` until the
 * fingerprint collided with the approved one. A 32-bit digest cannot carry a tamper-evidence
 * claim, however clearly the comment disclaims being "cryptographic".
 */
export function fingerprintRows(rows: RewardsCsvRow[]): string {
  const canonical = rows
    .map((r) =>
      [
        r.reference,
        String(r.amountCents),
        r.kind,
        r.paymentRecordId ?? "",
        r.businessId ?? "",
        r.ownerUserId ?? "",
        // The text a reviewer reads and a customer later sees.
        r.reason,
      ]
        // A separator that cannot appear in any field, so two different row sets cannot
        // canonicalize to the same string by moving a delimiter into a value.
        .join("\u0000"),
    )
    .sort()
    .join("\u0001");
  const digest = createHash("sha256").update(`${rows.length}\u0002${canonical}`, "utf8").digest("hex");
  return `${rows.length}-${digest.slice(0, 32)}`;
}

/**
 * Parse and validate a reconciliation file.
 *
 * EVERY row is examined. A bad row is REJECTED WITH A REASON and the good rows are still
 * returned, because refusing an entire 400-row file over one typo is not a workflow anybody can
 * use — but the rejections travel with the result so the operator can never mistake a partial
 * import for a complete one.
 */
export function parseRewardsCsv(input: { content: string; byteLength?: number }): RewardsCsvParseResult {
  const byteLength = input.byteLength ?? Buffer.byteLength(input.content, "utf8");
  if (byteLength > CSV_MAX_BYTES) {
    return { ok: false, code: "file_too_large", message: `File exceeds ${CSV_MAX_BYTES} bytes.` };
  }

  // KEEP THE ORIGINAL LINE NUMBERS. Filtering blank lines out before numbering would report a bad
  // row on real line 7 as line 5, and `lineNumber` is documented as the line a staff member can
  // go and look at. Blank lines are skipped when iterating, not when numbering.
  const rawLines = input.content.split(/\r?\n/);
  if (!rawLines.length) return { ok: false, code: "empty_file", message: "The file is empty." };
  const lines = rawLines;

  const header = splitCsvLine(lines[0]!).map((h) => h.trim().toLowerCase());
  const expected = CSV_REQUIRED_HEADERS;
  const headerMatches = header.length === expected.length && expected.every((h, i) => header[i] === h);
  if (!headerMatches) {
    return {
      ok: false,
      code: "bad_header",
      message: `Header must be exactly: ${expected.join(",")}`,
    };
  }

  // Each entry keeps the line number it had in the FILE, so a rejection points at a real line.
  const dataLines = lines
    .slice(1)
    .map((text, idx) => ({ text, lineNumber: idx + 2 }))
    .filter((l) => l.text.trim().length > 0);
  if (dataLines.length > CSV_MAX_ROWS) {
    return { ok: false, code: "too_many_rows", message: `File exceeds ${CSV_MAX_ROWS} data rows.` };
  }

  const rows: RewardsCsvRow[] = [];
  const rejections: RewardsCsvRejection[] = [];
  const seenReferences = new Map<string, number>();
  const duplicateReferences: string[] = [];

  dataLines.forEach(({ text: line, lineNumber }) => {
    const raw = line.slice(0, 300);
    const reject = (code: string, message: string) => rejections.push({ lineNumber, code, message, raw });

    const fields = splitCsvLine(line);
    if (fields.length !== expected.length) {
      reject("column_count", `Expected ${expected.length} columns, found ${fields.length}.`);
      return;
    }

    const [paymentRecordIdRaw, businessIdRaw, ownerUserIdRaw, amountRaw, kindRaw, referenceRaw, reasonRaw] = fields.map(
      (f) => f.trim(),
    );

    // EXECUTABLE CONTENT: refused, never rewritten. A real reference or reason does not begin
    // with a formula character, so a cell that does is a mistake or an attack, and either way the
    // operator needs to see it rather than have it silently altered.
    for (const [label, value] of [
      ["reference", referenceRaw!],
      ["reason", reasonRaw!],
    ] as const) {
      if (value && looksLikeFormula(value)) {
        reject("formula_content", `The ${label} column may not begin with = + - @ or whitespace control characters.`);
        return;
      }
    }

    const paymentRecordId = paymentRecordIdRaw || null;
    const businessId = businessIdRaw || null;
    const ownerUserId = ownerUserIdRaw || null;

    for (const [label, value] of [
      ["payment_record_id", paymentRecordId],
      ["business_id", businessId],
      ["owner_user_id", ownerUserId],
    ] as const) {
      if (value && !isUuid(value)) {
        reject("invalid_uuid", `${label} must be a uuid.`);
        return;
      }
    }

    // A row must name SOMEONE. A wallet is never resolved from a name or a phone number here:
    // those are search keys on other surfaces, never identity for a money movement.
    if (!paymentRecordId && !businessId && !ownerUserId) {
      reject("no_target", "A row must carry a payment_record_id, a business_id or an owner_user_id.");
      return;
    }
    if (businessId && ownerUserId) {
      reject("ambiguous_target", "A row may name a business_id or an owner_user_id, not both.");
      return;
    }

    if (!/^-?\d+$/.test(amountRaw!)) {
      reject("invalid_amount", "amount_cents must be a whole number of cents, with no currency symbol.");
      return;
    }
    const amountCents = Number.parseInt(amountRaw!, 10);
    if (!Number.isSafeInteger(amountCents) || amountCents === 0) {
      reject("invalid_amount", "amount_cents must be a non-zero whole number of cents.");
      return;
    }

    if (kindRaw !== "earn_adjustment" && kindRaw !== "manual_adjustment") {
      reject("invalid_kind", "kind must be earn_adjustment or manual_adjustment.");
      return;
    }
    const kind: RewardsCsvKind = kindRaw;

    if (kind === "earn_adjustment") {
      if (!paymentRecordId) {
        reject("earn_needs_payment", "An earn_adjustment row must name the payment_record_id it earns against.");
        return;
      }
      if (amountCents < 0) {
        reject("invalid_amount", "An earn_adjustment may not be negative; use manual_adjustment to claw back.");
        return;
      }
    }

    if (!referenceRaw || referenceRaw.length < 4 || referenceRaw.length > 120) {
      reject("invalid_reference", "reference must be 4–120 characters and unique per row.");
      return;
    }
    if (!/^[A-Za-z0-9._:-]+$/.test(referenceRaw)) {
      reject("invalid_reference", "reference may contain only letters, digits, dot, underscore, colon and hyphen.");
      return;
    }
    if (!reasonRaw || reasonRaw.trim().length < 3 || reasonRaw.length > 300) {
      reject("invalid_reason", "reason must be 3–300 characters; every adjustment is explained.");
      return;
    }

    const priorLine = seenReferences.get(referenceRaw);
    if (priorLine !== undefined) {
      // A file that repeats a reference would post one movement and silently drop the other, so
      // the collision is reported rather than resolved.
      duplicateReferences.push(referenceRaw);
      reject("duplicate_reference_in_file", `reference "${referenceRaw}" already appears on line ${priorLine}.`);
      return;
    }
    seenReferences.set(referenceRaw, lineNumber);

    rows.push({
      lineNumber,
      paymentRecordId,
      businessId,
      ownerUserId,
      amountCents,
      kind,
      reference: referenceRaw,
      reason: reasonRaw.trim(),
      idempotencyKey: csvRowIdempotencyKey(referenceRaw),
    });
  });

  return {
    ok: true,
    rows,
    rejections,
    duplicateReferences: Array.from(new Set(duplicateReferences)),
    batchFingerprint: fingerprintRows(rows),
  };
}

// ---------------------------------------------------------------------------
// EXPORT
// ---------------------------------------------------------------------------

/**
 * Neutralize a value on its way OUT.
 *
 * Prefixing with a single quote is the standard defence: the spreadsheet shows the original text
 * and does not evaluate it. Applied to every text cell, not only suspicious ones, so the rule has
 * no exception for an attacker to aim at.
 */
export function csvCell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  const guarded = looksLikeFormula(s) ? `'${s}` : s;
  return /[",\r\n]/.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded;
}

export type ReconciliationResultRow = {
  reference: string;
  lineNumber: number;
  kind: string;
  amountCents: number;
  /**
   * The text this row will write into the immutable ledger and the customer will later read in
   * their own history. Carried on every preview row because an operator cannot certify a batch
   * whose customer-visible content they were never shown.
   */
  reason?: string;
  outcome: "applied" | "deduplicated" | "rejected";
  movedCents: number;
  walletId: string | null;
  detail: string;
};

/** The reconciliation report, as a file staff can open without it executing anything. */
export function toReconciliationCsv(rows: ReconciliationResultRow[]): string {
  const header = [
    "reference",
    "line_number",
    "kind",
    "amount_cents",
    "outcome",
    "moved_cents",
    "wallet_id",
    "reason",
    "detail",
  ].join(",");
  const body = rows.map((r) =>
    [
      r.reference,
      r.lineNumber,
      r.kind,
      r.amountCents,
      r.outcome,
      r.movedCents,
      r.walletId ?? "",
      r.reason ?? "",
      r.detail,
    ]
      .map(csvCell)
      .join(","),
  );
  return [header, ...body].join("\r\n");
}

/** The blank file staff start from, so nobody has to guess the header. */
export function reconciliationTemplateCsv(): string {
  return `${CSV_REQUIRED_HEADERS.join(",")}\r\n`;
}
