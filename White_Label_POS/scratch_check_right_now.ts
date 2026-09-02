import { createRequire } from "module";
import { db } from "./src/server/db/index.js";
import { sql } from "drizzle-orm";
import { decryptSecret } from "./src/lib/crypto.js";

const req = createRequire(import.meta.url);
const SftpClient = req("ssh2-sftp-client");

async function main() {
  console.log("=== 1. FRESH LIVE SFTP LISTING RIGHT NOW ===");
  const connRows: any[] = await db.execute(sql`
    SELECT id, vendor_id, sftp_host, sftp_username, remote_directory, is_active
    FROM aggregator_connections
    WHERE vendor_id LIKE '%TB_AE%';
  `);

  if (connRows.length === 0) process.exit(1);

  const conn = connRows[0];
  const hostClean = (conn.sftp_host || "").trim().replace(/^(sftp:\/\/|ssh:\/\/|https:\/\/)/, "").split("/")[0];
  const vendorUsername = (conn.vendor_id || "").trim();
  const password = decryptSecret(conn.sftp_password || "").trim();

  const sftp = new SftpClient();

  try {
    await sftp.connect({
      host: hostClean,
      port: conn.sftp_port || 22,
      username: vendorUsername,
      password: password,
      tryKeyboard: true,
      readyTimeout: 25000,
    });

    console.log("Connected to SFTP!");

    const lowItems = await sftp.list("assortment");
    console.log(`sftp.list('assortment') [LOWERCASE] item count = ${lowItems.length}`);
    console.log("Items inside 'assortment':", JSON.stringify(lowItems, null, 2));

    const capItems = await sftp.list("Assortment");
    console.log(`sftp.list('Assortment') [CAPITAL] item count = ${capItems.length}`);
    console.log("Items inside 'Assortment':", JSON.stringify(capItems, null, 2));

    await sftp.end();
  } catch (err: any) {
    console.error("SFTP Error:", err.message);
  }

  console.log("\n=== 2. DATABASE AGGREGATOR_SYNC_LOGS (LAST 5 ENTRIES) ===");
  const logRows: any[] = await db.execute(sql`
    SELECT id, sync_type, status, file_name, row_count, error_message, created_at
    FROM aggregator_sync_logs
    ORDER BY created_at DESC
    LIMIT 5;
  `);
  console.log(JSON.stringify(logRows, null, 2));

  process.exit(0);
}

main().catch(console.error);
