import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import fs from "fs";
import path from "path";
import "dotenv/config";

async function applyMigration() {
  const queryClient = postgres(process.env["DATABASE_URL"]!);
  const db = drizzle(queryClient);
  
  const sqlContent = fs.readFileSync(path.resolve("./drizzle/0008_funny_the_professor.sql"), "utf-8");
  
  try {
    console.log("Applying migration...");
    // Just run the statements
    const statements = sqlContent.split("--> statement-breakpoint");
    for (const statement of statements) {
      if (statement.trim()) {
        console.log("Executing:", statement.trim());
        await queryClient.unsafe(statement.trim());
      }
    }
    console.log("Migration applied successfully");
  } catch (err) {
    console.error("Migration failed", err);
  } finally {
    await queryClient.end();
  }
}

applyMigration();
