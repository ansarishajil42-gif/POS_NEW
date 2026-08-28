import "dotenv/config";
import { db } from "./src/server/db/index.js";
import { sql } from "drizzle-orm";

async function main() {
  const result = await db.execute(sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
  console.log("Tables in public schema:");
  console.log(result.map(r => r.table_name).join("\n"));
  process.exit(0);
}
main();
