import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
const sqlClient = postgres('postgres://postgres.agauuzudkvbxecpukshq:sharjeel.64068%40iqra.edu@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require');
const db = drizzle(sqlClient);

async function check() {
  try {
    const columns = await db.execute(sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'stock_adjustments'`);
    console.log('--- STOCK_ADJUSTMENTS COLUMNS ---');
    console.log(columns);
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}

check();

