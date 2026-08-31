import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
const sqlClient = postgres('postgres://postgres.agauuzudkvbxecpukshq:sharjeel.64068%40iqra.edu@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require');
const db = drizzle(sqlClient);

async function check() {
  try {
    const audits = await db.execute(sql`SELECT action, details FROM audit_logs ORDER BY created_at DESC LIMIT 20`);
    console.log('--- AUDIT LOG DETAILS ---');
    console.log(JSON.stringify(audits, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}

check();

