// Postgres client (postgres-js) + Drizzle instance.
//
// Lazy initialization: the client is created on the FIRST query, not at module
// import. This keeps the Vercel build ("collecting page data") from parsing
// DATABASE_URL — so a missing/invalid URL fails at request time (recoverable),
// never at build time. Singleton across hot reloads / serverless invocations.
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

type Sql = ReturnType<typeof postgres>;
type Db = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as { __bindbench_sql?: Sql };

let _sql: Sql | undefined;
let _db: Db | undefined;

function getSql(): Sql {
  if (_sql) return _sql;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  // Aurora requires TLS (rds.force_ssl). postgres-js mis-parses the libpq
  // `?sslmode=require` query param, so enable SSL via the driver option instead.
  // Local PGlite has no TLS, so skip SSL for localhost.
  const isLocal =
    connectionString.includes("localhost") || connectionString.includes("127.0.0.1");
  _sql =
    globalForDb.__bindbench_sql ??
    postgres(connectionString, {
      max: 10,
      idle_timeout: 20,
      prepare: false, // safer for poolers / serverless
      ssl: isLocal ? undefined : { rejectUnauthorized: false },
    });
  if (process.env.NODE_ENV !== "production") {
    globalForDb.__bindbench_sql = _sql;
  }
  return _sql;
}

function getDb(): Db {
  if (!_db) _db = drizzle(getSql(), { schema });
  return _db;
}

// Lazy proxies so existing call sites (`sql`...``, `db.query…`, `db.insert…`)
// work unchanged but the real client is only built on first use.
export const sql = new Proxy(function () {} as unknown as Sql, {
  apply(_t, _thisArg, args: unknown[]) {
    return (getSql() as unknown as (...a: unknown[]) => unknown)(...args);
  },
  get(_t, prop) {
    const real = getSql() as unknown as Record<string | symbol, unknown>;
    const v = real[prop];
    return typeof v === "function" ? (v as (...a: unknown[]) => unknown).bind(real) : v;
  },
});

export const db = new Proxy({} as Db, {
  get(_t, prop) {
    const real = getDb() as unknown as Record<string | symbol, unknown>;
    const v = real[prop];
    return typeof v === "function" ? (v as (...a: unknown[]) => unknown).bind(real) : v;
  },
});

export { schema };
