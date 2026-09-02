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
    const { db } = await import("../server/db/index");
    const { branches } = await import("../server/db/schema");
    const { eq } = await import("drizzle-orm");

    const resBranches = await db
      .select({
        id: branches.id,
        name: branches.name,
        address: branches.address,
        status: branches.status,
      })
      .from(branches)
      .where(eq(branches.status, "Active"));

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

export async function generateDirectCsvPreview(connectionId: string) {
  const { db } = await import("../server/db/index");
  const { products, promotions } = await import("../server/db/schema");
  const { sql } = await import("drizzle-orm");

  let conn: any = null;
  if (connectionId) {
    try {
      const list: any[] = await db.execute(sql`SELECT vendor_id, price_format, aggregator_name, remote_directory FROM aggregator_connections WHERE id::text = ${connectionId}`);
      if (list && list.length > 0) {
        conn = {
          vendorId: list[0].vendor_id,
          priceFormat: list[0].price_format,
          aggregatorName: list[0].aggregator_name,
          remoteDirectory: list[0].remote_directory,
        };
      }
    } catch (e) {}
  }

  const vendorId = conn?.vendorId || "vendor_id";
  const priceFormat = conn?.priceFormat || "price_discounted";

  const dbProducts = await db.select().from(products);
  if (!dbProducts || dbProducts.length === 0) {
    throw new Error("Unable to load products from database — no products found.");
  }

  let dbPromotions: any[] = [];
  try {
    dbPromotions = await db.select().from(promotions);
  } catch (err) {}

  const now = new Date();
  const activePromos = dbPromotions.filter((p) => {
    if (!p.status || p.status.toLowerCase() !== "active") return false;
    const start = new Date(p.startDate);
    const end = new Date(p.endDate);
    return now >= start && now <= end;
  });

  const lines: string[] = [
    "Barcode/SKU,Price,Active,Discounted price,Discount Start,Discount End,Max no of orders"
  ];

  let recordCount = 0;

  dbProducts.forEach((p, idx) => {
    const code = p.barcode || `SKU-${idx + 100}`;
    const priceNum = parseFloat(p.salePrice || "15.00");
    const origPriceStr = priceNum.toFixed(2);
    let activeStr = "TRUE";

    const matchingPromo = activePromos.find((promo) => {
      if (promo.tenantId && p.tenantId && promo.tenantId !== p.tenantId) return false;
      if (promo.targetProductIds) {
        try {
          const ids: string[] = typeof promo.targetProductIds === "string" && promo.targetProductIds.startsWith("[")
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

    let discPriceStr = "";
    let startDateStr = "";
    let endDateStr = "";
    let maxOrdersStr = "";

    if (matchingPromo) {
      const discountValNum = parseFloat(matchingPromo.discountValue || "0.00");
      let calculatedDisc = priceNum;
      const dType = (matchingPromo.discountType || "").toLowerCase();
      if (dType === "percentage") {
        calculatedDisc = Math.max(0, priceNum * (1 - discountValNum / 100));
      } else if (dType === "fixed") {
        calculatedDisc = Math.max(0, priceNum - discountValNum);
      }
      discPriceStr = calculatedDisc.toFixed(2);

      const sDate = new Date(matchingPromo.startDate);
      const eDate = new Date(matchingPromo.endDate);
      startDateStr = sDate.toISOString().replace("T", " ").substring(0, 19);
      endDateStr = eDate.toISOString().replace("T", " ").substring(0, 19);
      maxOrdersStr = matchingPromo.maxQty ? String(matchingPromo.maxQty) : "500";
    }

    lines.push(`${code},${origPriceStr},${activeStr},${discPriceStr},${startDateStr},${endDateStr},${maxOrdersStr}`);
    recordCount++;
  });

  const csvContent = lines.join("\n");
  const fileName = `assortment_${vendorId}.csv`;

  if (connectionId) {
    try {
      const { sql } = await import("drizzle-orm");
      await db.execute(sql`INSERT INTO aggregator_sync_logs (aggregator_connection_id, sync_type, status, file_name, row_count, created_at) VALUES (${connectionId}::uuid, 'preview', 'preview_only', ${fileName}, ${recordCount}, NOW());`);
    } catch (e) {}
  }

  return {
    success: true,
    isPreviewOnly: true,
    fileName,
    remotePath: `${conn?.remoteDirectory || "/Assortment"}/${fileName}`,
    recordCount,
    fileSizeBytes: Buffer.byteLength(csvContent, "utf-8"),
    csvContent,
  };
}

export const previewAggregatorCsvServerFn = createServerFn({ method: "POST" })
  .validator((data: { connectionId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/aggregator-sftp/preview-csv/${data.connectionId}`);
      if (!res.ok) {
        return await generateDirectCsvPreview(data.connectionId);
      }
      const result = await res.json();
      return result;
    } catch (e: any) {
      try {
        return await generateDirectCsvPreview(data.connectionId);
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
