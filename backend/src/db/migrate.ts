import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db } from "./index.js";
import postgres from "postgres";
import "dotenv/config";

async function runMigrations() {
  console.log("Running Drizzle migrations...");
  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("Migrations applied successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigrations();
