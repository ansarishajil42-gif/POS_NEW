import { db } from "../src/db/index.js";
import { sql } from "drizzle-orm";

async function run() {
  console.log("=== STARTING DATABASE INDEX CREATION ===");
  try {
    const queries = [
      "CREATE INDEX IF NOT EXISTS stock_levels_branch_idx ON stock_levels(branch_id)",
      "CREATE INDEX IF NOT EXISTS shifts_branch_idx ON shifts(branch_id)",
      "CREATE INDEX IF NOT EXISTS orders_branch_idx ON orders(branch_id)",
      "CREATE INDEX IF NOT EXISTS tills_branch_idx ON tills(branch_id)",
      "CREATE INDEX IF NOT EXISTS stock_adjustments_branch_idx ON stock_adjustments(branch_id)",
      "CREATE INDEX IF NOT EXISTS price_override_requests_branch_idx ON price_override_requests(branch_id)"
    ];

    for (const q of queries) {
      console.log(`Executing: ${q}...`);
      await db.execute(sql.raw(q));
      console.log("Success.");
    }

    console.log("=== ALL INDEXES CONFIGURED SUCCESSFULLY ===");
  } catch (error: any) {
    console.error("Index creation failed:", error.message);
  } finally {
    process.exit(0);
  }
}

run();
