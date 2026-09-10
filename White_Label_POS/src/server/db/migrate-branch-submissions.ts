import { db } from "./index";
import { sql } from "drizzle-orm";

async function runBranchSubmissionsMigration() {
  console.log("Applying branch_report_submissions migration...");
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "branch_report_submissions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "branch_id" uuid NOT NULL REFERENCES "branches"("id") ON DELETE CASCADE,
        "submitted_by" uuid NOT NULL REFERENCES "staff_users"("id") ON DELETE CASCADE,
        "period_start" date NOT NULL,
        "period_end" date NOT NULL,
        "snapshot_data" jsonb NOT NULL,
        "notes" text,
        "status" text NOT NULL DEFAULT 'submitted',
        "reviewed_by" uuid REFERENCES "staff_users"("id") ON DELETE SET NULL,
        "reviewed_at" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "branch_sub_tenant_idx" ON "branch_report_submissions" ("tenant_id");
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "branch_sub_branch_idx" ON "branch_report_submissions" ("branch_id");
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "branch_sub_status_idx" ON "branch_report_submissions" ("status");
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "branch_sub_created_idx" ON "branch_report_submissions" ("created_at");
    `);

    console.log("Migration executed successfully!");

    // Read-only verification query
    console.log("Verifying branch_report_submissions table structure in database...");
    const cols = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'branch_report_submissions' 
      ORDER BY ordinal_position;
    `);

    console.log("Verified columns in branch_report_submissions:", JSON.stringify(cols, null, 2));

    const countRes = await db.execute(sql`SELECT count(*) FROM branch_report_submissions;`);
    console.log("Verification row count query:", JSON.stringify(countRes, null, 2));

    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

runBranchSubmissionsMigration();
