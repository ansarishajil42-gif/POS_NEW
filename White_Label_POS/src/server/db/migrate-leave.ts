import { db } from "./index";
import { sql } from "drizzle-orm";

async function runLeaveMigration() {
  console.log("Applying leave_requests migration...");
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "leave_requests" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "staff_user_id" uuid NOT NULL REFERENCES "staff_users"("id") ON DELETE CASCADE,
        "leave_type" text NOT NULL,
        "is_paid" boolean DEFAULT true NOT NULL,
        "start_date" date NOT NULL,
        "end_date" date NOT NULL,
        "days_count" integer NOT NULL,
        "reason" text,
        "status" text DEFAULT 'pending' NOT NULL,
        "approved_by" uuid REFERENCES "staff_users"("id") ON DELETE SET NULL,
        "approved_at" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "leave_req_tenant_idx" ON "leave_requests" ("tenant_id");
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "leave_req_staff_idx" ON "leave_requests" ("staff_user_id");
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "leave_req_status_idx" ON "leave_requests" ("status");
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "leave_req_dates_idx" ON "leave_requests" ("start_date", "end_date");
    `);

    console.log("Migration executed successfully!");

    // Read-only verification query
    console.log("Verifying leave_requests table structure in database...");
    const cols = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'leave_requests' 
      ORDER BY ordinal_position;
    `);

    console.log("Verified columns in leave_requests:", JSON.stringify(cols, null, 2));

    const countRes = await db.execute(sql`SELECT count(*) FROM leave_requests;`);
    console.log("Verification row count query:", JSON.stringify(countRes, null, 2));

    process.exit(0);
  } catch (err) {
    console.error("Leave migration failed:", err);
    process.exit(1);
  }
}

runLeaveMigration();
