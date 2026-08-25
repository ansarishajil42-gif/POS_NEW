import { sql } from "drizzle-orm";
import { db } from "./src/server/db/index";

async function run() {
  console.log("Applying VAT migrations...");
  try {
    await db.execute(sql`
      ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS subtotal numeric(12,2);
      ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS vat_rate numeric(5,2);
      ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS vat_amount numeric(12,2);
      
      ALTER TABLE vendor_invoices ADD COLUMN IF NOT EXISTS subtotal numeric(12,2);
      ALTER TABLE vendor_invoices ADD COLUMN IF NOT EXISTS vat_rate numeric(5,2);
      ALTER TABLE vendor_invoices ADD COLUMN IF NOT EXISTS vat_amount numeric(12,2);
      ALTER TABLE vendor_invoices ADD COLUMN IF NOT EXISTS grn_id uuid REFERENCES grn(id);
      
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        branch_id UUID REFERENCES branches(id),
        user_id UUID REFERENCES staff_users(id),
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        details JSON,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log("Migrations applied successfully!");
  } catch (error) {
    console.error("Error applying migrations:", error);
  }
  process.exit(0);
}

run();
