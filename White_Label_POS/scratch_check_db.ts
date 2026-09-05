import { db } from "./src/server/db/index.js";
import { sql } from "drizzle-orm";

async function main() {
  const conns = await db.execute(sql`
    SELECT id, tenant_id, branch_id, aggregator_name, sftp_host, sftp_port, sftp_username, vendor_id, store_vendor_id, is_active 
    FROM aggregator_connections;
  `);
  console.log("CONNECTIONS:", JSON.stringify(conns, null, 2));

  const logs = await db.execute(sql`
    SELECT id, aggregator_connection_id, sync_type, status, file_name, row_count, error_message, created_at 
    FROM aggregator_sync_logs 
    ORDER BY created_at DESC 
    LIMIT 30;
  `);
  console.log("RECENT SYNC LOGS:", JSON.stringify(logs, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
