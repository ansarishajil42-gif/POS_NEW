import { db } from "./index.js";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Creating aggregator_connections and aggregator_sync_logs tables if not exist...");

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "aggregator_connections" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "tenant_id" uuid NOT NULL,
      "branch_id" uuid NOT NULL,
      "aggregator_name" text NOT NULL,
      "sftp_host" text,
      "sftp_port" integer DEFAULT 22,
      "sftp_username" text,
      "sftp_password" text,
      "remote_directory" text DEFAULT '/Assortment',
      "vendor_id" text,
      "price_format" text DEFAULT 'price_discounted' NOT NULL,
      "sync_frequency" text DEFAULT 'manual' NOT NULL,
      "is_paused" boolean DEFAULT false NOT NULL,
      "consecutive_failures" integer DEFAULT 0 NOT NULL,
      "last_scheduled_sync_at" timestamp,
      "is_active" boolean DEFAULT false NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "aggregator_sync_logs" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "aggregator_connection_id" uuid NOT NULL,
      "sync_type" text DEFAULT 'manual' NOT NULL,
      "status" text NOT NULL,
      "file_name" text NOT NULL,
      "row_count" integer DEFAULT 0 NOT NULL,
      "error_message" text,
      "triggered_by_user_id" uuid,
      "created_at" timestamp DEFAULT now() NOT NULL
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "tenant_subscriptions" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
      "billing_cycle" text DEFAULT 'monthly' NOT NULL,
      "custom_days" integer,
      "subscription_start_date" timestamp DEFAULT now() NOT NULL,
      "current_period_end_date" timestamp NOT NULL,
      "status" text DEFAULT 'active' NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "tenant_payments" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
      "amount" numeric(10, 2) NOT NULL,
      "currency" text DEFAULT 'AED' NOT NULL,
      "payment_date" timestamp NOT NULL,
      "period_covered_start" timestamp NOT NULL,
      "period_covered_end" timestamp NOT NULL,
      "notes" text,
      "recorded_by" text,
      "created_at" timestamp DEFAULT now() NOT NULL
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "stock_adjustments" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
      "branch_id" uuid NOT NULL REFERENCES "branches"("id") ON DELETE CASCADE,
      "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
      "batch_id" uuid REFERENCES "batches"("id"),
      "previous_quantity" integer NOT NULL,
      "quantity_change" integer NOT NULL,
      "new_quantity" integer NOT NULL,
      "reason" text NOT NULL,
      "adjusted_by" uuid REFERENCES "staff_users"("id"),
      "created_at" timestamp DEFAULT now() NOT NULL
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "inventory_ledger" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
      "branch_id" uuid NOT NULL REFERENCES "branches"("id") ON DELETE CASCADE,
      "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
      "batch_id" uuid REFERENCES "batches"("id"),
      "transaction_type" text NOT NULL,
      "previous_quantity" integer NOT NULL,
      "changed_quantity" integer NOT NULL,
      "new_quantity" integer NOT NULL,
      "reference_id" text,
      "reason" text,
      "created_by" uuid REFERENCES "staff_users"("id"),
      "created_at" timestamp DEFAULT now() NOT NULL
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "product_recipes" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
      "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
      "ingredient_product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
      "quantity" numeric(10, 3) NOT NULL,
      "unit" text NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    );
  `);

  console.log("Tables created successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
