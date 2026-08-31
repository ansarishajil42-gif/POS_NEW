import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
const sqlClient = postgres('postgres://postgres.agauuzudkvbxecpukshq:sharjeel.64068%40iqra.edu@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require');
const db = drizzle(sqlClient);

async function check() {
  try {
    const tables = await db.execute(sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`);
    console.log('--- DATABASE TABLES ---');
    console.log(tables.map(t => t.table_name));

    const promotionsRows = await db.execute(sql`SELECT * FROM promotions`);
    console.log('--- PROMOTIONS ROWS ---');
    console.log(promotionsRows);
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}

check();

