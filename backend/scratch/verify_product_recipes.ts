import { db } from "../src/db/index.js";
import { sql } from "drizzle-orm";

async function verify() {
  const result = await db.execute(sql`SELECT * FROM product_recipes LIMIT 1;`);
  console.log("Query result for product_recipes:", result);
  
  const adjResult = await db.execute(sql`SELECT * FROM stock_adjustments LIMIT 1;`);
  console.log("Query result for stock_adjustments:", adjResult);

  const ledgerResult = await db.execute(sql`SELECT * FROM inventory_ledger LIMIT 1;`);
  console.log("Query result for inventory_ledger:", ledgerResult);

  console.log("All tables verified successfully!");
  process.exit(0);
}

verify().catch((e) => {
  console.error("Verification failed:", e);
  process.exit(1);
});
