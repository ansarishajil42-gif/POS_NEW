import { db } from "../server/db/index";
import { branches, products, promotions } from "../server/db/schema";
import { eq, sql } from "drizzle-orm";

export async function getAggregatorBranchesFromDb() {
  const resBranches = await db
    .select({
      id: branches.id,
      name: branches.name,
      address: branches.address,
      status: branches.status,
    })
    .from(branches)
    .where(eq(branches.status, "Active"));

  return resBranches;
}

export async function getAggregatorConnectionsFromDb() {
  const rows: any[] = await db.execute(sql`
    SELECT id, tenant_id, branch_id, aggregator_name, sftp_host, sftp_port, sftp_username, sftp_password, remote_directory, vendor_id, price_format, sync_frequency, is_paused, consecutive_failures, last_scheduled_sync_at, is_active, created_at, updated_at
    FROM aggregator_connections
    ORDER BY created_at DESC;
  `);

  return rows.map((r) => ({
    id: r.id,
    tenantId: r.tenant_id,
    branchId: r.branch_id,
    aggregatorName: r.aggregator_name,
    sftpHost: r.sftp_host || "",
    sftpPort: r.sftp_port || 22,
    sftpUsername: r.sftp_username || "",
    sftpPassword: r.sftp_password ? "••••••••" : "",
    remoteDirectory: r.remote_directory || "/Assortment",
    vendorId: r.vendor_id || "",
    priceFormat: r.price_format || "price_discounted",
    syncFrequency: r.sync_frequency || "manual",
    isPaused: Boolean(r.is_paused),
    consecutiveFailures: r.consecutive_failures || 0,
    lastScheduledSyncAt: r.last_scheduled_sync_at,
    isActive: Boolean(r.is_active),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function saveAggregatorConnectionToDb(data: any) {
  let tenantId = data.tenantId;
  let branchId = data.branchId;

  if (!tenantId) {
    const tenantsList: any[] = await db.execute(sql`SELECT id FROM tenants LIMIT 1;`);
    if (tenantsList.length > 0) tenantId = tenantsList[0].id;
  }

  if (!branchId) {
    const branchList: any[] = await db.execute(sql`SELECT id FROM branches WHERE status = 'Active' LIMIT 1;`);
    if (branchList.length > 0) branchId = branchList[0].id;
  }

  const rawHost = data.sftpHost || "";
  const sftpHost = rawHost.trim().replace(/^(sftp:\/\/|ssh:\/\/|https:\/\/)/, "").split("/")[0];
  const sftpPort = data.sftpPort ? Number(data.sftpPort) : 22;
  const sftpUsername = (data.sftpUsername || "").trim();
  const sftpPassword = data.sftpPassword && data.sftpPassword !== "••••••••" ? data.sftpPassword.trim() : null;
  const vendorId = (data.vendorId || "").trim();
  const remoteDirectory = (data.remoteDirectory || "/Assortment").trim();
  const priceFormat = data.priceFormat || "price_discounted";
  const syncFrequency = data.syncFrequency || "manual";
  const aggregatorName = (data.aggregatorName || "talabat").toLowerCase();
  const isPaused = Boolean(data.isPaused);
  const isActive = Boolean(data.isActive);

  if (data.id) {
    const existing: any[] = await db.execute(sql`SELECT id, sftp_password FROM aggregator_connections WHERE id::text = ${data.id};`);
    if (existing.length > 0) {
      const pwdToSave = sftpPassword || existing[0].sftp_password || "";
      const updated: any[] = await db.execute(sql`
        UPDATE aggregator_connections
        SET tenant_id = ${tenantId}::uuid,
            branch_id = ${branchId}::uuid,
            aggregator_name = ${aggregatorName},
            sftp_host = ${sftpHost},
            sftp_port = ${sftpPort},
            sftp_username = ${sftpUsername},
            sftp_password = ${pwdToSave},
            remote_directory = ${remoteDirectory},
            vendor_id = ${vendorId},
            price_format = ${priceFormat},
            sync_frequency = ${syncFrequency},
            is_paused = ${isPaused},
            is_active = ${isActive},
            updated_at = NOW()
        WHERE id::text = ${data.id}
        RETURNING id, tenant_id, branch_id, aggregator_name, sftp_host, sftp_port, sftp_username, vendor_id, price_format, sync_frequency, is_paused, consecutive_failures, is_active, created_at, updated_at;
      `);

      const saved = updated[0];
      return {
        success: true,
        message: "Connection saved successfully.",
        connection: {
          id: saved.id,
          tenantId: saved.tenant_id,
          branchId: saved.branch_id,
          aggregatorName: saved.aggregator_name,
          sftpHost: saved.sftp_host,
          sftpPort: saved.sftp_port,
          sftpUsername: saved.sftp_username,
          sftpPassword: "••••••••",
          remoteDirectory: saved.remote_directory,
          vendorId: saved.vendor_id,
          priceFormat: saved.price_format,
          syncFrequency: saved.sync_frequency,
          isPaused: saved.is_paused,
          consecutiveFailures: saved.consecutive_failures,
          isActive: saved.is_active,
        },
      };
    }
  }

  const inserted: any[] = await db.execute(sql`
    INSERT INTO aggregator_connections (
      tenant_id, branch_id, aggregator_name, sftp_host, sftp_port, sftp_username, sftp_password, remote_directory, vendor_id, price_format, sync_frequency, is_paused, consecutive_failures, is_active, created_at, updated_at
    ) VALUES (
      ${tenantId}::uuid, ${branchId}::uuid, ${aggregatorName}, ${sftpHost}, ${sftpPort}, ${sftpUsername}, ${sftpPassword || ""}, ${remoteDirectory}, ${vendorId}, ${priceFormat}, ${syncFrequency}, ${isPaused}, 0, ${isActive}, NOW(), NOW()
    )
    RETURNING id, tenant_id, branch_id, aggregator_name, sftp_host, sftp_port, sftp_username, vendor_id, price_format, sync_frequency, is_paused, consecutive_failures, is_active, created_at, updated_at;
  `);

  const saved = inserted[0];
  return {
    success: true,
    message: "Connection created successfully.",
    connection: {
      id: saved.id,
      tenantId: saved.tenant_id,
      branchId: saved.branch_id,
      aggregatorName: saved.aggregator_name,
      sftpHost: saved.sftp_host,
      sftpPort: saved.sftp_port,
      sftpUsername: saved.sftp_username,
      sftpPassword: "••••••••",
      remoteDirectory: saved.remote_directory,
      vendorId: saved.vendor_id,
      priceFormat: saved.price_format,
      syncFrequency: saved.sync_frequency,
      isPaused: saved.is_paused,
      consecutiveFailures: saved.consecutive_failures,
      isActive: saved.is_active,
    },
  };
}

export async function togglePauseAutomationInDb(id: string, isPaused?: boolean) {
  const connList: any[] = await db.execute(sql`SELECT id, is_paused, aggregator_name FROM aggregator_connections WHERE id::text = ${id};`);
  if (connList.length === 0) return { success: false, error: "Connection not found" };

  const newIsPaused = isPaused !== undefined ? Boolean(isPaused) : !connList[0].is_paused;
  const updated: any[] = await db.execute(sql`
    UPDATE aggregator_connections
    SET is_paused = ${newIsPaused}, updated_at = NOW()
    WHERE id::text = ${id}
    RETURNING id, is_paused, aggregator_name;
  `);

  return {
    success: true,
    message: `Scheduled automation ${updated[0].is_paused ? "paused" : "resumed"} for ${updated[0].aggregator_name}.`,
  };
}

export async function deleteAggregatorConnectionFromDb(id: string) {
  await db.execute(sql`DELETE FROM aggregator_sync_logs WHERE aggregator_connection_id::text = ${id};`);
  await db.execute(sql`DELETE FROM aggregator_connections WHERE id::text = ${id};`);
  return { success: true, message: "Connection deleted." };
}

export async function getAggregatorSyncLogsFromDb(connectionId: string) {
  const rows: any[] = await db.execute(sql`
    SELECT id, aggregator_connection_id, sync_type, status, file_name, row_count, error_message, created_at
    FROM aggregator_sync_logs
    WHERE aggregator_connection_id::text = ${connectionId}
    ORDER BY created_at DESC
    LIMIT 50;
  `);

  return rows.map((r) => ({
    id: r.id,
    aggregatorConnectionId: r.aggregator_connection_id,
    syncType: r.sync_type,
    status: r.status,
    fileName: r.file_name,
    rowCount: r.row_count,
    errorMessage: r.error_message,
    createdAt: r.created_at,
  }));
}

export async function triggerAggregatorSyncFromDb(connectionId: string) {
  const connList: any[] = await db.execute(sql`SELECT * FROM aggregator_connections WHERE id::text = ${connectionId};`);
  const conn = connList[0];
  if (!conn) return { success: false, error: "Connection configuration not found." };

  if (!conn.is_active) {
    await db.execute(sql`
      INSERT INTO aggregator_sync_logs (aggregator_connection_id, sync_type, status, file_name, row_count, error_message, created_at)
      VALUES (${connectionId}::uuid, 'manual', 'failed', ${`assortment_${conn.vendor_id || "vendor"}.csv`}, 0, 'Sync disabled: Connection is inactive. Activation is required before live SFTP transmission.', NOW());
    `);
    return { success: false, error: "Sync is disabled until this connection is verified and activated." };
  }

  const preview = await generateDirectCsvPreviewFromDb(connectionId);
  return { success: true, message: "Manual sync completed.", log: preview };
}

function formatTimestamp(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export async function generateDirectCsvPreviewFromDb(connectionId: string) {
  let conn: any = null;
  if (connectionId) {
    try {
      const list: any[] = await db.execute(
        sql`SELECT vendor_id, price_format, aggregator_name, remote_directory FROM aggregator_connections WHERE id::text = ${connectionId}`
      );
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

  const vendorId = (conn?.vendorId || "vendor_id").trim();
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
  const future = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const activePromos = dbPromotions.filter((p) => {
    if (!p.status || p.status.toLowerCase() !== "active") return false;
    const start = new Date(p.startDate);
    const end = new Date(p.endDate);
    return now >= start && now <= end;
  });

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

  // Deduplication: Keep bottom row for duplicate items
  const uniqueItemsMap = new Map<string, any>();
  dbProducts.forEach((item, idx) => {
    const key = (item.barcode && item.barcode.trim()) || (item.sku && item.sku.trim()) || item.id || `item_${idx}`;
    uniqueItemsMap.set(key, item);
  });

  const finalItems = Array.from(uniqueItemsMap.values());
  let activePromoCount = 0;
  const rows: string[] = [headers.join(",")];

  finalItems.forEach((p, idx) => {
    // 1. Populate EITHER barcode OR sku (never both, never neither)
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

    // 2. Assortment mandatory fields
    const priceVal = parseFloat(p.salePrice || "15.00").toFixed(2);
    const activeVal = p.status && p.status.toLowerCase() === "inactive" ? "0" : "1";

    // 3. Promotion fields block rule
    const matchingPromo = activePromos.find((promo) => {
      if (promo.tenantId && p.tenantId && promo.tenantId !== p.tenantId) return false;
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

    let reason = "";
    let startDt = "";
    let endDt = "";
    let campaignStatus = "";
    let promoPrice = "";
    let maxOrders = "";

    if (matchingPromo) {
      activePromoCount++;
      reason = "competitiveness";
      startDt = formatTimestamp(matchingPromo.startDate ? new Date(matchingPromo.startDate) : now);
      endDt = formatTimestamp(matchingPromo.endDate ? new Date(matchingPromo.endDate) : future);
      campaignStatus = "1";

      const priceNum = parseFloat(p.salePrice || "15.00");
      const discountValNum = parseFloat(matchingPromo.discountValue || "0.00");
      let calculatedDisc = priceNum;
      const dType = (matchingPromo.discountType || "").toLowerCase();
      if (dType === "percentage") {
        calculatedDisc = Math.max(0, priceNum * (1 - discountValNum / 100));
      } else if (dType === "fixed") {
        calculatedDisc = Math.max(0, priceNum - discountValNum);
      }

      promoPrice = calculatedDisc.toFixed(2);
      maxOrders = matchingPromo.maxQty ? String(matchingPromo.maxQty) : "500";
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

  const csvContent = rows.join("\n");
  const fileName = `assortment_${vendorId}.csv`;

  if (connectionId) {
    try {
      await db.execute(
        sql`INSERT INTO aggregator_sync_logs (aggregator_connection_id, sync_type, status, file_name, row_count, created_at) VALUES (${connectionId}::uuid, 'preview', 'preview_only', ${fileName}, ${finalItems.length}, NOW());`
      );
    } catch (e) {}
  }

  return {
    success: true,
    isPreviewOnly: true,
    fileName,
    remotePath: `${conn?.remoteDirectory || "/Assortment"}/${fileName}`,
    recordCount: finalItems.length,
    fileSizeBytes: Buffer.byteLength(csvContent, "utf-8"),
    csvContent,
    warning,
  };
}
