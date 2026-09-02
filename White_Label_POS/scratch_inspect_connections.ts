import { db } from "./src/server/db/index.js";
import { sql } from "drizzle-orm";

async function inspectConnections() {
  console.log("=== INSPECTING ALL AGGREGATOR CONNECTIONS IN DB ===");
  const rows: any[] = await db.execute(sql`
    SELECT id, tenant_id, branch_id, aggregator_name, sftp_host, sftp_port, sftp_username, sftp_password, remote_directory, vendor_id, price_format, sync_frequency, is_paused, consecutive_failures, is_active
    FROM aggregator_connections;
  `);

  console.log("Total Connections Found:", rows.length);
  console.log(JSON.stringify(rows, null, 2));

  // Also query branches to map branch names
  const bRows: any[] = await db.execute(sql`
    SELECT id, name FROM branches;
  `);
  console.log("\nBranches Table:", JSON.stringify(bRows, null, 2));

  process.exit(0);
}

inspectConnections().catch(console.error);
