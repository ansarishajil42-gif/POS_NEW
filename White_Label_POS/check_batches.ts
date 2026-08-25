import { db } from "./src/server/db/index.js";
import { sql } from "drizzle-orm";

async function verify() {
  try {
    const res = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'batches';
    `);
    console.log("Batches Columns:");
    console.table(res);
  } catch (err) {
    console.error("Failed to verify:", err);
  }
  process.exit(0);
}
verify();
