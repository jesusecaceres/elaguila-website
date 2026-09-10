import "server-only";

/**
 * Gate BCO-3R-B.2 — generic version of the repo's existing listingsSelectShrink.ts pattern
 * (app/(site)/clasificados/lib/listingsSelectShrink.ts), parameterized by table name instead of
 * hardcoded to `listings`. Lets business_* reads degrade gracefully if the BCO-3R-B.2 migration
 * (business_contacts.capabilities, businesses.preferred_response_method) hasn't been applied to a
 * given environment yet, rather than breaking every existing business read.
 */
export function missingColumnName(err: { message?: string } | null | undefined, table: string): string | null {
  const msg = err?.message ?? "";
  const schemaCache = msg.match(new RegExp(`Could not find the '(\\w+)' column of '${table}'`, "i"));
  if (schemaCache?.[1]) return schemaCache[1];
  const pg = msg.match(new RegExp(`column ${table}\\.(\\w+) does not exist`, "i"));
  if (pg?.[1]) return pg[1];
  const pg2 = msg.match(new RegExp(`column ["']?(\\w+)["']? of relation ["']?${table}["']? does not exist`, "i"));
  if (pg2?.[1]) return pg2[1];
  return null;
}

export function stripSelectColumn(selectList: string, column: string): string {
  return selectList
    .split(",")
    .map((s) => s.trim())
    .filter((c) => c.length > 0 && c !== column)
    .join(", ");
}

/** Shared select-shrink loop: retries with the offending column stripped until the query succeeds or nothing's left to strip. */
export async function queryWithSelectShrink<TResult>(
  table: string,
  initialColumns: string,
  // PromiseLike, not Promise — Supabase's query builders are thenables (have .then()) but aren't
  // full Promise instances (no .catch()/.finally()), which is exactly what gets passed in here.
  run: (columns: string) => PromiseLike<{ data: TResult; error: { message: string } | null }>,
): Promise<{ data: TResult; error: { message: string } | null }> {
  let cols = initialColumns;
  for (let i = 0; i < 16; i++) {
    const res = await run(cols);
    if (!res.error) return res;
    const bad = missingColumnName(res.error, table);
    if (bad) {
      const next = stripSelectColumn(cols, bad);
      if (next === cols) return { data: null as TResult, error: { message: res.error.message } };
      cols = next;
      continue;
    }
    return { data: null as TResult, error: { message: res.error.message } };
  }
  return { data: null as TResult, error: { message: "queryWithSelectShrink: max retries" } };
}
