import { db } from "../server/db/index";
import { sql } from "drizzle-orm";
import { triggerAggregatorSyncFromDb } from "./aggregator-sftp.server";

const FIVE_MINUTES_MS = 5 * 60 * 1000;

export async function runScheduledAggregatorSyncs() {
  try {
    const eligibleConnections: any[] = await db.execute(sql`
      SELECT id, branch_id, aggregator_name, store_vendor_id, vendor_id, last_scheduled_sync_at, has_pending_changes, is_active, is_paused
      FROM aggregator_connections
      WHERE is_active = true 
        AND is_paused = false 
        AND has_pending_changes = true;
    `);

    if (!eligibleConnections || eligibleConnections.length === 0) {
      return { checked: 0, synced: 0 };
    }

    const now = new Date();
    let syncedCount = 0;

    for (const conn of eligibleConnections) {
      const lastSync = conn.last_scheduled_sync_at ? new Date(conn.last_scheduled_sync_at) : null;
      
      // Check 5-minute rate limit since last sync
      if (lastSync && (now.getTime() - lastSync.getTime()) < FIVE_MINUTES_MS) {
        const remainingSec = Math.ceil((FIVE_MINUTES_MS - (now.getTime() - lastSync.getTime())) / 1000);
        console.log(`[Aggregator Scheduler] Rate limit active for store ${conn.store_vendor_id || conn.vendor_id || conn.id} (${remainingSec}s remaining until next sync).`);
        continue;
      }

      console.log(`[Aggregator Scheduler] Executing automatic sync for store ${conn.store_vendor_id || conn.vendor_id || conn.id}...`);
      
      const syncResult = await triggerAggregatorSyncFromDb(conn.id);

      if (syncResult && syncResult.success) {
        console.log(`[Aggregator Scheduler] ✅ Automatic sync succeeded for store ${conn.store_vendor_id || conn.vendor_id || conn.id}`);
        await db.execute(sql`
          UPDATE aggregator_connections
          SET has_pending_changes = false,
              last_scheduled_sync_at = NOW(),
              updated_at = NOW()
          WHERE id::text = ${conn.id};
        `);
        syncedCount++;
      } else {
        console.warn(`[Aggregator Scheduler] ⚠️ Automatic sync failed for store ${conn.store_vendor_id || conn.vendor_id || conn.id}:`, syncResult?.error || syncResult?.message);
        // Consecutive failure count and deactivation is handled inside triggerAggregatorSyncFromDb
      }
    }

    return { checked: eligibleConnections.length, synced: syncedCount };
  } catch (err: any) {
    console.error("[Aggregator Scheduler] Error during runScheduledAggregatorSyncs:", err.message || err);
    return { error: err.message || "Scheduler error" };
  }
}

export function startAggregatorScheduler() {
  if (typeof window !== "undefined") return;
  if ((globalThis as any).__aggregatorSchedulerStarted) return;
  (globalThis as any).__aggregatorSchedulerStarted = true;

  console.log("🚀 [Aggregator Scheduler] Background automatic stock sync worker initialized (1-minute interval).");

  // Run initial check shortly after startup
  setTimeout(() => {
    runScheduledAggregatorSyncs().catch((err) => console.error("[Aggregator Scheduler] Error in startup check:", err));
  }, 5000);

  // Poll every 60 seconds
  setInterval(() => {
    runScheduledAggregatorSyncs().catch((err) => console.error("[Aggregator Scheduler] Error in periodic sync interval:", err));
  }, 60 * 1000);
}
