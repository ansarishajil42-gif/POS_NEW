import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import "dotenv/config";

const queryClient = postgres(process.env["DATABASE_URL"]!, {
  prepare: false, // Required for PgBouncer / Connection Pooler in Serverless
  ssl: 'require', // Ensure SSL is forced for external DB connections from Vercel
});
export const db = drizzle(queryClient, { schema });

// Helper to set RLS context for a query session
export async function withTenant<T>(tenantId: string, callback: (tx: any) => Promise<T>): Promise<T> {
  return await db.transaction(async (tx) => {
    await tx.execute(`SET LOCAL app.current_tenant_id = '${tenantId}'`);
    return await callback(tx);
  });
}
