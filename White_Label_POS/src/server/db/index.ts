import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import "dotenv/config";

const dbUrl = process.env["DATABASE_URL"] || process.env["POSTGRES_URL"] || "";

if (!dbUrl && typeof window === "undefined") {
  console.warn("⚠️ DATABASE_URL is not defined in environment variables.");
}

const safeDbUrl = dbUrl || "postgres://placeholder:placeholder@localhost:5432/placeholder";

const queryClient = postgres(safeDbUrl, {
  prepare: false, // Required for PgBouncer / Connection Pooler in Serverless
  ssl: dbUrl.includes("sslmode=require") || dbUrl.includes("supabase") ? 'require' : false,
});
export const db = drizzle(queryClient, { schema });

// Helper to set RLS context for a query session
export async function withTenant<T>(tenantId: string, callback: (tx: any) => Promise<T>): Promise<T> {
  return await db.transaction(async (tx) => {
    await tx.execute(`SET LOCAL app.current_tenant_id = '${tenantId}'`);
    return await callback(tx);
  });
}
