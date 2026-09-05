import { db } from "../server/db/index";
import { branches, products, promotions } from "../server/db/schema";
import { eq, sql } from "drizzle-orm";
import { encryptSecret, decryptSecret, isEncrypted } from "./crypto";
import { getAdapter, ProductData } from "./aggregator-adapters/index";
import { createRequire } from "module";
import crypto from "crypto";
import postgres from "postgres";

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
    SELECT id, tenant_id, branch_id, aggregator_name, sftp_host, sftp_port, sftp_username, sftp_password, remote_directory, vendor_id, store_vendor_id, filename_prefix, price_format, sync_frequency, is_paused, consecutive_failures, last_scheduled_sync_at, has_pending_changes, is_active, created_at, updated_at
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
}

export async function saveAggregatorConnectionToDb(data: any) {
  let tenantId = data.tenantId;
  let branchId = data.branchId;

  if (branchId) {
    const branchInfo: any[] = await db.execute(sql`SELECT id, tenant_id FROM branches WHERE id::text = ${branchId};`);
    if (branchInfo.length > 0) {
      tenantId = branchInfo[0].tenant_id;
    }
  }

  if (!tenantId) {
    const tenantsList: any[] = await db.execute(sql`SELECT id FROM tenants LIMIT 1;`);
    if (tenantsList.length > 0) tenantId = tenantsList[0].id;
  }

  if (!branchId) {
    const branchList: any[] = await db.execute(sql`SELECT id, tenant_id FROM branches WHERE status = 'Active' LIMIT 1;`);
    if (branchList.length > 0) {
      branchId = branchList[0].id;
      if (!tenantId) tenantId = branchList[0].tenant_id;
    }
  }

  const rawHost = data.sftpHost || "";
  const sftpHost = rawHost.trim().replace(/^(sftp:\/\/|ssh:\/\/|https:\/\/)/, "").split("/")[0];
  const sftpPort = data.sftpPort ? Number(data.sftpPort) : 22;
  const sftpUsername = (data.sftpUsername || "").trim();
  const rawPassword = data.sftpPassword && data.sftpPassword !== "••••••••" ? data.sftpPassword.trim() : null;
  const vendorId = (data.vendorId || "").trim();
  const storeVendorId = (data.storeVendorId || "").trim();
  const filenamePrefix = (data.filenamePrefix || "").trim();
  const remoteDirectory = (data.remoteDirectory || "assortment").trim();
  const priceFormat = data.priceFormat || "price_discounted";
  const syncFrequency = data.syncFrequency || "manual";
  const aggregatorName = (data.aggregatorName || "talabat").toLowerCase();
  const isPaused = Boolean(data.isPaused);
  const isActive = Boolean(data.isActive);

  if (data.id) {
    const existing: any[] = await db.execute(sql`SELECT id, sftp_password FROM aggregator_connections WHERE id::text = ${data.id};`);
    if (existing.length > 0) {
      const pwdToSave = rawPassword ? encryptSecret(rawPassword) : existing[0].sftp_password || "";
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
            store_vendor_id = ${storeVendorId},
            filename_prefix = ${filenamePrefix},
            price_format = ${priceFormat},
            sync_frequency = ${syncFrequency},
            is_paused = ${isPaused},
            is_active = ${isActive},
            updated_at = NOW()
        WHERE id::text = ${data.id}
        RETURNING id, tenant_id, branch_id, aggregator_name, sftp_host, sftp_port, sftp_username, vendor_id, store_vendor_id, filename_prefix, price_format, sync_frequency, is_paused, consecutive_failures, is_active, created_at, updated_at;
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
          storeVendorId: saved.store_vendor_id,
          filenamePrefix: saved.filename_prefix,
          priceFormat: saved.price_format,
          syncFrequency: saved.sync_frequency,
          isPaused: saved.is_paused,
          consecutiveFailures: saved.consecutive_failures,
          isActive: saved.is_active,
        },
      };
    }
  }

  const encryptedPassword = rawPassword ? encryptSecret(rawPassword) : "";

  const inserted: any[] = await db.execute(sql`
    INSERT INTO aggregator_connections (
      tenant_id, branch_id, aggregator_name, sftp_host, sftp_port, sftp_username, sftp_password, remote_directory, vendor_id, store_vendor_id, filename_prefix, price_format, sync_frequency, is_paused, consecutive_failures, is_active, created_at, updated_at
    ) VALUES (
      ${tenantId}::uuid, ${branchId}::uuid, ${aggregatorName}, ${sftpHost}, ${sftpPort}, ${sftpUsername}, ${encryptedPassword}, ${remoteDirectory}, ${vendorId}, ${storeVendorId}, ${filenamePrefix}, ${priceFormat}, ${syncFrequency}, ${isPaused}, 0, ${isActive}, NOW(), NOW()
    )
    RETURNING id, tenant_id, branch_id, aggregator_name, sftp_host, sftp_port, sftp_username, vendor_id, store_vendor_id, filename_prefix, price_format, sync_frequency, is_paused, consecutive_failures, is_active, created_at, updated_at;
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
      storeVendorId: saved.store_vendor_id,
      filenamePrefix: saved.filename_prefix,
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

/**
 * Lightweight sync summary for the "Sync Now" confirmation dialog.
 * Uses a fast SELECT COUNT(*) query and connection metadata WITHOUT fetching or transferring full rows.
 */
export async function getSyncSummaryFromDb(connectionId: string, windowStart?: Date | string | null) {
  const t0 = Date.now();
  let conn: any = null;
  const filterDate = windowStart ? (windowStart instanceof Date ? windowStart.toISOString() : String(windowStart)) : null;
  if (connectionId) {
    try {
      const list: any[] = await db.execute(
        sql`
          SELECT c.id, c.tenant_id, c.branch_id, c.vendor_id, c.store_vendor_id, c.filename_prefix, c.price_format, c.aggregator_name, c.remote_directory, b.tenant_id as branch_tenant_id
          FROM aggregator_connections c
          LEFT JOIN branches b ON c.branch_id = b.id
          WHERE c.id::text = ${connectionId}
        `
      );
      if (list && list.length > 0) {
        conn = {
          id: list[0].id,
          tenantId: list[0].tenant_id || list[0].branch_tenant_id,
          branchId: list[0].branch_id,
          vendorId: list[0].vendor_id,
          storeVendorId: list[0].store_vendor_id,
          filenamePrefix: list[0].filename_prefix,
          priceFormat: list[0].price_format,
          aggregatorName: list[0].aggregator_name,
          remoteDirectory: list[0].remote_directory,
        };
      }
    } catch (e) {}
  }

  if (!conn || !conn.tenantId) {
    throw new Error("Unable to load aggregator connection or connection is missing tenant_id.");
  }

  const tenantId = conn.tenantId;
  const branchId = conn.branchId;
  const storeId = (conn.storeVendorId || conn.vendorId || "vendor").trim();
  const prefix = (conn.filenamePrefix || "assortment").trim();
  const fileName = `${prefix}_${storeId}.csv`;
  const remotePath = `${conn.remoteDirectory || "/Assortment"}/${fileName}`;

  // Ultra-fast COUNT query (counts matching products in <100ms without transferring row payloads)
  const countResult: any[] = await db.execute(sql`
    SELECT COUNT(*) as total
    FROM products p
    INNER JOIN stock_levels sl ON p.id = sl.product_id AND sl.branch_id = ${branchId}::uuid
    WHERE p.tenant_id = ${tenantId}::uuid
      AND (
        ${filterDate ? sql`(p.created_at >= ${filterDate}::timestamp OR p.updated_at >= ${filterDate}::timestamp OR sl.updated_at >= ${filterDate}::timestamp)` : sql`TRUE`}
      );
  `);

  const recordCount = Number(countResult[0]?.total || 0);
  // Average CSV row is ~28 bytes + header
  const estimatedSizeBytes = recordCount > 0 ? recordCount * 28 + 120 : 0;
  console.log(`[TIMING SERVER] getSyncSummaryFromDb finished in ${Date.now() - t0}ms: ${recordCount} records, file ${fileName}`);

  return {
    success: true,
    fileName,
    remotePath,
    recordCount,
    estimatedSizeBytes,
    isSummaryOnly: true,
  };
}

export async function generateDirectCsvPreviewFromDb(connectionId: string, windowStart?: Date | string | null) {
  const t_func_start = Date.now();
  console.log(`\n================================================================================`);
  console.log(`[TIMING SERVER] (a) generateDirectCsvPreviewFromDb START at ${new Date(t_func_start).toISOString()} (windowStart: ${windowStart})`);
  console.log(`================================================================================`);

  let conn: any = null;
  const filterDate = windowStart ? (windowStart instanceof Date ? windowStart.toISOString() : String(windowStart)) : null;
  if (connectionId) {
    try {
      const list: any[] = await db.execute(
        sql`
          SELECT c.id, c.tenant_id, c.branch_id, c.vendor_id, c.store_vendor_id, c.filename_prefix, c.price_format, c.aggregator_name, c.remote_directory, b.tenant_id as branch_tenant_id
          FROM aggregator_connections c
          LEFT JOIN branches b ON c.branch_id = b.id
          WHERE c.id::text = ${connectionId}
        `
      );
      if (list && list.length > 0) {
        conn = {
          id: list[0].id,
          tenantId: list[0].tenant_id || list[0].branch_tenant_id,
          branchId: list[0].branch_id,
          vendorId: list[0].vendor_id,
          storeVendorId: list[0].store_vendor_id,
          filenamePrefix: list[0].filename_prefix,
          priceFormat: list[0].price_format,
          aggregatorName: list[0].aggregator_name,
          remoteDirectory: list[0].remote_directory,
        };
      }
    } catch (e) {}
  }

  if (!conn || !conn.tenantId) {
    throw new Error("Unable to load aggregator connection or connection is missing tenant_id.");
  }

  console.log(`[TIMING SERVER] (a.1) Connection loaded: +${Date.now() - t_func_start}ms`);

  const tenantId = conn.tenantId;
  const branchId = conn.branchId;

  const vendorId = (conn.vendorId || "vendor_id").trim();
  const storeVendorId = (conn.storeVendorId || "").trim();
  const filenamePrefix = (conn.filenamePrefix || "").trim();
  const priceFormat = conn.priceFormat || "price_discounted";
  const aggregatorName = conn.aggregatorName || "talabat";

  // 1. Single Lean SQL JOIN via Dedicated Session Mode Client (Port 5432)
  // Prevents transaction pooler (:6543) proxy socket backpressure on large 61,018-row reads
  const rawDbUrl = (process.env["DATABASE_URL"] || process.env["POSTGRES_URL"] || "").trim().replace(/\\$/, "");
  const sessionDbUrl = rawDbUrl.includes(":6543") ? rawDbUrl.replace(":6543", ":5432") : rawDbUrl;

  const sessionClient = postgres(sessionDbUrl, {
    prepare: false,
    ssl: "require",
    max: 1,
    idle_timeout: 5,
    connect_timeout: 30,
  });

  let joinedRows: any[] = [];
  const t_query_start = Date.now();
  try {
    if (filterDate) {
      joinedRows = await sessionClient`
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
      `;
    } else {
      joinedRows = await sessionClient`
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
      `;
    }
  } finally {
    // Always close and release dedicated session client immediately
    try {
      await sessionClient.end({ timeout: 2 });
    } catch (e) {}
  }
  const t_query_end = Date.now();
  console.log(`[TIMING SERVER] (b) DB query completed: +${t_query_end - t_func_start}ms (query duration: ${t_query_end - t_query_start}ms, returned ${joinedRows.length} rows via dedicated port 5432 Session client)`);

  if (!joinedRows || joinedRows.length === 0) {
    if (filterDate) {
      const emptyAdapter = getAdapter(aggregatorName);
      const emptyResult = emptyAdapter.generateFile([], { vendorId, storeVendorId, filenamePrefix, priceFormat });
      return {
        success: true,
        isPreviewOnly: true,
        fileName: emptyResult.fileName,
        remotePath: `${conn?.remoteDirectory || "/Assortment"}/${emptyResult.fileName}`,
        recordCount: 0,
        fileSizeBytes: Buffer.byteLength(emptyResult.fileContent, "utf-8"),
        csvContent: emptyResult.fileContent,
        warning: `No products were created or modified since ${new Date(filterDate).toLocaleString()}.`,
      };
    }
    throw new Error("Unable to load products from database — no products found for this tenant.");
  }

  // 2. Tenant Isolation: Query ONLY promotions belonging to this connection's tenant
  const t_promo_start = Date.now();
  let dbPromotions: any[] = [];
  try {
    dbPromotions = await db
      .select()
      .from(promotions)
      .where(eq(promotions.tenantId, tenantId));
  } catch (err) {}

  const now = new Date();
  const activePromos = dbPromotions.filter((p) => {
    if (!p.status || p.status.toLowerCase() !== "active") return false;
    const start = new Date(p.startDate);
    const end = new Date(p.endDate);
    return now >= start && now <= end;
  });

  const adapterItems: ProductData[] = joinedRows.map((p) => {
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
  console.log(`[TIMING SERVER] (b.1) Promo & mapping done: +${Date.now() - t_func_start}ms (duration: ${Date.now() - t_promo_start}ms)`);

  const t_csv_start = Date.now();
  const adapter = getAdapter(aggregatorName);
  const fileResult = adapter.generateFile(adapterItems, { vendorId, storeVendorId, filenamePrefix, priceFormat });
  const t_csv_end = Date.now();
  console.log(`[TIMING SERVER] (c) CSV string built: +${t_csv_end - t_func_start}ms (generateFile duration: ${t_csv_end - t_csv_start}ms, CSV length: ${fileResult.fileContent.length})`);

  const fileName = fileResult.fileName;
  const csvContent = fileResult.fileContent;
  const recordCount = fileResult.recordCount;

  const t_log_start = Date.now();
  if (connectionId) {
    try {
      await db.execute(
        sql`INSERT INTO aggregator_sync_logs (aggregator_connection_id, sync_type, status, file_name, row_count, created_at) VALUES (${connectionId}::uuid, 'preview', 'preview_only', ${fileName}, ${recordCount}, NOW());`
      );
    } catch (e) {}
  }
  const t_log_end = Date.now();
  console.log(`[TIMING SERVER] (d) Audit log INSERT complete: +${t_log_end - t_func_start}ms (log insert duration: ${t_log_end - t_log_start}ms)`);

  console.log(`[TIMING SERVER] (e) Right before return: +${Date.now() - t_func_start}ms total\n`);

  return {
    success: true,
    isPreviewOnly: true,
    fileName,
    remotePath: `${conn?.remoteDirectory || "/Assortment"}/${fileName}`,
    recordCount,
    fileSizeBytes: Buffer.byteLength(csvContent, "utf-8"),
    csvContent,
    warning: fileResult.warning,
  };
}

export async function triggerAggregatorSyncFromDb(
  connectionId: string,
  preGeneratedPayload?: { fileName: string; csvContent: string; recordCount?: number },
  windowStart?: Date | string | null
) {
  const connList: any[] = await db.execute(sql`SELECT * FROM aggregator_connections WHERE id::text = ${connectionId};`);
  const conn = connList[0];
  if (!conn) return { success: false, error: "Connection configuration not found." };

  const storeId = (conn.store_vendor_id || conn.vendor_id || "vendor").trim();
  const prefix = (conn.filename_prefix || "assortment").trim();
  const defaultFileName = `${prefix}_${storeId}.csv`;

  if (!conn.is_active) {
    await db.execute(sql`
      INSERT INTO aggregator_sync_logs (aggregator_connection_id, sync_type, status, file_name, row_count, error_message, created_at)
      VALUES (${connectionId}::uuid, 'manual', 'failed', ${defaultFileName}, 0, 'Sync disabled: Connection is inactive. Activation is required before live SFTP transmission.', NOW());
    `);
    return { success: false, error: "Sync is disabled until this connection is verified and activated." };
  }

  // 5-Minute Rate Limit Cooldown: Strictly prevents uploads if less than 5 minutes have passed since the last upload
  const FIVE_MINUTES_MS = 5 * 60 * 1000;
  if (conn.last_scheduled_sync_at) {
    const elapsedMs = Date.now() - new Date(conn.last_scheduled_sync_at).getTime();
    if (elapsedMs < FIVE_MINUTES_MS) {
      const remainingSec = Math.ceil((FIVE_MINUTES_MS - elapsedMs) / 1000);
      const remainingMin = (remainingSec / 60).toFixed(1);
      return {
        success: false,
        error: `Rate limit cooldown active: Please wait ${remainingSec}s (~${remainingMin} min) before syncing again. Talabat limits catalog updates to once every 5 minutes.`,
      };
    }
  }

  let fileName = defaultFileName;
  let csvContent: string;
  let recordCount: number;
  let csvPreviewResult: any = null;

  if (preGeneratedPayload?.csvContent) {
    // Reuse pre-generated CSV payload directly
    fileName = preGeneratedPayload.fileName || defaultFileName;
    csvContent = preGeneratedPayload.csvContent;
    recordCount = preGeneratedPayload.recordCount ?? Math.max(0, csvContent.split("\n").length - 1);
  } else {
    // Fallback: Generate fresh from DB (used by background automation scheduler or direct calls)
    try {
      csvPreviewResult = await generateDirectCsvPreviewFromDb(connectionId, windowStart);
    } catch (err: any) {
      await db.execute(sql`
        INSERT INTO aggregator_sync_logs (aggregator_connection_id, sync_type, status, file_name, row_count, error_message, created_at)
        VALUES (${connectionId}::uuid, 'manual', 'failed', ${defaultFileName}, 0, ${"Failed generating CSV payload: " + err.message}, NOW());
      `);
      return { success: false, error: "Failed generating CSV payload: " + err.message };
    }
    fileName = csvPreviewResult.fileName;
    csvContent = csvPreviewResult.csvContent;
    recordCount = csvPreviewResult.recordCount;
  }
  const hostClean = (conn.sftp_host || "").trim().replace(/^(sftp:\/\/|ssh:\/\/|https:\/\/)/, "").split("/")[0];

  try {
    const req = createRequire(import.meta.url);
    const SftpClient = req("ssh2-sftp-client");
    const sftp = new SftpClient();

    const username = (conn.vendor_id || conn.sftp_username || "").trim();
    const rawPassword = (conn.sftp_password || "").trim();
    const password = decryptSecret(rawPassword);

    if (!password) {
      throw new Error("Password decryption returned empty value. Please re-enter the password in Connection Settings.");
    }

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

    console.log(`[SFTP Sync] Uploading to deterministic target path: '${targetPath}'`);
    await sftp.put(fileBuffer, targetPath);

    console.log(`[SFTP Sync] Verifying file presence in directory '${normalizedDir}'...`);
    const dirListing = await sftp.list(normalizedDir);
    const fileExists = dirListing.some((item: any) => item.name === fileName);

    if (!fileExists) {
      console.error(`❌ [SFTP Sync] Post-upload verification FAILED: File '${fileName}' not found in '${normalizedDir}' listing. Found:`, dirListing.map((i: any) => i.name));
      await sftp.end();
      throw new Error(`Post-upload verification failed: File '${fileName}' was not found in directory '${normalizedDir}' after upload.`);
    }

    console.log(`✅ [SFTP Sync] Post-upload verification PASSED: '${fileName}' confirmed present in '${normalizedDir}'!`);
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

    return {
      success: true,
      message: `Successfully uploaded and verified ${fileName} (${recordCount} records) in ${targetPath}`,
      log: preGeneratedPayload || csvPreviewResult,
    };
  } catch (sftpErr: any) {
    const errorMsg = sftpErr.message || "SFTP connection error";
    console.error("❌ SFTP Real Upload Failed:", errorMsg);

    await db.execute(sql`
      INSERT INTO aggregator_sync_logs (aggregator_connection_id, sync_type, status, file_name, row_count, error_message, created_at)
      VALUES (${connectionId}::uuid, 'manual', 'failed', ${fileName}, ${recordCount}, ${errorMsg}, NOW());
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

    return {
      success: false,
      error: `SFTP Transmission Failed: ${errorMsg}${shouldDeactivate ? " (Connection auto-deactivated after 3 failures)" : ""}`,
    };
  }
}

export async function deleteAggregatorSyncLogFromDb(logId: string) {
  await db.execute(sql`DELETE FROM aggregator_sync_logs WHERE id::text = ${logId};`);
  return { success: true };
}

export async function deleteAllAggregatorSyncLogsFromDb(connectionId: string) {
  await db.execute(sql`DELETE FROM aggregator_sync_logs WHERE aggregator_connection_id::text = ${connectionId};`);
  return { success: true };
}

