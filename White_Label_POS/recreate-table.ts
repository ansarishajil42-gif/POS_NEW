import "dotenv/config";
import { db } from "./src/server/db/index.js";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Creating stock_adjustments table...");
  
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "stock_adjustments" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "tenant_id" uuid NOT NULL,
      "branch_id" uuid NOT NULL,
      "product_id" uuid NOT NULL,
      "batch_id" uuid,
      "previous_quantity" integer NOT NULL,
      "quantity_change" integer NOT NULL,
      "new_quantity" integer NOT NULL,
      "reason" text NOT NULL,
      "adjusted_by" uuid,
      "created_at" timestamp DEFAULT now() NOT NULL
    );
  `);

  console.log("Adding foreign keys for stock_adjustments...");

  try { await db.execute(sql`ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;`); } catch(e){}
  try { await db.execute(sql`ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;`); } catch(e){}
  try { await db.execute(sql`ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;`); } catch(e){}
  try { await db.execute(sql`ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE set null ON UPDATE no action;`); } catch(e){}
  try { await db.execute(sql`ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_adjusted_by_staff_users_id_fk" FOREIGN KEY ("adjusted_by") REFERENCES "public"."staff_users"("id") ON DELETE no action ON UPDATE no action;`); } catch(e){}

  console.log("Success! Table stock_adjustments is now created and ready.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
