import { db } from "./index";
import { sql } from "drizzle-orm";

async function runAttendanceMigration() {
  console.log("Applying attendance_records migration...");
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "attendance_records" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "branch_id" uuid REFERENCES "branches"("id") ON DELETE SET NULL,
        "staff_user_id" uuid NOT NULL REFERENCES "staff_users"("id") ON DELETE CASCADE,
        "date" date NOT NULL,
        "status" text NOT NULL,
        "hours_worked" numeric(5, 2) DEFAULT '8.00',
        "notes" text,
        "marked_by" uuid REFERENCES "staff_users"("id") ON DELETE SET NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS "att_rec_tenant_staff_date_unique" ON "attendance_records" ("tenant_id", "staff_user_id", "date");
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "att_rec_tenant_idx" ON "attendance_records" ("tenant_id");
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "att_rec_staff_idx" ON "attendance_records" ("staff_user_id");
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "att_rec_date_idx" ON "attendance_records" ("date");
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "att_rec_branch_idx" ON "attendance_records" ("branch_id");
    `);

    console.log("Migration executed successfully!");

    // Read-only verification query
    console.log("Verifying attendance_records table structure in database...");
    const cols = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'attendance_records' 
      ORDER BY ordinal_position;
    `);

    console.log("Verified columns in attendance_records:", JSON.stringify(cols, null, 2));

    const countRes = await db.execute(sql`SELECT count(*) FROM attendance_records;`);
    console.log("Verification row count query:", JSON.stringify(countRes, null, 2));

    process.exit(0);
  } catch (err) {
    console.error("Attendance migration failed:", err);
    process.exit(1);
  }
}

runAttendanceMigration();
