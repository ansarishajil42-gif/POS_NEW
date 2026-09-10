import { db } from "./index";
import { sql } from "drizzle-orm";

async function runPayrollRunsMigration() {
  console.log("Applying payroll_runs and payroll_items migration...");
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payroll_runs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "branch_id" uuid REFERENCES "branches"("id") ON DELETE SET NULL,
        "month" text NOT NULL,
        "status" text DEFAULT 'Draft' NOT NULL,
        "total_gross" numeric(12, 2) DEFAULT '0.00' NOT NULL,
        "total_deductions" numeric(12, 2) DEFAULT '0.00' NOT NULL,
        "total_net" numeric(12, 2) DEFAULT '0.00' NOT NULL,
        "generated_by" uuid REFERENCES "staff_users"("id") ON DELETE SET NULL,
        "generated_at" timestamp DEFAULT now() NOT NULL,
        "approved_by" uuid REFERENCES "staff_users"("id") ON DELETE SET NULL,
        "approved_at" timestamp,
        "paid_at" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    // Unique constraint: one run per branch-scope per month per tenant
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'payroll_runs_tenant_branch_month_unique'
        ) THEN
          ALTER TABLE "payroll_runs" 
          ADD CONSTRAINT "payroll_runs_tenant_branch_month_unique" 
          UNIQUE ("tenant_id", "branch_id", "month");
        END IF;
      END $$;
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "payroll_runs_tenant_idx" ON "payroll_runs" ("tenant_id");
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "payroll_runs_branch_idx" ON "payroll_runs" ("branch_id");
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "payroll_runs_month_idx" ON "payroll_runs" ("month");
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "payroll_runs_status_idx" ON "payroll_runs" ("status");
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payroll_items" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "payroll_run_id" uuid NOT NULL REFERENCES "payroll_runs"("id") ON DELETE CASCADE,
        "staff_user_id" uuid NOT NULL REFERENCES "staff_users"("id") ON DELETE CASCADE,
        "basic_salary" numeric(12, 2) DEFAULT '0.00' NOT NULL,
        "total_allowances" numeric(12, 2) DEFAULT '0.00' NOT NULL,
        "gross_salary" numeric(12, 2) DEFAULT '0.00' NOT NULL,
        "unpaid_days" integer DEFAULT 0 NOT NULL,
        "unpaid_deduction" numeric(12, 2) DEFAULT '0.00' NOT NULL,
        "standard_deductions" numeric(12, 2) DEFAULT '0.00' NOT NULL,
        "net_salary" numeric(12, 2) DEFAULT '0.00' NOT NULL,
        "notes" text,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "payroll_items_run_idx" ON "payroll_items" ("payroll_run_id");
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "payroll_items_staff_idx" ON "payroll_items" ("staff_user_id");
    `);

    console.log("Migration executed successfully!");

    // Read-only verification query for payroll_runs
    console.log("Verifying payroll_runs table structure in database...");
    const runsCols = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'payroll_runs' 
      ORDER BY ordinal_position;
    `);
    console.log("Verified columns in payroll_runs:", JSON.stringify(runsCols, null, 2));

    // Read-only verification query for payroll_items
    console.log("Verifying payroll_items table structure in database...");
    const itemsCols = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'payroll_items' 
      ORDER BY ordinal_position;
    `);
    console.log("Verified columns in payroll_items:", JSON.stringify(itemsCols, null, 2));

    const countRuns = await db.execute(sql`SELECT count(*) FROM payroll_runs;`);
    const countItems = await db.execute(sql`SELECT count(*) FROM payroll_items;`);
    console.log("Verification row count payroll_runs:", JSON.stringify(countRuns, null, 2));
    console.log("Verification row count payroll_items:", JSON.stringify(countItems, null, 2));

    process.exit(0);
  } catch (err) {
    console.error("Payroll runs migration failed:", err);
    process.exit(1);
  }
}

runPayrollRunsMigration();
