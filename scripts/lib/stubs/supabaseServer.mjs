/**
 * `@/app/lib/supabase/server`, backed by an in-memory table store the test drives.
 *
 * WHAT THIS IS FOR
 * ----------------
 * Not to model PostgreSQL — the migration's own behaviour is proven by
 * `scripts/verify-ix-rewards-sql-behavior-01.sh`, which runs it against a real PostgreSQL 16. This
 * exists so the HTTP layer can be EXECUTED: the auth gate, the order of refusals, which arguments
 * a route passes to the ledger, and what it answers. Those are where an independent reviewer
 * reintroduced fourteen money and authorization defects that the whole text-reading suite missed.
 *
 * `rpc` therefore RECORDS its calls and returns a faithful row rather than re-deriving the money
 * arithmetic a second time. What a route asks the ledger to do is exactly what these tests assert.
 *
 * The PostgREST surface implemented here is the one the modules under test actually use, measured
 * rather than guessed: select/insert/update, eq/in/is/not/filter/or/order/limit,
 * maybeSingle/single, and `{ count: "exact", head: true }`.
 */

const tables = new Map();
const authUsers = new Map();
const failingReads = new Map();
const rpcCalls = [];
let rpcHandler = null;
let idSeq = 0;

export function __reset() {
  tables.clear();
  authUsers.clear();
  // A check that throws mid-body would otherwise poison every later check with failing reads.
  failingReads.clear();
  rpcCalls.length = 0;
  rpcHandler = null;
  idSeq = 0;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://harness.invalid";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "harness-service-role";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "harness-anon";
}

/** Supabase Auth users, as `lookupAuthUserById` sees them. The staff gate cross-checks the cookie
 *  email against this, so a forged cookie must fail the test the same way it fails in production. */
export function __setAuthUsers(users) {
  authUsers.clear();
  for (const u of users ?? []) authUsers.set(u.id, { id: u.id, email: u.email });
}

/**
 * Make one table's reads FAIL, so a "we could not read this" branch can be exercised.
 *
 * Several guards in this system depend on distinguishing "nothing has happened yet" from "we do
 * not know" — the compare-and-swap token's `-1` sentinel most of all. A harness with no way to
 * produce a read error can never reach them, and the comments claiming they are load-bearing go
 * unverified.
 */
export function __failReadsOn(table, selectEquals) {
  if (!table) {
    failingReads.clear();
    return;
  }
  // `selectEquals` narrows the failure to reads that request EXACTLY that column list, so a test
  // can break one query without breaking every other read of the same table. Without it, a check
  // meant to exercise one sentinel fails an earlier lookup instead and never reaches it.
  failingReads.set(table, selectEquals ?? null);
}

export function __seed(table, rows) {
  tables.set(table, (rows ?? []).map((r) => ({ ...r })));
}
export function __rows(table) {
  return (tables.get(table) ?? []).map((r) => ({ ...r }));
}
export function __rpcCalls(fn) {
  return fn ? rpcCalls.filter((c) => c.fn === fn) : rpcCalls.slice();
}
export function __onRpc(handler) {
  rpcHandler = handler;
}
export function __nextId(prefix) {
  idSeq += 1;
  return `${prefix}-${String(idSeq).padStart(8, "0")}`;
}

/** Column defaults the migration declares, for the tables whose inserts omit them. */
const DEFAULTS = {
  leonix_rewards_refund_resolutions: { status: "open", attempts: 1, external_ref: null },
  leonix_rewards_wallets: {
    pending_cents: 0,
    available_cents: 0,
    reserved_cents: 0,
    lifetime_earned_cents: 0,
    lifetime_redeemed_cents: 0,
    lifetime_reversed_cents: 0,
    lifetime_restored_cents: 0,
    recovery_cents: 0,
    lifetime_recovery_accrued_cents: 0,
    lifetime_recovery_offset_cents: 0,
    bound_user_id: null,
    business_id: null,
    owner_user_id: null,
  },
};

function rowsOf(table) {
  if (!tables.has(table)) tables.set(table, []);
  return tables.get(table);
}

function matchesOrExpression(row, expression) {
  // PostgREST `or` grammar: `col.op.value,col.op.value`. Only the operators the code uses.
  return String(expression)
    .split(",")
    .some((clause) => {
      const first = clause.indexOf(".");
      const second = clause.indexOf(".", first + 1);
      if (first < 0 || second < 0) return false;
      const column = clause.slice(0, first);
      const op = clause.slice(first + 1, second);
      const value = clause.slice(second + 1);
      const cell = row[column];
      if (op === "eq") return String(cell) === value;
      if (op === "ilike") {
        const needle = value.replace(/^%/, "").replace(/%$/, "").toLowerCase();
        return String(cell ?? "").toLowerCase().includes(needle);
      }
      if (op === "is") return value === "null" ? cell == null : String(cell) === value;
      return false;
    });
}

class Query {
  constructor(table) {
    this.table = table;
    this.predicates = [];
    this.orderBy = null;
    this.limitTo = null;
    this.mode = "select";
    this.payload = null;
    this.wantCount = false;
    this.headOnly = false;
    this.selectedColumns = null;
  }

  select(columns, options) {
    this.selectedColumns = columns;
    if (options && options.count === "exact") this.wantCount = true;
    if (options && options.head === true) this.headOnly = true;
    if (this.mode !== "select") this.returning = true;
    return this;
  }
  insert(payload) {
    this.mode = "insert";
    this.payload = payload;
    return this;
  }
  update(payload) {
    this.mode = "update";
    this.payload = payload;
    return this;
  }
  delete() {
    this.mode = "delete";
    return this;
  }

  eq(column, value) {
    this.predicates.push((r) => String(r[column]) === String(value));
    return this;
  }
  neq(column, value) {
    this.predicates.push((r) => String(r[column]) !== String(value));
    return this;
  }
  in(column, values) {
    const list = Array.isArray(values)
      ? values
      : String(values ?? "").replace(/^\(/, "").replace(/\)$/, "").split(",");
    const set = new Set(list.map((v) => String(v).trim()));
    this.predicates.push((r) => set.has(String(r[column])));
    return this;
  }
  is(column, value) {
    this.predicates.push((r) => (value === null ? r[column] == null : r[column] === value));
    return this;
  }
  not(column, op, value) {
    if (op === "is") {
      this.predicates.push((r) => (value === null ? r[column] != null : r[column] !== value));
      return this;
    }
    if (op === "eq") {
      this.predicates.push((r) => String(r[column]) !== String(value));
      return this;
    }
    if (op === "in") {
      // PostgREST takes BOTH forms, and this repository uses the string one —
      // `.not("payment_status", "in", "(canceled,failed)")`. Assuming an array threw an unnamed
      // TypeError, which is the opposite of "refuse rather than guess".
      const values = Array.isArray(value)
        ? value
        : String(value ?? "").replace(/^\(/, "").replace(/\)$/, "").split(",");
      const set = new Set(values.map((v) => String(v).trim()));
      this.predicates.push((r) => !set.has(String(r[column])));
      return this;
    }
    // REFUSE RATHER THAN GUESS. Degrading every unknown operator to `!==` made the harness answer
    // questions it had not been taught, which is how a fake starts certifying itself.
    throw new Error(`harness: unsupported not() operator ${op}`);
  }
  gt(c, v) { this.predicates.push((r) => Number(r[c]) > Number(v)); return this; }
  gte(c, v) { this.predicates.push((r) => Number(r[c]) >= Number(v)); return this; }
  lt(c, v) { this.predicates.push((r) => Number(r[c]) < Number(v)); return this; }
  lte(c, v) {
    // Numeric where both sides are numeric, lexicographic otherwise — which is what PostgREST does
    // by column type. Comparing `5000 <= 900` as strings is the kind of quiet wrongness a harness
    // must not have.
    this.predicates.push((r) => {
      const a = r[c];
      if (Number.isFinite(Number(a)) && Number.isFinite(Number(v)) && a !== null && a !== "") {
        return Number(a) <= Number(v);
      }
      return String(a) <= String(v);
    });
    return this;
  }
  ilike(c, v) {
    const needle = String(v).replace(/^%/, "").replace(/%$/, "").toLowerCase();
    this.predicates.push((r) => String(r[c] ?? "").toLowerCase().includes(needle));
    return this;
  }
  filter(column, op, value) {
    if (op === "is") return this.is(column, value);
    if (op === "eq") return this.eq(column, value);
    if (op === "in") return this.in(column, value);
    throw new Error(`harness: unsupported filter operator ${op}`);
  }
  or(expression) {
    this.predicates.push((r) => matchesOrExpression(r, expression));
    return this;
  }
  order(column, options) {
    this.orderBy = { column, ascending: !options || options.ascending !== false };
    return this;
  }
  limit(n) {
    this.limitTo = n;
    return this;
  }

  _matching() {
    let out = rowsOf(this.table).filter((r) => this.predicates.every((p) => p(r)));
    if (this.orderBy) {
      const { column, ascending } = this.orderBy;
      out = out.slice().sort((a, b) => {
        const x = a[column];
        const y = b[column];
        if (x === y) return 0;
        return (x > y ? 1 : -1) * (ascending ? 1 : -1);
      });
    }
    if (this.limitTo != null) out = out.slice(0, this.limitTo);
    return out;
  }

  _run() {
    const store = rowsOf(this.table);
    if (this.mode === "insert") {
      const incoming = Array.isArray(this.payload) ? this.payload : [this.payload];
      const created = [];
      for (const candidate of incoming) {
        const row = {
          id: __nextId(this.table),
          created_at: new Date().toISOString(),
          ...(DEFAULTS[this.table] ?? {}),
          ...candidate,
        };
        const conflict = this.constructor.uniqueConflict?.(this.table, row, store);
        if (conflict) return { data: null, error: { code: "23505", message: conflict } };
        store.push(row);
        created.push({ ...row });
      }
      return { data: created, error: null };
    }
    if (this.mode === "update") {
      const targets = this._matching();
      const ids = new Set(targets.map((r) => r.id));
      const updated = [];
      for (const row of store) {
        if (!ids.has(row.id)) continue;
        Object.assign(row, this.payload);
        updated.push({ ...row });
      }
      return { data: updated, error: null };
    }
    if (this.mode === "delete") {
      const targets = this._matching();
      const ids = new Set(targets.map((r) => r.id));
      tables.set(this.table, store.filter((r) => !ids.has(r.id)));
      return { data: targets, error: null };
    }
    if (
      failingReads.has(this.table) &&
      (failingReads.get(this.table) === null || failingReads.get(this.table) === this.selectedColumns)
    ) {
      return { data: null, count: null, error: { code: "57014", message: "harness: read failed" } };
    }
    const data = this._matching();
    if (this.wantCount) return { data: this.headOnly ? null : data, count: data.length, error: null };
    return { data, error: null };
  }

  maybeSingle() {
    const res = this._run();
    if (res.error) return Promise.resolve(res);
    const rows = res.data ?? [];
    // PostgREST's `maybeSingle` accepts ZERO or ONE row and ERRORS on more. Returning `rows[0]`
    // for any count made this harness kinder than production in exactly the way this change was
    // once burned by: two payment records for one payment intent made the real call return an
    // error rather than a row, and the repair for that is in this diff. A route check over a
    // non-unique column would have passed here and failed in production.
    if (rows.length > 1) {
      return Promise.resolve({
        data: null,
        error: { code: "PGRST116", message: `JSON object requested, multiple (or no) rows returned (${rows.length})` },
      });
    }
    return Promise.resolve({ data: rows[0] ?? null, error: null, count: res.count });
  }
  single() {
    const res = this._run();
    if (res.error) return Promise.resolve(res);
    const rows = res.data ?? [];
    if (rows.length !== 1) {
      return Promise.resolve({
        data: null,
        error: { code: "PGRST116", message: `expected one row, got ${rows.length}` },
      });
    }
    return Promise.resolve({ data: rows[0], error: null, count: res.count });
  }
  then(onFulfilled, onRejected) {
    return Promise.resolve(this._run()).then(onFulfilled, onRejected);
  }
}

/**
 * The unique indexes that MATTER to the code under test, modelled by name.
 *
 * `leonix_rewards_wallets_bound_user_idx` is global and partial: one wallet per bound user across
 * every wallet in the system. A customer whose business binding was revoked could not be given a
 * personal wallet while the business wallet still named them, and the whole rewards system failed
 * for them permanently and silently. The harness reproduces that collision so the repair is
 * proven rather than asserted.
 */
Query.uniqueConflict = (table, row, store) => {
  if (table === "leonix_rewards_wallets") {
    if (row.bound_user_id != null && store.some((r) => r.bound_user_id === row.bound_user_id)) {
      return 'duplicate key value violates unique constraint "leonix_rewards_wallets_bound_user_idx"';
    }
    if (row.owner_user_id != null && store.some((r) => r.owner_user_id === row.owner_user_id)) {
      return 'duplicate key value violates unique constraint "leonix_rewards_wallets_owner_user_idx"';
    }
    if (row.business_id != null && store.some((r) => r.business_id === row.business_id)) {
      return 'duplicate key value violates unique constraint "leonix_rewards_wallets_business_idx"';
    }
  }
  if (table === "leonix_rewards_ledger") {
    if (store.some((r) => r.idempotency_key === row.idempotency_key)) {
      return 'duplicate key value violates unique constraint "leonix_rewards_ledger_idempotency_key_key"';
    }
  }
  if (table === "leonix_rewards_refund_resolutions") {
    const open = store.some(
      (r) =>
        r.status === "open" &&
        r.payment_record_id === row.payment_record_id &&
        r.kind === row.kind &&
        Number(r.cumulative_refunded_cents) === Number(row.cumulative_refunded_cents) &&
        String(r.external_ref ?? "") === String(row.external_ref ?? ""),
    );
    if (open) {
      return 'duplicate key value violates unique constraint "leonix_rewards_refund_resolutions_open_idx"';
    }
  }
  return null;
};

class Client {
  constructor() {
    this.auth = {
      admin: {
        async getUserById(id) {
          const user = authUsers.get(id);
          if (!user) return { data: { user: null }, error: { message: "not found" } };
          return { data: { user: { ...user } }, error: null };
        },
      },
      async getUser() {
        return { data: { user: null }, error: { message: "not supported in harness" } };
      },
    };
  }

  from(table) {
    return new Query(table);
  }
  async rpc(fn, params) {
    rpcCalls.push({ fn, params: { ...params } });
    if (rpcHandler) return rpcHandler(fn, params);
    return { data: null, error: { code: "P0001", message: `harness: no rpc handler for ${fn}` } };
  }
}

const client = new Client();

export function isSupabasePublicReadConfigured() {
  return true;
}
export function isSupabaseAdminConfigured() {
  return true;
}
export function getServerSupabaseAnon() {
  return client;
}
export function getAdminSupabase() {
  return client;
}
export function requireAdminCookie(cookies) {
  return cookies.get("leonix_admin")?.value === "1";
}
