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

  console.log("Tables created successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
