import "dotenv/config";
import { db } from "./src/server/db/index.js";
import { sql } from "drizzle-orm";

async function main() {
  try {
    const result = await db.execute(sql`
      SELECT column_name, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'stock_adjustments'
    `);
    console.log("Columns in stock_adjustments:");
    result.forEach((row) => {
      console.log(`- ${row.column_name}: nullable=${row.is_nullable}`);
    });
  } catch (error) {
    console.error("Error fetching schema:", error);
  }
  process.exit(0);
}

main();
