import { must, mustNot, pass, read } from "./ofertas-package-9-audit-utils.mjs";

const contract = read("app/lib/ofertas-locales/ofertasLocalesEnvironmentContract.ts");
const storage = read("app/lib/ofertas-locales/ofertasLocalesStoragePaths.ts");
const cleanup = read("app/lib/ofertas-locales/ofertasLocalesCleanupExecution.ts");

must(contract, "BLOB_READ_WRITE_TOKEN", "Blob env contract");
must(storage, "ofertas-locales", "server-derived Ofertas storage path");
must(cleanup, "validateOfertaLocalCleanupStoragePath", "cleanup path validation");
must(cleanup, "externalStorageCalled: false", "no storage call claim");
mustNot(cleanup, ".storage.from", "no storage adapter call");

pass("ofertas-storage-readiness-audit");
