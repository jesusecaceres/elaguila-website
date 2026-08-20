import { must, mustNot, pass, read } from "./ofertas-package-9-audit-utils.mjs";

const contract = read("app/lib/ofertas-locales/ofertasLocalesEnvironmentContract.ts");
const orchestrator = read("app/lib/ofertas-locales/ofertasLocalesAiScanOrchestrator.ts");
const validator = read("app/lib/ofertas-locales/ofertasLocalesGeminiCandidateValidator.ts");
const docs = read("docs/OFERTAS_PACKAGE_9_INTEGRATION_READINESS.md");

must(contract, "GEMINI_API_KEY", "Gemini env contract");
must(orchestrator, "gemini_multimodal", "Gemini provider value");
must(validator, "repairGeminiCandidatePrice", "Gemini response repair/validation");
must(docs, "DATABASE COMPATIBILITY UNKNOWN UNTIL MIGRATION", "truthful DB unknown");
mustNot(docs, "Gemini scan passed", "no fake Gemini scan");

pass("ofertas-gemini-readiness-audit");
