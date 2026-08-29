import { db } from "./src/db/index.js";
import { branches } from "./src/db/schema.js";
import { sql } from "drizzle-orm";

async function run() {
  const activeTills = await db.select({ count: sql<number>`coalesce(sum(${branches.tillCount}), 0)::int` }).from(branches);
  console.log("Active Tills from new query:", activeTills[0].count);
  process.exit(0);
}

run().catch(console.error);
