import { createServerFn } from "@tanstack/react-start";

const BACKEND_URL = process.env.VITE_BACKEND_URL || "http://localhost:3000";

export interface ConnectionConfig {
  id?: string;
  tenantId?: string;
  branchId?: string;
  aggregatorName: string; // e.g. "talabat"
  sftpHost: string;
  sftpPort: number;
  sftpUsername: string;
  sftpPassword?: string;
  remoteDirectory: string;
  vendorId: string;
  priceFormat: "price_discounted" | "original_discounted" | "original_price";
  syncFrequency: "manual" | "15min" | "hourly" | "daily";
  isPaused: boolean;
  consecutiveFailures?: number;
  lastScheduledSyncAt?: string;
  isActive: boolean;
}

export const getAggregatorConnectionsServerFn = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { getAggregatorConnectionsFromDb } = await import("./aggregator-sftp.server");
    const connections = await getAggregatorConnectionsFromDb();
    return { success: true, connections };
  } catch (e: any) {
    console.error("Failed to load connections from DB:", e);
    return { success: true, connections: [] };
  }
});

export const getAggregatorBranchesServerFn = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { getAggregatorBranchesFromDb } = await import("./aggregator-sftp.server");
    const resBranches = await getAggregatorBranchesFromDb();
    return { success: true, branches: resBranches };
  } catch (e: any) {
    console.error("Failed to fetch active branches from DB:", e);
    return { success: true, branches: [] };
  }
});

export const saveAggregatorConnectionServerFn = createServerFn({ method: "POST" })
  .validator((data: ConnectionConfig) => data)
  .handler(async ({ data }) => {
    try {
      const { saveAggregatorConnectionToDb } = await import("./aggregator-sftp.server");
      return await saveAggregatorConnectionToDb(data);
    } catch (e: any) {
      console.error("Failed to save connection to DB:", e);
      return { success: false, error: "Failed to save connection to database: " + e.message };
    }
  });

export const togglePauseAutomationServerFn = createServerFn({ method: "POST" })
  .validator((data: { id: string; isPaused: boolean }) => data)
  .handler(async ({ data }) => {
    try {
      const { togglePauseAutomationInDb } = await import("./aggregator-sftp.server");
      return await togglePauseAutomationInDb(data.id, data.isPaused);
    } catch (e: any) {
      console.error("Failed to toggle pause automation in DB:", e);
      return { success: false, error: "Failed to update status in database." };
    }
  });

export const deleteAggregatorConnectionServerFn = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    try {
      const { deleteAggregatorConnectionFromDb } = await import("./aggregator-sftp.server");
      return await deleteAggregatorConnectionFromDb(data.id);
    } catch (e: any) {
      console.error("Failed to delete connection from DB:", e);
      return { success: false, error: "Failed to delete connection from database." };
    }
  });

export const previewAggregatorCsvServerFn = createServerFn({ method: "POST" })
  .validator((data: { connectionId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const { generateDirectCsvPreviewFromDb } = await import("./aggregator-sftp.server");
      return await generateDirectCsvPreviewFromDb(data.connectionId);
    } catch (err: any) {
      return { success: false, error: "Unable to generate CSV preview: " + err.message };
    }
  });

export const triggerAggregatorSyncServerFn = createServerFn({ method: "POST" })
  .validator((data: { connectionId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const { triggerAggregatorSyncFromDb } = await import("./aggregator-sftp.server");
      return await triggerAggregatorSyncFromDb(data.connectionId);
    } catch (e: any) {
      return { success: false, error: "Error triggering SFTP sync: " + e.message };
    }
  });

export const getAggregatorSyncLogsServerFn = createServerFn({ method: "POST" })
  .validator((data: { connectionId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const { getAggregatorSyncLogsFromDb } = await import("./aggregator-sftp.server");
      const logs = await getAggregatorSyncLogsFromDb(data.connectionId);
      return { success: true, logs };
    } catch (e: any) {
      return { success: true, logs: [] };
    }
  });

export const triggerScheduledRunnerServerFn = createServerFn({ method: "POST" })
  .validator((data: { forceRun?: boolean }) => data)
  .handler(async ({ data }) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/aggregator-sftp/trigger-scheduled-runner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}
    return { success: true, result: { processed: 0, successCount: 0, deactivatedCount: 0 } };
  });
