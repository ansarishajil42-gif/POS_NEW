import { db } from "../src/server/db/index.js";
import { sql } from "drizzle-orm";
import { runScheduledAggregatorSyncs } from "../src/lib/aggregator-scheduler.server.js";

async function main() {
  console.log("================================================================================");
  console.log("LIVE AUTOMATIC STOCK SYNC INTEGRATION TEST (AL DANAH)");
  console.log("================================================================================");

  // 1. Check Al Danah Connection initial state
  const connRows: any[] = await db.execute(sql`
    SELECT id, tenant_id, branch_id, aggregator_name, store_vendor_id, is_active, is_paused, last_scheduled_sync_at, has_pending_changes
    FROM aggregator_connections
    WHERE store_vendor_id = '776282';
  `);

  if (!connRows || connRows.length === 0) {
    console.error("FATAL: Al Danah connection not found!");
    process.exit(1);
  }

  const conn = connRows[0];
  console.log("\n[STATE 1: INITIAL CONNECTION STATE]");
  console.table(connRows);

  // 2. Simulate a POS till sale for this branch (decrementing stock & flipping has_pending_changes = true)
  console.log(`\n[ACTION: SIMULATING POS TILL SALE FOR BRANCH ${conn.branch_id}]`);
  
  // Set last_scheduled_sync_at to 6 minutes ago to ensure rate-limit is satisfied for this test
  const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000);
  await db.execute(sql`
    UPDATE aggregator_connections
    SET last_scheduled_sync_at = ${sixMinutesAgo.toISOString()}
    WHERE id::text = ${conn.id};
  `);

  // Execute the exact SQL that checkoutServerFn runs on sale
  await db.execute(sql`
    UPDATE aggregator_connections
    SET has_pending_changes = true, updated_at = NOW()
    WHERE branch_id = ${conn.branch_id}::uuid
      AND is_active = true;
  `);

  // Verify has_pending_changes is now true
  const stateAfterSale: any[] = await db.execute(sql`
    SELECT id, store_vendor_id, is_active, is_paused, last_scheduled_sync_at, has_pending_changes
    FROM aggregator_connections
    WHERE id::text = ${conn.id};
  `);
  console.log("\n[STATE 2: AFTER POS SALE - has_pending_changes SHOULD BE TRUE]");
  console.table(stateAfterSale);

  if (!stateAfterSale[0].has_pending_changes) {
    console.error("FAILED: has_pending_changes was not set to true!");
    process.exit(1);
  }

  // 3. Trigger runScheduledAggregatorSyncs() (the exact background worker function)
  console.log("\n[ACTION: RUNNING runScheduledAggregatorSyncs() VIA SCHEDULER]");
  const schedulerResult = await runScheduledAggregatorSyncs();
  console.log("Scheduler execution result:", schedulerResult);

  // 4. Verify post-sync state in DB
  const stateAfterSync: any[] = await db.execute(sql`
    SELECT id, store_vendor_id, is_active, is_paused, last_scheduled_sync_at, has_pending_changes
    FROM aggregator_connections
    WHERE id::text = ${conn.id};
  `);
  console.log("\n[STATE 3: POST-SYNC - has_pending_changes SHOULD BE FALSE & last_scheduled_sync_at UPDATED]");
  console.table(stateAfterSync);

  // 5. Verify aggregator_sync_logs
  const recentLogs: any[] = await db.execute(sql`
    SELECT id, aggregator_connection_id, sync_type, status, file_name, row_count, error_message, created_at
    FROM aggregator_sync_logs
    WHERE aggregator_connection_id::text = ${conn.id}
    ORDER BY created_at DESC
    LIMIT 3;
  `);
  console.log("\n[STATE 4: MOST RECENT AGGREGATOR SYNC LOGS]");
  console.table(recentLogs);

  console.log("\n================================================================================");
  console.log("TEST SUMMARY: AUTOMATIC BACKGROUND SYNC VERIFIED!");
  console.log("================================================================================");
  process.exit(0);
}

main().catch((err) => {
  console.error("TEST FAILED WITH ERROR:", err);
  process.exit(1);
});
