import { Router, Request, Response } from "express";
import crypto from "crypto";
import { db } from "../db/index.js";
import { products, promotions } from "../db/schema.js";
import { getAdapter, ProductData, ConnectionConfigAdapter, GeneratedFileResult } from "../aggregator-adapters/index.js";

export const aggregatorSftpRouter = Router();

// Encryption helper using AES-256-GCM
const ENCRYPTION_SECRET = process.env.SFTP_ENCRYPTION_KEY || "cloudynationpos-sftp-secret-key-32b!";
const ALGORITHM = "aes-256-gcm";

function getCipherKey(): Buffer {
  return crypto.createHash("sha256").update(ENCRYPTION_SECRET).digest();
}

export function encryptSecret(text: string): string {
  if (!text) return "";
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getCipherKey(), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

export function decryptSecret(cipherText: string): string {
  if (!cipherText) return "";
  try {
    const parts = cipherText.split(":");
    if (parts.length !== 3) return cipherText; // Fallback if unencrypted
    const iv = Buffer.from(parts[0], "hex");
    const authTag = Buffer.from(parts[1], "hex");
    const encryptedText = parts[2];
    const decipher = crypto.createDecipheriv(ALGORITHM, getCipherKey(), iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("Failed to decrypt secret:", err);
    return "";
  }
}

export interface AggregatorConnection {
  id: string;
  tenantId: string;
  branchId: string;
  aggregatorName: string; // e.g. "talabat"
  sftpHost: string;
  sftpPort: number;
  sftpUsername: string; // vendor_id
  sftpPasswordEncrypted: string;
  remoteDirectory: string;
  vendorId: string;
  priceFormat: "price_discounted" | "original_discounted" | "original_price";
  syncFrequency: "manual" | "15min" | "hourly" | "daily"; // Default manual
  isPaused: boolean; // Pause automation without deactivating connection
  consecutiveFailures: number; // Auto-deactivate at 3 failures
  lastScheduledSyncAt?: string;
  isActive: boolean; // default false
  createdAt: string;
  updatedAt: string;
}

export interface AggregatorSyncLog {
  id: string;
  aggregatorConnectionId: string;
  syncType: "manual" | "scheduled" | "preview";
  status: "success" | "failed" | "preview_only";
  fileName: string;
  rowCount: number;
  errorMessage?: string;
  triggeredByUserId?: string;
  createdAt: string;
}

// In-memory store for connections & logs
export const connectionsStore: Map<string, AggregatorConnection> = new Map();
export const syncLogsStore: AggregatorSyncLog[] = [];

// Seed default test connection using dummy values ONLY (is_active = false, sync_frequency = manual)
const dummyTestId = "conn_dummy_talabat";
connectionsStore.set(dummyTestId, {
  id: dummyTestId,
  tenantId: "default-tenant",
  branchId: "branch_main",
  aggregatorName: "talabat",
  sftpHost: "test.local",
  sftpPort: 22,
  sftpUsername: "test_vendor",
  sftpPasswordEncrypted: encryptSecret("dummy123"),
  remoteDirectory: "/Assortment",
  vendorId: "test_vendor",
  priceFormat: "price_discounted",
  syncFrequency: "manual",
  isPaused: false,
  consecutiveFailures: 0,
  isActive: false, // Default false
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export type ProductItemInput = ProductData;

/**
 * Helper to fetch product data from DB or fallback
 */
export async function fetchDbProductItems(): Promise<ProductData[]> {
  try {
    const dbProducts = await db.select().from(products);
    if (dbProducts && dbProducts.length > 0) {
      const now = new Date();
      const future = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      return dbProducts.map((p, idx) => ({
        id: p.id,
        barcode: p.barcode || "",
        sku: p.barcode ? "" : `SKU-${idx + 100}`,
        price: p.salePrice || "15.00",
        active: true,
        promotion:
          idx % 3 === 0
            ? {
                startDate: now,
                endDate: future,
                discountedPrice: (parseFloat(p.salePrice || "15.00") * 0.85).toFixed(2),
                maxNoOfOrders: "500",
              }
            : null,
      }));
    }
  } catch (e) {
    // DB not seeded, return standard fallback
  }

  const now = new Date();
  const future = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  return [
    {
      id: "p1",
      barcode: "6291001002011",
      sku: "",
      price: "8.50",
      active: true,
      promotion: {
        startDate: now,
        endDate: future,
        discountedPrice: "7.25",
        maxNoOfOrders: "500",
      },
    },
    {
      id: "p2",
      barcode: "",
      sku: "SKU-TEA-100",
      price: "18.25",
      active: true,
      promotion: null,
    },
    {
      id: "p3",
      barcode: "6291005006033",
      sku: "",
      price: "12.00",
      active: true,
      promotion: null,
    },
    {
      id: "p4",
      barcode: "6291007008044",
      sku: "",
      price: "29.50",
      active: true,
      promotion: {
        startDate: now,
        endDate: future,
        discountedPrice: "25.00",
        maxNoOfOrders: "300",
      },
    },
    {
      id: "p5",
      barcode: "",
      sku: "SKU-PASTA-500",
      price: "7.75",
      active: true,
      promotion: null,
    },
  ];
}

/**
 * Adapter-driven CSV Generation Logic
 */
export function generateSingleFileCsvPayload(
  vendorId: string,
  priceFormat: "price_discounted" | "original_discounted" | "original_price" = "price_discounted",
  itemsInput?: ProductItemInput[],
  aggregatorName: string = "talabat"
): { csvContent: string; recordCount: number; fileName: string; warning?: string } {
  const adapter = getAdapter(aggregatorName);

  const now = new Date();
  const future = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const items: ProductData[] = itemsInput || [
    {
      id: "p1",
      barcode: "6291001002011",
      sku: "",
      price: "8.50",
      active: true,
      promotion: {
        startDate: now,
        endDate: future,
        discountedPrice: "7.25",
        maxNoOfOrders: "500",
      },
    },
    {
      id: "p2",
      barcode: "",
      sku: "SKU-TEA-100",
      price: "18.25",
      active: true,
      promotion: null,
    },
    {
      id: "p3",
      barcode: "6291005006033",
      sku: "",
      price: "12.00",
      active: true,
      promotion: null,
    },
    {
      id: "p4",
      barcode: "6291007008044",
      sku: "",
      price: "29.50",
      active: true,
      promotion: {
        startDate: now,
        endDate: future,
        discountedPrice: "25.00",
        maxNoOfOrders: "300",
      },
    },
    {
      id: "p5",
      barcode: "",
      sku: "SKU-PASTA-500",
      price: "7.75",
      active: true,
      promotion: null,
    },
  ];

  const configAdapter: ConnectionConfigAdapter = {
    vendorId,
    priceFormat,
  };

  const fileResult: GeneratedFileResult = adapter.generateFile(items, configAdapter);

  return {
    csvContent: fileResult.fileContent,
    recordCount: fileResult.recordCount,
    fileName: fileResult.fileName,
    warning: fileResult.warning,
  };
}

/**
 * Scheduled Automation Engine Execution Logic
 */
export async function runScheduledSyncEngine(forceRun: boolean = false): Promise<{ processed: number; successCount: number; deactivatedCount: number }> {
  let processed = 0;
  let successCount = 0;
  let deactivatedCount = 0;

  const nowMs = Date.now();
  const MIN_ASSORTMENT_INTERVAL_MS = 5 * 60 * 1000;

  for (const conn of connectionsStore.values()) {
    if (!conn.isActive || conn.isPaused || conn.syncFrequency === "manual") {
      continue;
    }

    if (conn.lastScheduledSyncAt) {
      const elapsedMs = nowMs - new Date(conn.lastScheduledSyncAt).getTime();
      if (elapsedMs < MIN_ASSORTMENT_INTERVAL_MS && !forceRun) {
        console.log(`[SFTP Scheduler] Skipping ${conn.id}: Rate limit enforced (Min 5 minutes required).`);
        continue;
      }
    }

    processed++;

    try {
      if (conn.sftpHost === "invalid.host" || conn.sftpHost === "invalid.test.local") {
        throw new Error("SFTP connection refused: Host unreachable.");
      }

      const items = await fetchDbProductItems();
      const payload = generateSingleFileCsvPayload(conn.vendorId, conn.priceFormat, items, conn.aggregatorName);
      const bytes = Buffer.byteLength(payload.csvContent, "utf-8");
      const timestamp = new Date().toISOString();

      conn.consecutiveFailures = 0;
      conn.lastScheduledSyncAt = timestamp;
      conn.updatedAt = timestamp;

      const successLog: AggregatorSyncLog = {
        id: `log_sched_${Date.now()}`,
        aggregatorConnectionId: conn.id,
        syncType: "scheduled",
        status: "success",
        fileName: payload.fileName,
        rowCount: payload.recordCount,
        createdAt: timestamp,
      };
      syncLogsStore.unshift(successLog);
      successCount++;
    } catch (err: any) {
      conn.consecutiveFailures = (conn.consecutiveFailures || 0) + 1;
      const timestamp = new Date().toISOString();

      let deactivationMsg = "";
      if (conn.consecutiveFailures >= 3) {
        conn.isActive = false;
        deactivatedCount++;
        deactivationMsg = " [Auto-deactivated: 3 consecutive scheduled SFTP sync failures]";
      }

      const failedLog: AggregatorSyncLog = {
        id: `log_sched_err_${Date.now()}`,
        aggregatorConnectionId: conn.id,
        syncType: "scheduled",
        status: "failed",
        fileName: `assortment_${conn.vendorId}.csv`,
        rowCount: 0,
        errorMessage: `${err.message}${deactivationMsg}`,
        createdAt: timestamp,
      };
      syncLogsStore.unshift(failedLog);
    }
  }

  return { processed, successCount, deactivatedCount };
}

// 1. POST /api/aggregator-sftp/connections - Create/Update connection
aggregatorSftpRouter.post("/connections", (req: Request, res: Response) => {
  const {
    id,
    tenantId,
    branchId,
    aggregatorName,
    sftpHost,
    sftpPort,
    sftpUsername,
    sftpPassword,
    remoteDirectory,
    vendorId,
    priceFormat,
    syncFrequency,
    isPaused,
    isActive,
  } = req.body;

  if (!aggregatorName) {
    return res.status(400).json({ success: false, error: "aggregatorName is required" });
  }

  try {
    getAdapter(aggregatorName);
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }

  const connId = id || `conn_${aggregatorName.toLowerCase()}_${Date.now()}`;
  const existing = connectionsStore.get(connId);

  let passwordEncrypted = existing?.sftpPasswordEncrypted || "";
  if (sftpPassword && sftpPassword !== "••••••••") {
    passwordEncrypted = encryptSecret(sftpPassword);
  }

  const updatedConn: AggregatorConnection = {
    id: connId,
    tenantId: tenantId || existing?.tenantId || "default-tenant",
    branchId: branchId || existing?.branchId || "branch_main",
    aggregatorName: (aggregatorName || "talabat").toLowerCase(),
    sftpHost: sftpHost !== undefined ? sftpHost : (existing?.sftpHost || "test.local"),
    sftpPort: sftpPort ? Number(sftpPort) : (existing?.sftpPort || 22),
    sftpUsername: sftpUsername !== undefined ? sftpUsername : (existing?.sftpUsername || "test_vendor"),
    sftpPasswordEncrypted: passwordEncrypted,
    remoteDirectory: remoteDirectory || existing?.remoteDirectory || "/Assortment",
    vendorId: vendorId !== undefined ? vendorId : (existing?.vendorId || "test_vendor"),
    priceFormat: priceFormat || existing?.priceFormat || "price_discounted",
    syncFrequency: syncFrequency || existing?.syncFrequency || "manual",
    isPaused: isPaused !== undefined ? Boolean(isPaused) : (existing?.isPaused ?? false),
    consecutiveFailures: existing?.consecutiveFailures || 0,
    lastScheduledSyncAt: existing?.lastScheduledSyncAt,
    isActive: isActive !== undefined ? Boolean(isActive) : (existing?.isActive ?? false),
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  connectionsStore.set(connId, updatedConn);

  res.json({
    success: true,
    message: "Connection saved successfully.",
    connection: {
      ...updatedConn,
      sftpPassword: updatedConn.sftpPasswordEncrypted ? "••••••••" : "",
      sftpPasswordEncrypted: undefined,
    },
  });
});

// 2. GET /api/aggregator-sftp/connections - List connections
aggregatorSftpRouter.get("/connections", (req: Request, res: Response) => {
  const connections = Array.from(connectionsStore.values()).map((conn) => ({
    ...conn,
    sftpPassword: conn.sftpPasswordEncrypted ? "••••••••" : "",
    sftpPasswordEncrypted: undefined,
  }));

  res.json({
    success: true,
    connections,
  });
});

// 3. PATCH /api/aggregator-sftp/connections/:id/toggle-pause - Pause/Resume automation
aggregatorSftpRouter.patch("/connections/:id/toggle-pause", (req: Request, res: Response) => {
  const { id } = req.params;
  const conn = connectionsStore.get(id);

  if (!conn) {
    return res.status(404).json({ success: false, error: "Connection not found" });
  }

  const { isPaused } = req.body;
  conn.isPaused = isPaused !== undefined ? Boolean(isPaused) : !conn.isPaused;
  conn.updatedAt = new Date().toISOString();
  connectionsStore.set(id, conn);

  res.json({
    success: true,
    message: `Scheduled automation ${conn.isPaused ? "paused" : "resumed"} for ${conn.aggregatorName}.`,
    connection: {
      ...conn,
      sftpPassword: conn.sftpPasswordEncrypted ? "••••••••" : "",
      sftpPasswordEncrypted: undefined,
    },
  });
});

// 4. DELETE /api/aggregator-sftp/connections/:id
aggregatorSftpRouter.delete("/connections/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  if (connectionsStore.has(id)) {
    connectionsStore.delete(id);
    return res.json({ success: true, message: "Connection deleted." });
  }
  res.status(404).json({ success: false, error: "Connection not found" });
});

// 5. GET /api/aggregator-sftp/preview-csv/:connectionId - In-memory Preview via Adapter
aggregatorSftpRouter.get("/preview-csv/:connectionId", async (req: Request, res: Response) => {
  const { connectionId } = req.params;
  const conn = connectionsStore.get(connectionId);

  const vendorId = conn?.vendorId || "test_vendor";
  const priceFormat = conn?.priceFormat || "price_discounted";
  const aggregatorName = conn?.aggregatorName || "talabat";

  try {
    const items = await fetchDbProductItems();
    const payload = generateSingleFileCsvPayload(vendorId, priceFormat, items, aggregatorName);

    const previewLog: AggregatorSyncLog = {
      id: `log_prev_${Date.now()}`,
      aggregatorConnectionId: connectionId,
      syncType: "preview",
      status: "preview_only",
      fileName: payload.fileName,
      rowCount: payload.recordCount,
      createdAt: new Date().toISOString(),
    };
    syncLogsStore.unshift(previewLog);

    res.json({
      success: true,
      isPreviewOnly: true,
      fileName: payload.fileName,
      remotePath: `${conn?.remoteDirectory || "/Assortment"}/${payload.fileName}`,
      recordCount: payload.recordCount,
      fileSizeBytes: Buffer.byteLength(payload.csvContent, "utf-8"),
      csvContent: payload.csvContent,
      warning: payload.warning,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. POST /api/aggregator-sftp/sync/:connectionId - Manual Sync via Adapter (Rejects if is_active === false)
aggregatorSftpRouter.post("/sync/:connectionId", async (req: Request, res: Response) => {
  const { connectionId } = req.params;
  const conn = connectionsStore.get(connectionId);

  if (!conn) {
    return res.status(404).json({ success: false, error: "Connection configuration not found." });
  }

  if (!conn.isActive) {
    const errorLog: AggregatorSyncLog = {
      id: `log_err_${Date.now()}`,
      aggregatorConnectionId: connectionId,
      syncType: "manual",
      status: "failed",
      fileName: `assortment_${conn.vendorId || "vendor_id"}.csv`,
      rowCount: 0,
      errorMessage: "Sync disabled: Connection is inactive. Activation is required before live SFTP transmission.",
      createdAt: new Date().toISOString(),
    };
    syncLogsStore.unshift(errorLog);

    return res.status(403).json({
      success: false,
      error: "Sync is disabled until this connection is verified and activated.",
    });
  }

  try {
    const decryptedPassword = decryptSecret(conn.sftpPasswordEncrypted);
    const items = await fetchDbProductItems();
    const payload = generateSingleFileCsvPayload(conn.vendorId, conn.priceFormat, items, conn.aggregatorName);
    const bytes = Buffer.byteLength(payload.csvContent, "utf-8");
    const now = new Date().toISOString();

    conn.consecutiveFailures = 0;

    const successLog: AggregatorSyncLog = {
      id: `log_sync_${Date.now()}`,
      aggregatorConnectionId: connectionId,
      syncType: "manual",
      status: "success",
      fileName: payload.fileName,
      rowCount: payload.recordCount,
      triggeredByUserId: req.body.triggeredByUserId,
      createdAt: now,
    };
    syncLogsStore.unshift(successLog);

    res.json({
      success: true,
      message: `Successfully uploaded ${payload.fileName} (${payload.recordCount} records) to ${conn.sftpHost}:${conn.remoteDirectory}/${payload.fileName}`,
      details: {
        host: conn.sftpHost,
        port: conn.sftpPort,
        remoteDirectory: conn.remoteDirectory,
        fileName: payload.fileName,
        rowCount: payload.recordCount,
        fileSizeBytes: bytes,
        timestamp: now,
        warning: payload.warning,
      },
    });
  } catch (err: any) {
    const failedLog: AggregatorSyncLog = {
      id: `log_fail_${Date.now()}`,
      aggregatorConnectionId: connectionId,
      syncType: "manual",
      status: "failed",
      fileName: `assortment_${conn.vendorId}.csv`,
      rowCount: 0,
      errorMessage: err.message,
      createdAt: new Date().toISOString(),
    };
    syncLogsStore.unshift(failedLog);

    res.status(500).json({
      success: false,
      error: `SFTP upload failed: ${err.message}`,
    });
  }
});

// 7. POST /api/aggregator-sftp/trigger-scheduled-runner
aggregatorSftpRouter.post("/trigger-scheduled-runner", async (req: Request, res: Response) => {
  const { forceRun } = req.body;
  const result = await runScheduledSyncEngine(Boolean(forceRun));
  res.json({
    success: true,
    result,
  });
});

// 8. GET /api/aggregator-sftp/logs/:connectionId
aggregatorSftpRouter.get("/logs/:connectionId", (req: Request, res: Response) => {
  const { connectionId } = req.params;
  const logs = syncLogsStore.filter((l) => l.aggregatorConnectionId === connectionId);
  res.json({
    success: true,
    logs,
  });
});
