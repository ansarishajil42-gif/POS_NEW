import { db } from "./src/server/db/index.js";
import { sql } from "drizzle-orm";

async function queryAllLogs() {
  console.log("=== ALL SFTP SYNC LOGS IN DATABASE ===");
  const logs: any[] = await db.execute(sql`
    SELECT l.id, l.sync_type, l.status, l.file_name, l.row_count, l.error_message, l.created_at, c.remote_directory, c.vendor_id
    FROM aggregator_sync_logs l
    LEFT JOIN aggregator_connections c ON l.aggregator_connection_id = c.id
    ORDER BY l.created_at DESC;
  `);

  console.log("Total Logs Found:", logs.length);
  console.log("All Sync Logs Output:", JSON.stringify(logs, null, 2));
  process.exit(0);
}

queryAllLogs().catch(console.error);
