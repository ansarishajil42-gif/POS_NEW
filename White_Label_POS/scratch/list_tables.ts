import { db } from "../src/server/db/index.js";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Listing tables in the database...");
    const result = await db.execute(sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
    `);
    console.log(result);
    process.exit(0);
}
main();
