import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

const sql = postgres(process.env.DATABASE_URL);

async function checkIndexes() {
  try {
    const indexes = await sql`
      SELECT tablename, indexname 
      FROM pg_indexes 
      WHERE tablename IN ('orders', 'audit_logs', 'stock_levels', 'shifts')
      ORDER BY tablename, indexname;
    `;
    console.log("INDEXES IN DB:");
    indexes.forEach(idx => console.log(`${idx.tablename}: ${idx.indexname}`));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkIndexes();
