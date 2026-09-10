import { db } from "./index";
import { sql } from "drizzle-orm";

async function runPayrollMigration() {
  console.log("Applying employee_salary_profiles migration...");
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "employee_salary_profiles" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "staff_user_id" uuid NOT NULL REFERENCES "staff_users"("id") ON DELETE CASCADE,
        "basic_salary" numeric(12, 2) NOT NULL DEFAULT '0.00',
        "housing_allowance" numeric(12, 2) DEFAULT '0.00',
        "transport_allowance" numeric(12, 2) DEFAULT '0.00',
        "other_allowances" numeric(12, 2) DEFAULT '0.00',
        "standard_deductions" numeric(12, 2) DEFAULT '0.00',
        "payment_frequency" text DEFAULT 'monthly',
        "currency" text DEFAULT 'AED',
        "bank_name" text,
        "iban" text,
        "join_date" date,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS "emp_salary_tenant_staff_unique" ON "employee_salary_profiles" ("tenant_id", "staff_user_id");
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "emp_salary_tenant_idx" ON "employee_salary_profiles" ("tenant_id");
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "emp_salary_staff_idx" ON "employee_salary_profiles" ("staff_user_id");
    `);

    console.log("Migration executed successfully!");

    // Read-only verification query
    console.log("Verifying table structure in database...");
    const cols = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'employee_salary_profiles' 
      ORDER BY ordinal_position;
    `);

    console.log("Verified employee_salary_profiles table columns:", cols);
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

runPayrollMigration();
