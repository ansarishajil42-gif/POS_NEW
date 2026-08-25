import { db } from "./src/server/db";
import { sql } from "drizzle-orm";

async function applyMigration() {
  console.log("Applying vendor payments migration...");

  try {
    await db.execute(sql`
      ALTER TABLE "vendor_invoices" ADD COLUMN IF NOT EXISTS "paid_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL;
    `);
    console.log("Added paid_amount to vendor_invoices.");

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "vendor_payments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE cascade,
        "vendor_id" uuid NOT NULL REFERENCES "vendors"("id"),
        "invoice_id" uuid NOT NULL REFERENCES "vendor_invoices"("id") ON DELETE cascade,
        "amount" numeric(12, 2) NOT NULL,
        "method" text NOT NULL,
        "reference_no" text,
        "notes" text,
        "payment_date" timestamp NOT NULL,
        "recorded_by" uuid NOT NULL REFERENCES "staff_users"("id"),
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    console.log("Created vendor_payments table.");

    console.log("Migration successful!");
  } catch (error) {
    console.error("Migration failed:", error);
  }
  process.exit(0);
}

applyMigration();
