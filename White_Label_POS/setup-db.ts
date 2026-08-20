import { sql } from "drizzle-orm";
import { db } from "./src/server/db/index";

async function run() {
  console.log("Creating table...");
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS platform_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        currency TEXT NOT NULL DEFAULT 'AED',
        timezone TEXT NOT NULL DEFAULT 'Asia/Dubai',
        date_format TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log("Table created successfully!");
  } catch (error) {
    console.error("Error creating table:", error);
  }
  process.exit(0);
}

run();
