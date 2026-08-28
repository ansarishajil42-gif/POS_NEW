import postgres from 'postgres';
import fs from 'fs';

const sql = postgres(process.env.DATABASE_URL);

async function applyMigration() {
  try {
    const fileContent = fs.readFileSync('drizzle/0012_previous_misty_knight.sql', 'utf8');
    const statements = fileContent.split('--> statement-breakpoint');
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.trim()}`);
        await sql.unsafe(statement.trim());
      }
    }
    console.log("Migration applied successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

applyMigration();
