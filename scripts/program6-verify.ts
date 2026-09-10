/**
 * Program 6, Gate 6AD — Creative Studio structural verifier.
 * Runs deterministic checks against the codebase to verify Program 6 architecture.
 */
import * as fs from "fs";
import * as path from "path";

export interface VerifyResult {
  check: string;
  pass: boolean;
  detail: string;
}

export function verifyCreativeStudioStructure(baseDir: string): VerifyResult[] {
  const results: VerifyResult[] = [];
  const csDir = path.join(baseDir, "app", "lib", "business", "creativeStudio");

  const requiredFiles = [
    "brand/brandTypes.ts",
    "brand/brandAssetRegistry.ts",
    "brand/brandRules.ts",
    "printSpecs.ts",
    "productionRules.ts",
    "archetypes/types.ts",
    "archetypes/registry.ts",
    "archetypes/compositionRules.ts",
    "assetTypes.ts",
    "imageQualityEngine.ts",
    "types.ts",
    "constants.ts",
    "repository.ts",
    "researchPacketAssembler.ts",
    "compliance.ts",
    "languageEngine.ts",
    "providerTypes.ts",
    "geminiCreativeProvider.ts",
    "providerRegistry.ts",
    "canvaHandoff.ts",
    "canvaPromptCompiler.ts",
    "preflightEngine.ts",
    "exports.ts",
    "qrRegistry.ts",
    "featureFlag.ts",
    "ownerAccess.ts",
    "fixtures.ts",
  ];

  for (const file of requiredFiles) {
    const fullPath = path.join(csDir, file);
    const exists = fs.existsSync(fullPath);
    results.push({
      check: `File exists: ${file}`,
      pass: exists,
      detail: exists ? "OK" : `MISSING: ${fullPath}`,
    });
  }

  // Check migration exists
  const migrationPath = path.join(baseDir, "supabase", "migrations", "20260810160000_business_creative_studio_foundation.sql");
  const migrationExists = fs.existsSync(migrationPath);
  results.push({
    check: "Migration SQL exists",
    pass: migrationExists,
    detail: migrationExists ? "OK" : "MISSING",
  });

  // Check UI component exists
  const uiPath = path.join(baseDir, "app", "admin", "(dashboard)", "businesses", "[businessId]", "CreativeStudioActions.tsx");
  const uiExists = fs.existsSync(uiPath);
  results.push({
    check: "CreativeStudioActions UI component exists",
    pass: uiExists,
    detail: uiExists ? "OK" : "MISSING",
  });

  // Check capabilities include creative studio
  const capPath = path.join(baseDir, "app", "admin", "_lib", "salesWorkspaceCapabilities.ts");
  const capContent = fs.readFileSync(capPath, "utf-8");
  const hasCreativeCaps = capContent.includes("view_creative_studio") && capContent.includes("approve_creative_final");
  results.push({
    check: "Sales workspace capabilities include creative studio",
    pass: hasCreativeCaps,
    detail: hasCreativeCaps ? "OK" : "MISSING creative studio capabilities",
  });

  const generateRoutePath = path.join(baseDir, "app", "api", "admin", "businesses", "[businessId]", "creative-studio", "jobs", "[jobId]", "generate", "route.ts");
  const generateRoute = fs.existsSync(generateRoutePath) ? fs.readFileSync(generateRoutePath, "utf-8") : "";
  const generateUsesSharedOwnerHelper =
    generateRoute.includes("requireSalesWorkspaceAccess") &&
    generateRoute.includes("salesActorToCreativeActor") &&
    generateRoute.includes("generate_creative_draft");
  results.push({
    check: "Package A generate route accepts owner bootstrap through shared helper",
    pass: generateUsesSharedOwnerHelper,
    detail: generateUsesSharedOwnerHelper ? "OK" : "generate route must call requireSalesWorkspaceAccess + salesActorToCreativeActor",
  });

  return results;
}

export function verifyCreativeStudioDoctrines(baseDir: string): VerifyResult[] {
  const results: VerifyResult[] = [];
  const csDir = path.join(baseDir, "app", "lib", "business", "creativeStudio");

  // Check doctrine rules exist
  const typesContent = fs.readFileSync(path.join(csDir, "types.ts"), "utf-8");
  const hasDoctrine = typesContent.includes("CREATIVE_DOCTRINE_RULES");
  results.push({
    check: "Creative doctrine rules defined",
    pass: hasDoctrine,
    detail: hasDoctrine ? "OK" : "MISSING CREATIVE_DOCTRINE_RULES",
  });

  // Check image generation is NOT live
  const providerContent = fs.readFileSync(path.join(csDir, "providerTypes.ts"), "utf-8");
  const imageGenNotLive = providerContent.includes("isImageGenerationLive") && providerContent.includes("return false");
  results.push({
    check: "Image generation is NOT live",
    pass: imageGenNotLive,
    detail: imageGenNotLive ? "OK" : "IMAGE_GENERATION should return false",
  });

  // Check Canva defaults to manual_handoff
  const typesContent2 = fs.readFileSync(path.join(csDir, "types.ts"), "utf-8");
  const canvaManual = typesContent2.includes('CANVA_DEFAULT_STATUS') && typesContent2.includes('"manual_handoff"');
  results.push({
    check: "Canva defaults to manual_handoff",
    pass: canvaManual,
    detail: canvaManual ? "OK" : "Canva should default to manual_handoff",
  });

  // Check print specs are centralized
  const printSpecsContent = fs.readFileSync(path.join(csDir, "printSpecs.ts"), "utf-8");
  const hasPrintFormats = printSpecsContent.includes("PRINT_FORMATS") && printSpecsContent.includes("FULL_BLEED") && printSpecsContent.includes("QUARTER");
  results.push({
    check: "Print specs centralized in registry",
    pass: hasPrintFormats,
    detail: hasPrintFormats ? "OK" : "Print specs should be centralized",
  });

  // Check preflight engine exists and has BLOCKED status
  const preflightContent = fs.readFileSync(path.join(csDir, "preflightEngine.ts"), "utf-8");
  const hasBlocked = preflightContent.includes("BLOCKED") && preflightContent.includes("READY_FOR_PRODUCTION");
  results.push({
    check: "Preflight engine has BLOCKED and READY_FOR_PRODUCTION",
    pass: hasBlocked,
    detail: hasBlocked ? "OK" : "Preflight should have BLOCKED and READY_FOR_PRODUCTION",
  });

  return results;
}

if (process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("program6-verify.ts")) {
  const results = [...verifyCreativeStudioStructure(process.cwd()), ...verifyCreativeStudioDoctrines(process.cwd())];
  let failed = 0;
  console.log("\n=== Program 6 Creative Studio Verifier ===\n");
  for (const r of results) {
    if (!r.pass) failed += 1;
    console.log(`  [${r.pass ? "PASS" : "FAIL"}] ${r.check}${r.detail && !r.pass ? ` — ${r.detail}` : ""}`);
  }
  console.log(`\n=== Results: ${results.length - failed} passed, ${failed} failed (total ${results.length}) ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}
