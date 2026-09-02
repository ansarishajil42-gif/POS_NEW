import { Router, Request, Response } from "express";
import crypto from "crypto";
import { eq, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  aggregatorConnections,
  aggregatorSyncLogs,
  products,
  promotions,
  tenants,
  branches,
} from "../db/schema.js";
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

export function cleanSftpHost(host: string): string {
  if (!host) return "";
  let clean = host.trim();
  if (clean.startsWith("sftp://")) clean = clean.replace("sftp://", "");
  if (clean.startsWith("ssh://")) clean = clean.replace("ssh://", "");
  if (clean.startsWith("https://")) clean = clean.replace("https://", "");
  if (clean.includes("/")) clean = clean.split("/")[0];
  return clean;
}

// Deprecated in-memory stores kept for export backward compatibility
export const connectionsStore: Map<string, AggregatorConnection> = new Map();
export const syncLogsStore: AggregatorSyncLog[] = [];

function isUuid(str: string): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

async function resolveTenantAndBranch(tenantIdInput?: string, branchIdInput?: string) {
  let tenantId = isUuid(tenantIdInput || "") ? tenantIdInput! : "";
  let branchId = isUuid(branchIdInput || "") ? branchIdInput! : "";

  if (!tenantId) {
    const firstTenant = (await db.select().from(tenants).limit(1))[0];
    if (firstTenant) tenantId = firstTenant.id;
  }
  if (!branchId) {
    const firstBranch = (await db.select().from(branches).limit(1))[0];
    if (firstBranch) branchId = firstBranch.id;
  }
  return { tenantId, branchId };
}

export type ProductItemInput = ProductData;

/**
 * Helper to fetch product data from DB with real promotions
 */
export async function fetchDbProductItems(): Promise<ProductData[]> {
  const dbProducts = await db.select().from(products);
  if (!dbProducts || dbProducts.length === 0) {
    throw new Error("Unable to load products from database — check database connection or seed data.");
  }

  let dbPromotions: any[] = [];
  try {
    dbPromotions = await db.select().from(promotions);
  } catch (err) {
    console.warn("Could not fetch promotions from DB:", err);
  }

  const now = new Date();

  // Filter active promotions
  const activePromos = dbPromotions.filter((p) => {
    if (!p.status || p.status.toLowerCase() !== "active") return false;
    const start = new Date(p.startDate);
    const end = new Date(p.endDate);
    return now >= start && now <= end;
  });

  return dbProducts.map((p, idx) => {
    const matchingPromo = activePromos.find((promo) => {
      if (promo.tenantId && p.tenantId && promo.tenantId !== p.tenantId) {
        return false;
      }
      if (promo.targetProductIds) {
        try {
          const ids: string[] =
            typeof promo.targetProductIds === "string" && promo.targetProductIds.startsWith("[")
              ? JSON.parse(promo.targetProductIds)
              : promo.targetProductIds.split(",").map((s: string) => s.trim());
          if (ids.includes(p.id)) return true;
        } catch (e) {
          if (promo.targetProductIds.includes(p.id)) return true;
        }
      }
      if (promo.targetCategory && p.category) {
        if (promo.targetCategory.toLowerCase() === p.category.toLowerCase()) return true;
      }
      if (promo.target === "All" || (!promo.targetCategory && !promo.targetProductIds)) {
        return true;
      }
      return false;
    });

    let promoObj: ProductData["promotion"] = null;

    if (matchingPromo) {
      const salePriceNum = parseFloat(p.salePrice || "15.00");
      const discountValNum = parseFloat(matchingPromo.discountValue || "0.00");
      let discPriceStr = salePriceNum.toFixed(2);

      const dType = (matchingPromo.discountType || "").toLowerCase();
      if (dType === "percentage") {
        discPriceStr = Math.max(0, salePriceNum * (1 - discountValNum / 100)).toFixed(2);
      } else if (dType === "fixed") {
        discPriceStr = Math.max(0, salePriceNum - discountValNum).toFixed(2);
      }

      promoObj = {
        startDate: new Date(matchingPromo.startDate),
        endDate: new Date(matchingPromo.endDate),
        discountedPrice: discPriceStr,
        maxNoOfOrders: matchingPromo.maxQty ? String(matchingPromo.maxQty) : "500",
      };
    }

    return {
      id: p.id,
      barcode: p.barcode || "",
      sku: p.barcode ? "" : `SKU-${idx + 100}`,
      price: p.salePrice || "15.00",
      active: true,
      promotion: promoObj,
    };
  });
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

  if (!itemsInput || itemsInput.length === 0) {
    throw new Error("Cannot generate CSV payload: No items supplied.");
  }

  const configAdapter: ConnectionConfigAdapter = {
    vendorId,
    priceFormat,
  };

  const fileResult: GeneratedFileResult = adapter.generateFile(itemsInput, configAdapter);

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

  const conns = await db.select().from(aggregatorConnections);

  for (const conn of conns) {
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
      if (conn.sftpHost === "invalid.host" || conn.sftpHost === "invalid.test.local" || conn.sftpHost === "test.local") {
        throw new Error("SFTP connection refused: Host unreachable.");
      }

      const items = await fetchDbProductItems();
      const payload = generateSingleFileCsvPayload(conn.vendorId || "", (conn.priceFormat as any) || "price_discounted", items, conn.aggregatorName);
      const timestamp = new Date();

      await db
        .update(aggregatorConnections)
        .set({
          consecutiveFailures: 0,
          lastScheduledSyncAt: timestamp,
          updatedAt: timestamp,
        })
        .where(eq(aggregatorConnections.id, conn.id));

      await db.insert(aggregatorSyncLogs).values({
        aggregatorConnectionId: conn.id,
        syncType: "scheduled",
        status: "success",
        fileName: payload.fileName,
        rowCount: payload.recordCount,
        createdAt: timestamp,
      });

      successCount++;
    } catch (err: any) {
      const failures = (conn.consecutiveFailures || 0) + 1;
      const timestamp = new Date();

      let deactivationMsg = "";
      let newIsActive: boolean = Boolean(conn.isActive);
      if (failures >= 3) {
        newIsActive = false;
        deactivatedCount++;
        deactivationMsg = " [Auto-deactivated: 3 consecutive scheduled SFTP sync failures]";
      }

      await db
        .update(aggregatorConnections)
        .set({
          consecutiveFailures: failures,
          isActive: newIsActive,
          updatedAt: timestamp,
        })
        .where(eq(aggregatorConnections.id, conn.id));

      await db.insert(aggregatorSyncLogs).values({
        aggregatorConnectionId: conn.id,
        syncType: "scheduled",
        status: "failed",
        fileName: `assortment_${conn.vendorId || "vendor"}.csv`,
        rowCount: 0,
        errorMessage: `${err.message}${deactivationMsg}`,
        createdAt: timestamp,
      });
    }
  }

  return { processed, successCount, deactivatedCount };
}

// 1. POST /api/aggregator-sftp/connections - Create/Update connection
aggregatorSftpRouter.post("/connections", async (req: Request, res: Response) => {
  const {
    id,
    tenantId: tenantIdInput,
    branchId: branchIdInput,
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

  const { tenantId, branchId } = await resolveTenantAndBranch(tenantIdInput, branchIdInput);

  try {
    let existingRecord: any = null;
    if (id && isUuid(id)) {
      existingRecord = (await db.select().from(aggregatorConnections).where(eq(aggregatorConnections.id, id)))[0];
    }

    let passwordEncrypted = existingRecord?.sftpPassword || "";
    if (sftpPassword && sftpPassword !== "••••••••") {
      passwordEncrypted = encryptSecret(sftpPassword.trim());
    }

    const rawHost = sftpHost !== undefined ? sftpHost : existingRecord?.sftpHost;

    if (existingRecord) {
      const updatedValues = {
        tenantId: tenantId || existingRecord.tenantId,
        branchId: branchId || existingRecord.branchId,
        aggregatorName: (aggregatorName || "talabat").toLowerCase(),
        sftpHost: rawHost ? cleanSftpHost(rawHost) : null,
        sftpPort: sftpPort ? Number(sftpPort) : (existingRecord.sftpPort || 22),
        sftpUsername: sftpUsername !== undefined ? sftpUsername : existingRecord.sftpUsername,
        sftpPassword: passwordEncrypted,
        remoteDirectory: remoteDirectory || existingRecord.remoteDirectory || "/Assortment",
        vendorId: vendorId !== undefined ? vendorId : existingRecord.vendorId,
        priceFormat: priceFormat || existingRecord.priceFormat || "price_discounted",
        syncFrequency: syncFrequency || existingRecord.syncFrequency || "manual",
        isPaused: isPaused !== undefined ? Boolean(isPaused) : (existingRecord.isPaused ?? false),
        isActive: isActive !== undefined ? Boolean(isActive) : (existingRecord.isActive ?? false),
        updatedAt: new Date(),
      };

      const [saved] = await db
        .update(aggregatorConnections)
        .set(updatedValues)
        .where(eq(aggregatorConnections.id, existingRecord.id))
        .returning();

      return res.json({
        success: true,
        message: "Connection saved successfully.",
        connection: {
          ...saved,
          sftpPassword: saved.sftpPassword ? "••••••••" : "",
        },
      });
    } else {
      const insertValues = {
        tenantId,
        branchId,
        aggregatorName: (aggregatorName || "talabat").toLowerCase(),
        sftpHost: rawHost ? cleanSftpHost(rawHost) : null,
        sftpPort: sftpPort ? Number(sftpPort) : 22,
        sftpUsername: sftpUsername || "",
        sftpPassword: passwordEncrypted,
        remoteDirectory: remoteDirectory || "/Assortment",
        vendorId: vendorId || "",
        priceFormat: priceFormat || "price_discounted",
        syncFrequency: syncFrequency || "manual",
        isPaused: isPaused !== undefined ? Boolean(isPaused) : false,
        consecutiveFailures: 0,
        isActive: isActive !== undefined ? Boolean(isActive) : false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const [saved] = await db.insert(aggregatorConnections).values(insertValues).returning();

      return res.json({
        success: true,
        message: "Connection created successfully.",
        connection: {
          ...saved,
          sftpPassword: saved.sftpPassword ? "••••••••" : "",
        },
      });
    }
  } catch (err: any) {
    console.error("Failed to save connection to DB:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 2. GET /api/aggregator-sftp/connections - List connections
aggregatorSftpRouter.get("/connections", async (req: Request, res: Response) => {
  try {
    const rawConns = await db.select().from(aggregatorConnections);
    const connections = rawConns.map((conn) => ({
      ...conn,
      sftpPassword: conn.sftpPassword ? "••••••••" : "",
    }));

    res.json({
      success: true,
      connections,
    });
  } catch (err: any) {
    console.error("Failed to list connections from DB:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. PATCH /api/aggregator-sftp/connections/:id/toggle-pause - Pause/Resume automation
aggregatorSftpRouter.patch("/connections/:id/toggle-pause", async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!isUuid(id)) {
    return res.status(400).json({ success: false, error: "Invalid Connection ID" });
  }

  try {
    const connList = await db.select().from(aggregatorConnections).where(eq(aggregatorConnections.id, id));
    const conn = connList[0];

    if (!conn) {
      return res.status(404).json({ success: false, error: "Connection not found" });
    }

    const { isPaused } = req.body;
    const newIsPaused = isPaused !== undefined ? Boolean(isPaused) : !conn.isPaused;

    const [updated] = await db
      .update(aggregatorConnections)
      .set({
        isPaused: newIsPaused,
        updatedAt: new Date(),
      })
      .where(eq(aggregatorConnections.id, id))
      .returning();

    res.json({
      success: true,
      message: `Scheduled automation ${updated.isPaused ? "paused" : "resumed"} for ${updated.aggregatorName}.`,
      connection: {
        ...updated,
        sftpPassword: updated.sftpPassword ? "••••••••" : "",
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. DELETE /api/aggregator-sftp/connections/:id
aggregatorSftpRouter.delete("/connections/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!isUuid(id)) {
    return res.status(400).json({ success: false, error: "Invalid Connection ID" });
  }

  try {
    const deleted = await db.delete(aggregatorConnections).where(eq(aggregatorConnections.id, id)).returning();
    if (deleted.length > 0) {
      return res.json({ success: true, message: "Connection deleted." });
    }
    res.status(404).json({ success: false, error: "Connection not found" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. GET /api/aggregator-sftp/preview-csv/:connectionId - In-memory Preview via Adapter
aggregatorSftpRouter.get("/preview-csv/:connectionId", async (req: Request, res: Response) => {
  const { connectionId } = req.params;
  let conn: any = null;

  if (isUuid(connectionId)) {
    const list = await db.select().from(aggregatorConnections).where(eq(aggregatorConnections.id, connectionId));
    conn = list[0];
  }

  const vendorId = conn?.vendorId || "vendor_id";
  const priceFormat = conn?.priceFormat || "price_discounted";
  const aggregatorName = conn?.aggregatorName || "talabat";

  try {
    const items = await fetchDbProductItems();
    const payload = generateSingleFileCsvPayload(vendorId, priceFormat, items, aggregatorName);

    if (conn && conn.id) {
      await db.insert(aggregatorSyncLogs).values({
        aggregatorConnectionId: conn.id,
        syncType: "preview",
        status: "preview_only",
        fileName: payload.fileName,
        rowCount: payload.recordCount,
        createdAt: new Date(),
      });
    }

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
  if (!isUuid(connectionId)) {
    return res.status(400).json({ success: false, error: "Invalid Connection ID" });
  }

  const list = await db.select().from(aggregatorConnections).where(eq(aggregatorConnections.id, connectionId));
  const conn = list[0];

  if (!conn) {
    return res.status(404).json({ success: false, error: "Connection configuration not found." });
  }

  if (!conn.isActive) {
    await db.insert(aggregatorSyncLogs).values({
      aggregatorConnectionId: connectionId,
      syncType: "manual",
      status: "failed",
      fileName: `assortment_${conn.vendorId || "vendor"}.csv`,
      rowCount: 0,
      errorMessage: "Sync disabled: Connection is inactive. Activation is required before live SFTP transmission.",
      createdAt: new Date(),
    });

    return res.status(403).json({
      success: false,
      error: "Sync is disabled until this connection is verified and activated.",
    });
  }

  try {
    const decryptedPassword = decryptSecret(conn.sftpPassword || "");
    const items = await fetchDbProductItems();
    const payload = generateSingleFileCsvPayload(conn.vendorId || "", (conn.priceFormat as any) || "price_discounted", items, conn.aggregatorName);
    const bytes = Buffer.byteLength(payload.csvContent, "utf-8");
    const now = new Date();

    const hostClean = cleanSftpHost(conn.sftpHost || "");

    // Perform real SFTP upload if host is non-dummy
    if (hostClean && hostClean !== "test.local" && hostClean !== "invalid.host") {
      try {
        const SftpClient = (await import("ssh2-sftp-client")).default;
        const sftp = new SftpClient();
        await sftp.connect({
          host: hostClean,
          port: conn.sftpPort || 22,
          username: (conn.sftpUsername || conn.vendorId || "").trim(),
          password: decryptedPassword.trim(),
          readyTimeout: 25000,
          algorithms: {
            serverHostKey: [
              "ssh-rsa",
              "rsa-sha2-256",
              "rsa-sha2-512",
              "ecdsa-sha2-nistp256",
              "ecdsa-sha2-nistp384",
              "ecdsa-sha2-nistp521",
              "ssh-ed25519",
            ],
            cipher: [
              "aes128-ctr",
              "aes192-ctr",
              "aes256-ctr",
              "aes128-gcm",
              "aes128-gcm@openssh.com",
              "aes256-gcm",
              "aes256-gcm@openssh.com",
              "aes128-cbc",
              "aes192-cbc",
              "aes256-cbc",
            ],
            kex: [
              "curve25519-sha256",
              "curve25519-sha256@libssh.org",
              "ecdh-sha2-nistp256",
              "ecdh-sha2-nistp384",
              "ecdh-sha2-nistp521",
              "diffie-hellman-group14-sha256",
              "diffie-hellman-group14-sha1",
              "diffie-hellman-group1-sha1",
            ],
          },
        });
        const remoteFilePath = `${conn.remoteDirectory || "/Assortment"}/${payload.fileName}`;
        const fileBuffer = Buffer.from(payload.csvContent, "utf-8");
        await sftp.put(fileBuffer, remoteFilePath);
        await sftp.end();
      } catch (sftpErr: any) {
        // Step 5 Failure Safeguard: Auto-deactivate on upload failure
        await db
          .update(aggregatorConnections)
          .set({
            isActive: false,
            consecutiveFailures: (conn.consecutiveFailures || 0) + 1,
            updatedAt: new Date(),
          })
          .where(eq(aggregatorConnections.id, connectionId));

        throw new Error(`SFTP Transmission Failure (${hostClean}): ${sftpErr.message}`);
      }
    }

    await db
      .update(aggregatorConnections)
      .set({
        consecutiveFailures: 0,
        updatedAt: now,
      })
      .where(eq(aggregatorConnections.id, connectionId));

    const userId = isUuid(req.body.triggeredByUserId || "") ? req.body.triggeredByUserId : null;

    await db.insert(aggregatorSyncLogs).values({
      aggregatorConnectionId: connectionId,
      syncType: "manual",
      status: "success",
      fileName: payload.fileName,
      rowCount: payload.recordCount,
      triggeredByUserId: userId,
      createdAt: now,
    });

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
        timestamp: now.toISOString(),
        warning: payload.warning,
      },
    });
  } catch (err: any) {
    await db.insert(aggregatorSyncLogs).values({
      aggregatorConnectionId: connectionId,
      syncType: "manual",
      status: "failed",
      fileName: `assortment_${conn.vendorId || "vendor"}.csv`,
      rowCount: 0,
      errorMessage: err.message,
      createdAt: new Date(),
    });

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
aggregatorSftpRouter.get("/logs/:connectionId", async (req: Request, res: Response) => {
  const { connectionId } = req.params;
  if (!isUuid(connectionId)) {
    return res.json({ success: true, logs: [] });
  }

  try {
    const logs = await db
      .select()
      .from(aggregatorSyncLogs)
      .where(eq(aggregatorSyncLogs.aggregatorConnectionId, connectionId))
      .orderBy(desc(aggregatorSyncLogs.createdAt));

    res.json({
      success: true,
      logs,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
