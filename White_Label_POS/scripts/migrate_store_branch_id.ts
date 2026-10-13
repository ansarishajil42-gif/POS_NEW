import { db } from "../src/server/db/index.js";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Adding store_branch_id column to aggregator_connections...");
  await db.execute(sql`
    ALTER TABLE aggregator_connections 
    ADD COLUMN IF NOT EXISTS store_branch_id text;
  `);
  console.log("Migration executed successfully!");

  const cols = await db.execute(sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'aggregator_connections' AND column_name = 'store_branch_id';
  `);
  console.log("Verification from information_schema:", JSON.stringify(cols, null, 2));
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
