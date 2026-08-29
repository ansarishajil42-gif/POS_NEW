import { db } from "./src/db/index.js";
import { sql } from "drizzle-orm";

async function check() {
  const columns = await db.execute(sql`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'platform_settings'
  `);
  console.log(columns);
  process.exit(0);
}
check().catch(console.error);
