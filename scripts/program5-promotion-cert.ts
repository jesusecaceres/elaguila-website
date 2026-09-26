/**
 * RETIRED 2026-09-25.
 *
 * This certification harness targeted the former Leonix Media Staging Supabase project.
 * That project has been deleted as part of the one-project consolidation.
 *
 * Historical evidence remains in git. Do not repoint this harness at Leonix Media: it creates
 * certification fixtures and was never designed to run against customer/production data.
 */
console.error(
  "RETIRED: program5-promotion-cert targeted the deleted Leonix Media Staging project. " +
    "Do not run or repoint this harness at Leonix Media.",
);
process.exitCode = 2;
