// Postgres client (postgres-js) + Drizzle instance.
// Singleton across hot reloads / serverless invocations to avoid connection storms.
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const globalForDb = globalThis as unknown as {
  __bindbench_sql?: ReturnType<typeof postgres>;
};

// sslmode=require in the URL is honored by postgres-js for Aurora; harmless locally.
export const sql =
  globalForDb.__bindbench_sql ??
  postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    prepare: false, // safer for poolers / serverless
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__bindbench_sql = sql;
}

export const db = drizzle(sql, { schema });
export { schema };
