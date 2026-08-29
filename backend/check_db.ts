import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
const sqlClient = postgres('postgres://postgres.agauuzudkvbxecpukshq:sharjeel.64068%40iqra.edu@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require');
const db = drizzle(sqlClient);
db.execute(sql`SELECT count(*) FROM product_variants`)
  .then(console.log)
  .catch(console.error)
  .finally(() => process.exit(0));
