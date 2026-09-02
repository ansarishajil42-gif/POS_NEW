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

let connectionsFallbackStore: ConnectionConfig[] = [];
let logsFallbackStore: any[] = [];

export const getAggregatorConnectionsServerFn = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const res = await fetch(`${BACKEND_URL}/api/aggregator-sftp/connections`);
    if (res.ok) {
      const data = await res.json();
      return { success: true, connections: data.connections };
    }
  } catch (e) {}
  return { success: true, connections: connectionsFallbackStore };
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
      const res = await fetch(`${BACKEND_URL}/api/aggregator-sftp/connections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}

    const connId = data.id || `conn_${data.aggregatorName}_${Date.now()}`;
    const idx = connectionsFallbackStore.findIndex((c) => c.id === connId);
    const newConn = {
      ...data,
      id: connId,
      syncFrequency: data.syncFrequency || "manual",
      isPaused: data.isPaused ?? false,
      isActive: data.isActive ?? false,
    };
    if (idx >= 0) {
      connectionsFallbackStore[idx] = newConn;
    } else {
      connectionsFallbackStore.push(newConn);
    }
    return { success: true, connection: newConn };
  });

export const togglePauseAutomationServerFn = createServerFn({ method: "POST" })
  .validator((data: { id: string; isPaused: boolean }) => data)
  .handler(async ({ data }) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/aggregator-sftp/connections/${data.id}/toggle-pause`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPaused: data.isPaused }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}

    const conn = connectionsFallbackStore.find((c) => c.id === data.id);
    if (conn) {
      conn.isPaused = data.isPaused;
    }
    return { success: true, connection: conn };
  });

export const deleteAggregatorConnectionServerFn = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/aggregator-sftp/connections/${data.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}

    connectionsFallbackStore = connectionsFallbackStore.filter((c) => c.id !== data.id);
    return { success: true };
  });

export const previewAggregatorCsvServerFn = createServerFn({ method: "POST" })
  .validator((data: { connectionId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/aggregator-sftp/preview-csv/${data.connectionId}`);
      if (!res.ok) {
        const { generateDirectCsvPreviewFromDb } = await import("./aggregator-sftp.server");
        return await generateDirectCsvPreviewFromDb(data.connectionId);
      }
      const result = await res.json();
      return result;
    } catch (e: any) {
      try {
        const { generateDirectCsvPreviewFromDb } = await import("./aggregator-sftp.server");
        return await generateDirectCsvPreviewFromDb(data.connectionId);
      } catch (err: any) {
        return { success: false, error: "Unable to generate CSV preview: " + err.message };
      }
    }
  });

export const triggerAggregatorSyncServerFn = createServerFn({ method: "POST" })
  .validator((data: { connectionId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/aggregator-sftp/sync/${data.connectionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ syncType: "manual" }),
      });
      const result = await res.json();
      if (!res.ok) {
        return { success: false, error: result.error || "Sync disabled: Connection is inactive." };
      }
      return result;
    } catch (e: any) {
      return { success: false, error: "Network error triggering SFTP sync: " + e.message };
    }
  });

export const getAggregatorSyncLogsServerFn = createServerFn({ method: "POST" })
  .validator((data: { connectionId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/aggregator-sftp/logs/${data.connectionId}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}
    return { success: true, logs: logsFallbackStore };
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
