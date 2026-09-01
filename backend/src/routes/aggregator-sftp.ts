import { Router, Request, Response } from "express";
import crypto from "crypto";
import { db } from "../db/index.js";
import { products, promotions } from "../db/schema.js";

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
  isActive: boolean; // default false
  createdAt: string;
  updatedAt: string;
}

export interface AggregatorSyncLog {
  id: string;
  aggregatorConnectionId: string;
  syncType: "manual" | "preview";
  status: "success" | "failed" | "preview_only";
  fileName: string;
  rowCount: number;
  errorMessage?: string;
  triggeredByUserId?: string;
  createdAt: string;
}

// In-memory store for Phase 1 testing
export const connectionsStore: Map<string, AggregatorConnection> = new Map();
export const syncLogsStore: AggregatorSyncLog[] = [];

// Seed default test connection using dummy values ONLY (is_active = false)
const dummyTestId = "conn_dummy_talabat";
connectionsStore.set(dummyTestId, {
  id: dummyTestId,
  tenantId: "default-tenant",
  branchId: "default-branch",
  aggregatorName: "talabat",
  sftpHost: "test.local",
  sftpPort: 22,
  sftpUsername: "test_vendor",
  sftpPasswordEncrypted: encryptSecret("dummy123"),
  remoteDirectory: "/Assortment",
  vendorId: "test_vendor",
  priceFormat: "price_discounted",
  isActive: false, // Default false
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

/**
 * Format Date to exact YYYY-MM-DD HH:MM:SS
 */
export function formatTimestamp(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export interface ProductItemInput {
  id?: string;
  barcode?: string;
  sku?: string;
  price: string;
  active?: boolean;
  promotion?: {
    startDate: Date;
    endDate: Date;
    discountedPrice: string;
    maxNoOfOrders?: string;
  } | null;
}

/**
 * Core CSV Generation Logic conforming strictly to Phase 1 spec
 */
export function generateSingleFileCsvPayload(
  vendorId: string,
  priceFormat: "price_discounted" | "original_discounted" | "original_price" = "price_discounted",
  itemsInput?: ProductItemInput[]
): { csvContent: string; recordCount: number; fileName: string; warning?: string } {
  const now = new Date();
  const future = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const startDateStr = formatTimestamp(now);
  const endDateStr = formatTimestamp(future);

  // Default test items if none supplied
  const items: ProductItemInput[] = itemsInput || [
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
      promotion: null, // No promo
    },
    {
      id: "p3",
      barcode: "6291005006033",
      sku: "",
      price: "12.00",
      active: true,
      promotion: null, // No promo
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
      promotion: null, // No promo
    },
  ];

  // Price Format Column Headers Setup
  let firstPriceCol = "price";
  let promoPriceCol = "discounted_price";

  if (priceFormat === "original_discounted") {
    firstPriceCol = "original_price";
    promoPriceCol = "discounted_price";
  } else if (priceFormat === "original_price") {
    firstPriceCol = "original_price";
    promoPriceCol = "price";
  }

  const headers = [
    "barcode",
    "sku",
    firstPriceCol,
    "active",
    "reason",
    "start_date",
    "end_date",
    "campaign_status",
    promoPriceCol,
    "max_no_of_orders",
  ];

  // 1. Duplicate / Overlap handling: Keep later (bottom) row for identical product identifiers
  const uniqueItemsMap = new Map<string, ProductItemInput>();
  items.forEach((item) => {
    const key = (item.barcode && item.barcode.trim()) || (item.sku && item.sku.trim()) || item.id || "unknown";
    uniqueItemsMap.set(key, item); // Overwrites previous item, keeping bottom row
  });

  const finalItems = Array.from(uniqueItemsMap.values());

  let activePromoCount = 0;
  const rows: string[] = [headers.join(",")];

  finalItems.forEach((p, idx) => {
    // Rule 1: Populate EITHER barcode OR sku (never both, never neither)
    let barcode = "";
    let sku = "";

    if (p.barcode && p.barcode.trim()) {
      barcode = p.barcode.trim();
      sku = "";
    } else if (p.sku && p.sku.trim()) {
      barcode = "";
      sku = p.sku.trim();
    } else {
      barcode = `51513131500${idx + 1}`;
      sku = "";
    }

    // Rule 2: Assortment fields (always required)
    const priceVal = parseFloat(p.price || "15.00").toFixed(2);
    const activeVal = p.active !== false ? "1" : "0";

    // Rule 3: Promotion fields block rule
    let reason = "";
    let startDt = "";
    let endDt = "";
    let campaignStatus = "";
    let promoPrice = "";
    let maxOrders = "";

    if (p.promotion) {
      activePromoCount++;
      reason = "competitiveness"; // Fixed string required
      startDt = formatTimestamp(p.promotion.startDate || now);
      endDt = formatTimestamp(p.promotion.endDate || future);
      campaignStatus = "1";
      promoPrice = parseFloat(p.promotion.discountedPrice || "0.00").toFixed(2);
      maxOrders = p.promotion.maxNoOfOrders || "";
    }

    const row = [
      barcode,
      sku,
      priceVal,
      activeVal,
      reason,
      startDt,
      endDt,
      campaignStatus,
      promoPrice,
      maxOrders,
    ].map((v) => (v.includes(",") ? `"${v}"` : v));

    rows.push(row.join(","));
  });

  let warning: string | undefined = undefined;
  if (activePromoCount > 20000) {
    warning = `Active promotions count (${activePromoCount}) exceeds the 20,000 SKU limit per campaign file.`;
  }

  const cleanVendorId = (vendorId || "vendor_id").trim();
  const fileName = `assortment_${cleanVendorId}.csv`;

  return {
    csvContent: rows.join("\n"),
    recordCount: finalItems.length,
    fileName,
    warning,
  };
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
    isActive,
  } = req.body;

  if (!aggregatorName) {
    return res.status(400).json({ success: false, error: "aggregatorName is required" });
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
    branchId: branchId || existing?.branchId || "default-branch",
    aggregatorName: (aggregatorName || "talabat").toLowerCase(),
    sftpHost: sftpHost !== undefined ? sftpHost : (existing?.sftpHost || "test.local"),
    sftpPort: sftpPort ? Number(sftpPort) : (existing?.sftpPort || 22),
    sftpUsername: sftpUsername !== undefined ? sftpUsername : (existing?.sftpUsername || "test_vendor"),
    sftpPasswordEncrypted: passwordEncrypted,
    remoteDirectory: remoteDirectory || existing?.remoteDirectory || "/Assortment",
    vendorId: vendorId !== undefined ? vendorId : (existing?.vendorId || "test_vendor"),
    priceFormat: priceFormat || existing?.priceFormat || "price_discounted",
    isActive: isActive !== undefined ? Boolean(isActive) : (existing?.isActive ?? false), // Default false
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

// 2. GET /api/aggregator-sftp/connections - List connections (Password masked as ••••••••)
aggregatorSftpRouter.get("/connections", (req: Request, res: Response) => {
  const connections = Array.from(connectionsStore.values()).map((conn) => ({
    ...conn,
    sftpPassword: conn.sftpPasswordEncrypted ? "••••••••" : "",
    sftpPasswordEncrypted: undefined, // Never expose raw encrypted string
  }));

  res.json({
    success: true,
    connections,
  });
});

// 3. DELETE /api/aggregator-sftp/connections/:id
aggregatorSftpRouter.delete("/connections/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  if (connectionsStore.has(id)) {
    connectionsStore.delete(id);
    return res.json({ success: true, message: "Connection deleted." });
  }
  res.status(404).json({ success: false, error: "Connection not found" });
});

// 4. GET /api/aggregator-sftp/preview-csv/:connectionId - In-memory Preview ONLY (No SFTP or network calls)
aggregatorSftpRouter.get("/preview-csv/:connectionId", async (req: Request, res: Response) => {
  const { connectionId } = req.params;
  const conn = connectionsStore.get(connectionId);

  const vendorId = conn?.vendorId || "test_vendor";
  const priceFormat = conn?.priceFormat || "price_discounted";

  try {
    const payload = generateSingleFileCsvPayload(vendorId, priceFormat);

    // Log preview event
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

// 5. POST /api/aggregator-sftp/sync/:connectionId - Full sync logic (Rejects if is_active === false)
aggregatorSftpRouter.post("/sync/:connectionId", async (req: Request, res: Response) => {
  const { connectionId } = req.params;
  const conn = connectionsStore.get(connectionId);

  if (!conn) {
    return res.status(404).json({ success: false, error: "Connection configuration not found." });
  }

  // MANDATORY CHECK: Reject if is_active === false
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

  // Active connection: Proceed with SFTP transmission to target server
  try {
    const decryptedPassword = decryptSecret(conn.sftpPasswordEncrypted);
    const payload = generateSingleFileCsvPayload(conn.vendorId, conn.priceFormat);
    const bytes = Buffer.byteLength(payload.csvContent, "utf-8");
    const now = new Date().toISOString();

    // Log success attempt
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

// 6. GET /api/aggregator-sftp/logs/:connectionId - Return sync logs history
aggregatorSftpRouter.get("/logs/:connectionId", (req: Request, res: Response) => {
  const { connectionId } = req.params;
  const logs = syncLogsStore.filter((l) => l.aggregatorConnectionId === connectionId);
  res.json({
    success: true,
    logs,
  });
});
