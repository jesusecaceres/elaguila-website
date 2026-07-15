import {
  DEFAULT_LOCALE,
  HIDDEN_FUTURE_LANGUAGE_CODES,
  OFFICIAL_LOCALES,
  type OfficialLocale,
} from "@/app/lib/language";
import {
  LAUNCH_UI_DICTIONARIES,
  LEONIX_I18N_SCHEMA,
} from "@/app/lib/i18n/launchUiDictionaries";

type Finding = {
  severity: "error" | "warning";
  message: string;
};

const findings: Finding[] = [];
const officialExpected = ["es", "en", "pt", "tl"] as const;

function addError(message: string): void {
  findings.push({ severity: "error", message });
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function interpolationVars(value: string): string[] {
  return Array.from(value.matchAll(/\{([A-Za-z0-9_]+)\}/g)).map((match) => match[1]).sort();
}

function compareStringArrays(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function verifyNode(locale: OfficialLocale, path: string, schemaNode: unknown, dictNode: unknown): void {
  if (schemaNode === "string") {
    if (typeof dictNode !== "string") {
      addError(`${locale}:${path} must be a string`);
      return;
    }
    if (!dictNode.trim()) addError(`${locale}:${path} must not be empty`);
    return;
  }

  if (!isPlainObject(schemaNode)) {
    addError(`Schema node ${path} is malformed`);
    return;
  }

  if (!isPlainObject(dictNode)) {
    addError(`${locale}:${path} must be an object`);
    return;
  }

  const schemaKeys = Object.keys(schemaNode).sort();
  const dictKeys = Object.keys(dictNode).sort();
  for (const key of schemaKeys) {
    if (!(key in dictNode)) addError(`${locale}:${path ? `${path}.` : ""}${key} is missing`);
  }
  for (const key of dictKeys) {
    if (!(key in schemaNode)) addError(`${locale}:${path ? `${path}.` : ""}${key} is unexpected`);
  }
  for (const key of schemaKeys) {
    verifyNode(locale, path ? `${path}.${key}` : key, schemaNode[key], dictNode[key]);
  }
}

function collectLeaves(node: unknown, path = "", out = new Map<string, string>()): Map<string, string> {
  if (typeof node === "string") {
    out.set(path, node);
    return out;
  }
  if (!isPlainObject(node)) return out;
  for (const key of Object.keys(node)) {
    collectLeaves(node[key], path ? `${path}.${key}` : key, out);
  }
  return out;
}

try {
  if (DEFAULT_LOCALE !== "es") addError(`DEFAULT_LOCALE must be es, found ${DEFAULT_LOCALE}`);

  if (!compareStringArrays([...OFFICIAL_LOCALES], [...officialExpected])) {
    addError(`OFFICIAL_LOCALES must be exactly ${officialExpected.join(",")}`);
  }

  for (const hidden of HIDDEN_FUTURE_LANGUAGE_CODES) {
    if ((OFFICIAL_LOCALES as readonly string[]).includes(hidden)) {
      addError(`Hidden locale ${hidden} is exposed in OFFICIAL_LOCALES`);
    }
  }

  for (const locale of officialExpected) {
    if (!(locale in LAUNCH_UI_DICTIONARIES)) addError(`${locale} dictionary is missing`);
  }

  for (const locale of OFFICIAL_LOCALES) {
    verifyNode(locale, "", LEONIX_I18N_SCHEMA, LAUNCH_UI_DICTIONARIES[locale]);
  }

  const canonicalLeaves = collectLeaves(LAUNCH_UI_DICTIONARIES.es);
  for (const locale of OFFICIAL_LOCALES) {
    const leaves = collectLeaves(LAUNCH_UI_DICTIONARIES[locale]);
    for (const [path, esValue] of canonicalLeaves) {
      const value = leaves.get(path);
      if (value === undefined) continue;
      const esVars = interpolationVars(esValue);
      const vars = interpolationVars(value);
      if (!compareStringArrays(esVars, vars)) {
        addError(`${locale}:${path} interpolation mismatch. expected {${esVars.join(",")}}, got {${vars.join(",")}}`);
      }
    }
  }

  for (const locale of OFFICIAL_LOCALES) {
    const resultCount = LAUNCH_UI_DICTIONARIES[locale].filters.resultCount;
    const keys = Object.keys(resultCount).sort();
    if (!compareStringArrays(keys, ["one", "other"])) {
      addError(`${locale}:filters.resultCount plural keys must be one,other`);
    }
  }
} catch (error) {
  addError(`Verifier crashed: ${error instanceof Error ? error.message : String(error)}`);
}

const errors = findings.filter((finding) => finding.severity === "error");

console.log("i18n dictionary verification");
console.log(`Official dictionaries found: ${officialExpected.every((locale) => locale in LAUNCH_UI_DICTIONARIES) ? "YES" : "NO"}`);
console.log(`Schema parity passed: ${errors.some((e) => e.message.includes("missing") || e.message.includes("unexpected")) ? "NO" : "YES"}`);
console.log(`Value types passed: ${errors.some((e) => e.message.includes("must be")) ? "NO" : "YES"}`);
console.log(`Interpolation parity passed: ${errors.some((e) => e.message.includes("interpolation")) ? "NO" : "YES"}`);
console.log(`Plural structure passed: ${errors.some((e) => e.message.includes("plural")) ? "NO" : "YES"}`);
console.log(`Hidden locale exposure passed: ${errors.some((e) => e.message.includes("Hidden locale")) ? "NO" : "YES"}`);

for (const finding of findings) {
  console.log(`${finding.severity.toUpperCase()}: ${finding.message}`);
}

if (errors.length > 0) {
  process.exitCode = 1;
}
