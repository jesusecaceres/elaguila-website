import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

type Severity = "blocker" | "warning";

type Finding = {
  file: string;
  line: number;
  column: number;
  ruleId: string;
  text: string;
  severity: Severity;
  blocker: boolean;
  suggestion: string;
};

const root = process.cwd();

/** Full Rentas private application map (GATE 6 expansion). */
const approvedScope = [
  "app/(site)/clasificados/publicar/rentas/privado/page.tsx",
  "app/(site)/publicar/rentas/privado/page.tsx",
  "app/(site)/clasificados/publicar/rentas/privado/application/RentasPrivadoApplication.tsx",
  "app/(site)/clasificados/publicar/rentas/privado/application/RentasPrivadoForm.tsx",
  "app/(site)/clasificados/rentas/privado/publish/RentasPrivadoPublishShell.tsx",
  "app/(site)/clasificados/publicar/rentas/shared/RentasAnuncioFormSection.tsx",
  "app/(site)/clasificados/publicar/rentas/shared/rentasAnuncioFormCopy.ts",
  "app/(site)/clasificados/publicar/rentas/shared/RentasShowingTourSection.tsx",
  "app/(site)/clasificados/publicar/rentas/shared/RentasTipoFlowDetailFields.tsx",
  "app/(site)/clasificados/rentas/shared/rentasPublishFormHelpers.ts",
  "app/(site)/clasificados/rentas/shared/rentasRentalTypeTaxonomy.ts",
  "app/(site)/clasificados/rentas/shared/utils/rentasPublishConstants.ts",
  "app/(site)/clasificados/publicar/shared/Gate12cContactChannelsFields.tsx",
  "app/(site)/clasificados/en-venta/shared/components/ListingRulesConfirmationSection.tsx",
  "app/(site)/clasificados/lib/LeonixRealEstateSortablePhotoStrip.tsx",
  "app/lib/i18n/launchUiDictionaries.ts",
  "app/lib/i18n/rentasLaunchUiExtras.ts",
  "app/lib/language.ts",
];

const dictionaryFiles = new Set([
  "app/lib/i18n/launchUiDictionaries.ts",
  "app/lib/i18n/rentasLaunchUiExtras.ts",
]);

/** Confirmed rentas privado UI leaks + prior foundation blockers. */
const confirmedBlockerTexts = [
  "Agua",
  "Mantenimiento",
  "Estacionamiento",
  "Especifica el servicio",
  "Requisitos",
  "Zona o vecindario",
  "Estado del anuncio",
  "Direccion linea 2",
  "Dirección línea 2",
  "Ciudad",
  "Estado / Provincia",
  "Codigo postal",
  "Código postal",
  "Mostrar direccion exacta cuando aplique",
  "Mostrar dirección exacta cuando aplique",
  "Hasta 8 fotos",
  "Fotos del anuncio",
  "Subir o añadir fotos",
  "seleccionadas",
  "Videos por enlace",
  "Información de contacto",
  "Foto de contacto",
  "Subir foto",
  "Borrador guardado solo en este dispositivo",
  "Detalle residencial",
  "Sin detalle adicional",
  "Alberca / piscina",
  "Cocina remodelada",
  "Confirmación antes de publicar",
  "Final review",
  "Tipo de aluguel",
  "Condicoes importantes",
  "Condições importantes",
  "Aluguel mensal",
];

const visibleAttributes = new Set(["placeholder", "aria-label", "title", "alt", "label"]);
const findings: Finding[] = [];
/** No baseline exceptions for newly discovered approved-scope Rentas leaks. */
const baselineExceptions: Array<{
  file: string;
  ruleId: string;
  reason: string;
  owner: string;
  expiration: string;
}> = [];

function toAbs(file: string): string {
  return path.join(root, file);
}

function pos(sourceFile: ts.SourceFile, node: ts.Node): { line: number; column: number } {
  const lc = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  return { line: lc.line + 1, column: lc.character + 1 };
}

function addFinding(
  sourceFile: ts.SourceFile,
  node: ts.Node,
  ruleId: string,
  text: string,
  severity: Severity,
  suggestion: string,
): void {
  const p = pos(sourceFile, node);
  findings.push({
    file: sourceFile.fileName.split(path.sep).join("/").replace(root.split(path.sep).join("/") + "/", ""),
    line: p.line,
    column: p.column,
    ruleId,
    text,
    severity,
    blocker: severity === "blocker",
    suggestion,
  });
}

function textIncludesConfirmedCopy(text: string): string | null {
  const normalized = text.replace(/\s+/g, " ").trim();
  return confirmedBlockerTexts.find((candidate) => normalized.includes(candidate)) ?? null;
}

function isLangEqualsEn(node: ts.Node): boolean {
  return (
    ts.isBinaryExpression(node) &&
    node.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken &&
    ((node.left.getText() === "lang" && node.right.getText().replace(/['"]/g, "") === "en") ||
      (node.right.getText() === "lang" && node.left.getText().replace(/['"]/g, "") === "en"))
  );
}

function scanNode(sourceFile: ts.SourceFile, node: ts.Node, relative: string): void {
  if (!dictionaryFiles.has(relative)) {
    if (ts.isJsxText(node)) {
      const match = textIncludesConfirmedCopy(node.getText(sourceFile));
      if (match) addFinding(sourceFile, node, "hardcoded-jsx-text", match, "blocker", "Move visible UI copy into the launch dictionary.");
    }

    if (ts.isJsxAttribute(node)) {
      const name = node.name.getText(sourceFile);
      if (visibleAttributes.has(name) && node.initializer && ts.isStringLiteral(node.initializer)) {
        const match = textIncludesConfirmedCopy(node.initializer.text);
        if (match) {
          addFinding(
            sourceFile,
            node,
            "hardcoded-visible-attribute",
            match,
            "blocker",
            "Use a translated dictionary value for visible attributes.",
          );
        }
      }
    }

    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      const parent = node.parent;
      const inImport = ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent);
      const match = !inImport ? textIncludesConfirmedCopy(node.text) : null;
      if (match) {
        addFinding(
          sourceFile,
          node,
          "visible-string-candidate",
          match,
          "blocker",
          "Use a Rentas dictionary key instead of hardcoded confirmed UI copy.",
        );
      }
    }

    if (ts.isConditionalExpression(node) && isLangEqualsEn(node.condition)) {
      addFinding(
        sourceFile,
        node,
        "binary-locale-copy",
        node.getText(sourceFile).slice(0, 120),
        "blocker",
        "Use official four-language dictionary access for visible copy.",
      );
    }
  }

  ts.forEachChild(node, (child) => scanNode(sourceFile, child, relative));
}

let parserFailures = 0;

for (const relative of approvedScope) {
  const abs = toAbs(relative);
  if (!fs.existsSync(abs)) {
    findings.push({
      file: relative,
      line: 1,
      column: 1,
      ruleId: "missing-approved-file",
      text: relative,
      severity: "blocker",
      blocker: true,
      suggestion: "Restore the approved audit scope file or update the scoped audit configuration.",
    });
    continue;
  }
  try {
    const source = fs.readFileSync(abs, "utf8");
    const kind = relative.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
    const sourceFile = ts.createSourceFile(abs, source, ts.ScriptTarget.Latest, true, kind);
    const parseDiagnostics =
      (sourceFile as ts.SourceFile & { parseDiagnostics?: readonly ts.Diagnostic[] }).parseDiagnostics ?? [];
    if (parseDiagnostics.length > 0) {
      parserFailures += parseDiagnostics.length;
      for (const diagnostic of parseDiagnostics) {
        const lc = sourceFile.getLineAndCharacterOfPosition(diagnostic.start ?? 0);
        findings.push({
          file: relative,
          line: lc.line + 1,
          column: lc.character + 1,
          ruleId: "parser-failure",
          text: ts.flattenDiagnosticMessageText(diagnostic.messageText, " "),
          severity: "blocker",
          blocker: true,
          suggestion: "Fix syntax so the i18n audit can inspect the file.",
        });
      }
      continue;
    }
    scanNode(sourceFile, sourceFile, relative);
  } catch (error) {
    parserFailures += 1;
    findings.push({
      file: relative,
      line: 1,
      column: 1,
      ruleId: "audit-crash",
      text: error instanceof Error ? error.message : String(error),
      severity: "blocker",
      blocker: true,
      suggestion: "Fix the audit crash for this approved file.",
    });
  }
}

const blockers = findings.filter((finding) => finding.blocker);
const warnings = findings.filter((finding) => !finding.blocker);

console.log("i18n AST audit");
console.log(`Files scanned: ${approvedScope.length}`);
console.log(`Blockers found: ${blockers.length}`);
console.log(`Warnings found: ${warnings.length}`);
console.log(`Parser failures: ${parserFailures}`);
console.log(`Baseline exceptions: ${baselineExceptions.length}`);

for (const finding of findings) {
  console.log(
    `${finding.file}:${finding.line}:${finding.column} ${finding.ruleId} severity=${finding.severity} blocker=${finding.blocker ? "YES" : "NO"} text="${finding.text}" suggestion="${finding.suggestion}"`,
  );
}

if (blockers.length > 0) {
  process.exitCode = 1;
}
