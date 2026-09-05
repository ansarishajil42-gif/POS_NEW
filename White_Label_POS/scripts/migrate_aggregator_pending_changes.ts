import { db } from "../src/server/db/index.js";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Adding has_pending_changes column to aggregator_connections...");
  await db.execute(sql`
    ALTER TABLE aggregator_connections 
    ADD COLUMN IF NOT EXISTS has_pending_changes boolean DEFAULT false NOT NULL;
  `);
  console.log("Migration executed successfully!");
  
  const cols = await db.execute(sql`
    SELECT column_name, data_type, column_default 
    FROM information_schema.columns 
    WHERE table_name = 'aggregator_connections';
  `);
  console.log("Current columns in aggregator_connections:", JSON.stringify(cols, null, 2));
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
