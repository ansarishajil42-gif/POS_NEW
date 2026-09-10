import postgres from "postgres";
import "dotenv/config";

const dbUrl = process.env["DATABASE_URL"] || process.env["POSTGRES_URL"] || "";

async function run() {
  if (!dbUrl) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const sql = postgres(dbUrl, {
    prepare: false,
    ssl: dbUrl.includes("sslmode=require") || dbUrl.includes("supabase") ? "require" : false,
  });

  try {
    console.log("Running migration: ADD COLUMN IF NOT EXISTS mamo_payment_url text...");
    await sql`ALTER TABLE tenant_invoices ADD COLUMN IF NOT EXISTS mamo_payment_url text;`;
    console.log("Migration executed successfully!");

    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'tenant_invoices'
      ORDER BY ordinal_position;
    `;
    console.log("Verified tenant_invoices columns:\n", JSON.stringify(columns, null, 2));
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

run();
