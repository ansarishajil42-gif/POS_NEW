import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
const sqlClient = postgres('postgres://postgres.agauuzudkvbxecpukshq:sharjeel.64068%40iqra.edu@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require');
const db = drizzle(sqlClient);

async function check() {
  try {
    const overrides = await db.execute(sql`SELECT count(*) FROM price_override_requests`);
    console.log('price_override_requests count:', overrides);

    const audits = await db.execute(sql`SELECT count(*) FROM audit_logs`);
    console.log('audit_logs count:', audits);

    const customerCols = await db.execute(sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'customers'`);
    console.log('customers columns:', customerCols);
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}

check();

