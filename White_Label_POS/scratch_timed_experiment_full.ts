import { createRequire } from "module";
import dns from "dns/promises";
import { db } from "./src/server/db/index.js";
import { sql } from "drizzle-orm";
import { decryptSecret } from "./src/lib/crypto.js";
import { triggerAggregatorSyncFromDb } from "./src/lib/aggregator-sftp.server.js";

const req = createRequire(import.meta.url);
const SftpClient = req("ssh2-sftp-client");

interface TimelineRecord {
  isoTime: string;
  localTime: string;
  elapsedSec: number;
  event: string;
  result: string;
  ipUsed: string;
  details: string;
  multiIpStatus?: Record<string, string>;
}

async function checkSftpOnIp(ip: string, username: string, password: string, targetFile: string, timeoutMs = 4000): Promise<{ present: boolean; error?: string; count?: number }> {
  const client = new SftpClient();
  try {
    const connectPromise = client.connect({
      host: ip,
      port: 22,
      username: username,
      password: password,
      tryKeyboard: true,
      readyTimeout: timeoutMs,
    });
    
    // Add timeout race
    await Promise.race([
      connectPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Connection timeout")), timeoutMs))
    ]);

    const listing = await client.list("assortment");
    const isPresent = listing.some((item: any) => item.name === targetFile);
    await client.end().catch(() => {});
    return { present: isPresent, count: listing.length };
  } catch (err: any) {
    await client.end().catch(() => {});
    return { present: false, error: err.message || "Failed" };
  }
}

async function main() {
  console.log("================================================================================");
  console.log("TALABAT SFTP FILE SURVIVAL & MULTI-IP PROPAGATION MEASUREMENT");
  console.log("================================================================================");
  console.log(`Current Clock Time: ${new Date().toISOString()} (${new Date().toLocaleTimeString()})`);

  // Fetch connection details for Al Danah (store 776282)
  const connRows: any[] = await db.execute(sql`
    SELECT id, vendor_id, store_vendor_id, sftp_host, sftp_username, sftp_password 
    FROM aggregator_connections 
    WHERE store_vendor_id = '776282' OR vendor_id = 'TB_AE_4e9a0d34-3ba4-4396-96e6-e2e3e08694e8' 
    LIMIT 1;
  `);

  if (!connRows || connRows.length === 0) {
    console.error("FATAL: Al Danah connection not found in DB.");
    process.exit(1);
  }

  const conn = connRows[0];
  const targetFileName = `assortment_${conn.store_vendor_id || "776282"}.csv`;
  const hostClean = (conn.sftp_host || "").trim().replace(/^(sftp:\/\/|ssh:\/\/|https:\/\/)/, "").split("/")[0];
  const username = (conn.vendor_id || conn.sftp_username || "").trim();
  const password = decryptSecret(conn.sftp_password || "").trim();

  console.log(`Target Connection ID: ${conn.id}`);
  console.log(`Store Vendor ID: ${conn.store_vendor_id}`);
  console.log(`Target File: ${targetFileName}`);
  console.log(`SFTP Hostname: ${hostClean}`);
  console.log(`SFTP Username: ${username}`);

  // Resolve hostname IPs
  let resolvedIps: string[] = [];
  try {
    resolvedIps = await dns.resolve4(hostClean);
    console.log(`DNS Resolution for ${hostClean}:`, resolvedIps);
  } catch (e: any) {
    console.warn(`DNS resolution error:`, e.message);
    resolvedIps = ["3.10.34.55", "18.169.233.58", "18.130.79.33"];
  }

  const knownIps = Array.from(new Set([...resolvedIps, "3.10.34.55", "18.169.233.58", "18.130.79.33"]));
  console.log(`Known Target IPs to monitor:`, knownIps);

  const timeline: TimelineRecord[] = [];

  // ---------------------------------------------------------------------------
  // STEP 1: TRIGGER REAL SYNC
  // ---------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------------------");
  console.log("[STEP 1] Triggering triggerAggregatorSyncFromDb() for Al Danah...");
  const uploadStartTime = new Date();
  
  let syncResult: any;
  try {
    syncResult = await triggerAggregatorSyncFromDb(conn.id);
  } catch (err: any) {
    console.error("[STEP 1] Exception during upload:", err);
    process.exit(1);
  }

  const uploadEndTime = new Date();
  const uploadEndIso = uploadEndTime.toISOString();
  const uploadEndLocal = uploadEndTime.toLocaleTimeString();

  console.log(`[STEP 1] Upload Finished & Verified at: ${uploadEndIso} (${uploadEndLocal})`);
  console.log(`Upload Result:`, syncResult);

  if (!syncResult.success) {
    console.error("FATAL: Upload was not successful. Aborting measurement.");
    process.exit(1);
  }

  timeline.push({
    isoTime: uploadEndIso,
    localTime: uploadEndLocal,
    elapsedSec: 0,
    event: "Upload Confirmed & Verified by Server Function",
    result: "SUCCESS ✅",
    ipUsed: hostClean,
    details: `Message: ${syncResult.message}`,
  });

  // ---------------------------------------------------------------------------
  // STEP 2: IMMEDIATE SFTP CHECK (1-2 seconds post upload)
  // ---------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------------------");
  console.log("[STEP 2] Connecting persistent SFTP client immediately post-upload...");

  const primarySftp = new SftpClient();
  let primaryIp = hostClean;

  await primarySftp.connect({
    host: hostClean,
    port: 22,
    username: username,
    password: password,
    tryKeyboard: true,
    readyTimeout: 20000,
  });

  if ((primarySftp as any).sftp && (primarySftp as any).sftp._stream && (primarySftp as any).sftp._stream.remoteAddress) {
    primaryIp = (primarySftp as any).sftp._stream.remoteAddress;
  }

  const step2Time = new Date();
  const step2Elapsed = Math.round((step2Time.getTime() - uploadEndTime.getTime()) / 1000);
  const step2Listing = await primarySftp.list("assortment");
  const step2Present = step2Listing.some((item: any) => item.name === targetFileName);

  console.log(`[STEP 2] Check completed at T+${step2Elapsed}s. File present: ${step2Present ? "YES ✅" : "NO ❌"}`);
  console.log(`[STEP 2] Assortment directory contents (${step2Listing.length} items):`, step2Listing.map((i: any) => i.name));

  timeline.push({
    isoTime: step2Time.toISOString(),
    localTime: step2Time.toLocaleTimeString(),
    elapsedSec: step2Elapsed,
    event: "Immediate Post-Upload Check (Step 2)",
    result: step2Present ? "PRESENT ✅" : "ABSENT ❌",
    ipUsed: primaryIp,
    details: `Items in assortment (${step2Listing.length}): [${step2Listing.map((i: any) => i.name).join(", ")}]`,
  });

  // ---------------------------------------------------------------------------
  // STEP 3: POLL REPEATEDLY EVERY 5 SECONDS FOR 3 MINUTES (36 ITERATIONS)
  // ---------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------------------");
  console.log("[STEP 3] Starting 3-minute polling loop (every 5s, persistent SFTP connection + Multi-IP checks)...");

  let firstGoneElapsed: number | null = null;
  let firstGoneIso: string | null = null;

  for (let i = 1; i <= 36; i++) {
    await new Promise((res) => setTimeout(res, 5000));

    const checkTime = new Date();
    const elapsedSec = Math.round((checkTime.getTime() - uploadEndTime.getTime()) / 1000);
    const isoStr = checkTime.toISOString();
    const localStr = checkTime.toLocaleTimeString();

    let mainPresent = false;
    let mainItemCount = 0;
    let mainError = "";

    try {
      const listing = await primarySftp.list("assortment");
      mainPresent = listing.some((item: any) => item.name === targetFileName);
      mainItemCount = listing.length;
    } catch (pollErr: any) {
      mainError = pollErr.message;
      // If persistent connection dropped, attempt quick reconnect
      try {
        await primarySftp.connect({
          host: hostClean,
          port: 22,
          username: username,
          password: password,
          tryKeyboard: true,
          readyTimeout: 10000,
        });
        const listing = await primarySftp.list("assortment");
        mainPresent = listing.some((item: any) => item.name === targetFileName);
        mainItemCount = listing.length;
        mainError = "";
      } catch (reconnectErr: any) {
        mainError = `Reconnect failed: ${reconnectErr.message}`;
      }
    }

    if (!mainPresent && firstGoneElapsed === null && !mainError) {
      firstGoneElapsed = elapsedSec;
      firstGoneIso = isoStr;
      console.log(`\n🚨 [ALERT] FILE FIRST CONFIRMED GONE AT T+${elapsedSec}s (${isoStr})!`);
    }

    // Also run parallel multi-IP check across all 3 target IPs
    const multiIpResults: Record<string, string> = {};
    const ipCheckPromises = knownIps.map(async (ip) => {
      const res = await checkSftpOnIp(ip, username, password, targetFileName);
      if (res.error) {
        multiIpResults[ip] = `ERROR: ${res.error}`;
      } else {
        multiIpResults[ip] = res.present ? `PRESENT (${res.count} items)` : `ABSENT (${res.count} items)`;
      }
    });

    await Promise.allSettled(ipCheckPromises);

    const multiIpSummary = knownIps.map((ip) => `${ip}: ${multiIpResults[ip]}`).join(" | ");

    timeline.push({
      isoTime: isoStr,
      localTime: localStr,
      elapsedSec: elapsedSec,
      event: `Poll #${i} (T+${elapsedSec}s)`,
      result: mainError ? "ERROR ⚠️" : mainPresent ? "PRESENT ✅" : "ABSENT ❌",
      ipUsed: primaryIp,
      details: mainError ? mainError : `Main: ${mainPresent ? "PRESENT" : "ABSENT"} (${mainItemCount} items) | Multi-IP: [${multiIpSummary}]`,
      multiIpStatus: multiIpResults,
    });

    console.log(
      `[Poll #${i.toString().padStart(2, "0")}] T+${elapsedSec.toString().padStart(3, " ")}s | Main: ${
        mainPresent ? "PRESENT ✅" : "ABSENT ❌"
      } | IPs: ${multiIpSummary}`
    );
  }

  await primarySftp.end().catch(() => {});

  // ---------------------------------------------------------------------------
  // STEP 6: FETCH ALL HISTORICAL LOGS FROM AGGREGATOR_SYNC_LOGS FOR TIMELINE
  // ---------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------------------");
  console.log("[STEP 6] Fetching recent aggregator_sync_logs for cross-referencing timeline...");

  const allSyncLogs: any[] = await db.execute(sql`
    SELECT id, aggregator_connection_id, sync_type, status, file_name, row_count, error_message, created_at 
    FROM aggregator_sync_logs 
    WHERE aggregator_connection_id::text = ${conn.id} 
    ORDER BY created_at DESC 
    LIMIT 20;
  `);

  // ---------------------------------------------------------------------------
  // FINAL SUMMARY REPORT
  // ---------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log("FINAL MEASURED RESULTS & SURVIVAL ANALYSIS");
  console.log("================================================================================");
  console.log(`Upload Confirmation Time (Step 1): ${uploadEndIso} (${uploadEndLocal})`);
  
  if (firstGoneElapsed !== null) {
    console.log(`FIRST TIME FILE WAS GONE (Step 4): ${firstGoneIso} (T+${firstGoneElapsed}s)`);
    console.log(`REAL MEASURED SURVIVAL TIME: ${firstGoneElapsed} SECONDS (~${(firstGoneElapsed / 60).toFixed(1)} minutes)`);
  } else {
    console.log(`REAL MEASURED SURVIVAL TIME: File remained PRESENT throughout the entire 180s (3 minute) window!`);
  }

  console.log("\nFull Measured Timeline:");
  console.table(
    timeline.map((t) => ({
      "Local Time": t.localTime,
      "Elapsed (s)": t.elapsedSec,
      Event: t.event,
      Result: t.result,
      "Primary IP": t.ipUsed,
      Details: t.details,
    }))
  );

  console.log("\nAggregator Sync Logs History:");
  console.table(
    allSyncLogs.map((l) => ({
      Timestamp: new Date(l.created_at).toISOString(),
      "Local Time": new Date(l.created_at).toLocaleTimeString(),
      "Sync Type": l.sync_type,
      Status: l.status,
      File: l.file_name,
      Rows: l.row_count,
      Error: l.error_message || "None",
    }))
  );

  process.exit(0);
}

main().catch((err) => {
  console.error("FATAL ERROR IN MEASUREMENT SCRIPT:", err);
  process.exit(1);
});
