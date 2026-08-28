import "dotenv/config";
import { db } from "./src/server/db/index.js";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Altering stock_adjustments table to make batch_id nullable...");
  await db.execute(sql`ALTER TABLE stock_adjustments ALTER COLUMN batch_id DROP NOT NULL;`);
  
  console.log("Altering inventory_ledger table to make batch_id nullable...");
  await db.execute(sql`ALTER TABLE inventory_ledger ALTER COLUMN batch_id DROP NOT NULL;`);

  console.log("Success!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
