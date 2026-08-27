import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "./schema.js";
import "dotenv/config";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not defined");
}

// Setup database connection
const queryClient = postgres(databaseUrl);
export const db = drizzle(queryClient, { schema });

// Helper to set RLS context for a query session (if RLS is implemented on DB level)
export async function withTenant<T>(tenantId: string, callback: (tx: any) => Promise<T>): Promise<T> {
  return await db.transaction(async (tx) => {
    await tx.execute(sql`SET LOCAL app.current_tenant_id = ${tenantId}`);
    return await callback(tx);
  });
}
