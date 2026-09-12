import { createServerFn } from "@tanstack/react-start";
import { getSessionServerFn } from "./auth-server";

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
  storeVendorId?: string;
  filenamePrefix?: string;
  priceFormat: "price_discounted" | "original_discounted" | "original_price";
  syncFrequency: "manual" | "15min" | "hourly" | "daily";
  isPaused: boolean;
  consecutiveFailures?: number;
  lastScheduledSyncAt?: string;
  hasPendingChanges?: boolean;
  isActive: boolean;
}

async function requireTenantSession() {
  const res = await getSessionServerFn();
  if (!res?.success || !res.session || !res.session.tenantId) {
    throw new Error("Unauthorized: Valid tenant session required.");
  }
  return res.session;
}

export const getAggregatorConnectionsServerFn = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      const session = await requireTenantSession();
      const { getAggregatorConnectionsFromDb } = await import("./aggregator-sftp.server");
      const connections = await getAggregatorConnectionsFromDb(session.tenantId);
      return { success: true, connections };
    } catch (e: any) {
      console.error("Failed to load connections from DB:", e);
      return { success: false, error: e.message || "Failed to load connections", connections: [] };
    }
  },
);

export const getAggregatorBranchesServerFn = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const session = await requireTenantSession();
    const { getAggregatorBranchesFromDb } = await import("./aggregator-sftp.server");
    const resBranches = await getAggregatorBranchesFromDb(session.tenantId);
    return { success: true, branches: resBranches };
  } catch (e: any) {
    console.error("Failed to fetch active branches from DB:", e);
    return { success: false, error: e.message || "Failed to fetch branches", branches: [] };
  }
});

export const saveAggregatorConnectionServerFn = createServerFn({ method: "POST" })
  .validator((data: ConnectionConfig) => data)
  .handler(async ({ data }) => {
    try {
      const session = await requireTenantSession();
      const { saveAggregatorConnectionToDb } = await import("./aggregator-sftp.server");
      return await saveAggregatorConnectionToDb(data, session.tenantId);
    } catch (e: any) {
      console.error("Failed to save connection to DB:", e);
      return { success: false, error: "Failed to save connection to database: " + e.message };
    }
  });

export const togglePauseAutomationServerFn = createServerFn({ method: "POST" })
  .validator((data: { id: string; isPaused: boolean }) => data)
  .handler(async ({ data }) => {
    try {
      const session = await requireTenantSession();
      const { togglePauseAutomationInDb } = await import("./aggregator-sftp.server");
      return await togglePauseAutomationInDb(data.id, data.isPaused, session.tenantId);
    } catch (e: any) {
      console.error("Failed to toggle pause automation in DB:", e);
      return { success: false, error: "Failed to update status in database: " + e.message };
    }
  });

export const deleteAggregatorConnectionServerFn = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    try {
      const session = await requireTenantSession();
      const { deleteAggregatorConnectionFromDb } = await import("./aggregator-sftp.server");
      return await deleteAggregatorConnectionFromDb(data.id, session.tenantId);
    } catch (e: any) {
      console.error("Failed to delete connection from DB:", e);
      return { success: false, error: "Failed to delete connection from database: " + e.message };
    }
  });

export const getSyncSummaryServerFn = createServerFn({ method: "POST" })
  .validator((data: { connectionId: string; windowStart?: string | null }) => data)
  .handler(async ({ data }) => {
    try {
      await requireTenantSession();
      const { getSyncSummaryFromDb } = await import("./aggregator-sftp.server");
      return await getSyncSummaryFromDb(data.connectionId, data.windowStart);
    } catch (err: any) {
      return { success: false, error: "Unable to get sync summary: " + err.message };
    }
  });

export const previewAggregatorCsvServerFn = createServerFn({ method: "POST" })
  .validator((data: { connectionId: string; windowStart?: string | null }) => data)
  .handler(async ({ data }) => {
    const t0 = Date.now();
    console.log(
      `[TIMING SERVER_FN] previewAggregatorCsvServerFn received call for conn ${data.connectionId} at ${new Date(t0).toISOString()}`,
    );
    try {
      await requireTenantSession();
      const { generateDirectCsvPreviewFromDb } = await import("./aggregator-sftp.server");
      const res = await generateDirectCsvPreviewFromDb(data.connectionId, data.windowStart);
      console.log(
        `[TIMING SERVER_FN] previewAggregatorCsvServerFn completed in ${Date.now() - t0}ms`,
      );
      return res;
    } catch (err: any) {
      console.error(
        `[TIMING SERVER_FN] previewAggregatorCsvServerFn ERRORED in ${Date.now() - t0}ms:`,
        err,
      );
      return { success: false, error: "Unable to generate CSV preview: " + err.message };
    }
  });

export const triggerAggregatorSyncServerFn = createServerFn({ method: "POST" })
  .validator(
    (data: {
      connectionId: string;
      preGeneratedPayload?: { fileName: string; csvContent: string; recordCount?: number };
      windowStart?: string | null;
    }) => data,
  )
  .handler(async ({ data }) => {
    try {
      await requireTenantSession();
      const { triggerAggregatorSyncFromDb } = await import("./aggregator-sftp.server");
      return await triggerAggregatorSyncFromDb(
        data.connectionId,
        data.preGeneratedPayload,
        data.windowStart,
      );
    } catch (e: any) {
      return { success: false, error: "Error triggering SFTP sync: " + e.message };
    }
  });

export const getAggregatorSyncLogsServerFn = createServerFn({ method: "POST" })
  .validator((data: { connectionId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const session = await requireTenantSession();
      const { getAggregatorSyncLogsFromDb } = await import("./aggregator-sftp.server");
      const logs = await getAggregatorSyncLogsFromDb(data.connectionId, session.tenantId);
      return { success: true, logs };
    } catch (e: any) {
      return { success: false, error: e.message || "Failed to load sync logs", logs: [] };
    }
  });

export const deleteAggregatorSyncLogServerFn = createServerFn({ method: "POST" })
  .validator((data: { logId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const session = await requireTenantSession();
      const { deleteAggregatorSyncLogFromDb } = await import("./aggregator-sftp.server");
      return await deleteAggregatorSyncLogFromDb(data.logId, session.tenantId);
    } catch (e: any) {
      console.error("Failed to delete log from database:", e);
      return { success: false, error: "Failed to delete log from database: " + e.message };
    }
  });

export const deleteAllAggregatorSyncLogsServerFn = createServerFn({ method: "POST" })
  .validator((data: { connectionId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const session = await requireTenantSession();
      const { deleteAllAggregatorSyncLogsFromDb } = await import("./aggregator-sftp.server");
      return await deleteAllAggregatorSyncLogsFromDb(data.connectionId, session.tenantId);
    } catch (e: any) {
      console.error("Failed to delete logs from database:", e);
      return { success: false, error: "Failed to delete logs from database: " + e.message };
    }
  });
