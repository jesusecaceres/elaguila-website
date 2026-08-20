import { NextResponse, type NextRequest } from "next/server";

import { authenticateOfertaLocalAdminOrWorker } from "@/app/lib/ofertas-locales/ofertasLocalesAdminWorkerAuth";
import { validateOfertasLocalesEnvironment } from "@/app/lib/ofertas-locales/ofertasLocalesEnvironmentValidator";
import { OFERTAS_LOCALES_MIGRATION_MANIFEST } from "@/app/lib/ofertas-locales/ofertasLocalesMigrationManifest";
import { evaluateOfertaLocalReleaseReadiness } from "@/app/lib/ofertas-locales/ofertasLocalesReleaseReadiness";
import { OFERTAS_RUNTIME_SCHEMA_REQUIREMENTS } from "@/app/lib/ofertas-locales/ofertasLocalesRuntimeSchemaMap";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await authenticateOfertaLocalAdminOrWorker(req);
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.code },
      { status: auth.status }
    );
  }

  const environment = validateOfertasLocalesEnvironment();
  const release = evaluateOfertaLocalReleaseReadiness({ environment });

  return NextResponse.json({
    ok: true,
    repositoryContract: "ready",
    environment: environment.environment,
    migrations: {
      expected: OFERTAS_LOCALES_MIGRATION_MANIFEST.length,
      applicationState: "unknown_not_checked",
      externalDatabaseChecked: false,
    },
    schemaCompatibility: {
      expectedObjects: OFERTAS_RUNTIME_SCHEMA_REQUIREMENTS.length,
      databaseChecksPerformed: false,
    },
    subsystems: environment.summary,
    release,
    externalValidation: {
      stripe: "not_run",
      gemini: "not_run",
      storage: "not_run",
      notifications: "not_run",
    },
    forbidden: {
      secretValuesReturned: false,
      databaseConnectionPerformed: false,
      externalServiceCalled: false,
    },
  });
}
