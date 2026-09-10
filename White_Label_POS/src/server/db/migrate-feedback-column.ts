import { db } from "./index";
import { sql } from "drizzle-orm";

async function runFeedbackMigration() {
  console.log("Applying head_office_message column migration on branch_report_submissions...");
  try {
    await db.execute(sql`
      ALTER TABLE "branch_report_submissions" 
      ADD COLUMN IF NOT EXISTS "head_office_message" text;
    `);

    console.log("Migration executed successfully!");

    // Read-only verification query
    console.log("Verifying branch_report_submissions columns...");
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

runFeedbackMigration();
