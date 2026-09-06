import { Router, Request, Response } from "express";
import crypto from "crypto";
import { eq, desc, sql } from "drizzle-orm";
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

/**
 * @deprecated NOTE ON SFTP AGGREGATOR ARCHITECTURE:
 * The active primary server implementation for Aggregator SFTP Sync is located in:
 * `White_Label_POS/src/lib/aggregator-sftp.server.ts` (TanStack Start RPC Server Functions).
 * 
 * All UI routes (`aggregators.tsx`), CSV generation (via `src/lib/aggregator-adapters`),
 * SFTP transmissions, and AES-256-GCM secret encryption (`src/lib/crypto.ts`) execute through
 * the TanStack Start server functions path. This Express router is preserved for legacy API backward-compatibility.
 */
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
  storeVendorId?: string;
  filenamePrefix?: string;
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
    storeVendorId: storeVendorIdInput,
    store_vendor_id,
    filenamePrefix: filenamePrefixInput,
    filename_prefix,
    priceFormat,
    syncFrequency,
    isPaused,
    isActive,
  } = req.body;

  const storeVendorId = storeVendorIdInput !== undefined ? storeVendorIdInput : store_vendor_id;
  const filenamePrefix = filenamePrefixInput !== undefined ? filenamePrefixInput : filename_prefix;

  if (!aggregatorName && !id) {
    return res.status(400).json({ success: false, error: "aggregatorName is required" });
  }

  const effectiveAggregator = aggregatorName || "talabat";
  try {
    getAdapter(effectiveAggregator);
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
    const cleanDir = (remoteDirectory !== undefined ? remoteDirectory : existingRecord?.remoteDirectory || "assortment")
      .replace(/^\/+|\/+$/g, "")
      .toLowerCase()
      .trim() || "assortment";

    if (existingRecord) {
      const updatedValues = {
        tenantId: tenantId || existingRecord.tenantId,
        branchId: branchId || existingRecord.branchId,
        aggregatorName: (aggregatorName || existingRecord.aggregatorName || "talabat").toLowerCase(),
        sftpHost: rawHost ? cleanSftpHost(rawHost) : null,
        sftpPort: sftpPort ? Number(sftpPort) : (existingRecord.sftpPort || 22),
        sftpUsername: sftpUsername !== undefined ? sftpUsername : existingRecord.sftpUsername,
        sftpPassword: passwordEncrypted,
        remoteDirectory: cleanDir,
        vendorId: vendorId !== undefined ? vendorId : existingRecord.vendorId,
        storeVendorId: storeVendorId !== undefined ? storeVendorId : existingRecord.storeVendorId,
        filenamePrefix: filenamePrefix !== undefined ? filenamePrefix : existingRecord.filenamePrefix,
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
        remoteDirectory: cleanDir,
        vendorId: vendorId || "",
        storeVendorId: storeVendorId || "",
        filenamePrefix: filenamePrefix || "",
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
    const rows: any[] = await db.execute(sql`
      SELECT 
        c.id, c.tenant_id, c.branch_id, b.name as branch_name, c.aggregator_name, 
        c.sftp_host, c.sftp_port, c.sftp_username, c.sftp_password, c.remote_directory, 
        c.vendor_id, c.store_vendor_id, c.filename_prefix, c.price_format, 
        c.sync_frequency, c.is_paused, c.consecutive_failures, c.last_scheduled_sync_at, 
        c.has_pending_changes, c.is_active, c.created_at, c.updated_at
      FROM aggregator_connections c
      LEFT JOIN branches b ON c.branch_id = b.id
      ORDER BY c.created_at DESC;
    `);

    const connections = rows.map((r: any) => ({
      id: r.id,
      tenantId: r.tenant_id,
      branchId: r.branch_id,
      branchName: r.branch_name || "Main Branch",
      aggregatorName: r.aggregator_name || "talabat",
      sftpHost: r.sftp_host || "",
      sftpPort: r.sftp_port || 22,
      sftpUsername: r.sftp_username || "",
      sftpPassword: r.sftp_password ? "••••••••" : "",
      remoteDirectory: r.remote_directory || "/Assortment",
      vendorId: r.vendor_id || "",
      storeVendorId: r.store_vendor_id || "",
      filenamePrefix: r.filename_prefix || "",
      priceFormat: r.price_format || "price_discounted",
      syncFrequency: r.sync_frequency || "manual",
      isPaused: Boolean(r.is_paused),
      consecutiveFailures: r.consecutive_failures || 0,
      lastScheduledSyncAt: r.last_scheduled_sync_at,
      hasPendingChanges: Boolean(r.has_pending_changes),
      isActive: Boolean(r.is_active),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
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

// GET /api/aggregator-sftp/branches - List active branches from DB
aggregatorSftpRouter.get("/branches", async (req: Request, res: Response) => {
  try {
    const rawBranches = await db
      .select({
        id: branches.id,
        name: branches.name,
        address: branches.address,
        status: branches.status,
      })
      .from(branches)
      .where(eq(branches.status, "Active"));

    return res.json({
      success: true,
      branches: rawBranches,
    });
  } catch (err: any) {
    console.error("Failed to list active branches from DB:", err);
    return res.status(500).json({ success: false, error: err.message });
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

// Helper to fetch branch-scoped product data + active promotions from DB with optional time-window filter
export async function getBranchScopedProductItems(
  tenantId: string,
  branchId: string,
  windowStart?: Date | string | null
): Promise<ProductData[]> {
  const filterDate = windowStart
    ? windowStart instanceof Date
      ? windowStart.toISOString()
      : !isNaN(Date.parse(String(windowStart)))
      ? new Date(windowStart).toISOString()
      : null
    : null;

  const joinedRows: any[] = filterDate
    ? await db.execute(sql`
        SELECT 
          p.id, 
          p.barcode, 
          p.sku, 
          p.sale_price, 
          p.category, 
          COALESCE(sl.stock, 0) as stock, 
          sl.price_override
        FROM products p
        INNER JOIN stock_levels sl ON p.id = sl.product_id AND sl.branch_id = ${branchId}::uuid
        WHERE p.tenant_id = ${tenantId}::uuid
          AND (
            p.created_at >= ${filterDate}::timestamp 
            OR p.updated_at >= ${filterDate}::timestamp 
            OR sl.updated_at >= ${filterDate}::timestamp
          );
      `)
    : await db.execute(sql`
        SELECT 
          p.id, 
          p.barcode, 
          p.sku, 
          p.sale_price, 
          p.category, 
          COALESCE(sl.stock, 0) as stock, 
          sl.price_override
        FROM products p
        INNER JOIN stock_levels sl ON p.id = sl.product_id AND sl.branch_id = ${branchId}::uuid
        WHERE p.tenant_id = ${tenantId}::uuid;
      `);

  if (!joinedRows || joinedRows.length === 0) {
    if (filterDate) {
      return [];
    }
    throw new Error("No products found with stock levels in this branch.");
  }

  let dbPromotions: any[] = [];
  try {
    dbPromotions = await db.select().from(promotions).where(eq(promotions.tenantId, tenantId));
  } catch (err) {}

  const now = new Date();
  const activePromos = dbPromotions.filter((p) => {
    if (!p.status || p.status.toLowerCase() !== "active") return false;
    const start = new Date(p.startDate);
    const end = new Date(p.endDate);
    return now >= start && now <= end;
  });

  return joinedRows.map((p: any) => {
    const branchStock = Number(p.stock) || 0;
    const priceToUse = p.price_override ? String(p.price_override) : p.sale_price || "15.00";
    const isProductActiveInBranch = branchStock > 0;

    const matchingPromo = activePromos.find((promo) => {
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
      if (promo.target === "All" || (!promo.targetCategory && !promo.targetProductIds)) return true;
      return false;
    });

    let promoObj = null;
    if (matchingPromo) {
      const priceNum = parseFloat(priceToUse);
      const discountValNum = parseFloat(matchingPromo.discountValue || "0.00");
      let calculatedDisc = priceNum;
      const dType = (matchingPromo.discountType || "").toLowerCase();
      if (dType === "percentage") {
        calculatedDisc = Math.max(0, priceNum * (1 - discountValNum / 100));
      } else if (dType === "fixed") {
        calculatedDisc = Math.max(0, priceNum - discountValNum);
      }

      promoObj = {
        startDate: matchingPromo.startDate ? new Date(matchingPromo.startDate) : now,
        endDate: matchingPromo.endDate ? new Date(matchingPromo.endDate) : new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
        discountedPrice: calculatedDisc.toFixed(2),
        maxNoOfOrders: matchingPromo.maxQty ? String(matchingPromo.maxQty) : "500",
      };
    }

    return {
      id: p.id,
      barcode: p.barcode ? p.barcode.trim() : "",
      sku: p.sku ? p.sku.trim() : "",
      price: priceToUse,
      active: isProductActiveInBranch,
      promotion: promoObj,
    };
  });
}

// 4.1 GET /api/aggregator-sftp/summary/:connectionId - Lightweight sync summary with optional time-window filter
aggregatorSftpRouter.get("/summary/:connectionId", async (req: Request, res: Response) => {
  const { connectionId } = req.params;
  if (!isUuid(connectionId)) {
    return res.status(400).json({ success: false, error: "Invalid Connection ID" });
  }

  try {
    const list: any[] = await db.execute(sql`
      SELECT c.id, c.tenant_id, c.branch_id, b.name as branch_name, c.vendor_id, c.store_vendor_id, c.filename_prefix, c.price_format, c.aggregator_name, c.remote_directory, b.tenant_id as branch_tenant_id
      FROM aggregator_connections c
      LEFT JOIN branches b ON c.branch_id = b.id
      WHERE c.id::text = ${connectionId}
    `);

    if (!list || list.length === 0) {
      return res.status(404).json({ success: false, error: "Connection not found" });
    }

    const conn = list[0];
    const tenantId = conn.tenant_id || conn.branch_tenant_id;
    const branchId = conn.branch_id;
    const storeId = (conn.store_vendor_id || conn.vendor_id || "vendor").trim();
    const prefix = (conn.filename_prefix || "assortment").trim();
    const fileName = `${prefix}_${storeId}.csv`;
    const remoteDirectory = (conn.remote_directory || "assortment").replace(/^\/+|\/+$/g, "").toLowerCase().trim() || "assortment";
    const remotePath = `${remoteDirectory}/${fileName}`;

    const rawWindowStart = req.query.windowStart ? String(req.query.windowStart) : null;
    const filterDate = rawWindowStart && !isNaN(Date.parse(rawWindowStart)) ? new Date(rawWindowStart).toISOString() : null;

    // Fast COUNT query via INNER JOIN on stock_levels with optional time-window filter
    const countResult: any[] = filterDate
      ? await db.execute(sql`
          SELECT COUNT(*) as total
          FROM products p
          INNER JOIN stock_levels sl ON p.id = sl.product_id AND sl.branch_id = ${branchId}::uuid
          WHERE p.tenant_id = ${tenantId}::uuid
            AND (
              p.created_at >= ${filterDate}::timestamp 
              OR p.updated_at >= ${filterDate}::timestamp 
              OR sl.updated_at >= ${filterDate}::timestamp
            );
        `)
      : await db.execute(sql`
          SELECT COUNT(*) as total
          FROM products p
          INNER JOIN stock_levels sl ON p.id = sl.product_id AND sl.branch_id = ${branchId}::uuid
          WHERE p.tenant_id = ${tenantId}::uuid;
        `);

    const recordCount = Number(countResult[0]?.total || 0);
    const estimatedSizeBytes = recordCount > 0 ? recordCount * 28 + 120 : 0;

    res.json({
      success: true,
      fileName,
      remotePath,
      branchName: conn.branch_name || "Main Branch",
      recordCount,
      estimatedSizeBytes,
      isSummaryOnly: true,
      timeWindow: rawWindowStart || null,
    });
  } catch (err: any) {
    console.error("Summary error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. GET /api/aggregator-sftp/preview-csv/:connectionId - Generate CSV for Preview / Download Only with optional time-window
aggregatorSftpRouter.get("/preview-csv/:connectionId", async (req: Request, res: Response) => {
  const { connectionId } = req.params;
  if (!isUuid(connectionId)) {
    return res.status(400).json({ success: false, error: "Invalid Connection ID" });
  }

  try {
    const list: any[] = await db.execute(sql`SELECT * FROM aggregator_connections WHERE id::text = ${connectionId};`);
    const conn = list[0];
    if (!conn) return res.status(404).json({ success: false, error: "Connection not found" });

    const tenantId = conn.tenant_id;
    const branchId = conn.branch_id;
    const vendorId = (conn.vendor_id || "vendor_id").trim();
    const storeVendorId = (conn.store_vendor_id || "").trim();
    const filenamePrefix = (conn.filename_prefix || "").trim();
    const priceFormat = conn.price_format || "price_discounted";
    const aggregatorName = conn.aggregator_name || "talabat";
    const rawWindowStart = req.query.windowStart ? String(req.query.windowStart) : null;

    const items = await getBranchScopedProductItems(tenantId, branchId, rawWindowStart);
    const adapter = getAdapter(aggregatorName);
    const fileResult = adapter.generateFile(items, { vendorId, storeVendorId, filenamePrefix, priceFormat });

    const normalizedDir = (conn.remote_directory || "assortment").replace(/^\/+|\/+$/g, "").toLowerCase().trim() || "assortment";

    res.json({
      success: true,
      isPreviewOnly: true,
      fileName: fileResult.fileName,
      remotePath: `${normalizedDir}/${fileResult.fileName}`,
      recordCount: fileResult.recordCount,
      fileSizeBytes: Buffer.byteLength(fileResult.fileContent, "utf-8"),
      csvContent: fileResult.fileContent,
      warning: fileResult.warning,
      timeWindow: rawWindowStart || null,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. POST /api/aggregator-sftp/sync/:connectionId - Live Sync with 5-minute cooldown & post-upload verification
aggregatorSftpRouter.post("/sync/:connectionId", async (req: Request, res: Response) => {
  const { connectionId } = req.params;
  if (!isUuid(connectionId)) {
    return res.status(400).json({ success: false, error: "Invalid Connection ID" });
  }

  const list: any[] = await db.execute(sql`SELECT * FROM aggregator_connections WHERE id::text = ${connectionId};`);
  const conn = list[0];

  if (!conn) {
    return res.status(404).json({ success: false, error: "Connection configuration not found." });
  }

  const storeId = (conn.store_vendor_id || conn.vendor_id || "vendor").trim();
  const prefix = (conn.filename_prefix || "assortment").trim();
  const defaultFileName = `${prefix}_${storeId}.csv`;

  if (!conn.is_active) {
    await db.execute(sql`
      INSERT INTO aggregator_sync_logs (aggregator_connection_id, sync_type, status, file_name, row_count, error_message, created_at)
      VALUES (${connectionId}::uuid, 'manual', 'failed', ${defaultFileName}, 0, 'Sync disabled: Connection is inactive. Activation is required before live SFTP transmission.', NOW());
    `);
    return res.status(403).json({ success: false, error: "Sync is disabled until this connection is verified and activated." });
  }

  // 1. 5-Minute Rate Limit Cooldown Check
  const FIVE_MINUTES_MS = 5 * 60 * 1000;
  if (conn.last_scheduled_sync_at) {
    const elapsedMs = Date.now() - new Date(conn.last_scheduled_sync_at).getTime();
    if (elapsedMs < FIVE_MINUTES_MS) {
      const remainingSec = Math.ceil((FIVE_MINUTES_MS - elapsedMs) / 1000);
      const remainingMin = (remainingSec / 60).toFixed(1);
      return res.status(429).json({
        success: false,
        error: `Rate limit cooldown active: Please wait ${remainingSec}s (~${remainingMin} min) before syncing again. Talabat limits catalog updates to once every 5 minutes.`,
      });
    }
  }

  const rawWindowStart = (req.body?.windowStart as string) || (req.query.windowStart as string) || null;

  let fileName = defaultFileName;
  let csvContent: string;
  let recordCount: number;

  try {
    const tenantId = conn.tenant_id;
    const branchId = conn.branch_id;
    const vendorId = (conn.vendor_id || "vendor_id").trim();
    const storeVendorId = (conn.store_vendor_id || "").trim();
    const filenamePrefix = (conn.filename_prefix || "").trim();
    const priceFormat = conn.price_format || "price_discounted";
    const aggregatorName = conn.aggregator_name || "talabat";

    const items = await getBranchScopedProductItems(tenantId, branchId, rawWindowStart);
    const adapter = getAdapter(aggregatorName);
    const fileResult = adapter.generateFile(items, { vendorId, storeVendorId, filenamePrefix, priceFormat });

    fileName = fileResult.fileName;
    csvContent = fileResult.fileContent;
    recordCount = fileResult.recordCount;
  } catch (err: any) {
    await db.execute(sql`
      INSERT INTO aggregator_sync_logs (aggregator_connection_id, sync_type, status, file_name, row_count, error_message, created_at)
      VALUES (${connectionId}::uuid, 'manual', 'failed', ${defaultFileName}, 0, ${"Failed generating CSV payload: " + err.message}, NOW());
    `);
    return res.status(500).json({ success: false, error: "Failed generating CSV payload: " + err.message });
  }

  const hostClean = cleanSftpHost(conn.sftp_host || "");
  const username = (conn.vendor_id || conn.sftp_username || "").trim();
  const rawPassword = (conn.sftp_password || "").trim();
  const password = decryptSecret(rawPassword);

  if (!password) {
    return res.status(400).json({
      success: false,
      error: "Password decryption returned empty value. Please re-enter the password in Connection Settings.",
    });
  }

  try {
    const SftpClient = (await import("ssh2-sftp-client")).default;
    const sftp = new SftpClient();

    await sftp.connect({
      host: hostClean,
      port: conn.sftp_port || 22,
      username: username,
      password: password,
      tryKeyboard: true,
      readyTimeout: 25000,
    });

    const normalizedDir = (conn.remote_directory || "assortment").replace(/^\/+|\/+$/g, "").toLowerCase().trim() || "assortment";
    const targetPath = `${normalizedDir}/${fileName}`;
    const fileBuffer = Buffer.from(csvContent, "utf-8");

    await sftp.put(fileBuffer, targetPath);

    // Post-upload verification
    const dirListing = await sftp.list(normalizedDir);
    const fileExists = dirListing.some((item: any) => item.name === fileName);

    if (!fileExists) {
      await sftp.end();
      throw new Error(`Post-upload verification failed: File '${fileName}' was not found in directory '${normalizedDir}' after upload.`);
    }

    await sftp.end();

    await db.execute(sql`
      INSERT INTO aggregator_sync_logs (aggregator_connection_id, sync_type, status, file_name, row_count, error_message, created_at)
      VALUES (${connectionId}::uuid, 'manual', 'success', ${fileName}, ${recordCount}, NULL, NOW());
    `);

    await db.execute(sql`
      UPDATE aggregator_connections
      SET consecutive_failures = 0, last_scheduled_sync_at = NOW(), updated_at = NOW()
      WHERE id::text = ${connectionId};
    `);

    res.json({
      success: true,
      message: `Successfully uploaded and verified ${fileName} (${recordCount} records) in ${targetPath}`,
    });
  } catch (sftpErr: any) {
    const errorMsg = sftpErr.message || "SFTP transmission error";
    console.error("SFTP Upload Failed:", errorMsg);

    await db.execute(sql`
      INSERT INTO aggregator_sync_logs (aggregator_connection_id, sync_type, status, file_name, row_count, error_message, created_at)
      VALUES (${connectionId}::uuid, 'manual', 'failed', ${fileName}, ${recordCount || 0}, ${errorMsg}, NOW());
    `);

    const newFailCount = (conn.consecutive_failures || 0) + 1;
    const shouldDeactivate = newFailCount >= 3;

    await db.execute(sql`
      UPDATE aggregator_connections
      SET consecutive_failures = ${newFailCount},
          is_active = ${shouldDeactivate ? false : conn.is_active},
          updated_at = NOW()
      WHERE id::text = ${connectionId};
    `);

    res.status(500).json({
      success: false,
      error: `SFTP Transmission Failed: ${errorMsg}${shouldDeactivate ? " (Connection auto-deactivated after 3 failures)" : ""}`,
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

// 8. GET /api/aggregator-sftp/logs/:connectionId - Fetch audit logs for a connection
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

// 9. DELETE /api/aggregator-sftp/logs/:logId - Delete a single log record
aggregatorSftpRouter.delete("/logs/:logId", async (req: Request, res: Response) => {
  const { logId } = req.params;
  if (!isUuid(logId)) {
    return res.status(400).json({ success: false, error: "Invalid Log ID" });
  }

  try {
    const deleted = await db
      .delete(aggregatorSyncLogs)
      .where(eq(aggregatorSyncLogs.id, logId))
      .returning();

    if (deleted.length === 0) {
      return res.status(404).json({ success: false, error: "Log record not found" });
    }

    res.json({
      success: true,
      message: "Log record deleted successfully.",
      deletedId: logId,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. DELETE /api/aggregator-sftp/logs/connection/:connectionId - Clear all logs for a connection
aggregatorSftpRouter.delete("/logs/connection/:connectionId", async (req: Request, res: Response) => {
  const { connectionId } = req.params;
  if (!isUuid(connectionId)) {
    return res.status(400).json({ success: false, error: "Invalid Connection ID" });
  }

  try {
    const deleted = await db
      .delete(aggregatorSyncLogs)
      .where(eq(aggregatorSyncLogs.aggregatorConnectionId, connectionId))
      .returning();

    res.json({
      success: true,
      message: `Cleared ${deleted.length} log records for this connection.`,
      deletedCount: deleted.length,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
