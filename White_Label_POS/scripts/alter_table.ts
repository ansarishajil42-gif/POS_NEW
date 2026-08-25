import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import "dotenv/config";

async function main() {
    console.log("Connecting to", process.env.DATABASE_URL);
    const sql = postgres(process.env.DATABASE_URL!);
    
    try {
        console.log("Adding column...");
        await sql`ALTER TABLE tenant_settings ADD COLUMN IF NOT EXISTS allow_inventory_manager_po_draft BOOLEAN DEFAULT false NOT NULL`;
        console.log("Column added successfully!");
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.end();
    }
}

main();
